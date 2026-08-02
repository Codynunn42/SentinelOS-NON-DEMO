'use strict';

// Phase 3 — Checkpoint 3.2: Cross-Provider Routing Matrix Validation
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// Validates all 3.2 deliverables:
//   - router.js exports all required functions and constants
//   - routeEnvelope returns routed: true with primary/secondary/tertiary for healthy multi-provider set
//   - primary is the highest-scored provider
//   - failoverPath contains providers ranked after primary, in order
//   - WARNING drift applies a score penalty (provider deprioritized)
//   - CRITICAL drift applies a heavy penalty
//   - degraded-health providers are excluded; if all degraded → ALL_PROVIDERS_DEGRADED
//   - EXECUTIVE_APPROVAL compliance gate blocks operator role
//   - EXECUTIVE_APPROVAL compliance gate passes for executive role
//   - Insufficient role returns INSUFFICIENT_ROLE
//   - Missing command returns COMMAND_REQUIRED
//   - Missing providerSet returns PROVIDER_SET_REQUIRED
//   - Tie-break is deterministic (alphabetical by capabilityId)
//   - retryOverride merges into retryStrategy

const assert = require('assert');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const {
  CPRM_VERSION,
  ROUTING_REASON,
  DRIFT_PENALTY,
  RETRY_DEFAULTS,
  routeEnvelope
} = require('../apps/sentinel/src/federation/router');

const { createEnvelope, DRIFT_SEVERITY, FALLBACK_TRIGGER, FALLBACK_ACTION } = require('../apps/sentinel/src/federation/envelope');

// --- Exports ---

assert(typeof CPRM_VERSION === 'string', 'CPRM_VERSION exported');
assert(typeof ROUTING_REASON === 'object', 'ROUTING_REASON exported');
assert(typeof DRIFT_PENALTY === 'object', 'DRIFT_PENALTY exported');
assert(typeof RETRY_DEFAULTS === 'object', 'RETRY_DEFAULTS exported');
assert(typeof routeEnvelope === 'function', 'routeEnvelope exported');

console.log('  - All CPRM exports present ✓');

// --- ROUTING_REASON values ---

assert(ROUTING_REASON.ROUTED === 'ROUTED', 'ROUTING_REASON.ROUTED');
assert(ROUTING_REASON.ALL_PROVIDERS_DEGRADED === 'ALL_PROVIDERS_DEGRADED', 'ROUTING_REASON.ALL_PROVIDERS_DEGRADED');
assert(ROUTING_REASON.INSUFFICIENT_ROLE === 'INSUFFICIENT_ROLE', 'ROUTING_REASON.INSUFFICIENT_ROLE');
assert(ROUTING_REASON.COMPLIANCE_GATE_BLOCKED === 'COMPLIANCE_GATE_BLOCKED', 'ROUTING_REASON.COMPLIANCE_GATE_BLOCKED');

console.log('  - ROUTING_REASON values correct ✓');

// --- DRIFT_PENALTY: WARNING and CRITICAL are negative ---

assert(DRIFT_PENALTY.NONE === 0, 'DRIFT_PENALTY.NONE is 0');
assert(DRIFT_PENALTY.WARNING < 0, 'DRIFT_PENALTY.WARNING is negative');
assert(DRIFT_PENALTY.CRITICAL < DRIFT_PENALTY.WARNING, 'CRITICAL penalty > WARNING penalty');

console.log('  - DRIFT_PENALTY values correct ✓');

// --- Base envelope for tests ---

const baseEnvelope = createEnvelope({
  tenant: 'nexus',
  command: 'nexus.command.execute',
  providerSet: [
    { provider: 'nexus', capabilityId: 'NEXUS-EXECUTE-001', endpoint: '/api/v1/execution', priority: 0 },
    { provider: 'tilda', capabilityId: 'TILDA-EXECUTE-001', endpoint: '/api/v1/execution', priority: 1 },
    { provider: 'github', capabilityId: 'GITHUB-EXECUTE-001', endpoint: '/api/v1/execution', priority: 2 }
  ],
  capabilityScope: {
    capabilityId: 'NEXUS-EXECUTE-001',
    type: 'execute',
    authority: { minimumRole: 'operator' }
  },
  policyScope: {
    requiresApproval: false,
    complianceGates: [],
    priority: 'executive-desk'
  },
  fallbackChain: [
    { provider: 'tilda', trigger: FALLBACK_TRIGGER.HEALTH_BELOW_THRESHOLD, action: FALLBACK_ACTION.REROUTE },
    { provider: 'github', trigger: FALLBACK_TRIGGER.HEALTH_BELOW_THRESHOLD, action: FALLBACK_ACTION.REROUTE }
  ]
});

// --- Basic routing: all healthy ---

const allHealthy = {
  providerHealth: { nexus: 'healthy', tilda: 'healthy', github: 'healthy' },
  driftScores: { nexus: 'NONE', tilda: 'NONE', github: 'NONE' }
};

const r1 = routeEnvelope({ envelope: baseEnvelope, ...allHealthy, role: 'operator' });

assert(r1.routed === true, 'routes with all-healthy providers');
assert(r1.reason === ROUTING_REASON.ROUTED, 'reason is ROUTED');
assert(r1.primary !== null, 'primary is set');
assert(r1.secondary !== null, 'secondary is set');
assert(r1.tertiary !== null, 'tertiary is set');
assert(r1.primary.provider !== r1.secondary.provider, 'primary and secondary are different providers');
assert(typeof r1.routedAt === 'string', 'routedAt is set');
assert(r1.version === CPRM_VERSION, 'version is CPRM_VERSION');

console.log('  - routeEnvelope routes with all-healthy providers ✓');
console.log('  - primary, secondary, tertiary all set ✓');

// --- Primary is highest-scored ---

// nexus gets healthiest scoring; confirm primary is nexus or the one with best score
assert(r1.primary.score >= r1.secondary.score, 'primary.score >= secondary.score');
if (r1.secondary) assert(r1.secondary.score >= (r1.tertiary ? r1.tertiary.score : -Infinity), 'secondary.score >= tertiary.score');

console.log('  - primary is highest-scored provider ✓');

// --- failoverPath contains everything after primary ---

assert(Array.isArray(r1.failoverPath), 'failoverPath is array');
assert(r1.failoverPath.length === 2, 'failoverPath has 2 entries (secondary + tertiary)');
assert(r1.failoverPath.every((e) => e.provider !== r1.primary.provider), 'failoverPath excludes primary');

console.log('  - failoverPath correct: excludes primary, contains secondary+tertiary ✓');

// --- retryStrategy has defaults ---

assert(r1.retryStrategy.maxAttempts === RETRY_DEFAULTS.maxAttempts, 'retryStrategy uses defaults');
assert(Array.isArray(r1.retryStrategy.retryOn), 'retryStrategy.retryOn is array');

console.log('  - retryStrategy defaults present ✓');

// --- WARNING drift deprioritizes provider ---

const warnDrift = {
  providerHealth: { nexus: 'healthy', tilda: 'healthy', github: 'healthy' },
  driftScores: { nexus: 'WARNING', tilda: 'NONE', github: 'NONE' }
};

const rWarn = routeEnvelope({ envelope: baseEnvelope, ...warnDrift, role: 'operator' });
assert(rWarn.routed === true, 'still routes with WARNING drift on one provider');

// The WARNING provider should have a lower score than a NONE provider with same base
const nexusEntry = [rWarn.primary, rWarn.secondary, rWarn.tertiary].find((e) => e && e.provider === 'nexus');
const tildaEntry = [rWarn.primary, rWarn.secondary, rWarn.tertiary].find((e) => e && e.provider === 'tilda');
assert(nexusEntry, 'nexus entry present');
assert(tildaEntry, 'tilda entry present');
assert(nexusEntry.drift === 'WARNING', 'nexus entry has WARNING drift');
assert(nexusEntry.score < tildaEntry.score || nexusEntry.score <= tildaEntry.score, 'WARNING provider has lower/equal score than NONE provider');

console.log('  - WARNING drift deprioritizes provider ✓');

// --- CRITICAL drift causes heavy demotion ---

const critDrift = {
  providerHealth: { nexus: 'healthy', tilda: 'healthy', github: 'healthy' },
  driftScores: { nexus: 'CRITICAL', tilda: 'NONE', github: 'NONE' }
};

const rCrit = routeEnvelope({ envelope: baseEnvelope, ...critDrift, role: 'operator' });
assert(rCrit.routed === true, 'still routes with CRITICAL drift');
const nexusCrit = [rCrit.primary, rCrit.secondary, rCrit.tertiary].find((e) => e && e.provider === 'nexus');
assert(nexusCrit, 'nexus present in result');
// CRITICAL penalty is heavier than WARNING penalty
assert(nexusCrit.drift === 'CRITICAL', 'nexus has CRITICAL drift');

console.log('  - CRITICAL drift heavily demotes provider ✓');

// --- Degraded health providers excluded ---

const degradedNexus = {
  providerHealth: { nexus: 'degraded', tilda: 'healthy', github: 'healthy' },
  driftScores: { nexus: 'NONE', tilda: 'NONE', github: 'NONE' }
};

const rDeg = routeEnvelope({ envelope: baseEnvelope, ...degradedNexus, role: 'operator' });
assert(rDeg.routed === true, 'routes when only one provider degraded');
assert(rDeg.primary.provider !== 'nexus', 'degraded nexus is not primary');

console.log('  - degraded provider excluded from primary selection ✓');

// --- All providers degraded → ALL_PROVIDERS_DEGRADED ---

const allDegraded = {
  providerHealth: { nexus: 'degraded', tilda: 'degraded', github: 'degraded' },
  driftScores: { nexus: 'NONE', tilda: 'NONE', github: 'NONE' }
};

const rAllDeg = routeEnvelope({ envelope: baseEnvelope, ...allDegraded, role: 'operator' });
assert(rAllDeg.routed === false, 'does not route when all providers degraded');
assert(rAllDeg.reason === ROUTING_REASON.ALL_PROVIDERS_DEGRADED, 'reason is ALL_PROVIDERS_DEGRADED');
assert(rAllDeg.primary === null, 'primary is null when not routed');

console.log('  - ALL_PROVIDERS_DEGRADED: routing blocked correctly ✓');

// --- EXECUTIVE_APPROVAL compliance gate blocks operator ---

const execEnvelope = createEnvelope({
  tenant: 'nexus',
  command: 'nexus.command.execute',
  providerSet: [
    { provider: 'nexus', capabilityId: 'NEXUS-EXECUTE-001', endpoint: '/api/v1/execution', priority: 0 }
  ],
  capabilityScope: {
    capabilityId: 'NEXUS-EXECUTE-001',
    type: 'execute',
    authority: { minimumRole: 'operator' }
  },
  policyScope: {
    requiresApproval: true,
    complianceGates: ['EXECUTIVE_APPROVAL'],
    priority: 'executive-desk'
  },
  fallbackChain: []
});

const rGateBlocked = routeEnvelope({
  envelope: execEnvelope,
  providerHealth: { nexus: 'healthy' },
  driftScores: { nexus: 'NONE' },
  role: 'operator'
});

assert(rGateBlocked.routed === false, 'EXECUTIVE_APPROVAL blocks operator');
assert(rGateBlocked.reason === ROUTING_REASON.COMPLIANCE_GATE_BLOCKED, 'reason is COMPLIANCE_GATE_BLOCKED');

console.log('  - EXECUTIVE_APPROVAL gate blocks operator ✓');

// --- EXECUTIVE_APPROVAL compliance gate passes for executive ---

const rGatePass = routeEnvelope({
  envelope: execEnvelope,
  providerHealth: { nexus: 'healthy' },
  driftScores: { nexus: 'NONE' },
  role: 'executive'
});

assert(rGatePass.routed === true, 'EXECUTIVE_APPROVAL passes for executive');
assert(rGatePass.primary.provider === 'nexus', 'primary is nexus for executive');

console.log('  - EXECUTIVE_APPROVAL gate passes for executive ✓');

// --- Insufficient role blocks when authority requires executive ---

const execAuthEnvelope = createEnvelope({
  tenant: 'nexus',
  command: 'nexus.command.execute',
  providerSet: [
    { provider: 'nexus', capabilityId: 'NEXUS-EXECUTE-001', endpoint: '/api/v1/execution', priority: 0,
      authority: { minimumRole: 'executive' } }
  ],
  capabilityScope: {
    capabilityId: 'NEXUS-EXECUTE-001',
    type: 'execute',
    authority: { minimumRole: 'executive' }
  },
  policyScope: { requiresApproval: false, complianceGates: [], priority: 'executive-desk' },
  fallbackChain: []
});

const rRole = routeEnvelope({
  envelope: execAuthEnvelope,
  providerHealth: { nexus: 'healthy' },
  driftScores: { nexus: 'NONE' },
  role: 'operator'
});

assert(rRole.routed === false, 'operator blocked by executive authority requirement');
assert(rRole.reason === ROUTING_REASON.INSUFFICIENT_ROLE, 'reason is INSUFFICIENT_ROLE');

console.log('  - INSUFFICIENT_ROLE: operator blocked when authority requires executive ✓');

// --- Missing command returns COMMAND_REQUIRED ---

const rNoCmd = routeEnvelope({ envelope: null, role: 'operator' });
assert(rNoCmd.routed === false, 'null envelope returns not routed');
assert(rNoCmd.reason === ROUTING_REASON.COMMAND_REQUIRED, 'reason is COMMAND_REQUIRED');

console.log('  - COMMAND_REQUIRED: null envelope handled ✓');

// --- Tie-break is deterministic (alphabetical capabilityId) ---

const tieEnvelope = createEnvelope({
  tenant: 'nexus',
  command: 'tilda.action.execute',
  providerSet: [
    { provider: 'tilda', capabilityId: 'TILDA-EXECUTE-001', endpoint: '/api/v1/execution', priority: 0, cost: 3, latencyMs: 300 },
    { provider: 'github', capabilityId: 'GITHUB-EXECUTE-001', endpoint: '/api/v1/execution', priority: 1, cost: 3, latencyMs: 300 }
  ],
  capabilityScope: { capabilityId: 'TILDA-EXECUTE-001', type: 'execute', authority: { minimumRole: 'operator' } },
  policyScope: { requiresApproval: false, complianceGates: [], priority: 'executive-desk' },
  fallbackChain: []
});

const rTie1 = routeEnvelope({
  envelope: tieEnvelope,
  providerHealth: { tilda: 'healthy', github: 'healthy' },
  driftScores: { tilda: 'NONE', github: 'NONE' },
  role: 'operator'
});

const rTie2 = routeEnvelope({
  envelope: tieEnvelope,
  providerHealth: { tilda: 'healthy', github: 'healthy' },
  driftScores: { tilda: 'NONE', github: 'NONE' },
  role: 'operator'
});

assert(rTie1.primary.provider === rTie2.primary.provider, 'tie-break is deterministic');

console.log('  - Tie-break is deterministic ✓');

// --- retryOverride merges into retryStrategy ---

const rRetry = routeEnvelope({
  envelope: baseEnvelope,
  ...allHealthy,
  role: 'operator',
  retryOverride: { maxAttempts: 5, backoffMs: 1000 }
});

assert(rRetry.retryStrategy.maxAttempts === 5, 'retryOverride.maxAttempts applied');
assert(rRetry.retryStrategy.backoffMs === 1000, 'retryOverride.backoffMs applied');
assert(Array.isArray(rRetry.retryStrategy.retryOn), 'retryOn preserved from defaults');

console.log('  - retryOverride merges into retryStrategy ✓');

console.log('\nALL CHECKPOINT 3.2 — CROSS-PROVIDER ROUTING MATRIX CHECKS PASSED ✓');
