# Sentinel Repository Organization Report - 2026-05-13

## Operator Summary

Sentinel scanned the repository for changed files, untracked files, exact duplicates, similar names, and overlapping document content. No files were deleted or moved. This report is an approval gate for optimization and streamlining.

- Files scanned: 291
- Changed or untracked files: 0
- Similarity groups detected: 59
- Use: 273
- Needs decision: 18
- Streamline candidates: 0
- Sentinel log: `docs/sentinel-repo-organization-log-2026-05-13.jsonl`

## Sentinel Recommendation

Do not approve a broad cleanup yet. Approve a narrow streamlining pass only after the owner confirms which new governance/docs/scripts are intended to become canonical. The safest next action is to keep runtime surfaces, keep referenced governance modules, and review new scripts/docs in grouped batches.

## Proposed Approval Batches

1. **Keep / use**: referenced runtime code, served public pages, and scripts already wired into package checks.
2. **Review for canonical status**: new governance doctrine, vendor onboarding docs, Arizona SPO layout assets, and new check scripts.
3. **Streamline only after approval**: exact duplicates or overlapping documents where one file clearly becomes the canonical source.

## Changed Worktree Snapshot

No entries.

## Actionable File Classification

| Bucket | Decision | File | Status | References | Reason |
| --- | --- | --- | --- | ---: | --- |
| needs_decision | review | `docs/ARIZONA_SPO_MODERNIZATION_BRIEF_LAYOUT.pdf` | tracked_clean | 14 | Generated/presentation asset should be tied to a canonical source document or marked external-deliverable. |
| needs_decision | review | `docs/COMMERCIAL_ASSETS_2026-04-29.pdf` | tracked_clean | 10 | Generated/presentation asset should be tied to a canonical source document or marked external-deliverable. |
| needs_decision | review | `docs/DAILY_BRIEF_2026-04-23.md` | tracked_clean | 9 | Document overlaps another repo artifact by name. Decide whether it is canonical, supporting, or obsolete. |
| needs_decision | review | `docs/DAILY_BRIEF_2026-04-24.md` | tracked_clean | 9 | Document overlaps another repo artifact by name. Decide whether it is canonical, supporting, or obsolete. |
| needs_decision | review | `docs/EXECUTIVE_SNAPSHOT_2026-05-05.md` | tracked_clean | 4 | Document overlaps another repo artifact by name. Decide whether it is canonical, supporting, or obsolete. |
| needs_decision | review | `docs/EXECUTIVE_SNAPSHOT_2026-05-07.md` | tracked_clean | 5 | Document overlaps another repo artifact by name. Decide whether it is canonical, supporting, or obsolete. |
| needs_decision | review | `docs/EXECUTIVE_SNAPSHOT_2026-05-11.md` | tracked_clean | 1 | Document overlaps another repo artifact by name. Decide whether it is canonical, supporting, or obsolete. |
| needs_decision | review | `docs/EXECUTIVE_SNAPSHOT_2026-05-12.md` | tracked_clean | 0 | Document overlaps another repo artifact by name. Decide whether it is canonical, supporting, or obsolete. |
| needs_decision | review | `docs/OWNERFI_PILOT_API_SPEC.pdf` | tracked_clean | 2 | Generated/presentation asset should be tied to a canonical source document or marked external-deliverable. |
| needs_decision | review | `docs/PHASE1_APPROVAL_BOARD_2026-05-07.md` | tracked_clean | 2 | Document overlaps another repo artifact by name. Decide whether it is canonical, supporting, or obsolete. |
| needs_decision | review | `docs/PHASE1_APPROVAL_BOARD_2026-05-12.md` | tracked_clean | 1 | Document overlaps another repo artifact by name. Decide whether it is canonical, supporting, or obsolete. |
| needs_decision | review | `docs/README.md` | tracked_clean | 16 | Document overlaps another repo artifact by name. Decide whether it is canonical, supporting, or obsolete. |
| needs_decision | review | `docs/RELEASE_v1.0.0.md` | tracked_clean | 2 | Document overlaps another repo artifact by name. Decide whether it is canonical, supporting, or obsolete. |
| needs_decision | review | `docs/RELEASE_v1.2.0.md` | tracked_clean | 2 | Document overlaps another repo artifact by name. Decide whether it is canonical, supporting, or obsolete. |
| needs_decision | review | `docs/RELEASE_v1.3.0.md` | tracked_clean | 3 | Document overlaps another repo artifact by name. Decide whether it is canonical, supporting, or obsolete. |
| needs_decision | review | `docs/SENTINEL_REPO_ORGANIZATION_REPORT_2026-05-04.md` | tracked_clean | 6 | Document overlaps another repo artifact by name. Decide whether it is canonical, supporting, or obsolete. |
| needs_decision | review | `docs/SENTINEL_REPO_ORGANIZATION_REPORT_2026-05-07.md` | tracked_clean | 1 | Document overlaps another repo artifact by name. Decide whether it is canonical, supporting, or obsolete. |
| needs_decision | review | `docs/SENTINEL_REPO_ORGANIZATION_REPORT_2026-05-11.md` | tracked_clean | 0 | Document overlaps another repo artifact by name. Decide whether it is canonical, supporting, or obsolete. |

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
- `apps/sentinel/src/controlPlane/index.js`
- `apps/sentinel/src/faceplanes/mock/index.js`

### similar_name_4

- Kind: similar_name
- Score: 0.85
- Summary: Similar normalized filename or artifact purpose.
- `apps/sentinel/src/forethought/tilda.js`
- `apps/sentinel/src/learning/tilda.js`

### similar_name_5

- Kind: similar_name
- Score: 0.85
- Summary: Similar normalized filename or artifact purpose.
- `apps/sentinel/src/governance/core/driftConfig.js`
- `apps/sentinel/src/governance/vendorOnboarding/driftConfig.js`

### similar_name_6

- Kind: similar_name
- Score: 0.85
- Summary: Similar normalized filename or artifact purpose.
- `apps/sentinel/src/governance/core/driftMonitor.js`
- `apps/sentinel/src/governance/vendorOnboarding/driftMonitor.js`

### similar_name_7

- Kind: similar_name
- Score: 0.85
- Summary: Similar normalized filename or artifact purpose.
- `apps/sentinel/src/governance/vendorOnboarding/engine.js`
- `apps/sentinel/src/learning/engine.js`

### similar_name_8

- Kind: similar_name
- Score: 0.85
- Summary: Similar normalized filename or artifact purpose.
- `apps/sentinel/src/planes/customerops.ts`
- `apps/sentinel/src/rpc/customerops.ts`
- `apps/sentinel/src/schemas/customerops.ts`

### similar_name_9

- Kind: similar_name
- Score: 0.85
- Summary: Similar normalized filename or artifact purpose.
- `apps/sentinel/src/schemas/customerops.js`
- `apps/sentinel/src/surface/customerops.js`

### similar_name_10

- Kind: similar_name
- Score: 0.85
- Summary: Similar normalized filename or artifact purpose.
- `docs/DAILY_BRIEF_2026-04-23.md`
- `docs/DAILY_BRIEF_2026-04-24.md`

### similar_name_11

- Kind: similar_name
- Score: 0.85
- Summary: Similar normalized filename or artifact purpose.
- `docs/EXECUTIVE_SNAPSHOT_2026-05-05.md`
- `docs/EXECUTIVE_SNAPSHOT_2026-05-07.md`
- `docs/EXECUTIVE_SNAPSHOT_2026-05-11.md`
- `docs/EXECUTIVE_SNAPSHOT_2026-05-12.md`

### similar_name_12

- Kind: similar_name
- Score: 0.85
- Summary: Similar normalized filename or artifact purpose.
- `docs/PHASE1_APPROVAL_BOARD_2026-05-07.md`
- `docs/PHASE1_APPROVAL_BOARD_2026-05-12.md`

### similar_name_13

- Kind: similar_name
- Score: 0.85
- Summary: Similar normalized filename or artifact purpose.
- `docs/RELEASE_v1.0.0.md`
- `docs/RELEASE_v1.2.0.md`
- `docs/RELEASE_v1.3.0.md`

### similar_name_14

- Kind: similar_name
- Score: 0.85
- Summary: Similar normalized filename or artifact purpose.
- `docs/SENTINEL_REPO_ORGANIZATION_REPORT_2026-05-04.md`
- `docs/SENTINEL_REPO_ORGANIZATION_REPORT_2026-05-07.md`
- `docs/SENTINEL_REPO_ORGANIZATION_REPORT_2026-05-11.md`

### similar_content_15

- Kind: similar_content
- Score: 0.335
- Summary: Document content overlap above Sentinel review threshold.
- `docs/ARCHITECTURE_INDEX_2026-05-11.md`
- `docs/CANONICAL_DOCUMENTS_INDEX_2026-05-11.md`

### similar_content_16

- Kind: similar_content
- Score: 0.36
- Summary: Document content overlap above Sentinel review threshold.
- `docs/CANONICAL_DOCUMENTS_INDEX_2026-05-11.md`
- `docs/EXECUTIVE_BOARD_2026-05-11.md`

### similar_content_17

- Kind: similar_content
- Score: 0.501
- Summary: Document content overlap above Sentinel review threshold.
- `docs/CANONICAL_DOCUMENTS_INDEX_2026-05-11.md`
- `docs/OUTREACH_ASSETS_ORGANIZATION_2026-05-11.md`

### similar_content_18

- Kind: similar_content
- Score: 0.335
- Summary: Document content overlap above Sentinel review threshold.
- `docs/CANONICAL_DOCUMENTS_INDEX_2026-05-11.md`
- `docs/SENTINEL_DECISION_PATTERN_APPROVAL_NOTICE_2026-05-06.md`

### similar_content_19

- Kind: similar_content
- Score: 0.34
- Summary: Document content overlap above Sentinel review threshold.
- `docs/CODE_OPTIMIZATION_PLAN_2026-05-11.md`
- `docs/SECURITY_HARDENING_PASS_2026-05-11.md`

### similar_content_20

- Kind: similar_content
- Score: 0.333
- Summary: Document content overlap above Sentinel review threshold.
- `docs/DEMO_CONTRACT.md`
- `docs/INVARIANTS.md`

### similar_content_21

- Kind: similar_content
- Score: 0.359
- Summary: Document content overlap above Sentinel review threshold.
- `docs/EXECUTIVE_BOARD_2026-05-11.md`
- `docs/EXECUTIVE_SNAPSHOT_2026-05-07.md`

### similar_content_22

- Kind: similar_content
- Score: 0.383
- Summary: Document content overlap above Sentinel review threshold.
- `docs/EXECUTIVE_SNAPSHOT_2026-05-07.md`
- `docs/EXECUTIVE_SNAPSHOT_2026-05-12.md`

### similar_content_23

- Kind: similar_content
- Score: 0.332
- Summary: Document content overlap above Sentinel review threshold.
- `docs/EXECUTIVE_SNAPSHOT_2026-05-07.md`
- `docs/EXECUTIVE_TASK_LINEUP_2026-05-07.md`

### similar_content_24

- Kind: similar_content
- Score: 0.322
- Summary: Document content overlap above Sentinel review threshold.
- `docs/EXECUTIVE_SNAPSHOT_2026-05-07.md`
- `docs/SENTINEL_GOVERNANCE_COMPLIANCE_APPROVAL_REPORT_2026-05-04.md`

### similar_content_25

- Kind: similar_content
- Score: 0.326
- Summary: Document content overlap above Sentinel review threshold.
- `docs/EXECUTIVE_SNAPSHOT_2026-05-07.md`
- `docs/SENTINEL_TARGETED_STREAMLINING_APPROVAL_PLAN_2026-05-04.md`

### similar_content_26

- Kind: similar_content
- Score: 0.326
- Summary: Document content overlap above Sentinel review threshold.
- `docs/GO_TO_MARKET.md`
- `docs/PRODUCT.md`

### similar_content_27

- Kind: similar_content
- Score: 0.506
- Summary: Document content overlap above Sentinel review threshold.
- `docs/PAYROLL_EXECUTION_EVIDENCE_PACKET_2026-05-05.md`
- `docs/payroll-evidence-index-2026-05-05.json`

### similar_content_28

- Kind: similar_content
- Score: 0.341
- Summary: Document content overlap above Sentinel review threshold.
- `docs/PHASE1_APPROVAL_BOARD_2026-05-07.md`
- `docs/PHASE1_APPROVAL_BOARD_2026-05-12.md`

### similar_content_29

- Kind: similar_content
- Score: 0.426
- Summary: Document content overlap above Sentinel review threshold.
- `docs/PHASE1_APPROVAL_BOARD_2026-05-07.md`
- `docs/RELEASE_v1.0.0.md`

### similar_content_30

- Kind: similar_content
- Score: 0.441
- Summary: Document content overlap above Sentinel review threshold.
- `docs/PROOF_CASE_GOVERNED_DEAL_EXECUTION_V2.md`
- `docs/SENTINELOS_PROOF_SHEET_V2.md`

### similar_content_31

- Kind: similar_content
- Score: 0.392
- Summary: Document content overlap above Sentinel review threshold.
- `docs/PROOF_CASE_OWNERFI.md`
- `docs/WORKFLOW_DEFINITIONS.md`

### similar_content_32

- Kind: similar_content
- Score: 0.399
- Summary: Document content overlap above Sentinel review threshold.
- `docs/README.md`
- `docs/SENTINEL_CATEGORY_APPROVAL_NOTICE_2026-05-04.md`

### similar_content_33

- Kind: similar_content
- Score: 0.39
- Summary: Document content overlap above Sentinel review threshold.
- `docs/README.md`
- `docs/SENTINEL_CATEGORY_COMPLETION_NOTICE_2026-05-04.md`

### similar_content_34

- Kind: similar_content
- Score: 0.324
- Summary: Document content overlap above Sentinel review threshold.
- `docs/README.md`
- `docs/SENTINEL_DECISION_PATTERN_APPROVAL_NOTICE_2026-05-06.md`

### similar_content_35

- Kind: similar_content
- Score: 0.374
- Summary: Document content overlap above Sentinel review threshold.
- `docs/README.md`
- `docs/SENTINEL_GOVERNANCE_COMPLIANCE_APPROVAL_REPORT_2026-05-04.md`

### similar_content_36

- Kind: similar_content
- Score: 0.329
- Summary: Document content overlap above Sentinel review threshold.
- `docs/README.md`
- `docs/SENTINEL_TARGETED_STREAMLINING_APPROVAL_PLAN_2026-05-04.md`

### similar_content_37

- Kind: similar_content
- Score: 0.321
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINELOS_DEMO_PACKAGE_APPROVAL_NOTICE_2026-05-06.md`
- `docs/SENTINELOS_DEMO_PACKAGE_V2.md`

### similar_content_38

- Kind: similar_content
- Score: 0.322
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINELOS_DEMO_PACKAGE_APPROVAL_NOTICE_2026-05-06.md`
- `docs/SENTINELOS_PROOF_SHEET_V2.md`

### similar_content_39

- Kind: similar_content
- Score: 0.387
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINELOS_DEMO_PACKAGE_APPROVAL_NOTICE_2026-05-06.md`
- `docs/SENTINEL_APPROVAL_RESUMPTION_2026-05-06.md`

### similar_content_40

- Kind: similar_content
- Score: 0.365
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINELOS_DEMO_PACKAGE_V2.md`
- `docs/SENTINELOS_PROOF_SHEET_V2.md`

### similar_content_41

- Kind: similar_content
- Score: 0.328
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINEL_APPROVAL_NOTICE_2026-05-04.md`
- `docs/SENTINEL_CATEGORY_APPROVAL_NOTICE_2026-05-04.md`

### similar_content_42

- Kind: similar_content
- Score: 0.327
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINEL_APPROVAL_RESUMPTION_2026-05-06.md`
- `docs/SENTINEL_CATEGORY_APPROVAL_NOTICE_2026-05-04.md`

### similar_content_43

- Kind: similar_content
- Score: 0.339
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINEL_APPROVAL_RESUMPTION_2026-05-06.md`
- `docs/SENTINEL_CATEGORY_COMPLETION_NOTICE_2026-05-04.md`

### similar_content_44

- Kind: similar_content
- Score: 0.435
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINEL_APPROVAL_RESUMPTION_2026-05-06.md`
- `docs/SENTINEL_DECISION_PATTERN_APPROVAL_NOTICE_2026-05-06.md`

### similar_content_45

- Kind: similar_content
- Score: 0.322
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINEL_APPROVAL_RESUMPTION_2026-05-06.md`
- `docs/SENTINEL_GOVERNANCE_COMPLIANCE_APPROVAL_REPORT_2026-05-04.md`

### similar_content_46

- Kind: similar_content
- Score: 0.327
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINEL_APPROVAL_RESUMPTION_2026-05-06.md`
- `docs/SENTINEL_TARGETED_STREAMLINING_APPROVAL_PLAN_2026-05-04.md`

### similar_content_47

- Kind: similar_content
- Score: 0.379
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINEL_APPROVAL_RISK_ANALYSIS_2026-05-04.md`
- `docs/SENTINEL_GOVERNANCE_COMPLIANCE_APPROVAL_REPORT_2026-05-04.md`

### similar_content_48

- Kind: similar_content
- Score: 0.398
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINEL_APPROVAL_RISK_ANALYSIS_2026-05-04.md`
- `docs/SENTINEL_TARGETED_STREAMLINING_APPROVAL_PLAN_2026-05-04.md`

### similar_content_49

- Kind: similar_content
- Score: 0.471
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINEL_CATEGORY_APPROVAL_NOTICE_2026-05-04.md`
- `docs/SENTINEL_CATEGORY_COMPLETION_NOTICE_2026-05-04.md`

### similar_content_50

- Kind: similar_content
- Score: 0.34
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINEL_CATEGORY_APPROVAL_NOTICE_2026-05-04.md`
- `docs/SENTINEL_GOVERNANCE_COMPLIANCE_APPROVAL_REPORT_2026-05-04.md`

### similar_content_51

- Kind: similar_content
- Score: 0.357
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINEL_CATEGORY_APPROVAL_NOTICE_2026-05-04.md`
- `docs/SENTINEL_TARGETED_STREAMLINING_APPROVAL_PLAN_2026-05-04.md`

### similar_content_52

- Kind: similar_content
- Score: 0.329
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINEL_CATEGORY_COMPLETION_NOTICE_2026-05-04.md`
- `docs/SENTINEL_GOVERNANCE_COMPLIANCE_APPROVAL_REPORT_2026-05-04.md`

### similar_content_53

- Kind: similar_content
- Score: 0.322
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINEL_CATEGORY_COMPLETION_NOTICE_2026-05-04.md`
- `docs/SENTINEL_TARGETED_STREAMLINING_APPROVAL_PLAN_2026-05-04.md`

### similar_content_54

- Kind: similar_content
- Score: 0.325
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINEL_DECISION_PATTERN_APPROVAL_NOTICE_2026-05-06.md`
- `docs/SENTINEL_GOVERNANCE_COMPLIANCE_APPROVAL_REPORT_2026-05-04.md`

### similar_content_55

- Kind: similar_content
- Score: 0.453
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINEL_GOVERNANCE_COMPLIANCE_APPROVAL_REPORT_2026-05-04.md`
- `docs/SENTINEL_TARGETED_STREAMLINING_APPROVAL_PLAN_2026-05-04.md`

### similar_content_56

- Kind: similar_content
- Score: 0.71
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINEL_REPO_ORGANIZATION_REPORT_2026-05-04.md`
- `docs/SENTINEL_REPO_ORGANIZATION_REPORT_2026-05-07.md`

### similar_content_57

- Kind: similar_content
- Score: 0.679
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINEL_REPO_ORGANIZATION_REPORT_2026-05-04.md`
- `docs/SENTINEL_REPO_ORGANIZATION_REPORT_2026-05-11.md`

### similar_content_58

- Kind: similar_content
- Score: 0.363
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINEL_REPO_ORGANIZATION_REPORT_2026-05-04.md`
- `docs/SENTINEL_TARGETED_STREAMLINING_APPROVAL_PLAN_2026-05-04.md`

### similar_content_59

- Kind: similar_content
- Score: 0.703
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINEL_REPO_ORGANIZATION_REPORT_2026-05-07.md`
- `docs/SENTINEL_REPO_ORGANIZATION_REPORT_2026-05-11.md`

## Optimization Plan Before Approval

- Preserve `apps/api/public/proof.html` as active demo/XE proof surface.
- Treat new governance core and vendor onboarding modules as likely-use if their paired checks remain in `package.json`.
- Tie each generated PDF to its Markdown source or mark it as a deliverable artifact.
- Convert approved review docs into a short index so operators know which document is canonical for each lane.
- Archive or remove only after a human approval decision is recorded.

## Approval State

Pending human review. Sentinel recommends **hold cleanup**, **approve classification**, and **approve only targeted streamlining after review**.
