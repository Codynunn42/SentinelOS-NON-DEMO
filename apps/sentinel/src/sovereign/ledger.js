// Phase 4 — Sovereign Evidence Ledger (SEL)
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// The Sovereign Evidence Ledger is the tamper-evident audit spine of SentinelOS.
// Evidence stops being a passive record and becomes an immutable, sovereign-signed,
// federated ledger that proves every action taken across every provider.
//
// SEL pillars:
//   1. Sovereign entries   — immutable evidence records (SOV-ENTRY-*)
//   2. Chain linking       — entries link into a cryptographic hash chain (CHAIN-*)
//   3. Evidence sealing    — sealed ledgers cannot be appended; they are final
//   4. Sovereign signatures — every entry is HMAC-signed with a sovereign signing key
//   5. Drift-aware classification — drift severity determines entry classification tier
//   6. Provider federation — entries are stitched across providers into one ledger
//   7. Immutable write semantics — append-only; no mutation after entry is committed
//   8. Idempotent appends  — re-submitting the same ref is a no-op
//
// Ledger structure:
//   {
//     ledgerId:     string       — unique ledger identifier (SEL-<hex>)
//     envelopeId:   string|null  — linked FEM envelope ID (optional)
//     version:      string       — SEL schema version
//     status:       string       — open | sealed | corrupt
//     providers:    string[]     — providers represented in this ledger
//     entries:      SovEntry[]   — ordered, append-only sovereign evidence entries
//     headHash:     string|null  — SHA-256 hash of the most recent entry (chain tip)
//     sealedAt:     string|null  — ISO timestamp when ledger was sealed
//     driftClass:   string       — none | info | warning | critical
//     createdAt:    string       — ISO timestamp
//   }
//
// SovEntry structure:
//   {
//     entryId:    string   — unique entry identifier (SOV-ENTRY-<hex>)
//     provider:   string   — originating provider
//     type:       string   — execution | evidence | policy | drift | failover | receipt
//     ref:        string   — evidence reference (unique per ledger)
//     payload:    object   — structured evidence payload
//     policyId:   string|null — bound SPE policy (optional)
//     chainId:    string|null — linked FECS chain (optional)
//     driftClass: string   — none | info | warning | critical
//     signature:  string   — HMAC-SHA256 signature of this entry
//     prevHash:   string   — SHA-256 hash of previous entry (or GENESIS for first)
//     hash:       string   — SHA-256 hash of this entry (used as next entry's prevHash)
//     timestamp:  string   — ISO timestamp
//   }

'use strict';

const crypto = require('crypto');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEL_VERSION = '1.0';

const LEDGER_STATUS = {
  OPEN: 'open',
  SEALED: 'sealed',
  CORRUPT: 'corrupt'
};

const ENTRY_TYPE = {
  EXECUTION: 'execution',
  EVIDENCE: 'evidence',
  POLICY: 'policy',
  DRIFT: 'drift',
  FAILOVER: 'failover',
  RECEIPT: 'receipt'
};

const DRIFT_CLASS = {
  NONE: 'none',
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical'
};

const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

// Default signing key used when no sovereign key is provided (non-production sentinel)
const DEFAULT_SIGNING_KEY = 'SENTINEL_SOVEREIGN_DEFAULT_KEY';

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
 * Stable JSON serialisation — deterministic key ordering.
 * @param {*} value
 * @returns {string}
 */
function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  if (value !== null && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

/**
 * Compute SHA-256 hash of a string.
 * @param {string} input
 * @returns {string} hex digest
 */
function sha256(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Compute HMAC-SHA256 signature of a string.
 * @param {string} payload
 * @param {string} key
 * @returns {string} hex digest
 */
function hmacSign(payload, key) {
  return crypto.createHmac('sha256', key).update(payload).digest('hex');
}

/**
 * Build the canonical signing payload for an entry.
 * Excludes signature and hash fields (they don't exist yet at signing time).
 * @param {object} entry — unsigned entry fields
 * @returns {string}
 */
function buildEntryPayload(entry) {
  const { signature: _sig, hash: _hash, ...unsigned } = entry;
  return stableStringify(unsigned);
}

/**
 * Compute the per-entry hash (used as prevHash for the next entry).
 * @param {object} entry — fully signed entry (signature present)
 * @returns {string}
 */
function computeEntryHash(entry) {
  return sha256(stableStringify(entry));
}

/**
 * Classify a drift severity string as a DRIFT_CLASS value.
 * @param {string} severity — 'NONE' | 'INFO' | 'WARNING' | 'CRITICAL'
 * @returns {string} DRIFT_CLASS value
 */
function classifyDrift(severity) {
  const map = {
    NONE: DRIFT_CLASS.NONE,
    INFO: DRIFT_CLASS.INFO,
    WARNING: DRIFT_CLASS.WARNING,
    CRITICAL: DRIFT_CLASS.CRITICAL
  };
  return map[(severity || 'NONE').toUpperCase()] || DRIFT_CLASS.NONE;
}

/**
 * Most-severe drift class from an array of entries.
 * @param {object[]} entries
 * @returns {string}
 */
function computeLedgerDriftClass(entries) {
  const order = [DRIFT_CLASS.NONE, DRIFT_CLASS.INFO, DRIFT_CLASS.WARNING, DRIFT_CLASS.CRITICAL];
  let max = DRIFT_CLASS.NONE;
  for (const entry of entries) {
    const idx = order.indexOf(entry.driftClass);
    if (idx > order.indexOf(max)) {
      max = entry.driftClass;
    }
  }
  return max;
}

// ---------------------------------------------------------------------------
// createSovereignLedger
// ---------------------------------------------------------------------------

/**
 * Create a new sovereign evidence ledger.
 *
 * @param {object} [options]
 * @param {string} [options.ledgerId]     — explicit ID; generated if omitted
 * @param {string} [options.envelopeId]   — linked FEM envelope ID (optional)
 * @param {string[]} [options.providers]  — initial provider list
 * @returns {object} ledger
 */
function createSovereignLedger(options = {}) {
  const { ledgerId, envelopeId, providers } = options;

  return {
    ledgerId: ledgerId || uniqueId('SEL-'),
    envelopeId: envelopeId || null,
    version: SEL_VERSION,
    status: LEDGER_STATUS.OPEN,
    providers: Array.isArray(providers) && providers.length > 0 ? [...providers] : [],
    entries: [],
    headHash: null,
    sealedAt: null,
    driftClass: DRIFT_CLASS.NONE,
    createdAt: nowIso()
  };
}

// ---------------------------------------------------------------------------
// appendEntry
// ---------------------------------------------------------------------------

/**
 * Append an evidence entry to a sovereign ledger.
 * Returns a new ledger (append-only; original is not mutated).
 *
 * - Throws if ledger is SEALED
 * - Idempotent: if ref already exists in this ledger, returns ledger unchanged
 * - Cryptographically links each entry to the previous via prevHash → hash chain
 *
 * @param {object} ledger
 * @param {object} entry — { provider, type, ref, payload?, policyId?, chainId?, driftSeverity? }
 * @param {string} [signingKey] — sovereign signing key (defaults to DEFAULT_SIGNING_KEY)
 * @returns {object} updated ledger
 */
function appendEntry(ledger, entry, signingKey) {
  if (!ledger || !ledger.ledgerId) {
    throw new Error('SEL_LEDGER_REQUIRED');
  }
  if (ledger.status === LEDGER_STATUS.SEALED) {
    throw new Error('SEL_LEDGER_SEALED');
  }
  if (!entry || !entry.provider) {
    throw new Error('SEL_ENTRY_PROVIDER_REQUIRED');
  }
  if (!entry.type) {
    throw new Error('SEL_ENTRY_TYPE_REQUIRED');
  }
  if (!entry.ref) {
    throw new Error('SEL_ENTRY_REF_REQUIRED');
  }

  // Idempotent — same ref is a no-op
  if (ledger.entries.some((e) => e.ref === entry.ref)) {
    return ledger;
  }

  const key = signingKey || DEFAULT_SIGNING_KEY;
  const prevHash = ledger.headHash || GENESIS_HASH;
  const driftClass = classifyDrift(entry.driftSeverity || 'NONE');
  const entryId = uniqueId('SOV-ENTRY-');

  // Build unsigned entry
  const unsigned = {
    entryId,
    provider: entry.provider,
    type: entry.type,
    ref: entry.ref,
    payload: entry.payload || {},
    policyId: entry.policyId || null,
    chainId: entry.chainId || null,
    driftClass,
    prevHash,
    timestamp: nowIso()
  };

  // Sign the entry
  const sigPayload = buildEntryPayload(unsigned);
  const signature = hmacSign(sigPayload, key);

  const signed = { ...unsigned, signature };
  const hash = computeEntryHash(signed);
  const finalEntry = { ...signed, hash };

  // Update provider list
  const providers = ledger.providers.includes(entry.provider)
    ? ledger.providers
    : [...ledger.providers, entry.provider];

  const newEntries = [...ledger.entries, finalEntry];
  const newDriftClass = computeLedgerDriftClass(newEntries);

  return {
    ...ledger,
    entries: newEntries,
    headHash: hash,
    providers,
    driftClass: newDriftClass
  };
}

// ---------------------------------------------------------------------------
// sealLedger
// ---------------------------------------------------------------------------

/**
 * Seal a sovereign ledger. A sealed ledger is immutable — no further entries
 * can be appended. Returns a new ledger with status SEALED and sealedAt timestamp.
 *
 * @param {object} ledger
 * @returns {object} sealed ledger
 */
function sealLedger(ledger) {
  if (!ledger || !ledger.ledgerId) {
    throw new Error('SEL_LEDGER_REQUIRED');
  }
  if (ledger.status === LEDGER_STATUS.SEALED) {
    return ledger; // idempotent
  }

  return {
    ...ledger,
    status: LEDGER_STATUS.SEALED,
    sealedAt: nowIso()
  };
}

// ---------------------------------------------------------------------------
// verifyLedgerIntegrity
// ---------------------------------------------------------------------------

/**
 * Verify the cryptographic integrity of a sovereign ledger.
 * Walks the entry chain and re-computes each hash and signature.
 *
 * @param {object} ledger
 * @param {string} [signingKey]
 * @returns {{ valid: boolean, reason: string|null, corruptEntryId: string|null }}
 */
function verifyLedgerIntegrity(ledger, signingKey) {
  if (!ledger || !ledger.ledgerId) {
    return { valid: false, reason: 'SEL_LEDGER_REQUIRED', corruptEntryId: null };
  }

  if (ledger.entries.length === 0) {
    return { valid: true, reason: null, corruptEntryId: null };
  }

  const key = signingKey || DEFAULT_SIGNING_KEY;
  let expectedPrevHash = GENESIS_HASH;

  for (const entry of ledger.entries) {
    // Verify prevHash chain
    if (entry.prevHash !== expectedPrevHash) {
      return {
        valid: false,
        reason: 'CHAIN_BROKEN',
        corruptEntryId: entry.entryId
      };
    }

    // Re-derive signature
    const { signature: _sig, hash: _hash, ...unsigned } = entry;
    const sigPayload = buildEntryPayload(unsigned);
    const expectedSig = hmacSign(sigPayload, key);

    if (entry.signature !== expectedSig) {
      return {
        valid: false,
        reason: 'SIGNATURE_INVALID',
        corruptEntryId: entry.entryId
      };
    }

    // Re-derive hash
    const entryWithSig = { ...unsigned, signature: entry.signature };
    const expectedHash = computeEntryHash(entryWithSig);
    if (entry.hash !== expectedHash) {
      return {
        valid: false,
        reason: 'HASH_MISMATCH',
        corruptEntryId: entry.entryId
      };
    }

    expectedPrevHash = entry.hash;
  }

  // Verify headHash matches the last entry's hash
  const lastEntry = ledger.entries[ledger.entries.length - 1];
  if (ledger.headHash !== lastEntry.hash) {
    return {
      valid: false,
      reason: 'HEAD_HASH_MISMATCH',
      corruptEntryId: null
    };
  }

  return { valid: true, reason: null, corruptEntryId: null };
}

// ---------------------------------------------------------------------------
// stitchProviderLedgers
// ---------------------------------------------------------------------------

/**
 * Stitch multiple per-provider ledgers into a single federated sovereign ledger.
 * All entries from each provider are appended in provider order.
 * The stitched ledger gets the union of all providers.
 *
 * @param {object[]} providerLedgers — array of sealed or open sovereign ledgers
 * @param {object} [options]
 * @param {string} [options.envelopeId]  — federation envelope to bind
 * @param {string} [options.signingKey]  — signing key for stitched entries
 * @returns {object} federated sovereign ledger
 */
function stitchProviderLedgers(providerLedgers, options = {}) {
  if (!Array.isArray(providerLedgers) || providerLedgers.length === 0) {
    throw new Error('SEL_PROVIDER_LEDGERS_REQUIRED');
  }

  const key = options.signingKey || DEFAULT_SIGNING_KEY;
  let stitched = createSovereignLedger({
    envelopeId: options.envelopeId || null
  });

  for (const srcLedger of providerLedgers) {
    for (const srcEntry of srcLedger.entries) {
      // Re-append each source entry into the stitched ledger
      // Preserve all fields but let appendEntry re-sign with the stitching key
      stitched = appendEntry(stitched, {
        provider: srcEntry.provider,
        type: srcEntry.type,
        ref: srcEntry.ref,
        payload: srcEntry.payload,
        policyId: srcEntry.policyId,
        chainId: srcEntry.chainId,
        driftSeverity: srcEntry.driftClass.toUpperCase()
      }, key);
    }
  }

  return stitched;
}

// ---------------------------------------------------------------------------
// getLedgerSummary
// ---------------------------------------------------------------------------

/**
 * Return a human-readable summary of a sovereign ledger.
 *
 * @param {object} ledger
 * @returns {object} summary
 */
function getLedgerSummary(ledger) {
  if (!ledger || !ledger.ledgerId) {
    throw new Error('SEL_LEDGER_REQUIRED');
  }

  const byProvider = {};
  const byType = {};

  for (const entry of ledger.entries) {
    if (!byProvider[entry.provider]) {
      byProvider[entry.provider] = { count: 0, types: [] };
    }
    byProvider[entry.provider].count++;
    if (!byProvider[entry.provider].types.includes(entry.type)) {
      byProvider[entry.provider].types.push(entry.type);
    }

    byType[entry.type] = (byType[entry.type] || 0) + 1;
  }

  return {
    ledgerId: ledger.ledgerId,
    envelopeId: ledger.envelopeId,
    status: ledger.status,
    version: ledger.version,
    driftClass: ledger.driftClass,
    totalEntries: ledger.entries.length,
    providers: ledger.providers,
    byProvider,
    byType,
    headHash: ledger.headHash,
    sealedAt: ledger.sealedAt,
    createdAt: ledger.createdAt
  };
}

// ---------------------------------------------------------------------------
// buildLedgerFromChain
// ---------------------------------------------------------------------------

/**
 * Build a sovereign ledger from a federated evidence chain (FECS).
 * Each chain entry becomes a sovereign ledger entry, classified by drift and type.
 *
 * @param {object} fecsChain — FECS chain record (from evidenceChain.js)
 * @param {object} [options]
 * @param {string} [options.signingKey]
 * @param {string} [options.policyId] — optional SPE policy to bind to all entries
 * @returns {object} sovereign ledger
 */
function buildLedgerFromChain(fecsChain, options = {}) {
  if (!fecsChain || !fecsChain.chainId) {
    throw new Error('SEL_CHAIN_REQUIRED');
  }

  const key = options.signingKey || DEFAULT_SIGNING_KEY;

  let ledger = createSovereignLedger({
    envelopeId: fecsChain.envelopeId || null,
    providers: fecsChain.providers || []
  });

  for (const chainEntry of (fecsChain.entries || [])) {
    // Map FECS drift entries to drift classification
    const driftSeverity = chainEntry.type === 'drift'
      ? (chainEntry.payload && chainEntry.payload.severity) || 'INFO'
      : 'NONE';

    ledger = appendEntry(ledger, {
      provider: chainEntry.provider,
      type: chainEntry.type,
      ref: chainEntry.ref,
      payload: chainEntry.payload || {},
      chainId: fecsChain.chainId,
      policyId: options.policyId || null,
      driftSeverity
    }, key);
  }

  return ledger;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
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
};
