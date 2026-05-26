# DEP3.5 Exact Field-List Approval Packet - 2026-05-19

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[KEEP:DEP3.5-EXACT-FIELD-LIST-APPROVAL-PACKET]
```

## Approval Scope

`DEP3.5` defines the exact env names and secretRef names that could be included in a future execution envelope for the selected env-specific review strategy.

This is review-only. It does not authorize deployment, runtime mutation, Azure CLI command execution, live Azure query execution, direct env value restoration, direct env value disclosure, secret value access, secret value disclosure, rollback execution, live post-deploy checks, endpoint publication, pilot activation, tenant activation, held-standard promotion, push, tool grants, certification claims, autonomous execution, or destructive cleanup.

## Core Invariant

```txt
Exact field lists constrain future envelopes. Exact field lists do not authorize values, commands, or runtime mutation.
```

## Executive Decision Header

```yaml
executive_decision:
  id: DEP3.5
  title: Exact Field-List Approval Packet
  lane: runtime_deployment
  requested_operator_decision: accept_review_only_exact_field_list
  recommended_action: approve_field_names_for_review_only_and_keep_values_execution_and_runtime_holds
  authority_state: Review-Scoped
  governance_class: Prepared Review-Only
  risk_posture: high_review_only
  decision_ready: true
```

## Source Inputs

| Source | Status | Use |
| --- | --- | --- |
| `docs/DEP3_4_SELECTED_STRATEGY_FIELD_BOUNDARY_PACKET_2026-05-19.md` | complete | defines selected strategy field boundary |
| `docs/DEP3_FULL_REDACTED_VALUE_PLAN_2026-05-19.md` | complete | full redacted field and source-class plan |
| `docs/REDACTED_VALUE_SOURCE_VERIFICATION_2026-05-18.md` | complete | confirms names and secretRefs without values |
| `azure/container-app.yaml` | repo-local evidence | reconciled value-free field shape |

## Executive Result

```yaml
dep3_5_result:
  status: completed_review_only
  exact_field_list_defined: true
  values_authorized: false
  secret_values_authorized: false
  command_execution_authorized: false
  deployment_authorized: false
  runtime_mutation_authorized: false
  recommended_next_lane: DEP3.6
```

DEP3.5 defines the exact field names that can be referenced in a future envelope. It does not approve values, value restoration, secret access, command execution, deployment, or mutation.

## Exact Direct Env Field List

| Env Name | Field Class | Sensitivity | Status |
| --- | --- | --- | --- |
| `NODE_ENV` | direct_env | non-secret | approved_for_review_field_list_only |
| `PORT` | direct_env | non-secret | approved_for_review_field_list_only |
| `SENTINEL_VERSION` | direct_env | non-secret | approved_for_review_field_list_only |
| `AZURE_TENANT_ID` | direct_env | identifier | approved_for_review_field_list_only |
| `AZURE_API_AUDIENCE` | direct_env | identifier/config | approved_for_review_field_list_only |
| `AZURE_AUTHORITY` | direct_env | identifier/config | approved_for_review_field_list_only |
| `AZURE_REDIRECT_URI` | direct_env | publication-sensitive | approved_for_review_field_list_only |
| `AZURE_CLIENT_ID` | direct_env | identifier | approved_for_review_field_list_only |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | sensitive_direct_env | sensitive | named_for_review_only_value_held |
| `REPORTING_WEBHOOK_URL` | sensitive_direct_env | sensitive | named_for_review_only_value_held |
| `APPCONFIG_ENDPOINT` | direct_env | endpoint-sensitive | approved_for_review_field_list_only |
| `SENTINEL_AUTH_MODE` | direct_env | deployment-impacting | approved_for_review_field_list_only |
| `SENTINEL_SMOKE_AUTH` | direct_env | deployment-impacting | approved_for_review_field_list_only |
| `SENTINEL_ENV` | direct_env | non-secret | approved_for_review_field_list_only |
| `SENTINEL_KEY_ROTATED_AT` | direct_env | evidence marker | approved_for_review_field_list_only |

## Exact SecretRef Field List

| Env Name | SecretRef | Field Class | Status |
| --- | --- | --- | --- |
| `AZURE_CLIENT_SECRET` | `azure-client-secret` | secret_ref | approved_for_review_field_list_only |
| `DATABASE_URL` | `database-url` | secret_ref | approved_for_review_field_list_only |
| `STRIPE_SECRET_KEY` | `stripe-secret-key` | secret_ref | approved_for_review_field_list_only |
| `BILLING_SIGN_KEY` | `billing-sign-key` | secret_ref | approved_for_review_field_list_only |
| `SENTINEL_GITHUB_TOKEN` | `sentinel-github-token` | secret_ref | approved_for_review_field_list_only |
| `SENTINEL_API_KEY` | `sentinel-api-key` | secret_ref | approved_for_review_field_list_only |
| `SENTINEL_HMAC_SECRET` | `sentinel-hmac-secret` | secret_ref | approved_for_review_field_list_only |

## Exact Metadata Field List

| Field | Field Class | Status |
| --- | --- | --- |
| ACR server | registry_metadata | approved_for_review_field_list_only |
| Registry username | registry_metadata | approved_for_review_field_list_only |
| Registry password ref | secret_ref | approved_for_review_field_list_only |
| Managed environment ID | resource_id_metadata | verified_by_DEP2.3R |
| Active image | runtime_metadata | requires_pre_mutation_snapshot_before_execution |
| Active revision | runtime_metadata | requires_pre_mutation_snapshot_before_execution |

## Explicitly Prohibited From Field-List Approval

DEP3.5 does not approve:

- any direct env value
- any sensitive direct env value
- any secret value
- any API key
- any token
- any connection string
- any registry credential
- any deployment credential
- any command payload
- any live query
- any mutation

## Approval Dependencies Before Any Future Execution

| Dependency | Status After DEP3.5 |
| --- | --- |
| Selected strategy | env-specific review strategy selected |
| Field boundary | defined |
| Exact field list | defined for review only |
| Value material | not approved |
| Secret values | not approved |
| Pre-mutation snapshot | not taken |
| Rollback authority | not approved |
| Post-deploy verification authority | not approved |
| Execution window | not approved |
| Operator execution approval | absent |

## Recommended Next Scope

```txt
DEP3.6 - value-material exclusion and placeholder policy packet, review-only.
```

Purpose:

```txt
Define how future envelopes reference field names without including values, placeholders that are allowed, placeholders that are prohibited, and stop conditions for accidental value material.
```

DEP3.6 must not execute commands, query Azure, restore values, access secrets, deploy, rollback, verify live endpoints, publish, activate, push, or mutate runtime.

## Stop Conditions

| Stop Condition | Required Response |
| --- | --- |
| Field list is interpreted as value approval | correct to review-only |
| A direct value is requested | stop and route through value governance |
| A secret value is requested | stop and route through secret governance |
| Sensitive field names are proposed for publication | hold publication lane |
| Command syntax is requested with values | hold command envelope |
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

This exact field-list approval packet approves field names for review only. It does not authorize deployment, runtime mutation, Azure CLI command execution, live Azure query execution, direct env value restoration, direct env value disclosure, secret value access, secret value disclosure, rollback execution, live post-deploy checks, endpoint publication, pilot activation, tenant activation, held-standard promotion, push, tool grants, certification claims, autonomous execution, or destructive cleanup.
