// C5.3 — AI Operations: Model Broker
// COMM: Sentinel AI by Cody Nunn | Nunn Cloud
//
// The Model Broker routes AI capability requests to the best approved model
// per policy, data classification, and provider health. It follows the same
// architecture as the Capability Broker (C3.5 / C4):
//   1. Resolve candidate models for the requested capability
//   2. Apply data classification policy — drop models not approved for this classification
//   3. Apply role gate — drop models that require a higher role
//   4. Score and rank remaining candidates
//   5. Return the top candidate or full ranked list
//   6. If no approved model passes all gates, return MODEL_BROKER_NO_ROUTE
//
// Per the SentinelOS Constitution, Principle VI:
//   AI must be governed identically to all other institutional capabilities.
//   There are no exceptions.
//
// Routing decisions include evidence fields so the sovereign runtime can
// append them to the SEL ledger like any other brokered capability.

'use strict';

const {
  listModels,
  MODEL_LIFECYCLE
} = require('./modelRegistry');

// Provider health scoring — same scale as Capability Broker
const HEALTH_SCORE = { healthy: 2, unknown: 1, degraded: 0 };

/**
 * Score a model candidate.
 * Higher score = preferred.
 *
 * @param {import('./modelRegistry').ModelRecord} model
 * @returns {number}
 */
function scoreModelCandidate(model) {
  const healthScore = HEALTH_SCORE[model.providerHealth] !== undefined
    ? HEALTH_SCORE[model.providerHealth]
    : HEALTH_SCORE.unknown;

  const evidenceBonus = model.governance && model.governance.evidenceRequired ? 1 : 0;

  const cost = typeof model.cost === 'number' ? model.cost : 5;
  const costScore = Math.max(0, 10 - cost);

  const latencyMs = typeof model.latencyMs === 'number' ? model.latencyMs : 500;
  const latencyScore = latencyMs <= 100 ? 3 : latencyMs <= 300 ? 2 : latencyMs <= 600 ? 1 : 0;

  return (healthScore * 4) + (evidenceBonus * 2) + costScore + latencyScore;
}

/**
 * Route an AI capability request to the best approved model.
 *
 * @param {{ capability: string, dataClassification: string, role?: string, tenant?: string }} params
 * @returns {{ routed: boolean, modelId?: string, provider?: string, score?: number, candidates?: object[], reason?: string, evidenceRef?: string }}
 */
function brokerAICapability(params) {
  const { capability, dataClassification, role, tenant } = params || {};

  if (!capability) {
    return { routed: false, reason: 'AI_CAPABILITY_REQUIRED' };
  }
  if (!dataClassification) {
    return { routed: false, reason: 'DATA_CLASSIFICATION_REQUIRED' };
  }

  // Resolve all active models that support this capability
  const allActive = listModels({ lifecycleStatus: MODEL_LIFECYCLE.ACTIVE });

  const capabilityMatch = allActive.filter((m) => m.capabilities.includes(capability));

  if (capabilityMatch.length === 0) {
    return { routed: false, reason: 'MODEL_NO_CAPABILITY_REGISTERED', capability };
  }

  // Apply data classification gate
  const classificationPassed = capabilityMatch.filter((m) =>
    m.approvedDataClassifications.includes(dataClassification)
  );

  if (classificationPassed.length === 0) {
    return {
      routed: false,
      reason: 'DATA_CLASSIFICATION_POLICY_DENIED',
      capability,
      dataClassification,
      hint: `No approved model for capability '${capability}' at classification '${dataClassification}'`
    };
  }

  // Apply role gate
  const rolePassed = classificationPassed.filter((m) => {
    const minimumRole = m.governance && m.governance.minimumRole;
    if (minimumRole === 'executive') {
      return role === 'executive' || role === 'platform';
    }
    return true;
  });

  if (rolePassed.length === 0) {
    return {
      routed: false,
      reason: 'INSUFFICIENT_ROLE',
      capability,
      requiredRole: 'executive',
      providedRole: role || null
    };
  }

  // Score and rank
  const scored = rolePassed.map((m) => ({
    modelId: m.modelId,
    provider: m.provider,
    modelName: m.modelName,
    providerHealth: m.providerHealth,
    dataClassification,
    governance: m.governance,
    score: scoreModelCandidate(m),
    selectionRationale: {
      healthScore: HEALTH_SCORE[m.providerHealth] !== undefined ? HEALTH_SCORE[m.providerHealth] : HEALTH_SCORE.unknown,
      approvedForClassification: true,
      capability
    }
  })).sort((a, b) => b.score - a.score);

  const selected = scored[0];

  return {
    routed: true,
    modelId: selected.modelId,
    provider: selected.provider,
    modelName: selected.modelName,
    providerHealth: selected.providerHealth,
    score: selected.score,
    candidates: scored,
    selected,
    evidenceRef: `ai-ops/${selected.modelId}/${Date.now()}`,
    governanceAdvice: {
      evidenceRequired: selected.governance && selected.governance.evidenceRequired,
      dataClassification,
      capability,
      tenant: tenant || null
    }
  };
}

/**
 * Get a list of all approved models for a given capability and classification.
 * Useful for executive-level visibility into AI governance posture.
 *
 * @param {{ capability?: string, dataClassification?: string }} [options]
 * @returns {object[]}
 */
function listApprovedModels(options = {}) {
  return listModels({
    lifecycleStatus: MODEL_LIFECYCLE.ACTIVE,
    capability: options.capability,
    dataClassification: options.dataClassification
  }).map((m) => ({
    modelId: m.modelId,
    provider: m.provider,
    modelName: m.modelName,
    capabilities: m.capabilities,
    approvedDataClassifications: m.approvedDataClassifications,
    providerHealth: m.providerHealth,
    governance: m.governance
  }));
}

module.exports = {
  scoreModelCandidate,
  brokerAICapability,
  listApprovedModels
};
