#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const getArg = (name) => {
  const match = args.find((arg) => arg.startsWith(`--${name}=`));
  return match ? match.split('=').slice(1).join('=') : '';
};

const root = process.cwd();
const utcDate = new Date().toISOString().slice(0, 10);
const date = getArg('date') || utcDate;
const explicitFile = getArg('file');

const packetPath = explicitFile
  ? path.resolve(root, explicitFile)
  : path.resolve(root, `docs/governance/EXECUTIVE_PACKET_${date}.md`);

const requiredSections = [
  '## Executive Summary',
  '## Decisions Required',
  '## Controls',
  '## Evidence Index'
];

const requiredAuthorityFlags = [
  'staging_authority: false',
  'commit_authority: false',
  'runtime_authority: false',
  'external_contact_authority: false'
];

function fail(message, details = []) {
  console.error(`❌ Executive packet gate FAILED: ${message}`);
  for (const line of details) console.error(`   - ${line}`);
  process.exit(1);
}

if (!fs.existsSync(packetPath)) {
  fail('required executive packet is missing', [
    `expected: ${packetPath}`,
    'run orchestrator first to generate today’s packet'
  ]);
}

const content = fs.readFileSync(packetPath, 'utf8');
const missingSections = requiredSections.filter((section) => !content.includes(section));
if (missingSections.length > 0) {
  fail('missing required sections', missingSections);
}

const missingFlags = requiredAuthorityFlags.filter((flag) => !content.includes(flag));
if (missingFlags.length > 0) {
  fail('missing required authority flags', missingFlags);
}

console.log('✅ Executive packet gate PASSED');
console.log(`   packet: ${packetPath}`);
console.log(`   date:   ${date}`);
process.exit(0);
