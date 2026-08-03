#!/usr/bin/env node
// scripts/sentinel-doctor.js
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// Purpose: Emit a structured environment fingerprint before any testing or
// deployment.  Identifies which runtime the process is executing in, validates
// that required secrets are present and readable, checks clone depth, and
// cross-references against the matching environment manifest so mismatches are
// surfaced immediately rather than discovered mid-investigation.
//
// Usage:
//   node scripts/sentinel-doctor.js
//   npm run doctor
//
// Output: human-readable summary + JSON record written to
//   runtime/evidence/sentinel-doctor-<timestamp>.json

'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const http = require('http');
const https = require('https');
const os = require('os');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');
const EVIDENCE_DIR = path.join(REPO_ROOT, 'runtime', 'evidence');
const ENVIRONMENTS_DIR = path.join(REPO_ROOT, 'configs', 'environments');
const QUIRKS_PATH = path.join(REPO_ROOT, 'configs', 'platform-quirks.json');

// ── helpers ──────────────────────────────────────────────────────────────────

function run(cmd) {
  try {
    return execSync(cmd, { cwd: REPO_ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (_) {
    return null;
  }
}

function fileExists(p) {
  try { fs.accessSync(p); return true; } catch (_) { return false; }
}

function readableAndNonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

// ── git identity ──────────────────────────────────────────────────────────────

function getGitIdentity() {
  const repo = run('git remote get-url origin') || 'unknown';
  const branch = run('git rev-parse --abbrev-ref HEAD') || 'unknown';
  const commit = run('git rev-parse HEAD') || 'unknown';
  const shortCommit = commit !== 'unknown' ? commit.slice(0, 7) : 'unknown';
  const shallowRaw = run('git rev-parse --is-shallow-repository');
  const isShallow = shallowRaw === 'true';
  const uncommittedChanges = (() => {
    const diff = run('git status --porcelain');
    return diff !== null ? diff.split('\n').filter(Boolean).length : null;
  })();

  return { repo, branch, commit, shortCommit, isShallow, uncommittedChanges };
}

// ── runtime detection ────────────────────────────────────────────────────────

function detectRuntime() {
  const runtimes = [];

  if (process.env.GITHUB_ACTIONS === 'true') {
    runtimes.push('GitHub Actions');
  }

  if (process.env.CONTAINER_APP_NAME || process.env.AZURE_CLIENT_ID || process.env.AZURE_SUBSCRIPTION_ID) {
    runtimes.push('Azure Container Apps');
  }

  if (fileExists('/.dockerenv')) {
    runtimes.push('Docker');
  }

  const wsl2 = (() => {
    try {
      const v = fs.readFileSync('/proc/version', 'utf8').toLowerCase();
      return v.includes('microsoft') || v.includes('wsl');
    } catch (_) { return false; }
  })();
  if (wsl2) runtimes.push('WSL2');

  if (runtimes.length === 0) runtimes.push('local');

  return runtimes;
}

// ── secrets check ────────────────────────────────────────────────────────────

const KNOWN_SECRETS = [
  { name: 'SENTINEL_HMAC_SECRET', required: true },
  { name: 'SENTINEL_API_KEY', required: false },
  { name: 'DATABASE_URL', required: false },
  { name: 'SENTINEL_DEPLOYMENT_TIER', required: false },
];

function checkSecrets(manifestSecrets) {
  const definitions = manifestSecrets || KNOWN_SECRETS;
  return definitions.map(({ name, required }) => {
    const value = process.env[name];
    const present = value !== undefined;
    const readable = readableAndNonEmpty(value);
    let status = 'ok';
    if (!readable) {
      status = required ? 'missing' : 'absent';
    }
    return { name, required, present, readable, status };
  });
}

// ── health probe ─────────────────────────────────────────────────────────────

function probeHealth(url, timeoutMs) {
  return new Promise((resolve) => {
    const client = url.startsWith('https://') ? https : http;
    const timeout = timeoutMs || 4000;
    const req = client.get(url, { timeout }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(body); } catch (_) { /* ignore */ }
        resolve({ reachable: true, statusCode: res.statusCode, body: parsed || body });
      });
    });
    req.on('timeout', () => { req.destroy(); resolve({ reachable: false, error: 'timeout' }); });
    req.on('error', (err) => { resolve({ reachable: false, error: err.message }); });
  });
}

// ── manifest loading ─────────────────────────────────────────────────────────

function loadManifest(envName) {
  const filePath = path.join(ENVIRONMENTS_DIR, `${envName}.json`);
  if (!fileExists(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_) {
    return null;
  }
}

function detectEnvironmentName(runtimes) {
  if (process.env.SENTINEL_ENV) return process.env.SENTINEL_ENV;
  if (runtimes.includes('GitHub Actions')) return 'github-actions';
  if (runtimes.includes('Azure Container Apps')) return 'azure-prod';
  return 'local-dev';
}

// ── platform quirks ──────────────────────────────────────────────────────────

function loadQuirks() {
  if (!fileExists(QUIRKS_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(QUIRKS_PATH, 'utf8'));
  } catch (_) {
    return [];
  }
}

function getApplicableQuirks(quirks, runtimes, manifestQuirkIds) {
  const ids = manifestQuirkIds || [];
  return quirks.filter((q) => {
    if (ids.includes(q.id)) return true;
    if (runtimes.some((r) => q.platform && q.platform.toLowerCase().includes(r.toLowerCase()))) return true;
    return false;
  });
}

// ── manifest validation ──────────────────────────────────────────────────────

function validateAgainstManifest(manifest, runtimes, secrets, git) {
  if (!manifest) return [];
  const mismatches = [];

  // runtime checks
  const r = manifest.runtime || {};
  if (r.githubActions === true && !runtimes.includes('GitHub Actions')) {
    mismatches.push({ field: 'runtime.githubActions', expected: true, actual: false });
  }
  if (r.githubActions === false && runtimes.includes('GitHub Actions')) {
    mismatches.push({ field: 'runtime.githubActions', expected: false, actual: true });
  }
  if (r.azure === true && !runtimes.includes('Azure Container Apps')) {
    mismatches.push({ field: 'runtime.azure', expected: true, actual: false });
  }
  if (r.azure === false && runtimes.includes('Azure Container Apps')) {
    mismatches.push({ field: 'runtime.azure', expected: false, actual: true });
  }
  if (r.wsl2 === true && !runtimes.includes('WSL2')) {
    mismatches.push({ field: 'runtime.wsl2', expected: true, actual: false });
  }

  // shallow clone check
  if (manifest.clone && manifest.clone.shallowAllowed === false && git.isShallow) {
    mismatches.push({ field: 'clone.isShallow', expected: false, actual: true, severity: 'warning' });
  }

  // required secret checks
  const requiredByManifest = (manifest.secrets || []).filter((s) => s.required).map((s) => s.name);
  requiredByManifest.forEach((name) => {
    const found = secrets.find((s) => s.name === name);
    if (!found || !found.readable) {
      mismatches.push({ field: `secret.${name}`, expected: 'present+readable', actual: found ? 'present-but-empty' : 'missing' });
    }
  });

  return mismatches;
}

// ── operational confidence ───────────────────────────────────────────────────
//
// Confidence is a 0–100 score computed from weighted checks.  Each check
// contributes a maximum number of points; the final score is the ratio of
// earned points to total possible points, expressed as a percentage.
//
// Weight table (tune as the Operations Module matures):
//
//   Required secrets readable        30 pts   (critical path)
//   Health endpoint reachable         25 pts   (API up)
//   Health status = healthy           10 pts   (not degraded)
//   No manifest mismatches (errors)   20 pts   (env declared correctly)
//   No manifest mismatches (warnings)  5 pts   (minor drift)
//   Full clone (not shallow)           5 pts   (history available)
//   No uncommitted changes             5 pts   (workspace clean)
//
// Total possible: 100 pts

const CONFIDENCE_WEIGHTS = {
  requiredSecretsReadable: 30,
  healthReachable: 25,
  healthStatusOk: 10,
  noManifestErrors: 20,
  noManifestWarnings: 5,
  fullClone: 5,
  cleanWorkspace: 5,
};

function computeConfidence(report) {
  let earned = 0;
  const breakdown = {};

  // required secrets
  const missingRequired = report.secrets.filter((s) => s.required && !s.readable);
  const secretScore = missingRequired.length === 0 ? CONFIDENCE_WEIGHTS.requiredSecretsReadable : 0;
  earned += secretScore;
  breakdown.requiredSecretsReadable = { score: secretScore, max: CONFIDENCE_WEIGHTS.requiredSecretsReadable, detail: missingRequired.length === 0 ? 'all present' : `${missingRequired.length} missing` };

  // health reachable
  const reachableScore = report.health.reachable ? CONFIDENCE_WEIGHTS.healthReachable : 0;
  earned += reachableScore;
  breakdown.healthReachable = { score: reachableScore, max: CONFIDENCE_WEIGHTS.healthReachable, detail: report.health.reachable ? 'reachable' : `unreachable (${report.health.error})` };

  // health status ok
  const statusValue = report.health.body && report.health.body.status;
  const healthOk = report.health.reachable && report.health.statusCode === 200 && statusValue !== 'degraded' && statusValue !== 'unhealthy';
  const healthScore = healthOk ? CONFIDENCE_WEIGHTS.healthStatusOk : 0;
  earned += healthScore;
  breakdown.healthStatusOk = { score: healthScore, max: CONFIDENCE_WEIGHTS.healthStatusOk, detail: healthOk ? 'healthy' : (statusValue || 'not ok') };

  // no manifest errors
  const errorMismatches = report.manifestMismatches.filter((m) => !m.severity || m.severity === 'error');
  const noErrorScore = errorMismatches.length === 0 ? CONFIDENCE_WEIGHTS.noManifestErrors : 0;
  earned += noErrorScore;
  breakdown.noManifestErrors = { score: noErrorScore, max: CONFIDENCE_WEIGHTS.noManifestErrors, detail: errorMismatches.length === 0 ? 'none' : `${errorMismatches.length} mismatch(es)` };

  // no manifest warnings
  const warnMismatches = report.manifestMismatches.filter((m) => m.severity === 'warning');
  const noWarnScore = warnMismatches.length === 0 ? CONFIDENCE_WEIGHTS.noManifestWarnings : 0;
  earned += noWarnScore;
  breakdown.noManifestWarnings = { score: noWarnScore, max: CONFIDENCE_WEIGHTS.noManifestWarnings, detail: warnMismatches.length === 0 ? 'none' : `${warnMismatches.length} warning(s)` };

  // full clone
  const cloneScore = !report.git.isShallow ? CONFIDENCE_WEIGHTS.fullClone : 0;
  earned += cloneScore;
  breakdown.fullClone = { score: cloneScore, max: CONFIDENCE_WEIGHTS.fullClone, detail: report.git.isShallow ? 'shallow' : 'full' };

  // clean workspace
  const cleanScore = (report.git.uncommittedChanges === 0 || report.git.uncommittedChanges === null) ? CONFIDENCE_WEIGHTS.cleanWorkspace : 0;
  earned += cleanScore;
  breakdown.cleanWorkspace = { score: cleanScore, max: CONFIDENCE_WEIGHTS.cleanWorkspace, detail: report.git.uncommittedChanges === 0 ? 'clean' : `${report.git.uncommittedChanges} file(s)` };

  const total = Object.values(CONFIDENCE_WEIGHTS).reduce((a, b) => a + b, 0);
  const pct = Math.round((earned / total) * 1000) / 10;

  return { score: pct, earned, total, breakdown };
}

// ── output helpers ───────────────────────────────────────────────────────────

function label(text) {
  return `\x1b[1m${text}\x1b[0m`;
}

function ok(text) {
  return `\x1b[32m✓\x1b[0m  ${text}`;
}

function warn(text) {
  return `\x1b[33m⚠\x1b[0m  ${text}`;
}

function fail(text) {
  return `\x1b[31m✗\x1b[0m  ${text}`;
}

function printSummary(report) {
  console.log('');
  console.log(label('─── Sentinel Doctor ───────────────────────────────────────'));
  console.log('');

  // repository
  console.log(label('Repository'));
  console.log(`    Name    : ${report.git.repo}`);
  console.log(`    Branch  : ${report.git.branch}`);
  console.log(`    Commit  : ${report.git.shortCommit}`);
  if (report.git.uncommittedChanges !== null) {
    console.log(`    Dirty   : ${report.git.uncommittedChanges > 0 ? report.git.uncommittedChanges + ' uncommitted file(s)' : 'clean'}`);
  }
  if (report.git.isShallow) {
    console.log(warn('Shallow clone — full history unavailable (run: git fetch --unshallow origin)'));
  } else {
    console.log(ok('Full clone'));
  }
  console.log('');

  // runtime
  console.log(label('Runtime'));
  report.runtimes.forEach((r) => console.log(`    ${ok(r)}`));
  console.log('');

  // environment manifest
  console.log(label('Environment Manifest'));
  if (report.manifest) {
    console.log(ok(`Loaded: ${report.environmentName} (${report.manifest.description})`));
  } else {
    console.log(warn(`No manifest found for "${report.environmentName}" in configs/environments/`));
  }
  console.log('');

  // mismatches
  if (report.manifestMismatches.length > 0) {
    console.log(label('Manifest Mismatches'));
    report.manifestMismatches.forEach((m) => {
      const fn = m.severity === 'warning' ? warn : fail;
      console.log(fn(`${m.field}: expected ${JSON.stringify(m.expected)}, got ${JSON.stringify(m.actual)}`));
    });
    console.log('');
  }

  // secrets
  console.log(label('Secrets'));
  report.secrets.forEach((s) => {
    if (s.status === 'ok') {
      console.log(ok(`${s.name}`));
    } else if (s.status === 'absent') {
      console.log(warn(`${s.name} — not set (optional)`));
    } else {
      console.log(fail(`${s.name} — MISSING (required)`));
    }
  });
  console.log('');

  // health
  console.log(label('Health Probe'));
  const h = report.health;
  if (h.reachable) {
    const statusOk = h.statusCode === 200;
    const fn = statusOk ? ok : warn;
    const bodyStatus = h.body && h.body.status ? ` (status: ${h.body.status})` : '';
    console.log(fn(`${report.healthUrl} → HTTP ${h.statusCode}${bodyStatus}`));
  } else {
    console.log(warn(`${report.healthUrl} — unreachable (${h.error}) — API may not be running`));
  }
  console.log('');

  // known quirks
  if (report.applicableQuirks.length > 0) {
    console.log(label('Known Platform Quirks (applicable to this environment)'));
    report.applicableQuirks.forEach((q) => {
      console.log(warn(`[${q.id}] ${q.platform}: ${q.description}`));
    });
    console.log('');
  }

  // operational confidence
  const conf = report.operationalConfidence;
  if (conf) {
    const bar = (() => {
      const filled = Math.round(conf.score / 5);
      return '█'.repeat(filled) + '░'.repeat(20 - filled);
    })();
    const confColor = conf.score >= 90 ? '\x1b[32m' : conf.score >= 70 ? '\x1b[33m' : '\x1b[31m';
    console.log(label('Operational Confidence'));
    console.log(`    ${confColor}${bar}\x1b[0m  ${confColor}${conf.score}%\x1b[0m  (${conf.earned}/${conf.total} pts)`);
    console.log('');
  }

  // overall
  console.log(label('Overall'));
  const hasCritical = report.manifestMismatches.some((m) => !m.severity || m.severity === 'error') ||
    report.secrets.some((s) => s.status === 'missing');
  if (hasCritical) {
    console.log(fail('One or more critical issues detected — review the findings above'));
  } else {
    console.log(ok('Environment looks consistent'));
  }
  console.log('');
  console.log(`    Evidence written to: ${report.evidencePath}`);
  console.log('');
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  const git = getGitIdentity();
  const runtimes = detectRuntime();
  const environmentName = detectEnvironmentName(runtimes);
  const manifest = loadManifest(environmentName);
  const secrets = checkSecrets(manifest ? manifest.secrets : null);
  const healthUrl = (manifest && manifest.expectedHealth && manifest.expectedHealth.endpoint) ||
    `http://localhost:${process.env.PORT || 3000}/health`;
  const health = await probeHealth(healthUrl, 4000);
  const quirks = loadQuirks();
  const applicableQuirks = getApplicableQuirks(quirks, runtimes, manifest ? manifest.knownQuirks : []);
  const manifestMismatches = validateAgainstManifest(manifest, runtimes, secrets, git);

  const report = {
    sentinel: 'doctor',
    timestamp: new Date().toISOString(),
    git,
    runtimes,
    environmentName,
    manifest: manifest || null,
    secrets,
    healthUrl,
    health,
    quirks,
    applicableQuirks,
    manifestMismatches,
    operationalConfidence: null,
    evidencePath: null,
  };

  report.operationalConfidence = computeConfidence(report);

  // write evidence
  try {
    if (!fs.existsSync(EVIDENCE_DIR)) {
      fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
    }
    const evidenceFile = path.join(EVIDENCE_DIR, `sentinel-doctor-${Date.now()}.json`);
    fs.writeFileSync(evidenceFile, JSON.stringify(report, null, 2), 'utf8');
    report.evidencePath = path.relative(REPO_ROOT, evidenceFile);
  } catch (err) {
    report.evidencePath = `(write failed: ${err.message})`;
  }

  printSummary(report);

  const hasCritical = report.manifestMismatches.some((m) => !m.severity || m.severity === 'error') ||
    report.secrets.some((s) => s.status === 'missing');
  process.exit(hasCritical ? 1 : 0);
}

main().catch((err) => {
  console.error('sentinel-doctor fatal error:', err);
  process.exit(1);
});
