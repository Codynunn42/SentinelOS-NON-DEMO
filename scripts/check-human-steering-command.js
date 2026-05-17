const assert = require('assert');
const { dispatchCommand } = require('../apps/sentinel/src/commands/dispatch');
const { createDriftRecommendation } = require('../apps/sentinel/src/drift/driftSchemas');
const { get, save } = require('../apps/sentinel/src/drift/driftStore');
const {
  resetLocalPassportState,
  signLocalCommand
} = require('./lib/sentinelPassport');

const principal = {
  tenant: 'nunncloud',
  actor: 'cody@nunncloud.local',
  role: 'platform',
  scopes: ['platform:admin']
};

async function command(payload) {
  return dispatchCommand(signLocalCommand({
    tenant: 'nunncloud',
    command: 'drift.recommendation.instruct',
    source: 'sentinel',
    payload,
    metadata: {
      source: 'sentinel',
      actor: principal.actor,
      role: principal.role,
      scopes: principal.scopes
    }
  }), {
    principal,
    source: 'sentinel'
  });
}

async function main() {
  resetLocalPassportState();

  const recommendation = save(createDriftRecommendation({
    recommendationId: 'drift_rec_human_steering_check',
    type: 'workflow_optimization',
    severity: 'elevated',
    source: 'human_steering_check',
    detectedPattern: 'Repeated blocked commands indicate workflow retry friction',
    recommendedAction: 'Investigate repeated blocked commands before the next retry.',
    riskAssessment: {
      governanceRisk: 'low',
      operationalImpact: 'positive'
    },
    proposedFork: {
      branchName: 'fork/drift-workflow-retry-reduction',
      targetFiles: ['apps/sentinel/src/commands/dispatch.js'],
      rationale: 'Reduce repeated blocked execution by improving pre-dispatch guidance.'
    },
    tenant: 'nunncloud'
  }));

  const redirected = await command({
    recommendationId: recommendation.recommendationId,
    action: 'redirect',
    humanInput: 'Keep the fork narrow. Do not touch policy yet. Add retry guidance only.',
    modifiedRecommendation: {
      recommendedAction: 'Add retry guidance to blocked command responses before changing policy.'
    },
    proposedFork: {
      branchName: 'fork/drift-workflow-retry-reduction',
      targetFiles: ['apps/sentinel/src/commands/dispatch.js'],
      rationale: 'Human-directed retry guidance before policy changes.'
    }
  });

  assert.strictEqual(redirected.success, true);
  assert.strictEqual(redirected.data.result.status, 'instruction_recorded');
  assert.strictEqual(redirected.data.result.action, 'redirect');
  assert.strictEqual(redirected.data.result.recommendationStatus, 'pending_approval');
  assert.strictEqual(redirected.data.result.operator, principal.actor);
  assert.strictEqual(redirected.data.result.proposedFork.targetFiles[0], 'apps/sentinel/src/commands/dispatch.js');

  const updated = get(recommendation.recommendationId);
  assert.strictEqual(updated.status, 'pending_approval');
  assert.strictEqual(updated.recommendedAction, 'Add retry guidance to blocked command responses before changing policy.');
  assert.strictEqual(updated.resolution.humanInput, 'Keep the fork narrow. Do not touch policy yet. Add retry guidance only.');

  const blocked = await command({
    recommendationId: recommendation.recommendationId,
    action: 'modify',
    humanInput: 'Try changing signing directly.',
    proposedFork: {
      branchName: 'fork/unsafe-signing-change',
      targetFiles: ['apps/sentinel/src/security/signing.js'],
      rationale: 'Unsafe direct signing change.'
    }
  });

  assert.strictEqual(blocked.success, false);
  assert.strictEqual(blocked.error, 'FORK_TARGET_NOT_ALLOWED');
  assert.deepStrictEqual(blocked.details.blockedTargets, ['apps/sentinel/src/security/signing.js']);

  console.log('Human steering command check passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
