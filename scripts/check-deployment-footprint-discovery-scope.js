const assert = require('assert');
const fs = require('fs');
const path = require('path');

const read = (name) => fs.readFileSync(path.join(__dirname, '..', 'docs', name), 'utf8');
const review = read('READ_ONLY_CURRENT_SENTINEL_DEPLOYMENT_FOOTPRINT_DISCOVERY_SCOPE_REVIEW_2026-06-13.md');
const manifest = read('EXACT_READ_ONLY_CURRENT_SENTINEL_DEPLOYMENT_FOOTPRINT_DISCOVERY_MANIFEST_2026-06-13.md');
const result = read('READ_ONLY_CURRENT_SENTINEL_DEPLOYMENT_FOOTPRINT_DISCOVERY_RESULT_2026-06-13.md');
const board = read('EXECUTIVE_BOARD_REFRESHED_FOR_PROCESSING_2026-06-13.md');
const snapshot = read('EXECUTIVE_SNAPSHOT_2026-06-13.md');
const template = read('SENTINEL_EXECUTIVE_OPERATING_TEMPLATE_REFRESHED_FOR_PROCESSING_2026-06-13.md');

[
  'approved for execution-authorization review',
  'Azure_control_plane_metadata_and_local_repository_evidence_only',
  'network_health_probes: prohibited',
  'data_plane_access: prohibited',
  'AUTHORIZE_EXACT_READ_ONLY_CURRENT_SENTINEL_DEPLOYMENT_FOOTPRINT_DISCOVERY'
].forEach((needle) => assert(review.includes(needle), `Scope review missing ${needle}`));

[
  'Exact Allowed Azure Metadata Operations',
  'Expected Recorded Context',
  'Any context mismatch is a stop condition',
  'HTTP, HTTPS, TCP, readiness, health, or application endpoint probes',
  'extension install or upgrade',
  'prohibited_operations_performed: false'
].forEach((needle) => assert(manifest.includes(needle), `Exact manifest missing ${needle}`));

[
  'completed_bounded_read_only_control_plane_metadata_discovery',
  'ca-nc-dev-sentinel--0000030',
  'acrncdevsentinel.azurecr.io/sentinel-api:phase1-approval-continuity-3e7308a-20260513-0645',
  'prohibited_operations_performed: false',
  'REVIEW_TILDA_SENTINELOS_SUPPORT_CONTRACT'
].forEach((needle) => assert(result.includes(needle), `Discovery result missing ${needle}`));

[
  'AUTHORIZE_EXACT_READ_ONLY_CURRENT_SENTINEL_DEPLOYMENT_FOOTPRINT_DISCOVERY',
  'REVIEW_READ_ONLY_CURRENT_SENTINEL_DEPLOYMENT_FOOTPRINT_DISCOVERY_SCOPE'
].forEach((needle) => assert(board.includes(needle), `Board missing ${needle}`));

assert(snapshot.includes('Sentinel_control_plane_metadata: bounded_verified_on_2026_06_13'));
assert(template.includes('Sentinel_control_plane_metadata: bounded_verified_on_2026_06_13'));
assert(board.includes('next_gate: REVIEW_TILDA_SENTINELOS_SUPPORT_CONTRACT'));

console.log('Deployment footprint discovery scope check passed');
