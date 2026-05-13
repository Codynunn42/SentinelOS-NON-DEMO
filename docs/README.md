# Docs

Documentation for SentinelOS NON-DEMO.

## Canonical Mapping Index

This index is the current docs control map. It shows which document is canonical for each lane, the approval badge, the governance/compliance mapping, and what must happen next.

| Lane | Canonical Source | Approval Badge | Governance / Compliance Mapping | Verification / Evidence | External Use |
| --- | --- | --- | --- | --- | --- |
| Governance preflight | `docs/GOVERNANCE_PREFLIGHT.md` | `[KEEP:ACTIVE]` | tenant, actor, role, scopes, policy preflight, approval read/review, audit hash chain | `npm run check:policy`, `npm run check:approvals` | Internal/operator reference |
| Deployment and live proof | `docs/DEPLOYMENT.md`, `docs/NEXT_STEPS.md` | `[KEEP:ACTIVE]` | live routes, protected command/audit access, deployment verification | `/health`, `/proof`, `/v1/audit` checks | Internal/operator reference |
| Phase 1 demo contract | `docs/DEMO_CONTRACT.md`, `docs/INVARIANTS.md`, `docs/RELEASE_v1.0.0.md`, `docs/PHASE1_APPROVAL_BOARD_2026-05-07.md` | `[ARCHIVE:PHASE-1-LINEAGE]` | stable demo response shape, no-bypass invariants, release gate | `node scripts/check-control-ui.js`, `node scripts/check-proof-ui-flow.js` | Internal release lineage |
| Phase 1.1 live approval continuity | `docs/EXECUTIVE_SNAPSHOT_2026-05-12.md`, `docs/PHASE1_APPROVAL_BOARD_2026-05-12.md` | `[KEEP:CURRENT-PHASE-1.1]` | blocked -> approval -> approved -> rerun execution continuity, mock FacePlane telemetry, live Log Analytics proof | `npm run check:approvals`, `/v1/faceplane/mock`, Log Analytics evidence | Current approval record |
| OwnerFi proof case | `docs/PROOF_CASE_OWNERFI.md` | `[KEEP:ACTIVE]` | narrative proof case for OwnerFi execution, approval, and audit | `/proof`, `scripts/demo.sh` | Demo/support reference |
| Workflow contract | `docs/WORKFLOW_DEFINITIONS.md` | `[KEEP:ACTIVE]` | command payloads, command scopes, receipts, audit expectations | command handler and policy checks | Internal/operator reference |
| Surface planes | `docs/SURFACE_PLANES.md`, `docs/SYSTEM_POSITIONING.md` | `[KEEP:ACTIVE]` | shared core plus tenant-isolated surfaces | surface registry and tenant command routing | Internal/product reference |
| Commercial collateral | `docs/COMMERCIAL_ASSETS_2026-04-29.md` | `[KEEP:CONTROLLED-COMMERCIAL-COLLATERAL]` | governed execution messaging tied to current proof claims | source for `docs/COMMERCIAL_ASSETS_2026-04-29.pdf` | Controlled use after claim check against current evidence |
| Commercial collateral PDF | `docs/COMMERCIAL_ASSETS_2026-04-29.pdf` | `[KEEP:CONTROLLED-COMMERCIAL-COLLATERAL]` | generated deliverable from commercial source Markdown | paired to `docs/COMMERCIAL_ASSETS_2026-04-29.md` | Controlled use after claim check against current evidence |
| Vendor onboarding rule set | `docs/VENDOR_ONBOARDING_RULE_SET_V1.md` | `[APPROVE:CONDITIONAL]` | deterministic 30-rule compliance backbone, NVOP thresholds, audit ledger | `npm run check:vendor-onboarding`, `npm run check:vendor-ledger` | Operator/auditor reference after approval |
| Arizona SPO brief source | `docs/ARIZONA_SPO_MODERNIZATION_BRIEF_LAYOUT.md` | `[DEFER:PUBLIC-SECTOR-DRAFT]` | public-sector vendor onboarding modernization proposal | source for `docs/ARIZONA_SPO_MODERNIZATION_BRIEF_LAYOUT.pdf` | Draft only, not approved for external publication |
| Arizona SPO brief PDF | `docs/ARIZONA_SPO_MODERNIZATION_BRIEF_LAYOUT.pdf` | `[DEFER:PUBLIC-SECTOR-DRAFT]` | generated public-sector discussion draft | paired to `docs/ARIZONA_SPO_MODERNIZATION_BRIEF_LAYOUT.md` | Draft only, not approved for external publication |
| Governance doctrine | `docs/NUNN_GOVERNANCE_DOCTRINE_v1.md` | `[HOLD:REVIEW]` | faceplane activation, internal governance lab tier, tenant activation gates | enforcement mapping inside doctrine doc | Internal draft until enforcement map is approved |
| Daily brief retention | `docs/DAILY_BRIEF_RETENTION_RULE.md` | `[APPROVED:MAPPING]` | daily briefs are immutable historical snapshots unless explicitly superseded | retention rule documented | Internal evidence policy |
| Daily brief 2026-04-23 | `docs/DAILY_BRIEF_2026-04-23.md` | `[ARCHIVE:HISTORICAL-LINEAGE]` | historical operating snapshot | protected by daily brief retention rule | Internal historical record |
| Daily brief 2026-04-24 | `docs/DAILY_BRIEF_2026-04-24.md` | `[ARCHIVE:HISTORICAL-LINEAGE]` | historical operating snapshot | protected by daily brief retention rule | Internal historical record |
| Orchestrated Workflow Engine | `docs/TASK_TEMPLATES_SYSTEM.md` | `[APPROVED:TASK-SYSTEM]` | initialize workflows, build execution sessions, raise approval candidates, queue XE assistance, block unapproved execution | `npm run check:task-templates` | Internal/operator reference |
| Governed Telemetry Harmonizer | `docs/GOVERNED_TELEMETRY_HARMONIZER.md` | `[APPROVED:GTH]` | classify visibility when telemetry is off/limited; safe, approval-required, and blocked lanes | `npm run check:telemetry-harmonizer` | Internal/operator reference |
| Nunn Cloud Control Surface | `docs/NUNN_CLOUD_CONTROL_SURFACE_OPERATING_MODEL.md` | `[APPROVED:OPERATING-MODEL]` | executive/operator surface for commands, workflows, approvals, telemetry, billing, and audit | `/mission-control` live verification | Internal/operator reference |
| HERGLASS Perception Face Plane | `docs/HERGLASS_FACEPLANE_PLAN.md` | `[DEFERRED:PHASE-2]` | future scan-to-intent Face Plane; must route through Control Plane and Sentinel Core | no Phase 1 implementation; start after pilot or approved Phase 2 trigger | Internal roadmap reference |
| State anchoring | `docs/STATE_ANCHORING_RUNBOOK.md`, `docs/anchors/system-release-current.json` | `[APPROVED:VERIFY]` | verifiable records of key system states, linked to Sentinel audit after external proof is recorded | `npm run check:state-anchors` | Internal/operator reference |
| Approval evidence | `docs/SENTINEL_APPROVAL_NOTICE_2026-05-04.md` | `[APPROVED:EVIDENCE]` | approval boundary for mapping alignment and no-cleanup rule | approval notice and reports | Internal approval record |
| Repo organization scan lineage | `docs/SENTINEL_REPO_ORGANIZATION_REPORT_2026-05-04.md`, `docs/SENTINEL_REPO_ORGANIZATION_REPORT_2026-05-07.md`, `docs/SENTINEL_REPO_ORGANIZATION_REPORT_2026-05-11.md` | `[ARCHIVE:HISTORICAL-REPO-SCAN]` | historical scan evidence and drift comparison inputs | paired JSONL logs where present | Internal historical record |
| Current repo organization scan | `docs/SENTINEL_REPO_ORGANIZATION_REPORT_2026-05-13.md` | `[KEEP:CURRENT-SCAN-EVIDENCE]` | current scan evidence feeding the 18-artifact decision register | `docs/sentinel-repo-organization-log-2026-05-13.jsonl` | Internal approval record |
| Phase 1.1 artifact decisions | `docs/SENTINEL_ARTIFACT_DECISION_REGISTER_2026-05-13.md` | `[APPROVED:18-ARTIFACT-DECISIONS]` | item-level governance decisions for the 2026-05-13 repo organization scan | `docs/SENTINEL_REPO_ORGANIZATION_REPORT_2026-05-13.md` | Internal approval record |

## Approval Boundary

`[STREAMLINE:NOT_READY]`

No broad cleanup, deletion, physical archive move, merge consolidation, runtime refactor, external publication of held/deferred documents, or canonical promotion of held/deferred documents is approved from this index. `ARCHIVE` means preserve in place as historical evidence.

## Category Notices

Category approval and next-step notices live in:

- `docs/SENTINEL_CATEGORY_APPROVAL_NOTICE_2026-05-04.md`
- `docs/SENTINEL_CATEGORY_COMPLETION_NOTICE_2026-05-04.md`
- `docs/SENTINEL_GOVERNANCE_COMPLIANCE_APPROVAL_REPORT_2026-05-04.md`
- `docs/SENTINEL_TARGETED_STREAMLINING_APPROVAL_PLAN_2026-05-04.md`

## Task Templates System

The Orchestrated Workflow Engine is approved as an internal control system in `docs/TASK_TEMPLATES_SYSTEM.md`.

It may initialize category work, organize the timeline, raise human approvals, queue XE assistance, and block unapproved execution. It does not approve deletion, streamlining, runtime refactors, or external publication by itself.

## Governed Telemetry Harmonizer

The Governed Telemetry Harmonizer is approved as an internal observability control system in `docs/GOVERNED_TELEMETRY_HARMONIZER.md`.

It may classify telemetry activity as safe, approval-required, or blocked when telemetry is off or limited. It does not auto-send sensitive data or bypass approval.

## Nunn Cloud Control Surface

The Nunn Cloud Control Surface is approved as the internal executive/operator interface in `docs/NUNN_CLOUD_CONTROL_SURFACE_OPERATING_MODEL.md`.

It may initialize workflows, show approvals, run telemetry review, display billing gates, and present audit timelines. Existing users should experience this as a version upgrade, not a migration or pricing change.

## State Anchoring

State anchoring is approved as the external verification lane in `docs/STATE_ANCHORING_RUNBOOK.md`.

The current release checkpoint lives at `docs/anchors/system-release-current.json`. External transaction details must be recorded through `/v1/anchors/system-release/external` before a release anchor is considered verified.

## Source-To-Deliverable Mapping

| Deliverable | Source | Status | Next Step |
| --- | --- | --- | --- |
| `docs/COMMERCIAL_ASSETS_2026-04-29.pdf` | `docs/COMMERCIAL_ASSETS_2026-04-29.md` | `[KEEP:CONTROLLED-COMMERCIAL-COLLATERAL]` | Use only after checking claims against current Phase 1.1 evidence. |
| `docs/ARIZONA_SPO_MODERNIZATION_BRIEF_LAYOUT.pdf` | `docs/ARIZONA_SPO_MODERNIZATION_BRIEF_LAYOUT.md` | `[DEFER:PUBLIC-SECTOR-DRAFT]` | Keep draft-only until source is approved and PDF is regenerated or labeled draft. |
