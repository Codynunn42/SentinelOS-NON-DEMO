# Sentinel Repository Organization Report - 2026-05-07

## Operator Summary

Sentinel scanned the repository for changed files, untracked files, exact duplicates, similar names, and overlapping document content. No files were deleted or moved. This report is an approval gate for optimization and streamlining.

- Files scanned: 181
- Changed or untracked files: 99
- Similarity groups detected: 39
- Use: 138
- Needs decision: 43
- Streamline candidates: 0
- Sentinel log: `docs/sentinel-repo-organization-log-2026-05-07.jsonl`

## Sentinel Recommendation

Do not approve a broad cleanup yet. Approve a narrow streamlining pass only after the owner confirms which new governance/docs/scripts are intended to become canonical. The safest next action is to keep runtime surfaces, keep referenced governance modules, and review new scripts/docs in grouped batches.

## Proposed Approval Batches

1. **Keep / use**: referenced runtime code, served public pages, and scripts already wired into package checks.
2. **Review for canonical status**: new governance doctrine, vendor onboarding docs, Arizona SPO layout assets, and new check scripts.
3. **Streamline only after approval**: exact duplicates or overlapping documents where one file clearly becomes the canonical source.

## Changed Worktree Snapshot

| Bucket | Decision | File | Status | References | Reason |
| --- | --- | --- | --- | ---: | --- |
| logged | review | `.env.example` | modified | 17 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `apps/api/public/mission-control.html` | modified | 9 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `apps/api/public/operator-escalations.html` | added | 3 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `apps/api/public/proof.html` | modified | 42 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `apps/api/public/stripe-checkout.css` | added | 6 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `apps/api/public/stripe-checkout.html` | added | 5 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `apps/api/public/stripe-checkout.js` | added | 6 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `apps/api/public/stripe-complete.css` | added | 3 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `apps/api/public/stripe-complete.html` | added | 2 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `apps/api/public/stripe-complete.js` | added | 3 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `apps/api/server.js` | modified | 19 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `apps/sentinel/src/commands/ownerfiHandlers.js` | modified | 4 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `apps/sentinel/src/faceplanes/openai/openaiAuditAdapter.js` | added | 2 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `apps/sentinel/src/faceplanes/openai/openaiEscalationAdapter.js` | added | 2 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `apps/sentinel/src/faceplanes/openai/openaiFaceplaneConfig.js` | added | 4 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `apps/sentinel/src/faceplanes/openai/openaiRoutes.js` | added | 1 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `apps/sentinel/src/faceplanes/openai/openaiWorkflowEngine.js` | added | 2 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `apps/sentinel/src/governance/core/containmentBaseline_v1.json` | added | 5 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `apps/sentinel/src/governance/core/driftConfig.js` | added | 5 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `apps/sentinel/src/governance/core/driftMonitor.js` | added | 5 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `apps/sentinel/src/governance/core/driftPolicyLedger.js` | added | 4 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `apps/sentinel/src/governance/core/governanceDriftMonitor.js` | added | 0 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `apps/sentinel/src/governance/core/governanceStatus.js` | added | 3 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `apps/sentinel/src/governance/policyEngine.js` | modified | 12 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `apps/sentinel/src/governance/vendorOnboarding/auditLedger.js` | added | 6 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `apps/sentinel/src/governance/vendorOnboarding/driftConfig.js` | added | 5 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `apps/sentinel/src/governance/vendorOnboarding/driftMonitor.js` | added | 5 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `apps/sentinel/src/governance/vendorOnboarding/engine.js` | added | 20 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `apps/sentinel/src/governance/vendorOnboarding/latencyGovernor.js` | added | 3 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `apps/sentinel/src/governance/vendorOnboarding/nvopConfig.js` | added | 5 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `apps/sentinel/src/governance/vendorOnboarding/operatorEscalation.js` | added | 4 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `apps/sentinel/src/governance/vendorOnboarding/rules.js` | added | 21 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `apps/sentinel/src/integrations/docking/protocol.js` | modified | 7 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `apps/sentinel/src/orchestration/taskTemplates.js` | added | 6 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `apps/sentinel/src/security/keyRegistry.js` | modified | 9 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `apps/sentinel/src/telemetry/telemetryController.js` | added | 3 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `apps/sentinel/src/telemetry/telemetryHarmonizer.js` | added | 4 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `apps/sentinel/src/telemetry/telemetrySchema.js` | added | 2 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `apps/sentinel/src/verification/stateAnchors.js` | added | 4 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/anchors/system-release-current.json` | added | 3 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/ARIZONA_SPO_MODERNIZATION_BRIEF_LAYOUT.md` | added | 9 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/ARIZONA_SPO_MODERNIZATION_BRIEF_LAYOUT.pdf` | added | 10 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/BUILD_MANUAL_REVIEW_2026-05-06.md` | untracked | 2 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/DAILY_BRIEF_RETENTION_RULE.md` | added | 3 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/EXECUTIVE_SNAPSHOT_2026-05-05.md` | untracked | 0 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/FACEPLANE_GAAS_DOCKING_DOCTRINE.md` | untracked | 3 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/FACEPLANE_SDK_SPEC.md` | untracked | 3 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/GOVERNED_TELEMETRY_HARMONIZER.md` | added | 4 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/NUNN_CLOUD_CONTROL_SURFACE_OPERATING_MODEL.md` | added | 2 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/NUNN_GOVERNANCE_DOCTRINE_v1.md` | added | 8 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/OWNERFI_PILOT_API_SPEC.md` | added | 0 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/OWNERFI_PILOT_API_SPEC.pdf` | added | 0 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/OWNERFI_TODD_PILOT_MESSAGE.md` | added | 0 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/PAYROLL_EXECUTION_EVIDENCE_PACKET_2026-05-05.md` | added | 0 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/payroll-evidence-index-2026-05-05.json` | added | 0 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/PROOF_CASE_GOVERNED_DEAL_EXECUTION_V2.md` | untracked | 6 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/README.md` | modified | 13 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/SENTINEL_APPROVAL_NOTICE_2026-05-04.md` | added | 5 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/SENTINEL_APPROVAL_RESUMPTION_2026-05-06.md` | untracked | 0 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/SENTINEL_APPROVAL_RISK_ANALYSIS_2026-05-04.md` | added | 4 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/SENTINEL_CATEGORY_APPROVAL_NOTICE_2026-05-04.md` | added | 2 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/SENTINEL_CATEGORY_COMPLETION_NOTICE_2026-05-04.md` | added | 4 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/SENTINEL_DECISION_PATTERN_APPROVAL_NOTICE_2026-05-06.md` | untracked | 1 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/SENTINEL_GOVERNANCE_COMPLIANCE_APPROVAL_REPORT_2026-05-04.md` | added | 5 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/SENTINEL_REPO_ORGANIZATION_REPORT_2026-05-04.md` | added | 6 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/SENTINEL_REPO_ORGANIZATION_REPORT_2026-05-07.md` | untracked | 1 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/SENTINEL_TARGETED_STREAMLINING_APPROVAL_PLAN_2026-05-04.md` | added | 4 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/SENTINELOS_DEMO_PACKAGE_APPROVAL_NOTICE_2026-05-06.md` | untracked | 1 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/SENTINELOS_DEMO_PACKAGE_V2.md` | untracked | 5 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/SENTINELOS_LIVE_DEMO_SCRIPT_V2.md` | untracked | 6 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/SENTINELOS_PROOF_SHEET_V2.md` | untracked | 5 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/SENTINELOS_SOURCE_DOCUMENT_ALIGNMENT_2026-05-06.md` | untracked | 3 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/STATE_ANCHORING_RUNBOOK.md` | added | 2 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/STRIPE_CHECKOUT_INGESTION_REPORT.md` | added | 2 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/TASK_TEMPLATES_SYSTEM.md` | added | 4 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/VENDOR_ONBOARDING_RULE_SET_V1.md` | added | 11 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `package.json` | modified | 18 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `scripts/check-containment-posture.js` | modified | 4 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `scripts/check-demo-assets-v2.js` | untracked | 4 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `scripts/check-drift-governance-core.js` | added | 5 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `scripts/check-faceplane-sdk.js` | untracked | 2 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `scripts/check-governance-drift-monitor.js` | added | 5 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `scripts/check-governance-status.js` | added | 3 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `scripts/check-media-polish.js` | added | 2 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `scripts/check-mission-control-surface.js` | added | 2 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `scripts/check-openai-faceplane.js` | added | 4 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `scripts/check-operator-escalation.js` | added | 5 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `scripts/check-ownerfi-pilot-api-live.js` | added | 1 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `scripts/check-ownerfi-pilot-api.js` | added | 1 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `scripts/check-state-anchors.js` | added | 2 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `scripts/check-stripe-checkout-ingestion.js` | added | 2 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `scripts/check-task-templates.js` | added | 3 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `scripts/check-telemetry-harmonizer.js` | added | 3 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `scripts/check-vendor-onboarding-ledger.js` | added | 4 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `scripts/check-vendor-onboarding-rules.js` | added | 7 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `scripts/generate-system-release-anchor.js` | added | 1 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `scripts/sentinel-repo-organization-scan.js` | added | 9 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `scripts/simulate-vendor-onboarding.js` | added | 4 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `scripts/write-governance-heartbeat.js` | added | 2 | Worktree change logged before any optimization or streamlining decision. |

## Actionable File Classification

| Bucket | Decision | File | Status | References | Reason |
| --- | --- | --- | --- | ---: | --- |
| needs_decision | review | `.env.example` | modified | 17 | Changed file needs owner approval before optimize/streamline action. |
| needs_decision | review | `apps/sentinel/src/governance/core/governanceDriftMonitor.js` | added | 0 | Changed file needs owner approval before optimize/streamline action. |
| needs_decision | review | `docs/anchors/system-release-current.json` | added | 3 | Changed file needs owner approval before optimize/streamline action. |
| needs_decision | review | `docs/ARIZONA_SPO_MODERNIZATION_BRIEF_LAYOUT.md` | added | 9 | Changed file needs owner approval before optimize/streamline action. |
| needs_decision | review | `docs/ARIZONA_SPO_MODERNIZATION_BRIEF_LAYOUT.pdf` | added | 10 | Generated/presentation asset should be tied to a canonical source document or marked external-deliverable. |
| needs_decision | review | `docs/BUILD_MANUAL_REVIEW_2026-05-06.md` | untracked | 2 | Changed file needs owner approval before optimize/streamline action. |
| needs_decision | review | `docs/COMMERCIAL_ASSETS_2026-04-29.pdf` | tracked_clean | 6 | Generated/presentation asset should be tied to a canonical source document or marked external-deliverable. |
| needs_decision | review | `docs/DAILY_BRIEF_2026-04-23.md` | tracked_clean | 6 | Document overlaps another repo artifact by name. Decide whether it is canonical, supporting, or obsolete. |
| needs_decision | review | `docs/DAILY_BRIEF_2026-04-24.md` | tracked_clean | 6 | Document overlaps another repo artifact by name. Decide whether it is canonical, supporting, or obsolete. |
| needs_decision | review | `docs/DAILY_BRIEF_RETENTION_RULE.md` | added | 3 | Changed file needs owner approval before optimize/streamline action. |
| needs_decision | review | `docs/EXECUTIVE_SNAPSHOT_2026-05-05.md` | untracked | 0 | Changed file needs owner approval before optimize/streamline action. |
| needs_decision | review | `docs/FACEPLANE_GAAS_DOCKING_DOCTRINE.md` | untracked | 3 | Changed file needs owner approval before optimize/streamline action. |
| needs_decision | review | `docs/FACEPLANE_SDK_SPEC.md` | untracked | 3 | Changed file needs owner approval before optimize/streamline action. |
| needs_decision | review | `docs/GOVERNED_TELEMETRY_HARMONIZER.md` | added | 4 | Changed file needs owner approval before optimize/streamline action. |
| needs_decision | review | `docs/NUNN_CLOUD_CONTROL_SURFACE_OPERATING_MODEL.md` | added | 2 | Changed file needs owner approval before optimize/streamline action. |
| needs_decision | review | `docs/NUNN_GOVERNANCE_DOCTRINE_v1.md` | added | 8 | Changed file needs owner approval before optimize/streamline action. |
| needs_decision | review | `docs/OWNERFI_PILOT_API_SPEC.md` | added | 0 | Changed file needs owner approval before optimize/streamline action. |
| needs_decision | review | `docs/OWNERFI_PILOT_API_SPEC.pdf` | added | 0 | Generated/presentation asset should be tied to a canonical source document or marked external-deliverable. |
| needs_decision | review | `docs/OWNERFI_TODD_PILOT_MESSAGE.md` | added | 0 | Changed file needs owner approval before optimize/streamline action. |
| needs_decision | review | `docs/PAYROLL_EXECUTION_EVIDENCE_PACKET_2026-05-05.md` | added | 0 | Changed file needs owner approval before optimize/streamline action. |
| needs_decision | review | `docs/payroll-evidence-index-2026-05-05.json` | added | 0 | Changed file needs owner approval before optimize/streamline action. |
| needs_decision | review | `docs/PROOF_CASE_GOVERNED_DEAL_EXECUTION_V2.md` | untracked | 6 | Changed file needs owner approval before optimize/streamline action. |
| needs_decision | review | `docs/README.md` | modified | 13 | Document overlaps another repo artifact by name. Decide whether it is canonical, supporting, or obsolete. |
| needs_decision | review | `docs/SENTINEL_APPROVAL_NOTICE_2026-05-04.md` | added | 5 | Changed file needs owner approval before optimize/streamline action. |
| needs_decision | review | `docs/SENTINEL_APPROVAL_RESUMPTION_2026-05-06.md` | untracked | 0 | Changed file needs owner approval before optimize/streamline action. |
| needs_decision | review | `docs/SENTINEL_APPROVAL_RISK_ANALYSIS_2026-05-04.md` | added | 4 | Changed file needs owner approval before optimize/streamline action. |
| needs_decision | review | `docs/SENTINEL_CATEGORY_APPROVAL_NOTICE_2026-05-04.md` | added | 2 | Changed file needs owner approval before optimize/streamline action. |
| needs_decision | review | `docs/SENTINEL_CATEGORY_COMPLETION_NOTICE_2026-05-04.md` | added | 4 | Changed file needs owner approval before optimize/streamline action. |
| needs_decision | review | `docs/SENTINEL_DECISION_PATTERN_APPROVAL_NOTICE_2026-05-06.md` | untracked | 1 | Changed file needs owner approval before optimize/streamline action. |
| needs_decision | review | `docs/SENTINEL_GOVERNANCE_COMPLIANCE_APPROVAL_REPORT_2026-05-04.md` | added | 5 | Changed file needs owner approval before optimize/streamline action. |
| needs_decision | review | `docs/SENTINEL_REPO_ORGANIZATION_REPORT_2026-05-04.md` | added | 6 | Document overlaps another repo artifact by name. Decide whether it is canonical, supporting, or obsolete. |
| needs_decision | review | `docs/SENTINEL_REPO_ORGANIZATION_REPORT_2026-05-07.md` | untracked | 1 | Document overlaps another repo artifact by name. Decide whether it is canonical, supporting, or obsolete. |
| needs_decision | review | `docs/SENTINEL_TARGETED_STREAMLINING_APPROVAL_PLAN_2026-05-04.md` | added | 4 | Changed file needs owner approval before optimize/streamline action. |
| needs_decision | review | `docs/SENTINELOS_DEMO_PACKAGE_APPROVAL_NOTICE_2026-05-06.md` | untracked | 1 | Changed file needs owner approval before optimize/streamline action. |
| needs_decision | review | `docs/SENTINELOS_DEMO_PACKAGE_V2.md` | untracked | 5 | Changed file needs owner approval before optimize/streamline action. |
| needs_decision | review | `docs/SENTINELOS_LIVE_DEMO_SCRIPT_V2.md` | untracked | 6 | Changed file needs owner approval before optimize/streamline action. |
| needs_decision | review | `docs/SENTINELOS_PROOF_SHEET_V2.md` | untracked | 5 | Changed file needs owner approval before optimize/streamline action. |
| needs_decision | review | `docs/SENTINELOS_SOURCE_DOCUMENT_ALIGNMENT_2026-05-06.md` | untracked | 3 | Changed file needs owner approval before optimize/streamline action. |
| needs_decision | review | `docs/STATE_ANCHORING_RUNBOOK.md` | added | 2 | Changed file needs owner approval before optimize/streamline action. |
| needs_decision | review | `docs/STRIPE_CHECKOUT_INGESTION_REPORT.md` | added | 2 | Changed file needs owner approval before optimize/streamline action. |
| needs_decision | review | `docs/TASK_TEMPLATES_SYSTEM.md` | added | 4 | Changed file needs owner approval before optimize/streamline action. |
| needs_decision | review | `docs/VENDOR_ONBOARDING_RULE_SET_V1.md` | added | 11 | Changed file needs owner approval before optimize/streamline action. |
| needs_decision | review | `package.json` | modified | 18 | Changed file needs owner approval before optimize/streamline action. |
| use | keep | `apps/api/public/mission-control.html` | modified | 9 | Public/operator surface is served or linked by the API. |
| use | keep | `apps/api/public/operator-escalations.html` | added | 3 | Public/operator surface is served or linked by the API. |
| use | keep | `apps/api/public/proof.html` | modified | 42 | Public/operator surface is served or linked by the API. |
| use | keep | `apps/api/public/stripe-checkout.css` | added | 6 | Public/operator surface is served or linked by the API. |
| use | keep | `apps/api/public/stripe-checkout.html` | added | 5 | Public/operator surface is served or linked by the API. |
| use | keep | `apps/api/public/stripe-checkout.js` | added | 6 | Public/operator surface is served or linked by the API. |
| use | keep | `apps/api/public/stripe-complete.css` | added | 3 | Public/operator surface is served or linked by the API. |
| use | keep | `apps/api/public/stripe-complete.html` | added | 2 | Public/operator surface is served or linked by the API. |
| use | keep | `apps/api/public/stripe-complete.js` | added | 3 | Public/operator surface is served or linked by the API. |
| use | keep | `apps/api/server.js` | modified | 19 | Runtime source is referenced by active server, command, governance, or check surfaces. |
| use | keep | `apps/sentinel/src/commands/ownerfiHandlers.js` | modified | 4 | Runtime source is referenced by active server, command, governance, or check surfaces. |
| use | keep | `apps/sentinel/src/faceplanes/openai/openaiAuditAdapter.js` | added | 2 | Runtime source is referenced by active server, command, governance, or check surfaces. |
| use | keep | `apps/sentinel/src/faceplanes/openai/openaiEscalationAdapter.js` | added | 2 | Runtime source is referenced by active server, command, governance, or check surfaces. |
| use | keep | `apps/sentinel/src/faceplanes/openai/openaiFaceplaneConfig.js` | added | 4 | Runtime source is referenced by active server, command, governance, or check surfaces. |
| use | keep | `apps/sentinel/src/faceplanes/openai/openaiRoutes.js` | added | 1 | Runtime source is referenced by active server, command, governance, or check surfaces. |
| use | keep | `apps/sentinel/src/faceplanes/openai/openaiWorkflowEngine.js` | added | 2 | Runtime source is referenced by active server, command, governance, or check surfaces. |
| use | keep | `apps/sentinel/src/governance/core/containmentBaseline_v1.json` | added | 5 | Runtime source is referenced by active server, command, governance, or check surfaces. |
| use | keep | `apps/sentinel/src/governance/core/driftConfig.js` | added | 5 | Runtime source is referenced by active server, command, governance, or check surfaces. |
| use | keep | `apps/sentinel/src/governance/core/driftMonitor.js` | added | 5 | Runtime source is referenced by active server, command, governance, or check surfaces. |
| use | keep | `apps/sentinel/src/governance/core/driftPolicyLedger.js` | added | 4 | Runtime source is referenced by active server, command, governance, or check surfaces. |
| use | keep | `apps/sentinel/src/governance/core/governanceStatus.js` | added | 3 | Runtime source is referenced by active server, command, governance, or check surfaces. |
| use | keep | `apps/sentinel/src/governance/policyEngine.js` | modified | 12 | Runtime source is referenced by active server, command, governance, or check surfaces. |
| use | keep | `apps/sentinel/src/governance/vendorOnboarding/auditLedger.js` | added | 6 | Runtime source is referenced by active server, command, governance, or check surfaces. |
| use | keep | `apps/sentinel/src/governance/vendorOnboarding/driftConfig.js` | added | 5 | Runtime source is referenced by active server, command, governance, or check surfaces. |
| use | keep | `apps/sentinel/src/governance/vendorOnboarding/driftMonitor.js` | added | 5 | Runtime source is referenced by active server, command, governance, or check surfaces. |
| use | keep | `apps/sentinel/src/governance/vendorOnboarding/engine.js` | added | 20 | Runtime source is referenced by active server, command, governance, or check surfaces. |
| use | keep | `apps/sentinel/src/governance/vendorOnboarding/latencyGovernor.js` | added | 3 | Runtime source is referenced by active server, command, governance, or check surfaces. |
| use | keep | `apps/sentinel/src/governance/vendorOnboarding/nvopConfig.js` | added | 5 | Runtime source is referenced by active server, command, governance, or check surfaces. |
| use | keep | `apps/sentinel/src/governance/vendorOnboarding/operatorEscalation.js` | added | 4 | Runtime source is referenced by active server, command, governance, or check surfaces. |
| use | keep | `apps/sentinel/src/governance/vendorOnboarding/rules.js` | added | 21 | Runtime source is referenced by active server, command, governance, or check surfaces. |
| use | keep | `apps/sentinel/src/integrations/docking/protocol.js` | modified | 7 | Runtime source is referenced by active server, command, governance, or check surfaces. |
| use | keep | `apps/sentinel/src/orchestration/taskTemplates.js` | added | 6 | Runtime source is referenced by active server, command, governance, or check surfaces. |
| use | keep | `apps/sentinel/src/security/keyRegistry.js` | modified | 9 | Runtime source is referenced by active server, command, governance, or check surfaces. |
| use | keep | `apps/sentinel/src/telemetry/telemetryController.js` | added | 3 | Runtime source is referenced by active server, command, governance, or check surfaces. |
| use | keep | `apps/sentinel/src/telemetry/telemetryHarmonizer.js` | added | 4 | Runtime source is referenced by active server, command, governance, or check surfaces. |
| use | keep | `apps/sentinel/src/telemetry/telemetrySchema.js` | added | 2 | Runtime source is referenced by active server, command, governance, or check surfaces. |
| use | keep | `apps/sentinel/src/verification/stateAnchors.js` | added | 4 | Runtime source is referenced by active server, command, governance, or check surfaces. |
| use | keep | `scripts/check-containment-posture.js` | modified | 4 | Script is referenced by package scripts or repo checks. |
| use | keep | `scripts/check-demo-assets-v2.js` | untracked | 4 | Script is referenced by package scripts or repo checks. |
| use | keep | `scripts/check-drift-governance-core.js` | added | 5 | Script is referenced by package scripts or repo checks. |
| use | keep | `scripts/check-faceplane-sdk.js` | untracked | 2 | Script is referenced by package scripts or repo checks. |
| use | keep | `scripts/check-governance-drift-monitor.js` | added | 5 | Script is referenced by package scripts or repo checks. |
| use | keep | `scripts/check-governance-status.js` | added | 3 | Script is referenced by package scripts or repo checks. |
| use | keep | `scripts/check-media-polish.js` | added | 2 | Script is referenced by package scripts or repo checks. |
| use | keep | `scripts/check-mission-control-surface.js` | added | 2 | Script is referenced by package scripts or repo checks. |
| use | keep | `scripts/check-openai-faceplane.js` | added | 4 | Script is referenced by package scripts or repo checks. |
| use | keep | `scripts/check-operator-escalation.js` | added | 5 | Script is referenced by package scripts or repo checks. |
| use | keep | `scripts/check-ownerfi-pilot-api-live.js` | added | 1 | Script is referenced by package scripts or repo checks. |
| use | keep | `scripts/check-ownerfi-pilot-api.js` | added | 1 | Script is referenced by package scripts or repo checks. |
| use | keep | `scripts/check-state-anchors.js` | added | 2 | Script is referenced by package scripts or repo checks. |
| use | keep | `scripts/check-stripe-checkout-ingestion.js` | added | 2 | Script is referenced by package scripts or repo checks. |
| use | keep | `scripts/check-task-templates.js` | added | 3 | Script is referenced by package scripts or repo checks. |
| use | keep | `scripts/check-telemetry-harmonizer.js` | added | 3 | Script is referenced by package scripts or repo checks. |
| use | keep | `scripts/check-vendor-onboarding-ledger.js` | added | 4 | Script is referenced by package scripts or repo checks. |
| use | keep | `scripts/check-vendor-onboarding-rules.js` | added | 7 | Script is referenced by package scripts or repo checks. |
| use | keep | `scripts/generate-system-release-anchor.js` | added | 1 | Script is referenced by package scripts or repo checks. |
| use | keep | `scripts/sentinel-repo-organization-scan.js` | added | 9 | Script is referenced by package scripts or repo checks. |
| use | keep | `scripts/simulate-vendor-onboarding.js` | added | 4 | Script is referenced by package scripts or repo checks. |
| use | keep | `scripts/write-governance-heartbeat.js` | added | 2 | Script is referenced by package scripts or repo checks. |

## Similarity Groups

### similar_name_1

- Kind: similar_name
- Score: 0.85
- Summary: Similar normalized filename or artifact purpose.
- `README.md`
- `apps/README.md`
- `docs/README.md`
- `infrastructure/README.md`
- `services/README.md`

### similar_name_2

- Kind: similar_name
- Score: 0.85
- Summary: Similar normalized filename or artifact purpose.
- `apps/sentinel/src/commands/registry.js`
- `apps/sentinel/src/surface/registry.js`

### similar_name_3

- Kind: similar_name
- Score: 0.85
- Summary: Similar normalized filename or artifact purpose.
- `apps/sentinel/src/forethought/tilda.js`
- `apps/sentinel/src/learning/tilda.js`

### similar_name_4

- Kind: similar_name
- Score: 0.85
- Summary: Similar normalized filename or artifact purpose.
- `apps/sentinel/src/governance/core/driftConfig.js`
- `apps/sentinel/src/governance/vendorOnboarding/driftConfig.js`

### similar_name_5

- Kind: similar_name
- Score: 0.85
- Summary: Similar normalized filename or artifact purpose.
- `apps/sentinel/src/governance/core/driftMonitor.js`
- `apps/sentinel/src/governance/vendorOnboarding/driftMonitor.js`

### similar_name_6

- Kind: similar_name
- Score: 0.85
- Summary: Similar normalized filename or artifact purpose.
- `apps/sentinel/src/governance/vendorOnboarding/engine.js`
- `apps/sentinel/src/learning/engine.js`

### similar_name_7

- Kind: similar_name
- Score: 0.85
- Summary: Similar normalized filename or artifact purpose.
- `docs/DAILY_BRIEF_2026-04-23.md`
- `docs/DAILY_BRIEF_2026-04-24.md`

### similar_name_8

- Kind: similar_name
- Score: 0.85
- Summary: Similar normalized filename or artifact purpose.
- `docs/SENTINEL_REPO_ORGANIZATION_REPORT_2026-05-04.md`
- `docs/SENTINEL_REPO_ORGANIZATION_REPORT_2026-05-07.md`

### similar_content_9

- Kind: similar_content
- Score: 0.326
- Summary: Document content overlap above Sentinel review threshold.
- `docs/GO_TO_MARKET.md`
- `docs/PRODUCT.md`

### similar_content_10

- Kind: similar_content
- Score: 0.506
- Summary: Document content overlap above Sentinel review threshold.
- `docs/PAYROLL_EXECUTION_EVIDENCE_PACKET_2026-05-05.md`
- `docs/payroll-evidence-index-2026-05-05.json`

### similar_content_11

- Kind: similar_content
- Score: 0.441
- Summary: Document content overlap above Sentinel review threshold.
- `docs/PROOF_CASE_GOVERNED_DEAL_EXECUTION_V2.md`
- `docs/SENTINELOS_PROOF_SHEET_V2.md`

### similar_content_12

- Kind: similar_content
- Score: 0.392
- Summary: Document content overlap above Sentinel review threshold.
- `docs/PROOF_CASE_OWNERFI.md`
- `docs/WORKFLOW_DEFINITIONS.md`

### similar_content_13

- Kind: similar_content
- Score: 0.411
- Summary: Document content overlap above Sentinel review threshold.
- `docs/README.md`
- `docs/SENTINEL_CATEGORY_APPROVAL_NOTICE_2026-05-04.md`

### similar_content_14

- Kind: similar_content
- Score: 0.398
- Summary: Document content overlap above Sentinel review threshold.
- `docs/README.md`
- `docs/SENTINEL_CATEGORY_COMPLETION_NOTICE_2026-05-04.md`

### similar_content_15

- Kind: similar_content
- Score: 0.328
- Summary: Document content overlap above Sentinel review threshold.
- `docs/README.md`
- `docs/SENTINEL_DECISION_PATTERN_APPROVAL_NOTICE_2026-05-06.md`

### similar_content_16

- Kind: similar_content
- Score: 0.368
- Summary: Document content overlap above Sentinel review threshold.
- `docs/README.md`
- `docs/SENTINEL_GOVERNANCE_COMPLIANCE_APPROVAL_REPORT_2026-05-04.md`

### similar_content_17

- Kind: similar_content
- Score: 0.321
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINELOS_DEMO_PACKAGE_APPROVAL_NOTICE_2026-05-06.md`
- `docs/SENTINELOS_DEMO_PACKAGE_V2.md`

### similar_content_18

- Kind: similar_content
- Score: 0.322
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINELOS_DEMO_PACKAGE_APPROVAL_NOTICE_2026-05-06.md`
- `docs/SENTINELOS_PROOF_SHEET_V2.md`

### similar_content_19

- Kind: similar_content
- Score: 0.387
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINELOS_DEMO_PACKAGE_APPROVAL_NOTICE_2026-05-06.md`
- `docs/SENTINEL_APPROVAL_RESUMPTION_2026-05-06.md`

### similar_content_20

- Kind: similar_content
- Score: 0.348
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINELOS_DEMO_PACKAGE_APPROVAL_NOTICE_2026-05-06.md`
- `docs/SENTINEL_DECISION_PATTERN_APPROVAL_NOTICE_2026-05-06.md`

### similar_content_21

- Kind: similar_content
- Score: 0.365
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINELOS_DEMO_PACKAGE_V2.md`
- `docs/SENTINELOS_PROOF_SHEET_V2.md`

### similar_content_22

- Kind: similar_content
- Score: 0.328
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINEL_APPROVAL_NOTICE_2026-05-04.md`
- `docs/SENTINEL_CATEGORY_APPROVAL_NOTICE_2026-05-04.md`

### similar_content_23

- Kind: similar_content
- Score: 0.327
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINEL_APPROVAL_RESUMPTION_2026-05-06.md`
- `docs/SENTINEL_CATEGORY_APPROVAL_NOTICE_2026-05-04.md`

### similar_content_24

- Kind: similar_content
- Score: 0.339
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINEL_APPROVAL_RESUMPTION_2026-05-06.md`
- `docs/SENTINEL_CATEGORY_COMPLETION_NOTICE_2026-05-04.md`

### similar_content_25

- Kind: similar_content
- Score: 0.454
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINEL_APPROVAL_RESUMPTION_2026-05-06.md`
- `docs/SENTINEL_DECISION_PATTERN_APPROVAL_NOTICE_2026-05-06.md`

### similar_content_26

- Kind: similar_content
- Score: 0.322
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINEL_APPROVAL_RESUMPTION_2026-05-06.md`
- `docs/SENTINEL_GOVERNANCE_COMPLIANCE_APPROVAL_REPORT_2026-05-04.md`

### similar_content_27

- Kind: similar_content
- Score: 0.327
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINEL_APPROVAL_RESUMPTION_2026-05-06.md`
- `docs/SENTINEL_TARGETED_STREAMLINING_APPROVAL_PLAN_2026-05-04.md`

### similar_content_28

- Kind: similar_content
- Score: 0.379
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINEL_APPROVAL_RISK_ANALYSIS_2026-05-04.md`
- `docs/SENTINEL_GOVERNANCE_COMPLIANCE_APPROVAL_REPORT_2026-05-04.md`

### similar_content_29

- Kind: similar_content
- Score: 0.398
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINEL_APPROVAL_RISK_ANALYSIS_2026-05-04.md`
- `docs/SENTINEL_TARGETED_STREAMLINING_APPROVAL_PLAN_2026-05-04.md`

### similar_content_30

- Kind: similar_content
- Score: 0.471
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINEL_CATEGORY_APPROVAL_NOTICE_2026-05-04.md`
- `docs/SENTINEL_CATEGORY_COMPLETION_NOTICE_2026-05-04.md`

### similar_content_31

- Kind: similar_content
- Score: 0.34
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINEL_CATEGORY_APPROVAL_NOTICE_2026-05-04.md`
- `docs/SENTINEL_GOVERNANCE_COMPLIANCE_APPROVAL_REPORT_2026-05-04.md`

### similar_content_32

- Kind: similar_content
- Score: 0.357
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINEL_CATEGORY_APPROVAL_NOTICE_2026-05-04.md`
- `docs/SENTINEL_TARGETED_STREAMLINING_APPROVAL_PLAN_2026-05-04.md`

### similar_content_33

- Kind: similar_content
- Score: 0.333
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINEL_CATEGORY_COMPLETION_NOTICE_2026-05-04.md`
- `docs/SENTINEL_DECISION_PATTERN_APPROVAL_NOTICE_2026-05-06.md`

### similar_content_34

- Kind: similar_content
- Score: 0.329
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINEL_CATEGORY_COMPLETION_NOTICE_2026-05-04.md`
- `docs/SENTINEL_GOVERNANCE_COMPLIANCE_APPROVAL_REPORT_2026-05-04.md`

### similar_content_35

- Kind: similar_content
- Score: 0.322
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINEL_CATEGORY_COMPLETION_NOTICE_2026-05-04.md`
- `docs/SENTINEL_TARGETED_STREAMLINING_APPROVAL_PLAN_2026-05-04.md`

### similar_content_36

- Kind: similar_content
- Score: 0.328
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINEL_DECISION_PATTERN_APPROVAL_NOTICE_2026-05-06.md`
- `docs/SENTINEL_GOVERNANCE_COMPLIANCE_APPROVAL_REPORT_2026-05-04.md`

### similar_content_37

- Kind: similar_content
- Score: 0.453
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINEL_GOVERNANCE_COMPLIANCE_APPROVAL_REPORT_2026-05-04.md`
- `docs/SENTINEL_TARGETED_STREAMLINING_APPROVAL_PLAN_2026-05-04.md`

### similar_content_38

- Kind: similar_content
- Score: 0.717
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINEL_REPO_ORGANIZATION_REPORT_2026-05-04.md`
- `docs/SENTINEL_REPO_ORGANIZATION_REPORT_2026-05-07.md`

### similar_content_39

- Kind: similar_content
- Score: 0.363
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINEL_REPO_ORGANIZATION_REPORT_2026-05-04.md`
- `docs/SENTINEL_TARGETED_STREAMLINING_APPROVAL_PLAN_2026-05-04.md`

## Optimization Plan Before Approval

- Preserve `apps/api/public/proof.html` as active demo/XE proof surface.
- Treat new governance core and vendor onboarding modules as likely-use if their paired checks remain in `package.json`.
- Tie each generated PDF to its Markdown source or mark it as a deliverable artifact.
- Convert approved review docs into a short index so operators know which document is canonical for each lane.
- Archive or remove only after a human approval decision is recorded.

## Approval State

Pending human review. Sentinel recommends **hold cleanup**, **approve classification**, and **approve only targeted streamlining after review**.
