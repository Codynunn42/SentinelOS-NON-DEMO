const { emitAIRoutingEvidence } = require('../../evidence/ai');

function pickModel(capabilityId, dataClassification = 'internal') {
  const modelId = capabilityId === 'ai-planning' ? 'gpt-4.1-mini' : 'gpt-4.1';
  return {
    modelId,
    capabilityId,
    dataClassification
  };
}

function pickProvider(model) {
  return {
    providerId: 'ai-operations',
    modelId: model.modelId
  };
}

function routeAIRequest(envelope = {}) {
  const { capabilityId = 'ai-planning', sessionId = 'session-default', dataClassification = 'internal' } = envelope;
  const model = pickModel(capabilityId, dataClassification);
  const provider = pickProvider(model);

  emitAIRoutingEvidence({
    type: 'ai-routing',
    capabilityId,
    sessionId,
    modelId: model.modelId,
    providerId: provider.providerId,
    dataClassification
  });

  return {
    model,
    provider
  };
}

module.exports = {
  routeAIRequest
};
