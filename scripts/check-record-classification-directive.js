const assert = require('assert');
const fs = require('fs');
const path = require('path');

const read = (name) => fs.readFileSync(path.join(__dirname, '..', 'docs', name), 'utf8');
const policy = read('SENTINEL_AI_RECORD_CLASSIFICATION_AND_ACCESS_SEGREGATION_POLICY_2026-06-12.md');
const reconciliation = read('RECORD_CLASSIFICATION_DIRECTIVE_RECONCILIATION_2026-06-12.md');
const board = read('EXECUTIVE_BOARD_2026-06-11.md');

[
  'NO RECORD DELETION',
  'Infrastructure Records',
  'Founder Legacy Records',
  'Governance Records',
  'Financial Records',
  'Strategic Records',
  'Policy Entitlements',
  'active_investigation:',
  'trace_IBM_server_evidence',
  'excluded_unless_specifically_requested_by_Founder',
  'access_control_implementation_authority: false',
  'REQUEST_EXACT_LAWFUL_RECORD_DISPOSITION_REVIEW'
].forEach((needle) => assert(policy.includes(needle), `Record classification policy missing ${needle}`));

[
  'directive recorded; active investigation narrowed to Infrastructure Records',
  'Sovereign buyer-package reconciliation is retained',
  'access_controls_implemented_or_verified: false',
  'REVIEW_READ_ONLY_CURRENT_SENTINEL_DEPLOYMENT_FOOTPRINT_DISCOVERY_SCOPE'
].forEach((needle) => assert(reconciliation.includes(needle), `Reconciliation missing ${needle}`));

[
  'Active Record Classification And Investigation Directive',
  'active_category: Infrastructure_Records',
  'no_record_deletion: required',
  'access_controls_implemented_or_verified: false'
].forEach((needle) => assert(board.includes(needle), `Executive Board missing ${needle}`));

console.log('Record classification directive check passed');
