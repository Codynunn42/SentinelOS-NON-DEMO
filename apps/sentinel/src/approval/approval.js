// Approval Layer
// Purpose: Handle human-in-the-loop decisions.

const crypto = require('crypto');
const {
  getApproval: getStoredApproval,
  listApprovals,
  saveApproval,
  updateApproval
} = require('./store');

const pendingApprovals = new Map();

async function persistOrFallback(request) {
  const stored = await saveApproval(request);
  pendingApprovals.set(request.id, stored || request);
  return stored || request;
}

async function createApprovalRequest(decisionOutput, context = {}) {
  const id = `approval_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  const request = {
    id,
    status: 'pending',
    decision: decisionOutput,
    context,
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

async function getApproval(id, tenant = null) {
  const stored = await getStoredApproval(id, tenant);
  if (stored) {
    pendingApprovals.set(id, stored);
    return stored;
  }

  const fallback = pendingApprovals.get(id) || null;
  if (!fallback) {
    return null;
  }

  if (tenant && (!fallback.context || fallback.context.tenant !== tenant)) {
    return null;
  }

  return fallback;
}

module.exports = {
  approveRequest,
  createApprovalRequest,
  getApproval,
  getPendingApprovals,
  rejectRequest
};
