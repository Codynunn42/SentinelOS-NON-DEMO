#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

const args = process.argv.slice(2);
const getArg = (name) => args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
const root = path.resolve(__dirname, '..');

function fail(message) {
  console.error(`Governance flow FAILED: ${message}`);
  process.exit(1);
}

// Legacy escalation and ledger writers target repository paths, not private output.
if (!args.includes('--skip-pre-escalation') || !args.includes('--skip-ledger')) {
  fail('Private reporting requires --skip-pre-escalation --skip-ledger; repository-writing side effects are disabled');
}
const configFile = getArg('config');
if (!configFile) fail('--config=<JSON file> is required');
let config;
try {
  config = JSON.parse(fs.readFileSync(path.resolve(configFile), 'utf8'));
} catch (error) {
  fail(`Cannot read configuration: ${error.message}`);
}
const output = getArg('output-dir') ?? config.outputDir;
if (typeof output !== 'string' || !output.trim()) fail('An external output directory is required');
const outputDir = path.resolve(getArg('output-dir') ? process.cwd() : path.dirname(path.resolve(configFile)), output);
const date = getArg('date') ?? new Date().toISOString().slice(0, 10);

function run(script, scriptArgs) {
  const result = spawnSync(process.execPath, [path.join(root, script), ...scriptArgs], { stdio: 'inherit' });
  if (result.error || result.status !== 0) fail(`Step failed: ${script}${result.error ? `: ${result.error.message}` : ''}`);
}

run('scripts/orchestrate-executive-template.js', args.filter((arg) =>
  ['--config=', '--date=', '--register=', '--output-dir='].some((prefix) => arg.startsWith(prefix))));
run('scripts/enforce-executive-packet-gate.js', [
  `--date=${date}`, `--file=${path.join(outputDir, `EXECUTIVE_PACKET_${date}.md`)}`
]);
console.log('Governance reporting flow PASSED; no escalation or evidence-ledger writes performed');
