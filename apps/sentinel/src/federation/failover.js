// Phase 3 — Provider Fallback & Failover Logic (PFFL)
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// The Provider Fallback & Failover Logic (PFFL) handles the reliability
// layer of Phase 3. When a primary provider fails or degrades, PFFL:
//
//   1. Detects the trigger condition (health drop, drift, API failure, timeout, unavailability)
//   2. Re-scores remaining providers using the CPRM router
//   3. Rebuilds the execution plan to route to the next eligible provider
//   4. Appends failover evidence to the envelope's evidenceChain
//   5. Transitions the envelope to FALLBACK status
//   6. If no provider can take over → transitions to FAILED
//
// Failover triggers:
//   HEALTH_BELOW_THRESHOLD — provider health drops below 0.3 (or 'degraded')
//   DRIFT_CRITICAL         — provider drift reaches CRITICAL severity
//   CAPABILITY_UNAVAILABLE — capability not reachable or deregistered
//   API_FAILURE            — provider returned a non-retryable error
//   EXECUTION_TIMEOUT      — provider did not respond within timeout window
//
// Failover actions per trigger:
//   REROUTE        — move execution to next provider in failoverPath
//   RESCORE        — re-rank all providers, pick new primary
//   REBUILD_PLAN   — regenerate executionPlan steps from new routing decision
//   APPEND_EVIDENCE — write failover event to evidenceChain
//   ABORT          — no failover possible; transition to FAILED
//
// All failover events are immutable — they produce new envelope objects.

'use strict';

const { routeEnvelope } = require('./router');
const {
  ENVELOPE_STATUS,
  FALLBACK_TRIGGER,
  FALLBACK_ACTION,
  EVIDENCE_STATUS,
  transitionEnvelope,
  activateFallback
} = require('./envelope');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PFFL_VERSION = '1.0';

const FAILOVER_OUTCOME = {
  REROUTED: 'REROUTED',       // successfully moved to fallback provider
  RESCORED: 'RESCORED',       // re-ranked providers; new primary selected
  PLAN_REBUILT: 'PLAN_REBUILT', // execution plan regenerated
  ABORTED: 'ABORTED',         // no viable provider; envelope failed
  NO_TRIGGER_MATCH: 'NO_TRIGGER_MATCH'  // no fallbackChain entry matches trigger
};

// Health threshold below which a provider is considered failing
const HEALTH_FAIL_THRESHOLD = 'degraded';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Append a failover event to the evidenceChain for a provider.
 * @param {object} envelope
 * @param {string} provider
 * @param {string} trigger
 * @param {string} reason
 * @returns {object} updated envelope
 */
function appendFailoverEvidence(envelope, provider, trigger, reason) {
  const ref = `FAILOVER:${provider}:${trigger}:${Date.now()}`;
  const updatedChain = envelope.evidenceChain.map((entry) => {
    if (entry.provider !== provider) return entry;
    return Object.assign({}, entry, {
      ref: entry.ref ? entry.ref + ';' + ref : ref,
      status: EVIDENCE_STATUS.FAILED,
      failoverReason: reason,
      failoverTrigger: trigger,
      failoverAt: new Date().toISOString()
    });
  });
  return Object.assign({}, envelope, { evidenceChain: updatedChain });
}

/**
 * Rebuild the executionPlan steps from a new routing decision.
 * @param {object} envelope
 * @param {object} routingDecision — result from routeEnvelope
 * @returns {object} updated envelope
 */
function rebuildExecutionPlan(envelope, routingDecision) {
  const steps = [routingDecision.primary, routingDecision.secondary, routingDecision.tertiary]
    .filter(Boolean)
    .map((entry, index) => ({
      stepIndex: index,
      provider: entry.provider,
      capabilityId: entry.capabilityId,
      endpoint: entry.endpoint,
      isPrimary: index === 0,
      status: 'pending',
      health: entry.health,
      drift: entry.drift
    }));

  const updatedPlan = Object.assign({}, envelope.executionPlan, {
    primaryProvider: routingDecision.primary ? routingDecision.primary.provider : null,
    steps,
    currentStepIndex: 0,
    rebuildAt: new Date().toISOString()
  });

  return Object.assign({}, envelope, { executionPlan: updatedPlan });
}

// ---------------------------------------------------------------------------
// Core failover function
// ---------------------------------------------------------------------------

/**
 * Execute failover logic for a provider that has failed or degraded.
 *
 * @param {{
 *   envelope: object,           — current FEM envelope (in ACTIVE or EXECUTING status)
 *   failedProvider: string,     — the provider that triggered failover
 *   trigger: string,            — one of FALLBACK_TRIGGER values
 *   reason: string,             — human-readable failure reason
 *   providerHealth?: object,    — current health map for re-scoring
 *   driftScores?: object,       — current drift map for re-scoring
 *   role?: string               — caller role for re-routing authority check
 * }} params
 *
 * @returns {{
 *   outcome: string,
 *   envelope: object,
 *   nextProvider: string | null,
 *   failoverChainStep: object | null,
 *   reroutedAt: string
 * }}
 */
function executeFailover(params) {
  const {
    envelope,
    failedProvider,
    trigger,
    reason,
    providerHealth = {},
    driftScores = {},
    role
  } = params || {};

  const reroutedAt = new Date().toISOString();

  if (!envelope || !failedProvider || !trigger) {
    return {
      outcome: FAILOVER_OUTCOME.ABORTED,
      envelope: envelope || null,
      nextProvider: null,
      failoverChainStep: null,
      reroutedAt
    };
  }

  // Find the matching fallback chain step
  const chainStep = Array.isArray(envelope.fallbackChain)
    ? envelope.fallbackChain.find(
        (s) => s.provider !== failedProvider && s.trigger === trigger
      ) || envelope.fallbackChain.find(
        (s) => s.provider !== failedProvider
      )
    : null;

  // Append failover evidence for the failing provider
  let updatedEnvelope = appendFailoverEvidence(envelope, failedProvider, trigger, reason);

  // Activate the fallback step on the envelope
  if (chainStep) {
    updatedEnvelope = activateFallback(updatedEnvelope, chainStep.provider, trigger, reason);
  } else {
    // No matching chain step — check if any provider in the failoverPath is still viable
    const failoverPath = envelope.executionPlan && Array.isArray(envelope.executionPlan.steps)
      ? envelope.executionPlan.steps.filter(
          (s) => s.provider !== failedProvider && s.isPrimary === false
        )
      : [];

    if (failoverPath.length === 0) {
      // No fallback available — abort
      const failedEnvelope = transitionEnvelope(updatedEnvelope, ENVELOPE_STATUS.FAILED);
      return {
        outcome: FAILOVER_OUTCOME.ABORTED,
        envelope: failedEnvelope,
        nextProvider: null,
        failoverChainStep: null,
        reroutedAt
      };
    }
  }

  // Re-score providers using CPRM (demote the failed provider by marking it degraded)
  const updatedHealth = Object.assign({}, providerHealth, {
    [failedProvider]: HEALTH_FAIL_THRESHOLD
  });

  const newRouting = routeEnvelope({
    envelope: updatedEnvelope,
    providerHealth: updatedHealth,
    driftScores,
    role
  });

  if (!newRouting.routed || !newRouting.primary) {
    // Re-score found no viable provider — abort
    const failedEnvelope = transitionEnvelope(updatedEnvelope, ENVELOPE_STATUS.FAILED);
    return {
      outcome: FAILOVER_OUTCOME.ABORTED,
      envelope: failedEnvelope,
      nextProvider: null,
      failoverChainStep: chainStep || null,
      reroutedAt
    };
  }

  // Rebuild execution plan with new routing
  const rebuiltEnvelope = rebuildExecutionPlan(updatedEnvelope, newRouting);
  const finalEnvelope = transitionEnvelope(rebuiltEnvelope, ENVELOPE_STATUS.FALLBACK);

  return {
    outcome: FAILOVER_OUTCOME.REROUTED,
    envelope: finalEnvelope,
    nextProvider: newRouting.primary.provider,
    failoverChainStep: chainStep || null,
    reroutedAt,
    newRouting
  };
}

/**
 * Check whether a provider's health warrants a failover trigger.
 * Returns the appropriate trigger or null.
 *
 * @param {string} provider
 * @param {object} providerHealth — { [provider]: 'healthy' | 'degraded' | 'unknown' }
 * @param {object} driftScores — { [provider]: 'NONE' | 'INFO' | 'WARNING' | 'CRITICAL' }
 * @returns {string | null} — FALLBACK_TRIGGER value or null
 */
function detectFailoverTrigger(provider, providerHealth, driftScores) {
  const health = providerHealth && providerHealth[provider];
  const drift = driftScores && driftScores[provider];

  if (health === 'degraded') return FALLBACK_TRIGGER.HEALTH_BELOW_THRESHOLD;
  if (drift === 'CRITICAL') return FALLBACK_TRIGGER.DRIFT_CRITICAL;
  return null;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  PFFL_VERSION,
  FAILOVER_OUTCOME,
  executeFailover,
  detectFailoverTrigger
};
