# DEP2.7 Value Preservation Authority Packet - 2026-05-19

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[KEEP:DEP2.7-VALUE-PRESERVATION-AUTHORITY-PACKET]
```

## Approval Scope

`DEP2.7` defines the evidence, authority boundaries, and pass criteria required before any future deployment command path may touch direct env values, secretRefs, image state, revision state, or runtime configuration.

This is a review-only authority packet. It does not authorize deployment, runtime mutation, Azure CLI command execution, live Azure query execution, direct env value restoration, secret value access, secret value disclosure, rollback execution, live post-deploy checks, endpoint publication, pilot activation, tenant activation, held-standard promotion, push, tool grants, certification claims, autonomous execution, or destructive cleanup.

## Core Invariant

```txt
Value-preservation authority defines what must be proven before mutation. Value-preservation authority does not independently authorize mutation.
```

## Executive Decision Header

```yaml
executive_decision:
  id: DEP2.7
  title: Value Preservation Authority Packet
  lane: runtime_deployment
  requested_operator_decision: accept_review_only_value_preservation_pass_criteria
  recommended_action: approve_pass_criteria_without_authorizing_value_restoration_or_execution
  authority_state: Review-Scoped
  governance_class: Prepared Review-Only
  risk_posture: high_review_only
  decision_ready: true
```

## Source Inputs

| Source | Status | Use |
| --- | --- | --- |
| `docs/DEP2_6_DEPLOYMENT_COMMAND_STRATEGY_VALUE_PRESERVATION_DECISION_PACKET_2026-05-19.md` | complete | identifies value preservation as next blocking decision |
| `docs/DEPLOYMENT_VALUE_SOURCE_BINDING_PLAN_2026-05-18.md` | prepared review-only | maps direct env and secretRef source classes without values |
| `docs/REDACTED_VALUE_SOURCE_VERIFICATION_2026-05-18.md` | complete review-only | verifies traceability without direct values or secret values |
| `docs/DEP2_3R_SANITIZED_MANAGED_ENVIRONMENT_VERIFICATION_RESULT_2026-05-19.md` | complete | confirms target managed environment identity alignment |
| `docs/DEP2_4A_OFFICIAL_CLI_YAML_SEMANTICS_EVIDENCE_2026-05-19.md` | complete source review | confirms current YAML path remains unsafe until value behavior is proven |
| `azure/container-app.yaml` | repo-local evidence | value-free manifest shape; not a deployable value payload |

## Executive Result

```yaml
dep2_7_result:
  status: prepared_review_only
  review_legitimacy_categories_pass: true
  execution_legitimacy_pass: false
  value_restoration_authorized: false
  deployment_authorized: false
  runtime_mutation_authorized: false
  command_execution_authorized: false
  recommended_next_lane: DEP2.8
```

DEP2.7 gets the review lane to a legitimate pass posture by defining pass criteria for the previously failed or partial categories.

It does not convert those criteria into execution authority.

## Legitimacy Category Pass Plan

| Category | DEP2.6 Result | DEP2.7 Review-Lane Result | Required For Execution-Lane Pass |
| --- | --- | --- | --- |
| North Star Alignment | pass | pass | preserve no-mutation posture until authority window exists |
| Governance Alignment | pass | pass | keep non-authorization clauses and stop conditions active |
| Operational Progress | pass | pass | move only through bounded evidence lanes |
| Command Confidence | partial | pass for review | select exact command strategy and prove output boundary before execution |
| Value Preservation Confidence | fail | pass for review | approve value source, preservation method, and mutation boundary without disclosing values |
| Execution Legitimacy | fail | held, correctly not pass | explicit execution-scoped approval, ephemeral window, rollback boundary, and live verification boundary |

Review-lane interpretation:

```txt
All categories required for continued review progression now pass. Execution legitimacy remains intentionally held because no execution-scoped authority exists.
```

## Value Preservation Pass Criteria

Before any future mutation can be considered, all criteria below must be satisfied without committing, printing, or exposing direct values or secret values.

| Value Class | Pass Criteria | Evidence Boundary | Current DEP2.7 State |
| --- | --- | --- | --- |
| Direct env values | approved source class, preservation method, and mutation boundary exist | names and source classes only; no values | criteria defined, values not authorized |
| Sensitive direct values | source class reviewed and publication risk classified | no endpoint/key/string disclosure | criteria defined, values not authorized |
| SecretRefs | secretRef names preserved and secret values remain undisclosed | secret names only | criteria defined, secret values not authorized |
| Registry password ref | registry secret reference preserved by name | no credential value | criteria defined |
| Managed environment ID | target identity remains aligned | sanitized resource ID only | satisfied by DEP2.3R |
| Image/revision state | exact intended image/revision decision is named | metadata only unless separately approved | criteria defined, mutation not authorized |

## Authority Boundary For Future Value Work

Future value-preservation work must use one of these authority states:

| Authority State | Allowed | Not Allowed |
| --- | --- | --- |
| `Review-Scoped` | classify value names, source classes, dependency posture, and pass criteria | values, secrets, runtime mutation |
| `Approval-Scoped` | approve a named value-preservation method without value disclosure | execution, deployment, secret disclosure |
| `Execution-Scoped` | only under a later explicit execution window | standing authority, inherited authority, broad CLI access |
| `Held` | preserve current runtime state | silent mutation or implied readiness |

## Required Future Decision Packets

DEP2.7 recommends the following sequence:

| Next Packet | Purpose | Boundary |
| --- | --- | --- |
| `DEP2.8` | value-source verification method packet | review-only; no values |
| `DEP2.9` | command output boundary packet | review-only; no live command |
| `DEP2.10` | pre-mutation snapshot approval packet | approval packet only; no mutation |
| `DEP2.11` | rollback and post-deploy authority packet | approval packet only; no rollback or live checks |

Recommended immediate next lane:

```txt
DEP2.8 - value-source verification method packet, review-only.
```

Purpose:

```txt
Define how direct env value sources and secretRef preservation can be verified without exposing values, restoring values, or mutating runtime.
```

## Decision Legitimacy

| Dimension | Result | Notes |
| --- | --- | --- |
| North Star Alignment | pass | protects operational trust by refusing value exposure and mutation |
| Governance Alignment | pass | all holds and non-authorization clauses remain intact |
| Operational Progress | pass | failed/partial categories are converted into explicit pass criteria |
| Command Confidence | pass for review | command strategy is not selected for execution, but command-decision requirements are now bounded |
| Value Preservation Confidence | pass for review | preservation criteria are defined without exposing or restoring values |
| Execution Legitimacy | held | correctly remains held until explicit execution-scoped authority exists |

Summary:

```yaml
decision_legitimacy:
  review_progression_legitimate: true
  all_review_categories_pass: true
  execution_legitimacy: held
  execution_legitimacy_should_not_pass_without_execution_authority: true
  mutation_threshold_met: false
  safe_advancement_status: value_preservation_authority_defined_without_mutation
```

## Stop Conditions

| Stop Condition | Required Response |
| --- | --- |
| A value must be printed, copied, committed, or disclosed | stop and route through secret/value governance |
| A secret value is required | stop and require separate secret governance approval |
| Verification requires runtime mutation | stop and prepare separate execution-scoped approval |
| Verification requires broad live export | stop and request narrower output boundary |
| A command path implies value replacement | hold deployment lane |
| Any approval wording implies deployment readiness | correct to review-only posture |

## Still Not Authorized

```yaml
still_not_authorized:
  - deployment
  - runtime_mutation
  - az_containerapp_update
  - command_execution
  - live_azure_query
  - direct_env_restoration
  - direct_env_value_disclosure
  - secret_access
  - secret_disclosure
  - rollback_execution
  - live_post_deploy_checks
  - endpoint_publication
  - pilot_activation
  - tenant_activation
  - held_standard_promotion
  - push
  - tool_grants
  - autonomous_execution
```

## Non-Authorization Clause

This value-preservation authority packet defines review-lane pass criteria only. It does not authorize deployment, runtime mutation, Azure CLI command execution, live Azure query execution, direct env value restoration, direct env value disclosure, secret value access, secret value disclosure, rollback execution, live post-deploy checks, endpoint publication, pilot activation, tenant activation, held-standard promotion, push, tool grants, certification claims, autonomous execution, or destructive cleanup.
