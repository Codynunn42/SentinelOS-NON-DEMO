// Phase 4 — Sovereign Policy Engine (SPE)
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// The Sovereign Policy Engine is the constitutional layer of SentinelOS.
// Policies are not static rules — they are runtime-enforced sovereign constraints
// that govern every execution decision made by the federated system.
//
// SPE pillars:
//   1. Policy inheritance — policies cascade from sovereign → provider → capability
//   2. Sovereign overrides — unconditional runtime constraints that supersede all tiers
//   3. Runtime compliance gates — open | passed | blocked | deferred per decision
//   4. Drift-aware enforcement — drift severity tightens or locks policy enforcement
//   5. Evidence-bound decisions — every policy outcome carries an evidence reference
//
// Policy node structure:
//   {
//     policyId:       string         — unique policy identifier (SPE-<hex>)
//     command:        string         — the command this policy governs
//     version:        string         — SPE schema version
//     status:         string         — active | suspended | override | inherited | revoked
//     priority:       string         — sovereign | executive-desk | provider | capability
//     driftEnforcement: string       — none | advisory | enforced | locked
//     complianceGates: Gate[]        — runtime compliance gate set
//     sovereignOverride: object|null — unconditional override payload or null
//     evidenceRefs:   string[]       — bound evidence references
//     inheritedFrom:  string|null    — parent policyId if inherited
//     providers:      string[]       — providers this policy applies to
//     createdAt:      string         — ISO timestamp
//     updatedAt:      string|null    — ISO timestamp of last mutation
//   }
//
// Gate structure:
//   {
//     gateId:    string  — gate identifier
//     label:     string  — human label
//     status:    string  — open | passed | blocked | deferred
//     reason:    string|null
//     resolvedAt: string|null
//   }

'use strict';

const crypto = require('crypto');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SPE_VERSION = '1.0';

const POLICY_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  OVERRIDE: 'override',
  INHERITED: 'inherited',
  REVOKED: 'revoked'
};

const SOVEREIGN_PRIORITY = {
  SOVEREIGN: 'sovereign',
  EXECUTIVE_DESK: 'executive-desk',
  PROVIDER: 'provider',
  CAPABILITY: 'capability'
};

// Priority order — index 0 = highest authority
const PRIORITY_ORDER = [
  SOVEREIGN_PRIORITY.SOVEREIGN,
  SOVEREIGN_PRIORITY.EXECUTIVE_DESK,
  SOVEREIGN_PRIORITY.PROVIDER,
  SOVEREIGN_PRIORITY.CAPABILITY
];

const DRIFT_ENFORCEMENT = {
  NONE: 'none',
  ADVISORY: 'advisory',
  ENFORCED: 'enforced',
  LOCKED: 'locked'
};

const GATE_STATUS = {
  OPEN: 'open',
  PASSED: 'passed',
  BLOCKED: 'blocked',
  DEFERRED: 'deferred'
};

const EVAL_DECISION = {
  ALLOW: 'allow',
  BLOCK: 'block',
  DEFER: 'defer'
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function uniqueId(prefix) {
  return `${prefix}${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
}

function nowIso() {
  return new Date().toISOString();
}

/**
 * Return true if priority a is higher authority than priority b.
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function isHigherPriority(a, b) {
  return PRIORITY_ORDER.indexOf(a) < PRIORITY_ORDER.indexOf(b);
}

// ---------------------------------------------------------------------------
// createSovereignPolicy
// ---------------------------------------------------------------------------

/**
 * Create a new sovereign policy node.
 *
 * @param {object} options
 * @param {string} options.command       — the command governed by this policy
 * @param {string} [options.policyId]    — explicit ID; generated if omitted
 * @param {string} [options.priority]    — SOVEREIGN_PRIORITY value; defaults to SOVEREIGN
 * @param {string[]} [options.providers] — providers this policy applies to
 * @param {string} [options.inheritedFrom] — parent policyId for inherited policies
 * @returns {object} policy node
 */
function createSovereignPolicy(options = {}) {
  const { command, policyId, priority, providers, inheritedFrom } = options;

  if (!command) {
    throw new Error('SPE_COMMAND_REQUIRED');
  }

  const id = policyId || uniqueId('SPE-');
  const resolvedPriority = priority || SOVEREIGN_PRIORITY.SOVEREIGN;

  if (!PRIORITY_ORDER.includes(resolvedPriority)) {
    throw new Error(`SPE_INVALID_PRIORITY: ${resolvedPriority}`);
  }

  return {
    policyId: id,
    command,
    version: SPE_VERSION,
    status: inheritedFrom ? POLICY_STATUS.INHERITED : POLICY_STATUS.ACTIVE,
    priority: resolvedPriority,
    driftEnforcement: DRIFT_ENFORCEMENT.NONE,
    complianceGates: [],
    sovereignOverride: null,
    evidenceRefs: [],
    inheritedFrom: inheritedFrom || null,
    providers: Array.isArray(providers) && providers.length > 0 ? [...providers] : [],
    createdAt: nowIso(),
    updatedAt: null
  };
}

// ---------------------------------------------------------------------------
// evaluateSovereignPolicy
// ---------------------------------------------------------------------------

/**
 * Evaluate a sovereign policy against a runtime context.
 * Returns an evaluation decision with full rationale.
 *
 * @param {object} policy  — SPE policy node
 * @param {object} context — runtime context { actor, role, provider, command, driftSeverity }
 * @returns {{ decision: string, allowed: boolean, reason: string|null, gateResults: object[] }}
 */
function evaluateSovereignPolicy(policy, context = {}) {
  if (!policy || !policy.policyId) {
    throw new Error('SPE_POLICY_REQUIRED');
  }

  // Revoked policies are always blocked
  if (policy.status === POLICY_STATUS.REVOKED) {
    return {
      decision: EVAL_DECISION.BLOCK,
      allowed: false,
      reason: 'POLICY_REVOKED',
      gateResults: []
    };
  }

  // Suspended policies block execution
  if (policy.status === POLICY_STATUS.SUSPENDED) {
    return {
      decision: EVAL_DECISION.BLOCK,
      allowed: false,
      reason: 'POLICY_SUSPENDED',
      gateResults: []
    };
  }

  // Locked drift enforcement blocks all non-sovereign callers
  if (policy.driftEnforcement === DRIFT_ENFORCEMENT.LOCKED) {
    const callerPriority = context.callerPriority || SOVEREIGN_PRIORITY.CAPABILITY;
    if (callerPriority !== SOVEREIGN_PRIORITY.SOVEREIGN) {
      return {
        decision: EVAL_DECISION.BLOCK,
        allowed: false,
        reason: 'DRIFT_ENFORCEMENT_LOCKED',
        gateResults: []
      };
    }
  }

  // Sovereign override in effect — unconditionally allows (override is an executive grant)
  if (policy.sovereignOverride !== null) {
    const override = policy.sovereignOverride;
    if (override.decision === EVAL_DECISION.BLOCK) {
      return {
        decision: EVAL_DECISION.BLOCK,
        allowed: false,
        reason: override.reason || 'SOVEREIGN_OVERRIDE_BLOCK',
        gateResults: []
      };
    }
    return {
      decision: EVAL_DECISION.ALLOW,
      allowed: true,
      reason: 'SOVEREIGN_OVERRIDE_ALLOW',
      gateResults: [],
      overrideId: override.overrideId
    };
  }

  // Evaluate compliance gates
  const gateResults = policy.complianceGates.map((gate) => ({
    gateId: gate.gateId,
    label: gate.label,
    status: gate.status,
    reason: gate.reason || null
  }));

  const blockedGates = gateResults.filter((g) => g.status === GATE_STATUS.BLOCKED);
  const deferredGates = gateResults.filter((g) => g.status === GATE_STATUS.OPEN || g.status === GATE_STATUS.DEFERRED);

  if (blockedGates.length > 0) {
    return {
      decision: EVAL_DECISION.BLOCK,
      allowed: false,
      reason: `COMPLIANCE_GATE_BLOCKED:${blockedGates.map((g) => g.gateId).join(',')}`,
      gateResults
    };
  }

  if (deferredGates.length > 0) {
    return {
      decision: EVAL_DECISION.DEFER,
      allowed: false,
      reason: `COMPLIANCE_GATE_PENDING:${deferredGates.map((g) => g.gateId).join(',')}`,
      gateResults
    };
  }

  return {
    decision: EVAL_DECISION.ALLOW,
    allowed: true,
    reason: null,
    gateResults
  };
}

// ---------------------------------------------------------------------------
// applyDriftEnforcement
// ---------------------------------------------------------------------------

/**
 * Apply drift-aware enforcement to a policy.
 * CRITICAL drift → LOCKED
 * WARNING drift  → ENFORCED
 * INFO drift     → ADVISORY
 * NONE           → no change (preserves existing enforcement if already elevated)
 *
 * @param {object} policy
 * @param {string} driftSeverity — 'NONE' | 'INFO' | 'WARNING' | 'CRITICAL'
 * @returns {object} updated policy
 */
function applyDriftEnforcement(policy, driftSeverity) {
  if (!policy || !policy.policyId) {
    throw new Error('SPE_POLICY_REQUIRED');
  }

  const severityMap = {
    NONE: DRIFT_ENFORCEMENT.NONE,
    INFO: DRIFT_ENFORCEMENT.ADVISORY,
    WARNING: DRIFT_ENFORCEMENT.ENFORCED,
    CRITICAL: DRIFT_ENFORCEMENT.LOCKED
  };

  const newEnforcement = severityMap[driftSeverity];
  if (newEnforcement === undefined) {
    throw new Error(`SPE_INVALID_DRIFT_SEVERITY: ${driftSeverity}`);
  }

  // Never downgrade existing enforcement — only tighten
  const currentIdx = Object.values(DRIFT_ENFORCEMENT).indexOf(policy.driftEnforcement);
  const newIdx = Object.values(DRIFT_ENFORCEMENT).indexOf(newEnforcement);

  const resolvedEnforcement = newIdx > currentIdx ? newEnforcement : policy.driftEnforcement;

  return {
    ...policy,
    driftEnforcement: resolvedEnforcement,
    updatedAt: nowIso()
  };
}

// ---------------------------------------------------------------------------
// Compliance gate management
// ---------------------------------------------------------------------------

/**
 * Add a compliance gate to a policy.
 *
 * @param {object} policy
 * @param {object} gate — { gateId, label }
 * @returns {object} updated policy
 */
function addComplianceGate(policy, gate) {
  if (!policy || !policy.policyId) {
    throw new Error('SPE_POLICY_REQUIRED');
  }
  if (!gate || !gate.gateId) {
    throw new Error('SPE_GATE_ID_REQUIRED');
  }
  if (policy.complianceGates.some((g) => g.gateId === gate.gateId)) {
    throw new Error(`SPE_GATE_DUPLICATE: ${gate.gateId}`);
  }

  const newGate = {
    gateId: gate.gateId,
    label: gate.label || gate.gateId,
    status: GATE_STATUS.OPEN,
    reason: null,
    resolvedAt: null
  };

  return {
    ...policy,
    complianceGates: [...policy.complianceGates, newGate],
    updatedAt: nowIso()
  };
}

/**
 * Mark a compliance gate as passed.
 *
 * @param {object} policy
 * @param {string} gateId
 * @returns {object} updated policy
 */
function openGate(policy, gateId) {
  if (!policy || !policy.policyId) throw new Error('SPE_POLICY_REQUIRED');

  const gates = policy.complianceGates.map((g) =>
    g.gateId === gateId
      ? { ...g, status: GATE_STATUS.PASSED, resolvedAt: nowIso() }
      : g
  );

  const found = gates.find((g) => g.gateId === gateId);
  if (!found) throw new Error(`SPE_GATE_NOT_FOUND: ${gateId}`);

  return { ...policy, complianceGates: gates, updatedAt: nowIso() };
}

/**
 * Block a compliance gate with a reason.
 *
 * @param {object} policy
 * @param {string} gateId
 * @param {string} reason
 * @returns {object} updated policy
 */
function blockGate(policy, gateId, reason) {
  if (!policy || !policy.policyId) throw new Error('SPE_POLICY_REQUIRED');

  const gates = policy.complianceGates.map((g) =>
    g.gateId === gateId
      ? { ...g, status: GATE_STATUS.BLOCKED, reason: reason || 'BLOCKED', resolvedAt: nowIso() }
      : g
  );

  const found = gates.find((g) => g.gateId === gateId);
  if (!found) throw new Error(`SPE_GATE_NOT_FOUND: ${gateId}`);

  return { ...policy, complianceGates: gates, updatedAt: nowIso() };
}

// ---------------------------------------------------------------------------
// applySovereignOverride
// ---------------------------------------------------------------------------

/**
 * Apply a sovereign override to a policy, unconditionally superseding all tiers.
 *
 * @param {object} policy
 * @param {object} override — { decision: 'allow'|'block', reason, issuedBy }
 * @returns {object} updated policy
 */
function applySovereignOverride(policy, override) {
  if (!policy || !policy.policyId) throw new Error('SPE_POLICY_REQUIRED');
  if (!override || !override.decision) throw new Error('SPE_OVERRIDE_DECISION_REQUIRED');

  const validDecisions = [EVAL_DECISION.ALLOW, EVAL_DECISION.BLOCK];
  if (!validDecisions.includes(override.decision)) {
    throw new Error(`SPE_INVALID_OVERRIDE_DECISION: ${override.decision}`);
  }

  const overrideId = override.overrideId || uniqueId('SOVR-');

  return {
    ...policy,
    status: POLICY_STATUS.OVERRIDE,
    sovereignOverride: {
      overrideId,
      decision: override.decision,
      reason: override.reason || null,
      issuedBy: override.issuedBy || 'sovereign',
      issuedAt: nowIso()
    },
    updatedAt: nowIso()
  };
}

// ---------------------------------------------------------------------------
// bindEvidence
// ---------------------------------------------------------------------------

/**
 * Bind an evidence reference to a policy for evidence-bound decisions.
 *
 * @param {object} policy
 * @param {string} evidenceRef — evidence reference string (e.g. ENTRY-abc or CHAIN-xyz)
 * @returns {object} updated policy
 */
function bindEvidence(policy, evidenceRef) {
  if (!policy || !policy.policyId) throw new Error('SPE_POLICY_REQUIRED');
  if (!evidenceRef) throw new Error('SPE_EVIDENCE_REF_REQUIRED');

  if (policy.evidenceRefs.includes(evidenceRef)) {
    return policy; // idempotent
  }

  return {
    ...policy,
    evidenceRefs: [...policy.evidenceRefs, evidenceRef],
    updatedAt: nowIso()
  };
}

// ---------------------------------------------------------------------------
// inheritPolicy
// ---------------------------------------------------------------------------

/**
 * Derive a child policy that inherits constraints from a parent policy.
 * The child adopts the parent's driftEnforcement and compliance gates
 * but can be scoped to a specific provider or command.
 *
 * @param {object} parentPolicy
 * @param {object} childOptions — { command, providers, priority }
 * @returns {object} child policy with INHERITED status
 */
function inheritPolicy(parentPolicy, childOptions = {}) {
  if (!parentPolicy || !parentPolicy.policyId) throw new Error('SPE_POLICY_REQUIRED');

  const command = childOptions.command || parentPolicy.command;
  const providers = Array.isArray(childOptions.providers) && childOptions.providers.length > 0
    ? childOptions.providers
    : parentPolicy.providers;

  // Child priority is one level below parent (cannot inherit up)
  const parentPriorityIdx = PRIORITY_ORDER.indexOf(parentPolicy.priority);
  const childPriorityIdx = Math.min(parentPriorityIdx + 1, PRIORITY_ORDER.length - 1);
  const childPriority = childOptions.priority || PRIORITY_ORDER[childPriorityIdx];

  const child = createSovereignPolicy({
    command,
    providers,
    priority: childPriority,
    inheritedFrom: parentPolicy.policyId
  });

  // Inherit drift enforcement (never downgrade)
  const inherited = applyDriftEnforcement(child, driftEnforcementToSeverity(parentPolicy.driftEnforcement));

  // Inherit parent compliance gates (reset to OPEN so child must re-pass)
  const inheritedGates = parentPolicy.complianceGates.map((g) => ({
    ...g,
    status: GATE_STATUS.OPEN,
    reason: null,
    resolvedAt: null
  }));

  return {
    ...inherited,
    complianceGates: inheritedGates
  };
}

/**
 * Map a DRIFT_ENFORCEMENT value back to a severity string for applyDriftEnforcement.
 * @param {string} enforcement
 * @returns {string}
 */
function driftEnforcementToSeverity(enforcement) {
  const map = {
    [DRIFT_ENFORCEMENT.NONE]: 'NONE',
    [DRIFT_ENFORCEMENT.ADVISORY]: 'INFO',
    [DRIFT_ENFORCEMENT.ENFORCED]: 'WARNING',
    [DRIFT_ENFORCEMENT.LOCKED]: 'CRITICAL'
  };
  return map[enforcement] || 'NONE';
}

// ---------------------------------------------------------------------------
// getPolicyStatus
// ---------------------------------------------------------------------------

/**
 * Return a human-readable status summary for a policy.
 *
 * @param {object} policy
 * @returns {object} summary
 */
function getPolicyStatus(policy) {
  if (!policy || !policy.policyId) throw new Error('SPE_POLICY_REQUIRED');

  const total = policy.complianceGates.length;
  const passed = policy.complianceGates.filter((g) => g.status === GATE_STATUS.PASSED).length;
  const blocked = policy.complianceGates.filter((g) => g.status === GATE_STATUS.BLOCKED).length;
  const open = policy.complianceGates.filter((g) => g.status === GATE_STATUS.OPEN).length;
  const deferred = policy.complianceGates.filter((g) => g.status === GATE_STATUS.DEFERRED).length;

  const gatesClean = blocked === 0 && open === 0 && deferred === 0;

  return {
    policyId: policy.policyId,
    command: policy.command,
    status: policy.status,
    priority: policy.priority,
    driftEnforcement: policy.driftEnforcement,
    hasOverride: policy.sovereignOverride !== null,
    overrideDecision: policy.sovereignOverride ? policy.sovereignOverride.decision : null,
    evidenceCount: policy.evidenceRefs.length,
    inheritedFrom: policy.inheritedFrom,
    providers: policy.providers,
    gates: { total, passed, blocked, open, deferred },
    gatesClean,
    version: policy.version
  };
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  SPE_VERSION,
  POLICY_STATUS,
  SOVEREIGN_PRIORITY,
  DRIFT_ENFORCEMENT,
  GATE_STATUS,
  EVAL_DECISION,
  createSovereignPolicy,
  evaluateSovereignPolicy,
  applyDriftEnforcement,
  addComplianceGate,
  openGate,
  blockGate,
  applySovereignOverride,
  bindEvidence,
  inheritPolicy,
  getPolicyStatus
};
