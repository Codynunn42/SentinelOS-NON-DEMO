# Nunn Corporation Master Operating Binder - 2026-06-15

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud
**Mode:** authoritative operating binder; review-held
**Binder Role:** constant source for Executive and Board templates
**Authority Created:** false

## Binder Control Rule

The Master Operating Binder is the standing operating record for Nunn
Corporation, NunnCloud, and SentinelOS governance. Executive templates and Board
templates should refresh from this binder rather than replacing it.

This binder is not a release approval, deployment approval, external-use
approval, or runtime-change approval.

## Evidence Baseline

```yaml
observed_on: 2026-06-15
repository:
  path: /Users/codynunn/SentinelOS/SentinelOS-NON-DEMO/SentinelOS-NON-DEMO
  branch: main
  relation_to_origin_main: ahead_8_behind_0
  latest_commit: 6ffa75f
  latest_commit_subject: docs_add_sovereign_tier_IP_attorney_brief
  modified_tracked_entries: 11
  staged_entries: 0
  untracked_file_count: 95
  porcelain_status_entries: 104
  worktree_classification: dirty_mixed_scope
  persistence_authorized: false
```

## Corporate Charter

| Field | Binder Record | Classification |
| --- | --- | --- |
| Organization | Nunn Corporation | operator-provided; accepted for binder context |
| Platform Ecosystem | NunnCloud | supported by repository docs and naming |
| Operating Platform | SentinelOS | supported by repository runtime/docs |
| Governance Framework | Autonomous Governance System / governed execution | supported as doctrine and operating model |
| Strategic Philosophy | sovereignty, composability, trust by design, human oversight, open evolution | accepted as strategic language |

## Mission And Vision

**Mission:** Sentinel exists to make AI accountable.

**Vision:** Sentinel is the Authority Layer for Artificial Intelligence. It
ensures every AI action has a verified origin, an approved authority chain, and
a permanent record of accountability so people remain accountable for what AI
does.

The prior strategic steering document is cancelled for active display and
current-direction use. The active steering correction is
`docs/governance/SENTINEL_STEERING_DOCUMENT_CANCELLATION_AND_AUTHORITY_LAYER_DIRECTION_2026-06-18.md`.

## Governance Hierarchy

| Function | Current Binder State | Completion Need |
| --- | --- | --- |
| Board of Directors | not fully populated | provide legal Board roster or mark as founder-led pending formalization |
| CEO | Cody Nunn, operator-provided | verify legal role/title for external records |
| COO | TBD | assign or mark vacant |
| CFO | TBD | assign or mark vacant |
| CRO | TBD | assign or mark vacant |
| CTO | TBD | assign or mark vacant |
| CISO | TBD | assign or mark vacant |

## Decision Authority Matrix

| Level | Authority | Current Settlement |
| --- | --- | --- |
| Strategic | Board / founder-led governance | active for review-held decisions |
| Architectural | Platform Council | needs formal roster and charter |
| Operational | Platform Team | needs owner assignments |
| Tactical | Contributors / delegated operators | must remain bounded by approvals and audit |

## Governance Controls

| Control | Binder State | Evidence |
| --- | --- | --- |
| AI operating setup hold | active | `docs/governance/SENTINEL_AI_CHANGE_HOLD_DECLARATION_2026-06-11.md` |
| Repository movement hold | active | Board and manifest review docs |
| Staging/commit/push hold | active | `docs/governance/EXACT_RELEASE_STAGING_MANIFEST_REVIEW_RESULT_2026-06-15.md` |
| Runtime mutation hold | active | executive and board templates |
| Secret/KQL/database-write hold | active | governance settlement and board holds |
| External contact/share hold | active | cadence and release packet non-authorizations |
| Daily brief retention | active | `docs/governance/DAILY_BRIEF_RETENTION_RULE.md` |

## Enterprise Architecture Record

| Component | Binder Classification | Current Boundary |
| --- | --- | --- |
| SentinelOS | implemented governance/runtime surface | release execution held |
| Sentinel API | implemented Node runtime surface | local runtime health not certified in this binder |
| Nexus UI | concept / future or external surface in this checkout | not implemented as current runnable service here |
| Bhindi | fixture/POC concept in current checkout | no production runtime verified |
| Vault | Azure Key Vault metadata recorded; HashiCorp Vault runtime unverified | no secret or value access authorized |
| PostgreSQL Memory Layer | bounded local count evidence exists | end-to-end live wiring unverified |
| Azure deployment footprint | bounded metadata recorded | deployed source commit lineage unresolved |
| IBM server | unverified | no procurement, serial, delivery, rack, or operating evidence found |

## Technology Portfolio

| Application / Surface | Current Binder State | Completion Need |
| --- | --- | --- |
| Sentinel API | runtime path exists via `node apps/api/server.js` | local health and release checks must be run under exact gate |
| Nexus UI | not current implemented service in this checkout | decide whether planned module or external repo |
| CDNLUX Backend | integration inventory exists | confirm source repo and active runtime status |
| NunnPay Wallet | referenced portfolio surface | verify current repo/runtime ownership |
| Base MiniApp | referenced portfolio surface | verify current repo/runtime ownership |
| Entity Inquiry Portal | local preparation surface exists | external activation held |
| Government Outcomes Surface | local preparation surface exists | external activation held |

## July 3 OwnerFi Financial Domain Addendum

OwnerFi is the Nunn Corporation internal financial management domain.
AI Financial Management is not a parallel product lane beside OwnerFi; it is a
capability set inside OwnerFi.

```yaml
ownerfi_domain:
  role: internal_financial_management_domain
  governs:
    - treasury
    - budgeting
    - forecasting
    - revenue_intelligence
    - accounts_payable
    - accounts_receivable
    - payroll_governance
    - expense_governance
    - financial_receipts
    - executive_financial_dashboard
    - financial_ai_agents
  ai_financial_management:
    classification: ownerfi_capability_set
    migration_status: planned_review_held
  source_decision: docs/GBP/assessments/OWNERFI_INTERNAL_FINANCIAL_DOMAIN_AND_MOB_ALIGNMENT_DECISION_2026-07-03.md
  next_gate: PREPARE_OWNERFI_AI_FINANCIAL_MANAGEMENT_MIGRATION_MANIFEST
  authority_created: documentation_classification_only
```

Relationship rule:

| Surface | Binder Responsibility |
| --- | --- |
| Deal Execution Engine | Generates customer revenue and routes customer-facing deal work. |
| SINTENEX / Sintinex | Governs commercial packaging, trigger review, timed-event posture, and launch routing. |
| OwnerFi | Records, analyzes, forecasts, approves, and reports internal financial operations. |
| SendCOMM | Candidate SentinelOS origin / communications lineage component; GitHub source access pending. |
| SentinelOS | Orchestrates governance, authority, receipts, workflows, and audit controls. |
| Sentinel AI | Provides intelligence across domains under authority and approval boundaries. |

## July 3 Master Operating Blueprint Overlay

The current operating-model overlay is
`docs/GBP/doctrine/JULY_03_MASTER_OPERATING_BLUEPRINT_OVERLAY_2026-07-03.md`.

```yaml
overlay_role: current_operating_model_layer
mob_constant: true
phase_1: Infra_and_Health_Gate
phase_2: Bounded_Prep_Packets
phase_3: Scope_Finalization
ownerfi_module_manifest: docs/governance/OWNERFI_AI_FINANCIAL_MANAGEMENT_MODULE_ARCHITECTURE_AND_MANIFEST_RESULT_2026-07-03.md
sendcomm_migration_review: docs/governance/SENDCOMM_SENTINELOS_MIGRATION_REVIEW_RESULT_2026-07-03.md
july_03_sequence_completion: docs/GBP/assessments/JULY_03_OPERATING_SEQUENCE_COMPLETION_RESULT_2026-07-03.md
stripe_sandbox_evidence_plan: docs/governance/STRIPE_NON_PRODUCTION_CONFIGURATION_EVIDENCE_PLAN_2026-07-03.md
authority_created: false
```

## Trust And Security Framework

| Trust Area | Binder Record | Evidence Boundary |
| --- | --- | --- |
| Trust tier model | Public, Standard, Elevated, Sovereign | doctrine and sovereign docs present |
| AI sovereignty policy | declare scope, transparency, override, sovereignty, versioning | policy language active; implementation gates held |
| Approval controls | local approval check passed when localhost binding was authorized | point-in-time local test only |
| Execution trace controls | execution trace completeness check passed | local check only |
| Repo control | repo control layer check passed | local check only |
| Sovereign license | asymmetric signature check passed | local check only |

## Build And Verification Standing

| Check / Build Surface | Result | Binder Classification |
| --- | --- | --- |
| `npm run check:policy` | passed | verified local governance check |
| `npm run check:approvals` | passed after localhost bind authorization | verified local approval check |
| `npm run check:docking` | passed | verified local protocol check |
| `npm run check:repo-control` | passed | verified local control check |
| `npm run check:execution-trace-completeness` | passed | verified local trace check |
| `npm run check:sovereign-license` | passed | verified local license check |
| `npm run check:sentinel-nexus-bhindi-vault-read-only-poc` | passed after localhost bind authorization | fixture-only POC check; not production runtime proof |
| `npm run check:task-templates` | failed assertion: expected `undefined`, actual `[APPROVE]` | open build/governance blocker |
| `npm run healthcheck` | failed because no local API server was running | environment not running; not a code health pass |
| Docker build | not run | no build certification |

## MOB Completion Queue

| Priority | Completion Item | Why It Matters | Current Gate |
| ---: | --- | --- | --- |
| 1 | Approve Executive Desk runtime restore execution | `ca-nc-dev-sentinel` is failed with no ingress or active revision; public reachability did not clear; restore path should advance under explicit approval | `APPROVE_EXECUTIVE_DESK_RUNTIME_RESTORE_EXECUTION` |
| 2 | Execute Executive Desk runtime restore | restore must prove health, ready, command query, command submission, and receipt route before claims reopen | `RUN_EXECUTIVE_DESK_RUNTIME_RESTORE_EXECUTION` |
| 3 | Resolve or classify `check:task-templates` failure | local governance check currently fails; failure classified as task-template approval badge contract drift | `PREPARE_EXACT_TASK_TEMPLATE_BADGE_CONTRACT_REPAIR_MANIFEST` |
| 4 | Complete NC-SOS-001 persistence lane | dirty mixed-scope worktree blocks release cleanliness | `APPROVE_STAGE_AND_COMMIT_REFRESHED_RELEASE_V1_GOVERNANCE_PACKET_DOCS_ONLY` |
| 5 | Decide missing schema/config paths | release/support docs reference paths not fully present | exact scaffold-or-hold review |
| 6 | Establish deployed source commit lineage | Azure metadata does not prove deployed source commit; Executive Desk restore now makes provenance the active gate | read-only provenance verification |
| 7 | Verify Memory Layer end-to-end wiring | database counts do not prove Sentinel/Clarity production wiring | bounded read-only runtime verification |
| 8 | Confirm organization roster and decision owners | Board/executive templates still contain TBD authority owners | owner-provided governance update |
| 9 | Classify Nexus, Bhindi, Vault as implemented/fixture/planned/external | prevents architecture overstatement | architecture inventory review |
| 10 | Run local runtime health with API started | healthcheck currently lacks running local server | exact local runtime verification |
| 11 | Decide external activation for inquiry/government surfaces | local preparation does not authorize use | exact activation review |
| 12 | Refresh release manifest after MOB/template additions | new docs change the exact staging universe | refreshed manifest review |
| 13 | Prepare OwnerFi AI Financial Management migration manifest | OwnerFi is now the internal financial management domain and AI Financial Management must be reorganized as OwnerFi modules | `PREPARE_OWNERFI_AI_FINANCIAL_MANAGEMENT_MIGRATION_MANIFEST` |
| 14 | Prepare Stripe checkout configuration approval packet | owner approved revenue conversations but live payment remains held | `PREPARE_STRIPE_CHECKOUT_CONFIGURATION_APPROVAL_PACKET` |
| 15 | Prepare customer implementation scope and risk packet | owner did not approve production customer execution or customer onboarding | `PREPARE_CUSTOMER_IMPLEMENTATION_SCOPE_AND_RISK_PACKET` |
| 16 | Maintain July 3 Master Operating Blueprint overlay | ecosystem now needs a single current operating-model layer over the MOB constant | `MAINTAIN_JULY_03_MASTER_OPERATING_BLUEPRINT_OVERLAY` |
| 17 | Verify OwnerFi AI Financial Management checksum manifest before movement | 84 discovered assets must preserve integrity before any file movement | `CHECK_OWNERFI_AI_FINANCIAL_MANIFEST` |
| 18 | Locate SendCOMM source and prepare read-only SentinelOS migration inventory | owner identified SendCOMM as the beginning of SentinelOS; source evidence must be located before migration | `LOCATE_SENDCOMM_SOURCE_AND_PREPARE_READ_ONLY_INVENTORY` |
| 19 | Provide or authorize exact SendCOMM GitHub repo access | owner clarified SendCOMM is a GitHub repository; guessed public URLs were not accessible | `PROVIDE_OR_AUTHORIZE_EXACT_SENDCOMM_GITHUB_REPO_ACCESS_FOR_READ_ONLY_INVENTORY` |

## June 18 Cadence Addendum

```yaml
june_18_cadence:
  cadence: docs/GBP/assessments/THURSDAY_DAILY_EXECUTIVE_CADENCE_2026-06-18.md
  cadence_closeout: docs/governance/THURSDAY_DAILY_EXECUTIVE_CADENCE_CLOSEOUT_2026-06-18.md
  external_runtime_restore_packet: /Users/codynunn/Documents/GitHub/nunncorp-global-mono/docs/EXECUTIVE_DESK_RUNTIME_RESTORE_EXECUTION_PACKET_2026-06-18.md
  cancelled_strategic_steering: /Users/codynunn/Documents/GitHub/nunncorp-global-mono/docs/SENTINELOS_STRATEGIC_STEERING_DOCUMENT_EXECUTIVE_DESK_DIRECTIONAL_BUILD_PLAN_2026-06.md
  active_steering_direction: docs/governance/SENTINEL_STEERING_DOCUMENT_CANCELLATION_AND_AUTHORITY_LAYER_DIRECTION_2026-06-18.md
  numbered_TODO_processing: docs/NUMBERED_TODO_PROCESSING_RESULT_2026-06-19.md
  authority_receipt_proof_packet: docs/governance/SENTINEL_AUTHORITY_RECEIPT_PROOF_PACKET_2026-06-19.md
  authority_receipt_approval_result: docs/governance/SENTINEL_AUTHORITY_RECEIPT_PROOF_PACKET_APPROVAL_RESULT_2026-06-19.md
  authority_receipt_implementation_manifest: docs/governance/FIXTURE_ONLY_AUTHORITY_RECEIPT_PROOF_IMPLEMENTATION_MANIFEST_2026-06-19.md
  friday_daily_cadence: docs/governance/FRIDAY_DAILY_EXECUTIVE_CADENCE_2026-06-19.md
  friday_weekly_cadence: docs/governance/FRIDAY_WEEKLY_EXECUTIVE_CADENCE_2026-06-19.md
  pr7_gpt_action_connector_review: docs/governance/PR7_GPT_ACTION_CONNECTOR_REVIEW_PROCESSING_RESULT_2026-06-19.md
  pr7_gpt_action_connector_direction_approval: docs/governance/PR7_GPT_ACTION_CONNECTOR_DIRECTION_APPROVAL_RESULT_2026-06-19.md
  pr7_gpt_action_connector_minor_changes_review: docs/governance/PR7_GPT_ACTION_CONNECTOR_MINOR_CHANGES_REVIEW_RESULT_2026-06-19.md
  pr7_gpt_action_connector_minor_change_implementation_packet: docs/governance/PR7_GPT_ACTION_CONNECTOR_MINOR_CHANGE_IMPLEMENTATION_PACKET_2026-06-19.md
  conclusion: Sentinel_authority_layer_direction_is_active_and_runtime_restore_remains_a_held_recovery_lane
  next_strategy_gate: REVIEW_FIXTURE_ONLY_AUTHORITY_RECEIPT_PROOF_IMPLEMENTATION_MANIFEST
  next_connector_gate: APPROVE_OR_HOLD_PR7_MINOR_CHANGE_IMPLEMENTATION
  source_provenance_result: /Users/codynunn/Documents/GitHub/nunncorp-global-mono/docs/APPROVED_GOVERNED_SOURCE_PROVENANCE_FOR_EXECUTIVE_DESK_RESTORE_VERIFICATION_RESULT_2026-06-18.md
  reachability_or_restore_decision: /Users/codynunn/Documents/GitHub/nunncorp-global-mono/docs/SENTINEL_PUBLIC_RUNTIME_REACHABILITY_OR_RUNTIME_RESTORE_DECISION_RESULT_2026-06-18.md
  runtime_mutation_authority: false
  deployment_authority: false
```

## Template Refresh Rule

Executive and Board templates must carry:

- `mob_constant: docs/GBP/doctrine/NUNN_CORPORATION_MASTER_OPERATING_BINDER_2026-06-15.md`
- current repository status;
- current holds;
- MOB completion queue;
- next gate;
- explicit non-authorization.

## Non-Authorization

This binder does not authorize staging, commit, push, deployment, runtime
mutation, AI change, database writes, KQL, secret retrieval, file movement,
cleanup, automated repair, external contact, or external sharing.
