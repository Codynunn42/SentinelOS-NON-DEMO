const moduleEvidenceStore = [];

function emitModuleEvidence(entry = {}) {
  const record = {
    ...entry,
    timestamp: new Date().toISOString()
  };

  moduleEvidenceStore.push(record);
  return record;
}

function clearModuleEvidence() {
  moduleEvidenceStore.length = 0;
}

function getModuleEvidence() {
  return moduleEvidenceStore;
}

function getModuleEvidenceFor(moduleId) {
  if (!moduleId || typeof moduleId !== 'string') {
    return [];
  }

  return moduleEvidenceStore.filter((entry) => entry.moduleId === moduleId);
}

module.exports = {
  emitModuleEvidence,
  clearModuleEvidence,
  getModuleEvidence,
  getModuleEvidenceFor
};
