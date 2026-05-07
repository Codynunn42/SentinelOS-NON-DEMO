const escalationStore = new Map();

function routeOpenAIEscalation({ workflow, risk, config, principal } = {}) {
  const queuedAt = new Date().toISOString();
  const caseRecord = Object.freeze({
    workflowId: workflow.workflowId,
    sourceFaceplane: 'openai',
    tenantId: workflow.tenantId,
    gaasTier: config.gaasTier,
    riskIndex: risk.riskIndex,
    nvopState: risk.state,
    riskInputs: risk.inputs,
    triggeredRules: risk.triggeredRules,
    latencyClass: risk.state >= 3 ? 'refusal_review' : 'human_review',
    queueTimestamp: queuedAt,
    operatorQueue: 'operator.openai',
    recommendedAction: risk.state >= 3 ? 'confirm_refusal' : 'escalate_further',
    principalActor: principal && principal.actor ? principal.actor : null,
    status: 'pending_review'
  });

  escalationStore.set(workflow.workflowId, caseRecord);
  return caseRecord;
}

function getOpenAIEscalation(workflowId) {
  return escalationStore.get(workflowId) || null;
}

function listOpenAIEscalations(tenantId = null) {
  return [...escalationStore.values()].filter((item) => {
    return !tenantId || item.tenantId === tenantId;
  });
}

function resetOpenAIEscalations() {
  escalationStore.clear();
}

module.exports = {
  getOpenAIEscalation,
  listOpenAIEscalations,
  resetOpenAIEscalations,
  routeOpenAIEscalation
};
