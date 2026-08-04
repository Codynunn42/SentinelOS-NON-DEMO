// NEXUS GaaS Policy Pack — gaas.nexus.console.v1
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// This is the Governance-as-a-Service policy pack for the NEXUS command console face plane.
// It defines: required approvals, blocked actions, evidence requirements,
// telemetry visibility rules, and role/tenant permissions.
//
// This pack is bound to the NEXUS docking manifest before execution is enabled.
// It is consulted by the governance preflight and policy engine layers.

'use strict';

const NEXUS_POLICY_PACK_ID = 'gaas.nexus.console.v1';
const NEXUS_TENANT = 'nexus';

// Approval model: what each capability tier requires
const approvalModel = Object.freeze({
  FACEPLANE_READ: 'auto',                    // No approval required
  FACEPLANE_WRITE: 'operator_role',          // operator or higher
  FACEPLANE_EXECUTE: 'executive_approval',   // Executive Desk explicit approval required
  GAAS_POLICY_APPLY: 'executive_approval',   // Executive Desk explicit approval required
  DOCKING_MANIFEST_REGISTER: 'platform_admin' // Platform admin only
});

// Blocked actions — these commands are always rejected for the nexus tenant
const blockedActions = Object.freeze([
  'telemetry.export.external',
  'telemetry.payload.sensitive',
  'tenant.admin',
  'platform.admin'
]);

// Required approvals by command
const requiredApprovals = Object.freeze({
  'nexus.command.execute': 'executive',
  'nexus.executive.review': 'executive'
});

// Auto-approved commands (operator or above, no explicit approval needed)
const autoApproved = Object.freeze([
  'nexus.status.read',
  'nexus.console.init',
  'nexus.intent.emit'
]);

// Evidence requirements: what must be present in the audit trail for each command class
const evidenceRequirements = Object.freeze({
  'nexus.command.execute': [
    'executive_approval_id',
    'signed_decision',
    'audit_receipt',
    'actor',
    'role',
    'timestamp'
  ],
  'nexus.intent.emit': [
    'audit_receipt',
    'actor',
    'role',
    'intent',
    'timestamp'
  ],
  'nexus.status.read': [
    'actor',
    'timestamp'
  ],
  'nexus.console.init': [
    'actor',
    'timestamp'
  ],
  'nexus.executive.review': [
    'audit_receipt',
    'actor',
    'role',
    'timestamp'
  ]
});

// Telemetry visibility rules
const telemetryRules = Object.freeze({
  internalAudit: true,        // All NEXUS events go to the audit log
  externalExport: false,      // Telemetry export is blocked by default
  executiveEvents: true,      // executive.oversight.* events are captured
  telemetryMode: 'LIMITED',   // Matches the docking manifest
  retentionClass: 'governance_standard'
});

// Role and tenant permissions map
const permissionsMap = Object.freeze({
  roles: {
    operator: {
      allowed: ['nexus:read', 'nexus:write'],
      denied: ['nexus:execute', 'nexus:executive']
    },
    executive: {
      allowed: ['nexus:read', 'nexus:write', 'nexus:execute', 'nexus:executive'],
      denied: []
    },
    platform: {
      allowed: ['nexus:read', 'nexus:write', 'nexus:execute', 'nexus:executive'],
      denied: []
    }
  },
  tenants: {
    [NEXUS_TENANT]: {
      allowedRoles: ['operator', 'executive', 'platform'],
      blockedRoles: []
    }
  }
});

// Compliance mandates this pack satisfies
const complianceMandates = Object.freeze([
  'internal_governance',
  'operator_rbac',
  'executive_oversight',
  'audit_retention',
  'no_execution_bypass'
]);

// --- Policy Pack API ---

function getPolicyPackId() {
  return NEXUS_POLICY_PACK_ID;
}

function isActionBlocked(command) {
  return blockedActions.includes(command);
}

function isAutoApproved(command) {
  return autoApproved.includes(command);
}

function requiresApproval(command) {
  return Object.prototype.hasOwnProperty.call(requiredApprovals, command);
}

function getApprovalTier(command) {
  return requiredApprovals[command] || null;
}

function getEvidenceRequirements(command) {
  return evidenceRequirements[command] || ['actor', 'timestamp'];
}

function getRolePermissions(role) {
  return permissionsMap.roles[role] || { allowed: [], denied: [] };
}

function evaluateNexusPolicy(command, role) {
  if (isActionBlocked(command)) {
    return {
      allowed: false,
      reason: 'ACTION_BLOCKED_BY_GAAS',
      approvalRequired: false,
      evidenceRequired: []
    };
  }

  if (requiresApproval(command)) {
    const tier = getApprovalTier(command);

    if (tier === 'executive' && role !== 'executive' && role !== 'platform') {
      return {
        allowed: false,
        reason: 'EXECUTIVE_APPROVAL_REQUIRED',
        approvalRequired: true,
        approvalTier: tier,
        evidenceRequired: getEvidenceRequirements(command)
      };
    }
  }

  return {
    allowed: true,
    approvalRequired: false,
    evidenceRequired: getEvidenceRequirements(command)
  };
}

module.exports = {
  NEXUS_POLICY_PACK_ID,
  approvalModel,
  blockedActions,
  requiredApprovals,
  autoApproved,
  evidenceRequirements,
  telemetryRules,
  permissionsMap,
  complianceMandates,
  getPolicyPackId,
  isActionBlocked,
  isAutoApproved,
  requiresApproval,
  getApprovalTier,
  getEvidenceRequirements,
  getRolePermissions,
  evaluateNexusPolicy
};
