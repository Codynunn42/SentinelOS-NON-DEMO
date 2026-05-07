const assert = require('assert');
const fs = require('fs');
const { createAuditLedger } = require('../apps/sentinel/src/governance/vendorOnboarding/auditLedger');
const { evaluateVendorOnboarding } = require('../apps/sentinel/src/governance/vendorOnboarding/engine');
const { deriveLatencyClass } = require('../apps/sentinel/src/governance/vendorOnboarding/latencyGovernor');

const ledgerPath = '/private/tmp/sentinel_vendor_onboarding_ledger_check.jsonl';
fs.rmSync(ledgerPath, { force: true });

const ledger = createAuditLedger({ ledgerPath });
const evaluation = evaluateVendorOnboarding({
  workflow_id: 'wf_ledger_check',
  vendorLegalName: 'Ledger Check LLC',
  taxId: '12-3456789',
  existingVendorTaxIds: [],
  documents: {
    tax_form: { name: 'w9.pdf' },
    insurance_certificate: { name: 'insurance.pdf' },
    business_registration: { name: 'registration.pdf' }
  },
  submissionTimestamp: '2026-05-01T12:00:00Z',
  intakeWindow: { start: '2026-05-01T00:00:00Z', end: '2026-05-02T00:00:00Z' },
  email: 'ledger@example.com',
  phone: '+1 555 123 4567',
  serviceCategories: ['facilities'],
  contractValue: 25000,
  requestorDepartment: 'Operations',
  highContractValueLimit: 100000,
  insuranceCoverage: 2000000,
  minimumInsuranceCoverage: 1000000,
  categoryCertificationRequirements: { facilities: ['COI'] },
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
  conflictingServiceCategoryPairs: [],
  insuranceExpiresAt: '2026-07-15T00:00:00Z',
  evaluationDate: '2026-05-01T00:00:00Z',
  approvalThreshold: 50000,
  businessClassificationConflicts: [],
  secondaryCertificationRequired: false,
  existingVendorNames: [],
  policyRoutingConflicts: [],
  documentMetadataAnomalies: [],
  sanctionSimilarityScore: 0.1,
  highSensitivityAccess: false
});
const first = ledger.appendEntry({
  workflowId: evaluation.workflow_id,
  capabilityId: 'vendor-onboarding',
  ruleSetVersion: evaluation.rule_set_version,
  nvopState: evaluation.nvop.state,
  latencyClass: deriveLatencyClass(evaluation),
  escalationFlag: evaluation.nvop.state >= 2,
  timestamp: '2026-05-01T12:00:00.000Z'
});
const second = ledger.appendEntry({
  workflowId: 'wf_ledger_check_2',
  capabilityId: 'vendor-onboarding',
  ruleSetVersion: evaluation.rule_set_version,
  nvopState: 2,
  latencyClass: 'human_review',
  escalationFlag: true,
  timestamp: '2026-05-01T12:00:01.000Z'
});

const entries = ledger.readEntries();
assert.strictEqual(entries.length, 2);
assert.strictEqual(entries[0].hash, first.hash);
assert.strictEqual(entries[1].previousHash, first.hash);
assert.strictEqual(entries[1].hash, second.hash);
assert.strictEqual(typeof ledger.updateEntry, 'undefined');
assert.strictEqual(typeof ledger.deleteEntry, 'undefined');
assert.throws(() => ledger.appendEntry({ workflowId: 'missing_fields' }), /AUDIT_LEDGER_ENTRY_INVALID/);

console.log('Vendor onboarding audit ledger check passed');
