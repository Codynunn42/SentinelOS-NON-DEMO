# Branch Comparison Report

## Scope
- compared without switching branches
- base: main
- head: ops/closeout-2026-06-20

## Ahead/Behind
- main...ops/closeout-2026-06-20 (left-right count): 0	22

## Changed Files
```
A	.data/closeout-state.json
A	.vscode/SentinelOS-NON-DEMO.code-workspace
A	.vscode/extensions.json
A	DoctorModeRuntimeRestoreSupportPacket.json
A	SENTINEL-RELEASE-v1.md
A	activity-full.json
A	activity.json
A	apps/api/public/entity-inquiry-portal.html
A	apps/api/public/government-outcomes.html
M	apps/api/public/mission-control.html
M	apps/api/server.js
A	apps/executive-desk/.env.example
A	apps/executive-desk/EXECUTIVE_DESK_V1_ROADMAP.md
A	apps/executive-desk/GATE_3_COMPLETE.md
A	apps/executive-desk/GATE_4_AUTHORITY_INTEGRATION_COMPLETE.md
A	apps/executive-desk/GATE_5_RISK_GATE_INTEGRATION_COMPLETE.md
A	apps/executive-desk/GATE_6_API_ROUTES_COMPLETE.md
A	apps/executive-desk/GATE_6_API_ROUTES_VERIFICATION_RESULT_2026-07-03.md
A	apps/executive-desk/GATE_6_COMPLETION_SUMMARY.md
A	apps/executive-desk/GATE_7_FRONTEND_COMPONENTS_VERIFICATION_RESULT_2026-07-03.md
A	apps/executive-desk/GATE_8_E2E_DEMO_VERIFICATION_RESULT_2026-07-05.md
A	apps/executive-desk/GOVERNMENT_READINESS_DAILY_CADENCE_2026-07-14.md
A	apps/executive-desk/INTEGRATION_CHECKLIST.md
A	apps/executive-desk/PROXY_IMPLEMENTATION_COMPLETE.md
A	apps/executive-desk/README.md
A	apps/executive-desk/RECEIPT_PERSISTENCE_IMPLEMENTATION.md
A	apps/executive-desk/SENTINEL_AI_WORK_PACKET_DOE_EXECUTIVE_ASSESSMENT.md
A	apps/executive-desk/api/__tests__/routes.test.ts
A	apps/executive-desk/api/closeout-state.ts
A	apps/executive-desk/api/delegation-queries.ts
A	apps/executive-desk/api/express-adapter.ts
A	apps/executive-desk/api/receipt-queries.ts
A	apps/executive-desk/api/risk-api.ts
A	apps/executive-desk/cadence/board.ts
A	apps/executive-desk/cadence/cadence-engine.ts
A	apps/executive-desk/cadence/daily.ts
A	apps/executive-desk/cadence/monthly.ts
A	apps/executive-desk/cadence/weekly.ts
A	apps/executive-desk/cli/command-router.ts
A	apps/executive-desk/cli/index.ts
A	apps/executive-desk/cli/types.ts
A	apps/executive-desk/config/executive-desk.config.ts
A	apps/executive-desk/db/__tests__/receipt-ledger.test.ts
A	apps/executive-desk/db/migrations/001-receipt-ledger.sql
A	apps/executive-desk/db/migrations/002-delegation-rules.sql
A	apps/executive-desk/db/setup.ts
A	apps/executive-desk/evidence/evidence-scanner.ts
A	apps/executive-desk/gates/GATE_4_AUTHORITY_INTEGRATION.md
A	apps/executive-desk/gates/GATE_5_RISK_GATE_INTEGRATION.md
A	apps/executive-desk/gates/GATE_6_API_ROUTES.md
A	apps/executive-desk/gates/GATE_7_FRONTEND_COMPONENTS.md
A	apps/executive-desk/gates/GATE_8_E2E_DEMO.md
A	apps/executive-desk/gates/GATE_PROXY_ACTION_IMPLEMENTATION.md
A	apps/executive-desk/gates/GATE_RECEIPT_PERSISTENCE.md
A	apps/executive-desk/government-readiness/DOE/DISCOVERY_MEETING_FRAMEWORK.md
A	apps/executive-desk/government-readiness/DOE/DOE_EXECUTIVE_INTRO_OUTBOUND_EMAIL_ONE_PAGER.md
A	apps/executive-desk/government-readiness/DOE/EXECUTIVE_INTRODUCTION_ONE_PAGER.md
A	apps/executive-desk/government-readiness/DOE/GOVERNMENT_CONTACT_LIST.md
A	apps/executive-desk/government-readiness/DOE/GOVERNMENT_EXECUTIVE_DESK_OVERVIEW.md
A	apps/executive-desk/government-readiness/DOE/OUTCOME_FIRST_MESSAGING.md
A	apps/executive-desk/government-readiness/README.md
A	apps/executive-desk/government-readiness/deployment-profiles/GOVERNMENT_DEPLOYMENT_BLUEPRINT_2026-07-14.md
A	apps/executive-desk/government-readiness/evidence/README.md
A	apps/executive-desk/government-readiness/executive-briefings/LINKEDIN_OUTREACH_PLAYBOOK_2026-07-14.md
A	apps/executive-desk/government-readiness/executive-intelligence/EXECUTIVE_INTELLIGENCE_BRIEF_DOCTRINE.md
A	apps/executive-desk/government-readiness/governance/EXECUTIVE_REVIEW_CHECKLIST_GOVERNMENT_POSTURE.md
A	apps/executive-desk/government-readiness/governance/GBP_CHIEF_OF_STAFF_BRIEF.md
A	apps/executive-desk/government-readiness/governance/GBP_OPERATING_RUNBOOK.md
A	apps/executive-desk/government-readiness/mission-outcomes/GOVERNMENT_OUTCOME_REFERENCE_LIBRARY_OUTLINE.md
A	apps/executive-desk/government-readiness/modernization/README.md
A	apps/executive-desk/government-readiness/pilot-packages/README.md
A	apps/executive-desk/gpt-integration.md
A	apps/executive-desk/mob/mob-review.ts
A	apps/executive-desk/openapi.yaml
A	apps/executive-desk/outcomes/outcome-status.ts
A	apps/executive-desk/package.json
A	apps/executive-desk/panels.md
A	apps/executive-desk/proxy/README.md
A	apps/executive-desk/proxy/__tests__/command-handler.test.ts
A	apps/executive-desk/proxy/command-handler.ts
A	apps/executive-desk/proxy/test-handler.ts
A	apps/executive-desk/public/app.js
A	apps/executive-desk/public/index.html
A	apps/executive-desk/public/styles.css
A	apps/executive-desk/readiness/government-readiness.ts
A	apps/executive-desk/reporting/markdown-reporter.ts
A	apps/executive-desk/reporting/receipt-writer.ts
A	apps/executive-desk/server.ts
A	apps/executive-desk/services/__tests__/authority-check.test.ts
A	apps/executive-desk/services/__tests__/risk-assessment.test.ts
A	apps/executive-desk/services/authority-check.ts
A	apps/executive-desk/services/closeout-state.ts
A	apps/executive-desk/services/delegation-rules.ts
A	apps/executive-desk/services/identity-graph-client.ts
A	apps/executive-desk/services/infrastructure-health-client.ts
A	apps/executive-desk/services/receipt-ledger-file.ts
A	apps/executive-desk/services/receipt-ledger-pg.ts
A	apps/executive-desk/services/receipt-ledger.ts
A	apps/executive-desk/services/risk-assessment.ts
A	apps/executive-desk/services/risk-gate.ts
A	apps/executive-desk/tsconfig.cli.json
M	apps/sentinel/src/audit/executionTrace.js
M	apps/sentinel/src/commands/dispatch.js
A	apps/sentinel/src/commands/retrieval/vaultRetrieveFixture.js
M	apps/sentinel/src/commands/sentinelOsHandlers.js
M	apps/sentinel/src/governance/policyEngine.js
A	apps/sentinel/src/integrations/retrieval/bhindiFixtureExecutor.js
A	apps/sentinel/src/integrations/retrieval/nexusFixtureRouter.js
A	apps/sentinel/src/integrations/retrieval/vaultFixtureAdapter.js
M	apps/sentinel/src/orchestration/taskTemplates.js
M	apps/sentinel/src/sovereign/sovereignBoot.js
M	apps/sentinel/src/sovereign/sovereignLicense.js
M	apps/sentinel/src/surface/nunncloud.js
M	apps/sentinel/src/telemetry/telemetryHarmonizer.js
A	apps/sentinel/src/whiteGlove/supportRequest.js
A	artifacts/sentinel-ai-package-fast.json
A	artifacts/sentinel-ai-package-full.json
A	broken-app.yaml
A	compose-expanded.yml
A	contract_reclamation-incubator
A	coverage/lcov-report/base.css
A	coverage/lcov-report/block-navigation.js
A	coverage/lcov-report/executive-desk/api/<define:import.meta>.html
A	coverage/lcov-report/executive-desk/api/__tests__/index.html
A	coverage/lcov-report/executive-desk/api/__tests__/routes.test.ts.html
A	coverage/lcov-report/executive-desk/api/delegation-queries.ts.html
A	coverage/lcov-report/executive-desk/api/express-adapter.ts.html
A	coverage/lcov-report/executive-desk/api/index.html
A	coverage/lcov-report/executive-desk/api/receipt-queries.ts.html
A	coverage/lcov-report/executive-desk/api/risk-api.ts.html
A	coverage/lcov-report/executive-desk/db/__tests__/index.html
A	coverage/lcov-report/executive-desk/db/__tests__/receipt-ledger.test.ts.html
A	coverage/lcov-report/executive-desk/db/index.html
A	coverage/lcov-report/executive-desk/db/setup.ts.html
A	coverage/lcov-report/executive-desk/index.html
A	coverage/lcov-report/executive-desk/proxy/__tests__/command-handler.test.ts.html
A	coverage/lcov-report/executive-desk/proxy/__tests__/index.html
A	coverage/lcov-report/executive-desk/proxy/command-handler.ts.html
A	coverage/lcov-report/executive-desk/proxy/index.html
A	coverage/lcov-report/executive-desk/proxy/test-handler.ts.html
A	coverage/lcov-report/executive-desk/public/app.js.html
A	coverage/lcov-report/executive-desk/public/index.html
A	coverage/lcov-report/executive-desk/server.ts.html
A	coverage/lcov-report/executive-desk/services/__tests__/authority-check.test.ts.html
A	coverage/lcov-report/executive-desk/services/__tests__/index.html
A	coverage/lcov-report/executive-desk/services/__tests__/risk-assessment.test.ts.html
A	coverage/lcov-report/executive-desk/services/authority-check.ts.html
A	coverage/lcov-report/executive-desk/services/delegation-rules.ts.html
A	coverage/lcov-report/executive-desk/services/identity-graph-client.ts.html
A	coverage/lcov-report/executive-desk/services/index.html
A	coverage/lcov-report/executive-desk/services/infrastructure-health-client.ts.html
A	coverage/lcov-report/executive-desk/services/receipt-ledger-file.ts.html
A	coverage/lcov-report/executive-desk/services/receipt-ledger-pg.ts.html
A	coverage/lcov-report/executive-desk/services/receipt-ledger.ts.html
A	coverage/lcov-report/executive-desk/services/risk-assessment.ts.html
A	coverage/lcov-report/executive-desk/services/risk-gate.ts.html
A	coverage/lcov-report/favicon.png
A	coverage/lcov-report/index.html
A	coverage/lcov-report/prettify.css
A	coverage/lcov-report/prettify.js
A	coverage/lcov-report/sort-arrow-sprite.png
A	coverage/lcov-report/sorter.js
A	coverage/lcov.info
A	coverage/tmp/coverage-21881-1783858619677-0.json
A	coverage/tmp/coverage-21882-1783858618020-0.json
A	coverage/tmp/coverage-21900-1783858619331-2.json
A	coverage/tmp/coverage-21900-1783858619346-1.json
A	coverage/tmp/coverage-21900-1783858619386-0.json
A	current-app.json
A	deploy/index.js
A	deploy/signing-proxy.zip
A	docker-compose.yml
A	docs/governance/ACTIVE_GATE_REVIEW_QUEUE_AND_SENDCOMM_ACCESS_RESULT_2026-07-06.md
A	docs/governance/API_CONTROL_EXECUTE_HARDENING_DECISION_PACKET_2026-07-06.md
A	docs/governance/APPROVED_RUNTIME_UPGRADE_INTRODUCTION_PACKET_2026-07-06.md
A	docs/governance/AUTHORITATIVE_GOVERNMENT_OUTCOME_INTAKE_WORKSHEET_2026-06-12.md
A	docs/governance/AUTHORITATIVE_GOVERNMENT_OUTCOME_INTAKE_WORKSHEET_REVIEW_RESULT_2026-06-12.md
A	docs/governance/AZURE_OWNERFI_PROOF_GREAT_HOLD_STATE_2026-07-03.md
A	docs/governance/AZURE_REACTIVATION_CHECK_RESULT_2026-07-03.md
A	docs/governance/CADENCE_CLOSEOUT_PLAN_2026-06-30.md
A	docs/GBP/assessments/CADENCE_INDEX_2026-06-30.md
A	docs/governance/CLARITY_MEMORY_LAYER_PARTNER_PORTAL_SPECIFICS_QUERY_MANIFEST_2026-06-17.md
A	docs/CLARITY_MEMORY_LAYER_PARTNER_PORTAL_SPECIFICS_QUERY_RESULT_2026-06-17.md
A	docs/governance/CORRECTED_SENTINEL_AI_COMMAND_ACCESS_VERBIAGE_REVIEW_RESULT_2026-06-17.md
A	docs/governance/CURRENT_SENTINEL_DEPLOYMENT_FOOTPRINT_EXECUTIVE_INTAKE_RECONCILIATION_2026-06-12.md
A	docs/GBP/assessments/CURRENT_WORKTREE_EVIDENCE_BASELINE_2026-07-05.md
A	docs/governance/CUSTOMER_DISCOVERY_INTAKE_AND_RISK_QUESTIONNAIRE_2026-07-03.md
A	docs/governance/CUSTOMER_DISCOVERY_INTAKE_AND_RISK_QUESTIONNAIRE_POPULATED_RESULT_2026-07-03.md
A	docs/governance/CUSTOMER_IMPLEMENTATION_SCOPE_AND_RISK_PACKET_2026-07-03.md
A	docs/governance/DAILY_EXECUTIVE_CADENCE_PLAN_2026-06-16_AND_2026-06-17.md
A	docs/GBP/doctrine/DOCUMENTATION_POLICY_GUARDRAIL.md
A	docs/governance/DOE_T2_CDT_001_VALIDATION_AND_RELEASE_CONTROL_REVIEW_2026-06-18.md
A	docs/governance/ED25519_KEY_MANAGEMENT_AND_COMPATIBILITY_REVIEW_2026-06-17.md
A	docs/governance/EXACT_READ_ONLY_CURRENT_SENTINEL_DEPLOYMENT_FOOTPRINT_DISCOVERY_MANIFEST_2026-06-13.md
A	docs/governance/EXACT_RELEASE_STAGING_MANIFEST_REVIEW_2026-06-15.md
A	docs/governance/EXACT_RELEASE_STAGING_MANIFEST_REVIEW_RESULT_2026-06-15.md
A	docs/governance/EXACT_SENTINEL_EXECUTIVE_ENVELOPE_COMMAND_CHANGE_REVIEW_2026-06-12.md
A	docs/governance/EXACT_SENTINEL_NEXUS_BHINDI_VAULT_READ_ONLY_POC_TEST_MANIFEST_2026-06-17.md
A	docs/governance/EXECUTION_TRACE_COMPLETENESS_REPAIR_IMPLEMENTATION_RESULT_2026-06-17.md
A	docs/governance/EXECUTION_TRACE_COMPLETENESS_REPAIR_PLAN_2026-06-17.md
A	docs/governance/EXECUTION_TRACE_DISPATCH_READ_ONLY_REVIEW_2026-06-16.md
A	docs/governance/EXECUTIVE_BOARD_2026-06-11.md
A	docs/governance/EXECUTIVE_BOARD_2026-06-19.md
A	docs/EXECUTIVE_BOARD_2026-07-01.md
A	docs/EXECUTIVE_BOARD_ADDRESS_2026-07-01.md
A	docs/GBP/assessments/EXECUTIVE_BOARD_JULY_05_ADDENDUM_2026-07-05.md
A	docs/GBP/assessments/EXECUTIVE_BOARD_JULY_STARTING_POINT_2026-06-30.md
A	docs/GBP/assessments/EXECUTIVE_BOARD_MOB_REFRESHED_2026-06-15.md
A	docs/governance/EXECUTIVE_BOARD_REFRESHED_FOR_PROCESSING_2026-06-13.md
A	docs/governance/EXECUTIVE_BOARD_SUMMARY_UPDATE_2026-06-12.md
A	docs/governance/EXECUTIVE_DESK_GPT_RUNTIME_UPGRADE_GUIDED_SUPPORT_SCRIPT_2026-07-06.md
A	docs/GBP/doctrine/EXECUTIVE_DESK_GPT_RUNTIME_UPGRADE_HANDOFF_AND_PROMPT_PACK_2026-07-06.md
A	docs/governance/EXECUTIVE_DESK_GPT_RUNTIME_UPGRADE_USER_FLOW_2026-07-06.md
A	docs/governance/EXECUTIVE_DESK_RUNTIME_RESTORE_EXECUTION_APPROVAL_RESULT_2026-06-19.md
A	docs/governance/EXECUTIVE_DESK_RUNTIME_RESTORE_EXECUTION_PREFLIGHT_RESULT_2026-06-20.md
A	docs/governance/EXECUTIVE_DESK_V1.md
A	docs/governance/EXECUTIVE_DRIFT_FOCUS_REPORT_2026-06-18.md
A	docs/governance/EXECUTIVE_PRIORITY_EVIDENCE_AND_APPROVAL_MATRIX_2026-06-18.md
A	docs/governance/EXECUTIVE_SNAPSHOT_2026-06-11.md
A	docs/governance/EXECUTIVE_SNAPSHOT_2026-06-13.md
A	docs/governance/EXECUTIVE_SNAPSHOT_2026-06-17.md
A	docs/governance/FIRST_GOVERNMENT_OUTCOME_INTAKE_INPUT_PROCESSING_RESULT_2026-06-12.md
A	docs/FIRST_GOVERNMENT_OUTCOME_INTAKE_SCOPE_AUTHORIZATION_RESULT_2026-06-12.md
A	docs/governance/FIXTURE_ONLY_AUTHORITY_RECEIPT_PROOF_IMPLEMENTATION_MANIFEST_2026-06-19.md
A	docs/governance/FIXTURE_ONLY_AUTHORITY_RECEIPT_PROOF_IMPLEMENTATION_MANIFEST_REVIEW_RESULT_2026-06-19.md
A	docs/governance/FIXTURE_ONLY_SENTINEL_NEXUS_BHINDI_VAULT_POC_IMPLEMENTATION_RESULT_2026-06-17.md
A	docs/governance/FRIDAY_DAILY_EXECUTIVE_CADENCE_2026-06-19.md
A	docs/governance/FRIDAY_DAILY_EXECUTIVE_CADENCE_CLOSEOUT_2026-06-12.md
A	docs/governance/FRIDAY_WEEKLY_EXECUTIVE_CADENCE_2026-06-19.md
A	docs/governance/FRIDAY_WEEKLY_EXECUTIVE_CADENCE_CLOSEOUT_2026-06-12.md
A	docs/GBP/AI-Docking-and-Control-Surface.md
A	docs/GBP/Deployment-Profile-State.md
A	docs/GBP/Deployment-Profile-Template.md
A	docs/GBP/GBP-Alignment-Working-Plan.md
A	docs/GBP/Government-Deployment-Blueprint.md
A	docs/GBP/Mission-Readiness-Index.md
A	docs/GBP/Phase-3-Outcome-Engines.md
A	docs/GBP/Phase-4-Deployment-Profiles.md
A	docs/GBP/Phase-4-Deployment-Profiles.release-draft.md
A	docs/governance/GOVERNANCE_COMPLIANCE_EVIDENCE_INDEX_2026-06-14.md
A	docs/governance/GOVERNANCE_COMPLIANCE_SETTLEMENT_PACKET_2026-06-14.md
A	docs/governance/GOVERNMENT_OUTCOME_OPERATING_SYSTEM_REVIEW_PACKET_2026-06-12.md
A	docs/governance/GOVERNMENT_OUTCOME_OWNER_ADDITIONS_RESULT_2026-06-12.md
A	docs/governance/H1_GOVERNANCE_CLOSEOUT_AND_OWNER_DECISION_2026-06-30.md
A	docs/governance/H1_OWNERFI_PROOF_HEALTH_VALIDATION_RESULT_2026-06-30.md
A	docs/GBP/assessments/JULY_01_CADENCE_INDEX_2026-07-01.md
A	docs/GBP/doctrine/JULY_01_DAILY_EXECUTIVE_CADENCE_2026-07-01.md
A	docs/GBP/assessments/JULY_01_WEEKLY_EXECUTIVE_CADENCE_START_2026-07-01.md
A	docs/governance/JULY_03_CADENCE_INDEX_2026-07-03.md
A	docs/governance/JULY_03_DAILY_EXECUTIVE_CADENCE_2026-07-03.md
A	docs/governance/JULY_03_EXECUTIVE_TEMPLATE_PACKET_PROCESSING_RESULT_2026-07-03.md
A	docs/GBP/doctrine/JULY_03_MASTER_OPERATING_BLUEPRINT_OVERLAY_2026-07-03.md
A	docs/governance/JULY_03_NEXT_ACTIONS_HOLDING_RESULT_2026-07-03.md
A	docs/GBP/assessments/JULY_03_OPERATING_SEQUENCE_COMPLETION_RESULT_2026-07-03.md
A	docs/GBP/assessments/JULY_03_WEEKLY_CADENCE_CLOSEOUT_2026-07-03.md
A	docs/governance/JULY_04_HOLIDAY_SHUTDOWN_HOLD_2026-07-04.md
A	docs/GBP/assessments/JULY_05_CADENCE_INDEX_2026-07-05.md
A	docs/GBP/assessments/JULY_05_DAILY_AND_WEEKLY_CADENCE_CLOSEOUT_2026-07-05.md
A	docs/GBP/assessments/JULY_05_EXECUTIVE_MOB_BOARD_COMPARISON_2026-07-05.md
A	docs/GBP/assessments/JULY_05_MOB_DRIFT_REPORT_2026-07-05.md
A	docs/GBP/doctrine/JULY_MONTHLY_OPERATING_BRIEF_2026-07-01.md
A	docs/GBP/assessments/JULY_MONTHLY_OPERATING_CADENCE_START_2026-07-01.md
A	docs/GBP/assessments/JULY_PRIORITY_QUEUE_DEEP_DIVE_DECISION_PACKETS_2026-06-30.md
A	docs/GBP/assessments/JULY_PRIORITY_QUEUE_READINESS_PACKET_2026-06-30.md
A	docs/GBP/assessments/JULY_PRIORITY_QUEUE_READINESS_PROCESSING_RESULT_2026-06-30.md
A	docs/governance/JULY_QUEUE_ORDER_AND_FIRST_ACTION_APPROVAL_RESULT_2026-06-30.md
A	docs/governance/JUNE_30_CURRENT_TRUTH_REESTABLISHMENT_2026-06-30.md
A	docs/governance/JUNE_30_DAILY_CLOSEOUT_AND_TOMORROW_START_2026-06-30.md
A	docs/GBP/doctrine/JUNE_CLOSEOUT_AND_RUNTIME_ALIGNMENT_SCAN_2026-07-06.md
A	docs/governance/LIVE_PROOF_HEALTH_RETRY_RESULT_2026-06-30.md
A	docs/governance/LIVE_PROOF_HEALTH_VERIFICATION_RESULT_2026-06-30.md
A	docs/governance/LOCAL_SENTINEL_AI_GOVERNANCE_CONTINUITY_RESULT_2026-07-03.md
A	docs/governance/LOCAL_SENTINEL_AI_NEXT_STEPS_PROCESSING_AND_QUALITY_EVALUATION_2026-07-03.md
A	docs/governance/LOCAL_SENTINEL_DOCKING_ASSET_CLASSIFICATION_RESULT_2026-07-03.md
A	docs/governance/LOCAL_SENTINEL_LIGHT_QUANTITATIVE_NEXT_STEPS_RESULT_2026-07-03.md
A	docs/governance/MAIN_ENTITY_INQUIRY_PORTAL_ACTIVATION_REVIEW_2026-06-18.md
A	docs/governance/MAIN_ENTITY_INQUIRY_PORTAL_ACTIVATION_REVIEW_RESULT_2026-06-18.md
A	docs/governance/MAIN_ENTITY_INQUIRY_PORTAL_REVIEW_RESULT_2026-06-15.md
A	docs/governance/MINIMUM_FIRST_GOVERNMENT_OUTCOME_IDENTITY_AND_OUTCOME_PROCESSING_RESULT_2026-06-18.md
A	docs/governance/MISSION_CONTROL_COCKPIT_CHECKIN_2026-07-02.md
A	docs/governance/MISSION_CONTROL_ROUTE_CLASSIFICATION_PUBLIC_PROTECTED_INTERNAL_HELD_2026-07-06.md
A	docs/governance/MISSION_CONTROL_SECURITY_AND_PLATFORM_REVIEW_GATE_2026-07-06.md
A	docs/governance/MISSION_CONTROL_SECURITY_AND_PLATFORM_REVIEW_RESULT_2026-07-06.md
A	docs/GBP/assessments/MOB_COMPLETION_QUEUE_REFRESH_OVERLAY_2026-07-05.md
A	docs/GBP/assessments/MOB_FIRST_MOVEMENT_PACKET_GATE_8_REGRESSION_PROOF_2026-07-05.md
A	docs/GBP/assessments/MOB_MOVEMENT_MAP_2026-07-05.md
A	docs/GBP/assessments/MOB_MOVEMENT_QUEUE_PROCESSING_RESULT_2026-07-05.md
A	docs/GBP/assessments/MOB_NEXT_STEPS_TEMPLATE_2026-07-05.md
A	docs/GBP/assessments/MOB_VERIFICATION_MATRIX_ADDENDUM_2026-07-05.md
A	docs/GBP/assessments/MONDAY_DAILY_EXECUTIVE_CADENCE_2026-06-15.md
A	docs/governance/MONDAY_EXECUTIVE_ROUTING_UPDATE_2026-06-15.md
A	docs/governance/MONDAY_INTERNAL_SUPPORT_DISBURSEMENT_PACKET_2026-06-15.md
A	docs/GBP/assessments/MONDAY_WEEKLY_EXECUTIVE_CADENCE_START_2026-06-15.md
A	docs/GBP/assessments/NEXT_RUNTIME_UPGRADE_CANDIDATE_SELECTION_2026-07-06.md
M	docs/GBP/overlays/NEXT_STEPS.md
A	docs/governance/NEXT_STEPS_1_4_PROCESSING_RESULT_2026-07-03.md
A	docs/governance/NEXT_STEPS_DEEP_DIVE_SUMMARIES_2026-07-03.md
A	docs/governance/NEXT_STEPS_GATES_1_4_PROCESSING_RESULT_2026-07-03.md
A	docs/governance/NOTION_BRIEF_JUNE_SENTINELOS_PROGRESS_UPDATE_2026-06-18.md
A	docs/NUMBERED_TODO_PROCESSING_RESULT_2026-06-19.md
A	docs/governance/NUNNCORPORATION_PUBLIC_FRONT_DOOR_VERIFICATION_RESULT_2026-07-03.md
A	docs/governance/NUNNCORP_SENTINELOS_ISSUE_SUPPORT_TRACKER_2026-06-14.md
A	docs/GBP/doctrine/NUNN_CORPORATION_MASTER_OPERATING_BINDER_2026-06-15.md
A	docs/governance/OLDER_REPO_DIFF_REVIEW_RESULT_2026-06-11.md
A	docs/governance/OLDER_REPO_SEPARATED_RESOLUTION_REQUIREMENTS_2026-06-11.md
A	docs/GBP/doctrine/OPEN_WORKTREE_ENTRY_TRACKER_2026-06-18.md
A	docs/governance/OPERATING_DIRECTIVE_LOCKED_ALIGNMENT_2026-07-03.md
A	docs/governance/OWNERFI_AI_FINANCIAL_MANAGEMENT_CHECKSUM_MANIFEST_2026-07-03.json
A	docs/governance/OWNERFI_AI_FINANCIAL_MANAGEMENT_MIGRATION_MANIFEST_2026-07-03.md
A	docs/governance/OWNERFI_AI_FINANCIAL_MANAGEMENT_MODULE_ARCHITECTURE_AND_MANIFEST_RESULT_2026-07-03.md
A	docs/governance/OWNERFI_AI_FINANCIAL_MANAGEMENT_READ_ONLY_INVENTORY_2026-07-03.md
A	docs/GBP/assessments/OWNERFI_INTERNAL_FINANCIAL_DOMAIN_AND_MOB_ALIGNMENT_DECISION_2026-07-03.md
A	docs/governance/OWNERFI_PROOF_HEALTH_NETWORK_VERIFICATION_PREP_2026-07-03.md
A	docs/governance/OWNERFI_PROOF_HEALTH_RESTORED_RESULT_2026-07-03.md
A	docs/governance/OWNERFI_PROOF_HEALTH_VERIFICATION_RESULT_2026-07-03.md
A	docs/governance/OWNER_APPROVAL_RUNTIME_UPGRADE_INTRODUCTION_2026-07-06.md
A	docs/governance/OWNER_DECISION_EXTERNAL_SHARE_REVENUE_APPROVAL_RESULT_2026-07-03.md
A	docs/governance/OWNER_DECISION_EXTERNAL_SHARE_REVENUE_PACKET_2026-07-03.md
A	docs/governance/OWNER_REVIEW_RUNTIME_UPGRADE_PACKET_SINTENEX_RT_004_FOR_INTRODUCTION_2026-07-06.md
A	docs/governance/OWNER_RUNTIME_UPGRADE_SELECTION_RESULT_2026-07-06.md
A	docs/governance/OWNER_SELECTED_RUNTIME_UPGRADE_INTRODUCTION_CHANNEL_2026-07-06.md
A	docs/PARTNER_PORTAL_REPOSITORY_DISCOVERY_AND_CONTROL_DIRECTION_2026-06-17.md
A	docs/GBP/assessments/PERSISTENCE_READINESS_MANIFEST_2026-07-05.md
A	docs/governance/PHASED_OPERATIONAL_LANE_AND_OWNER_DECISION_PLAN_2026-07-03.md
A	docs/governance/PHASE_1_FQDN_STABILITY_DIAGNOSTIC_RESULT_2026-07-03.md
A	docs/governance/POSTGRESQL_MEMORY_LAYER_LIVE_VERIFICATION_RECONCILIATION_2026-06-12.md
A	docs/governance/PR7_CI_ONLY_WORKFLOW_FIX_EXECUTION_RESULT_2026-06-19.md
A	docs/governance/PR7_CONNECTOR_MINOR_CHANGE_IMPLEMENTATION_REVIEW_RESULT_2026-06-20.md
A	docs/governance/PR7_CONNECTOR_MINOR_CHANGE_PATCH_SCOPE_APPROVAL_RESULT_2026-06-20.md
A	docs/governance/PR7_GPT_ACTION_CONNECTOR_DIRECTION_APPROVAL_RESULT_2026-06-19.md
A	docs/governance/PR7_GPT_ACTION_CONNECTOR_MINOR_CHANGES_REVIEW_RESULT_2026-06-19.md
A	docs/governance/PR7_GPT_ACTION_CONNECTOR_MINOR_CHANGE_IMPLEMENTATION_PACKET_2026-06-19.md
A	docs/governance/PR7_GPT_ACTION_CONNECTOR_REVIEW_PROCESSING_RESULT_2026-06-19.md
M	docs/governance/README.md
A	docs/governance/READ_ONLY_CURRENT_SENTINEL_DEPLOYMENT_FOOTPRINT_DISCOVERY_RESULT_2026-06-13.md
A	docs/READ_ONLY_CURRENT_SENTINEL_DEPLOYMENT_FOOTPRINT_DISCOVERY_SCOPE_REVIEW_2026-06-13.md
A	docs/governance/RECORD_CLASSIFICATION_DIRECTIVE_RECONCILIATION_2026-06-12.md
A	docs/REFRESHED_EXACT_RELEASE_STAGING_MANIFEST_REVIEW_2026-06-18.md
A	docs/governance/REFRESHED_EXACT_RELEASE_STAGING_MANIFEST_REVIEW_RESULT_2026-06-18.md
A	docs/governance/REFRESHED_EXACT_REVIEW_MANIFEST_2026-06-17.md
A	docs/governance/REFRESHED_RELEASE_BLOCKER_SELECTION_RESULT_2026-06-18.md
A	docs/RELEASE_BLOCKER_SELECTION_RESULT_2026-06-15.md
A	docs/governance/REVENUE_READY_HELD_IMPLEMENTATION_RESULT_2026-07-03.md
A	docs/governance/RUNTIME_UPGRADE_CANDIDATE_RELEASE_PACKET_WHITE_GLOVE_2026-07-06.md
A	docs/governance/RUNTIME_UPGRADE_CANDIDATE_SELECTION_REVIEW_RT_004_2026-07-06.md
A	docs/GBP/assessments/RUNTIME_UPGRADE_GPT_SUPPORT_CADENCE_RETURN_2026-07-06.md
A	docs/governance/RUNTIME_UPGRADE_INTRODUCTION_COPY_AND_CHANNEL_PACKET_2026-07-06.md
A	docs/governance/RUNTIME_UPGRADE_PACKET_SINTENEX_RT_001_OWNERFI_ROUTE_HEALTH_2026-07-06.md
A	docs/governance/RUNTIME_UPGRADE_PACKET_SINTENEX_RT_003_RECEIPT_AUDIT_DECISION_SURFACE_2026-07-06.md
A	docs/governance/RUNTIME_UPGRADE_PACKET_SINTENEX_RT_004_MISSION_CONTROL_CONTROL_PLANE_2026-07-06.md
A	docs/governance/RUNTIME_UPGRADE_PACKET_SINTENEX_RT_005_GOVERNANCE_PRIMITIVES_2026-07-06.md
A	docs/governance/SATURDAY_DAILY_EXECUTIVE_CADENCE_2026-06-13.md
A	docs/governance/SENDCOMM_CONCEPT_CLASSIFICATION_AGAINST_SENTINELOS_BOUNDARIES_2026-07-06.md
A	docs/governance/SENDCOMM_GITHUB_SOURCE_INVENTORY_2026-07-06.md
A	docs/governance/SENDCOMM_LINEAGE_PRESERVATION_PACKET_NO_FILE_MOVEMENT_2026-07-06.md
A	docs/governance/SENDCOMM_SENTINELOS_MIGRATION_REVIEW_RESULT_2026-07-03.md
A	docs/governance/SENTINELOS_ENTITY_INQUIRY_PORTAL_RECONCILIATION_2026-06-12.md
A	docs/governance/SENTINELOS_OPERATIONAL_GOVERNANCE_WORKFLOW_AND_VR_DEPARTMENT_ESTABLISHMENT_2026-07-06.md
A	docs/governance/SENTINELOS_STATE_STEWARDSHIP_MODEL_2026-06-20.md
A	docs/governance/SENTINELOS_VIRTUAL_REVIEW_DEPARTMENT_CHARTER_2026-07-06.md
A	docs/governance/SENTINEL_AI_CHANGE_HOLD_DECLARATION_2026-06-11.md
A	docs/governance/SENTINEL_AI_COMMAND_ACCESS_NAMING_AND_VERBIAGE_SCAN_2026-06-17.md
A	docs/GBP/assessments/SENTINEL_AI_JUNE_CLOSEOUT_READY_ON_HOLD_WORKFLOW_2026-06-30.md
A	docs/governance/SENTINEL_AI_RECORD_CLASSIFICATION_AND_ACCESS_SEGREGATION_POLICY_2026-06-12.md
A	docs/governance/SENTINEL_AUTHORITY_RECEIPT_PROOF_PACKET_2026-06-19.md
A	docs/governance/SENTINEL_AUTHORITY_RECEIPT_PROOF_PACKET_APPROVAL_RESULT_2026-06-19.md
A	docs/governance/SENTINEL_EXECUTIVE_OPERATING_TEMPLATE_2026-06-11.md
A	docs/governance/SENTINEL_EXECUTIVE_OPERATING_TEMPLATE_2026-06-19.md
A	docs/GBP/assessments/SENTINEL_EXECUTIVE_OPERATING_TEMPLATE_2026-07-01.md
A	docs/governance/SENTINEL_EXECUTIVE_OPERATING_TEMPLATE_2026-07-03.md
A	docs/GBP/assessments/SENTINEL_EXECUTIVE_OPERATING_TEMPLATE_JULY_05_ADDENDUM_2026-07-05.md
A	docs/GBP/assessments/SENTINEL_EXECUTIVE_OPERATING_TEMPLATE_JULY_STARTING_POINT_2026-06-30.md
A	docs/GBP/assessments/SENTINEL_EXECUTIVE_OPERATING_TEMPLATE_MOB_REFRESHED_2026-06-15.md
A	docs/SENTINEL_EXECUTIVE_OPERATING_TEMPLATE_REFRESHED_2026-06-12.md
A	docs/governance/SENTINEL_EXECUTIVE_OPERATING_TEMPLATE_REFRESHED_2026-06-15.md
A	docs/governance/SENTINEL_EXECUTIVE_OPERATING_TEMPLATE_REFRESHED_FOR_PROCESSING_2026-06-13.md
A	docs/governance/SENTINEL_MANAGED_REPOSITORY_EVIDENCE_AND_CLASSIFICATION_2026-06-11.md
A	docs/governance/SENTINEL_MANAGED_REPOSITORY_EVIDENCE_AND_CLASSIFICATION_REVIEW_RESULT_2026-06-11.md
A	docs/governance/SENTINEL_NEXUS_BHINDI_VAULT_READ_ONLY_POC_TEST_PLAN_2026-06-17.md
A	docs/governance/SENTINEL_RECOMMENDATIONS_GOVERNANCE_PASS_AND_EXECUTION_MAP_2026-07-03.md
A	docs/SENTINEL_RELEASE_V1_GOVERNANCE_PACKET_REVIEW_RESULT_2026-06-15.md
A	docs/governance/SENTINEL_STEERING_DOCUMENT_CANCELLATION_AND_AUTHORITY_LAYER_DIRECTION_2026-06-18.md
A	docs/governance/SINTENEX_RUNTIME_ELIGIBILITY_ALERT_QUEUE_2026-07-06.md
A	docs/governance/SINTENEX_RUNTIME_UPGRADE_READINESS_CONTROL_RESULT_2026-07-06.md
A	docs/governance/SINTENEX_TIMED_EVENT_AND_COMMERCIAL_ROUTING_BOUNDARY_2026-07-03.md
A	docs/governance/SINTENEX_TIMED_EVENT_AND_COMMERCIAL_ROUTING_BOUNDARY_REVIEW_RESULT_2026-07-03.md
A	docs/governance/SOVEREIGN_BUYER_PACKAGE_INTAKE_RECONCILIATION_2026-06-11.md
A	docs/governance/SOVEREIGN_KEY_MANAGEMENT_AND_LICENSE_LIFECYCLE_CONTROL_PLAN_2026-06-17.md
A	docs/SOVEREIGN_KEY_MANAGEMENT_AND_LICENSE_LIFECYCLE_CONTROL_PLAN_APPROVAL_RESULT_2026-06-17.md
A	docs/SOVEREIGN_KEY_MANAGEMENT_AND_LICENSE_LIFECYCLE_CONTROL_PLAN_REVIEW_RESULT_2026-06-17.md
A	docs/governance/SOVEREIGN_KEY_MANAGEMENT_IMPLEMENTATION_MANIFEST_2026-06-17.md
A	docs/governance/SOVEREIGN_LIGHT_MODE_APPROVAL_PACKET_2026-06-11.md
A	docs/governance/SOVEREIGN_LIGHT_MODE_APPROVAL_PROCESSING_RESULT_2026-06-16.md
A	docs/governance/SOVEREIGN_READINESS_SCORECARD_2026-06-11.md
A	docs/governance/SOVEREIGN_SECURITY_AND_GOVERNANCE_OVERVIEW_DRAFT_2026-06-11.md
A	docs/GBP/doctrine/SP1_LOW_LATENCY_PROOF_PIPELINE_MOCK_OPTIMIZATION_PACKET_2026-06-30.md
A	docs/governance/STRIPE_CHECKOUT_CONFIGURATION_APPROVAL_PACKET_2026-07-03.md
A	docs/governance/STRIPE_NON_PRODUCTION_CONFIGURATION_EVIDENCE_PLAN_2026-07-03.md
A	docs/governance/SUNDAY_DAILY_EXECUTIVE_CADENCE_CLOSEOUT_2026-06-14.md
A	docs/SUNDAY_WEEKLY_EXECUTIVE_CADENCE_CLOSEOUT_2026-06-14.md
M	docs/governance/SYSTEM_POSITIONING.md
A	docs/GBP/assessments/TASK_TEMPLATE_CHECK_FAILURE_REVIEW_2026-06-15.md
A	docs/GBP/assessments/THURSDAY_DAILY_EXECUTIVE_CADENCE_2026-06-18.md
A	docs/governance/THURSDAY_DAILY_EXECUTIVE_CADENCE_CLOSEOUT_2026-06-18.md
A	docs/governance/TIER_TRIAL_AUTO_REVERT_POLICY_2026-07-06.md
A	docs/governance/TILDA_ORCHESTRATION_SUPPORT_COMMAND_PACKET_2026-06-14.md
A	docs/TILDA_ORCHESTRATION_SUPPORT_COMMAND_PACKET_REVIEW_RESULT_2026-06-14.md
A	docs/governance/TILDA_SENTINELOS_SUPPORT_CONTRACT_REVIEW_RESULT_2026-06-15.md
A	docs/TILDA_SENTINELOS_SUPPORT_LANE_PROCESSING_RESULT_2026-06-12.md
A	docs/governance/TILDA_SUPPORT_REQUEST_ANSWER_AND_ROUTING_MATRIX_2026-06-14.md
A	docs/governance/TUESDAY_EXECUTIVE_CADENCE_CLOSEOUT_2026-06-16.md
A	docs/governance/VR_0001_MISSION_CONTROL_SECURITY_PLATFORM_RECOMMENDATIONS_PROCESSING_RESULT_2026-07-06.md
A	docs/governance/VR_0001_MISSION_CONTROL_SECURITY_PLATFORM_REVIEW_JOB_2026-07-06.md
A	docs/governance/WEDNESDAY_EXECUTIVE_CADENCE_ACTIVATION_2026-06-17.md
A	docs/governance/WEEKLY_AND_MONTH_END_CLOSEOUT_2026-06-30.md
A	docs/governance/WHITE_GLOVE_INPUT_ORIENTED_SUPPORT_REQUEST_IMPLEMENTATION_2026-07-03.md
A	docs/governance/WHITE_GLOVE_SENTINEL_AI_SUPPORT_ADOPTION_RESULT_2026-07-03.md
A	docs/executive-desk-gpt/README.md
A	docs/executive-desk-gpt/README.pdf
A	docs/executive-desk-gpt/integration-status-2026-06-30.md
A	docs/executive-desk-gpt/phase-2-safe-read-only-command-gate-2026-07-01.md
A	docs/executive-desk-gpt/the-executive-desk-instructions.md
A	docs/executive-desk-gpt/the-executive-desk-instructions.pdf
A	docs/executive-desk-gpt/the-executive-desk-no-actions-instructions.md
A	docs/executive-desk-gpt/the-executive-desk-openapi.yaml
A	docs/executive-desk-gpt/tunnel-refresh-result-2026-07-01.md
A	docs/executive-desk/board/2026-07.md
A	docs/executive-desk/daily/2026-07-15.md
A	docs/executive-desk/evidence/2026-07-15-evidence-index.json
A	docs/executive-desk/evidence/2026-07-15-evidence-summary.md
A	docs/executive-desk/government-readiness/2026-07-15.md
A	docs/executive-desk/mob/2026-07-15.md
A	docs/executive-desk/mob/alignment-profile.json
A	docs/executive-desk/monthly/2026-07.md
A	docs/executive-desk/outcomes/2026-07-15.md
A	docs/executive-desk/outcomes/verification-profile.json
A	docs/executive-desk/receipts/2026-07-15-governed-build-completion-receipt.json
A	docs/executive-desk/receipts/2026-07-15T07-13-38.552Z-help.json
A	docs/executive-desk/receipts/2026-07-15T07-14-07.079Z-health.json
A	docs/executive-desk/receipts/2026-07-15T07-14-46.297Z-executive-daily.json
A	docs/executive-desk/receipts/2026-07-15T07-14-58.393Z-executive-weekly.json
A	docs/executive-desk/receipts/2026-07-15T07-15-03.154Z-executive-monthly.json
A	docs/executive-desk/receipts/2026-07-15T07-15-47.510Z-executive-board.json
A	docs/executive-desk/receipts/2026-07-15T07-16-04.905Z-government-readiness.json
A	docs/executive-desk/receipts/2026-07-15T07-16-10.317Z-mob-review.json
A	docs/executive-desk/receipts/2026-07-15T07-16-18.989Z-evidence-scan.json
A	docs/executive-desk/receipts/2026-07-15T07-16-50.883Z-outcome-status.json
A	docs/executive-desk/receipts/2026-07-15T07-37-27.376Z-mob-review.json
A	docs/executive-desk/receipts/2026-07-15T07-37-32.333Z-outcome-status.json
A	docs/executive-desk/receipts/2026-07-15T07-38-45.672Z-outcome-status.json
A	docs/executive-desk/receipts/2026-07-15T07-38-49.641Z-executive-weekly.json
A	docs/executive-desk/weekly/2026-W29.md
A	docs/releases/## Nunn Corporation Design Hierarchy.md
A	docs/releases/executive-desk/v1.0.0-gate8.md
A	docs/sovereign/SOVEREIGN_AIR_GAPPED_LICENSE_OFFER_DRAFT_2026-07-02.md
M	docs/sovereign/SOVEREIGN_ATTORNEY_BRIEF.md
A	docs/sovereign/SOVEREIGN_COLLATERAL_REWRITE_REVIEW_INDEX_2026-07-02.md
A	docs/sovereign/SOVEREIGN_MANAGED_PARTNERSHIP_SUPPORT_CONTINUITY_DRAFT_2026-07-02.md
A	docs/sovereign/SOVEREIGN_MANAGED_PARTNERSHIP_SUPPORT_CONTINUITY_REVIEW_RESULT_2026-07-02.md
A	docs/sovereign/SOVEREIGN_SUPPORT_CONTINUITY_INTAKE_CHECKLIST_2026-07-02.md
M	docs/sovereign/SOVEREIGN_TIER.md
A	fixtures/retrieval/nav-tasks.logs.json
A	governance/README.md
A	governance/constitution/NUNN_CORPORATION_CONSTITUTION.md
A	governance/sentinel-platform/SENTINELOS_EXECUTIVE_CONSTITUTION.md
A	lambda/signing-proxy.js
A	lambda/test-proxy.js
A	ops-closeout/2026-06-20/00-executive-closeout.md
A	ops-closeout/2026-06-20/01-enterprise-scorecard.md
A	ops-closeout/2026-06-20/02-daily-cadence.md
A	ops-closeout/2026-06-20/03-weekly-cadence.md
A	ops-closeout/2026-06-20/04-monthly-closeout.md
A	ops-closeout/2026-06-20/05-mob-alignment.md
A	ops-closeout/2026-06-20/06-board-template.md
A	ops-closeout/2026-06-20/07-evidence-ledger.md
A	ops/command-envelopes/sovereign-light-mode-approval-review-2026-06-11.json
M	package.json
M	pnpm-lock.yaml
A	scripts/check-deployment-footprint-discovery-scope.js
A	scripts/check-entity-inquiry-portal.js
A	scripts/check-execution-trace-completeness.js
A	scripts/check-executive-desk-e2e-demo.js
A	scripts/check-executive-desk-frontend.js
A	scripts/check-government-outcome-intake-worksheet.js
A	scripts/check-government-outcomes-surface.js
A	scripts/check-light-quantitative-nextsteps.js
M	scripts/check-mission-control-surface.js
A	scripts/check-ownerfi-proof-health-receipt.js
A	scripts/check-record-classification-directive.js
A	scripts/check-revenue-readiness-held.js
A	scripts/check-saturday-executive-cadence.js
A	scripts/check-sentinel-nexus-bhindi-vault-read-only-poc.js
A	scripts/check-sovereign-license.js
M	scripts/check-task-templates.js
A	scripts/check-white-glove-support-request.js
A	scripts/classify-sentinel-assets.js
A	scripts/executive-desk.ps1
A	scripts/generate-sovereign-keypair.js
M	scripts/generate-sovereign-license.js
A	scripts/sentinel-ai-package.js
A	scripts/sentinel.ps1
A	scripts/sign-request.js
A	scripts/verify-manifest-checksums.js
```

## Diff Stat
```
.data/closeout-state.json                          |    205 +
 .vscode/SentinelOS-NON-DEMO.code-workspace         |      8 +
 .vscode/extensions.json                            |      5 +
 DoctorModeRuntimeRestoreSupportPacket.json         |     53 +
 SENTINEL-RELEASE-v1.md                             |    103 +
 activity-full.json                                 | 267919 ++++++++++++++++++
 activity.json                                      |  38682 +++
 apps/api/public/entity-inquiry-portal.html         |     88 +
 apps/api/public/government-outcomes.html           |    103 +
 apps/api/public/mission-control.html               |     17 +-
 apps/api/server.js                                 |     77 +-
 apps/executive-desk/.env.example                   |     36 +
 apps/executive-desk/EXECUTIVE_DESK_V1_ROADMAP.md   |    234 +
 apps/executive-desk/GATE_3_COMPLETE.md             |    146 +
 .../GATE_4_AUTHORITY_INTEGRATION_COMPLETE.md       |    227 +
 .../GATE_5_RISK_GATE_INTEGRATION_COMPLETE.md       |    203 +
 apps/executive-desk/GATE_6_API_ROUTES_COMPLETE.md  |    502 +
 ..._6_API_ROUTES_VERIFICATION_RESULT_2026-07-03.md |     68 +
 apps/executive-desk/GATE_6_COMPLETION_SUMMARY.md   |    295 +
 ...ND_COMPONENTS_VERIFICATION_RESULT_2026-07-03.md |    124 +
 ...TE_8_E2E_DEMO_VERIFICATION_RESULT_2026-07-05.md |     97 +
 ...OVERNMENT_READINESS_DAILY_CADENCE_2026-07-14.md |     75 +
 apps/executive-desk/INTEGRATION_CHECKLIST.md       |    117 +
 .../PROXY_IMPLEMENTATION_COMPLETE.md               |    195 +
 apps/executive-desk/README.md                      |    146 +
 .../RECEIPT_PERSISTENCE_IMPLEMENTATION.md          |    276 +
 ...INEL_AI_WORK_PACKET_DOE_EXECUTIVE_ASSESSMENT.md |    169 +
 apps/executive-desk/api/__tests__/routes.test.ts   |    656 +
 apps/executive-desk/api/closeout-state.ts          |    121 +
 apps/executive-desk/api/delegation-queries.ts      |    161 +
 apps/executive-desk/api/express-adapter.ts         |   1105 +
 apps/executive-desk/api/receipt-queries.ts         |    395 +
 apps/executive-desk/api/risk-api.ts                |    242 +
 apps/executive-desk/cadence/board.ts               |     85 +
 apps/executive-desk/cadence/cadence-engine.ts      |    157 +
 apps/executive-desk/cadence/daily.ts               |    105 +
 apps/executive-desk/cadence/monthly.ts             |     67 +
 apps/executive-desk/cadence/weekly.ts              |    104 +
 apps/executive-desk/cli/command-router.ts          |    136 +
 apps/executive-desk/cli/index.ts                   |     83 +
 apps/executive-desk/cli/types.ts                   |     74 +
 .../executive-desk/config/executive-desk.config.ts |     55 +
 .../db/__tests__/receipt-ledger.test.ts            |    311 +
 .../db/migrations/001-receipt-ledger.sql           |     71 +
 .../db/migrations/002-delegation-rules.sql         |    137 +
 apps/executive-desk/db/setup.ts                    |     98 +
 apps/executive-desk/evidence/evidence-scanner.ts   |    130 +
 .../gates/GATE_4_AUTHORITY_INTEGRATION.md          |    257 +
 .../gates/GATE_5_RISK_GATE_INTEGRATION.md          |    281 +
 apps/executive-desk/gates/GATE_6_API_ROUTES.md     |    452 +
 .../gates/GATE_7_FRONTEND_COMPONENTS.md            |     55 +
 apps/executive-desk/gates/GATE_8_E2E_DEMO.md       |     70 +
 .../gates/GATE_PROXY_ACTION_IMPLEMENTATION.md      |     70 +
 .../gates/GATE_RECEIPT_PERSISTENCE.md              |     64 +
 .../DOE/DISCOVERY_MEETING_FRAMEWORK.md             |     55 +
 ...DOE_EXECUTIVE_INTRO_OUTBOUND_EMAIL_ONE_PAGER.md |     69 +
 .../DOE/EXECUTIVE_INTRODUCTION_ONE_PAGER.md        |     41 +
 .../DOE/GOVERNMENT_CONTACT_LIST.md                 |     26 +
 .../DOE/GOVERNMENT_EXECUTIVE_DESK_OVERVIEW.md      |     38 +
 .../DOE/OUTCOME_FIRST_MESSAGING.md                 |     45 +
 apps/executive-desk/government-readiness/README.md |     28 +
 .../GOVERNMENT_DEPLOYMENT_BLUEPRINT_2026-07-14.md  |     82 +
 .../government-readiness/evidence/README.md        |     11 +
 .../LINKEDIN_OUTREACH_PLAYBOOK_2026-07-14.md       |     44 +
 .../EXECUTIVE_INTELLIGENCE_BRIEF_DOCTRINE.md       |     69 +
 ...XECUTIVE_REVIEW_CHECKLIST_GOVERNMENT_POSTURE.md |     50 +
 .../governance/GBP_CHIEF_OF_STAFF_BRIEF.md         |     78 +
 .../governance/GBP_OPERATING_RUNBOOK.md            |     80 +
 ...GOVERNMENT_OUTCOME_REFERENCE_LIBRARY_OUTLINE.md |     40 +
 .../government-readiness/modernization/README.md   |     10 +
 .../government-readiness/pilot-packages/README.md  |     11 +
 apps/executive-desk/gpt-integration.md             |    117 +
 apps/executive-desk/mob/mob-review.ts              |    106 +
 apps/executive-desk/openapi.yaml                   |    524 +
 apps/executive-desk/outcomes/outcome-status.ts     |    144 +
 apps/executive-desk/package.json                   |     14 +
 apps/executive-desk/panels.md                      |     45 +
 apps/executive-desk/proxy/README.md                |     96 +
 .../proxy/__tests__/command-handler.test.ts        |    113 +
 apps/executive-desk/proxy/command-handler.ts       |    292 +
 apps/executive-desk/proxy/test-handler.ts          |    117 +
 apps/executive-desk/public/app.js                  |    693 +
 apps/executive-desk/public/index.html              |    263 +
 apps/executive-desk/public/styles.css              |    429 +
 .../readiness/government-readiness.ts              |     77 +
 apps/executive-desk/reporting/markdown-reporter.ts |     47 +
 apps/executive-desk/reporting/receipt-writer.ts    |     52 +
 apps/executive-desk/server.ts                      |     47 +
 .../services/__tests__/authority-check.test.ts     |    120 +
 .../services/__tests__/risk-assessment.test.ts     |    121 +
 apps/executive-desk/services/authority-check.ts    |    161 +
 apps/executive-desk/services/closeout-state.ts     |    316 +
 apps/executive-desk/services/delegation-rules.ts   |    279 +
 .../services/identity-graph-client.ts              |    250 +
 .../services/infrastructure-health-client.ts       |    328 +
 .../executive-desk/services/receipt-ledger-file.ts |    200 +
 apps/executive-desk/services/receipt-ledger-pg.ts  |    256 +
 apps/executive-desk/services/receipt-ledger.ts     |    175 +
 apps/executive-desk/services/risk-assessment.ts    |    344 +
 apps/executive-desk/services/risk-gate.ts          |     71 +
 apps/executive-desk/tsconfig.cli.json              |     25 +
 apps/sentinel/src/audit/executionTrace.js          |     20 +-
 apps/sentinel/src/commands/dispatch.js             |    105 +-
 .../src/commands/retrieval/vaultRetrieveFixture.js |    103 +
 apps/sentinel/src/commands/sentinelOsHandlers.js   |    282 +-
 apps/sentinel/src/governance/policyEngine.js       |      2 +
 .../retrieval/bhindiFixtureExecutor.js             |     32 +
 .../integrations/retrieval/nexusFixtureRouter.js   |     26 +
 .../integrations/retrieval/vaultFixtureAdapter.js  |     28 +
 apps/sentinel/src/orchestration/taskTemplates.js   |      5 +-
 apps/sentinel/src/sovereign/sovereignBoot.js       |      2 +-
 apps/sentinel/src/sovereign/sovereignLicense.js    |     43 +-
 apps/sentinel/src/surface/nunncloud.js             |      2 +
 apps/sentinel/src/telemetry/telemetryHarmonizer.js |     31 +-
 apps/sentinel/src/whiteGlove/supportRequest.js     |    144 +
 artifacts/sentinel-ai-package-fast.json            |     33 +
 artifacts/sentinel-ai-package-full.json            |     48 +
 broken-app.yaml                                    |     45 +
 compose-expanded.yml                               |      2 +
 contract_reclamation-incubator                     |      1 +
 coverage/lcov-report/base.css                      |    224 +
 coverage/lcov-report/block-navigation.js           |     87 +
 .../executive-desk/api/<define:import.meta>.html   |    118 +
 .../executive-desk/api/__tests__/index.html        |    116 +
 .../api/__tests__/routes.test.ts.html              |   1210 +
 .../executive-desk/api/delegation-queries.ts.html  |    568 +
 .../executive-desk/api/express-adapter.ts.html     |   1345 +
 coverage/lcov-report/executive-desk/api/index.html |    176 +
 .../executive-desk/api/receipt-queries.ts.html     |   1270 +
 .../executive-desk/api/risk-api.ts.html            |    811 +
 .../executive-desk/db/__tests__/index.html         |    116 +
 .../db/__tests__/receipt-ledger.test.ts.html       |   1045 +
 coverage/lcov-report/executive-desk/db/index.html  |    116 +
 .../lcov-report/executive-desk/db/setup.ts.html    |    379 +
 coverage/lcov-report/executive-desk/index.html     |    116 +
 .../proxy/__tests__/command-handler.test.ts.html   |    124 +
 .../executive-desk/proxy/__tests__/index.html      |    116 +
 .../executive-desk/proxy/command-handler.ts.html   |    961 +
 .../lcov-report/executive-desk/proxy/index.html    |    131 +
 .../executive-desk/proxy/test-handler.ts.html      |    436 +
 .../lcov-report/executive-desk/public/app.js.html  |    949 +
 .../lcov-report/executive-desk/public/index.html   |    116 +
 coverage/lcov-report/executive-desk/server.ts.html |    202 +
 .../__tests__/authority-check.test.ts.html         |    118 +
 .../executive-desk/services/__tests__/index.html   |    131 +
 .../__tests__/risk-assessment.test.ts.html         |    118 +
 .../services/authority-check.ts.html               |    568 +
 .../services/delegation-rules.ts.html              |    922 +
 .../services/identity-graph-client.ts.html         |    835 +
 .../lcov-report/executive-desk/services/index.html |    236 +
 .../services/infrastructure-health-client.ts.html  |   1069 +
 .../services/receipt-ledger-file.ts.html           |    685 +
 .../services/receipt-ledger-pg.ts.html             |    853 +
 .../executive-desk/services/receipt-ledger.ts.html |    610 +
 .../services/risk-assessment.ts.html               |   1039 +
 .../executive-desk/services/risk-gate.ts.html      |    298 +
 coverage/lcov-report/favicon.png                   |    Bin 0 -> 445 bytes
 coverage/lcov-report/index.html                    |    176 +
 coverage/lcov-report/prettify.css                  |      1 +
 coverage/lcov-report/prettify.js                   |      2 +
 coverage/lcov-report/sort-arrow-sprite.png         |    Bin 0 -> 138 bytes
 coverage/lcov-report/sorter.js                     |    210 +
 coverage/lcov.info                                 |   4840 +
 coverage/tmp/coverage-21881-1783858619677-0.json   |      1 +
 coverage/tmp/coverage-21882-1783858618020-0.json   |      1 +
 coverage/tmp/coverage-21900-1783858619331-2.json   |      1 +
 coverage/tmp/coverage-21900-1783858619346-1.json   |      1 +
 coverage/tmp/coverage-21900-1783858619386-0.json   |      1 +
 current-app.json                                   |     57 +
 deploy/index.js                                    |    135 +
 deploy/signing-proxy.zip                           |    Bin 0 -> 1585 bytes
 docker-compose.yml                                 |     88 +
 ..._QUEUE_AND_SENDCOMM_ACCESS_RESULT_2026-07-06.md |    105 +
 ...EXECUTE_HARDENING_DECISION_PACKET_2026-07-06.md |    210 +
 ...NTIME_UPGRADE_INTRODUCTION_PACKET_2026-07-06.md |    194 +
 ...VERNMENT_OUTCOME_INTAKE_WORKSHEET_2026-06-12.md |    333 +
 ...ME_INTAKE_WORKSHEET_REVIEW_RESULT_2026-06-12.md |     68 +
 ...RE_OWNERFI_PROOF_GREAT_HOLD_STATE_2026-07-03.md |    140 +
 docs/governance/AZURE_REACTIVATION_CHECK_RESULT_2026-07-03.md |    118 +
 docs/governance/CADENCE_CLOSEOUT_PLAN_2026-06-30.md           |    189 +
 docs/GBP/assessments/CADENCE_INDEX_2026-06-30.md                   |     93 +
 ...R_PORTAL_SPECIFICS_QUERY_MANIFEST_2026-06-17.md |    120 +
 ...NER_PORTAL_SPECIFICS_QUERY_RESULT_2026-06-17.md |     78 +
 ...AND_ACCESS_VERBIAGE_REVIEW_RESULT_2026-06-17.md |     52 +
 ...T_EXECUTIVE_INTAKE_RECONCILIATION_2026-06-12.md |    139 +
 ...URRENT_WORKTREE_EVIDENCE_BASELINE_2026-07-05.md |     77 +
 ...ERY_INTAKE_AND_RISK_QUESTIONNAIRE_2026-07-03.md |    131 +
 ...SK_QUESTIONNAIRE_POPULATED_RESULT_2026-07-03.md |     89 +
 ...LEMENTATION_SCOPE_AND_RISK_PACKET_2026-07-03.md |     72 +
 ...UTIVE_CADENCE_PLAN_2026-06-16_AND_2026-06-17.md |     68 +
 docs/GBP/doctrine/DOCUMENTATION_POLICY_GUARDRAIL.md             |     51 +
 ...DATION_AND_RELEASE_CONTROL_REVIEW_2026-06-18.md |    139 +
 ...NAGEMENT_AND_COMPATIBILITY_REVIEW_2026-06-17.md |    143 +
 ...MENT_FOOTPRINT_DISCOVERY_MANIFEST_2026-06-13.md |    107 +
 ...T_RELEASE_STAGING_MANIFEST_REVIEW_2026-06-15.md |    220 +
 ...SE_STAGING_MANIFEST_REVIEW_RESULT_2026-06-15.md |     69 +
 ...VE_ENVELOPE_COMMAND_CHANGE_REVIEW_2026-06-12.md |    135 +
 ...VAULT_READ_ONLY_POC_TEST_MANIFEST_2026-06-17.md |    118 +
 ...NESS_REPAIR_IMPLEMENTATION_RESULT_2026-06-17.md |     50 +
 ...ON_TRACE_COMPLETENESS_REPAIR_PLAN_2026-06-17.md |    136 +
 ...N_TRACE_DISPATCH_READ_ONLY_REVIEW_2026-06-16.md |     66 +
 docs/governance/EXECUTIVE_BOARD_2026-06-11.md                 |    550 +
 docs/governance/EXECUTIVE_BOARD_2026-06-19.md                 |    120 +
 docs/EXECUTIVE_BOARD_2026-07-01.md                 |     62 +
 docs/EXECUTIVE_BOARD_ADDRESS_2026-07-01.md         |     59 +
 .../EXECUTIVE_BOARD_JULY_05_ADDENDUM_2026-07-05.md |     65 +
 ...ECUTIVE_BOARD_JULY_STARTING_POINT_2026-06-30.md |     79 +
 docs/GBP/assessments/EXECUTIVE_BOARD_MOB_REFRESHED_2026-06-15.md   |    106 +
 ...VE_BOARD_REFRESHED_FOR_PROCESSING_2026-06-13.md |    117 +
 docs/governance/EXECUTIVE_BOARD_SUMMARY_UPDATE_2026-06-12.md  |     71 +
 ...IME_UPGRADE_GUIDED_SUPPORT_SCRIPT_2026-07-06.md |    244 +
 ...E_UPGRADE_HANDOFF_AND_PROMPT_PACK_2026-07-06.md |    269 +
 ...ESK_GPT_RUNTIME_UPGRADE_USER_FLOW_2026-07-06.md |    295 +
 ...RESTORE_EXECUTION_APPROVAL_RESULT_2026-06-19.md |     86 +
 ...ESTORE_EXECUTION_PREFLIGHT_RESULT_2026-06-20.md |    141 +
 docs/governance/EXECUTIVE_DESK_V1.md                          |     75 +
 docs/governance/EXECUTIVE_DRIFT_FOCUS_REPORT_2026-06-18.md    |    153 +
 ...RITY_EVIDENCE_AND_APPROVAL_MATRIX_2026-06-18.md |    372 +
 docs/governance/EXECUTIVE_SNAPSHOT_2026-06-11.md              |     66 +
 docs/governance/EXECUTIVE_SNAPSHOT_2026-06-13.md              |     80 +
 docs/governance/EXECUTIVE_SNAPSHOT_2026-06-17.md              |    200 +
 ...ME_INTAKE_INPUT_PROCESSING_RESULT_2026-06-12.md |     82 +
 ...INTAKE_SCOPE_AUTHORIZATION_RESULT_2026-06-12.md |     76 +
 ...IPT_PROOF_IMPLEMENTATION_MANIFEST_2026-06-19.md |    202 +
 ...EMENTATION_MANIFEST_REVIEW_RESULT_2026-06-19.md |     83 +
 ...I_VAULT_POC_IMPLEMENTATION_RESULT_2026-06-17.md |     73 +
 docs/governance/FRIDAY_DAILY_EXECUTIVE_CADENCE_2026-06-19.md  |    126 +
 ..._DAILY_EXECUTIVE_CADENCE_CLOSEOUT_2026-06-12.md |     82 +
 docs/governance/FRIDAY_WEEKLY_EXECUTIVE_CADENCE_2026-06-19.md |    111 +
 ...WEEKLY_EXECUTIVE_CADENCE_CLOSEOUT_2026-06-12.md |     70 +
 docs/GBP/AI-Docking-and-Control-Surface.md         |     50 +
 docs/GBP/Deployment-Profile-State.md               |     82 +
 docs/GBP/Deployment-Profile-Template.md            |    104 +
 docs/GBP/GBP-Alignment-Working-Plan.md             |    255 +
 docs/GBP/Government-Deployment-Blueprint.md        |    144 +
 docs/GBP/Mission-Readiness-Index.md                |     81 +
 docs/GBP/Phase-3-Outcome-Engines.md                |    283 +
 docs/GBP/Phase-4-Deployment-Profiles.md            |    142 +
 .../Phase-4-Deployment-Profiles.release-draft.md   |    154 +
 ...ERNANCE_COMPLIANCE_EVIDENCE_INDEX_2026-06-14.md |     87 +
 ...ANCE_COMPLIANCE_SETTLEMENT_PACKET_2026-06-14.md |    115 +
 ...ME_OPERATING_SYSTEM_REVIEW_PACKET_2026-06-12.md |    207 +
 ...NT_OUTCOME_OWNER_ADDITIONS_RESULT_2026-06-12.md |     75 +
 ...NANCE_CLOSEOUT_AND_OWNER_DECISION_2026-06-30.md |    105 +
 ...FI_PROOF_HEALTH_VALIDATION_RESULT_2026-06-30.md |    105 +
 docs/GBP/assessments/JULY_01_CADENCE_INDEX_2026-07-01.md           |     61 +
 docs/GBP/doctrine/JULY_01_DAILY_EXECUTIVE_CADENCE_2026-07-01.md |     48 +
 ...01_WEEKLY_EXECUTIVE_CADENCE_START_2026-07-01.md |     56 +
 docs/governance/JULY_03_CADENCE_INDEX_2026-07-03.md           |    153 +
 docs/governance/JULY_03_DAILY_EXECUTIVE_CADENCE_2026-07-03.md |     90 +
 ...TEMPLATE_PACKET_PROCESSING_RESULT_2026-07-03.md |     90 +
 ...ASTER_OPERATING_BLUEPRINT_OVERLAY_2026-07-03.md |    162 +
 ...LY_03_NEXT_ACTIONS_HOLDING_RESULT_2026-07-03.md |    143 +
 ...RATING_SEQUENCE_COMPLETION_RESULT_2026-07-03.md |    151 +
 docs/GBP/assessments/JULY_03_WEEKLY_CADENCE_CLOSEOUT_2026-07-03.md |    114 +
 docs/governance/JULY_04_HOLIDAY_SHUTDOWN_HOLD_2026-07-04.md   |     50 +
 docs/GBP/assessments/JULY_05_CADENCE_INDEX_2026-07-05.md           |    164 +
 ...DAILY_AND_WEEKLY_CADENCE_CLOSEOUT_2026-07-05.md |    106 +
 ...05_EXECUTIVE_MOB_BOARD_COMPARISON_2026-07-05.md |     93 +
 docs/GBP/assessments/JULY_05_MOB_DRIFT_REPORT_2026-07-05.md        |    126 +
 docs/GBP/doctrine/JULY_MONTHLY_OPERATING_BRIEF_2026-07-01.md    |     98 +
 ...Y_MONTHLY_OPERATING_CADENCE_START_2026-07-01.md |     49 +
 ..._QUEUE_DEEP_DIVE_DECISION_PACKETS_2026-06-30.md |    501 +
 ...Y_PRIORITY_QUEUE_READINESS_PACKET_2026-06-30.md |    104 +
 ...QUEUE_READINESS_PROCESSING_RESULT_2026-06-30.md |    111 +
 ..._AND_FIRST_ACTION_APPROVAL_RESULT_2026-06-30.md |     58 +
 ..._30_CURRENT_TRUTH_REESTABLISHMENT_2026-06-30.md |    183 +
 ...DAILY_CLOSEOUT_AND_TOMORROW_START_2026-06-30.md |     59 +
 ...OSEOUT_AND_RUNTIME_ALIGNMENT_SCAN_2026-07-06.md |    170 +
 docs/governance/LIVE_PROOF_HEALTH_RETRY_RESULT_2026-06-30.md  |     52 +
 ..._PROOF_HEALTH_VERIFICATION_RESULT_2026-06-30.md |     97 +
 ...L_AI_GOVERNANCE_CONTINUITY_RESULT_2026-07-03.md |    124 +
 ...PROCESSING_AND_QUALITY_EVALUATION_2026-07-03.md |    183 +
 ...CKING_ASSET_CLASSIFICATION_RESULT_2026-07-03.md |    171 +
 ...HT_QUANTITATIVE_NEXT_STEPS_RESULT_2026-07-03.md |    108 +
 ..._INQUIRY_PORTAL_ACTIVATION_REVIEW_2026-06-18.md |    153 +
 ...Y_PORTAL_ACTIVATION_REVIEW_RESULT_2026-06-18.md |     73 +
 ...TITY_INQUIRY_PORTAL_REVIEW_RESULT_2026-06-15.md |     54 +
 ...ITY_AND_OUTCOME_PROCESSING_RESULT_2026-06-18.md |    110 +
 docs/governance/MISSION_CONTROL_COCKPIT_CHECKIN_2026-07-02.md |    118 +
 ...ON_PUBLIC_PROTECTED_INTERNAL_HELD_2026-07-06.md |    512 +
 ...SECURITY_AND_PLATFORM_REVIEW_GATE_2026-07-06.md |    120 +
 ...CURITY_AND_PLATFORM_REVIEW_RESULT_2026-07-06.md |    298 +
 ..._COMPLETION_QUEUE_REFRESH_OVERLAY_2026-07-05.md |     53 +
 ...NT_PACKET_GATE_8_REGRESSION_PROOF_2026-07-05.md |     74 +
 docs/GBP/assessments/MOB_MOVEMENT_MAP_2026-07-05.md                |     92 +
 ..._MOVEMENT_QUEUE_PROCESSING_RESULT_2026-07-05.md |    101 +
 docs/GBP/assessments/MOB_NEXT_STEPS_TEMPLATE_2026-07-05.md         |     81 +
 .../MOB_VERIFICATION_MATRIX_ADDENDUM_2026-07-05.md |     54 +
 docs/GBP/assessments/MONDAY_DAILY_EXECUTIVE_CADENCE_2026-06-15.md  |     86 +
 docs/governance/MONDAY_EXECUTIVE_ROUTING_UPDATE_2026-06-15.md |     58 +
 ...ERNAL_SUPPORT_DISBURSEMENT_PACKET_2026-06-15.md |    143 +
 ...AY_WEEKLY_EXECUTIVE_CADENCE_START_2026-06-15.md |     66 +
 ...NTIME_UPGRADE_CANDIDATE_SELECTION_2026-07-06.md |    135 +
 docs/GBP/overlays/NEXT_STEPS.md                                 |    466 +-
 .../NEXT_STEPS_1_4_PROCESSING_RESULT_2026-07-03.md |     71 +
 docs/governance/NEXT_STEPS_DEEP_DIVE_SUMMARIES_2026-07-03.md  |    317 +
 ...STEPS_GATES_1_4_PROCESSING_RESULT_2026-07-03.md |    188 +
 ...F_JUNE_SENTINELOS_PROGRESS_UPDATE_2026-06-18.md |     52 +
 docs/NUMBERED_TODO_PROCESSING_RESULT_2026-06-19.md |    166 +
 ...IC_FRONT_DOOR_VERIFICATION_RESULT_2026-07-03.md |    105 +
 ..._SENTINELOS_ISSUE_SUPPORT_TRACKER_2026-06-14.md |     97 +
 ...RPORATION_MASTER_OPERATING_BINDER_2026-06-15.md |    267 +
 docs/governance/OLDER_REPO_DIFF_REVIEW_RESULT_2026-06-11.md   |    130 +
 ...SEPARATED_RESOLUTION_REQUIREMENTS_2026-06-11.md |    298 +
 docs/GBP/doctrine/OPEN_WORKTREE_ENTRY_TRACKER_2026-06-18.md     |    210 +
 ...RATING_DIRECTIVE_LOCKED_ALIGNMENT_2026-07-03.md |     56 +
 ...AL_MANAGEMENT_CHECKSUM_MANIFEST_2026-07-03.json |    695 +
 ...IAL_MANAGEMENT_MIGRATION_MANIFEST_2026-07-03.md |     95 +
 ..._ARCHITECTURE_AND_MANIFEST_RESULT_2026-07-03.md |    101 +
 ...AL_MANAGEMENT_READ_ONLY_INVENTORY_2026-07-03.md |     93 +
 ...DOMAIN_AND_MOB_ALIGNMENT_DECISION_2026-07-03.md |    126 +
 ..._HEALTH_NETWORK_VERIFICATION_PREP_2026-07-03.md |     75 +
 ...ERFI_PROOF_HEALTH_RESTORED_RESULT_2026-07-03.md |     96 +
 ..._PROOF_HEALTH_VERIFICATION_RESULT_2026-07-03.md |    200 +
 ...OVAL_RUNTIME_UPGRADE_INTRODUCTION_2026-07-06.md |    137 +
 ...NAL_SHARE_REVENUE_APPROVAL_RESULT_2026-07-03.md |     69 +
 ...ION_EXTERNAL_SHARE_REVENUE_PACKET_2026-07-03.md |    243 +
 ..._SINTENEX_RT_004_FOR_INTRODUCTION_2026-07-06.md |    195 +
 ..._RUNTIME_UPGRADE_SELECTION_RESULT_2026-07-06.md |    185 +
 ...TIME_UPGRADE_INTRODUCTION_CHANNEL_2026-07-06.md |    156 +
 ...Y_DISCOVERY_AND_CONTROL_DIRECTION_2026-06-17.md |     83 +
 docs/GBP/assessments/PERSISTENCE_READINESS_MANIFEST_2026-07-05.md  |    122 +
 ...ONAL_LANE_AND_OWNER_DECISION_PLAN_2026-07-03.md |    186 +
 ..._FQDN_STABILITY_DIAGNOSTIC_RESULT_2026-07-03.md |     52 +
 ..._LIVE_VERIFICATION_RECONCILIATION_2026-06-12.md |    215 +
 ...NLY_WORKFLOW_FIX_EXECUTION_RESULT_2026-06-19.md |     92 +
 ...ANGE_IMPLEMENTATION_REVIEW_RESULT_2026-06-20.md |    126 +
 ...HANGE_PATCH_SCOPE_APPROVAL_RESULT_2026-06-20.md |     96 +
 ...NNECTOR_DIRECTION_APPROVAL_RESULT_2026-06-19.md |    111 +
 ...ECTOR_MINOR_CHANGES_REVIEW_RESULT_2026-06-19.md |    117 +
 ...INOR_CHANGE_IMPLEMENTATION_PACKET_2026-06-19.md |    327 +
 ...ONNECTOR_REVIEW_PROCESSING_RESULT_2026-06-19.md |    163 +
 docs/governance/README.md                                     |      4 +
 ...OYMENT_FOOTPRINT_DISCOVERY_RESULT_2026-06-13.md |    300 +
 ..._FOOTPRINT_DISCOVERY_SCOPE_REVIEW_2026-06-13.md |     98 +
 ...FICATION_DIRECTIVE_RECONCILIATION_2026-06-12.md |     77 +
 ...T_RELEASE_STAGING_MANIFEST_REVIEW_2026-06-18.md |    277 +
 ...SE_STAGING_MANIFEST_REVIEW_RESULT_2026-06-18.md |    118 +
 docs/governance/REFRESHED_EXACT_REVIEW_MANIFEST_2026-06-17.md |    338 +
 ..._RELEASE_BLOCKER_SELECTION_RESULT_2026-06-18.md |     84 +
 .../RELEASE_BLOCKER_SELECTION_RESULT_2026-06-15.md |     65 +
 ..._READY_HELD_IMPLEMENTATION_RESULT_2026-07-03.md |    170 +
 ...DIDATE_RELEASE_PACKET_WHITE_GLOVE_2026-07-06.md |    256 +
 ...CANDIDATE_SELECTION_REVIEW_RT_004_2026-07-06.md |    183 +
 ...PGRADE_GPT_SUPPORT_CADENCE_RETURN_2026-07-06.md |    142 +
 ...RODUCTION_COPY_AND_CHANNEL_PACKET_2026-07-06.md |    265 +
 ...TENEX_RT_001_OWNERFI_ROUTE_HEALTH_2026-07-06.md |    115 +
 ...03_RECEIPT_AUDIT_DECISION_SURFACE_2026-07-06.md |    114 +
 ...004_MISSION_CONTROL_CONTROL_PLANE_2026-07-06.md |    307 +
 ...ENEX_RT_005_GOVERNANCE_PRIMITIVES_2026-07-06.md |    121 +
 .../SATURDAY_DAILY_EXECUTIVE_CADENCE_2026-06-13.md |     89 +
 ...ION_AGAINST_SENTINELOS_BOUNDARIES_2026-07-06.md |    127 +
 .../SENDCOMM_GITHUB_SOURCE_INVENTORY_2026-07-06.md |    148 +
 ...SERVATION_PACKET_NO_FILE_MOVEMENT_2026-07-06.md |    145 +
 ...ENTINELOS_MIGRATION_REVIEW_RESULT_2026-07-03.md |    173 +
 ...ITY_INQUIRY_PORTAL_RECONCILIATION_2026-06-12.md |     78 +
 ...W_AND_VR_DEPARTMENT_ESTABLISHMENT_2026-07-06.md |    178 +
 ...ENTINELOS_STATE_STEWARDSHIP_MODEL_2026-06-20.md |    175 +
 ...VIRTUAL_REVIEW_DEPARTMENT_CHARTER_2026-07-06.md |    301 +
 ...NTINEL_AI_CHANGE_HOLD_DECLARATION_2026-06-11.md |     93 +
 ...D_ACCESS_NAMING_AND_VERBIAGE_SCAN_2026-06-17.md |    164 +
 ...E_CLOSEOUT_READY_ON_HOLD_WORKFLOW_2026-06-30.md |    179 +
 ...ION_AND_ACCESS_SEGREGATION_POLICY_2026-06-12.md |    198 +
 ...EL_AUTHORITY_RECEIPT_PROOF_PACKET_2026-06-19.md |    108 +
 ...EIPT_PROOF_PACKET_APPROVAL_RESULT_2026-06-19.md |    115 +
 ...INEL_EXECUTIVE_OPERATING_TEMPLATE_2026-06-11.md |    233 +
 ...INEL_EXECUTIVE_OPERATING_TEMPLATE_2026-06-19.md |    137 +
 ...INEL_EXECUTIVE_OPERATING_TEMPLATE_2026-07-01.md |     64 +
 ...INEL_EXECUTIVE_OPERATING_TEMPLATE_2026-07-03.md |    122 +
 ...ERATING_TEMPLATE_JULY_05_ADDENDUM_2026-07-05.md |     77 +
 ...TING_TEMPLATE_JULY_STARTING_POINT_2026-06-30.md |     91 +
 ..._OPERATING_TEMPLATE_MOB_REFRESHED_2026-06-15.md |     81 +
 ...TIVE_OPERATING_TEMPLATE_REFRESHED_2026-06-12.md |    135 +
 ...TIVE_OPERATING_TEMPLATE_REFRESHED_2026-06-15.md |     74 +
 ...TEMPLATE_REFRESHED_FOR_PROCESSING_2026-06-13.md |     97 +
 ...ITORY_EVIDENCE_AND_CLASSIFICATION_2026-06-11.md |    165 +
 ..._AND_CLASSIFICATION_REVIEW_RESULT_2026-06-11.md |     91 +
 ...NDI_VAULT_READ_ONLY_POC_TEST_PLAN_2026-06-17.md |    176 +
 ...GOVERNANCE_PASS_AND_EXECUTION_MAP_2026-07-03.md |    180 +
 ...1_GOVERNANCE_PACKET_REVIEW_RESULT_2026-06-15.md |     53 +
 ...ION_AND_AUTHORITY_LAYER_DIRECTION_2026-06-18.md |    140 +
 ...X_RUNTIME_ELIGIBILITY_ALERT_QUEUE_2026-07-06.md |    246 +
 ..._UPGRADE_READINESS_CONTROL_RESULT_2026-07-06.md |    164 +
 ...T_AND_COMMERCIAL_ROUTING_BOUNDARY_2026-07-03.md |    139 +
 ...AL_ROUTING_BOUNDARY_REVIEW_RESULT_2026-07-03.md |     79 +
 ...YER_PACKAGE_INTAKE_RECONCILIATION_2026-06-11.md |    200 +
 ...ND_LICENSE_LIFECYCLE_CONTROL_PLAN_2026-06-17.md |    385 +
 ...YCLE_CONTROL_PLAN_APPROVAL_RESULT_2026-06-17.md |     56 +
 ...ECYCLE_CONTROL_PLAN_REVIEW_RESULT_2026-06-17.md |     52 +
 ...ANAGEMENT_IMPLEMENTATION_MANIFEST_2026-06-17.md |    201 +
 ...EREIGN_LIGHT_MODE_APPROVAL_PACKET_2026-06-11.md |    162 +
 ...T_MODE_APPROVAL_PROCESSING_RESULT_2026-06-16.md |     43 +
 docs/governance/SOVEREIGN_READINESS_SCORECARD_2026-06-11.md   |     44 +
 ...ITY_AND_GOVERNANCE_OVERVIEW_DRAFT_2026-06-11.md |     50 +
 ...PIPELINE_MOCK_OPTIMIZATION_PACKET_2026-06-30.md |    280 +
 ...OUT_CONFIGURATION_APPROVAL_PACKET_2026-07-03.md |     71 +
 ...CTION_CONFIGURATION_EVIDENCE_PLAN_2026-07-03.md |     99 +
 ..._DAILY_EXECUTIVE_CADENCE_CLOSEOUT_2026-06-14.md |     92 +
 ...WEEKLY_EXECUTIVE_CADENCE_CLOSEOUT_2026-06-14.md |     84 +
 docs/governance/SYSTEM_POSITIONING.md                         |     13 +-
 ...ASK_TEMPLATE_CHECK_FAILURE_REVIEW_2026-06-15.md |    124 +
 .../THURSDAY_DAILY_EXECUTIVE_CADENCE_2026-06-18.md |    196 +
 ..._DAILY_EXECUTIVE_CADENCE_CLOSEOUT_2026-06-18.md |    140 +
 docs/governance/TIER_TRIAL_AUTO_REVERT_POLICY_2026-07-06.md   |    154 +
 ...HESTRATION_SUPPORT_COMMAND_PACKET_2026-06-14.md |    131 +
 ...PORT_COMMAND_PACKET_REVIEW_RESULT_2026-06-14.md |     84 +
 ...OS_SUPPORT_CONTRACT_REVIEW_RESULT_2026-06-15.md |     64 +
 ...OS_SUPPORT_LANE_PROCESSING_RESULT_2026-06-12.md |     85 +
 ...REQUEST_ANSWER_AND_ROUTING_MATRIX_2026-06-14.md |     79 +
 ...UESDAY_EXECUTIVE_CADENCE_CLOSEOUT_2026-06-16.md |     34 +
 ...RECOMMENDATIONS_PROCESSING_RESULT_2026-07-06.md |    162 +
 ...TROL_SECURITY_PLATFORM_REVIEW_JOB_2026-07-06.md |    186 +
 ...SDAY_EXECUTIVE_CADENCE_ACTIVATION_2026-06-17.md |     66 +
 docs/governance/WEEKLY_AND_MONTH_END_CLOSEOUT_2026-06-30.md   |    174 +
 ...ED_SUPPORT_REQUEST_IMPLEMENTATION_2026-07-03.md |    164 +
 ...NTINEL_AI_SUPPORT_ADOPTION_RESULT_2026-07-03.md |    196 +
 docs/executive-desk-gpt/README.md                  |     98 +
 docs/executive-desk-gpt/README.pdf                 |    Bin 0 -> 123382 bytes
 .../integration-status-2026-06-30.md               |    127 +
 ...ase-2-safe-read-only-command-gate-2026-07-01.md |     97 +
 .../the-executive-desk-instructions.md             |     67 +
 .../the-executive-desk-instructions.pdf            |    Bin 0 -> 124857 bytes
 .../the-executive-desk-no-actions-instructions.md  |    103 +
 .../the-executive-desk-openapi.yaml                |    215 +
 .../tunnel-refresh-result-2026-07-01.md            |     88 +
 docs/executive-desk/board/2026-07.md               |     89 +
 docs/executive-desk/daily/2026-07-15.md            |     96 +
 .../evidence/2026-07-15-evidence-index.json        |   1651 +
 .../evidence/2026-07-15-evidence-summary.md        |     31 +
 .../government-readiness/2026-07-15.md             |     39 +
 docs/executive-desk/mob/2026-07-15.md              |     51 +
 docs/executive-desk/mob/alignment-profile.json     |     12 +
 docs/executive-desk/monthly/2026-07.md             |     71 +
 docs/executive-desk/outcomes/2026-07-15.md         |     63 +
 .../outcomes/verification-profile.json             |     33 +
 ...26-07-15-governed-build-completion-receipt.json |    106 +
 .../receipts/2026-07-15T07-13-38.552Z-help.json    |     16 +
 .../receipts/2026-07-15T07-14-07.079Z-health.json  |     16 +
 .../2026-07-15T07-14-46.297Z-executive-daily.json  |     18 +
 .../2026-07-15T07-14-58.393Z-executive-weekly.json |     18 +
 ...2026-07-15T07-15-03.154Z-executive-monthly.json |     18 +
 .../2026-07-15T07-15-47.510Z-executive-board.json  |     18 +
 ...6-07-15T07-16-04.905Z-government-readiness.json |     18 +
 .../2026-07-15T07-16-10.317Z-mob-review.json       |     18 +
 .../2026-07-15T07-16-18.989Z-evidence-scan.json    |     19 +
 .../2026-07-15T07-16-50.883Z-outcome-status.json   |     18 +
 .../2026-07-15T07-37-27.376Z-mob-review.json       |     18 +
 .../2026-07-15T07-37-32.333Z-outcome-status.json   |     18 +
 .../2026-07-15T07-38-45.672Z-outcome-status.json   |     18 +
 .../2026-07-15T07-38-49.641Z-executive-weekly.json |     18 +
 docs/executive-desk/weekly/2026-W29.md             |    108 +
 .../## Nunn Corporation Design Hierarchy.md        |     17 +
 docs/releases/executive-desk/v1.0.0-gate8.md       |     51 +
 ...GN_AIR_GAPPED_LICENSE_OFFER_DRAFT_2026-07-02.md |    122 +
 docs/sovereign/SOVEREIGN_ATTORNEY_BRIEF.md         |     17 +-
 ...N_COLLATERAL_REWRITE_REVIEW_INDEX_2026-07-02.md |     96 +
 ...TNERSHIP_SUPPORT_CONTINUITY_DRAFT_2026-07-02.md |    132 +
 ..._SUPPORT_CONTINUITY_REVIEW_RESULT_2026-07-02.md |     67 +
 ...PPORT_CONTINUITY_INTAKE_CHECKLIST_2026-07-02.md |    165 +
 docs/sovereign/SOVEREIGN_TIER.md                   |     14 +-
 fixtures/retrieval/nav-tasks.logs.json             |     14 +
 governance/README.md                               |     57 +
 .../constitution/NUNN_CORPORATION_CONSTITUTION.md  |    188 +
 .../SENTINELOS_EXECUTIVE_CONSTITUTION.md           |    388 +
 lambda/signing-proxy.js                            |    135 +
 lambda/test-proxy.js                               |     84 +
 ops-closeout/2026-06-20/00-executive-closeout.md   |     18 +
 ops-closeout/2026-06-20/01-enterprise-scorecard.md |     15 +
 ops-closeout/2026-06-20/02-daily-cadence.md        |     15 +
 ops-closeout/2026-06-20/03-weekly-cadence.md       |     14 +
 ops-closeout/2026-06-20/04-monthly-closeout.md     |      0
 ops-closeout/2026-06-20/05-mob-alignment.md        |     18 +
 ops-closeout/2026-06-20/06-board-template.md       |      0
 ops-closeout/2026-06-20/07-evidence-ledger.md      |      9 +
 ...eign-light-mode-approval-review-2026-06-11.json |     42 +
 package.json                                       |     41 +-
 pnpm-lock.yaml                                     |   1986 +-
 .../check-deployment-footprint-discovery-scope.js  |     47 +
 scripts/check-entity-inquiry-portal.js             |     36 +
 scripts/check-execution-trace-completeness.js      |    202 +
 scripts/check-executive-desk-e2e-demo.js           |    170 +
 scripts/check-executive-desk-frontend.js           |    170 +
 .../check-government-outcome-intake-worksheet.js   |     52 +
 scripts/check-government-outcomes-surface.js       |     40 +
 scripts/check-light-quantitative-nextsteps.js      |     57 +
 scripts/check-mission-control-surface.js           |      3 +-
 scripts/check-ownerfi-proof-health-receipt.js      |    106 +
 scripts/check-record-classification-directive.js   |     39 +
 scripts/check-revenue-readiness-held.js            |     81 +
 scripts/check-saturday-executive-cadence.js        |     53 +
 ...ck-sentinel-nexus-bhindi-vault-read-only-poc.js |    165 +
 scripts/check-sovereign-license.js                 |     42 +
 scripts/check-task-templates.js                    |     26 +-
 scripts/check-white-glove-support-request.js       |     35 +
 scripts/classify-sentinel-assets.js                |    129 +
 scripts/executive-desk.ps1                         |     21 +
 scripts/generate-sovereign-keypair.js              |     17 +
 scripts/generate-sovereign-license.js              |      6 +-
 scripts/sentinel-ai-package.js                     |     48 +
 scripts/sentinel.ps1                               |     63 +
 scripts/sign-request.js                            |    105 +
 scripts/verify-manifest-checksums.js               |    173 +
 503 files changed, 389814 insertions(+), 133 deletions(-)
```
