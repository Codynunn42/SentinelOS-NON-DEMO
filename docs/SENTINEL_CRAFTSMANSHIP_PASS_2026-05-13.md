# Sentinel Craftsmanship Pass - 2026-05-13

## Status

```txt
[APPROVED:CRAFTSMANSHIP-PASS-APPLIED]
```

Sentinel AI scanned the repository after the Phase 1.1 live verification lock. This pass focused on defects, repeatability, repo truth, and narrow next-step suggestions. No broad cleanup, deletion, archival, or feature expansion was approved or performed.

## Added / Adjusted / Modified

- Added the 2026-05-13 repository organization scan:
  - `docs/SENTINEL_REPO_ORGANIZATION_REPORT_2026-05-13.md`
  - `docs/sentinel-repo-organization-log-2026-05-13.jsonl`
- Adjusted `apps/sentinel/src/faceplanes/sdk/facePlaneSdk.js` to restore required FacePlane manifest constants:
  - `MANIFEST_VERSION`
  - `REQUIRED_FIELDS`
  - `ALLOWED_CAPABILITIES`
  - `TRUST_BY_CAPABILITY`
- Modified `apps/sentinel/src/commands/dispatch.js` so approval-blocked execution responses include the same blocked-response shape as the rest of the command path:
  - `trustScore: 0`
  - `reasons: ["approval_required"]`
- Adjusted `scripts/check-trust-score.js` to validate the current approval-gated blocked execution model instead of the pre-approval-continuity response shape.
- Modified `scripts/check-product-command-routing.js` so the smoke check snapshots and restores its local repo writes. The command path is still exercised, but successful verification no longer leaves timestamp-only config diffs.
- Updated the Phase 1.1 approval board to reflect the release commit/tag as completed instead of waiting.
- Added the 18-artifact decision register:
  - `docs/SENTINEL_ARTIFACT_DECISION_REGISTER_2026-05-13.md`
  - decisions: 8 keep, 9 archive, 0 remove, 0 merge, 1 defer

## Checks Run

| Check | Result | Notes |
| --- | --- | --- |
| `npm run repo:scan` | pass | Generated the 2026-05-13 repo organization report and JSONL log. |
| `npm run check:governance-drift-core` | pass | No governance core drift detected. |
| `npm run check:governance-drift` | pass | No governance drift failure detected. |
| `npm run check:faceplane-sdk` | pass | Passed after restoring manifest constants. |
| `node --check apps/sentinel/src/faceplanes/sdk/facePlaneSdk.js` | pass | Syntax check passed. |
| `npm run check:trust-score` | pass | Approval-required blocked path now validates current continuity behavior. |
| `npm run check:product-commands` | pass | Required localhost bind permission; route check passed after state-preserving fix. |
| `npm run check:policy` | pass | Policy engine check passed. |
| `npm run check:state-anchors` | pass | State anchors check passed. |
| `npm run check:approvals` | pass | Required localhost bind permission; approval read/review and approval-continuity unlock checks passed. |
| `node scripts/mockGovernanceAnalytics.js --report` | pass | Analytics report generated successfully during scan. |

## Errors Found And Addressed

### FacePlane SDK manifest constants

`npm run check:faceplane-sdk` failed because the SDK referenced manifest validation constants that were not present in the module. The constants were restored in the SDK file, and the check now passes.

### Approval-blocked response shape

The trust-score smoke check was still asserting the old non-approval blocked result. The live system now stops protected execution at `APPROVAL_REQUIRED`, so the response shape was standardized to include `trustScore` and `reasons` while preserving approval continuity fields.

### Product command smoke check residue

`npm run check:product-commands` exercised real repo-writing commands and left timestamp-only changes in `config/product.json` and `config/uiLabels.json`. The check now snapshots and restores its stateful files so a passing smoke run is repeatable and does not dirty the worktree.

## Suggestions / Forks

1. Canonical evidence lane: keep `docs/EXECUTIVE_SNAPSHOT_2026-05-12.md` and `docs/PHASE1_APPROVAL_BOARD_2026-05-12.md` as the current Phase 1.1 evidence set. Treat older snapshots and boards as historical unless the owner approves archival.
2. Generated collateral lane: mark generated PDFs as external-deliverable or tie each one to its canonical markdown source before any cleanup.
3. Registry boundary lane: keep `apps/sentinel/src/commands/registry.js` and `apps/sentinel/src/surface/registry.js` separate. Their names overlap, but their responsibilities are different.
4. Drift boundary lane: keep core drift config/monitor files separate from vendor onboarding drift files until a shared interface is clearly needed.
5. CustomerOps TypeScript lane: review the TS plane/RPC/schema files as a separate compatibility pass. Do not merge them into JS runtime files during the Phase 1.1 stabilization window.

## Not Approved In This Pass

- Broad repo cleanup.
- Deleting historical docs.
- Merging similarly named runtime modules.
- Auto-execution after approval.
- New feature scope beyond Phase 1.1 stabilization.

## Current Recommendation

Keep this pass narrow. The repo is in a stronger state after fixing one broken SDK check, one stale smoke assertion, one response-shape gap, and one repeatability issue. The 18 `needs_decision` documentation artifacts are now resolved in `docs/SENTINEL_ARTIFACT_DECISION_REGISTER_2026-05-13.md`; no broad cleanup, deletion, merge, or relocation is approved from those decisions.
