# Sentinel Repository Organization Report - 2026-05-04

## Artifact Decision

```txt
[ARCHIVE:HISTORICAL-REPO-SCAN]
```

Next step: preserve in place for drift lineage and comparison only. Do not use as active cleanup input.

## Operator Summary

Sentinel scanned the repository for changed files, untracked files, exact duplicates, similar names, and overlapping document content. No files were deleted or moved. This report is an approval gate for optimization and streamlining.

- Files scanned: 130
- Changed or untracked files: 31
- Similarity groups detected: 18
- Use: 113
- Needs decision: 17
- Streamline candidates: 0
- Sentinel log: `docs/sentinel-repo-organization-log-2026-05-04.jsonl`

## Sentinel Recommendation

Do not approve a broad cleanup yet. Approve a narrow streamlining pass only after the owner confirms which new governance/docs/scripts are intended to become canonical. The safest next action is to keep runtime surfaces, keep referenced governance modules, and review new scripts/docs in grouped batches.

## Proposed Approval Batches

1. **Keep / use**: referenced runtime code, served public pages, and scripts already wired into package checks.
2. **Review for canonical status**: new governance doctrine, vendor onboarding docs, Arizona SPO layout assets, and new check scripts.
3. **Streamline only after approval**: exact duplicates or overlapping documents where one file clearly becomes the canonical source.

## Changed Worktree Snapshot

| Bucket | Decision | File | Status | References | Reason |
| --- | --- | --- | --- | ---: | --- |
| logged | review | `apps/api/public/operator-escalations.html` | untracked | 3 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `apps/api/public/proof.html` | modified | 28 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `apps/api/server.js` | modified | 12 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `apps/sentinel/src/commands/ownerfiHandlers.js` | modified | 4 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `apps/sentinel/src/governance/policyEngine.js` | modified | 8 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `apps/sentinel/src/security/keyRegistry.js` | modified | 7 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/ARIZONA_SPO_MODERNIZATION_BRIEF_LAYOUT.md` | untracked | 5 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/ARIZONA_SPO_MODERNIZATION_BRIEF_LAYOUT.pdf` | untracked | 6 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/DAILY_BRIEF_RETENTION_RULE.md` | untracked | 2 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/NUNN_GOVERNANCE_DOCTRINE_v1.md` | untracked | 5 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/README.md` | modified | 9 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/SENTINEL_APPROVAL_NOTICE_2026-05-04.md` | untracked | 5 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/SENTINEL_APPROVAL_RISK_ANALYSIS_2026-05-04.md` | untracked | 4 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/SENTINEL_CATEGORY_APPROVAL_NOTICE_2026-05-04.md` | untracked | 1 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/SENTINEL_GOVERNANCE_COMPLIANCE_APPROVAL_REPORT_2026-05-04.md` | untracked | 4 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/SENTINEL_REPO_ORGANIZATION_REPORT_2026-05-04.md` | untracked | 6 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/SENTINEL_TARGETED_STREAMLINING_APPROVAL_PLAN_2026-05-04.md` | untracked | 4 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `docs/VENDOR_ONBOARDING_RULE_SET_V1.md` | untracked | 5 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `package.json` | modified | 8 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `scripts/check-containment-posture.js` | untracked | 2 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `scripts/check-drift-governance-core.js` | untracked | 4 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `scripts/check-governance-drift-monitor.js` | untracked | 4 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `scripts/check-governance-status.js` | untracked | 2 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `scripts/check-media-polish.js` | untracked | 2 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `scripts/check-openai-faceplane.js` | untracked | 3 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `scripts/check-operator-escalation.js` | untracked | 4 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `scripts/check-vendor-onboarding-ledger.js` | untracked | 2 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `scripts/check-vendor-onboarding-rules.js` | untracked | 5 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `scripts/sentinel-repo-organization-scan.js` | untracked | 5 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `scripts/simulate-vendor-onboarding.js` | untracked | 3 | Worktree change logged before any optimization or streamlining decision. |
| logged | review | `scripts/write-governance-heartbeat.js` | untracked | 2 | Worktree change logged before any optimization or streamlining decision. |

## Actionable File Classification

| Bucket | Decision | File | Status | References | Reason |
| --- | --- | --- | --- | ---: | --- |
| needs_decision | review | `docs/ARIZONA_SPO_MODERNIZATION_BRIEF_LAYOUT.md` | untracked | 5 | Changed file needs owner approval before optimize/streamline action. |
| needs_decision | review | `docs/ARIZONA_SPO_MODERNIZATION_BRIEF_LAYOUT.pdf` | untracked | 6 | Generated/presentation asset should be tied to a canonical source document or marked external-deliverable. |
| needs_decision | review | `docs/COMMERCIAL_ASSETS_2026-04-29.pdf` | tracked_clean | 5 | Generated/presentation asset should be tied to a canonical source document or marked external-deliverable. |
| needs_decision | review | `docs/DAILY_BRIEF_2026-04-23.md` | tracked_clean | 6 | Document overlaps another repo artifact by name. Decide whether it is canonical, supporting, or obsolete. |
| needs_decision | review | `docs/DAILY_BRIEF_2026-04-24.md` | tracked_clean | 6 | Document overlaps another repo artifact by name. Decide whether it is canonical, supporting, or obsolete. |
| needs_decision | review | `docs/DAILY_BRIEF_RETENTION_RULE.md` | untracked | 2 | Changed file needs owner approval before optimize/streamline action. |
| needs_decision | review | `docs/NUNN_GOVERNANCE_DOCTRINE_v1.md` | untracked | 5 | Changed file needs owner approval before optimize/streamline action. |
| needs_decision | review | `docs/README.md` | modified | 9 | Document overlaps another repo artifact by name. Decide whether it is canonical, supporting, or obsolete. |
| needs_decision | review | `docs/SENTINEL_APPROVAL_NOTICE_2026-05-04.md` | untracked | 5 | Changed file needs owner approval before optimize/streamline action. |
| needs_decision | review | `docs/SENTINEL_APPROVAL_RISK_ANALYSIS_2026-05-04.md` | untracked | 4 | Changed file needs owner approval before optimize/streamline action. |
| needs_decision | review | `docs/SENTINEL_CATEGORY_APPROVAL_NOTICE_2026-05-04.md` | untracked | 1 | Changed file needs owner approval before optimize/streamline action. |
| needs_decision | review | `docs/SENTINEL_GOVERNANCE_COMPLIANCE_APPROVAL_REPORT_2026-05-04.md` | untracked | 4 | Changed file needs owner approval before optimize/streamline action. |
| needs_decision | review | `docs/SENTINEL_REPO_ORGANIZATION_REPORT_2026-05-04.md` | untracked | 6 | Changed file needs owner approval before optimize/streamline action. |
| needs_decision | review | `docs/SENTINEL_TARGETED_STREAMLINING_APPROVAL_PLAN_2026-05-04.md` | untracked | 4 | Changed file needs owner approval before optimize/streamline action. |
| needs_decision | review | `docs/VENDOR_ONBOARDING_RULE_SET_V1.md` | untracked | 5 | Changed file needs owner approval before optimize/streamline action. |
| needs_decision | review | `package.json` | modified | 8 | Changed file needs owner approval before optimize/streamline action. |
| needs_decision | review | `scripts/sentinel-repo-organization-scan.js` | untracked | 5 | New check/simulation script should be approved into the operator toolkit or archived. |
| use | keep | `apps/api/public/operator-escalations.html` | untracked | 3 | Public/operator surface is served or linked by the API. |
| use | keep | `apps/api/public/proof.html` | modified | 28 | Public/operator surface is served or linked by the API. |
| use | keep | `apps/api/server.js` | modified | 12 | Runtime source is referenced by active server, command, governance, or check surfaces. |
| use | keep | `apps/sentinel/src/commands/ownerfiHandlers.js` | modified | 4 | Runtime source is referenced by active server, command, governance, or check surfaces. |
| use | keep | `apps/sentinel/src/governance/policyEngine.js` | modified | 8 | Runtime source is referenced by active server, command, governance, or check surfaces. |
| use | keep | `apps/sentinel/src/security/keyRegistry.js` | modified | 7 | Runtime source is referenced by active server, command, governance, or check surfaces. |
| use | keep | `scripts/check-containment-posture.js` | untracked | 2 | Script is referenced by package scripts or repo checks. |
| use | keep | `scripts/check-drift-governance-core.js` | untracked | 4 | Script is referenced by package scripts or repo checks. |
| use | keep | `scripts/check-governance-drift-monitor.js` | untracked | 4 | Script is referenced by package scripts or repo checks. |
| use | keep | `scripts/check-governance-status.js` | untracked | 2 | Script is referenced by package scripts or repo checks. |
| use | keep | `scripts/check-media-polish.js` | untracked | 2 | Script is referenced by package scripts or repo checks. |
| use | keep | `scripts/check-openai-faceplane.js` | untracked | 3 | Script is referenced by package scripts or repo checks. |
| use | keep | `scripts/check-operator-escalation.js` | untracked | 4 | Script is referenced by package scripts or repo checks. |
| use | keep | `scripts/check-vendor-onboarding-ledger.js` | untracked | 2 | Script is referenced by package scripts or repo checks. |
| use | keep | `scripts/check-vendor-onboarding-rules.js` | untracked | 5 | Script is referenced by package scripts or repo checks. |
| use | keep | `scripts/simulate-vendor-onboarding.js` | untracked | 3 | Script is referenced by package scripts or repo checks. |
| use | keep | `scripts/write-governance-heartbeat.js` | untracked | 2 | Script is referenced by package scripts or repo checks. |

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

### similar_content_8

- Kind: similar_content
- Score: 0.326
- Summary: Document content overlap above Sentinel review threshold.
- `docs/GO_TO_MARKET.md`
- `docs/PRODUCT.md`

### similar_content_9

- Kind: similar_content
- Score: 0.392
- Summary: Document content overlap above Sentinel review threshold.
- `docs/PROOF_CASE_OWNERFI.md`
- `docs/WORKFLOW_DEFINITIONS.md`

### similar_content_10

- Kind: similar_content
- Score: 0.373
- Summary: Document content overlap above Sentinel review threshold.
- `docs/README.md`
- `docs/SENTINEL_CATEGORY_APPROVAL_NOTICE_2026-05-04.md`

### similar_content_11

- Kind: similar_content
- Score: 0.363
- Summary: Document content overlap above Sentinel review threshold.
- `docs/README.md`
- `docs/SENTINEL_GOVERNANCE_COMPLIANCE_APPROVAL_REPORT_2026-05-04.md`

### similar_content_12

- Kind: similar_content
- Score: 0.357
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINEL_APPROVAL_NOTICE_2026-05-04.md`
- `docs/SENTINEL_CATEGORY_APPROVAL_NOTICE_2026-05-04.md`

### similar_content_13

- Kind: similar_content
- Score: 0.379
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINEL_APPROVAL_RISK_ANALYSIS_2026-05-04.md`
- `docs/SENTINEL_GOVERNANCE_COMPLIANCE_APPROVAL_REPORT_2026-05-04.md`

### similar_content_14

- Kind: similar_content
- Score: 0.398
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINEL_APPROVAL_RISK_ANALYSIS_2026-05-04.md`
- `docs/SENTINEL_TARGETED_STREAMLINING_APPROVAL_PLAN_2026-05-04.md`

### similar_content_15

- Kind: similar_content
- Score: 0.333
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINEL_CATEGORY_APPROVAL_NOTICE_2026-05-04.md`
- `docs/SENTINEL_GOVERNANCE_COMPLIANCE_APPROVAL_REPORT_2026-05-04.md`

### similar_content_16

- Kind: similar_content
- Score: 0.36
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINEL_CATEGORY_APPROVAL_NOTICE_2026-05-04.md`
- `docs/SENTINEL_TARGETED_STREAMLINING_APPROVAL_PLAN_2026-05-04.md`

### similar_content_17

- Kind: similar_content
- Score: 0.453
- Summary: Document content overlap above Sentinel review threshold.
- `docs/SENTINEL_GOVERNANCE_COMPLIANCE_APPROVAL_REPORT_2026-05-04.md`
- `docs/SENTINEL_TARGETED_STREAMLINING_APPROVAL_PLAN_2026-05-04.md`

### similar_content_18

- Kind: similar_content
- Score: 0.367
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
