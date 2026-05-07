const assert = require('assert');
const { rules, RULE_SET_VERSION } = require('../apps/sentinel/src/governance/vendorOnboarding/rules');
const {
  classifyNvopState,
  evaluateVendorOnboarding,
  NVOP_THRESHOLDS
} = require('../apps/sentinel/src/governance/vendorOnboarding/engine');

assert.strictEqual(RULE_SET_VERSION, 'vendor-onboarding-v1.0');
assert.strictEqual(rules.length, 30);
assert.deepStrictEqual(rules.map((rule) => rule.id), Array.from({ length: 30 }, (_, index) => `R-${String(index + 1).padStart(3, '0')}`));
assert.strictEqual(NVOP_THRESHOLDS.length, 4);
assert.deepStrictEqual([
  classifyNvopState(0.4999).state,
  classifyNvopState(0.5).state,
  classifyNvopState(0.5001).state,
  classifyNvopState(1.2999).state,
  classifyNvopState(1.3).state,
  classifyNvopState(1.3001).state,
  classifyNvopState(1.5).state,
  classifyNvopState(3.0).state,
  classifyNvopState(3.0001).state
], [0, 0, 1, 1, 1, 2, 2, 2, 3]);

const cleanInput = {
  workflow_id: 'wf_vendor_clean',
  vendorLegalName: 'Acme Compliance LLC',
  taxId: '12-3456789',
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
  email: 'ops@acme.example',
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
  existingVendorNames: ['Northwind Services Inc'],
  vendorNameSimilarityThreshold: 0.85,
  policyRoutingConflicts: [],
  documentMetadataAnomalies: [],
  sanctionSimilarityScore: 0.1,
  sanctionSimilarityTolerance: 0.75,
  highSensitivityAccess: false,
  clearanceDocumentationPresent: false
};

const clean = evaluateVendorOnboarding(cleanInput);
assert.strictEqual(clean.workflow_id, 'wf_vendor_clean');
assert.strictEqual(clean.passed_rules.length, 30);
assert.strictEqual(clean.failed_rules.length, 0);
assert.strictEqual(clean.ambiguity_flags.length, 0);
assert.strictEqual(clean.compliance_score, 1);
assert.strictEqual(clean.derived_domain_tier, 1);
assert.strictEqual(clean.nvop.state, 0);

const escalated = evaluateVendorOnboarding({
  ...cleanInput,
  workflow_id: 'wf_vendor_escalated',
  contractValue: 104000,
  insuranceExpiresAt: '2026-05-20T00:00:00Z',
  businessClassificationConflicts: ['staffing cannot satisfy restricted systems category'],
  policyRoutingConflicts: ['Finance routes expedited, Legal blocks expedited'],
  highSensitivityAccess: true,
  clearanceDocumentationPresent: false,
  sanctionSimilarityScore: 0.8,
  verification_score: 0.55
});

assert(escalated.failed_rules.some((rule) => rule.rule_id === 'R-011'));
assert(escalated.ambiguity_flags.some((rule) => rule.rule_id === 'R-024'));
assert(escalated.ambiguity_flags.some((rule) => rule.rule_id === 'R-030'));
assert.strictEqual(escalated.derived_domain_tier, 3);
assert(escalated.impact_modifier_total >= 7);
assert(escalated.nvop.state >= 2);

console.log('Vendor onboarding rule set check passed');
