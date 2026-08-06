const aiEvidenceStore = [];

function emitAIRoutingEvidence(entry = {}) {
  const record = {
    ...entry,
    timestamp: new Date().toISOString()
  };

  aiEvidenceStore.push(record);
  return record;
}

function clearAIRoutingEvidence() {
  aiEvidenceStore.length = 0;
}

function getAIRoutingEvidence() {
  return aiEvidenceStore;
}

function getAIRoutingEvidenceFor(capabilityId) {
  if (!capabilityId || typeof capabilityId !== 'string') {
    return [];
  }

  return aiEvidenceStore.filter((entry) => entry.capabilityId === capabilityId);
}

module.exports = {
  emitAIRoutingEvidence,
  clearAIRoutingEvidence,
  getAIRoutingEvidence,
  getAIRoutingEvidenceFor
};
