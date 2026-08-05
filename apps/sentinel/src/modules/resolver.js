const { emitModuleEvidence } = require('../evidence/module');

function listModules() {
  return [
    {
      moduleId: 'ai-operations',
      displayName: 'AI Operations',
      healthStatus: 'healthy',
      capabilities: ['application.submit', 'repo-read', 'calendar-read', 'ai-planning']
    }
  ];
}

function resolveCapabilityToModule(capabilityId) {
  const module = capabilityId === 'calendar-read'
    ? { moduleId: 'ai-operations', displayName: 'AI Operations', capabilities: ['calendar-read'] }
    : capabilityId === 'repo-read'
      ? { moduleId: 'ai-operations', displayName: 'AI Operations', capabilities: ['repo-read'] }
      : capabilityId === 'application.submit'
        ? { moduleId: 'ai-operations', displayName: 'AI Operations', capabilities: ['application.submit'] }
        : null;

  if (module) {
    emitModuleEvidence({
      type: 'module-resolution',
      moduleId: module.moduleId,
      capabilityId
    });
  }

  return module;
}

module.exports = {
  listModules,
  resolveCapabilityToModule
};
