const assert = require('assert');
const fs = require('fs');
const path = require('path');

const worksheet = fs.readFileSync(
  path.join(__dirname, '..', 'docs', 'AUTHORITATIVE_GOVERNMENT_OUTCOME_INTAKE_WORKSHEET_2026-06-12.md'),
  'utf8'
);

[
  'PREPARE_AUTHORITATIVE_GOVERNMENT_OUTCOME_INTAKE_WORKSHEET',
  'operator_provided_pending_validation',
  'authoritative_verified',
  'authoritative_access_pending',
  'illustrative_placeholder',
  'unsupported_open',
  'Entity and Intake Authority',
  'Intake Record Control',
  'Authorized First Intake Scope',
  'GOV-OUTCOME-INTAKE-001',
  'bounded_owner_provided_scope_authorized',
  'PROVIDE_FIRST_GOVERNMENT_OUTCOME_INTAKE_INPUTS',
  'First Intake Input Processing Result',
  'processed_no_entity_specific_inputs_supplied',
  'Arizona_SPO_discussion_draft',
  'PROVIDE_MINIMUM_FIRST_GOVERNMENT_OUTCOME_IDENTITY_AND_OUTCOME',
  'Source Validation Record',
  'Data Minimization and Handling Preflight',
  'Intended Public Outcome',
  'Measurement and Success',
  'Outcome Relationship Graph',
  'Execution Systems and Data',
  'Governance, Evidence, and Approval Path',
  'Constraints and Potential Interventions',
  'White-Glove Summary Preparation',
  'Owner Review and Sign-Off',
  'all_required_fields_are_resolved_or_formally_waived_by_authorized_reviewer',
  'No government communication, external retrieval, system connection'
].forEach((needle) => {
  assert(worksheet.includes(needle), `Government outcome intake worksheet missing ${needle}`);
});

assert(
  worksheet.includes('This section identifies systems only. It does not authorize connection'),
  'Worksheet must separate system identification from connection authority'
);
assert(
  worksheet.includes('Potential interventions remain hypotheses'),
  'Worksheet must preserve intervention evidence boundary'
);

console.log('Government outcome intake worksheet check passed');
