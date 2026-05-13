// Approval Layer
// Purpose: Handle human-in-the-loop decisions.

const crypto = require('crypto');
const {
  appendApprovalEvent,
  getApproval: getStoredApproval,
  listApprovals,
  saveApproval,
  updateApproval
} = require('./store');

const pendingApprovals = new Map();

function buildApprovalEvent(type, actor = 'system') {
  return {
    type,
    actor,
    timestamp: new Date().toISOString()
  };
}

function addLocalEvent(request, type, actor = 'system') {
  request.events = Array.isArray(request.events) ? request.events : [];
  request.events.push(buildApprovalEvent(type, actor));
  request.updatedAt = request.events[request.events.length - 1].timestamp;
  return request;
}

async function persistOrFallback(request) {
  const stored = await saveApproval(request);
  pendingApprovals.set(request.id, stored || request);
  return stored || request;
}

async function createApprovalRequest(decisionOutput, context = {}) {
  const id = `approval_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const decision = {
    ...(decisionOutput && typeof decisionOutput === 'object' ? decisionOutput : {}),
    ...(decisionOutput && decisionOutput.approvalRequired === true ? { approvalId: id } : {})
  };

  const request = {
    id,
    status: 'pending',
    decision,
    context,
    events: [buildApprovalEvent('requested', 'system')],
    createdAt: now,
    updatedAt: now
  };

  return persistOrFallback(request);
}

async function approveRequest(id, metadata = {}, tenant = null) {
  const stored = await updateApproval(id, 'approved', metadata, tenant);
  if (stored) {
    pendingApprovals.set(id, stored);
    return stored;
  }

  const request = pendingApprovals.get(id);
  if (!request) {
    return null;
  }

  if (tenant && (!request.context || request.context.tenant !== tenant)) {
    return null;
  }

  request.status = 'approved';
  request.resolvedAt = new Date().toISOString();
  request.updatedAt = request.resolvedAt;
  request.resolution = metadata;
  addLocalEvent(request, 'approved', metadata.actor || 'system');

  return request;
}

async function rejectRequest(id, metadata = {}, tenant = null) {
  const stored = await updateApproval(id, 'rejected', metadata, tenant);
  if (stored) {
    pendingApprovals.set(id, stored);
    return stored;
  }

  const request = pendingApprovals.get(id);
  if (!request) {
    return null;
  }

  if (tenant && (!request.context || request.context.tenant !== tenant)) {
    return null;
  }

  request.status = 'rejected';
  request.resolvedAt = new Date().toISOString();
  request.updatedAt = request.resolvedAt;
  request.resolution = metadata;
  addLocalEvent(request, 'rejected', metadata.actor || 'system');

  return request;
}

async function getPendingApprovals(tenant = null) {
  const stored = await listApprovals('pending', tenant);
  if (stored) {
    stored.forEach((request) => pendingApprovals.set(request.id, request));
    return stored;
  }

  return Array.from(pendingApprovals.values()).filter((request) => {
    const matchesStatus = request.status === 'pending';
    const matchesTenant = !tenant || (request.context && request.context.tenant === tenant);
    return matchesStatus && matchesTenant;
  });
}

async function addApprovalTimelineEvent(id, type, actor = 'system', tenant = null) {
  const stored = await appendApprovalEvent(id, buildApprovalEvent(type, actor), tenant);
  if (stored) {
    pendingApprovals.set(id, stored);
    return stored;
  }

  const fallback = pendingApprovals.get(id);
  if (!fallback) {
    return null;
  }

  if (tenant && (!fallback.context || fallback.context.tenant !== tenant)) {
    return null;
  }

  return addLocalEvent(fallback, type, actor);
}

async function getApproval(id, tenant = null, options = {}) {
  const stored = await getStoredApproval(id, tenant);
  if (stored) {
    const withEvent = options.recordViewed
      ? await addApprovalTimelineEvent(id, 'viewed', options.actor || 'system', tenant)
      : stored;
    pendingApprovals.set(id, withEvent || stored);
    return withEvent || stored;
  }

  const fallback = pendingApprovals.get(id) || null;
  if (!fallback) {
    return null;
  }

  if (tenant && (!fallback.context || fallback.context.tenant !== tenant)) {
    return null;
  }

  if (options.recordViewed) {
    return addLocalEvent(fallback, 'viewed', options.actor || 'system');
  }

  return fallback;
}

module.exports = {
  addApprovalTimelineEvent,
  approveRequest,
  createApprovalRequest,
  getApproval,
  getPendingApprovals,
  rejectRequest
};
