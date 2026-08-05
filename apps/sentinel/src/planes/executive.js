const { computeEvidenceStatus } = require('../evidence/status');
const { getModuleEvidenceFor } = require('../evidence/module');
const { getAIRoutingEvidenceFor } = require('../evidence/ai');

function buildExecutivePlane() {
  const capabilities = [
    'application.submit',
    'repo-read',
    'action-execute',
    'calendar-read',
    'report-generate',
    'planning',
    'outcome-briefings',
    'ai-planning'
  ];

  return {
    institutionalModules: [
      {
        moduleId: 'ai-operations',
        displayName: 'AI Operations',
        healthStatus: 'healthy',
        capabilityCount: capabilities.length,
        evidence: getModuleEvidenceFor('ai-operations'),
        capabilities: capabilities.map((capabilityId) => ({
          capabilityId,
          evidenceStatus: computeEvidenceStatus(capabilityId),
          aiRoutingEvidence: getAIRoutingEvidenceFor(capabilityId)
        }))
      }
    ]
  };
}

module.exports = {
  buildExecutivePlane
};