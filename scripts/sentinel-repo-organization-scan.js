const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Approval boundary: read/report-only. This script must not move, delete, archive,
// merge, or rewrite repository files. It only writes scan evidence and reports.
const ROOT = path.resolve(__dirname, '..');
const RUN_DATE = new Date().toISOString().slice(0, 10);
const REPORT_PATH = path.join(ROOT, 'docs', `SENTINEL_REPO_ORGANIZATION_REPORT_${RUN_DATE}.md`);
const LOG_PATH = path.join(ROOT, 'docs', `sentinel-repo-organization-log-${RUN_DATE}.jsonl`);

const SKIP_DIRS = new Set([
  '.git',
  'node_modules',
  '.next',
  'dist',
  'build',
  'coverage'
]);

const TEXT_EXTENSIONS = new Set([
  '.cjs',
  '.css',
  '.html',
  '.js',
  '.json',
  '.md',
  '.mjs',
  '.sh',
  '.sql',
  '.ts',
  '.tsx',
  '.txt',
  '.yaml',
  '.yml'
]);

function toRepoPath(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join('/');
}

function runGit(args) {
  try {
    return execSync(`git ${args}`, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
  } catch (_) {
    return '';
  }
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

function getStatusMap() {
  const map = new Map();
  let porcelain = '';

  try {
    porcelain = execSync('git status --porcelain', {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    });
  } catch (_) {
    porcelain = '';
  }

  if (!porcelain.trim()) {
    return map;
  }

  for (const line of porcelain.split('\n').filter(Boolean)) {
    const status = line.slice(0, 2);
    const rawPath = line.slice(3).trim();
    const filePath = rawPath.includes(' -> ') ? rawPath.split(' -> ').pop() : rawPath;
    map.set(filePath, status);
  }

  return map;
}

function getTrackedSet() {
  const tracked = runGit('ls-files');
  return new Set(tracked ? tracked.split('\n') : []);
}

function isTextFile(filePath) {
  return TEXT_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function readText(filePath) {
  const stats = fs.statSync(filePath);

  if (!isTextFile(filePath) || stats.size > 1024 * 1024) {
    return '';
  }

  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (_) {
    return '';
  }
}

function normalizeName(file) {
  const parsed = path.parse(file);
  return parsed.name
    .toLowerCase()
    .replace(/\b20\d{2}[-_]?\d{2}[-_]?\d{2}\b/g, 'date')
    .replace(/\bv?\d+(\.\d+){0,3}\b/g, 'version')
    .replace(/[_-]+/g, ' ')
    .replace(/\b(check|scan|simulate|write|script|report|draft|layout|v|version)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim() || parsed.name.toLowerCase();
}

function tokens(value) {
  return new Set(String(value).toLowerCase().match(/[a-z0-9]+/g) || []);
}

function jaccard(a, b) {
  if (!a.size || !b.size) {
    return 0;
  }

  let intersection = 0;
  for (const value of a) {
    if (b.has(value)) {
      intersection += 1;
    }
  }

  return intersection / (a.size + b.size - intersection);
}

function fileHash(filePath) {
  const data = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(data).digest('hex');
}

function summarizeStatus(status) {
  if (!status) return 'tracked_clean';
  if (status === '??') return 'untracked';
  if (status.includes('M')) return 'modified';
  if (status.includes('A')) return 'added';
  if (status.includes('D')) return 'deleted';
  return status.trim() || 'changed';
}

function buildReferenceIndex(files) {
  const textByPath = new Map();

  for (const file of files) {
    if (
      file.repoPath.startsWith('docs/SENTINEL_REPO_ORGANIZATION_REPORT_') ||
      file.repoPath.startsWith('docs/sentinel-repo-organization-log-')
    ) {
      continue;
    }

    const text = readText(file.absolutePath);
    if (text) {
      textByPath.set(file.repoPath, text);
    }
  }

  for (const file of files) {
    const base = path.basename(file.repoPath, path.extname(file.repoPath));
    const searchTerms = new Set([
      file.repoPath,
      `/${base}`,
      `${base}.`,
      base
    ]);

    let references = 0;
    for (const [candidatePath, text] of textByPath.entries()) {
      if (candidatePath === file.repoPath) {
        continue;
      }

      for (const term of searchTerms) {
        if (term.length > 3 && text.includes(term)) {
          references += 1;
          break;
        }
      }
    }

    file.referenceCount = references;
  }
}

function markPackageScriptReferences(files) {
  const packagePath = path.join(ROOT, 'package.json');
  const packageText = fs.existsSync(packagePath) ? readText(packagePath) : '';

  for (const file of files) {
    file.packageScriptReferenced = false;

    if (!file.repoPath.startsWith('scripts/')) {
      continue;
    }

    file.packageScriptReferenced = packageText.includes(file.repoPath) || packageText.includes(path.basename(file.repoPath));
  }
}

function classifyFile(file, groupsForFile) {
  const groupKinds = new Set(groupsForFile.map((group) => group.kind));
  const isChanged = file.status !== 'tracked_clean';
  const isUntracked = file.status === 'untracked';
  const isDoc = file.repoPath.startsWith('docs/');
  const isScript = file.repoPath.startsWith('scripts/');
  const isRuntime = file.repoPath.startsWith('apps/sentinel/src/') || file.repoPath === 'apps/api/server.js';
  const isPublicUi = file.repoPath.startsWith('apps/api/public/');
  const isGeneratedAsset = /\.(pdf|png|jpg|jpeg)$/i.test(file.repoPath);

  if (groupKinds.has('exact_content')) {
    return {
      bucket: 'streamline_candidate',
      decision: 'needs_approval',
      reason: 'Exact content duplicate detected. Keep one canonical artifact and archive or remove the copy after approval.'
    };
  }

  if (isRuntime && file.referenceCount > 0) {
    return {
      bucket: 'use',
      decision: 'keep',
      reason: 'Runtime source is referenced by active server, command, governance, or check surfaces.'
    };
  }

  if (isPublicUi && (file.referenceCount > 0 || file.repoPath.endsWith('proof.html'))) {
    return {
      bucket: 'use',
      decision: 'keep',
      reason: 'Public/operator surface is served or linked by the API.'
    };
  }

  if (isScript && file.packageScriptReferenced) {
    return {
      bucket: 'use',
      decision: 'keep',
      reason: 'Script is referenced by package scripts or repo checks.'
    };
  }

  if (isScript && isUntracked) {
    return {
      bucket: 'needs_decision',
      decision: 'review',
      reason: 'New check/simulation script should be approved into the operator toolkit or archived.'
    };
  }

  if (isDoc && groupKinds.has('similar_name')) {
    return {
      bucket: 'needs_decision',
      decision: 'review',
      reason: 'Document overlaps another repo artifact by name. Decide whether it is canonical, supporting, or obsolete.'
    };
  }

  if (isGeneratedAsset) {
    return {
      bucket: 'needs_decision',
      decision: 'review',
      reason: 'Generated/presentation asset should be tied to a canonical source document or marked external-deliverable.'
    };
  }

  if (isChanged) {
    return {
      bucket: 'needs_decision',
      decision: 'review',
      reason: 'Changed file needs owner approval before optimize/streamline action.'
    };
  }

  return {
    bucket: 'use',
    decision: 'keep',
    reason: 'No duplicate or orphan signal found in this scan.'
  };
}

function makeGroups(files) {
  const groups = [];
  const byHash = new Map();
  const byName = new Map();

  for (const file of files) {
    const stats = fs.statSync(file.absolutePath);
    file.size = stats.size;
    file.hash = fileHash(file.absolutePath);
    file.normalizedName = normalizeName(file.repoPath);
    file.nameTokens = tokens(file.normalizedName);
    file.contentTokens = tokens(readText(file.absolutePath)).size
      ? tokens(readText(file.absolutePath))
      : new Set();

    if (!byHash.has(file.hash)) byHash.set(file.hash, []);
    byHash.get(file.hash).push(file);

    const nameKey = `${path.extname(file.repoPath).toLowerCase()}:${file.normalizedName}`;
    if (!byName.has(nameKey)) byName.set(nameKey, []);
    byName.get(nameKey).push(file);
  }

  for (const [hash, members] of byHash.entries()) {
    if (members.length > 1) {
      groups.push({
        id: `exact_content_${groups.length + 1}`,
        kind: 'exact_content',
        score: 1,
        summary: 'Exact byte-for-byte duplicate content.',
        files: members.map((file) => file.repoPath),
        hash
      });
    }
  }

  for (const [, members] of byName.entries()) {
    if (members.length > 1) {
      groups.push({
        id: `similar_name_${groups.length + 1}`,
        kind: 'similar_name',
        score: 0.85,
        summary: 'Similar normalized filename or artifact purpose.',
        files: members.map((file) => file.repoPath)
      });
    }
  }

  const docs = files.filter((file) => file.repoPath.startsWith('docs/') && file.contentTokens.size >= 40);
  for (let i = 0; i < docs.length; i += 1) {
    for (let j = i + 1; j < docs.length; j += 1) {
      const score = jaccard(docs[i].contentTokens, docs[j].contentTokens);

      if (score >= 0.32) {
        groups.push({
          id: `similar_content_${groups.length + 1}`,
          kind: 'similar_content',
          score: Number(score.toFixed(3)),
          summary: 'Document content overlap above Sentinel review threshold.',
          files: [docs[i].repoPath, docs[j].repoPath]
        });
      }
    }
  }

  return groups;
}

function findGroupsForFile(groups, repoPath) {
  return groups.filter((group) => group.files.includes(repoPath));
}

function formatTable(rows) {
  if (!rows.length) {
    return 'No entries.';
  }

  return [
    '| Bucket | Decision | File | Status | References | Reason |',
    '| --- | --- | --- | --- | ---: | --- |',
    ...rows.map((row) => `| ${row.bucket} | ${row.decision} | \`${row.repoPath}\` | ${row.status} | ${row.referenceCount} | ${row.reason.replace(/\|/g, '/')} |`)
  ].join('\n');
}

function writeOutputs(files, groups) {
  const changed = files.filter((file) => file.status !== 'tracked_clean');
  const classified = files.map((file) => ({
    ...file,
    ...classifyFile(file, findGroupsForFile(groups, file.repoPath))
  }));
  const actionable = classified
    .filter((file) => file.status !== 'tracked_clean' || file.bucket !== 'use')
    .sort((a, b) => {
      const order = { streamline_candidate: 0, needs_decision: 1, use: 2 };
      return (order[a.bucket] - order[b.bucket]) || a.repoPath.localeCompare(b.repoPath);
    });
  const counts = classified.reduce((acc, file) => {
    acc[file.bucket] = (acc[file.bucket] || 0) + 1;
    return acc;
  }, {});

  const logLines = [];
  const pushLog = (event) => {
    logLines.push(JSON.stringify({
      source: 'sentinel-repo-organization-scan',
      timestamp: new Date().toISOString(),
      ...event
    }));
  };

  for (const group of groups) {
    pushLog({
      eventType: 'repository.similarity.group_detected',
      group
    });
  }

  for (const file of changed) {
    pushLog({
      eventType: 'repository.worktree_change.logged',
      file: {
        path: file.repoPath,
        status: file.status,
        referenceCount: file.referenceCount
      }
    });
  }

  for (const file of actionable) {
    pushLog({
      eventType: 'repository.file.classified',
      file: {
        path: file.repoPath,
        status: file.status,
        bucket: file.bucket,
        decision: file.decision,
        reason: file.reason,
        referenceCount: file.referenceCount
      }
    });
  }

  fs.writeFileSync(LOG_PATH, `${logLines.join('\n')}\n`);

  const report = [
    `# Sentinel Repository Organization Report - ${RUN_DATE}`,
    '',
    '## Operator Summary',
    '',
    'Sentinel scanned the repository for changed files, untracked files, exact duplicates, similar names, and overlapping document content. No files were deleted or moved. This report is an approval gate for optimization and streamlining.',
    '',
    `- Files scanned: ${files.length}`,
    `- Changed or untracked files: ${changed.length}`,
    `- Similarity groups detected: ${groups.length}`,
    `- Use: ${counts.use || 0}`,
    `- Needs decision: ${counts.needs_decision || 0}`,
    `- Streamline candidates: ${counts.streamline_candidate || 0}`,
    `- Sentinel log: \`${toRepoPath(LOG_PATH)}\``,
    '',
    '## Sentinel Recommendation',
    '',
    'Do not approve a broad cleanup yet. Approve a narrow streamlining pass only after the owner confirms which new governance/docs/scripts are intended to become canonical. The safest next action is to keep runtime surfaces, keep referenced governance modules, and review new scripts/docs in grouped batches.',
    '',
    '## Proposed Approval Batches',
    '',
    '1. **Keep / use**: referenced runtime code, served public pages, and scripts already wired into package checks.',
    '2. **Review for canonical status**: new governance doctrine, vendor onboarding docs, Arizona SPO layout assets, and new check scripts.',
    '3. **Streamline only after approval**: exact duplicates or overlapping documents where one file clearly becomes the canonical source.',
    '',
    '## Changed Worktree Snapshot',
    '',
    formatTable(changed
      .map((file) => ({
        ...file,
        bucket: 'logged',
        decision: 'review',
        reason: 'Worktree change logged before any optimization or streamlining decision.'
      }))
      .sort((a, b) => a.repoPath.localeCompare(b.repoPath))),
    '',
    '## Actionable File Classification',
    '',
    formatTable(actionable),
    '',
    '## Similarity Groups',
    '',
    groups.length
      ? groups.map((group) => [
        `### ${group.id}`,
        '',
        `- Kind: ${group.kind}`,
        `- Score: ${group.score}`,
        `- Summary: ${group.summary}`,
        ...group.files.map((file) => `- \`${file}\``)
      ].join('\n')).join('\n\n')
      : 'No duplicate or similar file groups crossed Sentinel thresholds.',
    '',
    '## Optimization Plan Before Approval',
    '',
    '- Preserve `apps/api/public/proof.html` as active demo/XE proof surface.',
    '- Treat new governance core and vendor onboarding modules as likely-use if their paired checks remain in `package.json`.',
    '- Tie each generated PDF to its Markdown source or mark it as a deliverable artifact.',
    '- Convert approved review docs into a short index so operators know which document is canonical for each lane.',
    '- Archive or remove only after a human approval decision is recorded.',
    '',
    '## Approval State',
    '',
    'Pending human review. Sentinel recommends **hold cleanup**, **approve classification**, and **approve only targeted streamlining after review**.',
    ''
  ].join('\n');

  fs.writeFileSync(REPORT_PATH, report);

  return {
    reportPath: toRepoPath(REPORT_PATH),
    logPath: toRepoPath(LOG_PATH),
    filesScanned: files.length,
    changedFiles: changed.length,
    groupsDetected: groups.length,
    counts
  };
}

function main() {
  const statusMap = getStatusMap();
  const trackedSet = getTrackedSet();
  const files = walk(ROOT)
    .map((absolutePath) => {
      const repoPath = toRepoPath(absolutePath);
      return {
        absolutePath,
        repoPath,
        status: summarizeStatus(statusMap.get(repoPath)),
        tracked: trackedSet.has(repoPath)
      };
    })
    .filter((file) => !file.repoPath.startsWith('docs/sentinel-repo-organization-log-'));

  buildReferenceIndex(files);
  markPackageScriptReferences(files);
  const groups = makeGroups(files);
  const result = writeOutputs(files, groups);
  console.log(JSON.stringify(result, null, 2));
}

main();
