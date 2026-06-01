const { generateId } = require('../shared/idGenerator');

const ASSESS_COMMAND = 'operational.upgrade.assess';
const PREPARE_PLAN_COMMAND = 'operational.upgrade.plan.prepare';
const LEGACY_ASSESS_COMMAND = 'contract.reclamation.assess';
const LEGACY_PREPARE_PLAN_COMMAND = 'contract.reclamation.plan.prepare';

function normalizeString(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function normalizeArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === 'string' ? item.trim() : item))
    .filter(Boolean);
}

function buildReceipt(context, command, target, result, tenant) {
  if (!context || typeof context.buildReceipt !== 'function') {
    return null;
  }

  return context.buildReceipt(command, target, result, tenant);
}

function emitEvent(context, type, payload) {
  if (context && typeof context.emitSecurityEvent === 'function') {
    context.emitSecurityEvent(type, payload);
  }
}

function buildAssessment(payload = {}, context = {}, envelope = {}) {
  const tenant = context.tenant || envelope.tenant || 'contractreclamation';
  const assessmentId = generateId('op_upgrade_assess');
  const obligation = normalizeString(payload.obligation || payload.contract || payload.summary, 'Unspecified obligation');
  const evidence = normalizeArray(payload.evidence);
  const requestedOutcome = normalizeString(payload.requestedOutcome, 'controlled upgrade review');
  const approvalRequired = true;
  const driftSignals = [
    evidence.length ? 'evidence_available_for_mapping' : 'evidence_missing_or_unmapped',
    payload.approver ? 'approver_named' : 'approver_not_named',
    'runtime_execution_held'
  ];

  const result = {
    assessmentId,
    status: 'review_ready',
    obligation,
    requestedOutcome,
    evidenceCount: evidence.length,
    approvalRequired,
    driftSignals,
    recommendedNextAction: PREPARE_PLAN_COMMAND,
    executionBlocked: true,
    autonomousExecutionAllowed: false,
    legalAdviceProvided: false,
    legalCertaintyClaimed: false,
    recoveryClaimMade: false,
    authorityCreated: false
  };
  const receipt = buildReceipt(
    context,
    `${tenant}.${envelope.command || ASSESS_COMMAND}`,
    { type: 'operational_upgrade_assessment', id: assessmentId },
    {
      status: result.status,
      approvalRequired,
      tenant
    },
    tenant
  );

  emitEvent(context, 'operational_upgrade.assessment.review_ready', {
    route: '/v1/command',
    command: envelope.command || ASSESS_COMMAND,
    assessmentId,
    tenant,
    approvalRequired,
    authorityCreated: false
  });

  return {
    success: true,
    statusCode: 200,
    data: {
      result,
      receipt
    }
  };
}

function buildPlan(payload = {}, context = {}, envelope = {}) {
  const tenant = context.tenant || envelope.tenant || 'contractreclamation';
  const planId = generateId('op_upgrade_plan');
  const assessmentId = normalizeString(payload.assessmentId, null);
  const evidence = normalizeArray(payload.evidence);
  const approvals = normalizeArray(payload.requiredApprovals || payload.approvals);
  const steps = [
    'review_existing_agreement_or_obligation',
    'map_required_evidence',
    'identify_required_approval',
    'classify_operational_drift',
    'hold_for_operator_review'
  ];
  const result = {
    planId,
    assessmentId,
    status: 'prepared_for_review',
    steps,
    evidenceRequirements: evidence,
    requiredApprovals: approvals.length ? approvals : ['operator_review'],
    executionStatus: 'held',
    executionBlocked: true,
    autonomousExecutionAllowed: false,
    legalAdviceProvided: false,
    legalCertaintyClaimed: false,
    recoveryClaimMade: false,
    authorityCreated: false
  };
  const receipt = buildReceipt(
    context,
    `${tenant}.${envelope.command || PREPARE_PLAN_COMMAND}`,
    { type: 'operational_upgrade_plan', id: planId },
    {
      status: result.status,
      executionStatus: result.executionStatus,
      tenant
    },
    tenant
  );

  emitEvent(context, 'operational_upgrade.plan.prepared_for_review', {
    route: '/v1/command',
    command: envelope.command || PREPARE_PLAN_COMMAND,
    planId,
    tenant,
    executionStatus: result.executionStatus,
    authorityCreated: false
  });

  return {
    success: true,
    statusCode: 200,
    data: {
      result,
      receipt
    }
  };
}

const contractReclamationHandlers = {
  [ASSESS_COMMAND]: buildAssessment,
  [PREPARE_PLAN_COMMAND]: buildPlan,
  [LEGACY_ASSESS_COMMAND]: buildAssessment,
  [LEGACY_PREPARE_PLAN_COMMAND]: buildPlan
};

module.exports = {
  ASSESS_COMMAND,
  PREPARE_PLAN_COMMAND,
  LEGACY_ASSESS_COMMAND,
  LEGACY_PREPARE_PLAN_COMMAND,
  contractReclamationHandlers
};
