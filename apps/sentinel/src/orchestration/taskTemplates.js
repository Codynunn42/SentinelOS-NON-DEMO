const crypto = require('crypto');
const { runTelemetryHarmonizer } = require('../telemetry/telemetryHarmonizer');

const APPROVAL_BADGES = {
  approved: '[APPROVED:TASK]',
  conditional: '[APPROVE:CONDITIONAL]',
  hold: '[HOLD:REVIEW]',
  xeAssist: '[XE:ASSISTANCE]',
  mapped: '[APPROVED:MAPPING]'
};

const DEFAULT_TEMPLATES = [
  {
    id: 'tpl_mapping_alignment',
    category: 'mapping_alignment',
    title: 'Map governance/compliance artifacts to source evidence',
    badge: APPROVAL_BADGES.mapped,
    riskLevel: 'medium',
    approvalPolicy: 'human_review_required',
    xeEligible: false,
    reason: 'Canonical mappings must exist before streamlining or external publication.'
  },
  {
    id: 'tpl_conditional_approval',
    category: 'conditional_approval',
    title: 'Advance conditional approval toward final approval',
    badge: APPROVAL_BADGES.conditional,
    riskLevel: 'medium',
    approvalPolicy: 'human_review_required',
    xeEligible: true,
    reason: 'Conditional items need evidence, verification, and a final human decision.'
  },
  {
    id: 'tpl_hold_review',
    category: 'held_review',
    title: 'Hold draft material until review is complete',
    badge: APPROVAL_BADGES.hold,
    riskLevel: 'high',
    approvalPolicy: 'human_review_required',
    xeEligible: false,
    reason: 'Held material cannot become canonical or external without explicit approval.'
  },
  {
    id: 'tpl_xe_assistance',
    category: 'xe_assistance',
    title: 'Queue execution assistance for Sentinel XE',
    badge: APPROVAL_BADGES.xeAssist,
    riskLevel: 'medium',
    approvalPolicy: 'approval_before_execution',
    xeEligible: true,
    reason: 'XE actions can assist only after required approvals are recorded.'
  },
  {
    id: 'tpl_billing_checkout',
    category: 'billing_checkout',
    title: 'Govern Stripe checkout creation',
    badge: '[APPROVE:BILLING]',
    riskLevel: 'high',
    approvalPolicy: 'approval_before_execution',
    xeEligible: true,
    reason: 'Revenue actions require approved configuration, pricing, and audit boundaries before execution.'
  }
];

const runs = new Map();

function hasText(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
}

function hashObject(value) {
  return crypto.createHash('sha256').update(stableStringify(value)).digest('hex');
}

function normalizeCategory(value) {
  const category = hasText(value) ? value.trim().toLowerCase() : '';

  if (['mapping', 'mapping_alignment', 'governance_mapping'].includes(category)) {
    return 'mapping_alignment';
  }

  if (['conditional', 'conditional_approval', 'approve_conditional'].includes(category)) {
    return 'conditional_approval';
  }

  if (['hold', 'held', 'held_review', 'review_hold'].includes(category)) {
    return 'held_review';
  }

  if (['xe', 'xe_assist', 'xe_assistance', 'execution_assistance'].includes(category)) {
    return 'xe_assistance';
  }

  if (['billing', 'billing_checkout', 'checkout', 'checkout_create', 'billing.checkout.create'].includes(category)) {
    return 'billing_checkout';
  }

  return category || 'conditional_approval';
}

function findTemplate(category, templates = DEFAULT_TEMPLATES) {
  const normalized = normalizeCategory(category);
  return templates.find((template) => template.category === normalized) || DEFAULT_TEMPLATES[1];
}

function parseDueAt(value, index) {
  if (hasText(value)) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return new Date(Date.now() + index * 15 * 60000).toISOString();
}

function normalizeTask(item = {}, index = 0, templates = DEFAULT_TEMPLATES) {
  const template = findTemplate(item.category, templates);
  const title = hasText(item.title) ? item.title.trim() : template.title;
  const category = normalizeCategory(item.category || template.category);
  const id = hasText(item.id)
    ? item.id.trim()
    : `task_${hashObject({ title, category, index }).slice(0, 12)}`;

  const approvalRequired =
    item.approvalRequired === false
      ? false
      : template.approvalPolicy === 'human_review_required' ||
        template.approvalPolicy === 'approval_before_execution';

  const xeRequired = item.xeRequired === true || item.xeEligible === true || template.xeEligible === true;

  return {
    id,
    title,
    category,
    badge: hasText(item.badge) ? item.badge.trim() : template.badge,
    source: hasText(item.source) ? item.source.trim() : null,
    status: hasText(item.status) ? item.status.trim() : 'pending',
    priority: Number.isFinite(item.priority) ? item.priority : index + 1,
    dueAt: parseDueAt(item.dueAt, index),
    riskLevel: hasText(item.riskLevel) ? item.riskLevel.trim().toLowerCase() : template.riskLevel,
    approvalRequired,
    approvalPolicy: template.approvalPolicy,
    xeRequired,
    dependencies: Array.isArray(item.dependencies) ? item.dependencies.filter(hasText) : [],
    reason: hasText(item.reason) ? item.reason.trim() : template.reason,
    nextStep: hasText(item.nextStep)
      ? item.nextStep.trim()
      : approvalRequired
        ? 'Prepare evidence and route for human approval.'
        : 'Proceed under existing mapped approval.',
    metadata: item.metadata && typeof item.metadata === 'object' ? item.metadata : {}
  };
}

function buildTimeline(tasks) {
  return [...tasks]
    .sort((left, right) => {
      if (left.dueAt !== right.dueAt) {
        return new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime();
      }

      return left.priority - right.priority;
    })
    .map((task, index) => ({
      sequence: index + 1,
      taskId: task.id,
      name: task.title,
      title: task.title,
      category: task.category,
      badge: task.badge,
      dueAt: task.dueAt,
      status: task.status,
      approvalRequired: task.approvalRequired,
      requiresApproval: task.approvalRequired,
      xeRequired: task.xeRequired,
      reason: task.reason,
      nextStep: task.nextStep
    }));
}

function buildApprovalCandidates(tasks) {
  return tasks
    .filter((task) => task.approvalRequired)
    .map((task) => ({
      taskId: task.id,
      title: task.title,
      category: task.category,
      badge: task.badge,
      riskLevel: task.riskLevel,
      approvalPolicy: task.approvalPolicy,
      reason: task.reason,
      nextStep: task.nextStep,
      xeRequired: task.xeRequired
    }));
}

function buildXeQueue(tasks) {
  return tasks
    .filter((task) => task.xeRequired)
    .map((task) => ({
      taskId: task.id,
      title: task.title,
      category: task.category,
      status: task.approvalRequired ? 'waiting_for_approval' : 'ready_for_xe',
      requiredApproval: task.approvalRequired,
      suggestedAction: task.nextStep,
      guardrail: task.approvalRequired
        ? 'Do not execute until a matching approval is approved.'
        : 'Run through XE with audit logging enabled.'
    }));
}

function buildBoundaryOutput(run) {
  const approvedTaskIds = new Set(
    (run.approvalRecords || [])
      .filter((record) => record.status === 'approved')
      .map((record) => record.taskId)
  );
  const requiresApproval = [];
  const xeActions = [];
  const blockedActions = [];

  for (const step of run.timeline || []) {
    const approved = approvedTaskIds.has(step.taskId);

    if (step.requiresApproval && !approved) {
      const blocked = {
        taskId: step.taskId,
        step: step.name || step.title,
        reason: step.reason || 'Requires approval',
        status: 'PENDING_APPROVAL',
        badge: step.badge,
        nextStep: step.nextStep
      };
      requiresApproval.push(blocked);
      blockedActions.push(blocked.step);
    } else if (step.xeRequired) {
      xeActions.push({
        taskId: step.taskId,
        step: step.name || step.title,
        status: 'READY_FOR_XE',
        badge: step.badge,
        nextStep: step.nextStep
      });
    }
  }

  return {
    runId: run.runId,
    executionSession: run.runId,
    status: run.status,
    timeline: run.timeline || [],
    requiresApproval,
    xeActions,
    blockedActions,
    allowedActions: xeActions.map((action) => action.step),
    approvalRecords: run.approvalRecords || [],
    auditHash: run.auditHash
  };
}

function approvalStatusForTask(taskId, context = {}) {
  if (context.approvalStatusByTaskId && context.approvalStatusByTaskId[taskId]) {
    return context.approvalStatusByTaskId[taskId];
  }

  if (Array.isArray(context.approvedTaskIds) && context.approvedTaskIds.includes(taskId)) {
    return 'approved';
  }

  return null;
}

function executeTaskStep(step = {}, context = {}) {
  const taskId = step.taskId || step.id;
  const stepName = step.name || step.title || taskId || 'unknown_step';
  const requiresApproval = step.requiresApproval === true || step.approvalRequired === true;
  const approvalStatus = approvalStatusForTask(taskId, context);
  const approved = step.approved === true || approvalStatus === 'approved';

  if (requiresApproval && !approved) {
    return {
      status: 'BLOCKED',
      success: false,
      reason: 'Approval required',
      requiredRole: 'approver',
      step: stepName,
      taskId,
      command: 'task.template.execute',
      executionMode: 'approval_required'
    };
  }

  return {
    status: 'SUCCESS',
    success: true,
    step: stepName,
    taskId,
    command: 'task.template.execute',
    executionMode: step.xeRequired ? 'xe_assisted' : 'governed',
    timestamp: new Date().toISOString()
  };
}

function runStepThroughCommand(step = {}, context = {}) {
  return {
    command: 'task.template.execute',
    payload: step,
    policy: {
      requiresApproval: step.requiresApproval === true || step.approvalRequired === true
    },
    result: executeTaskStep(step, context)
  };
}

async function createTaskApprovals(approvalCandidates, context = {}, createApprovalRequest) {
  if (typeof createApprovalRequest !== 'function') {
    return [];
  }

  const approvals = [];

  for (const candidate of approvalCandidates) {
    const approval = await createApprovalRequest(
      {
        decision: 'review',
        executionMode: candidate.xeRequired ? 'operator_assisted' : 'approval_required',
        approvalRequired: true,
        riskLevel: candidate.riskLevel,
        reason: candidate.reason
      },
      {
        tenant: context.tenant || null,
        route: context.route || '/task-templates/ingest',
        approvalType: 'task_template_approval',
        taskId: candidate.taskId,
        taskTitle: candidate.title,
        taskCategory: candidate.category,
        badge: candidate.badge,
        nextStep: candidate.nextStep,
        xeRequired: candidate.xeRequired
      }
    );

    approvals.push({
      taskId: candidate.taskId,
      approvalId: approval.id,
      status: approval.status
    });
  }

  return approvals;
}

async function orchestrateTaskTemplates(input = {}, options = {}) {
  const now = new Date().toISOString();
  const templates = Array.isArray(input.templates) && input.templates.length ? input.templates : DEFAULT_TEMPLATES;
  const rawTasks = Array.isArray(input.tasks) ? input.tasks : [];
  const tasks = rawTasks.map((item, index) => normalizeTask(item, index, templates));
  const timeline = buildTimeline(tasks);
  const approvalCandidates = buildApprovalCandidates(tasks);
  const xeQueue = buildXeQueue(tasks);
  const runId = hasText(input.runId) ? input.runId.trim() : `task_run_${crypto.randomUUID()}`;
  const approvalRecords = input.createApprovals
    ? await createTaskApprovals(
        approvalCandidates,
        {
          tenant: input.tenant || options.tenant || null,
          route: options.route || '/task-templates/ingest'
        },
        options.createApprovalRequest
      )
    : [];

  const run = Object.freeze({
    runId,
    status: 'orchestrated',
    tenant: input.tenant || options.tenant || null,
    createdAt: now,
    summary: {
      taskCount: tasks.length,
      timelineCount: timeline.length,
      approvalsNeeded: approvalCandidates.length,
      xeActionsNeeded: xeQueue.length,
      approvalsCreated: approvalRecords.length
    },
    templates: templates.map((template) => ({
      id: template.id,
      category: template.category,
      badge: template.badge,
      approvalPolicy: template.approvalPolicy,
      xeEligible: template.xeEligible
    })),
    tasks,
    timeline,
    approvalCandidates,
    xeQueue,
    approvalRecords,
    auditHash: hashObject({
      runId,
      tasks,
      timeline,
      approvalCandidates,
      xeQueue,
      approvalRecords
    })
  });

  const telemetryReview = runTelemetryHarmonizer({
    telemetryState: input.telemetryState || 'LIMITED',
    tenant: run.tenant,
    principal: options.principal,
    activities: Array.isArray(input.telemetryActivities)
      ? input.telemetryActivities
      : buildTelemetryActivities(run)
  });
  const runWithBoundary = Object.freeze({
    ...run,
    boundary: buildBoundaryOutput(run),
    telemetryReview
  });
  runs.set(runId, runWithBoundary);
  return runWithBoundary;
}

function getTaskTemplateRun(runId) {
  return runs.get(runId) || null;
}

function listTaskTemplateRuns() {
  return [...runs.values()].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function updateTaskApprovalStatus(approvalId, status) {
  let updated = null;

  for (const run of runs.values()) {
    const records = run.approvalRecords || [];
    if (!records.some((record) => record.approvalId === approvalId)) {
      continue;
    }

    const approvalRecords = records.map((record) => (
      record.approvalId === approvalId ? { ...record, status } : record
    ));
    const nextRun = Object.freeze({
      ...run,
      approvalRecords
    });
    const runWithBoundary = Object.freeze({
      ...nextRun,
      boundary: buildBoundaryOutput(nextRun)
    });
    runs.set(run.runId, runWithBoundary);
    updated = runWithBoundary;
  }

  return updated;
}

function buildTelemetryActivities(run) {
  const activities = [
    {
      id: `${run.runId}_metrics`,
      type: 'workflow.metrics',
      name: 'Execution session metrics',
      tenant: run.tenant,
      payload: {
        runId: run.runId,
        taskCount: run.summary.taskCount,
        approvalsNeeded: run.summary.approvalsNeeded,
        xeActionsNeeded: run.summary.xeActionsNeeded
      }
    },
    {
      id: `${run.runId}_audit_summary`,
      type: 'audit.summary',
      name: 'Execution session audit summary',
      tenant: run.tenant,
      payload: {
        runId: run.runId,
        auditHash: run.auditHash
      }
    }
  ];

  for (const step of run.timeline || []) {
    activities.push({
      id: `${run.runId}_${step.taskId}`,
      type: step.category === 'conditional_approval'
        ? 'deal.execution'
        : step.category === 'billing_checkout'
          ? 'billing.checkout'
          : 'workflow.metrics',
      name: step.name || step.title,
      tenant: run.tenant,
      approvalRequired: step.requiresApproval,
      payload: {
        runId: run.runId,
        taskId: step.taskId,
        category: step.category,
        badge: step.badge
      }
    });
  }

  return activities;
}

module.exports = {
  APPROVAL_BADGES,
  DEFAULT_TEMPLATES,
  buildApprovalCandidates,
  buildBoundaryOutput,
  buildTimeline,
  buildXeQueue,
  buildTelemetryActivities,
  executeTaskStep,
  getTaskTemplateRun,
  listTaskTemplateRuns,
  normalizeTask,
  orchestrateTaskTemplates,
  runStepThroughCommand,
  updateTaskApprovalStatus
};
