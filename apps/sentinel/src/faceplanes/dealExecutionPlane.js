const { INTENTS, executeIntent } = require('../controlPlane');

function submitApplication(input, options = {}) {
  return executeIntent({
    intent: INTENTS.APPLICATION_SUBMIT,
    entity: 'application',
    action: 'submit',
    context: input,
    actor: { role: options.role || 'operator', userId: options.userId },
    tenantId: options.tenantId || 'ownerfi',
    metadata: options.metadata
  }, options);
}

function evaluateApplication(applicationId, options = {}) {
  return executeIntent({
    intent: INTENTS.APPLICATION_EVALUATE,
    entity: 'application',
    action: 'evaluate',
    context: { applicationId },
    actor: { role: options.role || 'operator', userId: options.userId },
    tenantId: options.tenantId || 'ownerfi',
    metadata: options.metadata
  }, options);
}

function executeDeal(dealId, options = {}) {
  return executeIntent({
    intent: INTENTS.DEAL_EXECUTE,
    entity: 'deal',
    action: 'execute',
    context: { dealId },
    actor: { role: options.role || 'operator', userId: options.userId },
    tenantId: options.tenantId || 'ownerfi',
    metadata: options.metadata
  }, options);
}

module.exports = {
  evaluateApplication,
  executeDeal,
  submitApplication
};
