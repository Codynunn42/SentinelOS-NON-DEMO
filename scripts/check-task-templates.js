const assert = require('assert');
const {
  APPROVAL_BADGES,
  buildApprovalCandidates,
  buildBoundaryOutput,
  buildTimeline,
  buildXeQueue,
  executeTaskStep,
  normalizeTask,
  orchestrateTaskTemplates,
  runStepThroughCommand
} = require('../apps/sentinel/src/orchestration/taskTemplates');

async function main() {
  const createdApprovals = [];
  const createApprovalRequest = async (decision, context) => {
    const approval = {
      id: `approval_${context.taskId}`,
      status: 'pending',
      decision,
      context
    };
    createdApprovals.push(approval);
    return approval;
  };

  const normalized = normalizeTask({
    id: 'task_vendor_final',
    title: 'Finalize vendor onboarding approval',
    category: 'conditional',
    source: 'docs/VENDOR_ONBOARDING_RULE_SET_V1.md',
    xeRequired: true
  });
  assert.strictEqual(normalized.category, 'conditional_approval');
  assert.strictEqual(normalized.badge, APPROVAL_BADGES.conditional);
  assert.strictEqual(normalized.approvalRequired, true);
  assert.strictEqual(normalized.xeRequired, true);

  const tasks = [
    normalized,
    normalizeTask({
      id: 'task_arizona_hold',
      title: 'Review Arizona SPO draft before external use',
      category: 'hold',
      source: 'docs/ARIZONA_SPO_MODERNIZATION_BRIEF_LAYOUT.md'
    }, 1),
    normalizeTask({
      id: 'task_mapping_index',
      title: 'Maintain canonical mapping index',
      category: 'mapping',
      source: 'docs/README.md',
      approvalRequired: false
    }, 2)
  ];

  const timeline = buildTimeline(tasks);
  assert.strictEqual(timeline.length, 3);
  assert(timeline.every((entry) => entry.sequence > 0));

  const candidates = buildApprovalCandidates(tasks);
  assert.strictEqual(candidates.length, 2);
  assert(candidates.some((item) => item.taskId === 'task_vendor_final'));
  assert(candidates.some((item) => item.taskId === 'task_arizona_hold'));

  const xeQueue = buildXeQueue(tasks);
  assert.strictEqual(xeQueue.length, 1);
  assert.strictEqual(xeQueue[0].taskId, 'task_vendor_final');
  assert.strictEqual(xeQueue[0].status, 'waiting_for_approval');

  const run = await orchestrateTaskTemplates({
    tenant: 'ownerfi',
    runId: 'task_run_check_001',
    createApprovals: true,
    tasks: [
      {
        id: 'task_governance_mapping',
        title: 'Complete governance mapping evidence',
        category: 'mapping',
        source: 'docs/SENTINEL_GOVERNANCE_COMPLIANCE_APPROVAL_REPORT_2026-05-04.md'
      },
      {
        id: 'task_xe_assist',
        title: 'Prepare XE assistance for approval follow-through',
        category: 'xe',
        xeRequired: true,
        nextStep: 'Queue XE only after the human approval is recorded.'
      }
    ]
  }, { createApprovalRequest });

  assert.strictEqual(run.status, 'orchestrated');
  assert.strictEqual(run.summary.taskCount, 2);
  assert.strictEqual(run.summary.approvalsNeeded, 2);
  assert.strictEqual(run.summary.xeActionsNeeded, 1);
  assert.strictEqual(run.summary.approvalsCreated, 2);
  assert.strictEqual(run.approvalRecords.length, 2);
  assert.strictEqual(run.boundary.requiresApproval.length, 2);
  assert.strictEqual(run.boundary.blockedActions.length, 2);
  assert.strictEqual(run.boundary.xeActions.length, 0);
  assert.strictEqual(createdApprovals.length, 2);
  assert(run.auditHash && run.auditHash.length === 64);
  assert(createdApprovals.every((approval) => approval.context.approvalType === 'task_template_approval'));

  const boundary = buildBoundaryOutput({
    ...run,
    approvalRecords: run.approvalRecords.map((record) => ({ ...record, status: 'approved' }))
  });
  assert.strictEqual(boundary.requiresApproval.length, 0);
  assert.strictEqual(boundary.xeActions.length, 1);

  const blockedExecution = executeTaskStep(run.tasks[1]);
  assert.strictEqual(blockedExecution.status, 'BLOCKED');
  assert.strictEqual(blockedExecution.reason, 'Approval required');

  const approvedExecution = executeTaskStep(run.tasks[1], {
    approvalStatusByTaskId: {
      task_xe_assist: 'approved'
    }
  });
  assert.strictEqual(approvedExecution.status, 'SUCCESS');

  const commandBridge = runStepThroughCommand(run.tasks[1]);
  assert.strictEqual(commandBridge.command, 'task.template.execute');
assert.strictEqual(commandBridge.policy.requiresApproval, true);
assert.strictEqual(commandBridge.result.status, 'BLOCKED');

const billingTask = normalizeTask({
  title: 'Create governed checkout session',
  category: 'billing.checkout.create'
});

assert.strictEqual(billingTask.category, 'billing_checkout');
assert.strictEqual(billingTask.approvalRequired, true);
assert.strictEqual(billingTask.badge, '[APPROVE:BILLING]');
assert.strictEqual(billingTask.riskLevel, 'high');

console.log('Task template orchestration check passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
