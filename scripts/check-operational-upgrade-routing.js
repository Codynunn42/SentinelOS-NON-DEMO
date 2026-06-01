const assert = require('assert');

process.env.SENTINEL_API_KEY = 'operational-upgrade-routing-secret';
process.env.SENTINEL_HMAC_SECRET = process.env.SENTINEL_HMAC_SECRET || 'operational-upgrade-routing-hmac';
process.env.SENTINEL_API_KEY_TENANT = 'contractreclamation';
process.env.SENTINEL_API_KEY_ACTOR = 'operator@nunncloud.local';
process.env.SENTINEL_API_KEY_ROLE = 'operator';

const { getSurfaceRegistry } = require('../apps/sentinel/src/commands/registry');
const { dispatchCommand } = require('../apps/sentinel/src/commands/dispatch');
const {
  resetLocalPassportState,
  signLocalCommand
} = require('./lib/sentinelPassport');

async function main() {
  resetLocalPassportState();
  const registry = getSurfaceRegistry();
  assert(registry.contractreclamation);
  assert(registry.contractreclamation.handlers['operational.upgrade.assess']);
  assert(registry.contractreclamation.handlers['operational.upgrade.plan.prepare']);

  const context = {
    principal: {
      actor: 'operator@nunncloud.local',
      role: 'platform',
      tenant: 'contractreclamation',
      scopes: ['platform:admin']
    },
    route: '/v1/command',
    source: 'sentinel',
    buildReceipt: (command, target, result, tenant) => ({
      receiptId: `receipt_${target.id}`,
      auditId: `audit_${target.id}`,
      command,
      target,
      result,
      tenant
    }),
    emitSecurityEvent: () => {}
  };

  const assessment = await dispatchCommand(signLocalCommand({
    tenant: 'contractreclamation',
    command: 'operational.upgrade.assess',
    payload: {
      obligation: 'Validate vendor transition evidence before approval',
      evidence: ['signed-order.pdf', 'transition-log.json'],
      requestedOutcome: 'prepare approval-aware upgrade plan',
      approver: 'ops-lead@nunncloud.local'
    },
    metadata: {
      actor: 'operator@nunncloud.local',
      role: 'platform',
      scopes: ['platform:admin']
    }
  }), context);

  assert.strictEqual(assessment.success, true);
  assert.strictEqual(assessment.statusCode, 200);
  assert.strictEqual(assessment.data.result.status, 'review_ready');
  assert.strictEqual(assessment.data.result.executionBlocked, true);
  assert.strictEqual(assessment.data.result.authorityCreated, false);

  const plan = await dispatchCommand(signLocalCommand({
    tenant: 'contractreclamation',
    command: 'operational.upgrade.plan.prepare',
    payload: {
      assessmentId: assessment.data.result.assessmentId,
      evidence: ['signed-order.pdf'],
      requiredApprovals: ['ops_lead']
    },
    metadata: {
      actor: 'operator@nunncloud.local',
      role: 'platform',
      scopes: ['platform:admin']
    }
  }), context);

  assert.strictEqual(plan.success, true);
  assert.strictEqual(plan.statusCode, 200);
  assert.strictEqual(plan.data.result.status, 'prepared_for_review');
  assert.strictEqual(plan.data.result.executionStatus, 'held');
  assert.strictEqual(plan.data.result.authorityCreated, false);

  console.log('Operational upgrade routing check passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
