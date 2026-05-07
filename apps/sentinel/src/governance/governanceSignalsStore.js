const fs = require('fs');
const path = require('path');
const { query } = require('../db/client');

const DEFAULT_SIGNAL_STORE_PATH = path.join('/private', 'tmp', 'sentinel-governance-signals.jsonl');
const signalStorePath = process.env.SIGNAL_STORE_PATH || DEFAULT_SIGNAL_STORE_PATH;
const memorySignals = [];
let loadedFromDisk = false;

function normalizeLimit(limit) {
  const parsed = Number(limit);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 50;
  }

  return Math.min(Math.floor(parsed), 500);
}

function ensureLoadedFromDisk() {
  if (loadedFromDisk) {
    return;
  }

  loadedFromDisk = true;

  try {
    if (!fs.existsSync(signalStorePath)) {
      return;
    }

    const lines = fs.readFileSync(signalStorePath, 'utf8').split('\n').filter(Boolean);
    for (const line of lines.slice(-500)) {
      try {
        memorySignals.push(JSON.parse(line));
      } catch (_) {
        // Ignore malformed historical lines without blocking signal reads.
      }
    }
  } catch (_) {
    // The in-memory queue remains usable if the fallback file is unavailable.
  }
}

function rememberSignals(signals) {
  if (!signals.length) {
    return;
  }

  ensureLoadedFromDisk();
  memorySignals.unshift(...signals);
  memorySignals.splice(500);
}

async function saveGovernanceSignals(signals = []) {
  if (!Array.isArray(signals) || !signals.length) {
    return true;
  }

  rememberSignals(signals);

  try {
    await fs.promises.mkdir(path.dirname(signalStorePath), { recursive: true });
    await fs.promises.appendFile(
      signalStorePath,
      `${signals.map((signal) => JSON.stringify(signal)).join('\n')}\n`,
      'utf8'
    );
  } catch (_) {
    // File persistence is best-effort when DB is unavailable.
  }

  try {
    for (const signal of signals) {
      await query(
        `INSERT INTO governance_signals
          (id, event_id, tenant_id, command, severity, type, message, actor, details, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10)`,
        [
          signal.id,
          signal.eventId || null,
          signal.tenant || null,
          signal.command || 'unknown',
          signal.severity,
          signal.type,
          signal.message,
          signal.actor || null,
          JSON.stringify(signal.details || {}),
          signal.timestamp || new Date().toISOString()
        ]
      );
    }
  } catch (_) {
    // The JSONL fallback already captured the signal for local continuity.
  }

  return true;
}

async function getRecentGovernanceSignals(options = {}) {
  const tenant = options.tenant || null;
  const limit = normalizeLimit(options.limit);

  try {
    const result = await query(
      `SELECT id, event_id, tenant_id, command, severity, type, message, actor, details, created_at
       FROM governance_signals
       WHERE ($1::text IS NULL OR tenant_id = $1)
       ORDER BY created_at DESC
       LIMIT $2`,
      [tenant, limit]
    );

    if (result && Array.isArray(result.rows)) {
      return result.rows.map((row) => ({
        id: row.id,
        eventId: row.event_id,
        tenant: row.tenant_id,
        command: row.command,
        severity: row.severity,
        type: row.type,
        message: row.message,
        actor: row.actor || null,
        details: row.details || {},
        timestamp: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
      }));
    }
  } catch (_) {
    // Fall through to fallback store.
  }

  ensureLoadedFromDisk();
  return memorySignals
    .filter((signal) => !tenant || signal.tenant === tenant)
    .slice(0, limit);
}

async function getGovernanceSignalCounts(options = {}) {
  const tenant = options.tenant || null;

  try {
    const result = await query(
      `SELECT severity, COUNT(*)::int AS count
       FROM governance_signals
       WHERE ($1::text IS NULL OR tenant_id = $1)
       GROUP BY severity`,
      [tenant]
    );

    if (result && Array.isArray(result.rows)) {
      const counts = { low: 0, medium: 0, high: 0 };
      for (const row of result.rows) {
        counts[row.severity] = Number(row.count) || 0;
      }
      return counts;
    }
  } catch (_) {
    // Fall through to fallback store.
  }

  ensureLoadedFromDisk();
  return memorySignals
    .filter((signal) => !tenant || signal.tenant === tenant)
    .reduce((counts, signal) => {
      counts[signal.severity] = (counts[signal.severity] || 0) + 1;
      return counts;
    }, { low: 0, medium: 0, high: 0 });
}

module.exports = {
  getGovernanceSignalCounts,
  getRecentGovernanceSignals,
  saveGovernanceSignals
};
