'use strict';

// Phase 3 — Checkpoint 3.5: Federated Evidence Chain Validation
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// Validates all 3.5 deliverables:
//   - evidenceChain.js exports all required functions and constants
//   - createChain: creates a chain with chainId, envelopeId, providers, entries: []
//   - chainId is prefixed with CHAIN-
//   - addEntry: appends new entry with unique entryId prefixed ENTRY-
//   - addEntry: throws on missing provider, type, or ref
//   - updateEntry: updates entry status and payload by entryId
//   - finalizeChain: COMPLETE when all entries collected
//   - finalizeChain: PARTIAL when mix of collected + failed
//   - finalizeChain: FAILED when all entries failed
//   - finalizeChain: COMPLETE for empty entry list
//   - buildChainFromEnvelope: produces entries for execution steps and evidence slots
//   - buildChainFromEnvelope: includes drift entries when severity != NONE
//   - buildChainFromEnvelope: includes failover entries when steps activated
//   - getChainSummary: returns summary with byProvider breakdown
//   - createChain throws on missing envelopeId
//   - createChain throws on empty providers array

const assert = require('assert');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const {
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
} = require('../apps/sentinel/src/federation/evidenceChain');

const {
  createEnvelope,
  DRIFT_SEVERITY,
  ENVELOPE_STATUS,
  FALLBACK_TRIGGER,
  FALLBACK_ACTION,
  transitionEnvelope,
  collectEvidence,
  activateFallback
} = require('../apps/sentinel/src/federation/envelope');

// --- Exports ---

assert(typeof FECS_VERSION === 'string', 'FECS_VERSION exported');
assert(typeof CHAIN_STATUS === 'object', 'CHAIN_STATUS exported');
assert(typeof ENTRY_TYPE === 'object', 'ENTRY_TYPE exported');
assert(typeof ENTRY_STATUS === 'object', 'ENTRY_STATUS exported');
assert(typeof createChain === 'function', 'createChain exported');
assert(typeof addEntry === 'function', 'addEntry exported');
assert(typeof updateEntry === 'function', 'updateEntry exported');
assert(typeof finalizeChain === 'function', 'finalizeChain exported');
assert(typeof buildChainFromEnvelope === 'function', 'buildChainFromEnvelope exported');
assert(typeof getChainSummary === 'function', 'getChainSummary exported');

console.log('  - All FECS exports present ✓');

// --- CHAIN_STATUS values ---

assert(CHAIN_STATUS.OPEN === 'open', 'CHAIN_STATUS.OPEN');
assert(CHAIN_STATUS.COMPLETE === 'complete', 'CHAIN_STATUS.COMPLETE');
assert(CHAIN_STATUS.FAILED === 'failed', 'CHAIN_STATUS.FAILED');
assert(CHAIN_STATUS.PARTIAL === 'partial', 'CHAIN_STATUS.PARTIAL');

console.log('  - CHAIN_STATUS values correct ✓');

// --- ENTRY_TYPE values ---

assert(ENTRY_TYPE.EXECUTION === 'execution', 'ENTRY_TYPE.EXECUTION');
assert(ENTRY_TYPE.DRIFT === 'drift', 'ENTRY_TYPE.DRIFT');
assert(ENTRY_TYPE.FAILOVER === 'failover', 'ENTRY_TYPE.FAILOVER');
assert(ENTRY_TYPE.EVIDENCE === 'evidence', 'ENTRY_TYPE.EVIDENCE');
assert(ENTRY_TYPE.POLICY === 'policy', 'ENTRY_TYPE.POLICY');

console.log('  - ENTRY_TYPE values correct ✓');

// --- createChain: basic creation ---

const chain1 = createChain({ envelopeId: 'FED-ABC123', providers: ['nexus', 'tilda'] });

assert(typeof chain1.chainId === 'string' && chain1.chainId.startsWith('CHAIN-'), 'chainId prefixed with CHAIN-');
assert(chain1.envelopeId === 'FED-ABC123', 'envelopeId preserved');
assert(chain1.version === FECS_VERSION, 'version is FECS_VERSION');
assert(chain1.status === CHAIN_STATUS.OPEN, 'initial status is open');
assert(Array.isArray(chain1.providers) && chain1.providers.length === 2, 'providers array set');
assert(Array.isArray(chain1.entries) && chain1.entries.length === 0, 'entries starts empty');
assert(typeof chain1.createdAt === 'string', 'createdAt set');
assert(chain1.finalizedAt === null, 'finalizedAt is null initially');

console.log('  - createChain: chainId prefixed CHAIN- ✓');
console.log('  - createChain: initial state correct ✓');

// --- createChain throws on missing envelopeId ---

let threwNoEnv = false;
try { createChain({ providers: ['nexus'] }); } catch (e) { threwNoEnv = true; }
assert(threwNoEnv, 'createChain throws on missing envelopeId');

console.log('  - createChain throws on missing envelopeId ✓');

// --- createChain throws on empty providers ---

let threwNoProviders = false;
try { createChain({ envelopeId: 'FED-TEST', providers: [] }); } catch (e) { threwNoProviders = true; }
assert(threwNoProviders, 'createChain throws on empty providers');

console.log('  - createChain throws on empty providers ✓');

// --- addEntry: appends entry ---

const chain2 = addEntry(chain1, {
  provider: 'nexus',
  type: ENTRY_TYPE.EXECUTION,
  ref: 'execution:nexus:step-0',
  status: ENTRY_STATUS.COLLECTED,
  payload: { stepIndex: 0 }
});

assert(chain2.entries.length === 1, 'entry appended');
const e1 = chain2.entries[0];
assert(typeof e1.entryId === 'string' && e1.entryId.startsWith('ENTRY-'), 'entryId prefixed ENTRY-');
assert(e1.provider === 'nexus', 'entry provider set');
assert(e1.type === ENTRY_TYPE.EXECUTION, 'entry type set');
assert(e1.ref === 'execution:nexus:step-0', 'entry ref set');
assert(e1.status === ENTRY_STATUS.COLLECTED, 'entry status set');
assert(typeof e1.timestamp === 'string', 'entry timestamp set');

console.log('  - addEntry: entry appended with unique ENTRY- id ✓');

// --- addEntry: two entries have different IDs ---

const chain3 = addEntry(chain2, {
  provider: 'tilda',
  type: ENTRY_TYPE.EXECUTION,
  ref: 'execution:tilda:step-1',
  status: ENTRY_STATUS.PENDING
});

assert(chain3.entries.length === 2, 'second entry appended');
assert(chain3.entries[0].entryId !== chain3.entries[1].entryId, 'entryIds are unique');

console.log('  - addEntry: entryIds are unique ✓');

// --- addEntry throws on missing provider/type/ref ---

let threwNoProvider = false;
try { addEntry(chain1, { type: 'execution', ref: 'x' }); } catch (e) { threwNoProvider = true; }
assert(threwNoProvider, 'addEntry throws on missing provider');

let threwNoType = false;
try { addEntry(chain1, { provider: 'nexus', ref: 'x' }); } catch (e) { threwNoType = true; }
assert(threwNoType, 'addEntry throws on missing type');

let threwNoRef = false;
try { addEntry(chain1, { provider: 'nexus', type: 'execution' }); } catch (e) { threwNoRef = true; }
assert(threwNoRef, 'addEntry throws on missing ref');

console.log('  - addEntry throws on missing provider, type, ref ✓');

// --- updateEntry: updates status and payload ---

const entryId = chain3.entries[1].entryId;
const chain4 = updateEntry(chain3, entryId, ENTRY_STATUS.COLLECTED, { completedAt: '2026-08-02T00:00:00Z' });

const updated = chain4.entries.find((e) => e.entryId === entryId);
assert(updated.status === ENTRY_STATUS.COLLECTED, 'entry status updated');
assert(updated.payload.completedAt === '2026-08-02T00:00:00Z', 'payload patched');
assert(typeof updated.updatedAt === 'string', 'updatedAt set');

console.log('  - updateEntry: status and payload updated ✓');

// --- finalizeChain: COMPLETE when all collected ---

const allCollected = [chain1, chain1, chain1].reduce((acc, _) =>
  addEntry(acc, { provider: 'nexus', type: ENTRY_TYPE.EXECUTION, ref: `r-${Math.random()}`, status: ENTRY_STATUS.COLLECTED }),
  chain1
);
const finalized1 = finalizeChain(allCollected);
assert(finalized1.status === CHAIN_STATUS.COMPLETE, 'COMPLETE when all collected');
assert(typeof finalized1.finalizedAt === 'string', 'finalizedAt set');

console.log('  - finalizeChain: COMPLETE when all entries collected ✓');

// --- finalizeChain: PARTIAL when mix ---

let mixedChain = addEntry(chain1,
  { provider: 'nexus', type: ENTRY_TYPE.EXECUTION, ref: 'r1', status: ENTRY_STATUS.COLLECTED });
mixedChain = addEntry(mixedChain,
  { provider: 'tilda', type: ENTRY_TYPE.EXECUTION, ref: 'r2', status: ENTRY_STATUS.FAILED });
const finalized2 = finalizeChain(mixedChain);
assert(finalized2.status === CHAIN_STATUS.PARTIAL, 'PARTIAL when mix of collected + failed');

console.log('  - finalizeChain: PARTIAL when mixed collected + failed ✓');

// --- finalizeChain: FAILED when all failed ---

let allFailed = addEntry(chain1,
  { provider: 'nexus', type: ENTRY_TYPE.EXECUTION, ref: 'r1', status: ENTRY_STATUS.FAILED });
allFailed = addEntry(allFailed,
  { provider: 'tilda', type: ENTRY_TYPE.EXECUTION, ref: 'r2', status: ENTRY_STATUS.FAILED });
const finalized3 = finalizeChain(allFailed);
assert(finalized3.status === CHAIN_STATUS.FAILED, 'FAILED when all entries failed');

console.log('  - finalizeChain: FAILED when all entries failed ✓');

// --- finalizeChain: COMPLETE for empty entry list ---

const finalized4 = finalizeChain(chain1);
assert(finalized4.status === CHAIN_STATUS.COMPLETE, 'COMPLETE for empty entry list');

console.log('  - finalizeChain: COMPLETE for empty entry list ✓');

// --- buildChainFromEnvelope: produces entries from execution plan and evidence ---

const testEnvelope = createEnvelope({
  tenant: 'nexus',
  command: 'nexus.command.execute',
  providerSet: [
    { provider: 'nexus', capabilityId: 'NEXUS-EXECUTE-001', endpoint: '/api/v1/execution', priority: 0 },
    { provider: 'tilda', capabilityId: 'TILDA-EXECUTE-001', endpoint: '/api/v1/execution', priority: 1 }
  ],
  capabilityScope: { capabilityId: 'NEXUS-EXECUTE-001', type: 'execute', authority: { minimumRole: 'operator' } },
  policyScope: { requiresApproval: false, complianceGates: [], priority: 'executive-desk' },
  fallbackChain: [
    { provider: 'tilda', trigger: FALLBACK_TRIGGER.HEALTH_BELOW_THRESHOLD, action: FALLBACK_ACTION.REROUTE }
  ],
  driftSeverity: DRIFT_SEVERITY.WARNING
});

// Collect evidence for nexus, activate tilda fallback
const envWithEvidence = collectEvidence(testEnvelope, 'nexus', 'EV-RUN-003-001');
const envWithFallback = activateFallback(envWithEvidence, 'tilda', FALLBACK_TRIGGER.HEALTH_BELOW_THRESHOLD, 'Tilda degraded');

const builtChain = buildChainFromEnvelope(envWithFallback);

assert(builtChain.envelopeId === testEnvelope.envelopeId, 'chain envelopeId matches envelope');
assert(builtChain.entries.length > 0, 'chain has entries');
assert(builtChain.providers.includes('nexus'), 'nexus in providers');
assert(builtChain.providers.includes('tilda'), 'tilda in providers');

// Execution entries
const execEntries = builtChain.entries.filter((e) => e.type === ENTRY_TYPE.EXECUTION);
assert(execEntries.length >= 2, 'at least 2 execution entries (one per provider)');

// Evidence entry for nexus (collected)
const evidenceEntry = builtChain.entries.find((e) => e.type === ENTRY_TYPE.EVIDENCE && e.provider === 'nexus');
assert(evidenceEntry, 'evidence entry for nexus present');

// Drift entries for WARNING severity
const driftEntries = builtChain.entries.filter((e) => e.type === ENTRY_TYPE.DRIFT);
assert(driftEntries.length > 0, 'drift entries present for WARNING severity');

// Failover entry for activated tilda step
const failoverEntry = builtChain.entries.find((e) => e.type === ENTRY_TYPE.FAILOVER && e.provider === 'tilda');
assert(failoverEntry, 'failover entry for tilda present');
assert(failoverEntry.payload.trigger === FALLBACK_TRIGGER.HEALTH_BELOW_THRESHOLD, 'failover trigger correct');

console.log('  - buildChainFromEnvelope: execution entries generated ✓');
console.log('  - buildChainFromEnvelope: evidence entry for collected provider ✓');
console.log('  - buildChainFromEnvelope: drift entries for WARNING severity ✓');
console.log('  - buildChainFromEnvelope: failover entry for activated step ✓');

// --- getChainSummary: returns summary with byProvider breakdown ---

const summary = getChainSummary(builtChain);

assert(summary.chainId === builtChain.chainId, 'summary.chainId matches');
assert(summary.envelopeId === testEnvelope.envelopeId, 'summary.envelopeId matches');
assert(typeof summary.totalEntries === 'number' && summary.totalEntries > 0, 'summary.totalEntries set');
assert(typeof summary.byProvider === 'object', 'summary.byProvider is object');
assert(typeof summary.byProvider.nexus === 'object', 'byProvider.nexus present');
assert(typeof summary.byProvider.tilda === 'object', 'byProvider.tilda present');
assert(Array.isArray(summary.providers), 'summary.providers is array');

console.log('  - getChainSummary: summary with byProvider breakdown ✓');

// --- chainId uniqueness ---

const c1 = createChain({ envelopeId: 'FED-X', providers: ['nexus'] });
const c2 = createChain({ envelopeId: 'FED-X', providers: ['nexus'] });
assert(c1.chainId !== c2.chainId, 'chainIds are unique');

console.log('  - chainId is unique ✓');

console.log('\nALL CHECKPOINT 3.5 — FEDERATED EVIDENCE CHAIN CHECKS PASSED ✓');
