'use strict';

const assert = require('assert');
const {
  NEXUS_POLICY_PACK_ID,
  isActionBlocked,
  isAutoApproved,
  requiresApproval,
  getApprovalTier,
  getEvidenceRequirements,
  getRolePermissions,
  evaluateNexusPolicy,
  approvalModel,
  blockedActions,
  telemetryRules
} = require('../apps/sentinel/src/governance/gaas/nexus-policy');

// 1. Pack identity
assert.strictEqual(NEXUS_POLICY_PACK_ID, 'gaas.nexus.console.v1', 'Wrong policy pack ID');

// 2. Blocked actions
assert.strictEqual(isActionBlocked('telemetry.export.external'), true);
assert.strictEqual(isActionBlocked('tenant.admin'), true);
assert.strictEqual(isActionBlocked('nexus.status.read'), false);

// 3. Auto-approved
assert.strictEqual(isAutoApproved('nexus.status.read'), true);
assert.strictEqual(isAutoApproved('nexus.console.init'), true);
assert.strictEqual(isAutoApproved('nexus.intent.emit'), true);
assert.strictEqual(isAutoApproved('nexus.command.execute'), false);

// 4. Requires approval
assert.strictEqual(requiresApproval('nexus.command.execute'), true);
assert.strictEqual(requiresApproval('nexus.executive.review'), true);
assert.strictEqual(requiresApproval('nexus.status.read'), false);

// 5. Approval tiers
assert.strictEqual(getApprovalTier('nexus.command.execute'), 'executive');
assert.strictEqual(getApprovalTier('nexus.status.read'), null);

// 6. Evidence requirements
const execEvidence = getEvidenceRequirements('nexus.command.execute');
assert.ok(execEvidence.includes('executive_approval_id'));
assert.ok(execEvidence.includes('signed_decision'));
assert.ok(execEvidence.includes('audit_receipt'));

// 7. Role permissions
const operatorPerms = getRolePermissions('operator');
assert.ok(operatorPerms.allowed.includes('nexus:read'));
assert.ok(operatorPerms.allowed.includes('nexus:write'));
assert.ok(operatorPerms.denied.includes('nexus:execute'));
assert.ok(operatorPerms.denied.includes('nexus:executive'));

const executivePerms = getRolePermissions('executive');
assert.ok(executivePerms.allowed.includes('nexus:execute'));
assert.ok(executivePerms.allowed.includes('nexus:executive'));
assert.strictEqual(executivePerms.denied.length, 0);

// 8. Policy evaluation — operator blocked from execute
const operatorBlock = evaluateNexusPolicy('nexus.command.execute', 'operator');
assert.strictEqual(operatorBlock.allowed, false);
assert.strictEqual(operatorBlock.approvalRequired, true);
assert.strictEqual(operatorBlock.reason, 'EXECUTIVE_APPROVAL_REQUIRED');

// 9. Policy evaluation — executive allowed to execute
const executiveAllow = evaluateNexusPolicy('nexus.command.execute', 'executive');
assert.strictEqual(executiveAllow.allowed, true);

// 10. Policy evaluation — blocked action always blocked
const alwaysBlocked = evaluateNexusPolicy('telemetry.export.external', 'executive');
assert.strictEqual(alwaysBlocked.allowed, false);
assert.strictEqual(alwaysBlocked.reason, 'ACTION_BLOCKED_BY_GAAS');

// 11. Policy evaluation — operator can read/write
const readAllow = evaluateNexusPolicy('nexus.status.read', 'operator');
assert.strictEqual(readAllow.allowed, true);

const writeAllow = evaluateNexusPolicy('nexus.intent.emit', 'operator');
assert.strictEqual(writeAllow.allowed, true);

// 12. Approval model structure
assert.strictEqual(approvalModel.FACEPLANE_READ, 'auto');
assert.strictEqual(approvalModel.FACEPLANE_EXECUTE, 'executive_approval');

// 13. Telemetry rules
assert.strictEqual(telemetryRules.internalAudit, true);
assert.strictEqual(telemetryRules.externalExport, false);
assert.strictEqual(telemetryRules.telemetryMode, 'LIMITED');

console.log('NEXUS GaaS policy pack check passed');
