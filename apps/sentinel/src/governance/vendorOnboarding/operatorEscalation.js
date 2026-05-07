const { createAuditLedger, stableStringify } = require('./auditLedger');
const { evaluateVendorOnboarding } = require('./engine');
const { deriveLatencyClass } = require('./latencyGovernor');
const crypto = require('crypto');

const DECISIONS = new Set(['approve', 'require_correction', 'escalate_further', 'refuse', 'confirm_refusal']);
const DEFAULT_LEDGER_PATH = '/private/tmp/sentinel_vendor_onboarding_operator_ledger.jsonl';
const decisionStore = new Map();

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function minutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60000).toISOString();
}

function baseVendorCase(overrides = {}) {
  return {
    workflow_id: overrides.workflow_id || 'wf_vendor_operator_base',
    vendorLegalName: overrides.vendorLegalName || 'Redacted Vendor LLC',
    taxId: overrides.taxId || '99-0000000',
    existingVendorTaxIds: [],
    documents: {
      tax_form: { name: 'w9.pdf' },
      insurance_certificate: { name: 'insurance.pdf' },
      business_registration: { name: 'registration.pdf' }
    },
    submissionTimestamp: overrides.submissionTimestamp || minutesAgo(45),
    intakeWindow: {
      start: '2026-05-01T00:00:00Z',
      end: '2026-05-02T00:00:00Z'
    },
    email: overrides.email || 'vendor@example.com',
    phone: '+1 555 123 4567',
    serviceCategories: overrides.serviceCategories || ['facilities', 'security'],
    contractValue: overrides.contractValue || 104000,
    requestorDepartment: 'Operations',
    highContractValueLimit: 100000,
    insuranceCoverage: overrides.insuranceCoverage || 2000000,
    minimumInsuranceCoverage: 1000000,
    categoryCertificationRequirements: { facilities: ['COI'], security: ['SOC2'] },
    certifications: overrides.certifications || ['COI'],
    conflictOfInterestSigned: true,
    multiDepartmentApprovalThreshold: 50000,
    approvals: overrides.approvals || ['Operations'],
    expeditedReview: false,
    expeditedReviewMaxValue: 50000,
    sanctionScreeningStatus: overrides.sanctionScreeningStatus || 'passed',
    jurisdictionEligible: true,
    vendorDataClassification: overrides.vendorDataClassification || 'confidential',
    requiredDataClassification: overrides.requiredDataClassification || 'internal',
    previouslyOnboarded: false,
    workflowType: 'new',
    conflictingServiceCategoryPairs: overrides.conflictingServiceCategoryPairs || ['facilities:security'],
    insuranceExpiresAt: overrides.insuranceExpiresAt || '2026-05-20T00:00:00Z',
    evaluationDate: '2026-05-01T00:00:00Z',
    approvalThreshold: 50000,
    businessClassificationConflicts: overrides.businessClassificationConflicts || [],
    secondaryCertificationRequired: false,
    secondaryCertificationValidated: false,
    existingVendorNames: ['Northwind Services Inc'],
    vendorNameSimilarityThreshold: 0.85,
    policyRoutingConflicts: overrides.policyRoutingConflicts || [],
    documentMetadataAnomalies: overrides.documentMetadataAnomalies || [],
    sanctionSimilarityScore: overrides.sanctionSimilarityScore || 0.1,
    sanctionSimilarityTolerance: 0.75,
    highSensitivityAccess: overrides.highSensitivityAccess || false,
    clearanceDocumentationPresent: overrides.clearanceDocumentationPresent || false,
    verification_score: overrides.verification_score || 0.6
  };
}

function buildOperatorCase(input, queueTimestamp) {
  const evaluation = evaluateVendorOnboarding(input);
  const latencyClass = deriveLatencyClass(evaluation);
  const riskInputs = evaluation.nvop.inputs || {};
  const recommendedAction =
    evaluation.nvop.state >= 3
      ? 'confirm_refusal'
      : evaluation.nvop.state === 2
        ? 'escalate_further'
        : 'approve';

  return {
    workflowId: evaluation.workflow_id,
    vendorName: input.vendorLegalName,
    riskIndex: evaluation.nvop.risk_index,
    nvopState: evaluation.nvop.state,
    triggeredRules: evaluation.failed_rules.map((rule) => rule.rule_id),
    failedRules: evaluation.failed_rules,
    ambiguityFlags: evaluation.ambiguity_flags,
    impactRating: riskInputs.I || 0,
    domainTier: evaluation.derived_domain_tier,
    confidenceScore: Number((1 - (1 - evaluation.compliance_score)).toFixed(4)),
    verifiabilityScore: riskInputs.V || 0,
    latencyClass,
    queueTimestamp,
    submissionTimestamp: input.submissionTimestamp,
    timeInQueueMinutes: Math.max(0, Math.round((Date.now() - new Date(queueTimestamp).getTime()) / 60000)),
    ruleSetVersion: evaluation.rule_set_version,
    riskFormula: evaluation.nvop.formula,
    riskInputs,
    recommendedAction,
    timeline: [
      { event: 'intake', timestamp: input.submissionTimestamp },
      { event: 'validation', timestamp: queueTimestamp },
      { event: 'nvop_trigger', timestamp: queueTimestamp, state: evaluation.nvop.state },
      { event: 'latency_assignment', timestamp: queueTimestamp, latencyClass }
    ],
    decision: decisionStore.get(evaluation.workflow_id) || null,
    evaluation
  };
}

function getSeedInputs() {
  return [
    baseVendorCase({
      workflow_id: 'wf_vendor_review_001',
      vendorLegalName: 'Redacted Facilities Security LLC',
      businessClassificationConflicts: ['classification conflicts with selected service category'],
      policyRoutingConflicts: ['Finance route conflicts with Legal review route'],
      documentMetadataAnomalies: ['insurance owner metadata mismatch'],
      verification_score: 0.55
    }),
    baseVendorCase({
      workflow_id: 'wf_vendor_review_002',
      vendorLegalName: 'Redacted Data Access Vendor Inc',
      highSensitivityAccess: true,
      clearanceDocumentationPresent: false,
      requiredDataClassification: 'high',
      sanctionSimilarityScore: 0.8,
      verification_score: 0.52
    }),
    baseVendorCase({
      workflow_id: 'wf_vendor_review_003',
      vendorLegalName: 'Redacted Near Threshold Services',
      contractValue: 49800,
      businessClassificationConflicts: ['business type conflicts with security service tier'],
      verification_score: 0.58
    })
  ];
}

function listOperatorCases() {
  return getSeedInputs()
    .map((input, index) => buildOperatorCase(input, minutesAgo(60 - index * 12)))
    .filter((item) => item.nvopState >= 2)
    .sort((left, right) => right.riskIndex - left.riskIndex);
}

function getOperatorCase(workflowId) {
  return listOperatorCases().find((item) => item.workflowId === workflowId) || null;
}

function transitionFor(operatorCase, decision) {
  if (operatorCase.nvopState >= 3) {
    if (decision === 'confirm_refusal') return 'locked_refusal';
    if (decision === 'approve') return 'override_continue';
    if (decision === 'escalate_further') return 'tier_review';
    return 'locked_refusal';
  }

  if (decision === 'approve') return 'continue_workflow';
  if (decision === 'require_correction') return 'return_to_intake';
  if (decision === 'escalate_further') return 'tier_review';
  if (decision === 'refuse') return 'lock_workflow';
  return 'pending_review';
}

function submitOperatorDecision(workflowId, payload = {}, principal = {}, options = {}) {
  const operatorCase = getOperatorCase(workflowId);
  if (!operatorCase) {
    return { ok: false, statusCode: 404, error: 'CASE_NOT_FOUND' };
  }

  const decision = typeof payload.decision === 'string' ? payload.decision.trim() : '';
  const rationale = typeof payload.decisionRationale === 'string' ? payload.decisionRationale.trim() : '';
  const policyReferenceCode = typeof payload.policyReferenceCode === 'string' ? payload.policyReferenceCode.trim() : '';
  const riskAcceptanceAcknowledged = payload.riskAcceptanceAcknowledged === true;
  const overrideFlag = payload.overrideFlag === true || decision !== operatorCase.recommendedAction;

  if (!DECISIONS.has(decision)) {
    return { ok: false, statusCode: 400, error: 'DECISION_REQUIRED', required: [...DECISIONS] };
  }

  if (!rationale) {
    return { ok: false, statusCode: 400, error: 'RATIONALE_REQUIRED' };
  }

  if (!policyReferenceCode) {
    return { ok: false, statusCode: 400, error: 'POLICY_REFERENCE_REQUIRED' };
  }

  if (!riskAcceptanceAcknowledged) {
    return { ok: false, statusCode: 400, error: 'RISK_ACCEPTANCE_REQUIRED' };
  }

  if (overrideFlag && rationale.length < 20) {
    return { ok: false, statusCode: 400, error: 'OVERRIDE_JUSTIFICATION_TOO_SHORT' };
  }

  if (decisionStore.has(workflowId)) {
    return { ok: false, statusCode: 409, error: 'DECISION_ALREADY_RECORDED' };
  }

  const timestamp = new Date().toISOString();
  const operatorId = principal.actor || 'operator.local';
  const transition = transitionFor(operatorCase, decision);
  const decisionRecord = Object.freeze({
    workflowId,
    decision,
    decisionRationale: rationale,
    policyReferenceCode,
    riskAcceptanceAcknowledged,
    overrideFlag,
    operatorId,
    decisionTimestamp: timestamp,
    transition,
    recommendedAction: operatorCase.recommendedAction
  });
  const decisionHash = sha256(stableStringify(decisionRecord));
  const ledger = createAuditLedger({ ledgerPath: options.ledgerPath || DEFAULT_LEDGER_PATH });
  const ledgerEntry = ledger.appendEntry({
    workflowId,
    capabilityId: 'vendor-onboarding.operator-decision',
    ruleSetVersion: operatorCase.ruleSetVersion,
    nvopState: operatorCase.nvopState,
    latencyClass: operatorCase.latencyClass,
    escalationFlag: true,
    timestamp,
    hash: decisionHash
  });

  const stored = Object.freeze({
    ...decisionRecord,
    decisionHash,
    ledgerEntry
  });
  decisionStore.set(workflowId, stored);

  return {
    ok: true,
    statusCode: 200,
    case: {
      ...operatorCase,
      decision: stored
    },
    decision: stored
  };
}

module.exports = {
  getOperatorCase,
  listOperatorCases,
  submitOperatorDecision
};
