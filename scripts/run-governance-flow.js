#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

const args = process.argv.slice(2);

function getArg(name) {
  const match = args.find((arg) => arg.startsWith(`--${name}=`));
  return match ? match.split('=').slice(1).join('=') : '';
}

function hasFlag(name) {
  return args.includes(`--${name}`);
}

function fail(message, details = []) {
  console.error(`❌ Governance flow FAILED: ${message}`);
  for (const detail of details) {
    console.error(`   - ${detail}`);
  }
  process.exit(1);
}

function runNodeScript(scriptPath, scriptArgs = []) {
  const result = spawnSync('node', [scriptPath, ...scriptArgs], {
    cwd: root,
    encoding: 'utf8',
    stdio: 'pipe'
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  if (result.status !== 0) {
    fail(`step failed: ${scriptPath}`, scriptArgs);
  }
}

const root = process.cwd();
const utcNow = new Date().toISOString();
const date = getArg('date') || utcNow.slice(0, 10);
const provider = (getArg('provider') || '').trim().toLowerCase();
const reason = (getArg('reason') || '').trim();
const actor = getArg('actor') || 'Cody Dale Nunn';
const lane = getArg('lane') || 'governance';
const requestId = getArg('request-id') || `cadence-${utcNow.replace(/[:.]/g, '-')}`;
const skipPreEscalation = hasFlag('skip-pre-escalation');
const skipLedger = hasFlag('skip-ledger');

const packetPath = path.resolve(root, `docs/governance/EXECUTIVE_PACKET_${date}.md`);
const gateDocPath = path.resolve(root, `docs/governance/SUPPORT_ESCALATION_GATE_${date}.md`);

console.log(`▶ Running governance flow for ${date}`);
console.log(`   requestId: ${requestId}`);
console.log(`   actor:     ${actor}`);
console.log(`   lane:      ${lane}`);

runNodeScript('scripts/orchestrate-executive-template.js');
runNodeScript('scripts/enforce-executive-packet-gate.js', [`--date=${date}`]);

const ledgerFiles = [path.relative(root, packetPath)];

if (!skipPreEscalation) {
  if (!provider || !reason) {
    fail('pre-escalation requires provider and reason', [
      'use --provider=aws|azure|other',
      'use --reason="..."',
      'or pass --skip-pre-escalation'
    ]);
  }

  runNodeScript('scripts/enforce-pre-escalation-gate.js', [
    `--date=${date}`,
    `--provider=${provider}`,
    `--reason=${reason}`
  ]);

  if (fs.existsSync(gateDocPath)) {
    ledgerFiles.push(path.relative(root, gateDocPath));
  }
}

if (!skipLedger) {
  runNodeScript('scripts/record-evidence-ledger.js', [
    `--actor=${actor}`,
    `--lane=${lane}`,
    `--request-id=${requestId}`,
    `--files=${ledgerFiles.join(',')}`
  ]);
}

console.log('✅ Governance flow PASSED');
console.log(`   packet: ${packetPath}`);
if (!skipPreEscalation) {
  console.log(`   gate:   ${gateDocPath}`);
}
