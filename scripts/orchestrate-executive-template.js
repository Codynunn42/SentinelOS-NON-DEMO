#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const date = new Date().toISOString().slice(0, 10);

const inputs = [
  'docs/governance/SENTINEL_FIRST_SUPPORT_POLICY_2026-07-20.md',
  'docs/governance/SENTINEL_FIRST_EVIDENCE_RUNBOOK_2026-07-20.md',
  'docs/governance/SUPPORT_ESCALATION_GATE_TEMPLATE_2026-07-20.md',
  'docs/governance/EXECUTIVE_DRIFT_FOCUS_REPORT_2026-06-18.md'
];

const templatePath = path.join(root, 'docs/governance/EXECUTIVE_TEMPLATE_CANONICAL.md');
if (!fs.existsSync(templatePath)) {
  console.error('Missing template:', templatePath);
  process.exit(1);
}
const template = fs.readFileSync(templatePath, 'utf8');

const status = inputs.map((p) => {
  const full = path.join(root, p);
  return `- ${p}: ${fs.existsSync(full) ? 'present' : 'missing'}`;
}).join('\n');

const decisions = [
  '- Approve/Hold docs-only governance packet stage/commit gate',
  '- Confirm Sentinel-first external support escalation trigger policy',
  '- Confirm Azure-first lane with AWS exception-only support use'
].join('\n');

const evidence = inputs.map((p) => `- ${p}`).join('\n');

const output = template
  .replaceAll('{{DATE}}', date)
  .replace('{{INPUT_STATUS}}', status)
  .replace('{{EXEC_SUMMARY}}',
    'Sentinel-first orchestration is active for governance analysis and support triage. External provider support is exception-gated and evidence-backed.')
  .replace('{{DECISIONS}}', decisions)
  .replace('{{EVIDENCE_INDEX}}', evidence);

const outPath = path.join(root, `docs/governance/EXECUTIVE_PACKET_${date}.md`);
fs.writeFileSync(outPath, output);
console.log('Generated:', outPath);
