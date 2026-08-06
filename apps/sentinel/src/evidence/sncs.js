const crypto = require('crypto');

const sncsStore = [];

function createEvidenceRecord({ sessionId, capabilityId, provider, evidenceType = 'cross-provider', status = 'verified', data = {}, moduleEvidence = null }) {
  return {
    sessionId: sessionId || `session_${crypto.randomUUID()}`,
    capabilityId: capabilityId || 'unknown',
    provider: provider || 'local',
    evidenceType,
    status,
    createdAt: new Date().toISOString(),
    evidenceId: `evidence_${crypto.randomUUID()}`,
    moduleEvidence,
    data
  };
}

function emitSNCSEvidence(context = {}, options = {}) {
  const record = createEvidenceRecord(options);
  sncsStore.push(record);

  if (context && typeof context.emitSecurityEvent === 'function') {
    context.emitSecurityEvent(`evidence.${record.evidenceType}`, {
      sessionId: record.sessionId,
      capabilityId: record.capabilityId,
      provider: record.provider,
      evidenceType: record.evidenceType,
      status: record.status,
      evidenceId: record.evidenceId,
      createdAt: record.createdAt,
      data: record.data
    });
  }

  return record;
}

function getSNCSForCapability(capabilityId) {
  if (!capabilityId || typeof capabilityId !== 'string') {
    return [];
  }

  return sncsStore.filter((record) => record.capabilityId === capabilityId);
}

module.exports = {
  createEvidenceRecord,
  emitSNCSEvidence,
  getSNCSForCapability
};