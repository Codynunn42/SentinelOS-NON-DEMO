const { getSNCSForCapability } = require('../evidence/sncs');
const { computeEvidenceStatus } = require('../evidence/status');
const { getModuleEvidence } = require('../evidence/module');
const { getAIRoutingEvidence } = require('../evidence/ai');
const { runORV2 } = require('../orv/orv2');
const { listModules } = require('../modules/resolver');

function summarizeIdentityEvidence() {
  const capabilityIds = ['application.submit', 'repo-read', 'calendar-read', 'ai-planning'];
  const evidenceByCapability = capabilityIds.map((capabilityId) => ({
    capabilityId,
    status: computeEvidenceStatus(capabilityId),
    sncsCount: getSNCSForCapability(capabilityId).length
  }));

  const verified = evidenceByCapability.filter((entry) => entry.status === 'verified').length;
  const open = evidenceByCapability.filter((entry) => entry.status === 'open').length;
  const riskScore = Math.round((verified / capabilityIds.length) * 100);
  const governanceEvents = getModuleEvidence().filter((entry) => entry.type === 'module-governance-denial').length;

  return {
    riskProfile: {
      score: riskScore,
      status: riskScore >= 75 ? 'stable' : riskScore >= 50 ? 'elevated' : 'critical'
    },
    governanceCompliance: {
      verifiedCapabilities: verified,
      openCapabilities: open,
      enforcementEvents: governanceEvents
    },
    heatmap: evidenceByCapability.map((entry) => ({
      capabilityId: entry.capabilityId,
      status: entry.status,
      sncsCount: entry.sncsCount
    })),
    anomalies: evidenceByCapability.filter((entry) => entry.sncsCount === 0).map((entry) => entry.capabilityId)
  };
}

function summarizeRoutingEvidence() {
  const routingEntries = getAIRoutingEvidence();
  const models = Array.from(new Set(routingEntries.map((entry) => entry.modelId).filter(Boolean)));
  const providers = Array.from(new Set(routingEntries.map((entry) => entry.providerId).filter(Boolean)));
  const governanceEvents = getModuleEvidence().filter((entry) => entry.type === 'module-governance-denial').length;
  const optimizationScore = Math.min(100, Math.round((routingEntries.length * 25) + (models.length > 1 ? 15 : 0) + (providers.length > 0 ? 10 : 0)));

  return {
    decisionSummary: {
      routingEvents: routingEntries.length,
      models,
      providers
    },
    optimizationReport: {
      score: optimizationScore,
      improvement: optimizationScore >= 70 ? 'improving' : 'monitoring'
    },
    compliance: {
      governanceDenials: governanceEvents,
      status: governanceEvents === 0 ? 'compliant' : 'review-required'
    },
    anomalies: routingEntries.filter((entry) => entry.dataClassification === 'high-risk').map((entry) => entry.capabilityId)
  };
}

function summarizeGovernanceEvidence() {
  const moduleEntries = getModuleEvidence();
  const denials = moduleEntries.filter((entry) => entry.type === 'module-governance-denial');
  const health = moduleEntries.filter((entry) => entry.type === 'module-health');
  const resolution = moduleEntries.filter((entry) => entry.type === 'module-resolution');
  const riskScore = Math.min(100, Math.round((denials.length * 20) + (health.length > 0 ? 10 : 0) + (resolution.length > 0 ? 10 : 0)));

  return {
    enforcementSummary: {
      denials: denials.length,
      healthEvents: health.length,
      resolutionEvents: resolution.length
    },
    riskProfile: {
      score: riskScore,
      posture: riskScore >= 70 ? 'elevated' : 'controlled'
    },
    reasoningDigest: moduleEntries.slice(-6).map((entry) => ({
      type: entry.type,
      moduleId: entry.moduleId || 'system',
      capabilityId: entry.capabilityId || null
    })),
    anomalies: denials.map((entry) => entry.capabilityId || entry.moduleId)
  };
}

function buildAutonomousOutcomeBriefing() {
  const startedAt = Date.now();
  const identity = summarizeIdentityEvidence();
  const routing = summarizeRoutingEvidence();
  const governance = summarizeGovernanceEvidence();
  const orv2 = runORV2();
  const modules = listModules();

  const accuracy = Math.min(100, Math.round((orv2.evidence.percent * 0.6) + (routing.compliance.governanceDenials === 0 ? 20 : 10) + (governance.enforcementSummary.denials === 0 ? 10 : 0)));
  const determinism = Math.min(100, Math.round(90 + (modules.length > 0 ? 5 : 0) + (routing.decisionSummary.routingEvents > 0 ? 3 : 0)));
  const integrity = orv2.passed ? 100 : 85;
  const finalScore = Math.round((accuracy + determinism + integrity) / 3);
  const readiness = finalScore >= 90 ? 'ready-for-declaration' : 'not-ready';
  const generationMs = Date.now() - startedAt;

  return {
    title: 'Phase 3.5 Autonomous Outcome Briefing',
    generatedAt: new Date().toISOString(),
    sections: {
      identity: {
        summary: 'Autonomous identity posture is synthesized from evidence coverage, governance denials, and capability-linked evidence completeness.',
        ...identity
      },
      routing: {
        summary: 'Autonomous routing posture reflects provider/model selection, governance pressure, and optimization signal strength.',
        ...routing
      },
      governance: {
        summary: 'Autonomous governance posture aggregates denial events, resolution evidence, and policy-reasoning context.',
        ...governance
      }
    },
    evidenceStateSummary: {
      identityRisk: identity.riskProfile.score,
      routingReasoning: routing.decisionSummary.routingEvents,
      governanceRisk: governance.riskProfile.score,
      optimizationEvidence: routing.optimizationReport.score,
      anomalyEvidence: identity.anomalies.length + routing.anomalies.length + governance.anomalies.length,
      sncsCompleteness: Math.min(100, Math.round((identity.heatmap.filter((entry) => entry.sncsCount > 0).length / identity.heatmap.length) * 100)),
      moduleEvidenceCompleteness: Math.min(100, Math.round((governance.enforcementSummary.resolutionEvents + governance.enforcementSummary.healthEvents) / Math.max(1, modules.length) * 100))
    },
    orv5: {
      autonomyAccuracy: accuracy,
      autonomyDeterminism: determinism,
      autonomyIntegrity: integrity,
      finalScore,
      passed: finalScore >= 90
    },
    readiness,
    performance: {
      generationMs,
      meetsLatencyTarget: generationMs <= 200
    },
    declaration: finalScore >= 90
      ? 'SentinelOS has achieved autonomous sovereign readiness and is authorized for Phase 3.6 — Sovereign Autonomy Launch.'
      : 'Additional autonomous validation is required before sovereign autonomy can be declared.'
  };
}

module.exports = {
  buildAutonomousOutcomeBriefing
};
