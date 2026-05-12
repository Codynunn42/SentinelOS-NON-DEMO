// Drift Recommendations
// Purpose: Map detected drift signals to governed recommendations.
// Sentinel proposes. Humans authorize. Nothing executes automatically.

const { createDriftRecommendation, DRIFT_TYPES } = require('./driftSchemas');

const RECOMMENDATION_MAP = {
  [DRIFT_TYPES.governance]: (signal) => createDriftRecommendation({
    type: 'governance_optimization',
    severity: signal.severity,
    source: signal.source,
    detectedPattern: signal.pattern,
    recommendedAction: 'Review approval routing rules. Consider adding a fast-path approval tier for low-risk commands.',
    riskAssessment: {
      governanceRisk: 'medium',
      operationalImpact: 'positive'
    },
    proposedFork: {
      branchName: 'fork/drift-approval-threshold-adjustment',
      targetFiles: ['apps/sentinel/src/governance/policyEngine.js'],
      rationale: 'Reduce approval bottleneck by introducing tiered approval thresholds.'
    },
    tenant: signal.tenant,
    correlationId: signal.signalId
  }),

  [DRIFT_TYPES.operator]: (signal) => createDriftRecommendation({
    type: 'policy_refinement',
    severity: signal.severity,
    source: signal.source,
    detectedPattern: signal.pattern,
    recommendedAction: 'Review repeated operator overrides. Consider codifying the override pattern as a policy rule.',
    riskAssessment: {
      governanceRisk: 'low',
      operationalImpact: 'positive'
    },
    proposedFork: {
      branchName: 'fork/drift-operator-override-policy',
      targetFiles: ['apps/sentinel/src/governance/policyEngine.js'],
      rationale: 'Reduce manual override friction by encoding observed operator behavior as policy.'
    },
    tenant: signal.tenant,
    correlationId: signal.signalId
  }),

  [DRIFT_TYPES.workflow]: (signal) => createDriftRecommendation({
    type: 'workflow_optimization',
    severity: signal.severity,
    source: signal.source,
    detectedPattern: signal.pattern,
    recommendedAction: 'Investigate repeated blocked commands. Consider adding a pre-validation step or adjusting command routing.',
    riskAssessment: {
      governanceRisk: 'low',
      operationalImpact: 'positive'
    },
    proposedFork: {
      branchName: 'fork/drift-workflow-retry-reduction',
      targetFiles: ['apps/sentinel/src/commands/dispatch.js'],
      rationale: 'Reduce repeated blocked execution by improving pre-dispatch validation.'
    },
    tenant: signal.tenant,
    correlationId: signal.signalId
  }),

  [DRIFT_TYPES.telemetry]: (signal) => createDriftRecommendation({
    type: 'telemetry_normalization',
    severity: signal.severity,
    source: signal.source,
    detectedPattern: signal.pattern,
    recommendedAction: 'Investigate blocked-path spike. Review telemetry severity classification and alert thresholds.',
    riskAssessment: {
      governanceRisk: 'low',
      operationalImpact: 'neutral'
    },
    proposedFork: {
      branchName: 'fork/drift-telemetry-normalization',
      targetFiles: ['apps/sentinel/src/telemetry/telemetrySchema.js'],
      rationale: 'Normalize telemetry severity to reduce alert noise and improve signal quality.'
    },
    tenant: signal.tenant,
    correlationId: signal.signalId
  }),

  [DRIFT_TYPES.infrastructure]: (signal) => createDriftRecommendation({
    type: 'infrastructure_hardening',
    severity: signal.severity,
    source: signal.source,
    detectedPattern: signal.pattern,
    recommendedAction: 'Review failed system events. Consider adding deployment health gates or rollback triggers.',
    riskAssessment: {
      governanceRisk: 'medium',
      operationalImpact: 'positive'
    },
    proposedFork: {
      branchName: 'fork/drift-deployment-stability',
      targetFiles: ['apps/sentinel/src/verification/stateAnchors.js'],
      rationale: 'Improve deployment stability by anchoring state before and after system events.'
    },
    tenant: signal.tenant,
    correlationId: signal.signalId
  })
};

function buildRecommendations(signals) {
  return signals
    .map((signal) => {
      const builder = RECOMMENDATION_MAP[signal.type];
      return builder ? builder(signal) : null;
    })
    .filter(Boolean);
}

module.exports = {
  buildRecommendations
};
