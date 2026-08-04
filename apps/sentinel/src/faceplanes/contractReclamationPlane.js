/**
 * Contract Reclamation Faceplane
 *
 * Governed contract-state reconstruction surface.
 *
 * This lane reuses the Operational Upgrade pattern but keeps a separate
 * domain boundary: contract evidence, obligations, authority lineage,
 * amendments, renewals, and execution status are organized into a reviewable
 * operational record. It does not provide legal advice, legal certainty, or
 * autonomous legal judgment.
 */

const RECLAMATION_PHASES = {
  EVIDENCE_TIMELINE: 'evidence-timeline',
  CONTRACT_INTAKE: 'contract-intake',
  OBLIGATION_MAPPER: 'obligation-mapper',
  AUTHORITY_RECONSTRUCTION: 'authority-reconstruction',
  AMENDMENT_DIFF: 'amendment-diff',
  RENEWAL_RISK: 'renewal-risk',
  EXECUTION_STATUS: 'execution-status'
};

const REVIEW_STATES = {
  PROTOTYPE_REVIEW: 'prototype_review',
  GOVERNANCE_TRACE_REQUIRED: 'governance_trace_required',
  EXECUTION_BLOCKED: 'execution_blocked'
};

const CONTRACT_RECLAMATION_BOUNDARY = {
  lane: 'prototype_review',
  nonAdversarial: true,
  legalAdviceProvided: false,
  legalCertaintyClaimed: false,
  governanceTraceRequired: true,
  executionBlockedUntilApproved: true
};

const FACEPLANES = [
  {
    key: RECLAMATION_PHASES.EVIDENCE_TIMELINE,
    title: 'Evidence Timeline',
    purpose: 'Chronologically organize contract artifacts, approvals, amendments, communications, and execution events.'
  },
  {
    key: RECLAMATION_PHASES.CONTRACT_INTAKE,
    title: 'Contract Intake',
    purpose: 'Identify contract families, parties, documents, dates, versions, and source confidence.'
  },
  {
    key: RECLAMATION_PHASES.OBLIGATION_MAPPER,
    title: 'Obligation Mapper',
    purpose: 'Map payment, timing, renewal, service, signature, and delivery obligations into reviewable records.'
  },
  {
    key: RECLAMATION_PHASES.AUTHORITY_RECONSTRUCTION,
    title: 'Authority Reconstruction',
    purpose: 'Assemble signer, approver, delegation, and approval-chain evidence without asserting legal validity.'
  },
  {
    key: RECLAMATION_PHASES.AMENDMENT_DIFF,
    title: 'Amendment Diff',
    purpose: 'Compare amendments against prior contract state to reveal obligation and language changes.'
  },
  {
    key: RECLAMATION_PHASES.RENEWAL_RISK,
    title: 'Renewal Risk',
    purpose: 'Flag timing, notice, auto-renewal, and exit-window risks for operator review.'
  },
  {
    key: RECLAMATION_PHASES.EXECUTION_STATUS,
    title: 'Execution Status',
    purpose: 'Summarize what is evidenced, uncertain, blocked, or ready for governed next review.'
  }
];

function createBoundaryBannerWidget(boundary = CONTRACT_RECLAMATION_BOUNDARY) {
  return {
    type: 'boundary-banner',
    title: 'Prototype Review Lane',
    status: REVIEW_STATES.PROTOTYPE_REVIEW,
    message: 'Contract Reclamation organizes contract-state evidence into a reviewable operational record.',
    constraints: {
      nonAdversarial: boundary.nonAdversarial === true,
      legalAdviceProvided: boundary.legalAdviceProvided === true,
      legalCertaintyClaimed: boundary.legalCertaintyClaimed === true,
      governanceTraceRequired: boundary.governanceTraceRequired === true,
      executionBlockedUntilApproved: boundary.executionBlockedUntilApproved === true
    }
  };
}

function createEvidenceTimelineWidget(timeline = []) {
  return {
    phase: RECLAMATION_PHASES.EVIDENCE_TIMELINE,
    type: 'evidence-timeline',
    title: 'Evidence Timeline',
    subtitle: 'Review contract-state events in chronological order.',
    events: timeline.map((event, index) => ({
      id: event.id || `event_${index + 1}`,
      date: event.date,
      source: event.source || 'unknown',
      eventType: event.eventType || 'evidence',
      summary: event.summary,
      confidence: event.confidence || 'medium',
      authoritySignal: event.authoritySignal || null,
      obligationSignal: event.obligationSignal || null
    }))
  };
}

function createContractIntakeWidget(intake = {}) {
  return {
    phase: RECLAMATION_PHASES.CONTRACT_INTAKE,
    type: 'contract-intake',
    title: 'Contract Intake',
    subtitle: 'Identify the contract family and source record.',
    contractSetId: intake.contractSetId || null,
    parties: intake.parties || [],
    documentCount: intake.documentCount || 0,
    versionCount: intake.versionCount || 0,
    sourceConfidence: intake.sourceConfidence || 'unknown',
    unresolvedInputs: intake.unresolvedInputs || []
  };
}

function createObligationMapperWidget(obligations = []) {
  return {
    phase: RECLAMATION_PHASES.OBLIGATION_MAPPER,
    type: 'obligation-mapper',
    title: 'Obligation Mapper',
    subtitle: 'Map obligations without converting them into legal conclusions.',
    obligations: obligations.map((obligation, index) => ({
      id: obligation.id || `obligation_${index + 1}`,
      category: obligation.category,
      party: obligation.party,
      description: obligation.description,
      due: obligation.due || null,
      evidenceRefs: obligation.evidenceRefs || [],
      state: obligation.state || 'review_required',
      confidence: obligation.confidence || 'medium'
    })),
    counts: {
      total: obligations.length,
      reviewRequired: obligations.filter((item) => item.state === 'review_required').length,
      evidenced: obligations.filter((item) => item.state === 'evidenced').length
    }
  };
}

function createAuthorityReconstructionWidget(authority = {}) {
  const chain = authority.chain || [];

  return {
    phase: RECLAMATION_PHASES.AUTHORITY_RECONSTRUCTION,
    type: 'authority-reconstruction',
    title: 'Authority Reconstruction',
    subtitle: 'Assemble approval and signing evidence without asserting legal validity.',
    chain: chain.map((node, index) => ({
      id: node.id || `authority_${index + 1}`,
      actor: node.actor,
      role: node.role,
      action: node.action,
      evidenceRef: node.evidenceRef || null,
      confidence: node.confidence || 'medium',
      reviewNote: node.reviewNote || null
    })),
    gaps: authority.gaps || [],
    boundary: 'Evidence organization only; legal authority validity remains operator/legal review.'
  };
}

function createAmendmentDiffWidget(diff = {}) {
  const changes = diff.changes || [];

  return {
    phase: RECLAMATION_PHASES.AMENDMENT_DIFF,
    type: 'amendment-diff',
    title: 'Amendment Diff',
    subtitle: 'Track contract-state changes across amendments and versions.',
    baseVersion: diff.baseVersion || null,
    comparisonVersion: diff.comparisonVersion || null,
    changes: changes.map((change, index) => ({
      id: change.id || `change_${index + 1}`,
      clause: change.clause,
      changeType: change.changeType || 'modified',
      summary: change.summary,
      obligationImpact: change.obligationImpact || 'review_required',
      evidenceRefs: change.evidenceRefs || []
    })),
    unresolvedDiffs: diff.unresolvedDiffs || []
  };
}

function createRenewalRiskWidget(risks = []) {
  return {
    phase: RECLAMATION_PHASES.RENEWAL_RISK,
    type: 'renewal-risk',
    title: 'Renewal Risk',
    subtitle: 'Flag timing and notice issues for controlled review.',
    risks: risks.map((risk, index) => ({
      id: risk.id || `renewal_risk_${index + 1}`,
      category: risk.category,
      severity: risk.severity || 'medium',
      summary: risk.summary,
      date: risk.date || null,
      evidenceRefs: risk.evidenceRefs || [],
      nextReviewAction: risk.nextReviewAction || 'Confirm with operator before any action.'
    })),
    highestSeverity: risks.some((risk) => risk.severity === 'high') ? 'high' : risks.length ? 'medium' : 'low'
  };
}

function createExecutionStatusWidget(status = {}) {
  return {
    phase: RECLAMATION_PHASES.EXECUTION_STATUS,
    type: 'execution-status',
    title: 'Execution Status',
    subtitle: 'Summarize contract-state readiness without authorizing execution.',
    contractState: status.contractState || 'review_required',
    evidencedItems: status.evidencedItems || [],
    unresolvedItems: status.unresolvedItems || [],
    blockedActions: status.blockedActions || [
      'legal_advice',
      'legal_certainty',
      'autonomous_contract_interpretation',
      'execution_without_approval'
    ],
    nextControlledAction: status.nextControlledAction || {
      title: 'Review Contract-State Record',
      description: 'Validate timeline, obligations, authority signals, and unresolved gaps.',
      authorityCreated: false
    }
  };
}

function createAssessmentSummaryWidget(assessment = {}) {
  return {
    type: 'contract-reclamation-summary',
    contractSetId: assessment.contractSetId || null,
    assessmentDate: assessment.assessmentDate || new Date().toISOString(),
    reviewLane: REVIEW_STATES.PROTOTYPE_REVIEW,
    boundary: CONTRACT_RECLAMATION_BOUNDARY,
    counts: {
      timelineEvents: assessment.timelineEvents || 0,
      obligations: assessment.obligations || 0,
      authoritySignals: assessment.authoritySignals || 0,
      amendmentChanges: assessment.amendmentChanges || 0,
      renewalRisks: assessment.renewalRisks || 0
    },
    findings: assessment.findings || [],
    unresolvedItems: assessment.unresolvedItems || [],
    nextControlledAction: assessment.nextControlledAction || {
      title: 'Complete Operator Review',
      description: 'Confirm evidence record before any approval or execution lane is considered.',
      authorityCreated: false
    }
  };
}

function buildContractReclamationFlow(input = {}) {
  const data = input.data || {};
  const step = Number.isFinite(Number(input.step)) ? Number(input.step) : 0;
  const steps = [
    {
      phase: RECLAMATION_PHASES.EVIDENCE_TIMELINE,
      widget: createEvidenceTimelineWidget(data.timeline)
    },
    {
      phase: RECLAMATION_PHASES.CONTRACT_INTAKE,
      widget: createContractIntakeWidget(data.intake)
    },
    {
      phase: RECLAMATION_PHASES.OBLIGATION_MAPPER,
      widget: createObligationMapperWidget(data.obligations)
    },
    {
      phase: RECLAMATION_PHASES.AUTHORITY_RECONSTRUCTION,
      widget: createAuthorityReconstructionWidget(data.authority)
    },
    {
      phase: RECLAMATION_PHASES.AMENDMENT_DIFF,
      widget: createAmendmentDiffWidget(data.amendmentDiff)
    },
    {
      phase: RECLAMATION_PHASES.RENEWAL_RISK,
      widget: createRenewalRiskWidget(data.renewalRisks)
    },
    {
      phase: RECLAMATION_PHASES.EXECUTION_STATUS,
      widget: createExecutionStatusWidget(data.executionStatus)
    }
  ];
  const currentStep = Math.max(0, Math.min(step, steps.length - 1));
  const current = steps[currentStep];

  return {
    surface: 'contract-reclamation',
    currentStep,
    totalSteps: steps.length,
    phase: current.phase,
    boundary: createBoundaryBannerWidget(data.boundary),
    mainWidget: current.widget,
    steps: steps.map((item, index) => ({
      index,
      phase: item.phase,
      title: FACEPLANES.find((faceplane) => faceplane.key === item.phase).title,
      status: index < currentStep ? 'complete' : index === currentStep ? 'active' : 'pending'
    })),
    navigation: {
      canPrevious: currentStep > 0,
      canNext: currentStep < steps.length - 1,
      canExecute: false,
      stepsDisplay: `${currentStep + 1} of ${steps.length}`
    }
  };
}

module.exports = {
  RECLAMATION_PHASES,
  REVIEW_STATES,
  CONTRACT_RECLAMATION_BOUNDARY,
  FACEPLANES,
  createBoundaryBannerWidget,
  createEvidenceTimelineWidget,
  createContractIntakeWidget,
  createObligationMapperWidget,
  createAuthorityReconstructionWidget,
  createAmendmentDiffWidget,
  createRenewalRiskWidget,
  createExecutionStatusWidget,
  createAssessmentSummaryWidget,
  buildContractReclamationFlow
};
