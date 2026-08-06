const test = require('node:test');
const assert = require('node:assert/strict');

const { dispatchCommand } = require('../apps/sentinel/src/commands/dispatch');
const { resolveCapabilityToModule } = require('../apps/sentinel/src/modules/resolver');
const { computeModuleHealth } = require('../apps/sentinel/src/modules/health');
const { enforceModuleGovernance } = require('../apps/sentinel/src/modules/governance');
const { getSNCSForCapability } = require('../apps/sentinel/src/evidence/sncs');
const { getModuleEvidenceFor } = require('../apps/sentinel/src/evidence/module');
const { getAIRoutingEvidenceFor } = require('../apps/sentinel/src/evidence/ai');
const { computeEvidenceStatus } = require('../apps/sentinel/src/evidence/status');
const { buildExecutivePlane } = require('../apps/sentinel/src/planes/executive');
const { resetLocalPassportState, signLocalCommand } = require('../scripts/lib/sentinelPassport');

function prepareSignedCommand(payload) {
  process.env.SENTINEL_SIGNING_KEY = 'evidence-test-signing-key';
  resetLocalPassportState();
  return signLocalCommand({
    tenant: 'ownerfi',
    command: 'application.submit',
    source: 'sentinel',
    payload,
    metadata: {
      actor: 'orv2@example.com',
      role: 'approver',
      scopes: ['application:submit']
    }
  });
}

test('ORV2: module-resolution evidence is emitted', () => {
  const module = resolveCapabilityToModule('calendar-read');

  const evidence = getModuleEvidenceFor(module && module.moduleId ? module.moduleId : 'ai-operations');
  assert.ok(evidence.some((entry) => entry.type === 'module-resolution'), 'expected module-resolution evidence');
});

test('ORV2: module-health evidence is emitted', () => {
  const module = resolveCapabilityToModule('calendar-read');
  computeModuleHealth(module);

  const evidence = getModuleEvidenceFor(module && module.moduleId ? module.moduleId : 'ai-operations');
  assert.ok(evidence.some((entry) => entry.type === 'module-health'), 'expected module-health evidence');
});

test('ORV2: module-governance-denial evidence is emitted', () => {
  try {
    enforceModuleGovernance({ moduleId: 'communications', capabilities: [] }, 'calendar-read');
  } catch (error) {
    assert.ok(error instanceof Error);
  }

  const evidence = getModuleEvidenceFor('communications');
  assert.ok(evidence.some((entry) => entry.type === 'module-governance-denial'), 'expected module-governance-denial evidence');
});

test('ORV2: SNCS evidence emitted for provider capabilities', async () => {
  const signedEnvelope = prepareSignedCommand({
    capabilityId: 'repo-read',
    providerId: 'github',
    sessionId: 'orv2-sncs-1'
  });

  await dispatchCommand(signedEnvelope, {
    buildReceipt: () => ({ status: 'executed', verified: true }),
    emitSecurityEvent: () => {},
    principal: {
      tenant: 'ownerfi',
      actor: 'orv2@example.com',
      role: 'approver',
      scopes: ['application:submit']
    },
    source: 'sentinel'
  });

  const sncs = getSNCSForCapability('repo-read');
  assert.ok(sncs.length > 0, 'expected SNCS evidence for repo-read');
});

test('ORV2: AI routing evidence emitted', async () => {
  const signedEnvelope = prepareSignedCommand({
    capabilityId: 'ai-planning',
    providerId: 'ai-operations',
    sessionId: 'orv2-ai-1',
    dataClassification: 'internal'
  });

  await dispatchCommand(signedEnvelope, {
    buildReceipt: () => ({ status: 'executed', verified: true }),
    emitSecurityEvent: () => {},
    principal: {
      tenant: 'ownerfi',
      actor: 'orv2@example.com',
      role: 'approver',
      scopes: ['application:submit']
    },
    source: 'sentinel'
  });

  const aiEvidence = getAIRoutingEvidenceFor('ai-planning');
  assert.ok(aiEvidence.length > 0, 'expected AI routing evidence');
});

test('ORV2: evidence-status backend reflects full evidence chain', async () => {
  const signedEnvelope = prepareSignedCommand({
    capabilityId: 'calendar-read',
    providerId: 'microsoft365',
    sessionId: 'orv2-status-1'
  });

  await dispatchCommand(signedEnvelope, {
    buildReceipt: () => ({ status: 'executed', verified: true }),
    emitSecurityEvent: () => {},
    principal: {
      tenant: 'ownerfi',
      actor: 'orv2@example.com',
      role: 'approver',
      scopes: ['application:submit']
    },
    source: 'sentinel'
  });

  const status = computeEvidenceStatus('calendar-read');
  assert.ok(['verified', 'pending-cross-provider'].includes(status), 'expected evidence-status to be computed');
});

test('ORV2: executive plane exposes module and capability evidence', () => {
  const plane = buildExecutivePlane();

  assert.ok(plane.institutionalModules.length > 0, 'expected modules in executive plane');

  const firstModule = plane.institutionalModules[0];
  assert.ok(firstModule.evidence, 'expected module evidence in executive plane');

  const firstCapability = firstModule.capabilities[0];
  assert.ok(firstCapability.evidenceStatus, 'expected capability evidence-status');
});
