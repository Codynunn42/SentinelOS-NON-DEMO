const { evaluateForethought } = require('../forethought/tilda');

const SINTINEX_ALIASES = ['SINTINEX', 'SENTINEX', 'SINTENX'];

const ARCHIVE_CONNECTIONS = [
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
    path: 'docs/ARIZONA_SPO_MODERNIZATION_BRIEF_LAYOUT.md',
    decision: 'DEFER',
    role: 'held_public_sector_draft',
    keywords: ['arizona', 'spo', 'public sector', 'government', 'procurement']
  }
];

function normalizeText(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function normalizeIncomingInformation(input = {}) {
  const title = normalizeText(input.title || input.name || input.subject);
  const body = normalizeText(input.body || input.text || input.content || input.summary);
  const source = normalizeText(input.source || 'operator');
  const tags = Array.isArray(input.tags)
    ? input.tags.map((tag) => normalizeText(tag).toLowerCase()).filter(Boolean)
    : [];

  return {
    id: normalizeText(input.id) || `sintinex_${Date.now()}`,
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

function resolveArchiveConnections(record) {
  const haystack = [record.title, record.body, ...record.tags].join(' ').toLowerCase();

  return ARCHIVE_CONNECTIONS.filter((connection) => {
    return connection.keywords.some((keyword) => haystack.includes(keyword));
  }).map((connection) => ({
    path: connection.path,
    decision: connection.decision,
    role: connection.role
  }));
}

function classifySintinexLane(record, archiveConnections) {
  const haystack = [record.title, record.body, ...record.tags].join(' ').toLowerCase();

  if (archiveConnections.some((connection) => connection.decision === 'DEFER')) {
    return {
      lane: 'deferred_review',
      reason: 'Incoming information touches a deferred artifact and must stay held.'
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
      'sintinex',
      'sentinex',
      'sintenx'
    ])
  ) {
    return {
      lane: 'sintinex_idea_ledger',
      reason: 'Incoming information is future-facing and belongs outside the active execution lane.'
    };
  }

  if (archiveConnections.some((connection) => connection.decision === 'ARCHIVE')) {
    return {
      lane: 'archive_reference',
      reason: 'Incoming information references historical lineage and should be linked, not promoted.'
    };
  }

  if (archiveConnections.some((connection) => connection.role === 'current_truth' || connection.role === 'current_approval')) {
    return {
      lane: 'active_context',
      reason: 'Incoming information references current Phase 1.1 truth.'
    };
  }

  return {
    lane: 'sintinex_review',
    reason: 'Incoming information needs classification before it can influence active work.'
  };
}

function buildTildaState(record, laneDecision, archiveConnections) {
  const isActive = laneDecision.lane === 'active_context';
  const isDeferred = laneDecision.lane === 'deferred_review';

  return {
    state: isActive ? 'stable' : 'drift',
    confidence: archiveConnections.length ? 0.86 : 0.64,
    actionGate: isActive ? 'observe_only' : 'human_review_required',
    riskLevel: isDeferred ? 'high' : isActive ? 'low' : 'medium',
    requiresApproval: !isActive,
    reason: laneDecision.reason,
    evidence: archiveConnections.map((connection) => connection.path),
    intakeId: record.id
  };
}

function routeSintinexIntake(input = {}, options = {}) {
  const record = normalizeIncomingInformation(input);
  const archiveConnections = resolveArchiveConnections(record);
  const laneDecision = classifySintinexLane(record, archiveConnections);
  const tilda = evaluateForethought(
    {
      learningState: buildTildaState(record, laneDecision, archiveConnections),
      confidence: archiveConnections.length ? 0.86 : 0.64,
      suggestions: [
        laneDecision.reason,
        'Do not execute from SINTINEX intake.',
        'Preserve archive lineage and route active changes through SentinelOS approvals.'
      ]
    },
    {
      systemGoal: options.systemGoal || 'separate future intelligence from active governed execution'
    }
  );

  return {
    system: 'SINTINEX',
    aliases: SINTINEX_ALIASES,
    status: 'docked',
    executionMode: 'observe_route_only',
    managedBy: 'TILDA',
    activeExecutionAllowed: false,
    record,
    lane: laneDecision.lane,
    reason: laneDecision.reason,
    archiveConnections,
    tilda,
    constraints: [
      'SINTINEX receives and classifies incoming information',
      'SINTINEX may connect information to archive/current/deferred evidence',
      'SINTINEX may not execute commands or promote archived material',
      'Active execution remains governed by SentinelOS policy and approvals'
    ]
  };
}

module.exports = {
  ARCHIVE_CONNECTIONS,
  SINTINEX_ALIASES,
  normalizeIncomingInformation,
  resolveArchiveConnections,
  classifySintinexLane,
  routeSintinexIntake
};
