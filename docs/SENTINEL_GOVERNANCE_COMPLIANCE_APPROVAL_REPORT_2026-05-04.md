# Sentinel Governance and Compliance Approval Report - 2026-05-04

## Approval Purpose

This report approves the **mapping-alignment work** required before system mapping or streamlining begins.

The goal is to make every governance and compliance change traceable to:

- the approval item
- the control it supports
- the repository location where that control is implemented or documented
- the reason the control matters
- the next step required before broader approval

This is not approval for broad cleanup, deletion, archival, merge consolidation, or runtime refactor.

## Approval Decision

| Badge | Decision | Meaning |
| --- | --- | --- |
| `[APPROVED:MAPPING]` | Approved | Sentinel may add or clarify mapping documentation and approval evidence. |
| `[APPROVED:EVIDENCE]` | Approved | Evidence artifacts may be kept as internal approval records. |
| `[APPROVE:CONDITIONAL]` | Conditional | May become approved after the listed mapping/evidence condition is complete. |
| `[HOLD:REVIEW]` | Hold | Do not approve as canonical or external until the listed control mapping is complete. |
| `[KEEP:ACTIVE]` | Keep | Active runtime/control surface. Protect from cleanup. |
| `[REVIEW:SIMILARITY]` | Review | Similarity requires review, not cleanup. |
| `[STREAMLINE:NOT_READY]` | Not Ready | No streamlining approved yet. |

Sentinel approval for this phase:

`[APPROVED:MAPPING]` Proceed with mapping alignment, docs index alignment, source-to-artifact mapping, and governance evidence capture.

## Control Mapping Summary

| Control Area | Repository Mapping | Why It Matters |
| --- | --- | --- |
| Identity-bound execution | `apps/sentinel/src/security/keyRegistry.js`, `docs/GOVERNANCE_PREFLIGHT.md` | Protected actions must resolve to tenant, actor, role, and scopes before execution. |
| Policy preflight | `apps/sentinel/src/governance/policyEngine.js`, `apps/sentinel/src/governance/preflight.js`, `apps/api/server.js` | Commands and protected routes must be allowed before handlers run. |
| Approval read vs review | `apps/api/server.js`, `apps/sentinel/src/approval/approval.js`, `apps/sentinel/src/approval/store.js`, `docs/GOVERNANCE_PREFLIGHT.md` | Operators can inspect approvals without gaining approval/rejection authority. |
| Tenant isolation | `apps/sentinel/src/types/command.js`, `apps/sentinel/src/surface/registry.js`, `apps/api/server.js` | OwnerFi, HotelOps, and future tenants must route through shared core without cross-tenant leakage. |
| Audit and receipts | `apps/sentinel/src/audit/auditLogger.js`, `apps/api/server.js`, `docs/GOVERNANCE_PREFLIGHT.md` | Decisions, blocked actions, approval reads, and command results need traceable audit evidence. |
| Drift governance | `apps/sentinel/src/governance/core/*`, `scripts/check-drift-governance-core.js`, `scripts/check-governance-drift-monitor.js` | Threshold changes and drift acknowledgements require governed evidence before presentation or expansion. |
| Vendor onboarding compliance | `apps/sentinel/src/governance/vendorOnboarding/*`, `docs/VENDOR_ONBOARDING_RULE_SET_V1.md`, `scripts/check-vendor-onboarding-rules.js` | Vendor onboarding claims must map to deterministic rules, NVOP thresholds, escalation, and audit ledger behavior. |
| Operator escalation | `apps/api/public/operator-escalations.html`, `apps/sentinel/src/governance/vendorOnboarding/operatorEscalation.js`, `scripts/check-operator-escalation.js` | Human decisions must require rationale, policy reference, risk acknowledgement, and immutable decision evidence. |
| Faceplane activation | `docs/NUNN_GOVERNANCE_DOCTRINE_v1.md`, `apps/sentinel/src/faceplanes/openai/*`, `scripts/check-openai-faceplane.js` | New faceplanes need tenant boundary, validation evidence, drift stability, RBAC, and audit export before external activation. |
| Public collateral control | `docs/COMMERCIAL_ASSETS_2026-04-29.md`, `docs/ARIZONA_SPO_MODERNIZATION_BRIEF_LAYOUT.md`, generated PDFs | External-facing claims must be tied to approved source documents and current proof boundaries. |

## Approval Item Mapping

| Badge | Approval Item | Mapping Required | Current Mapping Location | Governance / Compliance Reason | Next Step To Reach Approval |
| --- | --- | --- | --- | --- | --- |
| `[APPROVED:EVIDENCE]` | `docs/SENTINEL_REPO_ORGANIZATION_REPORT_2026-05-04.md` | Scan evidence -> approval queue | `docs/sentinel-repo-organization-log-2026-05-04.jsonl` | Preserves why files were classified before any action. | Keep as evidence; re-run after mapping updates. |
| `[APPROVED:EVIDENCE]` | `docs/SENTINEL_APPROVAL_RISK_ANALYSIS_2026-05-04.md` | Risk -> approval decision | This report and risk matrix | Shows why approval/hold/conditional states exist. | Keep as approval evidence. |
| `[APPROVED:MAPPING]` | `docs/SENTINEL_TARGETED_STREAMLINING_APPROVAL_PLAN_2026-05-04.md` | Approval class -> next action | Approval badge tables and work order | Prevents broad cleanup and constrains work to targeted mapping. | Keep as action gate. |
| `[APPROVE:CONDITIONAL]` | `docs/COMMERCIAL_ASSETS_2026-04-29.pdf` | PDF -> Markdown source -> approved claim boundary | `docs/COMMERCIAL_ASSETS_2026-04-29.md` | Prevents collateral drift and unsupported external claims. | Add source/deliverable mapping in `docs/README.md`. |
| `[APPROVE:CONDITIONAL]` | `docs/README.md` | Docs index -> canonical source by lane | Existing docs folder plus this approval report | Operators need one place to find the current source of truth. | Update with canonical mapping table. |
| `[APPROVE:CONDITIONAL]` | `docs/VENDOR_ONBOARDING_RULE_SET_V1.md` | Rule doc -> code -> verification script | `apps/sentinel/src/governance/vendorOnboarding/*`, `scripts/check-vendor-onboarding-rules.js` | Compliance claims must match deterministic implementation. | Add/check code pointers and test result reference. |
| `[APPROVE:CONDITIONAL]` | `package.json` | Operator command registry -> verified scripts | `package.json`, `scripts/check-*.js`, `scripts/simulate-vendor-onboarding.js` | Official commands must be runnable and mapped to controls. | Keep only verified scripts in approved operator path. |
| `[APPROVE:CONDITIONAL]` | `scripts/sentinel-repo-organization-scan.js` | Repo scan -> JSONL log -> approval report | `docs/sentinel-repo-organization-log-2026-05-04.jsonl` | Scan recommendations must stay evidence-only and human-gated. | Document read/report-only behavior before operator use. |
| `[HOLD:REVIEW]` | `docs/ARIZONA_SPO_MODERNIZATION_BRIEF_LAYOUT.md` | Public-sector brief -> draft status -> evidence claims | Vendor onboarding controls, drift controls, audit ledger controls | Government-facing language can imply readiness or authority. | Add owner, version, discussion-draft status, and evidence mapping. |
| `[HOLD:REVIEW]` | `docs/ARIZONA_SPO_MODERNIZATION_BRIEF_LAYOUT.pdf` | PDF -> approved Markdown source -> audience | `docs/ARIZONA_SPO_MODERNIZATION_BRIEF_LAYOUT.md` | PDF can circulate outside repo context. | Hold until Markdown source is approved and PDF is regenerated or labeled draft. |
| `[HOLD:REVIEW]` | `docs/DAILY_BRIEF_2026-04-23.md` | Daily brief -> historical snapshot policy | Daily report/brief docs | Historical state should not be merged or overwritten as "duplicate." | Define retention rule. |
| `[HOLD:REVIEW]` | `docs/DAILY_BRIEF_2026-04-24.md` | Daily brief -> historical snapshot policy | Daily report/brief docs | Preserves operating chronology and decision context. | Define retention rule and compare with 2026-04-23. |
| `[HOLD:REVIEW]` | `docs/NUNN_GOVERNANCE_DOCTRINE_v1.md` | Doctrine -> enforceable controls | Faceplane routes, drift checks, key/scopes, approval ledger | Policy language must map to enforceable checks before becoming doctrine. | Create enforcement mapping table before approval. |

## Active Control Surfaces To Protect

These are mapped as `[KEEP:ACTIVE]`. They are not cleanup targets.

| Badge | Surface | Control Mapping | Reason |
| --- | --- | --- | --- |
| `[KEEP:ACTIVE]` | `apps/api/server.js` | Auth, route authorization, audit, approval read/review, tenant filters | This is the live control boundary for API behavior. |
| `[KEEP:ACTIVE]` | `apps/api/public/proof.html` | Proof/XE demo surface -> `/v1/command` and `/v1/audit` | Active proof surface must stay aligned with command contract. |
| `[KEEP:ACTIVE]` | `apps/api/public/operator-escalations.html` | Operator decisions -> escalation route -> ledger | Human review UI supports governed escalation. |
| `[KEEP:ACTIVE]` | `apps/sentinel/src/governance/policyEngine.js` | command/scope/role policy map | Controls allow/block decisions and approval requirements. |
| `[KEEP:ACTIVE]` | `apps/sentinel/src/security/keyRegistry.js` | tenant, actor, role, scopes | Prevents secret-only execution. |
| `[KEEP:ACTIVE]` | `apps/sentinel/src/commands/ownerfiHandlers.js` | OwnerFi command handlers | Active workflow proof path. |
| `[KEEP:ACTIVE]` | `apps/sentinel/src/governance/core/*` | drift config, drift monitor, status, ledger | Core governance drift evidence. |
| `[KEEP:ACTIVE]` | `apps/sentinel/src/governance/vendorOnboarding/*` | rules, engine, drift, ledger, escalation | Vendor onboarding compliance runtime. |
| `[KEEP:ACTIVE]` | `apps/sentinel/src/faceplanes/openai/*` | faceplane config, workflow, audit adapter | Faceplane activation must remain tenant-governed. |

## Governance And Compliance Next Steps

### Step 1 - Update Canonical Docs Mapping

Create or update `docs/README.md` with:

- canonical source by lane
- approval badge
- governance mapping
- verification command
- external-use status

Reason: prevents operators from using stale or uncategorized docs.

### Step 2 - Add Source-To-Deliverable Mapping

Map generated PDFs to their source Markdown:

- `docs/COMMERCIAL_ASSETS_2026-04-29.pdf` -> `docs/COMMERCIAL_ASSETS_2026-04-29.md`
- `docs/ARIZONA_SPO_MODERNIZATION_BRIEF_LAYOUT.pdf` -> `docs/ARIZONA_SPO_MODERNIZATION_BRIEF_LAYOUT.md`

Reason: prevents PDF/source drift and external claim mismatch.

### Step 3 - Map Governance Doctrine To Enforcement

Before approving `docs/NUNN_GOVERNANCE_DOCTRINE_v1.md`, map each doctrine claim to:

- route or module
- verification script
- approval boundary
- audit event

Reason: policy language must be enforceable, not aspirational.

### Step 4 - Preserve Historical Briefs

Add a retention rule:

- daily briefs are immutable historical snapshots unless explicitly superseded by a named status report
- similarity between daily briefs is not sufficient for streamlining

Reason: protects operating chronology and decision history.

### Step 5 - Verify Package Command Registry

The new package scripts have passed locally, but approval should record the commands as operator surfaces:

- governance drift checks
- governance status
- media polish command check
- OpenAI faceplane check
- operator escalation check
- vendor onboarding checks
- governance heartbeat
- containment posture
- vendor onboarding simulation

Reason: once commands are in `package.json`, they become official operator affordances.

### Step 6 - Re-run Repository Scan

After mapping updates:

```sh
node scripts/sentinel-repo-organization-scan.js
```

Reason: approval evidence should reflect the final mapped state, not the pre-mapping state.

## Approval Record

| Approval | Badge | Decision | Reason |
| --- | --- | --- | --- |
| Mapping alignment work | `[APPROVED:MAPPING]` | Approved on 2026-05-04 | Required before system mapping or targeted streamlining. |
| Broad cleanup | `[STREAMLINE:NOT_READY]` | Not approved | No item has been approved for deletion, archive, or merge. |
| Evidence reports | `[APPROVED:EVIDENCE]` | Approved on 2026-05-04 | Needed to preserve decision history. |
| Conditional docs | `[APPROVE:CONDITIONAL]` | Pending | Need source/canonical mapping. |
| Held docs | `[HOLD:REVIEW]` | Pending | Need draft, retention, or enforcement mapping. |
| Active runtime surfaces | `[KEEP:ACTIVE]` | Protected | Needed for current proof, governance, and compliance paths. |

Approval notice: `docs/SENTINEL_APPROVAL_NOTICE_2026-05-04.md`

## Sentinel Recommendation

Approve this report as the mapping-alignment authority. Then perform the mapping updates in this order:

1. `docs/README.md` canonical mapping table.
2. Source-to-PDF mapping notes.
3. Governance doctrine enforcement map.
4. Daily brief retention rule.
5. Re-run repository scan.

Only after those steps should Sentinel propose any actual targeted streamlining patch.
