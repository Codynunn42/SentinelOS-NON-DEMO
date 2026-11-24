const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const dataset = require('../data/stage0-canonical-dataset-v0.1.json');
const { evaluateCase } = require('../simulation/evaluate-stage0');

const projectRoot = path.resolve(__dirname, '..');
const datasetPath = path.join(projectRoot, 'data', 'stage0-canonical-dataset-v0.1.json');

test('canonical package is versioned, synthetic, and contains a 24-hour baseline', () => {
  assert.equal(dataset.schemaVersion, 'stage0-canonical-dataset/v0.1');
  assert.equal(dataset.status, 'SIMULATION_ONLY');
  assert.equal(dataset.provenance, 'SYNTHETIC');
  assert.equal(dataset.horizon.hours, 24);
  assert.equal(dataset.water.hourlyInflowM3.length, 24);
  assert.equal(dataset.water.hourlyEnvironmentalBypassM3.length, 24);
  assert.equal(dataset.grid.hourlyMarginalKgCO2ePerMWh.length, 24);
  assert.deepEqual(dataset.baselineWindow, { startHour: 9, endHour: 10 });
});

test('all canonical regression, positive, and failure cases have deterministic outcomes', async (t) => {
  const expectedIds = [
    'A - shift helps',
    'B - water constraint blocks the shift',
    'C - required input missing',
    ...Array.from({ length: 5 }, (_, index) => `P-${String(index + 1).padStart(2, '0')}`),
    ...Array.from({ length: 17 }, (_, index) => `F-${String(index + 1).padStart(2, '0')}`)
  ];
  assert.equal(dataset.testMatrix.length, 25);
  assert.deepEqual(dataset.testMatrix.map((scenario) => scenario.id), expectedIds);

  for (const scenario of dataset.testMatrix) {
    await t.test(scenario.id, () => {
      const first = evaluateCase(dataset, scenario);
      const second = evaluateCase(dataset, scenario);
      assert.deepEqual(first, second, 'identical inputs must reproduce identical output');
      assert.equal(first.synapseOutcome, scenario.expected.synapseOutcome);
      assert.equal(first.sentinelDisposition, scenario.expected.sentinelDisposition);
      assert.equal(first.simulatedOtResponse, scenario.expected.simulatedOtResponse);
      assert.equal(first.simulatedExecution, scenario.expected.simulatedExecution);
      assert.equal(first.finalDisposition, scenario.expected.finalDisposition);
      assert.equal(first.receipt.complete, scenario.expected.receiptComplete);
      assert.deepEqual(first.rejectionCodes, scenario.expected.rejectionCodes);
    });
  }
});

test('rejected candidates retain their rejection reasons', () => {
  const infeasible = dataset.testMatrix.find((scenario) => scenario.id === 'B - water constraint blocks the shift');
  const result = evaluateCase(dataset, infeasible);
  const rejected = result.candidates.find((candidate) => candidate.id === 'candidate-13');
  assert.ok(rejected);
  assert.equal(rejected.feasible, false);
  assert.ok(rejected.rejectionCodes.includes('MAX_STORAGE_EXCEEDED'));
});

test('execution requires both valid approval and independent simulated OT acceptance', () => {
  for (const scenario of dataset.testMatrix) {
    const result = evaluateCase(dataset, scenario);
    if (result.simulatedExecution) {
      assert.equal(result.authorizationValid, true, scenario.id);
      assert.equal(result.humanDecision, 'APPROVE', scenario.id);
      assert.equal(result.simulatedOtResponse, 'ACCEPTED', scenario.id);
    }
  }
});

test('dataset checksum is stable for the canonical bytes', () => {
  const canonical = structuredClone(dataset);
  delete canonical.integrity;
  const digest = crypto.createHash('sha256')
    .update(`${JSON.stringify(canonical, null, 2)}\n`)
    .digest('hex');
  assert.equal(digest, dataset.integrity.datasetSha256);
});
