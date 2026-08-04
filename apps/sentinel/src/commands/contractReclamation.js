const {
  CONTRACT_RECLAMATION_BOUNDARY,
  buildContractReclamationFlow,
  createAssessmentSummaryWidget
} = require('../faceplanes/contractReclamationPlane');

const ASSESSMENT_COMMAND = 'contract.reclamation.assess';

function initializeAssessment(contractSetId, options = {}) {
  return {
    commandId: `contract_reclamation_${contractSetId}_${Date.now()}`,
    command: ASSESSMENT_COMMAND,
    contractSetId,
    reviewLane: 'prototype_review',
    context: {
      tenantId: options.tenantId || 'contractreclamation',
      initiatedBy: options.initiatedBy || 'system',
      assessmentDate: new Date().toISOString()
    },
    governanceGates: {
      auditRequired: true,
      governanceTraceRequired: true,
      executionBlockedUntilApproved: true,
      legalAdviceProvided: false,
      legalCertaintyClaimed: false
    }
  };
}

async function retrieveContractStateRecord(contractSetId, options = {}) {
  const record = {
    contractSetId,
    intake: {
      contractSetId,
      parties: options.parties || ['OwnerFi', 'Nunn Corporation'],
      documentCount: 0,
      versionCount: 0,
      sourceConfidence: 'limited',
      unresolvedInputs: ['Original executed copy pending operator confirmation']
    },
    documents: [],
    events: [],
    obligations: [],
    authority: [],
    amendments: [],
    renewalTerms: []
  };

  if (contractSetId === 'ownerfi-master-services' || contractSetId === 'ownerfi') {
    record.intake = {
      contractSetId,
      parties: ['OwnerFi', 'Nunn Corporation'],
      documentCount: 4,
      versionCount: 2,
      sourceConfidence: 'review_ready',
      unresolvedInputs: [
        'Confirm final signed exhibit list',
        'Confirm renewal notice recipient'
      ]
    };
    record.events = [
      {
        id: 'evt_initial_terms',
        date: '2026-04-21',
        eventType: 'contract_terms',
        source: 'proposal_record',
        summary: 'Initial operational proof terms identified for OwnerFi lane.',
        confidence: 'medium',
        obligationSignal: 'proof_flow'
      },
      {
        id: 'evt_live_proof',
        date: '2026-04-24',
        eventType: 'runtime_evidence',
        source: 'deployment_log',
        summary: 'Live proof route and health endpoint verified.',
        confidence: 'high',
        authoritySignal: 'runtime_truth'
      },
      {
        id: 'evt_pilot_state',
        date: '2026-05-04',
        eventType: 'pilot_status',
        source: 'operational_status',
        summary: 'OwnerFi pilot lane recorded as active business proof surface.',
        confidence: 'medium',
        obligationSignal: 'pilot_review'
      },
      {
        id: 'evt_governance_hold',
        date: '2026-05-20',
        eventType: 'governance_boundary',
        source: 'doctrine_index',
        summary: 'Execution remains blocked while review and stabilization lanes continue.',
        confidence: 'high',
        authoritySignal: 'hold_execution'
      }
    ];
    record.obligations = [
      {
        id: 'obl_proof_access',
        category: 'access',
        party: 'Nunn Corporation',
        description: 'Maintain reviewable proof surface for controlled evaluation.',
        due: 'operator_review',
        evidenceRefs: ['evt_live_proof'],
        state: 'evidenced',
        confidence: 'high'
      },
      {
        id: 'obl_governance_trace',
        category: 'governance',
        party: 'Nunn Corporation',
        description: 'Preserve audit and governance trace for review-scoped activity.',
        due: 'ongoing',
        evidenceRefs: ['evt_governance_hold'],
        state: 'evidenced',
        confidence: 'high'
      },
      {
        id: 'obl_renewal_notice',
        category: 'renewal',
        party: 'operator_review',
        description: 'Confirm renewal window and notice recipient before any renewal action.',
        due: 'review_required',
        evidenceRefs: [],
        state: 'review_required',
        confidence: 'limited'
      }
    ];
    record.authority = [
      {
        id: 'auth_operator_review',
        actor: 'operator',
        role: 'review_owner',
        action: 'review_scoped_assessment',
        evidenceRef: 'evt_governance_hold',
        confidence: 'high',
        reviewNote: 'Review authority only; no execution authority created.'
      }
    ];
    record.amendments = [
      {
        id: 'amd_governance_language',
        clause: 'governance',
        changeType: 'clarified',
        summary: 'Governance wording narrowed to review-scoped proof and audit visibility.',
        obligationImpact: 'reduces_authority_ambiguity',
        evidenceRefs: ['evt_governance_hold']
      }
    ];
    record.renewalTerms = [
      {
        id: 'risk_notice_window',
        category: 'notice_window',
        severity: 'medium',
        summary: 'Renewal notice window cannot be confirmed from current reconstructed record.',
        date: null,
        evidenceRefs: [],
        nextReviewAction: 'Confirm renewal terms from executed agreement before any operational decision.'
      }
    ];
  }

  return record;
}

function buildEvidenceTimeline(record) {
  return [...record.events].sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

function mapObligations(record) {
  return record.obligations.map((obligation) => ({
    ...obligation,
    reviewBoundary: 'obligation_record_only'
  }));
}

function reconstructAuthority(record) {
  const chain = record.authority.map((node) => ({
    ...node,
    assertionBoundary: 'evidence_only'
  }));

  return {
    chain,
    gaps: record.intake.unresolvedInputs.filter((item) => item.toLowerCase().includes('signed'))
  };
}

function diffAmendments(record) {
  return {
    baseVersion: 'current_reconstructed_record',
    comparisonVersion: 'latest_review_record',
    changes: record.amendments,
    unresolvedDiffs: record.intake.unresolvedInputs.filter((item) => item.toLowerCase().includes('exhibit'))
  };
}

function detectRenewalRisks(record) {
  return record.renewalTerms;
}

function buildExecutionStatus(record, obligations) {
  const unresolvedItems = [
    ...record.intake.unresolvedInputs,
    ...obligations
      .filter((obligation) => obligation.state === 'review_required')
      .map((obligation) => obligation.description)
  ];

  return {
    contractState: unresolvedItems.length ? 'review_required' : 'evidenced',
    evidencedItems: obligations
      .filter((obligation) => obligation.state === 'evidenced')
      .map((obligation) => obligation.description),
    unresolvedItems,
    blockedActions: [
      'legal_advice',
      'legal_certainty',
      'autonomous_contract_interpretation',
      'execution_without_approval'
    ],
    nextControlledAction: {
      title: 'Review Contract-State Record',
      description: 'Validate evidence timeline, obligations, authority signals, amendment changes, and renewal gaps.',
      authorityCreated: false
    }
  };
}

function buildAssessmentSummary(contractSetId, timeline, obligations, authority, amendmentDiff, renewalRisks, executionStatus) {
  return createAssessmentSummaryWidget({
    contractSetId,
    assessmentDate: new Date().toISOString(),
    timelineEvents: timeline.length,
    obligations: obligations.length,
    authoritySignals: authority.chain.length,
    amendmentChanges: amendmentDiff.changes.length,
    renewalRisks: renewalRisks.length,
    findings: [
      'Contract-state record can be organized for review.',
      'Obligation truth remains evidence-bound, not legal certainty.',
      'Execution remains blocked until explicit approval exists.'
    ],
    unresolvedItems: executionStatus.unresolvedItems,
    nextControlledAction: executionStatus.nextControlledAction
  });
}

async function executeAssessment(contractSetId, options = {}) {
  try {
    const assessment = initializeAssessment(contractSetId, options);
    const record = await retrieveContractStateRecord(contractSetId, options);
    const timeline = buildEvidenceTimeline(record);
    const obligations = mapObligations(record, timeline);
    const authority = reconstructAuthority(record, timeline);
    const amendmentDiff = diffAmendments(record);
    const renewalRisks = detectRenewalRisks(record, timeline);
    const executionStatus = buildExecutionStatus(record, obligations);
    const summary = buildAssessmentSummary(
      contractSetId,
      timeline,
      obligations,
      authority,
      amendmentDiff,
      renewalRisks,
      executionStatus
    );
    const flow = buildContractReclamationFlow({
      step: 0,
      data: {
        timeline,
        intake: record.intake,
        obligations,
        authority,
        amendmentDiff,
        renewalRisks,
        executionStatus,
        boundary: CONTRACT_RECLAMATION_BOUNDARY
      }
    });

    return {
      status: 'success',
      assessment,
      record,
      timeline,
      obligations,
      authority,
      amendmentDiff,
      renewalRisks,
      executionStatus,
      summary,
      flow,
      legalAdviceProvided: false,
      legalCertaintyClaimed: false,
      executionBlocked: true,
      governanceTrace: {
        assessmentId: assessment.commandId,
        command: ASSESSMENT_COMMAND,
        contractSetId,
        phases: [
          'evidence-timeline',
          'contract-intake',
          'obligation-mapper',
          'authority-reconstruction',
          'amendment-diff',
          'renewal-risk',
          'execution-status'
        ],
        auditArtifact: {
          type: 'contract_reclamation_assessment',
          timestamp: new Date().toISOString(),
          classification: 'contract_state_reconstruction',
          authorityCreated: false
        }
      }
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      contractSetId
    };
  }
}

async function routeAssessmentThroughGovernance(contractSetId, options = {}) {
  const assessment = await executeAssessment(contractSetId, options);

  if (assessment.status === 'success') {
    return {
      commandId: assessment.assessment.commandId,
      intent: ASSESSMENT_COMMAND,
      contractSetId,
      status: 'ASSESSMENT_COMPLETE',
      reviewLane: 'prototype_review',
      auditTrail: assessment.governanceTrace,
      flow: assessment.flow,
      summary: assessment.summary,
      legalAdviceProvided: false,
      legalCertaintyClaimed: false,
      executionBlocked: true,
      nextAction: 'Open contract-reclamation.html faceplane'
    };
  }

  return assessment;
}

async function handleContractReclamationAssess(payload = {}, context = {}, envelope = {}) {
  const contractSetId = payload.contractSetId || payload.relationshipId || 'ownerfi-master-services';
  const assessment = await routeAssessmentThroughGovernance(contractSetId, {
    tenantId: context.tenant || envelope.tenant || 'contractreclamation',
    initiatedBy:
      (context.principal && context.principal.actor) ||
      (envelope.metadata && envelope.metadata.actor) ||
      payload.initiatedBy ||
      'system'
  });

  return {
    success: assessment.status === 'ASSESSMENT_COMPLETE',
    statusCode: assessment.status === 'ASSESSMENT_COMPLETE' ? 200 : 500,
    data: {
      command: ASSESSMENT_COMMAND,
      contractSetId,
      result: assessment,
      reviewLane: 'prototype_review',
      governanceTraceRequired: true,
      legalAdviceProvided: false,
      legalCertaintyClaimed: false,
      executionBlocked: true
    }
  };
}

const contractReclamationHandlers = {
  [ASSESSMENT_COMMAND]: handleContractReclamationAssess
};

module.exports = {
  ASSESSMENT_COMMAND,
  initializeAssessment,
  retrieveContractStateRecord,
  buildEvidenceTimeline,
  mapObligations,
  reconstructAuthority,
  diffAmendments,
  detectRenewalRisks,
  buildExecutionStatus,
  buildAssessmentSummary,
  executeAssessment,
  routeAssessmentThroughGovernance,
  handleContractReclamationAssess,
  contractReclamationHandlers
};
