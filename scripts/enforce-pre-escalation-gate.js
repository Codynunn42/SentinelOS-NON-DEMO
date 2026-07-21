#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const args = process.argv.slice(2);

function getArg(name) {
  const match = args.find((arg) => arg.startsWith(`--${name}=`));
  return match ? match.split('=').slice(1).join('=') : '';
}

function fail(message, details = []) {
  console.error(`❌ Pre-escalation gate FAILED: ${message}`);
  for (const detail of details) {
    console.error(`   - ${detail}`);
  }
  process.exit(1);
}

function sanitizeValue(value) {
  return String(value || '')
    .trim()
    .replace(/^`(.+)`$/, '$1')
    .replace(/^"(.+)"$/, '$1');
}

function extractBulletValue(content, label) {
  const lines = content.split(/\r?\n/);
  const prefix = `- ${label}:`;
  const line = lines.find((entry) => entry.trim().startsWith(prefix));
  if (!line) return '';
  return sanitizeValue(line.trim().slice(prefix.length).trim());
}

const root = process.cwd();
const utcDate = new Date().toISOString().slice(0, 10);
const date = getArg('date') || utcDate;
const provider = (getArg('provider') || '').trim().toLowerCase();
const reason = (getArg('reason') || '').trim();
const explicitPacketFile = getArg('packet-file');
const explicitGateFile = getArg('gate-file');

const packetPath = explicitPacketFile
  ? path.resolve(root, explicitPacketFile)
  : path.resolve(root, `docs/governance/EXECUTIVE_PACKET_${date}.md`);

const providerSuffixMap = {
  aws: 'AWS',
  azure: 'AZURE',
  other: 'OTHER'
};

const gateDocPath = explicitGateFile
  ? path.resolve(root, explicitGateFile)
  : provider && providerSuffixMap[provider]
    ? path.resolve(root, `docs/governance/SUPPORT_ESCALATION_GATE_${date}_${providerSuffixMap[provider]}.md`)
    : path.resolve(root, `docs/governance/SUPPORT_ESCALATION_GATE_${date}.md`);

const providerLabelMap = {
  aws: 'AWS Business Support',
  azure: 'Azure Support',
  other: 'Other'
};

if (!provider || !providerLabelMap[provider]) {
  fail('provider is required', [
    'use --provider=aws, --provider=azure, or --provider=other'
  ]);
}

if (!reason) {
  fail('reason is required', [
    'use --reason="<short justification>"'
  ]);
}

const governanceGateArgs = ['scripts/enforce-executive-packet-gate.js', `--date=${date}`];
if (explicitPacketFile) {
  governanceGateArgs.push(`--file=${explicitPacketFile}`);
}

const governanceGate = spawnSync('node', governanceGateArgs, {
  cwd: root,
  encoding: 'utf8'
});

if (governanceGate.status !== 0) {
  fail('executive packet gate did not pass', [
    ...(governanceGate.stderr || governanceGate.stdout || 'unknown gate failure')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
  ]);
}

if (!fs.existsSync(packetPath)) {
  fail('same-day executive packet is missing', [`expected: ${packetPath}`]);
}

if (!fs.existsSync(gateDocPath)) {
  fail('support escalation gate document is missing', [`expected: ${gateDocPath}`]);
}

const gateDoc = fs.readFileSync(gateDocPath, 'utf8');

const requiredSections = [
  '# Support Escalation Gate',
  '## 1) Problem Summary',
  '## 2) Sentinel-First Evidence',
  '## 3) Cloud Attribution',
  '## 4) Requested External Support Action',
  '## 5) Governance Controls',
  '## 6) Decision',
  '## 7) Sign-Off'
];

const missingSections = requiredSections.filter((section) => !gateDoc.includes(section));
if (missingSections.length > 0) {
  fail('support escalation gate document is incomplete', missingSections);
}

const decision = extractBulletValue(gateDoc, 'Decision (`approve|hold|defer`)');
const docProvider = extractBulletValue(gateDoc, 'Provider (`Azure Support|AWS Business Support|Other`)');
const reviewer = extractBulletValue(gateDoc, 'Reviewer');
const execApprover = extractBulletValue(gateDoc, 'Executive approver (if required)');
const externalAuthority = extractBulletValue(gateDoc, '`external_contact_authority`');
const healthReceipt = extractBulletValue(gateDoc, 'Health receipt path');
const scanReceipt = extractBulletValue(gateDoc, 'Scan receipt path');

if (decision.toLowerCase() !== 'approve') {
  fail('decision is not approved', [
    `current decision: ${decision || '(missing)'}`,
    'external escalation requires explicit approve'
  ]);
}

if (docProvider !== providerLabelMap[provider]) {
  fail('provider mismatch between CLI and gate doc', [
    `cli provider: ${providerLabelMap[provider]}`,
    `doc provider: ${docProvider || '(missing)'}`
  ]);
}

if (!reviewer || reviewer.toLowerCase() === 'pending') {
  fail('reviewer sign-off is incomplete', [
    'set Reviewer to a named approver in the Sign-Off section'
  ]);
}

if (externalAuthority.toLowerCase() !== 'true') {
  fail('external contact authority is not enabled', [
    `current external_contact_authority: ${externalAuthority || '(missing)'}`,
    'set external_contact_authority to true only for approved escalation'
  ]);
}

for (const evidencePath of [healthReceipt, scanReceipt]) {
  if (!evidencePath) {
    fail('missing Sentinel-first evidence reference', [
      'Health receipt path and Scan receipt path are required'
    ]);
  }

  const resolvedPath = path.resolve(root, evidencePath);
  if (!fs.existsSync(resolvedPath)) {
    fail('referenced evidence file does not exist', [evidencePath]);
  }
}

if (execApprover && execApprover.toLowerCase() === 'pending') {
  fail('executive approver is still pending', [
    'clear the field or provide final approver when required'
  ]);
}

console.log('✅ Pre-escalation gate PASSED');
console.log(`   provider: ${providerLabelMap[provider]}`);
console.log(`   reason:   ${reason}`);
console.log(`   packet:   ${packetPath}`);
console.log(`   gate:     ${gateDocPath}`);
process.exit(0);
