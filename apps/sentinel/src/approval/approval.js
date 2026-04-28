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

async function approveRequest(id, metadata = {}) {
  const stored = await updateApproval(id, 'approved', metadata);
  if (stored) {
    pendingApprovals.set(id, stored);
    return stored;
  }

  const request = pendingApprovals.get(id);
  if (!request) {
    return null;
  }

  request.status = 'approved';
  request.resolvedAt = new Date().toISOString();
  request.updatedAt = request.resolvedAt;
  request.resolution = metadata;

  return request;
}

async function rejectRequest(id, metadata = {}) {
  const stored = await updateApproval(id, 'rejected', metadata);
  if (stored) {
    pendingApprovals.set(id, stored);
    return stored;
  }

  const request = pendingApprovals.get(id);
  if (!request) {
    return null;
  }

  request.status = 'rejected';
  request.resolvedAt = new Date().toISOString();
  request.updatedAt = request.resolvedAt;
  request.resolution = metadata;

  return request;
}

async function getPendingApprovals() {
  const stored = await listApprovals('pending');
  if (stored) {
    stored.forEach((request) => pendingApprovals.set(request.id, request));
    return stored;
  }

  return Array.from(pendingApprovals.values()).filter((request) => request.status === 'pending');
}

async function getApproval(id) {
  const stored = await getStoredApproval(id);
  if (stored) {
    pendingApprovals.set(id, stored);
    return stored;
  }

  return pendingApprovals.get(id) || null;
}

module.exports = {
  approveRequest,
  createApprovalRequest,
  getApproval,
  getPendingApprovals,
  rejectRequest
};
