# DEP2.6 Deployment Command Strategy And Value Preservation Decision Packet - 2026-05-19

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[KEEP:DEP2.6-DEPLOYMENT-COMMAND-STRATEGY-VALUE-PRESERVATION-DECISION-PACKET]
```

## Approval Scope

`DEP2.6` compares future deployment command strategies and value-preservation requirements after `DEP2.5` confirmed deployment remains blocked.

This is a review-only decision packet. It does not authorize deployment, runtime mutation, Azure CLI command execution, live Azure query execution, direct env value restoration, secret value access, secret value disclosure, rollback execution, live post-deploy checks, endpoint publication, pilot activation, tenant activation, held-standard promotion, push, tool grants, certification claims, autonomous execution, or destructive cleanup.

## Core Invariant

```txt
Command strategy selection may prepare a future authority decision. Command strategy selection does not independently authorize execution or mutation.
```

## Executive Decision Header

```yaml
executive_decision:
  id: DEP2.6
  title: Deployment Command Strategy And Value Preservation Decision Packet
  lane: runtime_deployment
  requested_operator_decision: accept_review_only_command_strategy_packet
  recommended_action: reject_yaml_payload_execution_until_value_preservation_is_proven
  authority_state: Review-Scoped
  governance_class: Prepared Review-Only
  risk_posture: high_review_only
  decision_ready: true
```

## Source Inputs

| Source | Status | Use |
| --- | --- | --- |
| `docs/DEP2_5_DEPLOYMENT_AUTHORITY_GAP_REVIEW_2026-05-19.md` | complete | identifies remaining blockers after target identity closure |
| `docs/DEP2_4A_OFFICIAL_CLI_YAML_SEMANTICS_EVIDENCE_2026-05-19.md` | complete source review | confirms `--yaml` is broad configuration payload and leaves name-only env behavior unresolved |
| `docs/DEP2_4_CLI_YAML_SEMANTICS_REVIEW_2026-05-19.md` | complete review-only | defines YAML command ambiguity and stop conditions |
| `docs/DEP1_4_DEPLOYMENT_COMMAND_REVIEW_2026-05-19.md` | complete review-only | defines candidate command risks and command approval envelope requirements |
| `docs/DEPLOYMENT_VALUE_SOURCE_BINDING_PLAN_2026-05-18.md` | prepared review-only | maps direct env and secretRef source classes without values |
| `docs/REDACTED_VALUE_SOURCE_VERIFICATION_2026-05-18.md` | complete review-only | supports value-free env and secretRef traceability |
| `azure/container-app.yaml` | repo-local candidate manifest | reconciled deployment shape with direct env values intentionally omitted |

## Executive Result

```yaml
dep2_6_result:
  status: prepared_review_only
  yaml_payload_execution_recommended: false
  safest_future_strategy: prepare_value_preservation_authority_before_any_mutation
  deployment_authorized: false
  runtime_mutation_authorized: false
  command_execution_authorized: false
  direct_env_restoration_authorized: false
  recommended_next_lane: DEP2.7
```

DEP2.6 concludes that the current `az containerapp update --yaml azure/container-app.yaml` path should not advance toward execution while direct env values are intentionally omitted and name-only YAML env behavior remains unresolved.

## Command Strategy Matrix

| Strategy | Description | Value-Preservation Confidence | Risk | DEP2.6 Posture |
| --- | --- | --- | --- | --- |
| YAML payload update | `az containerapp update --yaml azure/container-app.yaml` | low | broad configuration mutation; name-only env behavior unresolved | do not advance to execution |
| Env-specific set/update | future explicit env update strategy using documented preservation semantics | moderate, but incomplete | still needs direct value source and output boundary approval | candidate for later review only |
| Replace env vars | explicit replacement-style env update | low/high risk | can remove existing env vars unless every required value is safely supplied | reject unless full value plan is approved |
| Image-only update | future image-only update if deployment target is image drift only | partial | still creates revision and requires verification/rollback | candidate only if env mutation is excluded |
| No-op / hold | preserve current runtime state | high | operational progress slows, but trust remains intact | recommended current runtime posture |

## Value Preservation Findings

| Value Class | Current Evidence | Preservation Risk | Required Before Any Mutation |
| --- | --- | --- | --- |
| Direct env values | intentionally omitted from repo-local YAML and docs | high | approved value-source plan, sanitized binding proof, and explicit mutation boundary |
| SecretRefs | names traced without secret values | moderate | secretRef name preservation proof and no secret value disclosure |
| Managed environment ID | matched by DEP2.3R | low | no further action unless target changes |
| Registry/image values | present in repo-local review evidence | moderate | pre-mutation snapshot and exact image decision if image update is included |
| Revision state | revision-scope changes create runtime transition | high | rollback, verification, and execution window approval |

## Recommended Strategy Decision

DEP2.6 recommends:

```txt
Do not approve YAML payload execution from the current repo-local manifest.
```

Reason:

```txt
The current manifest is appropriate as reconciled evidence, but it is not safe as a mutation payload until direct env value preservation and command semantics are explicitly resolved.
```

DEP2.6 further recommends the next safe lane:

```txt
DEP2.7 - value-preservation authority packet, review-only.
```

Purpose:

```txt
Define what evidence and approvals would be required before any future command path may touch direct env values, secretRefs, image state, revision state, or runtime configuration.
```

## Authority State

```json
{
  "authorityState": {
    "current": "REVIEW_ONLY",
    "allowedTransitions": [
      "PREPARE_VALUE_PRESERVATION_AUTHORITY",
      "PREPARE_IMAGE_ONLY_STRATEGY_REVIEW",
      "HOLD"
    ],
    "blockedTransitions": [
      "EXECUTE",
      "DEPLOY",
      "RUNTIME_MUTATION",
      "DIRECT_ENV_RESTORATION",
      "SECRET_ACCESS",
      "ROLLBACK_EXECUTION",
      "LIVE_POST_DEPLOY_CHECKS"
    ],
    "transitionRequirements": {
      "COMMAND_EXECUTION": [
        "command_strategy_selected",
        "value_preservation_authority_approved",
        "secretRef_preservation_approved_without_values",
        "fresh_pre_mutation_snapshot_approved",
        "rollback_boundary_approved",
        "post_deploy_live_check_boundary_approved",
        "ephemeral_execution_window_approved",
        "operator_execution_approval"
      ]
    }
  }
}
```

## Decision Legitimacy

| Dimension | Result | Notes |
| --- | --- | --- |
| North Star Alignment | pass | refuses unsafe command path while preserving progress |
| Governance Alignment | pass | all holds remain intact |
| Operational Progress | pass | command strategies are separated and bounded |
| Command Confidence | partial | env-specific paths may be safer, but still need value authority |
| Value Preservation Confidence | fail | direct env preservation is not approved |
| Execution Legitimacy | fail | no execution-scoped authority exists |

Summary:

```yaml
decision_legitimacy:
  yaml_payload_execution_legitimate: false
  env_specific_strategy_ready_for_execution: false
  value_preservation_authority_needed: true
  mutation_threshold_met: false
  safe_advancement_status: command_strategy_prepared_without_mutation
```

## Stop Conditions Preserved

| Stop Condition | Required Response |
| --- | --- |
| Command strategy depends on omitted direct env values | hold and route through value-preservation authority |
| Command strategy could clear or replace existing values | hold command execution |
| Command strategy requires secret values | stop and route through secret governance |
| Command strategy needs live mutation to validate behavior | prepare separate explicit approval; do not execute |
| Command output could expose sensitive runtime fields | require narrower output boundary |
| Operator approval does not name exact command and authority window | remain review-only |

## Still Not Authorized

```yaml
still_not_authorized:
  - deployment
  - runtime_mutation
  - az_containerapp_update
  - command_execution
  - live_azure_query
  - direct_env_restoration
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

This deployment command strategy and value-preservation decision packet prepares a future authority decision only. It does not authorize deployment, runtime mutation, Azure CLI command execution, live Azure query execution, direct env value restoration, secret value access, secret value disclosure, rollback execution, live post-deploy checks, endpoint publication, pilot activation, tenant activation, held-standard promotion, push, tool grants, certification claims, autonomous execution, or destructive cleanup.
