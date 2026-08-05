const { computeEvidenceStatus } = require('../evidence/status');
const { getModuleEvidenceFor } = require('../evidence/module');
const { getAIRoutingEvidenceFor } = require('../evidence/ai');
const { buildAutonomousOutcomeBriefing } = require('./autonomousBriefing');

function buildExecutivePlane(options = {}) {
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

  const plane = {
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

  if (options.autonomyMode) {
    plane.autonomousBriefing = buildAutonomousOutcomeBriefing();
  }

  return plane;
}

module.exports = {
  buildExecutivePlane
};