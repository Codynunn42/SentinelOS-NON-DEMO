#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const dataset = require('./data/stage0-canonical-dataset-v0.1.json');
const { evaluateCase } = require('./simulation/evaluate-stage0');

const results = dataset.testMatrix.map((scenario) => evaluateCase(dataset, scenario));
const failures = results.filter((result, index) => {
  const expected = dataset.testMatrix[index].expected;
  return result.synapseOutcome !== expected.synapseOutcome
    || result.sentinelDisposition !== expected.sentinelDisposition
    || result.simulatedOtResponse !== expected.simulatedOtResponse
    || result.simulatedExecution !== expected.simulatedExecution
    || result.finalDisposition !== expected.finalDisposition
    || result.receipt.complete !== expected.receiptComplete
    || JSON.stringify(result.rejectionCodes) !== JSON.stringify(expected.rejectionCodes);
});

const report = {
  reportType: 'stage0-canonical-deterministic-matrix',
  datasetId: dataset.datasetId,
  schemaVersion: dataset.schemaVersion,
  status: failures.length === 0 ? 'PASS' : 'FAIL',
  caseCount: results.length,
  passCount: results.length - failures.length,
  failCount: failures.length,
  datasetSha256: dataset.integrity.datasetSha256,
  resultSha256: crypto.createHash('sha256')
    .update(JSON.stringify(results, null, 2))
    .digest('hex'),
  cases: results.map(({ candidates, ...result }) => ({
    ...result,
    candidateSummary: candidates.map((candidate) => ({
      id: candidate.id,
      feasible: candidate.feasible,
      rejectionCodes: candidate.rejectionCodes,
      minimumStorageM3: candidate.minimumStorageM3,
      maximumStorageM3: candidate.maximumStorageM3,
      endingStorageM3: candidate.endingStorageM3,
      modeledEnergyKWh: candidate.modeledEnergyKWh
    }))
  }))
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (failures.length) {
  process.exitCode = 1;
}
