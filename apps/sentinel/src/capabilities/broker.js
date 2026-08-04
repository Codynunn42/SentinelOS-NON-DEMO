// C4 — Multi-Provider Capability Selector
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// The Capability Broker resolves a goal (command intent) to a registered
// capability and routes it to the correct provider.
//
// C3.5 Scope: Registry-based routing — single provider resolution.
// C4 Extension: Multi-provider selection. When multiple active providers
// serve the same command, selectProvider ranks them by:
//   1. health status  (healthy > unknown > degraded)
//   2. governance posture  (evidenceRequired providers ranked higher)
//   3. declared cost    (lower cost preferred)
//   4. declared latency (lower latency preferred)
//
// brokerCommand continues to return the top-ranked candidate.
// brokerMultiProvider returns the full ranked list with selection rationale.
//
// Routing model:
//   1. Extract command from the planning envelope
//   2. Look up all active capabilities that serve this command
//   3. Apply role gate — drop capabilities that require a higher role
//   4. Score and rank remaining candidates
//   5. Return the top candidate (brokerCommand) or full list (brokerMultiProvider)
//   6. If no capability is registered or passes role gate, return BROKER_NO_ROUTE

'use strict';

const { resolveEnvelope, getCapabilitySummary, listCapabilities } = require('./resolver');
const { LIFECYCLE } = require('./registry');

// Provider health values — ordered best to worst for scoring
const HEALTH_SCORE = { healthy: 2, unknown: 1, degraded: 0 };

/**
 * @typedef {Object} BrokerRequest
 * @property {string} command
 * @property {string} tenant
 * @property {string} role
 * @property {object} [metadata]
 */

/**
 * @typedef {Object} BrokerDecision
 * @property {boolean} routed
 * @property {string} [capabilityId]
 * @property {string} [provider]
 * @property {string} [endpoint]
 * @property {boolean} [evidenceRequired]
 * @property {string} [reason]
 * @property {object} [capability]
 */

/**
 * Score a capability candidate for provider selection.
 * Higher score = preferred.
 *
 * @param {object} cap
 * @returns {number}
 */
function scoreCandidate(cap) {
  const healthScore = HEALTH_SCORE[cap.providerHealth] !== undefined
    ? HEALTH_SCORE[cap.providerHealth]
    : HEALTH_SCORE.unknown;

  // Evidence-required providers score 1 bonus point — they carry stronger governance posture
  const evidenceBonus = cap.governance && cap.governance.evidenceRequired ? 1 : 0;

  // Lower cost = higher score (default cost 5 if not declared)
  const cost = typeof cap.cost === 'number' ? cap.cost : 5;
  const costScore = Math.max(0, 10 - cost);

  // Lower latency = higher score (default latencyMs 500 if not declared)
  const latencyMs = typeof cap.latencyMs === 'number' ? cap.latencyMs : 500;
  const latencyScore = latencyMs <= 100 ? 3 : latencyMs <= 300 ? 2 : latencyMs <= 600 ? 1 : 0;

  return (healthScore * 4) + (evidenceBonus * 2) + costScore + latencyScore;
}

/**
 * Resolve all active candidates that serve a command, apply role gate, rank them.
 *
 * @param {{ command: string, role?: string }} params
 * @returns {{ candidates: object[], blockedByRole: boolean }}
 */
function rankCandidates({ command, role }) {
  if (!command) return { candidates: [], blockedByRole: false };

  const active = listCapabilities({ lifecycle: LIFECYCLE.ACTIVE });
  const serving = active.filter(
    (cap) => cap.commands && cap.commands.includes(command)
  );

  if (!serving.length) return { candidates: [], blockedByRole: false };

  // Apply role gate — drop capabilities that require executive/platform when caller is not
  const passed = serving.filter((cap) => {
    const minRole = cap.authority && cap.authority.minimumRole;
    if (minRole === 'executive' || minRole === 'platform') {
      return role === 'executive' || role === 'platform';
    }
    return true;
  });

  const blockedByRole = passed.length === 0 && serving.length > 0;

  // Rank by score descending
  const ranked = passed.slice().sort((a, b) => scoreCandidate(b) - scoreCandidate(a));

  return { candidates: ranked, blockedByRole };
}

/**
 * Broker a command to a registered capability.
 * Returns a routing decision for the top-ranked candidate.
 *
 * @param {BrokerRequest} request
 * @returns {BrokerDecision}
 */
function brokerCommand(request) {
  const { command, tenant, role } = request || {};

  if (!command) {
    return { routed: false, reason: 'BROKER_COMMAND_REQUIRED' };
  }
  if (!tenant) {
    return { routed: false, reason: 'BROKER_TENANT_REQUIRED' };
  }

  const resolution = resolveEnvelope({ command, tenant, role });

  if (!resolution.resolved) {
    return {
      routed: false,
      reason: resolution.reason || 'BROKER_NO_ROUTE',
      hint: resolution.hint || null,
      lifecycle: resolution.lifecycle || null
    };
  }

  const cap = resolution.capability;

  return {
    routed: true,
    capabilityId: cap.capabilityId,
    provider: cap.provider,
    endpoint: resolution.routingAdvice.endpoint,
    interface: resolution.routingAdvice.interface,
    evidenceRequired: resolution.routingAdvice.evidenceRequired,
    authority: resolution.routingAdvice.authority,
    providerHealth: cap.providerHealth || 'unknown',
    capability: {
      capabilityId: cap.capabilityId,
      type: cap.type,
      version: cap.version,
      healthEndpoint: cap.healthEndpoint,
      providerHealth: cap.providerHealth || 'unknown'
    }
  };
}

/**
 * Broker a command across all registered providers that serve it.
 * Returns an ordered list of candidate providers with selection rationale.
 * The first entry is the recommended provider.
 *
 * @param {{ command: string, tenant: string, role: string }} params
 * @returns {{ routed: boolean, selected?: object, candidates: object[], reason?: string }}
 */
function brokerMultiProvider(params) {
  const { command, tenant, role } = params || {};

  if (!command) {
    return { routed: false, candidates: [], reason: 'BROKER_COMMAND_REQUIRED' };
  }
  if (!tenant) {
    return { routed: false, candidates: [], reason: 'BROKER_TENANT_REQUIRED' };
  }

  const { candidates, blockedByRole } = rankCandidates({ command, role });

  if (!candidates.length) {
    return {
      routed: false,
      candidates: [],
      reason: blockedByRole ? 'INSUFFICIENT_ROLE' : 'BROKER_NO_ROUTE'
    };
  }

  const scoredCandidates = candidates.map((cap) => ({
    capabilityId: cap.capabilityId,
    provider: cap.provider,
    type: cap.type,
    endpoint: cap.endpoint,
    evidenceRequired: cap.governance && cap.governance.evidenceRequired,
    minimumRole: cap.authority && cap.authority.minimumRole,
    providerHealth: cap.providerHealth || 'unknown',
    score: scoreCandidate(cap),
    selectionRationale: {
      healthScore: HEALTH_SCORE[cap.providerHealth] !== undefined
        ? HEALTH_SCORE[cap.providerHealth] : HEALTH_SCORE.unknown,
      evidenceBonus: cap.governance && cap.governance.evidenceRequired ? 1 : 0,
      costScore: Math.max(0, 10 - (typeof cap.cost === 'number' ? cap.cost : 5)),
      latencyScore: (() => {
        const ms = typeof cap.latencyMs === 'number' ? cap.latencyMs : 500;
        return ms <= 100 ? 3 : ms <= 300 ? 2 : ms <= 600 ? 1 : 0;
      })()
    }
  }));

  return {
    routed: true,
    selected: scoredCandidates[0],
    candidates: scoredCandidates
  };
}

/**
 * Broker a planning request — resolves the intent to a capability and
 * returns the execution endpoint and governance posture.
 * Used by POST /api/v1/planning to answer "which capability handles this?"
 *
 * @param {{ intent: { command: string, payload?: object }, tenant: string, role: string }} params
 * @returns {{ routed: boolean, brokerDecision: BrokerDecision, proposedEndpoint?: string }}
 */
function brokerPlanningRequest(params) {
  const { intent, tenant, role } = params || {};
  const command = intent && intent.command ? intent.command : null;

  if (!command) {
    return { routed: false, brokerDecision: { routed: false, reason: 'BROKER_INTENT_COMMAND_REQUIRED' } };
  }

  const decision = brokerCommand({ command, tenant, role });

  return {
    routed: decision.routed,
    brokerDecision: decision,
    proposedEndpoint: decision.routed ? decision.endpoint : null
  };
}

/**
 * Return a capability manifest for a given provider — used by the
 * Executive Desk and planning responses to surface governance context.
 *
 * @param {string} [provider]
 */
function getCapabilityManifest(provider) {
  return getCapabilitySummary(provider);
}

module.exports = {
  brokerCommand,
  brokerMultiProvider,
  brokerPlanningRequest,
  getCapabilityManifest,
  scoreCandidate
};
