const { getSNCSForCapability } = require('./sncs');

function hasSession(capabilityId) {
  return Boolean(capabilityId && typeof capabilityId === 'string' && capabilityId.length > 0);
}

function hasReceipt(capabilityId) {
  return Boolean(capabilityId && typeof capabilityId === 'string' && capabilityId.length > 0);
}

function hasLedger(capabilityId) {
  return Boolean(capabilityId && typeof capabilityId === 'string' && capabilityId.length > 0);
}

function hasCrossProvider(capabilityId) {
  const sncs = getSNCSForCapability(capabilityId) || [];
  return Array.isArray(sncs) && sncs.length > 0;
}

function computeEvidenceStatus(capabilityId) {
  const hasSessionEvidence = hasSession(capabilityId);
  const hasReceiptEvidence = hasReceipt(capabilityId);
  const hasLedgerEvidence = hasLedger(capabilityId);
  const hasCrossProviderEvidence = hasCrossProvider(capabilityId);

  if (hasSessionEvidence && hasReceiptEvidence && hasLedgerEvidence && hasCrossProviderEvidence) {
    return 'verified';
  }

  if (hasSessionEvidence && hasReceiptEvidence && hasLedgerEvidence) {
    return 'pending-cross-provider';
  }

  return 'open';
}

module.exports = {
  computeEvidenceStatus,
  hasSession,
  hasReceipt,
  hasLedger,
  hasCrossProvider
};