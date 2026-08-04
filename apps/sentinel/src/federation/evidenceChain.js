// Phase 3 — Federated Evidence Chain Structure (FECS)
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// The Federated Evidence Chain Structure (FECS) is the audit layer of Phase 3.
// It creates and maintains a unified evidence chain across all providers so
// the Executive Desk can reconstruct any multi-provider execution with perfect fidelity.
//
// Directory structure (logical — paths are relative to a configurable evidence root):
//   evidence/provider/<provider>/         — per-provider evidence files
//   evidence/federation/chain.json        — full federated chain record
//   evidence/federation/drift.json        — drift classification per provider
//   evidence/federation/failover.json     — failover events
//   evidence/federation/execution.json    — execution steps + outcomes
//
// Chain record structure:
//   {
//     chainId:     string       — unique chain identifier (CHAIN-<hex>)
//     envelopeId:  string       — linked FEM envelope ID
//     version:     string       — FECS schema version
//     createdAt:   string       — ISO timestamp
//     finalizedAt: string|null  — ISO timestamp when chain is closed
//     status:      string       — open | complete | failed | partial
//     providers:   string[]     — list of providers in this chain
//     entries:     ChainEntry[] — ordered evidence entries
//   }
//
// ChainEntry structure:
//   {
//     entryId:    string   — unique entry identifier
//     provider:   string   — which provider this entry comes from
//     type:       string   — execution | drift | failover | policy | evidence
//     ref:        string   — evidence reference (file path, run ID, etc.)
//     status:     string   — pending | collected | failed | skipped
//     payload:    object   — structured evidence payload
//     timestamp:  string   — ISO timestamp
//   }

'use strict';

const crypto = require('crypto');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FECS_VERSION = '1.0';

const CHAIN_STATUS = {
  OPEN: 'open',
  COMPLETE: 'complete',
  FAILED: 'failed',
  PARTIAL: 'partial'
};

const ENTRY_TYPE = {
  EXECUTION: 'execution',
  DRIFT: 'drift',
  FAILOVER: 'failover',
  POLICY: 'policy',
  EVIDENCE: 'evidence'
};

const ENTRY_STATUS = {
  PENDING: 'pending',
  COLLECTED: 'collected',
  FAILED: 'failed',
  SKIPPED: 'skipped'
};

// ---------------------------------------------------------------------------
// Chain creation
// ---------------------------------------------------------------------------

/**
 * Create a new federated evidence chain for an envelope.
 *
 * @param {{ envelopeId: string, providers: string[], metadata?: object }} params
 * @returns {object} chain record
 */
function createChain(params) {
  const { envelopeId, providers, metadata = {} } = params || {};

  if (!envelopeId) throw new Error('FECS: envelopeId is required');
  if (!Array.isArray(providers) || providers.length === 0) throw new Error('FECS: providers must be non-empty array');

  const chainId = 'CHAIN-' + crypto.randomBytes(8).toString('hex').toUpperCase();
  const createdAt = new Date().toISOString();

  return {
    chainId,
    envelopeId,
    version: FECS_VERSION,
    createdAt,
    finalizedAt: null,
    status: CHAIN_STATUS.OPEN,
    providers: providers.slice(),
    entries: [],
    metadata
  };
}

// ---------------------------------------------------------------------------
// Entry management
// ---------------------------------------------------------------------------

/**
 * Add an evidence entry to a chain.
 * Returns a new chain — chains are treated as immutable records.
 *
 * @param {object} chain
 * @param {{
 *   provider: string,
 *   type: string,
 *   ref: string,
 *   status?: string,
 *   payload?: object
 * }} entry
 * @returns {object} updated chain
 */
function addEntry(chain, entry) {
  if (!chain) throw new Error('FECS: chain is required');
  if (!entry || !entry.provider) throw new Error('FECS: entry.provider is required');
  if (!entry.type) throw new Error('FECS: entry.type is required');
  if (!entry.ref) throw new Error('FECS: entry.ref is required');

  const entryId = 'ENTRY-' + crypto.randomBytes(6).toString('hex').toUpperCase();
  const newEntry = {
    entryId,
    provider: entry.provider,
    type: entry.type,
    ref: entry.ref,
    status: entry.status || ENTRY_STATUS.COLLECTED,
    payload: entry.payload || {},
    timestamp: new Date().toISOString()
  };

  return Object.assign({}, chain, {
    entries: chain.entries.concat([newEntry])
  });
}

/**
 * Update the status of an existing entry by entryId.
 * Returns a new chain.
 *
 * @param {object} chain
 * @param {string} entryId
 * @param {string} status
 * @param {object} [payloadPatch]
 * @returns {object} updated chain
 */
function updateEntry(chain, entryId, status, payloadPatch = {}) {
  const updatedEntries = chain.entries.map((e) => {
    if (e.entryId !== entryId) return e;
    return Object.assign({}, e, {
      status,
      payload: Object.assign({}, e.payload, payloadPatch),
      updatedAt: new Date().toISOString()
    });
  });
  return Object.assign({}, chain, { entries: updatedEntries });
}

/**
 * Finalize a chain.
 * Determines final status based on entry outcomes:
 *   - all collected → COMPLETE
 *   - any failed, some collected → PARTIAL
 *   - all failed or pending → FAILED
 *
 * @param {object} chain
 * @returns {object} finalized chain
 */
function finalizeChain(chain) {
  const entries = chain.entries;
  const total = entries.length;

  if (total === 0) {
    return Object.assign({}, chain, {
      status: CHAIN_STATUS.COMPLETE,
      finalizedAt: new Date().toISOString()
    });
  }

  const collected = entries.filter((e) => e.status === ENTRY_STATUS.COLLECTED).length;
  const failed = entries.filter((e) => e.status === ENTRY_STATUS.FAILED).length;

  let finalStatus;
  if (failed === 0) {
    finalStatus = CHAIN_STATUS.COMPLETE;
  } else if (collected > 0 && failed > 0) {
    finalStatus = CHAIN_STATUS.PARTIAL;
  } else {
    finalStatus = CHAIN_STATUS.FAILED;
  }

  return Object.assign({}, chain, {
    status: finalStatus,
    finalizedAt: new Date().toISOString()
  });
}

// ---------------------------------------------------------------------------
// Chain builders from envelope state
// ---------------------------------------------------------------------------

/**
 * Build a federated evidence chain from a completed FEM envelope.
 * Produces a full chain record with entries for each provider's evidence slot.
 *
 * @param {object} envelope — finalized FEM envelope
 * @returns {object} chain record
 */
function buildChainFromEnvelope(envelope) {
  if (!envelope || !envelope.envelopeId) throw new Error('FECS: valid envelope required');

  const providers = (envelope.providerSet || []).map((p) => p.provider);
  let chain = createChain({ envelopeId: envelope.envelopeId, providers });

  // Add execution entries from the execution plan
  if (envelope.executionPlan && Array.isArray(envelope.executionPlan.steps)) {
    for (const step of envelope.executionPlan.steps) {
      chain = addEntry(chain, {
        provider: step.provider,
        type: ENTRY_TYPE.EXECUTION,
        ref: `execution:${step.provider}:step-${step.stepIndex}`,
        status: step.status === 'complete' ? ENTRY_STATUS.COLLECTED
          : step.status === 'failed' ? ENTRY_STATUS.FAILED
            : ENTRY_STATUS.PENDING,
        payload: {
          stepIndex: step.stepIndex,
          endpoint: step.endpoint,
          isPrimary: step.isPrimary,
          stepStatus: step.status
        }
      });
    }
  }

  // Add evidence entries from the evidenceChain
  if (Array.isArray(envelope.evidenceChain)) {
    for (const evidenceSlot of envelope.evidenceChain) {
      if (evidenceSlot.status === 'collected' || evidenceSlot.ref) {
        chain = addEntry(chain, {
          provider: evidenceSlot.provider,
          type: ENTRY_TYPE.EVIDENCE,
          ref: evidenceSlot.ref || `evidence:${evidenceSlot.provider}:pending`,
          status: evidenceSlot.status === 'collected' ? ENTRY_STATUS.COLLECTED
            : evidenceSlot.status === 'failed' ? ENTRY_STATUS.FAILED
              : ENTRY_STATUS.PENDING,
          payload: {
            collectedAt: evidenceSlot.collectedAt,
            failoverReason: evidenceSlot.failoverReason || null
          }
        });
      }
    }
  }

  // Add drift entries
  const drift = envelope.driftAwareness;
  if (drift && drift.severity !== 'NONE') {
    for (const provider of providers) {
      chain = addEntry(chain, {
        provider,
        type: ENTRY_TYPE.DRIFT,
        ref: `drift:${provider}:${drift.severity}`,
        status: ENTRY_STATUS.COLLECTED,
        payload: {
          severity: drift.severity,
          remediationEnabled: drift.remediationEnabled,
          remediationHooks: drift.remediationHooks,
          classifiedAt: drift.classifiedAt
        }
      });
    }
  }

  // Add failover entries from activated fallback chain steps
  if (Array.isArray(envelope.fallbackChain)) {
    for (const step of envelope.fallbackChain) {
      if (step.activatedAt) {
        chain = addEntry(chain, {
          provider: step.provider,
          type: ENTRY_TYPE.FAILOVER,
          ref: `failover:${step.provider}:${step.trigger}`,
          status: ENTRY_STATUS.COLLECTED,
          payload: {
            trigger: step.trigger,
            action: step.action,
            activatedAt: step.activatedAt,
            reason: step.reason
          }
        });
      }
    }
  }

  return chain;
}

// ---------------------------------------------------------------------------
// Summary view
// ---------------------------------------------------------------------------

/**
 * Get a summary of a chain — for Executive Desk display.
 *
 * @param {object} chain
 * @returns {object} summary
 */
function getChainSummary(chain) {
  const byProvider = {};
  for (const entry of chain.entries) {
    if (!byProvider[entry.provider]) {
      byProvider[entry.provider] = { collected: 0, failed: 0, pending: 0, types: [] };
    }
    const slot = byProvider[entry.provider];
    if (entry.status === ENTRY_STATUS.COLLECTED) slot.collected++;
    else if (entry.status === ENTRY_STATUS.FAILED) slot.failed++;
    else slot.pending++;
    if (!slot.types.includes(entry.type)) slot.types.push(entry.type);
  }

  return {
    chainId: chain.chainId,
    envelopeId: chain.envelopeId,
    status: chain.status,
    createdAt: chain.createdAt,
    finalizedAt: chain.finalizedAt,
    totalEntries: chain.entries.length,
    providers: chain.providers,
    byProvider,
    version: chain.version
  };
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  FECS_VERSION,
  CHAIN_STATUS,
  ENTRY_TYPE,
  ENTRY_STATUS,
  createChain,
  addEntry,
  updateEntry,
  finalizeChain,
  buildChainFromEnvelope,
  getChainSummary
};
