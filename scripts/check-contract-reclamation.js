#!/usr/bin/env node

const assert = require('assert');
const path = require('path');

const {
  FACEPLANES,
  CONTRACT_RECLAMATION_BOUNDARY,
  buildContractReclamationFlow
} = require(path.join(__dirname, '../apps/sentinel/src/faceplanes/contractReclamationPlane'));
const {
  ASSESSMENT_COMMAND,
  executeAssessment,
  routeAssessmentThroughGovernance,
  handleContractReclamationAssess
} = require(path.join(__dirname, '../apps/sentinel/src/commands/contractReclamation'));
const { surfaceRegistry } = require(path.join(__dirname, '../apps/sentinel/src/surface/registry'));
const { getRequiredScope } = require(path.join(__dirname, '../apps/sentinel/src/governance/policyEngine'));

console.log('Contract Reclamation verification\n');

function pass(message) {
  console.log(`PASS ${message}`);
}

async function main() {
  assert.strictEqual(ASSESSMENT_COMMAND, 'contract.reclamation.assess');
  assert.strictEqual(getRequiredScope(ASSESSMENT_COMMAND), 'contract:assess');
  pass('command route and policy scope are registered');

  assert.strictEqual(FACEPLANES.length, 7);
  assert.deepStrictEqual(FACEPLANES.map((faceplane) => faceplane.key), [
    'evidence-timeline',
    'contract-intake',
    'obligation-mapper',
    'authority-reconstruction',
    'amendment-diff',
    'renewal-risk',
    'execution-status'
  ]);
  pass('seven faceplanes are defined in the requested order');

  assert.strictEqual(CONTRACT_RECLAMATION_BOUNDARY.legalAdviceProvided, false);
  assert.strictEqual(CONTRACT_RECLAMATION_BOUNDARY.legalCertaintyClaimed, false);
  assert.strictEqual(CONTRACT_RECLAMATION_BOUNDARY.executionBlockedUntilApproved, true);
  assert.strictEqual(CONTRACT_RECLAMATION_BOUNDARY.governanceTraceRequired, true);
  pass('safety boundary is review-scoped');

  const flow = buildContractReclamationFlow({ step: 0 });
  assert.strictEqual(flow.surface, 'contract-reclamation');
  assert.strictEqual(flow.totalSteps, 7);
  assert.strictEqual(flow.phase, 'evidence-timeline');
  assert.strictEqual(flow.navigation.canExecute, false);
  pass('faceplane flow starts at evidence timeline and cannot execute');

  const assessment = await executeAssessment('ownerfi-master-services', {
    tenantId: 'contractreclamation',
    initiatedBy: 'verification_script'
  });
  assert.strictEqual(assessment.status, 'success');
  assert(assessment.timeline.length > 0);
  assert(assessment.obligations.length > 0);
  assert(assessment.authority.chain.length > 0);
  assert(assessment.amendmentDiff.changes.length > 0);
  assert(assessment.renewalRisks.length > 0);
  pass('assessment assembles timeline, obligations, authority, amendments, and renewal risk');

  const sortedDates = [...assessment.timeline].map((event) => event.date);
  assert.deepStrictEqual(sortedDates, [...sortedDates].sort());
  pass('evidence timeline is chronological');

  assert.strictEqual(assessment.legalAdviceProvided, false);
  assert.strictEqual(assessment.legalCertaintyClaimed, false);
  assert.strictEqual(assessment.executionBlocked, true);
  assert.strictEqual(assessment.governanceTrace.auditArtifact.authorityCreated, false);
  pass('assessment does not create authority or legal conclusions');

  const governed = await routeAssessmentThroughGovernance('ownerfi-master-services', {
    tenantId: 'contractreclamation'
  });
  assert.strictEqual(governed.status, 'ASSESSMENT_COMPLETE');
  assert.strictEqual(governed.intent, ASSESSMENT_COMMAND);
  assert.strictEqual(governed.executionBlocked, true);
  pass('governance route returns review artifact only');

  const handlerResult = await handleContractReclamationAssess(
    { contractSetId: 'ownerfi-master-services' },
    { tenant: 'contractreclamation', principal: { actor: 'verification_script' } },
    { tenant: 'contractreclamation', command: ASSESSMENT_COMMAND, metadata: { actor: 'verification_script' } }
  );
  assert.strictEqual(handlerResult.success, true);
  assert.strictEqual(handlerResult.statusCode, 200);
  assert.strictEqual(handlerResult.data.command, ASSESSMENT_COMMAND);
  assert.strictEqual(handlerResult.data.executionBlocked, true);
  pass('command handler returns a governed review result');

  assert(surfaceRegistry.contractreclamation);
  assert(surfaceRegistry.contractreclamation.handlers[ASSESSMENT_COMMAND]);
  pass('surface registry exposes Contract Reclamation independently');

  console.log('\nContract Reclamation verification passed');
  console.log('Open apps/api/public/contract-reclamation.html for the static review faceplane.');
}

main().catch((error) => {
  console.error('Contract Reclamation verification failed:', error);
  process.exit(1);
});
