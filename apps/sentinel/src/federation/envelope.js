// Phase 3 — Federation Envelope Model (FEM)
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// The Federation Envelope Model (FEM) is the core artifact of Phase 3.
// A federation envelope routes capabilities across multiple providers
// (TILDA, Microsoft 365, GitHub, NEXUS, and future docks) as a single
// governed execution unit — with no duplication, no drift, no policy conflict.
//
// Envelope lifecycle:
//   pending     → created, not yet dispatched
//   active      → dispatched to primary provider
//   executing   → provider is running the command
//   complete    → all providers returned success evidence
//   failed      → execution failed and no fallback succeeded
//   fallback    → primary failed; secondary provider is now active
//
// Components:
//   providerSet[]    — ordered eligible providers with per-provider scope
//   capabilityScope  — federated capability definition (id, type, authority)
//   policyScope      — merged policy rules across all providers
//   fallbackChain[]  — ordered failover path (trigger conditions + action)
//   evidenceChain[]  — multi-provider evidence stitching
//   executionPlan    — provider-specific ordered execution steps
//   driftAwareness   — drift classification + remediation hooks

'use strict';

const crypto = require('crypto');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FEM_VERSION = '1.0';

const ENVELOPE_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  EXECUTING: 'executing',
  COMPLETE: 'complete',
  FAILED: 'failed',
  FALLBACK: 'fallback'
};

const POLICY_PRIORITY = {
  EXECUTIVE_DESK: 'executive-desk',
  PROVIDER: 'provider',
  CAPABILITY: 'capability'
};

const DRIFT_SEVERITY = {
  NONE: 'NONE',
  INFO: 'INFO',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL'
};

const FALLBACK_TRIGGER = {
  HEALTH_BELOW_THRESHOLD: 'HEALTH_BELOW_THRESHOLD',
  DRIFT_CRITICAL: 'DRIFT_CRITICAL',
  CAPABILITY_UNAVAILABLE: 'CAPABILITY_UNAVAILABLE',
  API_FAILURE: 'API_FAILURE',
  EXECUTION_TIMEOUT: 'EXECUTION_TIMEOUT'
};

const FALLBACK_ACTION = {
  REROUTE: 'REROUTE',
  RESCORE: 'RESCORE',
  REBUILD_PLAN: 'REBUILD_PLAN',
  APPEND_EVIDENCE: 'APPEND_EVIDENCE',
  ABORT: 'ABORT'
};

const EVIDENCE_STATUS = {
  PENDING: 'pending',
  COLLECTED: 'collected',
  FAILED: 'failed',
  SKIPPED: 'skipped'
};

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate a federation envelope structure.
 * Returns { valid: boolean, errors: string[] }.
 *
 * @param {object} envelope
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateEnvelope(envelope) {
  const errors = [];

  if (!envelope || typeof envelope !== 'object') {
    return { valid: false, errors: ['ENVELOPE_REQUIRED'] };
  }

  if (!envelope.envelopeId || typeof envelope.envelopeId !== 'string') {
    errors.push('ENVELOPE_ID_REQUIRED');
  }

  if (!envelope.tenant || typeof envelope.tenant !== 'string') {
    errors.push('TENANT_REQUIRED');
  }

  if (!envelope.command || typeof envelope.command !== 'string') {
    errors.push('COMMAND_REQUIRED');
  }

  // providerSet — must be a non-empty array
  if (!Array.isArray(envelope.providerSet) || envelope.providerSet.length === 0) {
    errors.push('PROVIDER_SET_REQUIRED');
  } else {
    envelope.providerSet.forEach((entry, i) => {
      if (!entry.provider) errors.push(`PROVIDER_SET[${i}].provider required`);
      if (!entry.capabilityId) errors.push(`PROVIDER_SET[${i}].capabilityId required`);
      if (!entry.endpoint) errors.push(`PROVIDER_SET[${i}].endpoint required`);
    });
  }

  // capabilityScope
  if (!envelope.capabilityScope || typeof envelope.capabilityScope !== 'object') {
    errors.push('CAPABILITY_SCOPE_REQUIRED');
  } else {
    if (!envelope.capabilityScope.capabilityId) errors.push('CAPABILITY_SCOPE.capabilityId required');
    if (!envelope.capabilityScope.type) errors.push('CAPABILITY_SCOPE.type required');
    if (!envelope.capabilityScope.authority || !envelope.capabilityScope.authority.minimumRole) {
      errors.push('CAPABILITY_SCOPE.authority.minimumRole required');
    }
  }

  // policyScope
  if (!envelope.policyScope || typeof envelope.policyScope !== 'object') {
    errors.push('POLICY_SCOPE_REQUIRED');
  } else {
    if (typeof envelope.policyScope.requiresApproval !== 'boolean') {
      errors.push('POLICY_SCOPE.requiresApproval must be boolean');
    }
    if (!Array.isArray(envelope.policyScope.complianceGates)) {
      errors.push('POLICY_SCOPE.complianceGates must be array');
    }
    if (!envelope.policyScope.priority) {
      errors.push('POLICY_SCOPE.priority required');
    }
  }

  // fallbackChain
  if (!Array.isArray(envelope.fallbackChain)) {
    errors.push('FALLBACK_CHAIN_REQUIRED');
  } else {
    envelope.fallbackChain.forEach((step, i) => {
      if (!step.provider) errors.push(`FALLBACK_CHAIN[${i}].provider required`);
      if (!step.trigger) errors.push(`FALLBACK_CHAIN[${i}].trigger required`);
      if (!step.action) errors.push(`FALLBACK_CHAIN[${i}].action required`);
    });
  }

  // evidenceChain
  if (!Array.isArray(envelope.evidenceChain)) {
    errors.push('EVIDENCE_CHAIN_REQUIRED');
  } else {
    envelope.evidenceChain.forEach((entry, i) => {
      if (!entry.provider) errors.push(`EVIDENCE_CHAIN[${i}].provider required`);
      if (!entry.status) errors.push(`EVIDENCE_CHAIN[${i}].status required`);
    });
  }

  // executionPlan
  if (!envelope.executionPlan || typeof envelope.executionPlan !== 'object') {
    errors.push('EXECUTION_PLAN_REQUIRED');
  } else {
    if (!Array.isArray(envelope.executionPlan.steps)) {
      errors.push('EXECUTION_PLAN.steps must be array');
    }
    if (!envelope.executionPlan.primaryProvider) {
      errors.push('EXECUTION_PLAN.primaryProvider required');
    }
  }

  // driftAwareness
  if (!envelope.driftAwareness || typeof envelope.driftAwareness !== 'object') {
    errors.push('DRIFT_AWARENESS_REQUIRED');
  } else {
    if (!envelope.driftAwareness.severity) {
      errors.push('DRIFT_AWARENESS.severity required');
    }
    if (typeof envelope.driftAwareness.remediationEnabled !== 'boolean') {
      errors.push('DRIFT_AWARENESS.remediationEnabled must be boolean');
    }
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a new federation envelope.
 *
 * @param {{
 *   tenant: string,
 *   command: string,
 *   providerSet: Array<{ provider: string, capabilityId: string, endpoint: string, role?: string, priority?: number }>,
 *   capabilityScope: { capabilityId: string, type: string, authority: { minimumRole: string } },
 *   policyScope?: { requiresApproval?: boolean, complianceGates?: string[], priority?: string, driftOverride?: boolean },
 *   fallbackChain?: Array<{ provider: string, trigger: string, action: string }>,
 *   driftSeverity?: string,
 *   metadata?: object
 * }} params
 * @returns {object} federation envelope
 */
function createEnvelope(params) {
  const {
    tenant,
    command,
    providerSet,
    capabilityScope,
    policyScope = {},
    fallbackChain = [],
    driftSeverity = DRIFT_SEVERITY.NONE,
    metadata = {}
  } = params || {};

  if (!tenant) throw new Error('FEM: tenant is required');
  if (!command) throw new Error('FEM: command is required');
  if (!Array.isArray(providerSet) || providerSet.length === 0) throw new Error('FEM: providerSet must be non-empty array');
  if (!capabilityScope || !capabilityScope.capabilityId) throw new Error('FEM: capabilityScope.capabilityId is required');

  const envelopeId = 'FED-' + crypto.randomBytes(8).toString('hex').toUpperCase();
  const issuedAt = new Date().toISOString();

  // Sort provider set by declared priority (lower = higher priority); default priority 0
  const orderedProviders = providerSet.slice().sort(
    (a, b) => (a.priority || 0) - (b.priority || 0)
  );

  const primaryProvider = orderedProviders[0].provider;

  // Build execution plan — one step per provider in priority order
  const executionSteps = orderedProviders.map((entry, index) => ({
    stepIndex: index,
    provider: entry.provider,
    capabilityId: entry.capabilityId,
    endpoint: entry.endpoint,
    role: entry.role || null,
    isPrimary: index === 0,
    status: 'pending'
  }));

  // Build evidence chain — one slot per provider
  const evidenceChain = orderedProviders.map((entry) => ({
    provider: entry.provider,
    capabilityId: entry.capabilityId,
    ref: null,
    status: EVIDENCE_STATUS.PENDING,
    collectedAt: null
  }));

  const envelope = {
    envelopeId,
    version: FEM_VERSION,
    issuedAt,
    tenant,
    command,
    status: ENVELOPE_STATUS.PENDING,
    providerSet: orderedProviders,
    capabilityScope: {
      capabilityId: capabilityScope.capabilityId,
      type: capabilityScope.type || null,
      authority: capabilityScope.authority || { minimumRole: 'operator' }
    },
    policyScope: {
      requiresApproval: typeof policyScope.requiresApproval === 'boolean' ? policyScope.requiresApproval : false,
      complianceGates: Array.isArray(policyScope.complianceGates) ? policyScope.complianceGates : [],
      priority: policyScope.priority || POLICY_PRIORITY.EXECUTIVE_DESK,
      driftOverride: typeof policyScope.driftOverride === 'boolean' ? policyScope.driftOverride : false
    },
    fallbackChain: fallbackChain.map((step) => ({
      provider: step.provider,
      trigger: step.trigger,
      action: step.action,
      activatedAt: null,
      reason: step.reason || null
    })),
    evidenceChain,
    executionPlan: {
      primaryProvider,
      steps: executionSteps,
      currentStepIndex: 0,
      startedAt: null,
      completedAt: null
    },
    driftAwareness: {
      severity: driftSeverity,
      remediationEnabled: driftSeverity !== DRIFT_SEVERITY.NONE,
      classifiedAt: issuedAt,
      remediationHooks: driftSeverity === DRIFT_SEVERITY.CRITICAL
        ? ['REROUTE', 'REBUILD_PLAN']
        : driftSeverity === DRIFT_SEVERITY.WARNING
          ? ['RESCORE']
          : []
    },
    metadata
  };

  const validation = validateEnvelope(envelope);
  if (!validation.valid) {
    throw new Error('FEM: envelope failed validation — ' + validation.errors.join(', '));
  }

  return envelope;
}

// ---------------------------------------------------------------------------
// Transition helpers
// ---------------------------------------------------------------------------

/**
 * Advance an envelope's status to a new state.
 * Returns a new envelope object — envelopes are treated as immutable records.
 *
 * @param {object} envelope
 * @param {string} newStatus
 * @param {object} [patch] — additional fields to merge at the top level
 * @returns {object}
 */
function transitionEnvelope(envelope, newStatus, patch = {}) {
  const allowed = Object.values(ENVELOPE_STATUS);
  if (!allowed.includes(newStatus)) {
    throw new Error(`FEM: invalid status transition → '${newStatus}'`);
  }
  return Object.assign({}, envelope, patch, { status: newStatus });
}

/**
 * Mark an evidence slot as collected for a given provider.
 *
 * @param {object} envelope
 * @param {string} provider
 * @param {string} ref — evidence reference (file path, run ID, etc.)
 * @returns {object} updated envelope
 */
function collectEvidence(envelope, provider, ref) {
  const updatedChain = envelope.evidenceChain.map((entry) => {
    if (entry.provider !== provider) return entry;
    return Object.assign({}, entry, {
      ref,
      status: EVIDENCE_STATUS.COLLECTED,
      collectedAt: new Date().toISOString()
    });
  });
  return Object.assign({}, envelope, { evidenceChain: updatedChain });
}

/**
 * Activate a fallback step for a provider.
 * Returns a new envelope in FALLBACK status with the step annotated.
 *
 * @param {object} envelope
 * @param {string} provider — the provider that failed
 * @param {string} trigger — one of FALLBACK_TRIGGER values
 * @param {string} reason
 * @returns {object} updated envelope
 */
function activateFallback(envelope, provider, trigger, reason) {
  const updatedChain = envelope.fallbackChain.map((step) => {
    if (step.provider !== provider || step.trigger !== trigger) return step;
    return Object.assign({}, step, {
      activatedAt: new Date().toISOString(),
      reason
    });
  });
  return transitionEnvelope(envelope, ENVELOPE_STATUS.FALLBACK, {
    fallbackChain: updatedChain
  });
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  FEM_VERSION,
  ENVELOPE_STATUS,
  POLICY_PRIORITY,
  DRIFT_SEVERITY,
  FALLBACK_TRIGGER,
  FALLBACK_ACTION,
  EVIDENCE_STATUS,
  createEnvelope,
  validateEnvelope,
  transitionEnvelope,
  collectEvidence,
  activateFallback
};
