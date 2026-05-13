const { RULE_SET_VERSION } = require('./nvopConfig');
const { hasText, asNumber, asArray, isValidEmail, isValidPhone } = require('../../shared/validation');

const CATEGORIES = {
  STRUCTURAL: 'Structural Integrity',
  POLICY: 'Policy Threshold',
  AMBIGUITY: 'Ambiguity & Escalation Injection'
};

const SEVERITY_WEIGHT = {
  Low: 1,
  Medium: 2,
  High: 3
};

// Local helpers specific to vendor onboarding
function normalizeText(value) {
  return hasText(value) ? value.trim().toLowerCase() : '';
}

function documentFor(documents, key) {
  return documents && typeof documents === 'object' ? documents[key] : null;
}

function fileExtension(file) {
  const name = hasText(file && file.name) ? file.name : hasText(file) ? file : '';
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

function hasDocument(documents, key) {
  const doc = documentFor(documents, key);
  return Boolean(doc && (hasText(doc.name) || hasText(doc.url) || hasText(doc.id) || hasText(doc)));
}

function withinWindow(timestamp, intakeWindow = {}) {
  const time = new Date(timestamp).getTime();
  const start = new Date(intakeWindow.start).getTime();
  const end = new Date(intakeWindow.end).getTime();

  if (!Number.isFinite(time) || !Number.isFinite(start) || !Number.isFinite(end)) {
    return false;
  }

  return time >= start && time <= end;
}

function includesAll(actual, required) {
  const actualSet = new Set(asArray(actual).map(normalizeText));
  return asArray(required).every((item) => actualSet.has(normalizeText(item)));
}

function requiredCertifications(input) {
  const requirements = input.categoryCertificationRequirements || {};
  return asArray(input.serviceCategories).flatMap((category) => asArray(requirements[category]));
}

function similarityScore(a, b) {
  const left = normalizeText(a);
  const right = normalizeText(b);

  if (!left || !right) {
    return 0;
  }

  const leftTokens = new Set(left.split(/[^a-z0-9]+/).filter(Boolean));
  const rightTokens = new Set(right.split(/[^a-z0-9]+/).filter(Boolean));
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;

  return union === 0 ? 0 : intersection / union;
}

const rules = [
  {
    id: 'R-001',
    category: CATEGORIES.STRUCTURAL,
    name: 'Required Field Completeness',
    condition: 'All mandatory form fields must be present and non-empty.',
    severity: 'High',
    logTrigger: 'vendor.required_fields.missing',
    evaluate: (input) => includesAll(Object.keys(input).filter((key) => {
      const value = input[key];
      return Array.isArray(value) ? value.length > 0 : value && value !== '';
    }), input.requiredFields || [
      'vendorLegalName',
      'taxId',
      'documents',
      'submissionTimestamp',
      'email',
      'phone',
      'serviceCategories',
      'contractValue',
      'requestorDepartment'
    ])
  },
  {
    id: 'R-002',
    category: CATEGORIES.STRUCTURAL,
    name: 'Vendor Legal Name Format Validation',
    condition: 'Vendor legal name must match the approved character and structure pattern.',
    severity: 'Medium',
    logTrigger: 'vendor.legal_name.invalid_format',
    evaluate: (input) => /^[A-Za-z0-9][A-Za-z0-9 .,&'()-]{1,118}[A-Za-z0-9.)]$/.test(input.vendorLegalName || '')
  },
  {
    id: 'R-003',
    category: CATEGORIES.STRUCTURAL,
    name: 'Unique Vendor Identifier Check',
    condition: 'Vendor tax ID must not already exist in the vendor registry.',
    severity: 'High',
    logTrigger: 'vendor.tax_id.duplicate',
    evaluate: (input) => !asArray(input.existingVendorTaxIds).includes(input.taxId)
  },
  {
    id: 'R-004',
    category: CATEGORIES.STRUCTURAL,
    name: 'Document Upload Presence Check',
    condition: 'Tax form, insurance certificate, and business registration must be attached.',
    severity: 'High',
    logTrigger: 'vendor.documents.required_missing',
    evaluate: (input) => ['tax_form', 'insurance_certificate', 'business_registration'].every((key) => hasDocument(input.documents, key))
  },
  {
    id: 'R-005',
    category: CATEGORIES.STRUCTURAL,
    name: 'Document File Type Validation',
    condition: 'Uploaded documents must match approved formats.',
    severity: 'Medium',
    logTrigger: 'vendor.documents.invalid_file_type',
    evaluate: (input) => {
      const approved = new Set(input.approvedFileTypes || ['pdf', 'doc', 'docx']);
      return Object.values(input.documents || {}).every((file) => approved.has(fileExtension(file)));
    }
  },
  {
    id: 'R-006',
    category: CATEGORIES.STRUCTURAL,
    name: 'Submission Timestamp Validity',
    condition: 'Submission timestamp must fall within the valid intake window.',
    severity: 'Medium',
    logTrigger: 'vendor.submission_timestamp.invalid',
    evaluate: (input) => withinWindow(input.submissionTimestamp, input.intakeWindow)
  },
  {
    id: 'R-007',
    category: CATEGORIES.STRUCTURAL,
    name: 'Contact Information Validation',
    condition: 'Email and phone must pass format validation.',
    severity: 'Medium',
    logTrigger: 'vendor.contact.invalid',
    evaluate: (input) => isValidEmail(input.email) && isValidPhone(input.phone)
  },
  {
    id: 'R-008',
    category: CATEGORIES.STRUCTURAL,
    name: 'Service Category Selection Required',
    condition: 'At least one service category must be selected.',
    severity: 'Medium',
    logTrigger: 'vendor.service_category.missing',
    evaluate: (input) => asArray(input.serviceCategories).length > 0
  },
  {
    id: 'R-009',
    category: CATEGORIES.STRUCTURAL,
    name: 'Contract Value Numeric Validation',
    condition: 'Contract value must be numeric and greater than zero.',
    severity: 'High',
    logTrigger: 'vendor.contract_value.invalid',
    evaluate: (input) => {
      const value = asNumber(input.contractValue);
      return value !== null && value > 0;
    }
  },
  {
    id: 'R-010',
    category: CATEGORIES.STRUCTURAL,
    name: 'Department Requestor Identification',
    condition: 'Internal sponsor department must be declared.',
    severity: 'Medium',
    logTrigger: 'vendor.requestor_department.missing',
    evaluate: (input) => hasText(input.requestorDepartment)
  },
  {
    id: 'R-011',
    category: CATEGORIES.POLICY,
    name: 'High Contract Value Threshold',
    condition: 'If contract value exceeds the predefined limit, Tier 3 classification is required.',
    severity: 'High',
    logTrigger: 'vendor.contract_value.tier3_threshold',
    evaluate: (input) => asNumber(input.contractValue) <= asNumber(input.highContractValueLimit)
  },
  {
    id: 'R-012',
    category: CATEGORIES.POLICY,
    name: 'Insurance Minimum Coverage Check',
    condition: 'Insurance coverage must meet or exceed required minimum.',
    severity: 'High',
    logTrigger: 'vendor.insurance.coverage_below_minimum',
    evaluate: (input) => asNumber(input.insuranceCoverage) >= asNumber(input.minimumInsuranceCoverage)
  },
  {
    id: 'R-013',
    category: CATEGORIES.POLICY,
    name: 'Certification Requirement by Service Category',
    condition: 'Service categories with mandatory certifications must include those certifications.',
    severity: 'High',
    logTrigger: 'vendor.certification.required_missing',
    evaluate: (input) => includesAll(input.certifications, requiredCertifications(input))
  },
  {
    id: 'R-014',
    category: CATEGORIES.POLICY,
    name: 'Conflict of Interest Declaration Required',
    condition: 'Conflict of interest declaration form must be signed.',
    severity: 'High',
    logTrigger: 'vendor.conflict_declaration.unsigned',
    evaluate: (input) => input.conflictOfInterestSigned === true
  },
  {
    id: 'R-015',
    category: CATEGORIES.POLICY,
    name: 'Multi-Department Approval Trigger',
    condition: 'If value exceeds threshold X, Finance and Legal approvals are required.',
    severity: 'High',
    logTrigger: 'vendor.approvals.multi_department_missing',
    evaluate: (input) => {
      const value = asNumber(input.contractValue);
      const threshold = asNumber(input.multiDepartmentApprovalThreshold);
      return value <= threshold || includesAll(input.approvals, ['Finance', 'Legal']);
    }
  },
  {
    id: 'R-016',
    category: CATEGORIES.POLICY,
    name: 'Expedited Review Eligibility Check',
    condition: 'High-value vendors cannot use expedited pathway.',
    severity: 'Medium',
    logTrigger: 'vendor.expedited_review.ineligible',
    evaluate: (input) => {
      const value = asNumber(input.contractValue);
      const threshold = asNumber(input.expeditedReviewMaxValue);
      return input.expeditedReview !== true || value <= threshold;
    }
  },
  {
    id: 'R-017',
    category: CATEGORIES.POLICY,
    name: 'Sanction Screening Required',
    condition: 'Vendor must pass sanction registry check.',
    severity: 'High',
    logTrigger: 'vendor.sanction_screening.failed',
    evaluate: (input) => input.sanctionScreeningStatus === 'passed'
  },
  {
    id: 'R-018',
    category: CATEGORIES.POLICY,
    name: 'Jurisdiction Compliance Check',
    condition: 'Vendor must be legally eligible to operate in region.',
    severity: 'High',
    logTrigger: 'vendor.jurisdiction.ineligible',
    evaluate: (input) => input.jurisdictionEligible === true
  },
  {
    id: 'R-019',
    category: CATEGORIES.POLICY,
    name: 'Data Handling Classification Match',
    condition: 'Vendor must comply with required data classification level.',
    severity: 'High',
    logTrigger: 'vendor.data_classification.mismatch',
    evaluate: (input) => {
      const order = ['public', 'internal', 'confidential', 'restricted', 'high'];
      const vendor = order.indexOf(normalizeText(input.vendorDataClassification));
      const required = order.indexOf(normalizeText(input.requiredDataClassification));
      return vendor >= 0 && required >= 0 && vendor >= required;
    }
  },
  {
    id: 'R-020',
    category: CATEGORIES.POLICY,
    name: 'Renewal Flag for Existing Vendor',
    condition: 'If vendor was previously onboarded, renewal workflow is required.',
    severity: 'Medium',
    logTrigger: 'vendor.renewal.workflow_required',
    evaluate: (input) => input.previouslyOnboarded !== true || input.workflowType === 'renewal'
  },
  {
    id: 'R-021',
    category: CATEGORIES.AMBIGUITY,
    name: 'Service Category Overlap Detection',
    condition: 'Vendor selected categories spanning conflicting compliance tiers.',
    severity: 'Medium',
    nvopImpactModifier: 1,
    logTrigger: 'vendor.service_category.tier_overlap',
    evaluate: (input) => asArray(input.conflictingServiceCategoryPairs).length === 0
  },
  {
    id: 'R-022',
    category: CATEGORIES.AMBIGUITY,
    name: 'Insurance Expiration Proximity',
    condition: 'Insurance expires within 30 days.',
    severity: 'Medium',
    logTrigger: 'vendor.insurance.expiring_soon',
    evaluate: (input) => {
      const expires = new Date(input.insuranceExpiresAt).getTime();
      const now = new Date(input.evaluationDate || Date.now()).getTime();
      const days = (expires - now) / 86400000;
      return Number.isFinite(days) && days > 30;
    }
  },
  {
    id: 'R-023',
    category: CATEGORIES.AMBIGUITY,
    name: 'Contract Value Near Threshold',
    condition: 'Contract value within 5 percent of approval threshold triggers dynamic latency escalation.',
    severity: 'Medium',
    logTrigger: 'vendor.contract_value.near_threshold',
    evaluate: (input) => {
      const value = asNumber(input.contractValue);
      const threshold = asNumber(input.approvalThreshold);
      if (value === null || threshold === null || threshold <= 0) {
        return false;
      }

      return Math.abs(value - threshold) / threshold > 0.05;
    }
  },
  {
    id: 'R-024',
    category: CATEGORIES.AMBIGUITY,
    name: 'Inconsistent Business Classification',
    condition: 'Business type conflicts with selected service category.',
    severity: 'High',
    nvopImpactModifier: 3,
    logTrigger: 'vendor.business_classification.inconsistent',
    evaluate: (input) => asArray(input.businessClassificationConflicts).length === 0
  },
  {
    id: 'R-025',
    category: CATEGORIES.AMBIGUITY,
    name: 'Missing Secondary Certification Clause',
    condition: 'Certification present but missing required secondary validation.',
    severity: 'High',
    logTrigger: 'vendor.certification.secondary_missing',
    evaluate: (input) => input.secondaryCertificationRequired !== true || input.secondaryCertificationValidated === true
  },
  {
    id: 'R-026',
    category: CATEGORIES.AMBIGUITY,
    name: 'Duplicate Similar Vendor Name Detection',
    condition: 'Similarity score above defined threshold.',
    severity: 'Medium',
    logTrigger: 'vendor.legal_name.similar_duplicate',
    evaluate: (input) => {
      const threshold = asNumber(input.vendorNameSimilarityThreshold) || 0.85;
      return asArray(input.existingVendorNames).every((name) => similarityScore(input.vendorLegalName, name) < threshold);
    }
  },
  {
    id: 'R-027',
    category: CATEGORIES.AMBIGUITY,
    name: 'Cross-Department Rule Conflict',
    condition: 'Two policies produce contradictory routing requirement.',
    severity: 'High',
    nvopImpactModifier: 2,
    logTrigger: 'vendor.routing.cross_department_conflict',
    evaluate: (input) => asArray(input.policyRoutingConflicts).length === 0
  },
  {
    id: 'R-028',
    category: CATEGORIES.AMBIGUITY,
    name: 'Document Metadata Anomaly',
    condition: 'Uploaded document metadata inconsistent with vendor submission.',
    severity: 'Medium',
    logTrigger: 'vendor.documents.metadata_anomaly',
    evaluate: (input) => asArray(input.documentMetadataAnomalies).length === 0
  },
  {
    id: 'R-029',
    category: CATEGORIES.AMBIGUITY,
    name: 'Sanction Screening Partial Match',
    condition: 'Name similarity to sanctioned entity above tolerance threshold.',
    severity: 'High',
    nvopImpactModifier: 1,
    logTrigger: 'vendor.sanction_screening.partial_match',
    evaluate: (input) => {
      const threshold = asNumber(input.sanctionSimilarityTolerance) || 0.75;
      return asNumber(input.sanctionSimilarityScore) < threshold;
    }
  },
  {
    id: 'R-030',
    category: CATEGORIES.AMBIGUITY,
    name: 'Data Sensitivity Escalation Flag',
    condition: 'Vendor accessing high-sensitivity systems without clearance documentation.',
    severity: 'High',
    nvopImpactModifier: 5,
    logTrigger: 'vendor.data_sensitivity.clearance_missing',
    evaluate: (input) => input.highSensitivityAccess !== true || input.clearanceDocumentationPresent === true
  }
];

module.exports = {
  CATEGORIES,
  RULE_SET_VERSION,
  SEVERITY_WEIGHT,
  rules
};
