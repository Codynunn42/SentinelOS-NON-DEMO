const assert = require('assert');
const { dispatchCommand } = require('../apps/sentinel/src/commands/dispatch');
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

function approval(id, overrides = {}) {
  return {
    id,
    status: 'pending',
    createdAt: overrides.createdAt || '2026-05-15T00:00:00.000Z',
    decision: {
      reason: overrides.reason || 'approval_required',
      riskLevel: overrides.riskLevel || 'medium'
    },
    context: {
      tenant: 'nunncloud',
      actor: principal.actor,
      originalCommand: {
        command: overrides.command || 'support.refund.request',
        payload: {
          customerId: overrides.customerId || 'cust_repeat',
          refundRequestId: overrides.refundRequestId || 'refund_repeat'
        },
        metadata: {
          actor: principal.actor
        }
      }
    }
  };
}

async function command(payload) {
  return dispatchCommand(signLocalCommand({
    tenant: 'nunncloud',
    command: 'approval.bottleneck.analyze',
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

  const result = await command({
    now: '2026-05-15T02:00:00.000Z',
    staleAfterMinutes: 60,
    approvals: [
      approval('approval_duplicate_a'),
      approval('approval_duplicate_b'),
      approval('approval_stale_unique', {
        customerId: 'cust_stale',
        refundRequestId: 'refund_stale',
        createdAt: '2026-05-14T23:00:00.000Z'
      }),
      approval('approval_security_high', {
        customerId: 'cust_security',
        refundRequestId: 'refund_security',
        command: 'security.write',
        reason: 'security_sensitive_operation',
        riskLevel: 'high'
      }),
      {
        ...approval('approval_already_resolved', {
          customerId: 'cust_done',
          refundRequestId: 'refund_done'
        }),
        status: 'approved'
      }
    ]
  });

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.data.result.status, 'analysis_complete');
  assert.strictEqual(result.data.result.executionMode, 'analysis_only');
  assert.strictEqual(result.data.result.policyChangeRecommended, false);
  assert.strictEqual(result.data.result.safeToAdjustPolicy, false);
  assert.strictEqual(result.data.result.summary.totalApprovals, 5);
  assert.strictEqual(result.data.result.summary.pendingApprovals, 4);
  assert.strictEqual(result.data.result.summary.duplicatePendingGroups, 1);
  assert.strictEqual(result.data.result.summary.stalePendingApprovals, 4);
  assert.strictEqual(result.data.result.summary.highRiskPendingApprovals, 1);
  assert.ok(result.data.result.classifications.includes('duplicate_pending_approvals'));
  assert.ok(result.data.result.classifications.includes('stale_pending_approvals'));
  assert.ok(result.data.result.classifications.includes('legitimate_risk_concentration'));
  assert.strictEqual(
    result.data.result.nextAction,
    'clear_duplicates_and_stale_before_policy_adjustment'
  );
  assert.ok(result.data.result.recommendations.some((entry) => (
    entry.action === 'preserve_high_risk_approval_gate' &&
    entry.policyChangeRecommended === false
  )));

  console.log('Approval bottleneck analysis check passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
