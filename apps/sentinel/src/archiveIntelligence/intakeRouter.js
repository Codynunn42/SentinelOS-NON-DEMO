'use strict';
const { evaluateForethought } = require('../forethought/interpretation');
const { evaluateArtifact } = require('./artifactPolicy');
const legacy = require('./historicalReferences');

// Historical paths remain discovery hints. No fixed reference grants current authority.
const EVIDENCE_CONNECTIONS = legacy.EVIDENCE_CONNECTIONS.map((item) => ({
  ...item,
  role: ['current_truth', 'current_approval'].includes(item.role) ? 'historical_lineage' : item.role,
  decision: item.decision === 'DEFER' ? 'DEFER' : 'ARCHIVE'
}));

function resolveEvidenceConnections(record, options = {}) {
  const text = [record.title, record.body, ...record.tags].join(' ').toLowerCase();
  const historical = EVIDENCE_CONNECTIONS.filter((item) => item.keywords.some((key) => text.includes(key)))
    .map(({ path, decision, role }) => ({ path, decision, role, slot: 'HISTORICAL_CONTEXT', freshness: { score: null, rationale: 'Legacy reference has no verified lifecycle metadata.' } }));
  // Only a trusted integration may supply artifacts/bindings after entitlement checks.
  const dynamic = (options.validatedArtifacts || []).map((artifact) => ({
    id: artifact.id, version: artifact.version, path: artifact.path || artifact.id,
    role: 'evaluated_evidence', decision: 'REVIEW',
    ...evaluateArtifact(artifact, { currentTime: options.currentTime, authorityBinding: options.authorityBindings?.[artifact.id] })
  }));
  return [...historical, ...dynamic];
}

function classifyArchiveIntelligenceLane(record, connections) {
  const oldLane = legacy.classifyArchiveIntelligenceLane(record, connections);
  if (oldLane.lane === 'deferred_review') return oldLane;
  if (connections.some((item) => item.slot === 'CURRENT_AUTHORITY')) return { lane: 'active_context', reason: 'Evidence passed trusted authority, version, and freshness checks; human review still required.' };
  return oldLane;
}

function routeArchiveIntelligenceIntake(input = {}, options = {}) {
  const record = legacy.normalizeIncomingInformation(structuredClone(input));
  const evidenceConnections = resolveEvidenceConnections(record, options);
  const decision = classifyArchiveIntelligenceLane(record, evidenceConnections);
  // Legacy fixed confidence values are removed. Freshness is not epistemic confidence.
  const interpretation = evaluateForethought({ learningState: {
    state: decision.lane === 'active_context' ? 'stable' : 'unknown',
    actionGate: 'human_review_required', requiresApproval: true,
    riskLevel: decision.lane === 'deferred_review' ? 'high' : 'medium',
    reason: decision.reason, evidence: evidenceConnections.map((item) => item.path)
  } }, { systemGoal: options.systemGoal || 'evidence-grounded advisory review' });
  interpretation.confidence = null;
  interpretation.explanation = `${decision.reason} Factual confidence is unassessed.`;
  return {
    component: legacy.COMPONENT_NAME, managedBy: legacy.INTERPRETATION_LAYER,
    operatorLogicLabels: [...legacy.OPERATOR_LOGIC_LABELS], executionMode: 'observe_route_only',
    activeExecutionAllowed: false, status: 'docked', record, lane: decision.lane,
    reason: decision.reason, evidenceConnections, interpretation
  };
}

module.exports = { ...legacy, EVIDENCE_CONNECTIONS, resolveEvidenceConnections, classifyArchiveIntelligenceLane, routeArchiveIntelligenceIntake };
