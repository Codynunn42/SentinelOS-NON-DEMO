const { evaluateForethought } = require('../forethought/interpretation');

const COMPONENT_NAME = 'archive_intelligence';
const INTERPRETATION_LAYER = 'forethought_interpretation';
const OPERATOR_LOGIC_LABELS = ['SINTENIX', 'SINTINEX', 'SENTINEX', 'SINTENX'];

const EVIDENCE_CONNECTIONS = [
  {
    path: 'docs/DAILY_BRIEF_2026-04-23.md',
    decision: 'ARCHIVE',
    role: 'historical_lineage',
    keywords: ['daily brief', '2026-04-23', 'ownerfi proof', 'tenant audit']
  },
  {
    path: 'docs/DAILY_BRIEF_2026-04-24.md',
    decision: 'ARCHIVE',
    role: 'historical_lineage',
    keywords: ['daily brief', '2026-04-24', 'proof', 'rate limiting', 'governance preflight']
  },
  {
    path: 'docs/EXECUTIVE_SNAPSHOT_2026-05-12.md',
    decision: 'KEEP',
    role: 'current_truth',
    keywords: ['phase 1.1', 'current truth', 'faceplane', 'approval continuity']
  },
  {
    path: 'docs/PHASE1_APPROVAL_BOARD_2026-05-12.md',
    decision: 'KEEP',
    role: 'current_approval',
    keywords: ['approval board', 'live verified', 'approval continuity', 'phase 1.1']
  },
  {
    path: 'docs/SENTINEL_ARTIFACT_DECISION_REGISTER_2026-05-13.md',
    decision: 'KEEP',
    role: 'decision_register',
    keywords: ['artifact decision', '18 artifact', 'categorization', 'archive', 'keep', 'defer']
  },
  {
    path: 'docs/ARCHIVE_INTELLIGENCE_INGESTION_LEDGER_2026-05-13.md',
    decision: 'KEEP',
    role: 'archive_intelligence_boundary',
    keywords: ['sintenix', 'sintinex', 'archival cognition', 'lineage interpretation', 'historical synthesis']
  },
  {
    path: 'docs/ARIZONA_SPO_MODERNIZATION_BRIEF_LAYOUT.md',
    decision: 'DEFER',
    role: 'held_public_sector_draft',
    keywords: ['arizona', 'spo', 'public sector', 'government', 'procurement']
  }
];

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeIncomingInformation(input = {}) {
  const title = normalizeText(input.title || input.name || input.subject);
  const body = normalizeText(input.body || input.text || input.content || input.summary);
  const source = normalizeText(input.source || 'operator');
  const tags = Array.isArray(input.tags)
    ? input.tags.map((tag) => normalizeText(tag).toLowerCase()).filter(Boolean)
    : [];

  return {
    id: normalizeText(input.id) || `archive_intelligence_${Date.now()}`,
    title,
    body,
    source,
    tags,
    receivedAt: input.receivedAt || new Date().toISOString(),
    raw: input
  };
}

function includesAny(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

function resolveEvidenceConnections(record) {
  const haystack = [record.title, record.body, ...record.tags].join(' ').toLowerCase();

  return EVIDENCE_CONNECTIONS.filter((connection) => {
    return connection.keywords.some((keyword) => haystack.includes(keyword));
  }).map((connection) => ({
    path: connection.path,
    decision: connection.decision,
    role: connection.role
  }));
}

function classifyArchiveIntelligenceLane(record, evidenceConnections) {
  const haystack = [record.title, record.body, ...record.tags].join(' ').toLowerCase();

  if (evidenceConnections.some((connection) => connection.decision === 'DEFER')) {
    return {
      lane: 'deferred_review',
      reason: 'Incoming information touches a deferred artifact and must stay held.'
    };
  }

  if (
    includesAny(haystack, [
      'archival cognition',
      'lineage interpretation',
      'historical synthesis',
      'historical intelligence',
      'one governs',
      'one understands',
      'informs sentinelos',
      'archive interpretation',
      'pattern synthesis',
      'memory/context evolution'
    ])
  ) {
    return {
      lane: 'archive_cognition',
      reason: 'Incoming information defines archival cognition that informs but does not control SentinelOS.'
    };
  }

  if (
    includesAny(haystack, [
      'managed results',
      'future theory',
      'future-facing',
      'idea',
      'concept',
      'maybe later',
      'sintenix',
      'sintinex',
      'sentinex',
      'sintenx'
    ])
  ) {
    return {
      lane: 'idea_ledger',
      reason: 'Incoming information is future-facing and belongs outside the active execution lane.'
    };
  }

  if (evidenceConnections.some((connection) => connection.decision === 'ARCHIVE')) {
    return {
      lane: 'archive_reference',
      reason: 'Incoming information references historical lineage and should be linked, not promoted.'
    };
  }

  if (evidenceConnections.some((connection) => connection.role === 'current_truth' || connection.role === 'current_approval')) {
    return {
      lane: 'active_context',
      reason: 'Incoming information references current Phase 1.1 truth.'
    };
  }

  return {
    lane: 'intake_review',
    reason: 'Incoming information needs classification before it can influence active work.'
  };
}

function buildInterpretationState(record, laneDecision, evidenceConnections) {
  const isActive = laneDecision.lane === 'active_context';
  const isDeferred = laneDecision.lane === 'deferred_review';

  return {
    state: isActive ? 'stable' : 'drift',
    confidence: evidenceConnections.length ? 0.86 : 0.64,
    actionGate: isActive ? 'observe_only' : 'human_review_required',
    riskLevel: isDeferred ? 'high' : isActive ? 'low' : 'medium',
    requiresApproval: !isActive,
    reason: laneDecision.reason,
    evidence: evidenceConnections.map((connection) => connection.path),
    intakeId: record.id
  };
}

function routeArchiveIntelligenceIntake(input = {}, options = {}) {
  const record = normalizeIncomingInformation(input);
  const evidenceConnections = resolveEvidenceConnections(record);
  const laneDecision = classifyArchiveIntelligenceLane(record, evidenceConnections);
  const interpretation = evaluateForethought(
    {
      learningState: buildInterpretationState(record, laneDecision, evidenceConnections),
      confidence: evidenceConnections.length ? 0.86 : 0.64,
      suggestions: [
        laneDecision.reason,
        'Do not execute from archive intelligence intake.',
        'Preserve archive lineage and route active changes through SentinelOS approvals.'
      ]
    },
    {
      systemGoal: options.systemGoal || 'separate archival intelligence from active governed execution'
    }
  );

  return {
    component: COMPONENT_NAME,
    operatorLogicLabels: OPERATOR_LOGIC_LABELS,
    status: 'docked',
    executionMode: 'observe_route_only',
    managedBy: INTERPRETATION_LAYER,
    activeExecutionAllowed: false,
    record,
    lane: laneDecision.lane,
    reason: laneDecision.reason,
    evidenceConnections,
    interpretation,
    constraints: [
      'Archive intelligence receives and classifies incoming information',
      'Archive intelligence may connect information to archive/current/deferred evidence',
      'Archive intelligence may not execute commands or promote archived material',
      'Active execution remains governed by SentinelOS policy and approvals'
    ]
  };
}

module.exports = {
  COMPONENT_NAME,
  EVIDENCE_CONNECTIONS,
  INTERPRETATION_LAYER,
  OPERATOR_LOGIC_LABELS,
  classifyArchiveIntelligenceLane,
  normalizeIncomingInformation,
  resolveEvidenceConnections,
  routeArchiveIntelligenceIntake
};
