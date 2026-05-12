// Drift Store
// Purpose: Persist drift recommendations with lifecycle tracking.
// In-memory with audit-backed persistence. Recommendations survive the session.

const { FORK_STATUSES } = require('./driftSchemas');

const MAX_RECOMMENDATIONS = 100;
const store = new Map();

function save(recommendation) {
  store.set(recommendation.recommendationId, {
    ...recommendation,
    savedAt: new Date().toISOString()
  });

  if (store.size > MAX_RECOMMENDATIONS) {
    const oldest = [...store.keys()][0];
    store.delete(oldest);
  }

  return store.get(recommendation.recommendationId);
}

function saveAll(recommendations) {
  return recommendations.map(save);
}

function get(recommendationId) {
  return store.get(recommendationId) || null;
}

function list(options = {}) {
  const all = [...store.values()].sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (options.tenant) {
    return all.filter((rec) => rec.tenant === options.tenant);
  }

  if (options.status) {
    return all.filter((rec) => rec.status === options.status);
  }

  return all;
}

function updateStatus(recommendationId, status, metadata = {}) {
  const existing = store.get(recommendationId);
  if (!existing) return null;

  const updated = {
    ...existing,
    status: FORK_STATUSES[status] || status,
    resolvedAt: new Date().toISOString(),
    resolution: metadata
  };

  store.set(recommendationId, updated);
  return updated;
}

function getSummary(tenant) {
  const all = list({ tenant });
  return {
    total: all.length,
    proposed: all.filter((r) => r.status === FORK_STATUSES.proposed).length,
    pending_approval: all.filter((r) => r.status === FORK_STATUSES.pending_approval).length,
    approved: all.filter((r) => r.status === FORK_STATUSES.approved).length,
    rejected: all.filter((r) => r.status === FORK_STATUSES.rejected).length
  };
}

module.exports = {
  get,
  getSummary,
  list,
  save,
  saveAll,
  updateStatus
};
