# Sentinel Targeted Streamlining Approval Plan - 2026-05-04

## Decision Position

Sentinel recommends **targeted streamlining only**.

That means:

- no broad cleanup
- no deletion
- no archiving
- no canonical promotion without owner approval
- no streamlining of runtime files unless tests prove the active path is preserved

This plan converts every current classification into the next action required to reach approval.

## Approval Classes

| Class | Meaning | Current Action |
| --- | --- | --- |
| Approved Evidence | Safe to keep as a scan/decision artifact. | Accept into repo evidence set. |
| Conditional Approval | Useful, but needs one more proof or ownership step. | Complete listed condition, then approve. |
| Hold | Valuable but not safe to approve as canonical yet. | Add missing status/evidence, then re-review. |
| Use / Keep | Active runtime or operational support surface. | Keep out of cleanup; verify before release. |
| Streamline Candidate | Can be consolidated only after explicit approval. | None currently approved. |
| Deny | Do not use. | None currently identified. |

## Approval Badges

| Badge | Meaning |
| --- | --- |
| `[APPROVED:EVIDENCE]` | Approved as an internal evidence artifact. |
| `[APPROVE:CONDITIONAL]` | Approval is recommended after the listed condition is completed. |
| `[HOLD:REVIEW]` | Hold for owner/canonical-status review. |
| `[KEEP:ACTIVE]` | Active runtime, UI, or operator support surface; keep out of cleanup. |
| `[REVIEW:SIMILARITY]` | Similarity detected; review only, not a cleanup approval. |
| `[STREAMLINE:NOT_READY]` | Not authorized for streamlining yet. |
| `[DENY:NONE]` | No denial currently recommended. |

## Current Gate Summary

| Classification | Count | Gate |
| --- | ---: | --- |
| Approved Evidence | 1 | Keep as internal approval artifact. |
| Conditional Approval | 5 | Finish proof/ownership condition. |
| Hold | 5 | Do not approve until status and authority are clarified. |
| Use / Keep | 17 | Keep; do not streamline. |
| Streamline Candidate | 0 | No automatic streamline action. |
| Deny | 0 | No denial action. |

## Approved Evidence

| Badge | Item | Why It Can Be Approved | Next Step |
| --- | --- | --- | --- |
| `[APPROVED:EVIDENCE]` | `docs/SENTINEL_REPO_ORGANIZATION_REPORT_2026-05-04.md` | Internal scan artifact with no runtime behavior and no external claim surface. | Approve as current evidence. Re-run scanner after approval decisions or major file changes. |

## Conditional Approval Path

These are close, but they should not be treated as fully approved until the listed condition is complete.

| Badge | Item | Current Risk | Condition To Reach Approval | Sentinel Next Action | Approval Outcome After Condition |
| --- | --- | --- | --- | --- | --- |
| `[APPROVE:CONDITIONAL]` | `docs/COMMERCIAL_ASSETS_2026-04-29.pdf` | Medium | Confirm `docs/COMMERCIAL_ASSETS_2026-04-29.md` is the canonical source and PDF was generated from it. | Add a source/deliverable note to the docs index. | Approve as external-ready collateral. |
| `[APPROVE:CONDITIONAL]` | `docs/README.md` | Medium | Convert into canonical docs index by lane. | Add links/status for proof, deployment, governance, commercial, vendor onboarding, and reports. | Approve as canonical navigation surface. |
| `[APPROVE:CONDITIONAL]` | `docs/VENDOR_ONBOARDING_RULE_SET_V1.md` | Medium | Keep aligned with `vendor-onboarding-v1.0` and passing rule checks. | Reference passing `npm run check:vendor-onboarding`; add canonical code pointers if missing. | Approve as operator/auditor reference. |
| `[APPROVE:CONDITIONAL]` | `package.json` | Medium -> Low/Medium after checks | Keep only package scripts that passed local verification. | Preserve passed scripts; mark any future new scripts experimental until verified. | Approve as operator command registry. |
| `[APPROVE:CONDITIONAL]` | `scripts/sentinel-repo-organization-scan.js` | Medium | Keep read/report-only and document human approval before changes. | Add npm script or docs entry only after owner approval. | Approve as governed repo scan utility. |

## Hold Path

These should not be approved as canonical or externally usable yet.

| Badge | Item | Hold Reason | What Is Needed To Reach Approval | Sentinel Next Action |
| --- | --- | --- | --- | --- |
| `[HOLD:REVIEW]` | `docs/ARIZONA_SPO_MODERNIZATION_BRIEF_LAYOUT.md` | Public-sector proposal language can be mistaken for an official deliverable. | Add owner, version, date, `Discussion Draft`, evidence status, and external-use boundary. | Prepare a draft header/status block; do not publish. |
| `[HOLD:REVIEW]` | `docs/ARIZONA_SPO_MODERNIZATION_BRIEF_LAYOUT.pdf` | PDF can circulate without repo context. | Confirm source Markdown, draft status, version, and approved audience. | Hold until Markdown source is approved; then regenerate or label PDF. |
| `[HOLD:REVIEW]` | `docs/DAILY_BRIEF_2026-04-23.md` | Historical daily record; similarity does not mean duplicate. | Define retention rule: immutable daily snapshot vs summarized status archive. | Leave untouched; propose retention rule. |
| `[HOLD:REVIEW]` | `docs/DAILY_BRIEF_2026-04-24.md` | Historical daily record; should not be merged casually. | Compare with 2026-04-23 and decide whether both remain immutable records. | Leave untouched; propose retention rule. |
| `[HOLD:REVIEW]` | `docs/NUNN_GOVERNANCE_DOCTRINE_v1.md` | Policy-setting language without enforcement mapping. | Map doctrine to checks, scopes, approval ledger behavior, and tenant activation gates. | Prepare enforcement mapping before approval. |

## Use / Keep Path

These are active surfaces or verified support scripts. They should be protected from streamlining unless a later change is scoped and tested.

| Badge | Item | Why Keep | Next Approval Step |
| --- | --- | --- | --- |
| `[KEEP:ACTIVE]` | `apps/api/public/operator-escalations.html` | Served operator surface for escalation review. | Verify route loads through API before release. |
| `[KEEP:ACTIVE]` | `apps/api/public/proof.html` | Active proof/XE demo surface. | Keep; verify `/proof`, `Ctrl + K`, and demo command flow after any UI edits. |
| `[KEEP:ACTIVE]` | `apps/api/server.js` | Active API route host and governance boundary. | Keep; run syntax and targeted route checks after changes. |
| `[KEEP:ACTIVE]` | `apps/sentinel/src/commands/ownerfiHandlers.js` | Active OwnerFi command handlers. | Keep; run command/proof checks after changes. |
| `[KEEP:ACTIVE]` | `apps/sentinel/src/governance/policyEngine.js` | Active policy and scope enforcement. | Keep; run `npm run check:policy`. |
| `[KEEP:ACTIVE]` | `apps/sentinel/src/security/keyRegistry.js` | Active key/scope registry. | Keep; run `npm run check:keys` and approval access checks. |
| `[KEEP:ACTIVE]` | `scripts/check-containment-posture.js` | Passed containment posture verification. | Keep if package script remains. |
| `[KEEP:ACTIVE]` | `scripts/check-drift-governance-core.js` | Passed core drift governance verification. | Keep if package script remains. |
| `[KEEP:ACTIVE]` | `scripts/check-governance-drift-monitor.js` | Passed governance drift monitor verification. | Keep if package script remains. |
| `[KEEP:ACTIVE]` | `scripts/check-governance-status.js` | Passed governance status verification. | Keep if package script remains. |
| `[KEEP:ACTIVE]` | `scripts/check-media-polish.js` | Passed media polish command verification. | Keep if package script remains. |
| `[KEEP:ACTIVE]` | `scripts/check-openai-faceplane.js` | Passed OpenAI faceplane verification. | Keep if package script remains. |
| `[KEEP:ACTIVE]` | `scripts/check-operator-escalation.js` | Passed operator escalation verification. | Keep if package script remains. |
| `[KEEP:ACTIVE]` | `scripts/check-vendor-onboarding-ledger.js` | Passed vendor onboarding ledger verification. | Keep if package script remains. |
| `[KEEP:ACTIVE]` | `scripts/check-vendor-onboarding-rules.js` | Passed vendor onboarding rule verification. | Keep if package script remains. |
| `[KEEP:ACTIVE]` | `scripts/simulate-vendor-onboarding.js` | Passed 1,000-case simulation. | Keep if package script remains. |
| `[KEEP:ACTIVE]` | `scripts/write-governance-heartbeat.js` | Passed governance heartbeat check. | Keep if package script remains. |

## Similarity Group Next Steps

These are not cleanup approvals. They are review prompts.

| Badge | Group | Files | Risk | Next Step |
| --- | --- | --- | --- | --- |
| `[REVIEW:SIMILARITY]` | README group | `README.md`, `apps/README.md`, `docs/README.md`, `infrastructure/README.md`, `services/README.md` | Medium | Keep all for now; make `docs/README.md` the docs index and leave area READMEs scoped to their folders. |
| `[REVIEW:SIMILARITY]` | Registry group | `apps/sentinel/src/commands/registry.js`, `apps/sentinel/src/surface/registry.js` | Medium | Keep both until architecture clarifies command registry vs surface registry responsibilities. |
| `[REVIEW:SIMILARITY]` | Forethought Interpretation group | `apps/sentinel/src/forethought/interpretation.js`, `apps/sentinel/src/learning/interpretation.js` | Medium | Keep both modules; document responsibility split before consolidation. |
| `[REVIEW:SIMILARITY]` | Drift config group | core and vendor onboarding drift configs | Medium | Keep both; core drift and vendor-specific drift are separate planes. |
| `[REVIEW:SIMILARITY]` | Drift monitor group | core and vendor onboarding drift monitors | Medium | Keep both; do not merge without shared interface design. |
| `[REVIEW:SIMILARITY]` | Engine group | vendor onboarding engine and learning engine | Low/Medium | Keep both; same name does not mean same role. |
| `[REVIEW:SIMILARITY]` | Daily brief group | `docs/DAILY_BRIEF_2026-04-23.md`, `docs/DAILY_BRIEF_2026-04-24.md` | Medium | Hold; define daily brief retention rule. |
| `[REVIEW:SIMILARITY]` | GTM/product group | `docs/GO_TO_MARKET.md`, `docs/PRODUCT.md` | Medium | Keep both; later assign GTM vs product source-of-truth boundary. |
| `[REVIEW:SIMILARITY]` | OwnerFi workflow group | `docs/PROOF_CASE_OWNERFI.md`, `docs/WORKFLOW_DEFINITIONS.md` | Medium | Keep both; later mark one as narrative proof case and one as command contract. |

## Targeted Streamlining Work Order

### Step 1 - Approve Evidence

- Approve `docs/SENTINEL_REPO_ORGANIZATION_REPORT_2026-05-04.md`.
- Approve `docs/SENTINEL_APPROVAL_RISK_ANALYSIS_2026-05-04.md`.
- Approve this plan as the action gate for targeted streamlining.

### Step 2 - Lock The No-Cleanup Boundary

- Record that no file is deleted, archived, moved, or merged in this phase.
- Treat all similarity groups as review prompts only.

### Step 3 - Finish Conditional Approvals

- Add canonical source note for commercial PDF.
- Update `docs/README.md` into a canonical docs index.
- Confirm vendor onboarding docs map to the passing rule check.
- Keep verified package scripts.
- Decide whether to add `sentinel-repo-organization-scan` as an npm script.

### Step 4 - Resolve Held Docs

- Add draft/status metadata to Arizona SPO Markdown.
- Pair Arizona PDF to approved Markdown or mark it draft-only.
- Define daily brief retention rule.
- Map governance doctrine to enforcement checks before approving.

### Step 5 - Re-scan

- Run `node scripts/sentinel-repo-organization-scan.js`.
- Compare new log/report to this plan.
- Only then propose the first actual streamline patch.

## Approval Checklist

| Approval | Status | Required Evidence |
| --- | --- | --- |
| Classification report accepted | Approved on 2026-05-04 | Repo organization report exists. |
| Risk analysis accepted | Approved on 2026-05-04 | Approval risk report exists. |
| Targeted streamlining plan accepted | Approved on 2026-05-04 | This plan exists. |
| Broad cleanup denied | Approved boundary on 2026-05-04 | Owner confirms no broad cleanup. |
| Conditional docs approved | Pending | Source/canonical metadata added. |
| Held docs resolved | Pending | Draft/canonical/archive decisions recorded. |
| Runtime surfaces protected | Ready | Active files marked use/keep. |
| First streamline patch authorized | Not ready | Re-scan after approvals. |

Approval notice: `docs/SENTINEL_APPROVAL_NOTICE_2026-05-04.md`

## Sentinel Recommendation

Approve the first three evidence artifacts and the no-cleanup boundary now. Then run the conditional approval work as a documentation/indexing pass, not as a deletion pass.
