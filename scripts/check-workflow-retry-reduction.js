const assert = require('assert');
const { dispatchCommand } = require('../apps/sentinel/src/commands/dispatch');
const {
  resetLocalPassportState,
  signLocalCommand
} = require('./lib/sentinelPassport');

async function main() {
  resetLocalPassportState();

  const approvalBlocked = await dispatchCommand(signLocalCommand({
    tenant: 'ownerfi',
    command: 'deal.execute',
    source: 'sentinel',
    payload: { applicationId: 'app_retry_guidance' },
    metadata: {
      source: 'sentinel',
      actor: 'operator@example.com',
      role: 'operator',
      scopes: ['deal:execute']
    }
  }), {
    principal: {
      tenant: 'ownerfi',
      actor: 'operator@example.com',
      role: 'operator',
      scopes: ['deal:execute']
    },
    source: 'sentinel'
  });

  assert.strictEqual(approvalBlocked.success, false);
  assert.strictEqual(approvalBlocked.error, 'APPROVAL_REQUIRED');
  assert.strictEqual(approvalBlocked.data.retry.retryable, true);
  assert.strictEqual(approvalBlocked.data.retry.retryWhen, 'approval_approved');
  assert.strictEqual(approvalBlocked.data.retry.concept, 'approval_continuity');

  const policyBlocked = await dispatchCommand(signLocalCommand({
    tenant: 'ownerfi',
    command: 'application.evaluate',
    source: 'sentinel',
    payload: { applicationId: 'app_retry_guidance' },
    metadata: {
      source: 'sentinel',
      actor: 'operator@example.com',
      role: 'operator',
      scopes: ['application:submit']
    }
  }), {
    principal: {
      tenant: 'ownerfi',
      actor: 'operator@example.com',
      role: 'operator',
      scopes: ['application:submit']
    },
    source: 'sentinel'
  });

  assert.strictEqual(policyBlocked.success, false);
  assert.strictEqual(policyBlocked.error, 'SCOPE_REQUIRED');
  assert.strictEqual(policyBlocked.data.retry.retryable, false);
  assert.strictEqual(policyBlocked.data.retry.concept, 'policy_boundary');

  const authorityBlocked = await dispatchCommand({
    tenant: 'ownerfi',
    command: 'application.submit',
    payload: {}
  }, {
    principal: {
      tenant: 'ownerfi',
      actor: 'operator@example.com',
      role: 'operator',
      scopes: ['application:submit']
    }
  });

  assert.strictEqual(authorityBlocked.success, false);
  assert.strictEqual(authorityBlocked.error, 'UNAUTHORIZED_EXECUTION');
  assert.strictEqual(authorityBlocked.data.retry.retryable, false);
  assert.strictEqual(authorityBlocked.data.retry.concept, 'execution_authority');

  const unknownRoute = await dispatchCommand(signLocalCommand({
    tenant: 'unknownTenant',
    command: 'application.submit',
    source: 'sentinel',
    payload: { applicationId: 'app_unknown_route' },
    metadata: {
      source: 'sentinel',
      actor: 'platform@example.com',
      role: 'platform',
      scopes: ['application:submit']
    }
  }), {
    principal: {
      tenant: 'platform',
      actor: 'platform@example.com',
      role: 'platform',
      scopes: ['application:submit']
    },
    source: 'sentinel'
  });

  assert.strictEqual(unknownRoute.success, false);
  assert.strictEqual(unknownRoute.error, 'Unknown tenant: unknownTenant');
  assert.strictEqual(unknownRoute.data.retry.retryable, false);
  assert.strictEqual(unknownRoute.data.retry.concept, 'surface_registry');

  console.log('Workflow retry reduction check passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
