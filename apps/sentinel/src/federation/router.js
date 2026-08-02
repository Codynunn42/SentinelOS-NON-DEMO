// Phase 3 — Cross-Provider Routing Matrix (CPRM)
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// The Cross-Provider Routing Matrix (CPRM) is the routing brain of Phase 3.
// It consumes a Federation Envelope and live provider state, then produces
// a deterministic routing decision:
//
//   primary   → top-ranked provider that can handle the command
//   secondary → next-best fallback provider
//   tertiary  → third-tier fallback provider
//   retryStrategy → how to retry if primary fails before escalating
//   failoverPath  → ordered list of providers to attempt on failure
//
// Routing Inputs:
//   - providerSet from FEM envelope (eligible providers + capabilities)
//   - providerHealth map (health status per provider: healthy | degraded | unknown)
//   - driftScores map (drift severity per provider: NONE | INFO | WARNING | CRITICAL)
//   - broker scoring (scoreCandidate from broker.js — health + governance + cost + latency)
//   - policyScope from FEM envelope (complianceGates, requiresApproval, priority)
//   - role — caller's role for authority gate
//
// Routing Outputs:
//   - primary: { provider, capabilityId, endpoint, score, rationale }
//   - secondary: same shape or null
//   - tertiary: same shape or null
//   - retryStrategy: { maxAttempts, backoffMs, retryOn[] }
//   - failoverPath: ordered array of provider entries (primary excluded)
//   - routed: boolean
//   - reason: string (if routed === false)
//
// Policy:
//   - Providers with CRITICAL drift are demoted to last-resort only
//   - Providers with WARNING drift are scored down (score penalty)
//   - Providers with 'degraded' health are excluded unless they are the only option
//   - If all providers are degraded, routing returns routed: false with reason PROVIDER_DEGRADED
//   - complianceGates with EXECUTIVE_APPROVAL require minimumRole === executive or platform
//
// Determinism guarantee:
//   - Given identical inputs, CPRM always produces identical output.
//   - Score ties are broken alphabetically by capabilityId.

'use strict';

const { scoreCandidate } = require('../capabilities/broker');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CPRM_VERSION = '1.0';

const ROUTING_REASON = {
  ROUTED: 'ROUTED',
  NO_PROVIDERS: 'NO_PROVIDERS',
  ALL_PROVIDERS_DEGRADED: 'ALL_PROVIDERS_DEGRADED',
  INSUFFICIENT_ROLE: 'INSUFFICIENT_ROLE',
  COMPLIANCE_GATE_BLOCKED: 'COMPLIANCE_GATE_BLOCKED',
  COMMAND_REQUIRED: 'COMMAND_REQUIRED',
  PROVIDER_SET_REQUIRED: 'PROVIDER_SET_REQUIRED'
};

const DRIFT_PENALTY = {
  NONE: 0,
  INFO: 0,
  WARNING: -2,   // scored down — still eligible but deprioritized
  CRITICAL: -8   // last-resort only
};

const RETRY_DEFAULTS = {
  maxAttempts: 3,
  backoffMs: 500,
  retryOn: ['API_FAILURE', 'EXECUTION_TIMEOUT']
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Apply drift penalty to a broker score.
 * @param {number} baseScore
 * @param {string} driftSeverity — NONE | INFO | WARNING | CRITICAL
 * @returns {number}
 */
function applyDriftPenalty(baseScore, driftSeverity) {
  const penalty = DRIFT_PENALTY[driftSeverity] !== undefined ? DRIFT_PENALTY[driftSeverity] : 0;
  return baseScore + penalty;
}

/**
 * Check whether a provider entry passes the role gate.
 * @param {{ minimumRole?: string }} authority
 * @param {string} role
 * @returns {boolean}
 */
function passesRoleGate(authority, role) {
  const minRole = authority && authority.minimumRole;
  if (minRole === 'executive' || minRole === 'platform') {
    return role === 'executive' || role === 'platform';
  }
  return true;
}

/**
 * Check whether policyScope compliance gates block execution.
 * Currently enforces EXECUTIVE_APPROVAL gate.
 *
 * @param {string[]} complianceGates
 * @param {string} role
 * @returns {{ blocked: boolean, reason?: string }}
 */
function checkComplianceGates(complianceGates, role) {
  if (!Array.isArray(complianceGates)) return { blocked: false };

  if (complianceGates.includes('EXECUTIVE_APPROVAL')) {
    if (role !== 'executive' && role !== 'platform') {
      return { blocked: true, reason: 'COMPLIANCE_GATE_BLOCKED' };
    }
  }
  return { blocked: false };
}

// ---------------------------------------------------------------------------
// Core routing function
// ---------------------------------------------------------------------------

/**
 * Route a federation envelope to an ordered set of providers.
 *
 * @param {{
 *   envelope: object,      — federation envelope (from createEnvelope)
 *   providerHealth: object, — { [provider]: 'healthy' | 'degraded' | 'unknown' }
 *   driftScores: object,   — { [provider]: 'NONE' | 'INFO' | 'WARNING' | 'CRITICAL' }
 *   role: string,          — caller role for authority gate
 *   retryOverride?: object — optional retry strategy override
 * }} params
 *
 * @returns {{
 *   routed: boolean,
 *   reason: string,
 *   primary: object | null,
 *   secondary: object | null,
 *   tertiary: object | null,
 *   failoverPath: object[],
 *   retryStrategy: object,
 *   routedAt: string,
 *   version: string
 * }}
 */
function routeEnvelope(params) {
  const {
    envelope,
    providerHealth = {},
    driftScores = {},
    role,
    retryOverride = null
  } = params || {};

  const routedAt = new Date().toISOString();
  const notRouted = (reason) => ({
    routed: false,
    reason,
    primary: null,
    secondary: null,
    tertiary: null,
    failoverPath: [],
    retryStrategy: Object.assign({}, RETRY_DEFAULTS),
    routedAt,
    version: CPRM_VERSION
  });

  if (!envelope || !envelope.command) {
    return notRouted(ROUTING_REASON.COMMAND_REQUIRED);
  }
  if (!Array.isArray(envelope.providerSet) || envelope.providerSet.length === 0) {
    return notRouted(ROUTING_REASON.PROVIDER_SET_REQUIRED);
  }

  // --- Compliance gate check (applies to the whole envelope) ---
  const policyScope = envelope.policyScope || {};
  const gateCheck = checkComplianceGates(policyScope.complianceGates, role);
  if (gateCheck.blocked) {
    return notRouted(ROUTING_REASON.COMPLIANCE_GATE_BLOCKED);
  }

  // --- Score each candidate in the providerSet ---
  const scored = envelope.providerSet.map((entry) => {
    const health = providerHealth[entry.provider] || 'unknown';
    const drift = driftScores[entry.provider] || 'NONE';

    // Build a minimal capability object for scoreCandidate
    const capForScoring = {
      providerHealth: health,
      governance: { evidenceRequired: !!(entry.evidenceRequired) },
      cost: typeof entry.cost === 'number' ? entry.cost : 5,
      latencyMs: typeof entry.latencyMs === 'number' ? entry.latencyMs : 500
    };

    const baseScore = scoreCandidate(capForScoring);
    const adjustedScore = applyDriftPenalty(baseScore, drift);

    // Build rationale
    const rationale = {
      baseScore,
      driftPenalty: DRIFT_PENALTY[drift] || 0,
      adjustedScore,
      health,
      drift
    };

    return {
      provider: entry.provider,
      capabilityId: entry.capabilityId,
      endpoint: entry.endpoint,
      role: entry.role || null,
      health,
      drift,
      score: adjustedScore,
      rationale,
      // Authority gate check per entry
      passesRole: passesRoleGate(
        entry.authority || (envelope.capabilityScope && envelope.capabilityScope.authority),
        role
      )
    };
  });

  // --- Apply role gate ---
  const roleGated = scored.filter((c) => c.passesRole);
  if (roleGated.length === 0 && scored.length > 0) {
    return notRouted(ROUTING_REASON.INSUFFICIENT_ROLE);
  }

  // --- Separate degraded from non-degraded ---
  const nonDegraded = roleGated.filter((c) => c.health !== 'degraded');
  const degradedOnly = roleGated.filter((c) => c.health === 'degraded');

  // If all are degraded, fall back to using them but flag it
  const candidates = nonDegraded.length > 0 ? nonDegraded : degradedOnly;

  if (candidates.length === 0) {
    return notRouted(ROUTING_REASON.NO_PROVIDERS);
  }

  if (nonDegraded.length === 0) {
    // All degraded — cannot route safely
    return notRouted(ROUTING_REASON.ALL_PROVIDERS_DEGRADED);
  }

  // --- Deterministic sort: score desc, tie-break by capabilityId asc ---
  const sorted = candidates.slice().sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.capabilityId < b.capabilityId ? -1 : a.capabilityId > b.capabilityId ? 1 : 0;
  });

  const [primary = null, secondary = null, tertiary = null] = sorted;

  // failoverPath = everything after primary, in order
  const failoverPath = sorted.slice(1).map((c) => ({
    provider: c.provider,
    capabilityId: c.capabilityId,
    endpoint: c.endpoint,
    score: c.score,
    health: c.health,
    drift: c.drift
  }));

  const retryStrategy = retryOverride
    ? Object.assign({}, RETRY_DEFAULTS, retryOverride)
    : Object.assign({}, RETRY_DEFAULTS);

  // Helper to shape final entry
  const shape = (c) => c ? {
    provider: c.provider,
    capabilityId: c.capabilityId,
    endpoint: c.endpoint,
    score: c.score,
    health: c.health,
    drift: c.drift,
    rationale: c.rationale
  } : null;

  return {
    routed: true,
    reason: ROUTING_REASON.ROUTED,
    primary: shape(primary),
    secondary: shape(secondary),
    tertiary: shape(tertiary),
    failoverPath,
    retryStrategy,
    routedAt,
    version: CPRM_VERSION
  };
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  CPRM_VERSION,
  ROUTING_REASON,
  DRIFT_PENALTY,
  RETRY_DEFAULTS,
  routeEnvelope
};
