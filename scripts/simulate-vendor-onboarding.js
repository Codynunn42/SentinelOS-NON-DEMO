const fs = require('fs');
const { createAuditLedger } = require('../apps/sentinel/src/governance/vendorOnboarding/auditLedger');
const { evaluateVendorOnboarding } = require('../apps/sentinel/src/governance/vendorOnboarding/engine');
const { deriveLatencyClass } = require('../apps/sentinel/src/governance/vendorOnboarding/latencyGovernor');

const CASE_COUNT = Number(process.argv[2] || 1000);
const METRICS_PATH = process.argv[3] || '/private/tmp/sentinel_vendor_onboarding_simulation_metrics.json';
const LEDGER_PATH = process.argv[4] || '/private/tmp/sentinel_vendor_onboarding_simulation_ledger.jsonl';
const LATENCY_SECONDS = {
  standard: 1,
  advisory: 3,
  advisory_delayed: 5,
  human_review: 15,
  human_review_extended: 30,
  halted: 60
};

function mulberry32(seed) {
  return function next() {
    let value = seed += 0x6D2B79F5;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(20260501);

function chance(probability) {
  return random() < probability;
}

function baseCase(index) {
  return {
    workflow_id: `wf_vendor_${String(index + 1).padStart(4, '0')}`,
    vendorLegalName: `Acme Vendor ${index + 1} LLC`,
    taxId: `99-${String(1000000 + index).padStart(7, '0')}`,
    existingVendorTaxIds: [],
    documents: {
      tax_form: { name: 'w9.pdf' },
      insurance_certificate: { name: 'insurance.pdf' },
      business_registration: { name: 'registration.pdf' }
    },
    submissionTimestamp: '2026-05-01T12:00:00Z',
    intakeWindow: {
      start: '2026-05-01T00:00:00Z',
      end: '2026-05-02T00:00:00Z'
    },
    email: `vendor${index + 1}@example.com`,
    phone: '+1 555 123 4567',
    serviceCategories: ['facilities'],
    contractValue: 25000,
    requestorDepartment: 'Operations',
    highContractValueLimit: 100000,
    insuranceCoverage: 2000000,
    minimumInsuranceCoverage: 1000000,
    categoryCertificationRequirements: { facilities: ['COI'], security: ['SOC2'] },
    certifications: ['COI'],
    conflictOfInterestSigned: true,
    multiDepartmentApprovalThreshold: 50000,
    approvals: ['Operations'],
    expeditedReview: false,
    expeditedReviewMaxValue: 50000,
    sanctionScreeningStatus: 'passed',
    jurisdictionEligible: true,
    vendorDataClassification: 'confidential',
    requiredDataClassification: 'internal',
    previouslyOnboarded: false,
    workflowType: 'new',
    conflictingServiceCategoryPairs: [],
    insuranceExpiresAt: '2026-07-15T00:00:00Z',
    evaluationDate: '2026-05-01T00:00:00Z',
    approvalThreshold: 50000,
    businessClassificationConflicts: [],
    secondaryCertificationRequired: false,
    secondaryCertificationValidated: false,
    existingVendorNames: ['Northwind Services Inc'],
    vendorNameSimilarityThreshold: 0.85,
    policyRoutingConflicts: [],
    documentMetadataAnomalies: [],
    sanctionSimilarityScore: 0.1,
    sanctionSimilarityTolerance: 0.75,
    highSensitivityAccess: false,
    clearanceDocumentationPresent: false,
    verification_score: 0.82
  };
}

function injectAmbiguity(input) {
  const output = { ...input, documents: { ...input.documents } };
  const ambiguityPressure = chance(0.3);

  if (chance(0.08)) {
    output.contractValue = 104000;
  } else if (chance(0.1)) {
    output.contractValue = 49000 + Math.floor(random() * 2000);
  }

  if (ambiguityPressure) {
    output.verification_score = 0.52 + random() * 0.18;
  }

  if (chance(0.1)) {
    output.contractValue = 47500 + Math.floor(random() * 5000);
  }

  if (chance(0.08)) {
    output.insuranceExpiresAt = '2026-05-20T00:00:00Z';
  }

  if (chance(ambiguityPressure ? 0.16 : 0.07)) {
    output.conflictingServiceCategoryPairs = ['facilities:security'];
    output.serviceCategories = ['facilities', 'security'];
  }

  if (chance(ambiguityPressure ? 0.13 : 0.06)) {
    output.businessClassificationConflicts = ['classification conflicts with selected service category'];
  }

  if (chance(0.05)) {
    output.policyRoutingConflicts = ['Finance expedited route conflicts with Legal approval route'];
  }

  if (chance(ambiguityPressure ? 0.12 : 0.06)) {
    output.documentMetadataAnomalies = ['insurance certificate owner metadata mismatch'];
  }

  if (chance(0.05)) {
    output.sanctionSimilarityScore = 0.8;
  }

  if (chance(ambiguityPressure ? 0.09 : 0.04)) {
    output.highSensitivityAccess = true;
    output.clearanceDocumentationPresent = false;
    output.requiredDataClassification = 'high';
  }

  if (chance(0.05)) {
    output.insuranceCoverage = 500000;
  }

  if (chance(0.03)) {
    output.sanctionScreeningStatus = 'failed';
  }

  if (chance(0.03)) {
    output.documents.insurance_certificate = { name: 'insurance.png' };
  }

  if (chance(0.03)) {
    output.email = 'invalid-email';
  }

  if (chance(0.08)) {
    output.verification_score = 0.5 + random() * 0.3;
  }

  return output;
}

function increment(target, key) {
  target[key] = (target[key] || 0) + 1;
}

function histogramBucket(riskIndex) {
  const floor = Math.floor(riskIndex * 10) / 10;
  const ceil = floor + 0.1;
  return `${floor.toFixed(1)}-${ceil.toFixed(1)}`;
}

function boundaryBand(riskIndex) {
  const boundaries = [0.5, 1.3, 1.5, 3.0];
  const boundary = boundaries.find((value) => Math.abs(riskIndex - value) <= 0.01);
  return boundary === undefined ? null : boundary.toFixed(2);
}

function readLedgerLineCount(ledgerPath) {
  const text = fs.existsSync(ledgerPath) ? fs.readFileSync(ledgerPath, 'utf8').trim() : '';
  return text ? text.split('\n').length : 0;
}

function main() {
  fs.rmSync(LEDGER_PATH, { force: true });
  const ledger = createAuditLedger({ ledgerPath: LEDGER_PATH });
  const metrics = {
    case_count: CASE_COUNT,
    rule_set_version: null,
    escalation_rate: 0,
    nvop_state_distribution: {},
    latency_class_spread: {},
    average_latency_seconds_by_state: {},
    operator_queue_peak_depth: 0,
    ledger_integrity_percent: 0,
    risk_index_histogram: {},
    boundary_trigger_frequency: {},
    rule_conflict_frequency: 0,
    failed_rule_frequency: {},
    ambiguity_flag_frequency: {},
    execution_throughput_per_second: 0,
    ledger_path: LEDGER_PATH,
    metrics_path: METRICS_PATH
  };
  const started = Date.now();
  let escalationCount = 0;
  let conflictCount = 0;
  const latencyTotalsByState = {};
  const latencyCountsByState = {};
  let queueDepth = 0;
  let queueReleasedAt = started;

  for (let index = 0; index < CASE_COUNT; index += 1) {
    const input = injectAmbiguity(baseCase(index));
    const evaluation = evaluateVendorOnboarding(input);
    const latencyClass = deriveLatencyClass(evaluation);
    const escalationFlag = evaluation.nvop.state >= 2;
    const stateKey = String(evaluation.nvop.state);
    const latencySeconds = LATENCY_SECONDS[latencyClass] || 1;

    metrics.rule_set_version = evaluation.rule_set_version;
    increment(metrics.nvop_state_distribution, stateKey);
    increment(metrics.latency_class_spread, latencyClass);
    increment(metrics.risk_index_histogram, histogramBucket(evaluation.nvop.risk_index));

    const boundary = boundaryBand(evaluation.nvop.risk_index);
    if (boundary) {
      increment(metrics.boundary_trigger_frequency, boundary);
    }

    latencyTotalsByState[stateKey] = (latencyTotalsByState[stateKey] || 0) + latencySeconds;
    latencyCountsByState[stateKey] = (latencyCountsByState[stateKey] || 0) + 1;

    if (escalationFlag) {
      escalationCount += 1;
      queueDepth += 1;
      queueReleasedAt += latencySeconds * 1000;
    }

    if (queueDepth > 0 && started + index > queueReleasedAt) {
      queueDepth -= 1;
    }

    metrics.operator_queue_peak_depth = Math.max(metrics.operator_queue_peak_depth, queueDepth);

    for (const rule of evaluation.failed_rules) {
      increment(metrics.failed_rule_frequency, rule.rule_id);
    }

    for (const rule of evaluation.ambiguity_flags) {
      increment(metrics.ambiguity_flag_frequency, rule.rule_id);
    }

    if (evaluation.failed_rules.some((rule) => rule.rule_id === 'R-027')) {
      conflictCount += 1;
    }

    ledger.appendEntry({
      workflowId: evaluation.workflow_id,
      capabilityId: 'vendor-onboarding',
      ruleSetVersion: evaluation.rule_set_version,
      nvopState: evaluation.nvop.state,
      latencyClass,
      escalationFlag,
      timestamp: new Date(started + index).toISOString()
    });
  }

  const durationSeconds = Math.max(0.001, (Date.now() - started) / 1000);
  metrics.escalation_rate = escalationCount / CASE_COUNT;
  metrics.rule_conflict_frequency = conflictCount;
  metrics.execution_throughput_per_second = Math.round(CASE_COUNT / durationSeconds);
  metrics.ledger_integrity_percent = readLedgerLineCount(LEDGER_PATH) === CASE_COUNT ? 100 : 0;

  for (const [state, total] of Object.entries(latencyTotalsByState)) {
    metrics.average_latency_seconds_by_state[state] = Number((total / latencyCountsByState[state]).toFixed(2));
  }

  fs.writeFileSync(METRICS_PATH, `${JSON.stringify(metrics, null, 2)}\n`);
  console.log(JSON.stringify(metrics, null, 2));
}

main();
