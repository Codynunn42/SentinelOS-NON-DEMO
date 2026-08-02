'use strict';

// NEXUS Phase 2 Validation Check
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// Validates all Phase 2 deliverables for the C2.4 gate:
//   2.1 — nexus-console.html — content and route references
//   2.2 — nexus-executive.html — content and route references
//   2.3 — nexus-policy.js — GaaS policy pack integrity
//   2.4 — API route registration in server.js

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// --- 2.1 NEXUS Command Console UI ---

const consolePath = path.join(ROOT, 'apps', 'nexus', 'public', 'nexus-console.html');
assert(fs.existsSync(consolePath), 'NEXUS console HTML missing: ' + consolePath);

const consoleHtml = fs.readFileSync(consolePath, 'utf8');

[
  'NEXUS',
  'SentinelOS',
  '/v1/command',
  'tenant: \'nexus\'',
  'nexus.status.read',
  'nexus.console.init',
  'nexus.intent.emit',
  'nexus.command.execute',
  'nexus.executive.review',
  '/nexus/executive',
  'Executive Desk',
  'Governance: Active',
  'Executive Approval Required',
  'getScopesForCommand',
  'nexus:read',
  'nexus:write',
  'nexus:execute',
  'nexus:executive'
].forEach((needle) => {
  assert(consoleHtml.includes(needle), `nexus-console.html missing: ${needle}`);
});

console.log('  - nexus-console.html content ✓');

// --- 2.2 Executive Desk Oversight UI ---

const execPath = path.join(ROOT, 'apps', 'nexus', 'public', 'nexus-executive.html');
assert(fs.existsSync(execPath), 'NEXUS executive HTML missing: ' + execPath);

const execHtml = fs.readFileSync(execPath, 'utf8');

[
  'Executive Desk',
  'SentinelOS',
  '/approvals',
  '/approvals/${approvalId}/${action}',
  'loadApprovals',
  'nexus.command.execute',
  'executive.oversight',
  '/nexus',
  'Governance Invariant',
  'nexus:executive'
].forEach((needle) => {
  assert(execHtml.includes(needle), `nexus-executive.html missing: ${needle}`);
});

console.log('  - nexus-executive.html content ✓');

// --- 2.3 NEXUS GaaS Policy Pack ---

const {
  NEXUS_POLICY_PACK_ID,
  evaluateNexusPolicy,
  isActionBlocked,
  isAutoApproved,
  requiresApproval,
  getApprovalTier,
  getEvidenceRequirements,
  getRolePermissions,
  approvalModel,
  telemetryRules
} = require('../apps/sentinel/src/governance/gaas/nexus-policy');

assert.strictEqual(NEXUS_POLICY_PACK_ID, 'gaas.nexus.console.v1');
assert.strictEqual(approvalModel.FACEPLANE_EXECUTE, 'executive_approval');
assert.strictEqual(approvalModel.FACEPLANE_READ, 'auto');
assert.strictEqual(telemetryRules.externalExport, false);
assert.strictEqual(telemetryRules.internalAudit, true);
assert.strictEqual(isActionBlocked('telemetry.export.external'), true);
assert.strictEqual(isActionBlocked('nexus.status.read'), false);
assert.strictEqual(isAutoApproved('nexus.status.read'), true);
assert.strictEqual(isAutoApproved('nexus.command.execute'), false);
assert.strictEqual(requiresApproval('nexus.command.execute'), true);
assert.strictEqual(getApprovalTier('nexus.command.execute'), 'executive');

const execEvidence = getEvidenceRequirements('nexus.command.execute');
assert.ok(execEvidence.includes('executive_approval_id'));
assert.ok(execEvidence.includes('signed_decision'));

const opPerms = getRolePermissions('operator');
assert.ok(opPerms.denied.includes('nexus:execute'));
const exPerms = getRolePermissions('executive');
assert.ok(exPerms.allowed.includes('nexus:execute'));
assert.ok(exPerms.allowed.includes('nexus:executive'));

const opBlock = evaluateNexusPolicy('nexus.command.execute', 'operator');
assert.strictEqual(opBlock.allowed, false);
assert.strictEqual(opBlock.approvalRequired, true);

const exAllow = evaluateNexusPolicy('nexus.command.execute', 'executive');
assert.strictEqual(exAllow.allowed, true);

const readAllow = evaluateNexusPolicy('nexus.status.read', 'operator');
assert.strictEqual(readAllow.allowed, true);

console.log('  - nexus-policy.js (GaaS pack) ✓');

// --- 2.4 API Route Registration ---

const serverPath = path.join(ROOT, 'apps', 'api', 'server.js');
assert(fs.existsSync(serverPath), 'server.js not found');

const serverJs = fs.readFileSync(serverPath, 'utf8');

[
  "NEXUS_CONSOLE_PATH",
  "NEXUS_EXECUTIVE_PATH",
  "nexus-console.html",
  "nexus-executive.html",
  "pathname === '/nexus'",
  "pathname === '/nexus/executive'",
  "sendHtmlFile(res, NEXUS_CONSOLE_PATH)",
  "sendHtmlFile(res, NEXUS_EXECUTIVE_PATH)",
  "auditSurfaceView"
].forEach((needle) => {
  assert(serverJs.includes(needle), `server.js missing route registration: ${needle}`);
});

console.log('  - /nexus route registered ✓');
console.log('  - /nexus/executive route registered ✓');

// --- Summary ---

console.log('');
console.log('ALL NEXUS PHASE 2 CHECKS PASSED');
console.log('  - nexus-console.html present and routes /v1/command with tenant nexus ✓');
console.log('  - nexus-executive.html present and routes /approvals/:id/approve|reject ✓');
console.log('  - nexus-policy.js GaaS pack validates: blocked, auto-approved, executive enforcement ✓');
console.log('  - /nexus and /nexus/executive routes registered and audited in server.js ✓');
console.log('');
console.log('Phase 2 validation gates: COMPLETE');
console.log('Ready for C2.4 issuance.');
