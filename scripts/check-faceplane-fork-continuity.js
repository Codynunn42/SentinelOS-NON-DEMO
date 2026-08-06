const assert = require('assert');
const { analyzeDrift } = require('../apps/sentinel/src/drift/driftAnalyzer');
const { isForkTargetAllowed } = require('../apps/sentinel/src/drift/driftPolicies');
const { runAll } = require('../apps/sentinel/src/faceplanes/mock');

const FACEPLANES = ['ownerfi', 'hotelops', 'itad'];

const CONCEPT_BY_RECOMMENDATION = Object.freeze({
  governance_optimization: {
    concept: 'approval_continuity',
    fork: 'fork/drift-approval-threshold-adjustment'
  },
  policy_refinement: {
    concept: 'policy_boundary',
    fork: 'fork/drift-operator-override-policy'
  },
  workflow_optimization: {
    concept: 'workflow_control',
    fork: 'fork/drift-workflow-retry-reduction'
  },
  telemetry_normalization: {
    concept: 'telemetry_normalization',
    fork: 'fork/drift-telemetry-normalization'
  },
  infrastructure_hardening: {
    concept: 'deployment_stability',
    fork: 'fork/drift-deployment-stability'
  }
});

function auditEntry({ tenant, command, result, index }) {
  return {
    tenant,
    command,
    payload: { source: 'faceplane_fork_continuity_check', index },
    result,
    actor: 'sentinel-continuity@sentinel.local',
    timestamp: new Date(Date.UTC(2026, 4, 15, 13, index, 0)).toISOString()
  };
}

function auditFromRun(run) {
  const entries = [];
  let index = 0;

  for (const faceplaneRun of run.results || []) {
    const tenant = faceplaneRun.tenant || `${faceplaneRun.faceplane}-mock`;

    for (const approval of faceplaneRun.approvals || []) {
      entries.push(auditEntry({
        tenant,
        command: 'approval.requested',
        index: index += 1,
        result: {
          success: true,
          approvalRequired: true,
          riskLevel: approval.riskLevel,
          approvalType: approval.context && approval.context.approvalType
        }
      }));
    }

    for (const blocked of faceplaneRun.blocked || []) {
      entries.push(auditEntry({
        tenant,
        command: blocked.command || 'blocked-path',
        index: index += 1,
        result: {
          success: false,
          governance: 'preflight',
          decision: 'block',
          error: blocked.reason || 'mock_policy_block'
        }
      }));
      entries.push(auditEntry({
        tenant,
        command: 'blocked-path',
        index: index += 1,
        result: {
          success: false,
          governance: 'preflight',
          status: 'blocked',
          reason: blocked.reason || 'mock_policy_block'
        }
      }));
    }
  }

  entries.push(auditEntry({
    tenant: 'platform',
    command: 'system.validate.integrity',
    index: index += 1,
    result: { success: false, error: 'synthetic_faceplane_drift_probe' }
  }));
  entries.push(auditEntry({
    tenant: 'platform',
    command: 'system.validate.integrity',
    index: index += 1,
    result: { success: false, error: 'synthetic_faceplane_drift_probe' }
  }));

  return entries;
}

function assertRecommendationContinuity(analysis) {
  assert.strictEqual(analysis.status, 'drift_detected');
  assert(analysis.recommendations.length >= 3, 'expected at least three recommendation types');
  assert.strictEqual(analysis.summary.recommendationCount, analysis.forkProposals.length);
  assert.strictEqual(analysis.summary.requiresHumanApproval, true);

  for (const recommendation of analysis.recommendations) {
    const concept = CONCEPT_BY_RECOMMENDATION[recommendation.type];
    assert(concept, `missing concept mapping for ${recommendation.type}`);
    assert.strictEqual(recommendation.requiresHumanApproval, true);
    assert(recommendation.proposedFork, `missing fork for ${recommendation.type}`);
    assert.strictEqual(recommendation.proposedFork.branchName, concept.fork);
    assert(recommendation.recommendedAction && recommendation.recommendedAction.length > 20);
  }

  for (const proposal of analysis.forkProposals) {
    assert.notStrictEqual(proposal.status, 'blocked');
    assert.strictEqual(proposal.requiresHumanApproval, true);
    assert(Array.isArray(proposal.targetFiles));
    assert(proposal.targetFiles.length >= 1);
    proposal.targetFiles.forEach((target) => {
      assert.strictEqual(isForkTargetAllowed(target), true, `${target} is not an allowed fork target`);
    });
  }
}

async function main() {
  const run = runAll({
    faceplanes: FACEPLANES,
    commandsPerRun: 12,
    approvalRate: 0.9,
    blockRate: 0.75,
    telemetryState: 'LIMITED',
    telemetryActivityCount: 12
  });

  assert.deepStrictEqual(run.faceplanes, FACEPLANES);
  assert.strictEqual(run.results.length, FACEPLANES.length);
  assert(run.totals.commandCount >= 36);
  assert(run.totals.approvalCount >= 3);
  assert(run.totals.blockedCount >= 3);

  const auditLog = auditFromRun(run);
  const analysis = await analyzeDrift(auditLog, {
    tenant: null,
    routeApprovals: false
  });

  assertRecommendationContinuity(analysis);

  const recommendationTypes = analysis.recommendations.map((rec) => rec.type).sort();
  assert(recommendationTypes.includes('governance_optimization'));
  assert(recommendationTypes.includes('workflow_optimization'));
  assert(recommendationTypes.includes('telemetry_normalization'));
  assert(recommendationTypes.includes('infrastructure_hardening'));

  console.log(JSON.stringify({
    status: 'passed',
    faceplanes: run.faceplanes,
    commandCount: run.totals.commandCount,
    approvalCount: run.totals.approvalCount,
    blockedCount: run.totals.blockedCount,
    signalCount: analysis.summary.signalCount,
    recommendationTypes,
    forkProposals: analysis.forkProposals.map((proposal) => proposal.branchName)
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
