# Deployment Value Source and Binding Plan - 2026-05-18

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[KEEP:DEPLOYMENT-VALUE-SOURCE-BINDING-PLAN-D1.2]
```

## Approval Scope

`D1.2` prepares a review-only value-source and binding plan for the reconciled `azure/container-app.yaml`.

This plan does not include secret values, direct env values, API keys, tokens, connection strings, deployment credentials, or runtime mutations. It does not authorize deployment, direct env value restoration, secret access, registry credential mutation, rollback execution, endpoint publication, pilot activation, tenant activation, or held-standard promotion.

## Core Invariant

```txt
Value-source planning identifies approved binding sources. Value-source planning does not independently authorize deployment, runtime mutation, or secret disclosure.
```

## Executive Result

```yaml
d1_2_result:
  status: value_source_plan_prepared_review_only
  deployment_authorized: false
  runtime_mutation_authorized: false
  values_recorded_in_repo: false
  secret_values_recorded: false
  next_required_before_deployment:
    - redacted value presence verification
    - managed environment verification
    - rollback plan
    - explicit deployment approval
```

## Source Truth

| Source | Use |
| --- | --- |
| `docs/DEPLOYMENT_VALUE_BINDING_REVIEW_2026-05-18.md` | D1.1 blockers and recommended response |
| `docs/AZURE_CONTAINER_APP_SANITIZED_EXPORT_2026-05-18.md` | env names and secretRef posture |
| `azure/container-app.yaml` | repo-local reconciled shape evidence |
| `docs/A4_2_YAML_RECONCILIATION_COMPLETION_2026-05-18.md` | A4.2 completion evidence |

## Direct Env Value Source Plan

These entries are value names only. Values must not be committed to tracked docs.

| Env Name | Current YAML Posture | Required Source Class | Review Status | Notes |
| --- | --- | --- | --- | --- |
| `NODE_ENV` | name only | approved runtime baseline or existing live config | source_required | non-secret direct value |
| `PORT` | name only | approved runtime baseline or existing live config | source_required | should remain aligned to Container App target port behavior |
| `SENTINEL_VERSION` | name only | release/version authority | source_required | should map to approved release lineage |
| `AZURE_TENANT_ID` | name only | Azure identity configuration source | source_required | non-secret identifier, still gated |
| `AZURE_API_AUDIENCE` | name only | Azure auth configuration source | source_required | non-secret direct value |
| `AZURE_AUTHORITY` | name only | Azure auth configuration source | source_required | non-secret direct value |
| `AZURE_REDIRECT_URI` | name only | approved app registration/onboarding source | source_required | publication implications should be reviewed |
| `AZURE_CLIENT_ID` | name only | Azure app registration source | source_required | non-secret identifier, still gated |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | name only | observability configuration source | source_required | may contain sensitive endpoint/key material; do not publish value |
| `REPORTING_WEBHOOK_URL` | name only | reporting integration source | source_required | may be sensitive; do not publish value |
| `APPCONFIG_ENDPOINT` | name only | Azure App Configuration source | source_required | endpoint value should be reviewed before publication |
| `SENTINEL_AUTH_MODE` | name only | runtime auth posture decision | source_required | deployment-impacting value |
| `SENTINEL_SMOKE_AUTH` | name only | smoke-test posture decision | source_required | must not weaken auth posture |
| `SENTINEL_ENV` | name only | runtime environment classification | source_required | should align with non-demo posture |
| `SENTINEL_KEY_ROTATED_AT` | name only | rotation evidence source | source_required | evidence marker only; do not infer secret freshness without verification |

## SecretRef Binding Plan

Secret names are allowed as metadata. Secret values are not allowed in this plan.

| Env Name | SecretRef | Required Check | Review Status |
| --- | --- | --- | --- |
| `AZURE_CLIENT_SECRET` | `azure-client-secret` | confirm secret name exists and source posture is approved | presence_check_required |
| `DATABASE_URL` | `database-url` | confirm secret name exists and source posture is approved | presence_check_required |
| `STRIPE_SECRET_KEY` | `stripe-secret-key` | confirm secret name exists and source posture is approved | presence_check_required |
| `BILLING_SIGN_KEY` | `billing-sign-key` | confirm secret name exists and source posture is approved | presence_check_required |
| `SENTINEL_GITHUB_TOKEN` | `sentinel-github-token` | confirm secret name exists and source posture is approved | presence_check_required |
| `SENTINEL_API_KEY` | `sentinel-api-key` | confirm secret name exists and source posture is approved | presence_check_required |
| `SENTINEL_HMAC_SECRET` | `sentinel-hmac-secret` | confirm secret name exists and source posture is approved after rotation evidence | presence_check_required |

## Registry and Managed Environment Binding

| Binding | Current Evidence | Required Check | Review Status |
| --- | --- | --- | --- |
| ACR server | `acrncdevsentinel.azurecr.io` | preserve current registry source unless separate migration approved | preserve_current_posture |
| Registry username | `acrncdevsentinel` | verify metadata only before deployment | presence_check_required |
| Registry password ref | `registry-password` | confirm secret name exists without value disclosure | presence_check_required |
| Managed environment ID | repo-local manifest evidence | verify with sanitized read-only query | verification_required |

## Rollback and Verification Plan Requirements

Before any deployment approval, a separate packet must identify:

- current active image and revision before mutation
- intended image and revision target
- rollback image/revision path
- `az containerapp update` or deployment command to be used
- `/health` check
- `/proof` or proof-surface check
- audit/protected route check
- public bridge check if affected
- stop condition for failed readiness, failed liveness, or unexpected auth posture

## Sentinel AI Recommendation

```txt
Do not deploy from this plan.
```

The next safe action is a redacted verification pass that confirms names, source classes, and managed environment metadata without printing values. Deployment should remain blocked until that evidence and an explicit deployment approval exist.

## Non-Authorization Clause

This value-source and binding plan does not authorize deployment, runtime mutation, direct env value restoration, secret value access, secret value disclosure, registry credential mutation, managed identity migration, rollback execution, endpoint publication, pilot activation, tenant activation, held-standard promotion, or autonomous execution.
