#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const args = process.argv.slice(2);
const getArg = (name) => {
  const match = args.find((arg) => arg.startsWith(`--${name}=`));
  return match ? match.split('=').slice(1).join('=') : '';
};

const root = process.cwd();
const now = new Date();
const date = now.toISOString().slice(0, 10);

const actor = getArg('actor') || 'Cody Dale Nunn';
const lane = getArg('lane') || 'governance';
const requestId = getArg('request-id') || `cadence-${now.toISOString().replace(/[:.]/g, '-')}`;
const provider = (getArg('provider') || '').trim().toLowerCase();
const filesArg = getArg('files');

const evidenceDir = path.resolve(root, 'docs/governance/evidence');
const ledgerPath = path.resolve(evidenceDir, 'EVIDENCE_LEDGER.jsonl');
fs.mkdirSync(evidenceDir, { recursive: true });

const providerSuffix = {
  aws: 'AWS',
  azure: 'AZURE',
  other: 'OTHER'
}[provider];

const defaultFiles = [
  `docs/governance/EXECUTIVE_PACKET_${date}.md`,
  ...(providerSuffix ? [`docs/governance/SUPPORT_ESCALATION_GATE_${date}_${providerSuffix}.md`] : [])
];

const files = (filesArg
  ? filesArg.split(',').map((value) => value.trim()).filter(Boolean)
  : defaultFiles
);

if (files.length === 0) {
  console.error('❌ No evidence files resolved.');
  process.exit(1);
}

const entries = files.map((relativePath) => {
  const absolutePath = path.resolve(root, relativePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Referenced evidence file does not exist: ${relativePath}`);
  }

  const content = fs.readFileSync(absolutePath);
  const sha256 = crypto.createHash('sha256').update(content).digest('hex');

  return {
    ts: now.toISOString(),
    requestId,
    actor,
    lane,
    provider: provider || null,
    file: relativePath,
    sha256,
    bytes: content.length
  };
});

for (const entry of entries) {
  fs.appendFileSync(ledgerPath, JSON.stringify(entry) + '\n');
}

console.log(`ledger updated: ${ledgerPath}`);
for (const entry of entries) {
  console.log(`- ${entry.file} ${entry.sha256}`);
}
