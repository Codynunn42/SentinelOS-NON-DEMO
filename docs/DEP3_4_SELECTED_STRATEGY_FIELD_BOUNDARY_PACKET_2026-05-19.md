# DEP3.4 Selected Strategy Field-Boundary Packet - 2026-05-19

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[KEEP:DEP3.4-SELECTED-STRATEGY-FIELD-BOUNDARY-PACKET]
```

## Approval Scope

`DEP3.4` defines exact field classes, prohibited values, output fields, stop conditions, and approval dependencies for the selected env-specific review strategy.

This is review-only. It does not authorize deployment, runtime mutation, Azure CLI command execution, live Azure query execution, direct env value restoration, direct env value disclosure, secret value access, secret value disclosure, rollback execution, live post-deploy checks, endpoint publication, pilot activation, tenant activation, held-standard promotion, push, tool grants, certification claims, autonomous execution, or destructive cleanup.

## Core Invariant

```txt
Field boundaries constrain future command scope. Field boundaries do not authorize command execution or value movement.
```

## Executive Decision Header

```yaml
executive_decision:
  id: DEP3.4
  title: Selected Strategy Field-Boundary Packet
  lane: runtime_deployment
  requested_operator_decision: accept_review_only_field_boundary_for_selected_strategy
  recommended_action: approve_field_boundary_for_review_only_and_keep_all_value_and_execution_holds
  authority_state: Review-Scoped
  governance_class: Prepared Review-Only
  risk_posture: high_review_only
  decision_ready: true
```

## Source Inputs

| Source | Status | Use |
| --- | --- | --- |
| `docs/DEP3_3_COMMAND_STRATEGY_SELECTION_PACKET_2026-05-19.md` | complete | selects env-specific update strategy for future review only |
| `docs/DEP3_FULL_REDACTED_VALUE_PLAN_2026-05-19.md` | complete | full redacted value plan and field classes |
| `docs/DEP2_9_COMMAND_OUTPUT_BOUNDARY_PACKET_2026-05-19.md` | complete | output constraints |
| `docs/DEP2_10_PRE_MUTATION_SNAPSHOT_APPROVAL_PACKET_2026-05-19.md` | prepared review-only | snapshot dependency |
| `docs/DEP2_11_ROLLBACK_POST_DEPLOY_AUTHORITY_PACKET_2026-05-19.md` | complete review-only | rollback and post-deploy dependencies |

## Executive Result

```yaml
dep3_4_result:
  status: completed_review_only
  selected_strategy: env_specific_update_strategy
  field_boundary_defined: true
  values_authorized: false
  secret_values_authorized: false
  command_execution_authorized: false
  deployment_authorized: false
  runtime_mutation_authorized: false
  recommended_next_lane: DEP3.5
```

DEP3.4 defines the field boundary for the selected strategy. It does not approve a field list for execution, does not approve values, and does not approve any command.

## Allowed Review Fields

| Field Class | Allowed In Review | Not Allowed |
| --- | --- | --- |
| Direct env names | names from the redacted value plan | direct values |
| Direct env source classes | source class labels | source material containing values |
| Sensitivity class | non-secret, identifier, sensitive, publication-sensitive, endpoint-sensitive, deployment-impacting | value disclosure |
| SecretRef names | secretRef names only | secret values |
| Registry metadata | server/name/reference metadata | credentials |
| Managed environment metadata | DEP2.3R verified resource ID | broad live export |
| Image/revision metadata | metadata only if later snapshot-approved | mutation |

## Prohibited Value Material

The selected strategy field boundary prohibits:

- direct env values
- secret values
- API keys
- tokens
- connection strings
- registry credentials
- deployment credentials
- full runtime exports
- logs containing sensitive material
- publication of endpoint-sensitive configuration

## Selected Strategy Output Boundary

Any future output boundary for the selected env-specific strategy must be limited to:

```yaml
allowed_output_classes:
  - command_status_if_separately_approved
  - non_sensitive_error_class_if_separately_approved
  - named_resource_metadata_if_separately_approved
  - revision_name_if_separately_approved
  - traffic_status_if_separately_approved
```

Prohibited output:

```yaml
prohibited_output_classes:
  - direct_env_values
  - secret_values
  - tokens
  - keys
  - connection_strings
  - registry_credentials
  - full_container_app_export
  - broad_logs
```

## Approval Dependencies Before Any Future Execution

| Dependency | Status After DEP3.4 |
| --- | --- |
| Selected strategy | review strategy selected |
| Field boundary | defined |
| Exact field list | not approved for execution |
| Value material | not approved |
| Pre-mutation snapshot | not taken |
| Rollback authority | not approved |
| Post-deploy verification authority | not approved |
| Execution window | not approved |
| Operator execution approval | absent |

## Recommended Next Scope

```txt
DEP3.5 - exact field-list approval packet, review-only.
```

Purpose:

```txt
Define the exact env names and secretRef names that could be included in a future execution envelope, while preserving value, secret, snapshot, rollback, verification, and execution holds.
```

DEP3.5 must not execute commands, query Azure, restore values, access secrets, deploy, rollback, verify live endpoints, publish, activate, push, or mutate runtime.

## Stop Conditions

| Stop Condition | Required Response |
| --- | --- |
| Field boundary is interpreted as value approval | correct to review-only |
| Exact field list requires values | hold and route through value governance |
| Any value or secret is needed | stop and route through secret/value governance |
| Output boundary cannot be narrowed | hold selected strategy |
| Snapshot, rollback, or verification authority is absent | hold execution authority |

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

This selected strategy field-boundary packet defines review boundaries only. It does not authorize deployment, runtime mutation, Azure CLI command execution, live Azure query execution, direct env value restoration, direct env value disclosure, secret value access, secret value disclosure, rollback execution, live post-deploy checks, endpoint publication, pilot activation, tenant activation, held-standard promotion, push, tool grants, certification claims, autonomous execution, or destructive cleanup.
