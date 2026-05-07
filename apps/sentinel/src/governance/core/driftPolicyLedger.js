const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DEFAULT_DRIFT_POLICY_LEDGER_PATH = '/private/tmp/sentinel_drift_policy_ledger.jsonl';

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

function readEntries(ledgerPath = DEFAULT_DRIFT_POLICY_LEDGER_PATH) {
  if (!fs.existsSync(ledgerPath)) {
    return [];
  }

  const text = fs.readFileSync(ledgerPath, 'utf8').trim();
  return text ? text.split('\n').map((line) => JSON.parse(line)) : [];
}

function appendEntry(entry, ledgerPath = DEFAULT_DRIFT_POLICY_LEDGER_PATH) {
  ensureLedgerDir(ledgerPath);
  const entries = readEntries(ledgerPath);
  const previous = entries[entries.length - 1] || null;
  const withHash = {
    ...entry,
    previousHash: previous ? previous.hash : null
  };
  const hash = sha256(stableStringify(withHash));
  const finalEntry = Object.freeze({
    ...withHash,
    hash
  });

  fs.appendFileSync(ledgerPath, `${JSON.stringify(finalEntry)}\n`, 'utf8');
  return finalEntry;
}

function hasText(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function countThresholdChanges(entries, timestamp, days) {
  const current = new Date(timestamp).getTime();
  const windowMs = days * 24 * 60 * 60 * 1000;

  return entries.filter((entry) => {
    if (entry.policyType !== 'DRIFT_CONFIG_UPDATE') {
      return false;
    }

    const observed = new Date(entry.timestamp).getTime();
    return Number.isFinite(observed) && current - observed >= 0 && current - observed <= windowMs;
  }).length;
}

function appendDriftConfigUpdate(update, options = {}) {
  const ledgerPath = options.ledgerPath || DEFAULT_DRIFT_POLICY_LEDGER_PATH;
  const timestamp = update.timestamp || new Date().toISOString();
  const entries = readEntries(ledgerPath);
  const repeatedChanges = countThresholdChanges(entries, timestamp, 30);

  if (!hasText(update.oldConfigVersion) || !hasText(update.newConfigVersion)) {
    throw new Error('DRIFT_CONFIG_VERSION_INCREMENT_REQUIRED');
  }

  if (update.oldConfigVersion === update.newConfigVersion) {
    throw new Error('DRIFT_CONFIG_VERSION_INCREMENT_REQUIRED');
  }

  if (!update.changes || typeof update.changes !== 'object' || Object.keys(update.changes).length === 0) {
    throw new Error('DRIFT_CONFIG_DIFF_REQUIRED');
  }

  if (!hasText(update.rationale)) {
    throw new Error('DRIFT_CONFIG_RATIONALE_REQUIRED');
  }

  if (!hasText(update.actorId)) {
    throw new Error('DRIFT_CONFIG_ACTOR_REQUIRED');
  }

  const severity = repeatedChanges >= 1 ? 'CRITICAL' : 'WARNING';
  const entry = {
    policyType: 'DRIFT_CONFIG_UPDATE',
    oldConfigVersion: update.oldConfigVersion,
    newConfigVersion: update.newConfigVersion,
    changes: update.changes,
    rationale: update.rationale.trim(),
    actorId: update.actorId.trim(),
    timestamp,
    severity
  };

  return appendEntry(entry, ledgerPath);
}

function appendDriftEvent(event, options = {}) {
  const ledgerPath = options.ledgerPath || DEFAULT_DRIFT_POLICY_LEDGER_PATH;

  if (!hasText(event.driftId) || !hasText(event.type) || !hasText(event.severity)) {
    throw new Error('DRIFT_EVENT_REQUIRED_FIELDS');
  }

  return appendEntry({
    eventType: 'GOVERNANCE_DRIFT_EVENT',
    ...event,
    timestamp: event.timestamp || new Date().toISOString()
  }, ledgerPath);
}

function appendDriftAcknowledgement(acknowledgement, options = {}) {
  const ledgerPath = options.ledgerPath || DEFAULT_DRIFT_POLICY_LEDGER_PATH;

  if (!hasText(acknowledgement.driftId) || !hasText(acknowledgement.acknowledgedBy)) {
    throw new Error('DRIFT_ACKNOWLEDGEMENT_REQUIRED_FIELDS');
  }

  return appendEntry({
    eventType: 'GOVERNANCE_DRIFT_ACKNOWLEDGEMENT',
    driftId: acknowledgement.driftId,
    acknowledged: true,
    acknowledgedBy: acknowledgement.acknowledgedBy,
    acknowledgedAt: acknowledgement.acknowledgedAt || new Date().toISOString(),
    timestamp: acknowledgement.timestamp || new Date().toISOString()
  }, ledgerPath);
}

module.exports = {
  DEFAULT_DRIFT_POLICY_LEDGER_PATH,
  appendDriftAcknowledgement,
  appendDriftConfigUpdate,
  appendDriftEvent,
  readEntries,
  stableStringify
};
