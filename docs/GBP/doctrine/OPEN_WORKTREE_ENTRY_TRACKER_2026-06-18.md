# Open Worktree Entry Tracker - 2026-06-18

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** branch catch-up path tracker  
**Source Gate:** `REVIEW_REFRESHED_EXACT_RELEASE_STAGING_MANIFEST`  
**Authority Created:** false

## Purpose

Track the current open worktree entries and put the branch catch-up work into a
reviewable path without staging, committing, pushing, moving, cleaning up, or
deploying anything.

This tracker records the 119 open entries observed before this tracker was
created: 11 modified tracked entries and 108 untracked entries. The tracker
itself is a new governance artifact, so live counts after this artifact and the
manifest review result are expected to increase.

## Source Worktree Count

```yaml
source_worktree_count:
  observed_on: 2026-06-18
  branch: main
  relation_to_origin_main: ahead_8_behind_0
  staged_entries: 0
  modified_tracked_entries: 11
  untracked_entries: 108
  total_open_entries: 119
  classification: dirty_mixed_scope_review_held
  branch_catch_up_authority: false
```

## Catch-Up Path

```yaml
catch_up_path:
  step_1: track_open_119_entries
  step_2: review_refreshed_exact_release_staging_manifest
  step_3: hold_runtime_code_scripts_fixtures_and_nested_repo_for_separate_packets
  step_4: request_exact_docs_only_stage_and_commit_authority_if_board_accepts_packet
  current_next_gate: APPROVE_STAGE_AND_COMMIT_REFRESHED_RELEASE_V1_GOVERNANCE_PACKET_DOCS_ONLY
  staging_authority_now: false
  commit_authority_now: false
  push_authority_now: false
```

## Modified Tracked Entries

```text
apps/api/server.js
apps/sentinel/src/audit/executionTrace.js
apps/sentinel/src/commands/dispatch.js
apps/sentinel/src/governance/policyEngine.js
apps/sentinel/src/sovereign/sovereignBoot.js
apps/sentinel/src/sovereign/sovereignLicense.js
apps/sentinel/src/surface/nunncloud.js
docs/sovereign/SOVEREIGN_ATTORNEY_BRIEF.md
docs/sovereign/SOVEREIGN_TIER.md
package.json
scripts/generate-sovereign-license.js
```

## Untracked Entries

```text
.vscode/extensions.json
SENTINEL-RELEASE-v1.md
apps/api/public/entity-inquiry-portal.html
apps/api/public/government-outcomes.html
apps/sentinel/src/commands/retrieval/
apps/sentinel/src/integrations/retrieval/
contract_reclamation-incubator/
docs/governance/AUTHORITATIVE_GOVERNMENT_OUTCOME_INTAKE_WORKSHEET_2026-06-12.md
docs/governance/AUTHORITATIVE_GOVERNMENT_OUTCOME_INTAKE_WORKSHEET_REVIEW_RESULT_2026-06-12.md
docs/governance/CLARITY_MEMORY_LAYER_PARTNER_PORTAL_SPECIFICS_QUERY_MANIFEST_2026-06-17.md
docs/CLARITY_MEMORY_LAYER_PARTNER_PORTAL_SPECIFICS_QUERY_RESULT_2026-06-17.md
docs/governance/CORRECTED_SENTINEL_AI_COMMAND_ACCESS_VERBIAGE_REVIEW_RESULT_2026-06-17.md
docs/governance/CURRENT_SENTINEL_DEPLOYMENT_FOOTPRINT_EXECUTIVE_INTAKE_RECONCILIATION_2026-06-12.md
docs/governance/DAILY_EXECUTIVE_CADENCE_PLAN_2026-06-16_AND_2026-06-17.md
docs/governance/DOE_T2_CDT_001_VALIDATION_AND_RELEASE_CONTROL_REVIEW_2026-06-18.md
docs/governance/ED25519_KEY_MANAGEMENT_AND_COMPATIBILITY_REVIEW_2026-06-17.md
docs/governance/EXACT_READ_ONLY_CURRENT_SENTINEL_DEPLOYMENT_FOOTPRINT_DISCOVERY_MANIFEST_2026-06-13.md
docs/governance/EXACT_RELEASE_STAGING_MANIFEST_REVIEW_2026-06-15.md
docs/governance/EXACT_RELEASE_STAGING_MANIFEST_REVIEW_RESULT_2026-06-15.md
docs/governance/EXACT_SENTINEL_EXECUTIVE_ENVELOPE_COMMAND_CHANGE_REVIEW_2026-06-12.md
docs/governance/EXACT_SENTINEL_NEXUS_BHINDI_VAULT_READ_ONLY_POC_TEST_MANIFEST_2026-06-17.md
docs/governance/EXECUTION_TRACE_COMPLETENESS_REPAIR_IMPLEMENTATION_RESULT_2026-06-17.md
docs/governance/EXECUTION_TRACE_COMPLETENESS_REPAIR_PLAN_2026-06-17.md
docs/governance/EXECUTION_TRACE_DISPATCH_READ_ONLY_REVIEW_2026-06-16.md
docs/governance/EXECUTIVE_BOARD_2026-06-11.md
docs/GBP/assessments/EXECUTIVE_BOARD_MOB_REFRESHED_2026-06-15.md
docs/governance/EXECUTIVE_BOARD_REFRESHED_FOR_PROCESSING_2026-06-13.md
docs/governance/EXECUTIVE_BOARD_SUMMARY_UPDATE_2026-06-12.md
docs/governance/EXECUTIVE_DRIFT_FOCUS_REPORT_2026-06-18.md
docs/governance/EXECUTIVE_PRIORITY_EVIDENCE_AND_APPROVAL_MATRIX_2026-06-18.md
docs/governance/EXECUTIVE_SNAPSHOT_2026-06-11.md
docs/governance/EXECUTIVE_SNAPSHOT_2026-06-13.md
docs/governance/EXECUTIVE_SNAPSHOT_2026-06-17.md
docs/governance/FIRST_GOVERNMENT_OUTCOME_INTAKE_INPUT_PROCESSING_RESULT_2026-06-12.md
docs/FIRST_GOVERNMENT_OUTCOME_INTAKE_SCOPE_AUTHORIZATION_RESULT_2026-06-12.md
docs/governance/FIXTURE_ONLY_SENTINEL_NEXUS_BHINDI_VAULT_POC_IMPLEMENTATION_RESULT_2026-06-17.md
docs/governance/FRIDAY_DAILY_EXECUTIVE_CADENCE_CLOSEOUT_2026-06-12.md
docs/governance/FRIDAY_WEEKLY_EXECUTIVE_CADENCE_CLOSEOUT_2026-06-12.md
docs/governance/GOVERNANCE_COMPLIANCE_EVIDENCE_INDEX_2026-06-14.md
docs/governance/GOVERNANCE_COMPLIANCE_SETTLEMENT_PACKET_2026-06-14.md
docs/governance/GOVERNMENT_OUTCOME_OPERATING_SYSTEM_REVIEW_PACKET_2026-06-12.md
docs/governance/GOVERNMENT_OUTCOME_OWNER_ADDITIONS_RESULT_2026-06-12.md
docs/governance/MAIN_ENTITY_INQUIRY_PORTAL_ACTIVATION_REVIEW_2026-06-18.md
docs/governance/MAIN_ENTITY_INQUIRY_PORTAL_ACTIVATION_REVIEW_RESULT_2026-06-18.md
docs/governance/MAIN_ENTITY_INQUIRY_PORTAL_REVIEW_RESULT_2026-06-15.md
docs/governance/MINIMUM_FIRST_GOVERNMENT_OUTCOME_IDENTITY_AND_OUTCOME_PROCESSING_RESULT_2026-06-18.md
docs/GBP/assessments/MONDAY_DAILY_EXECUTIVE_CADENCE_2026-06-15.md
docs/governance/MONDAY_EXECUTIVE_ROUTING_UPDATE_2026-06-15.md
docs/governance/MONDAY_INTERNAL_SUPPORT_DISBURSEMENT_PACKET_2026-06-15.md
docs/GBP/assessments/MONDAY_WEEKLY_EXECUTIVE_CADENCE_START_2026-06-15.md
docs/governance/NUNNCORP_SENTINELOS_ISSUE_SUPPORT_TRACKER_2026-06-14.md
docs/GBP/doctrine/NUNN_CORPORATION_MASTER_OPERATING_BINDER_2026-06-15.md
docs/governance/OLDER_REPO_DIFF_REVIEW_RESULT_2026-06-11.md
docs/governance/OLDER_REPO_SEPARATED_RESOLUTION_REQUIREMENTS_2026-06-11.md
docs/PARTNER_PORTAL_REPOSITORY_DISCOVERY_AND_CONTROL_DIRECTION_2026-06-17.md
docs/governance/POSTGRESQL_MEMORY_LAYER_LIVE_VERIFICATION_RECONCILIATION_2026-06-12.md
docs/governance/READ_ONLY_CURRENT_SENTINEL_DEPLOYMENT_FOOTPRINT_DISCOVERY_RESULT_2026-06-13.md
docs/READ_ONLY_CURRENT_SENTINEL_DEPLOYMENT_FOOTPRINT_DISCOVERY_SCOPE_REVIEW_2026-06-13.md
docs/governance/RECORD_CLASSIFICATION_DIRECTIVE_RECONCILIATION_2026-06-12.md
docs/REFRESHED_EXACT_RELEASE_STAGING_MANIFEST_REVIEW_2026-06-18.md
docs/governance/REFRESHED_EXACT_REVIEW_MANIFEST_2026-06-17.md
docs/governance/REFRESHED_RELEASE_BLOCKER_SELECTION_RESULT_2026-06-18.md
docs/RELEASE_BLOCKER_SELECTION_RESULT_2026-06-15.md
docs/governance/SATURDAY_DAILY_EXECUTIVE_CADENCE_2026-06-13.md
docs/governance/SENTINELOS_ENTITY_INQUIRY_PORTAL_RECONCILIATION_2026-06-12.md
docs/governance/SENTINEL_AI_CHANGE_HOLD_DECLARATION_2026-06-11.md
docs/governance/SENTINEL_AI_COMMAND_ACCESS_NAMING_AND_VERBIAGE_SCAN_2026-06-17.md
docs/governance/SENTINEL_AI_RECORD_CLASSIFICATION_AND_ACCESS_SEGREGATION_POLICY_2026-06-12.md
docs/governance/SENTINEL_EXECUTIVE_OPERATING_TEMPLATE_2026-06-11.md
docs/GBP/assessments/SENTINEL_EXECUTIVE_OPERATING_TEMPLATE_MOB_REFRESHED_2026-06-15.md
docs/SENTINEL_EXECUTIVE_OPERATING_TEMPLATE_REFRESHED_2026-06-12.md
docs/governance/SENTINEL_EXECUTIVE_OPERATING_TEMPLATE_REFRESHED_2026-06-15.md
docs/governance/SENTINEL_EXECUTIVE_OPERATING_TEMPLATE_REFRESHED_FOR_PROCESSING_2026-06-13.md
docs/governance/SENTINEL_MANAGED_REPOSITORY_EVIDENCE_AND_CLASSIFICATION_2026-06-11.md
docs/governance/SENTINEL_MANAGED_REPOSITORY_EVIDENCE_AND_CLASSIFICATION_REVIEW_RESULT_2026-06-11.md
docs/governance/SENTINEL_NEXUS_BHINDI_VAULT_READ_ONLY_POC_TEST_PLAN_2026-06-17.md
docs/SENTINEL_RELEASE_V1_GOVERNANCE_PACKET_REVIEW_RESULT_2026-06-15.md
docs/governance/SOVEREIGN_BUYER_PACKAGE_INTAKE_RECONCILIATION_2026-06-11.md
docs/governance/SOVEREIGN_KEY_MANAGEMENT_AND_LICENSE_LIFECYCLE_CONTROL_PLAN_2026-06-17.md
docs/SOVEREIGN_KEY_MANAGEMENT_AND_LICENSE_LIFECYCLE_CONTROL_PLAN_APPROVAL_RESULT_2026-06-17.md
docs/SOVEREIGN_KEY_MANAGEMENT_AND_LICENSE_LIFECYCLE_CONTROL_PLAN_REVIEW_RESULT_2026-06-17.md
docs/governance/SOVEREIGN_KEY_MANAGEMENT_IMPLEMENTATION_MANIFEST_2026-06-17.md
docs/governance/SOVEREIGN_LIGHT_MODE_APPROVAL_PACKET_2026-06-11.md
docs/governance/SOVEREIGN_LIGHT_MODE_APPROVAL_PROCESSING_RESULT_2026-06-16.md
docs/governance/SOVEREIGN_READINESS_SCORECARD_2026-06-11.md
docs/governance/SOVEREIGN_SECURITY_AND_GOVERNANCE_OVERVIEW_DRAFT_2026-06-11.md
docs/governance/SUNDAY_DAILY_EXECUTIVE_CADENCE_CLOSEOUT_2026-06-14.md
docs/SUNDAY_WEEKLY_EXECUTIVE_CADENCE_CLOSEOUT_2026-06-14.md
docs/GBP/assessments/TASK_TEMPLATE_CHECK_FAILURE_REVIEW_2026-06-15.md
docs/governance/TILDA_ORCHESTRATION_SUPPORT_COMMAND_PACKET_2026-06-14.md
docs/TILDA_ORCHESTRATION_SUPPORT_COMMAND_PACKET_REVIEW_RESULT_2026-06-14.md
docs/governance/TILDA_SENTINELOS_SUPPORT_CONTRACT_REVIEW_RESULT_2026-06-15.md
docs/TILDA_SENTINELOS_SUPPORT_LANE_PROCESSING_RESULT_2026-06-12.md
docs/governance/TILDA_SUPPORT_REQUEST_ANSWER_AND_ROUTING_MATRIX_2026-06-14.md
docs/governance/TUESDAY_EXECUTIVE_CADENCE_CLOSEOUT_2026-06-16.md
docs/governance/WEDNESDAY_EXECUTIVE_CADENCE_ACTIVATION_2026-06-17.md
fixtures/retrieval/
ops/command-envelopes/sovereign-light-mode-approval-review-2026-06-11.json
scripts/check-deployment-footprint-discovery-scope.js
scripts/check-entity-inquiry-portal.js
scripts/check-execution-trace-completeness.js
scripts/check-government-outcome-intake-worksheet.js
scripts/check-government-outcomes-surface.js
scripts/check-record-classification-directive.js
scripts/check-saturday-executive-cadence.js
scripts/check-sentinel-nexus-bhindi-vault-read-only-poc.js
scripts/check-sovereign-license.js
scripts/generate-sovereign-keypair.js
```

## Path Classification

| Path Group | Count Basis | Current Direction | Held From Catch-Up |
| --- | ---: | --- | --- |
| Proposed docs-only release governance packet | 43 proposed documents in refreshed staging manifest | eligible for future exact docs-only staging approval | stage, commit, push until exact approval |
| Modified tracked runtime/code/package/script entries | 11 modified tracked entries | separate implementation or runtime review packets | docs-only catch-up packet |
| App public surfaces | 2 untracked HTML surfaces | separate client-facing activation/release review | deployment, external activation |
| Retrieval command, adapters, and fixtures | directories and scripts present | separate fixture-only POC test packet | live retrieval, connector execution |
| Sovereign implementation and key scripts | code, package, scripts, docs | separate Sovereign implementation review | key generation, license issuance |
| Contract reclamation incubator | nested repo | preserve standalone boundary | import, parent staging, movement |
| Remaining governance documents | review-held evidence records | route by lane before persistence | unreviewed broad staging |

## Review-Held Catch-Up Decision

```yaml
review_held_catch_up_decision:
  refreshed_manifest_review: docs/REFRESHED_EXACT_RELEASE_STAGING_MANIFEST_REVIEW_2026-06-18.md
  review_result: docs/governance/REFRESHED_EXACT_RELEASE_STAGING_MANIFEST_REVIEW_RESULT_2026-06-18.md
  tracker: docs/GBP/doctrine/OPEN_WORKTREE_ENTRY_TRACKER_2026-06-18.md
  proposed_future_packet: refreshed_release_v1_governance_and_executive_control_packet_docs_only
  branch_catch_up_ready_for_execution: false
  reason:
    - exact_stage_and_commit_authority_not_granted
    - runtime_and_implementation_entries_remain_mixed_scope
    - push_authority_not_granted
  next_gate: APPROVE_STAGE_AND_COMMIT_REFRESHED_RELEASE_V1_GOVERNANCE_PACKET_DOCS_ONLY
  authority_created: false
```

## Non-Authorization

This tracker does not authorize staging, commit, push, deployment, runtime
mutation, file movement, cleanup, source retrieval, connector execution,
customer contact, government contact, release publication, or external sharing.
