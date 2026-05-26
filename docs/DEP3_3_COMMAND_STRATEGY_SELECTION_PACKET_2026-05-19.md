# DEP3.3 Command Strategy Selection Packet - 2026-05-19

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[KEEP:DEP3.3-COMMAND-STRATEGY-SELECTION-PACKET]
```

## Approval Scope

`DEP3.3` selects the safest future command strategy for review, or preserves hold if no strategy can satisfy value-preservation and output-boundary requirements.

This is review-only. It does not authorize deployment, runtime mutation, Azure CLI command execution, live Azure query execution, direct env value restoration, direct env value disclosure, secret value access, secret value disclosure, rollback execution, live post-deploy checks, endpoint publication, pilot activation, tenant activation, held-standard promotion, push, tool grants, certification claims, autonomous execution, or destructive cleanup.

## Core Invariant

```txt
Command strategy selection identifies a future review path. Command strategy selection does not authorize command execution.
```

## Executive Decision Header

```yaml
executive_decision:
  id: DEP3.3
  title: Command Strategy Selection Packet
  lane: runtime_deployment
  requested_operator_decision: accept_review_only_command_strategy_selection
  recommended_action: select_env_specific_strategy_for_future_review_and_keep_execution_held
  authority_state: Review-Scoped
  governance_class: Prepared Review-Only
  risk_posture: high_review_only
  decision_ready: true
```

## Source Inputs

| Source | Status | Use |
| --- | --- | --- |
| `docs/DEP3_2_DEPLOYMENT_EXECUTION_ENVELOPE_DRAFT_2026-05-19.md` | complete | identifies exact command strategy as unresolved subissue |
| `docs/DEP2_6_DEPLOYMENT_COMMAND_STRATEGY_VALUE_PRESERVATION_DECISION_PACKET_2026-05-19.md` | complete | compares YAML payload, env-specific, replace-env, image-only, and hold strategies |
| `docs/DEP2_4A_OFFICIAL_CLI_YAML_SEMANTICS_EVIDENCE_2026-05-19.md` | complete source review | identifies clearer env-specific preservation semantics and unresolved YAML payload behavior |
| `docs/DEP2_9_COMMAND_OUTPUT_BOUNDARY_PACKET_2026-05-19.md` | complete | defines output restrictions for future command paths |
| `docs/DEP2_10_PRE_MUTATION_SNAPSHOT_APPROVAL_PACKET_2026-05-19.md` | prepared review-only | defines snapshot dependency without taking snapshot |
| `docs/DEP2_11_ROLLBACK_POST_DEPLOY_AUTHORITY_PACKET_2026-05-19.md` | complete review-only | defines rollback and post-deploy verification dependencies |

## Executive Result

```yaml
dep3_3_result:
  status: completed_review_only
  selected_future_review_strategy: env_specific_update_strategy
  yaml_payload_execution_selected: false
  replace_env_vars_selected: false
  image_only_strategy_selected: false
  no_op_hold_preserved: true
  deployment_authorized: false
  runtime_mutation_authorized: false
  command_execution_authorized: false
  recommended_next_lane: DEP3.4
```

DEP3.3 selects an env-specific update strategy only as the safest future review path.

It does not select any strategy for execution.

## Strategy Decision Matrix

| Strategy | DEP3.3 Decision | Reason | Required Before Any Execution |
| --- | --- | --- | --- |
| YAML payload update | rejected for execution and not selected as preferred strategy | broad payload, direct env name-only behavior unresolved, current manifest value-free | separate proof of value preservation and explicit operator override |
| Env-specific update strategy | selected for future review only | official source evidence indicates clearer preservation semantics than YAML payload path | value-preservation approval, exact fields, output boundary, snapshot, rollback, verification, execution window |
| Replace env vars | rejected | replacement semantics can remove other env vars unless every required value is safely supplied | full value plan and explicit override, not recommended |
| Image-only update | not selected | does not resolve value-preservation path and still creates runtime revision | separate image-only authority lane if later needed |
| No-op / hold | preserved as current runtime posture | safest current runtime state | remains active until execution-scoped authority exists |

## Selected Review Strategy

The selected future review strategy is:

```txt
env-specific update strategy, review-only.
```

Rationale:

- it avoids treating the full YAML manifest as a mutation payload
- it aligns with official source evidence that env-specific update semantics are clearer than YAML payload behavior
- it can be scoped to exact fields later
- it can be paired with a narrow output boundary
- it still requires value-preservation authority before execution

## Not Selected For Execution

No command is approved for execution.

The following remains prohibited:

```bash
az containerapp update --yaml azure/container-app.yaml
```

The following is not authorized either and is named only as a future review family:

```bash
az containerapp update --set-env-vars <redacted-and-approved-field-list>
```

No field list, values, secrets, direct values, or live target mutation is approved by DEP3.3.

## Remaining Subissues

| Subissue | DEP3.3 Result | Next Required Lane |
| --- | --- | --- |
| Exact env field list | unresolved | DEP3.4 |
| Direct env value-preservation approval | held | DEP3.4 or value governance approval |
| SecretRef preservation | held by no-secret-value rule | DEP3.4 |
| Output field binding | prepared by DEP2.9 but not bound to selected strategy | DEP3.4 |
| Pre-mutation snapshot | approval packet exists, snapshot not taken | separate approval before execution |
| Rollback and verification | requirements defined, authority not granted | separate approval before execution |
| Execution window and decay | required, not approved | future execution-scoped approval only |

## Recommended Next Scope

```txt
DEP3.4 - selected strategy field-boundary packet, review-only.
```

Purpose:

```txt
Define the exact field classes, prohibited values, output fields, stop conditions, and approval dependencies for the selected env-specific review strategy.
```

DEP3.4 must not execute commands, query Azure, restore values, access secrets, deploy, rollback, verify live endpoints, publish, activate, push, or mutate runtime.

## Stop Conditions

| Stop Condition | Required Response |
| --- | --- |
| Strategy selection is interpreted as command approval | correct to review-only |
| Exact field list requires direct values | hold and route through value governance |
| Secret values are needed | stop and route through secret governance |
| Output boundary cannot be field-limited | hold selected strategy |
| Pre-mutation snapshot is stale or absent | hold execution authority |
| Rollback or verification authority is absent | hold execution authority |

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

This command strategy selection packet selects a future review path only. It does not authorize deployment, runtime mutation, Azure CLI command execution, live Azure query execution, direct env value restoration, direct env value disclosure, secret value access, secret value disclosure, rollback execution, live post-deploy checks, endpoint publication, pilot activation, tenant activation, held-standard promotion, push, tool grants, certification claims, autonomous execution, or destructive cleanup.
