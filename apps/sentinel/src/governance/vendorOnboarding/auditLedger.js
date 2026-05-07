const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const REQUIRED_FIELDS = [
  'workflowId',
  'capabilityId',
  'ruleSetVersion',
  'nvopState',
  'latencyClass',
  'escalationFlag',
  'timestamp'
];

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function ensureLedgerDir(ledgerPath) {
  fs.mkdirSync(path.dirname(ledgerPath), { recursive: true });
}

function readEntries(ledgerPath) {
  if (!fs.existsSync(ledgerPath)) {
    return [];
  }

  const text = fs.readFileSync(ledgerPath, 'utf8').trim();
  if (!text) {
    return [];
  }

  return text.split('\n').map((line) => JSON.parse(line));
}

function validateEntry(entry) {
  const missing = REQUIRED_FIELDS.filter((field) => entry[field] === undefined || entry[field] === null);
  if (missing.length > 0) {
    throw new Error(`AUDIT_LEDGER_ENTRY_INVALID:${missing.join(',')}`);
  }
}

function buildLedgerEntry(entry, previousHash = null) {
  validateEntry(entry);
  const baseEntry = {
    workflowId: entry.workflowId,
    capabilityId: entry.capabilityId,
    ruleSetVersion: entry.ruleSetVersion,
    nvopState: entry.nvopState,
    latencyClass: entry.latencyClass,
    escalationFlag: Boolean(entry.escalationFlag),
    timestamp: entry.timestamp,
    previousHash
  };
  const hash = entry.hash || sha256(stableStringify(baseEntry));

  return Object.freeze({
    ...baseEntry,
    hash
  });
}

function createAuditLedger({ ledgerPath = '/private/tmp/sentinel_vendor_onboarding_audit_ledger.jsonl' } = {}) {
  ensureLedgerDir(ledgerPath);

  return Object.freeze({
    appendEntry(entry) {
      const entries = readEntries(ledgerPath);
      const previous = entries[entries.length - 1] || null;
      const ledgerEntry = buildLedgerEntry(entry, previous ? previous.hash : null);
      fs.appendFileSync(ledgerPath, `${JSON.stringify(ledgerEntry)}\n`, { encoding: 'utf8' });
      return ledgerEntry;
    },
    readEntries() {
      return readEntries(ledgerPath).map(Object.freeze);
    },
    ledgerPath
  });
}

module.exports = {
  buildLedgerEntry,
  createAuditLedger,
  stableStringify
};
