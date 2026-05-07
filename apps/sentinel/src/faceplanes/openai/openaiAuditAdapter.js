const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { stableStringify } = require('../../governance/vendorOnboarding/auditLedger');

const DEFAULT_OPENAI_AUDIT_LEDGER_PATH = '/private/tmp/sentinel_openai_faceplane_audit_ledger.jsonl';

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function readOpenAIAuditEntries(ledgerPath = DEFAULT_OPENAI_AUDIT_LEDGER_PATH) {
  if (!fs.existsSync(ledgerPath)) {
    return [];
  }

  const raw = fs.readFileSync(ledgerPath, 'utf8').trim();
  if (!raw) {
    return [];
  }

  return raw.split('\n').map((line) => JSON.parse(line));
}

function appendOpenAIAuditEntry(entry, options = {}) {
  const ledgerPath = options.ledgerPath || DEFAULT_OPENAI_AUDIT_LEDGER_PATH;
  fs.mkdirSync(path.dirname(ledgerPath), { recursive: true });

  const previous = readOpenAIAuditEntries(ledgerPath).at(-1) || null;
  const timestamp = entry.timestamp || new Date().toISOString();
  const baseEntry = {
    workflowId: entry.workflowId,
    faceplane: 'openai',
    tenantId: entry.tenantId,
    gaasTier: entry.gaasTier,
    promptHash: entry.promptHash,
    modelVersion: entry.modelVersion,
    riskIndex: entry.riskIndex,
    escalationState: entry.escalationState,
    auditLogEnabled: entry.auditLogEnabled === true,
    driftTrackingEnabled: entry.driftTrackingEnabled === true,
    timestamp,
    previousHash: previous ? previous.hash : null
  };
  const hash = sha256(stableStringify(baseEntry));
  const ledgerEntry = Object.freeze({
    ...baseEntry,
    hash
  });

  fs.appendFileSync(ledgerPath, `${JSON.stringify(ledgerEntry)}\n`, 'utf8');
  return ledgerEntry;
}

function verifyOpenAIAuditLedger(ledgerPath = DEFAULT_OPENAI_AUDIT_LEDGER_PATH) {
  const entries = readOpenAIAuditEntries(ledgerPath);
  const failures = [];

  entries.forEach((entry, index) => {
    const { hash, ...withoutHash } = entry;
    const expectedPrevious = index === 0 ? null : entries[index - 1].hash;
    const expectedHash = sha256(stableStringify(withoutHash));

    if (entry.previousHash !== expectedPrevious) {
      failures.push({ index, reason: 'previous_hash_mismatch' });
    }

    if (entry.hash !== expectedHash) {
      failures.push({ index, reason: 'entry_hash_mismatch' });
    }
  });

  return {
    ok: failures.length === 0,
    entryCount: entries.length,
    failures
  };
}

module.exports = {
  DEFAULT_OPENAI_AUDIT_LEDGER_PATH,
  appendOpenAIAuditEntry,
  readOpenAIAuditEntries,
  verifyOpenAIAuditLedger
};
