'use strict';

// Phase 4 — Checkpoint 4.2: Sovereign Evidence Ledger (SEL) Validation
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// Validates all 4.2 deliverables:
//   - ledger.js exports all required functions and constants
//   - SEL_VERSION is a string
//   - LEDGER_STATUS, ENTRY_TYPE, DRIFT_CLASS constants correct
//   - GENESIS_HASH is a 64-char zero string
//   - createSovereignLedger: ledgerId prefixed SEL-, initial state correct
//   - createSovereignLedger: two calls produce unique ledgerIds
//   - appendEntry: entry appended with SOV-ENTRY- prefix
//   - appendEntry: entry has signature, prevHash, and hash
//   - appendEntry: first entry prevHash equals GENESIS_HASH
//   - appendEntry: subsequent entry prevHash equals previous entry hash
//   - appendEntry: throws when appending to a sealed ledger
//   - appendEntry: throws on missing provider
//   - appendEntry: throws on missing type
//   - appendEntry: throws on missing ref
//   - appendEntry: idempotent — same ref is a no-op
//   - appendEntry: providers list updated when new provider appended
//   - appendEntry: driftClass promoted on CRITICAL severity entry
//   - appendEntry: headHash updated after each append
//   - sealLedger: status moves to sealed
//   - sealLedger: sealedAt timestamp set
//   - sealLedger: idempotent on already-sealed ledger
//   - verifyLedgerIntegrity: valid for empty ledger
//   - verifyLedgerIntegrity: valid for correctly chained ledger
//   - verifyLedgerIntegrity: detects tampered payload (HASH_MISMATCH or SIGNATURE_INVALID)
//   - verifyLedgerIntegrity: detects broken chain (CHAIN_BROKEN)
//   - verifyLedgerIntegrity: detects wrong headHash
//   - stitchProviderLedgers: all entries from both ledgers appear in stitched ledger
//   - stitchProviderLedgers: stitched ledger has union of providers
//   - stitchProviderLedgers: throws on empty provider ledgers
//   - getLedgerSummary: returns correct totalEntries, byProvider, byType
//   - getLedgerSummary: driftClass reflects highest severity entry
//   - buildLedgerFromChain: produces one sovereign entry per FECS chain entry
//   - buildLedgerFromChain: chainId bound to each entry
//   - buildLedgerFromChain: drift entries classified as drift DRIFT_CLASS
//   - buildLedgerFromChain: throws on missing chain
//   - full seal + verify round-trip passes integrity check

const assert = require('assert');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const {
  SEL_VERSION,
  LEDGER_STATUS,
  ENTRY_TYPE,
  DRIFT_CLASS,
  GENESIS_HASH,
  createSovereignLedger,
  appendEntry,
  sealLedger,
  verifyLedgerIntegrity,
  stitchProviderLedgers,
  getLedgerSummary,
  buildLedgerFromChain
} = require('../apps/sentinel/src/sovereign/ledger');

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

assert(typeof SEL_VERSION === 'string', 'SEL_VERSION exported');
assert(typeof LEDGER_STATUS === 'object', 'LEDGER_STATUS exported');
assert(typeof ENTRY_TYPE === 'object', 'ENTRY_TYPE exported');
assert(typeof DRIFT_CLASS === 'object', 'DRIFT_CLASS exported');
assert(typeof GENESIS_HASH === 'string' && GENESIS_HASH.length === 64, 'GENESIS_HASH is 64-char string');
assert(typeof createSovereignLedger === 'function', 'createSovereignLedger exported');
assert(typeof appendEntry === 'function', 'appendEntry exported');
assert(typeof sealLedger === 'function', 'sealLedger exported');
assert(typeof verifyLedgerIntegrity === 'function', 'verifyLedgerIntegrity exported');
assert(typeof stitchProviderLedgers === 'function', 'stitchProviderLedgers exported');
assert(typeof getLedgerSummary === 'function', 'getLedgerSummary exported');
assert(typeof buildLedgerFromChain === 'function', 'buildLedgerFromChain exported');

console.log('  - All SEL exports present ✓');

// ---------------------------------------------------------------------------
// Constant values
// ---------------------------------------------------------------------------

assert(LEDGER_STATUS.OPEN === 'open', 'LEDGER_STATUS.OPEN');
assert(LEDGER_STATUS.SEALED === 'sealed', 'LEDGER_STATUS.SEALED');
assert(LEDGER_STATUS.CORRUPT === 'corrupt', 'LEDGER_STATUS.CORRUPT');

assert(ENTRY_TYPE.EXECUTION === 'execution', 'ENTRY_TYPE.EXECUTION');
assert(ENTRY_TYPE.EVIDENCE === 'evidence', 'ENTRY_TYPE.EVIDENCE');
assert(ENTRY_TYPE.POLICY === 'policy', 'ENTRY_TYPE.POLICY');
assert(ENTRY_TYPE.DRIFT === 'drift', 'ENTRY_TYPE.DRIFT');
assert(ENTRY_TYPE.FAILOVER === 'failover', 'ENTRY_TYPE.FAILOVER');
assert(ENTRY_TYPE.RECEIPT === 'receipt', 'ENTRY_TYPE.RECEIPT');

assert(DRIFT_CLASS.NONE === 'none', 'DRIFT_CLASS.NONE');
assert(DRIFT_CLASS.INFO === 'info', 'DRIFT_CLASS.INFO');
assert(DRIFT_CLASS.WARNING === 'warning', 'DRIFT_CLASS.WARNING');
assert(DRIFT_CLASS.CRITICAL === 'critical', 'DRIFT_CLASS.CRITICAL');

assert(/^0+$/.test(GENESIS_HASH), 'GENESIS_HASH is all zeros');

console.log('  - Constant values correct ✓');

// ---------------------------------------------------------------------------
// createSovereignLedger
// ---------------------------------------------------------------------------

const L1 = createSovereignLedger({ envelopeId: 'FED-TEST-001', providers: ['nexus', 'tilda'] });

assert(typeof L1.ledgerId === 'string' && L1.ledgerId.startsWith('SEL-'), 'ledgerId prefixed SEL-');
assert(L1.envelopeId === 'FED-TEST-001', 'envelopeId stored');
assert(L1.version === SEL_VERSION, 'version is SEL_VERSION');
assert(L1.status === LEDGER_STATUS.OPEN, 'initial status is open');
assert(Array.isArray(L1.providers) && L1.providers.length === 2, 'providers stored');
assert(Array.isArray(L1.entries) && L1.entries.length === 0, 'entries starts empty');
assert(L1.headHash === null, 'headHash is null initially');
assert(L1.sealedAt === null, 'sealedAt is null initially');
assert(L1.driftClass === DRIFT_CLASS.NONE, 'driftClass starts none');
assert(typeof L1.createdAt === 'string', 'createdAt set');

console.log('  - createSovereignLedger: ledgerId prefixed SEL- ✓');
console.log('  - createSovereignLedger: initial state correct ✓');

// unique IDs
const L2 = createSovereignLedger();
assert(L1.ledgerId !== L2.ledgerId, 'ledgerIds are unique');
console.log('  - createSovereignLedger: ledgerIds are unique ✓');

// ---------------------------------------------------------------------------
// appendEntry — basic append
// ---------------------------------------------------------------------------

const SIGNING_KEY = 'test-sovereign-signing-key-phase4';

let ledger = createSovereignLedger({ envelopeId: 'FED-TEST-001', providers: ['nexus'] });

ledger = appendEntry(ledger, {
  provider: 'nexus',
  type: ENTRY_TYPE.EXECUTION,
  ref: 'execution:nexus:step-0',
  payload: { stepIndex: 0 }
}, SIGNING_KEY);

assert(ledger.entries.length === 1, 'entry appended');
const e1 = ledger.entries[0];
assert(typeof e1.entryId === 'string' && e1.entryId.startsWith('SOV-ENTRY-'), 'entryId prefixed SOV-ENTRY-');
assert(e1.provider === 'nexus', 'provider stored');
assert(e1.type === ENTRY_TYPE.EXECUTION, 'type stored');
assert(e1.ref === 'execution:nexus:step-0', 'ref stored');
assert(typeof e1.signature === 'string' && e1.signature.length > 0, 'signature present');
assert(e1.prevHash === GENESIS_HASH, 'first entry prevHash is GENESIS_HASH');
assert(typeof e1.hash === 'string' && e1.hash.length === 64, 'hash is 64-char hex');
assert(ledger.headHash === e1.hash, 'headHash updated to first entry hash');
assert(typeof e1.timestamp === 'string', 'timestamp set');
assert(e1.driftClass === DRIFT_CLASS.NONE, 'driftClass is none for no-drift entry');

console.log('  - appendEntry: entry appended with SOV-ENTRY- prefix ✓');
console.log('  - appendEntry: entry has signature, prevHash, and hash ✓');
console.log('  - appendEntry: first entry prevHash equals GENESIS_HASH ✓');
console.log('  - appendEntry: headHash updated after append ✓');

// ---------------------------------------------------------------------------
// appendEntry — chain linkage
// ---------------------------------------------------------------------------

ledger = appendEntry(ledger, {
  provider: 'tilda',
  type: ENTRY_TYPE.EVIDENCE,
  ref: 'evidence:tilda:EV-002',
  payload: { collected: true }
}, SIGNING_KEY);

const e2 = ledger.entries[1];
assert(e2.prevHash === e1.hash, 'second entry prevHash equals first entry hash');
assert(ledger.headHash === e2.hash, 'headHash updated to second entry hash');
assert(ledger.providers.includes('tilda'), 'tilda added to providers after new-provider append');

console.log('  - appendEntry: subsequent entry prevHash equals previous entry hash ✓');
console.log('  - appendEntry: providers list updated when new provider appended ✓');

// ---------------------------------------------------------------------------
// appendEntry — drift classification
// ---------------------------------------------------------------------------

let ledgerDrift = createSovereignLedger();
ledgerDrift = appendEntry(ledgerDrift, {
  provider: 'nexus',
  type: ENTRY_TYPE.DRIFT,
  ref: 'drift:nexus:CRITICAL-001',
  driftSeverity: 'CRITICAL'
}, SIGNING_KEY);

assert(ledgerDrift.entries[0].driftClass === DRIFT_CLASS.CRITICAL, 'CRITICAL entry driftClass is critical');
assert(ledgerDrift.driftClass === DRIFT_CLASS.CRITICAL, 'ledger driftClass promoted to critical');
console.log('  - appendEntry: driftClass promoted on CRITICAL severity entry ✓');

// ---------------------------------------------------------------------------
// appendEntry — idempotent
// ---------------------------------------------------------------------------

const ledgerBefore = JSON.stringify(ledger.entries.length);
const ledgerAfter = appendEntry(ledger, {
  provider: 'nexus',
  type: ENTRY_TYPE.EXECUTION,
  ref: 'execution:nexus:step-0', // duplicate ref
  payload: {}
}, SIGNING_KEY);
assert(ledgerAfter.entries.length === ledger.entries.length, 'duplicate ref is a no-op');
console.log('  - appendEntry: idempotent — same ref is a no-op ✓');

// ---------------------------------------------------------------------------
// appendEntry — guard: sealed ledger
// ---------------------------------------------------------------------------

const sealedLedger = sealLedger(ledger);
let threwOnSealed = false;
try {
  appendEntry(sealedLedger, { provider: 'nexus', type: ENTRY_TYPE.EXECUTION, ref: 'new-ref' }, SIGNING_KEY);
} catch (e) {
  threwOnSealed = e.message === 'SEL_LEDGER_SEALED';
}
assert(threwOnSealed, 'throws SEL_LEDGER_SEALED on sealed ledger');
console.log('  - appendEntry: throws when appending to a sealed ledger ✓');

// ---------------------------------------------------------------------------
// appendEntry — guards: missing fields
// ---------------------------------------------------------------------------

let threwNoProvider = false;
try { appendEntry(ledger, { type: ENTRY_TYPE.EXECUTION, ref: 'x' }, SIGNING_KEY); } catch (e) { threwNoProvider = true; }
assert(threwNoProvider, 'throws on missing provider');
console.log('  - appendEntry: throws on missing provider ✓');

let threwNoType = false;
try { appendEntry(ledger, { provider: 'nexus', ref: 'x' }, SIGNING_KEY); } catch (e) { threwNoType = true; }
assert(threwNoType, 'throws on missing type');
console.log('  - appendEntry: throws on missing type ✓');

let threwNoRef = false;
try { appendEntry(ledger, { provider: 'nexus', type: ENTRY_TYPE.EXECUTION }, SIGNING_KEY); } catch (e) { threwNoRef = true; }
assert(threwNoRef, 'throws on missing ref');
console.log('  - appendEntry: throws on missing ref ✓');

// ---------------------------------------------------------------------------
// sealLedger
// ---------------------------------------------------------------------------

const sealed1 = sealLedger(ledger);
assert(sealed1.status === LEDGER_STATUS.SEALED, 'status moves to sealed');
assert(typeof sealed1.sealedAt === 'string', 'sealedAt timestamp set');
console.log('  - sealLedger: status moves to sealed ✓');
console.log('  - sealLedger: sealedAt timestamp set ✓');

// idempotent
const sealed2 = sealLedger(sealed1);
assert(sealed2.status === LEDGER_STATUS.SEALED, 'sealLedger is idempotent');
assert(sealed2.sealedAt === sealed1.sealedAt, 'sealedAt unchanged on idempotent seal');
console.log('  - sealLedger: idempotent on already-sealed ledger ✓');

// ---------------------------------------------------------------------------
// verifyLedgerIntegrity — empty ledger
// ---------------------------------------------------------------------------

const emptyLedger = createSovereignLedger();
const verifyEmpty = verifyLedgerIntegrity(emptyLedger, SIGNING_KEY);
assert(verifyEmpty.valid === true, 'empty ledger is valid');
assert(verifyEmpty.reason === null, 'no reason for valid empty ledger');
console.log('  - verifyLedgerIntegrity: valid for empty ledger ✓');

// ---------------------------------------------------------------------------
// verifyLedgerIntegrity — valid multi-entry ledger
// ---------------------------------------------------------------------------

let verifyLedger = createSovereignLedger({ envelopeId: 'VFY-001' });
verifyLedger = appendEntry(verifyLedger, {
  provider: 'nexus', type: ENTRY_TYPE.EXECUTION, ref: 'exec:nexus:v1', payload: { step: 0 }
}, SIGNING_KEY);
verifyLedger = appendEntry(verifyLedger, {
  provider: 'tilda', type: ENTRY_TYPE.EVIDENCE, ref: 'evidence:tilda:v1', payload: { ok: true }
}, SIGNING_KEY);
verifyLedger = appendEntry(verifyLedger, {
  provider: 'nexus', type: ENTRY_TYPE.RECEIPT, ref: 'receipt:nexus:v1', payload: { receiptId: 'R-001' }
}, SIGNING_KEY);

const verifyResult = verifyLedgerIntegrity(verifyLedger, SIGNING_KEY);
assert(verifyResult.valid === true, 'valid correctly chained ledger');
assert(verifyResult.reason === null, 'no reason for valid ledger');
console.log('  - verifyLedgerIntegrity: valid for correctly chained ledger ✓');

// ---------------------------------------------------------------------------
// verifyLedgerIntegrity — tampered payload
// ---------------------------------------------------------------------------

const tamperedLedger = JSON.parse(JSON.stringify(verifyLedger));
tamperedLedger.entries[1].payload = { tampered: true };

const tamperResult = verifyLedgerIntegrity(tamperedLedger, SIGNING_KEY);
assert(tamperResult.valid === false, 'tampered payload detected');
assert(
  tamperResult.reason === 'HASH_MISMATCH' || tamperResult.reason === 'SIGNATURE_INVALID',
  `tamper reason is HASH_MISMATCH or SIGNATURE_INVALID (got: ${tamperResult.reason})`
);
assert(typeof tamperResult.corruptEntryId === 'string', 'corruptEntryId set');
console.log('  - verifyLedgerIntegrity: detects tampered payload ✓');

// ---------------------------------------------------------------------------
// verifyLedgerIntegrity — broken chain (prevHash mismatch)
// ---------------------------------------------------------------------------

const brokenChain = JSON.parse(JSON.stringify(verifyLedger));
brokenChain.entries[2].prevHash = 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';

const brokenResult = verifyLedgerIntegrity(brokenChain, SIGNING_KEY);
assert(brokenResult.valid === false, 'broken chain detected');
assert(
  brokenResult.reason === 'CHAIN_BROKEN' || brokenResult.reason === 'SIGNATURE_INVALID' || brokenResult.reason === 'HASH_MISMATCH',
  `broken chain reason expected (got: ${brokenResult.reason})`
);
console.log('  - verifyLedgerIntegrity: detects broken chain ✓');

// ---------------------------------------------------------------------------
// verifyLedgerIntegrity — wrong headHash
// ---------------------------------------------------------------------------

const wrongHead = JSON.parse(JSON.stringify(verifyLedger));
wrongHead.headHash = 'aaaa'.repeat(16);

const wrongHeadResult = verifyLedgerIntegrity(wrongHead, SIGNING_KEY);
assert(wrongHeadResult.valid === false, 'wrong headHash detected');
console.log('  - verifyLedgerIntegrity: detects wrong headHash ✓');

// ---------------------------------------------------------------------------
// stitchProviderLedgers
// ---------------------------------------------------------------------------

let nexusLedger = createSovereignLedger({ envelopeId: 'STITCH-001', providers: ['nexus'] });
nexusLedger = appendEntry(nexusLedger, {
  provider: 'nexus', type: ENTRY_TYPE.EXECUTION, ref: 'exec:nexus:s1', payload: {}
}, SIGNING_KEY);
nexusLedger = appendEntry(nexusLedger, {
  provider: 'nexus', type: ENTRY_TYPE.RECEIPT, ref: 'receipt:nexus:r1', payload: {}
}, SIGNING_KEY);

let tildaLedger = createSovereignLedger({ envelopeId: 'STITCH-001', providers: ['tilda'] });
tildaLedger = appendEntry(tildaLedger, {
  provider: 'tilda', type: ENTRY_TYPE.EXECUTION, ref: 'exec:tilda:s1', payload: {}
}, SIGNING_KEY);

const stitched = stitchProviderLedgers([nexusLedger, tildaLedger], {
  envelopeId: 'STITCH-001',
  signingKey: SIGNING_KEY
});

assert(stitched.entries.length === 3, 'stitched ledger has all 3 entries');
assert(stitched.providers.includes('nexus'), 'nexus in stitched providers');
assert(stitched.providers.includes('tilda'), 'tilda in stitched providers');

// Verify stitched chain integrity
const stitchedVerify = verifyLedgerIntegrity(stitched, SIGNING_KEY);
assert(stitchedVerify.valid === true, 'stitched ledger passes integrity check');
console.log('  - stitchProviderLedgers: all entries from both ledgers appear ✓');
console.log('  - stitchProviderLedgers: stitched ledger has union of providers ✓');

// throws on empty
let threwEmptyStitch = false;
try { stitchProviderLedgers([], {}); } catch (e) { threwEmptyStitch = true; }
assert(threwEmptyStitch, 'throws on empty provider ledgers');
console.log('  - stitchProviderLedgers: throws on empty provider ledgers ✓');

// ---------------------------------------------------------------------------
// getLedgerSummary
// ---------------------------------------------------------------------------

let summaryLedger = createSovereignLedger({ envelopeId: 'SUM-001', providers: ['nexus', 'tilda'] });
summaryLedger = appendEntry(summaryLedger, {
  provider: 'nexus', type: ENTRY_TYPE.EXECUTION, ref: 'exec:nexus:sum1', payload: {}
}, SIGNING_KEY);
summaryLedger = appendEntry(summaryLedger, {
  provider: 'nexus', type: ENTRY_TYPE.RECEIPT, ref: 'receipt:nexus:sum1', payload: {}
}, SIGNING_KEY);
summaryLedger = appendEntry(summaryLedger, {
  provider: 'tilda', type: ENTRY_TYPE.DRIFT, ref: 'drift:tilda:sum1', driftSeverity: 'WARNING', payload: {}
}, SIGNING_KEY);

const summary = getLedgerSummary(summaryLedger);

assert(summary.ledgerId === summaryLedger.ledgerId, 'summary.ledgerId matches');
assert(summary.totalEntries === 3, 'summary.totalEntries is 3');
assert(typeof summary.byProvider === 'object', 'summary.byProvider is object');
assert(summary.byProvider.nexus.count === 2, 'nexus has 2 entries');
assert(summary.byProvider.tilda.count === 1, 'tilda has 1 entry');
assert(summary.byType[ENTRY_TYPE.EXECUTION] === 1, 'byType.execution is 1');
assert(summary.byType[ENTRY_TYPE.DRIFT] === 1, 'byType.drift is 1');
assert(summary.driftClass === DRIFT_CLASS.WARNING, 'driftClass is warning (highest)');
assert(summary.sealedAt === null, 'sealedAt is null for open ledger');
console.log('  - getLedgerSummary: totalEntries, byProvider, byType correct ✓');
console.log('  - getLedgerSummary: driftClass reflects highest severity entry ✓');

// ---------------------------------------------------------------------------
// buildLedgerFromChain
// ---------------------------------------------------------------------------

// Build a minimal FECS chain for testing
const mockFecsChain = {
  chainId: 'CHAIN-ABCDEF001',
  envelopeId: 'FED-CHAIN-001',
  providers: ['nexus', 'tilda'],
  entries: [
    {
      entryId: 'ENTRY-001',
      provider: 'nexus',
      type: 'execution',
      ref: 'execution:nexus:step-0',
      status: 'collected',
      payload: { stepIndex: 0 },
      timestamp: new Date().toISOString()
    },
    {
      entryId: 'ENTRY-002',
      provider: 'tilda',
      type: 'drift',
      ref: 'drift:tilda:WARNING',
      status: 'collected',
      payload: { severity: 'WARNING' },
      timestamp: new Date().toISOString()
    },
    {
      entryId: 'ENTRY-003',
      provider: 'nexus',
      type: 'evidence',
      ref: 'evidence:nexus:EV-003',
      status: 'collected',
      payload: { collected: true },
      timestamp: new Date().toISOString()
    }
  ]
};

const chainLedger = buildLedgerFromChain(mockFecsChain, {
  signingKey: SIGNING_KEY,
  policyId: 'SPE-TESTPOLICY001'
});

assert(chainLedger.entries.length === 3, 'one sovereign entry per FECS chain entry');
assert(chainLedger.envelopeId === 'FED-CHAIN-001', 'envelopeId from chain');

// All entries have chainId bound
assert(chainLedger.entries.every((e) => e.chainId === 'CHAIN-ABCDEF001'), 'chainId bound to each entry');
console.log('  - buildLedgerFromChain: one sovereign entry per FECS chain entry ✓');
console.log('  - buildLedgerFromChain: chainId bound to each entry ✓');

// Drift entry classified correctly
const driftEntry = chainLedger.entries.find((e) => e.type === 'drift');
assert(driftEntry && driftEntry.driftClass === DRIFT_CLASS.WARNING, 'drift entry classified as WARNING');
console.log('  - buildLedgerFromChain: drift entries classified as DRIFT_CLASS ✓');

// throws on missing chain
let threwNoChain = false;
try { buildLedgerFromChain(null); } catch (e) { threwNoChain = true; }
assert(threwNoChain, 'throws on missing chain');
console.log('  - buildLedgerFromChain: throws on missing chain ✓');

// ---------------------------------------------------------------------------
// Full seal + verify round-trip
// ---------------------------------------------------------------------------

let rtLedger = createSovereignLedger({ envelopeId: 'RT-001', providers: ['nexus'] });
rtLedger = appendEntry(rtLedger, {
  provider: 'nexus', type: ENTRY_TYPE.EXECUTION, ref: 'exec:rt:1', payload: { x: 1 }
}, SIGNING_KEY);
rtLedger = appendEntry(rtLedger, {
  provider: 'nexus', type: ENTRY_TYPE.RECEIPT, ref: 'receipt:rt:1', payload: { receiptId: 'R-RT-001' },
  policyId: 'SPE-RT-001'
}, SIGNING_KEY);
rtLedger = sealLedger(rtLedger);

assert(rtLedger.status === LEDGER_STATUS.SEALED, 'round-trip: ledger sealed');
const rtVerify = verifyLedgerIntegrity(rtLedger, SIGNING_KEY);
assert(rtVerify.valid === true, 'round-trip: sealed ledger passes integrity check');
console.log('  - Full seal + verify round-trip passes integrity check ✓');

console.log('\nALL CHECKPOINT 4.2 — SOVEREIGN EVIDENCE LEDGER CHECKS PASSED ✓');
