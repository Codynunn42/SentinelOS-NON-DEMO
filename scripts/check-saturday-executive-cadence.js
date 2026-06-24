const assert = require('assert');
const fs = require('fs');
const path = require('path');

const read = (name) => fs.readFileSync(path.join(__dirname, '..', 'docs', name), 'utf8');
const board = read('EXECUTIVE_BOARD_REFRESHED_FOR_PROCESSING_2026-06-13.md');
const snapshot = read('EXECUTIVE_SNAPSHOT_2026-06-13.md');
const template = read('SENTINEL_EXECUTIVE_OPERATING_TEMPLATE_REFRESHED_FOR_PROCESSING_2026-06-13.md');
const cadence = read('SATURDAY_DAILY_EXECUTIVE_CADENCE_2026-06-13.md');

[
  'REVIEW_MAIN_ENTITY_INQUIRY_PORTAL',
  'current_snapshot: docs/EXECUTIVE_SNAPSHOT_2026-06-13.md',
  'Saturday_daily_cadence: docs/SATURDAY_DAILY_EXECUTIVE_CADENCE_2026-06-13.md',
  'processed_first_decision: AUTHORIZE_BOUNDED_READ_ONLY_POSTGRESQL_MEMORY_LAYER_VERIFICATION',
  'processed_second_review: REVIEW_READ_ONLY_CURRENT_SENTINEL_DEPLOYMENT_FOOTPRINT_DISCOVERY_SCOPE',
  'processed_second_decision: AUTHORIZE_EXACT_READ_ONLY_CURRENT_SENTINEL_DEPLOYMENT_FOOTPRINT_DISCOVERY',
  'next_gate: REVIEW_TILDA_SENTINELOS_SUPPORT_CONTRACT'
].forEach((needle) => assert(board.includes(needle), `Refreshed Board missing ${needle}`));

[
  'SATURDAY DAILY CADENCE PROCESSED',
  'modified_tracked_entries: 11',
  'untracked_entries: 75',
  'total_open_entries: 86',
  'June_16_and_June_17_records: future_dated_planning_or_proposed',
  'PostgreSQL_contract_reclamation_rows: zero_verified_at_query_time',
  'REVIEW_MAIN_ENTITY_INQUIRY_PORTAL'
].forEach((needle) => assert(snapshot.includes(needle), `Executive Snapshot missing ${needle}`));

[
  'current_snapshot: docs/EXECUTIVE_SNAPSHOT_2026-06-13.md',
  'Saturday_daily_cadence: docs/SATURDAY_DAILY_EXECUTIVE_CADENCE_2026-06-13.md',
  'Main entity inquiry portal',
  'PostgreSQL_memory_tables: six_verified_by_count',
  'Sentinel_control_plane_metadata: bounded_verified_on_2026_06_13',
  'REVIEW_TILDA_SENTINELOS_SUPPORT_CONTRACT',
  'REVIEW_MAIN_ENTITY_INQUIRY_PORTAL'
].forEach((needle) => assert(template.includes(needle), `Executive Template missing ${needle}`));

[
  'reports_reconciled_and_decisions_prepared',
  'substantive_lanes_reviewed: 8',
  'untracked_entries_after_discovery_result_artifacts: 75',
  'total_open_entries_after_discovery_result_artifacts: 86',
  'future_dated_execution_claims_accepted: false',
  'processed_first_decision: AUTHORIZE_BOUNDED_READ_ONLY_POSTGRESQL_MEMORY_LAYER_VERIFICATION',
  'processed_second_decision: AUTHORIZE_EXACT_READ_ONLY_CURRENT_SENTINEL_DEPLOYMENT_FOOTPRINT_DISCOVERY',
  'corrected_portal_gate: REVIEW_MAIN_ENTITY_INQUIRY_PORTAL',
  'This cadence prepares decisions'
].forEach((needle) => assert(cadence.includes(needle), `Saturday cadence missing ${needle}`));

console.log('Saturday executive cadence check passed');
