# DEP3 Full Redacted Value Plan - 2026-05-19

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[KEEP:DEP3-FULL-REDACTED-VALUE-PLAN]
```

## Approval Scope

This plan organizes direct env names, sensitive direct env names, secretRef bindings, registry metadata, and runtime metadata into a full redacted value plan for the selected env-specific review strategy.

This plan contains no direct env values, secret values, API keys, tokens, connection strings, registry credentials, deployment credentials, or runtime secret material. It does not authorize deployment, runtime mutation, Azure CLI command execution, live Azure query execution, direct env value restoration, direct env value disclosure, secret value access, secret value disclosure, rollback execution, live post-deploy checks, endpoint publication, pilot activation, tenant activation, held-standard promotion, push, tool grants, certification claims, autonomous execution, or destructive cleanup.

## Core Invariant

```txt
Value plans classify value authority. Value plans do not disclose, restore, or authorize values.
```

## Executive Result

```yaml
full_redacted_value_plan:
  status: completed_review_only
  values_included: false
  secrets_included: false
  deployment_authorized: false
  runtime_mutation_authorized: false
  command_execution_authorized: false
  usable_by_next_lane: DEP3.4
```

## Direct Env Value Plan

| Env Name | Field Class | Source Class | Sensitivity | Future Strategy Handling |
| --- | --- | --- | --- | --- |
| `NODE_ENV` | direct_env | approved runtime baseline or existing live config | non-secret | eligible for field-boundary review only |
| `PORT` | direct_env | approved runtime baseline or existing live config | non-secret | eligible for field-boundary review only |
| `SENTINEL_VERSION` | direct_env | release/version authority | non-secret | eligible for field-boundary review only |
| `AZURE_TENANT_ID` | direct_env | Azure identity configuration source | identifier | eligible for field-boundary review only |
| `AZURE_API_AUDIENCE` | direct_env | Azure auth configuration source | identifier/config | eligible for field-boundary review only |
| `AZURE_AUTHORITY` | direct_env | Azure auth configuration source | identifier/config | eligible for field-boundary review only |
| `AZURE_REDIRECT_URI` | direct_env | approved app registration/onboarding source | publication-sensitive | eligible for field-boundary review only |
| `AZURE_CLIENT_ID` | direct_env | Azure app registration source | identifier | eligible for field-boundary review only |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | sensitive_direct_env | observability configuration source | sensitive | not eligible for value disclosure; requires separate authority if touched |
| `REPORTING_WEBHOOK_URL` | sensitive_direct_env | reporting integration source | sensitive | not eligible for value disclosure; requires separate authority if touched |
| `APPCONFIG_ENDPOINT` | direct_env | Azure App Configuration source | endpoint-sensitive | eligible for field-boundary review only |
| `SENTINEL_AUTH_MODE` | direct_env | runtime auth posture decision | deployment-impacting | eligible for field-boundary review only |
| `SENTINEL_SMOKE_AUTH` | direct_env | smoke-test posture decision | deployment-impacting | eligible for field-boundary review only |
| `SENTINEL_ENV` | direct_env | runtime environment classification | non-secret | eligible for field-boundary review only |
| `SENTINEL_KEY_ROTATED_AT` | direct_env | rotation evidence source | evidence marker | eligible for field-boundary review only |

## SecretRef Value Plan

| Env Name | SecretRef | Field Class | Future Strategy Handling |
| --- | --- | --- | --- |
| `AZURE_CLIENT_SECRET` | `azure-client-secret` | secret_ref | preserve name only; no value access |
| `DATABASE_URL` | `database-url` | secret_ref | preserve name only; no value access |
| `STRIPE_SECRET_KEY` | `stripe-secret-key` | secret_ref | preserve name only; no value access |
| `BILLING_SIGN_KEY` | `billing-sign-key` | secret_ref | preserve name only; no value access |
| `SENTINEL_GITHUB_TOKEN` | `sentinel-github-token` | secret_ref | preserve name only; no value access |
| `SENTINEL_API_KEY` | `sentinel-api-key` | secret_ref | preserve name only; no value access |
| `SENTINEL_HMAC_SECRET` | `sentinel-hmac-secret` | secret_ref | preserve name only; no value access |

## Registry And Runtime Metadata Plan

| Binding | Field Class | Future Strategy Handling |
| --- | --- | --- |
| ACR server | registry_metadata | metadata only |
| Registry username | registry_metadata | metadata only |
| Registry password ref | secret_ref | preserve reference name only |
| Managed environment ID | resource_id_metadata | already verified by DEP2.3R |
| Active image/revision | runtime_metadata | requires pre-mutation snapshot approval before mutation |

## Field Boundary Recommendation

DEP3.4 should allow only field-class review, not value material:

- allowed: env names
- allowed: source classes
- allowed: sensitivity classes
- allowed: secretRef names
- allowed: metadata identifiers already present in sanitized evidence
- prohibited: direct values
- prohibited: secret values
- prohibited: credentials
- prohibited: tokens
- prohibited: connection strings
- prohibited: live mutation

## Non-Authorization Clause

This full redacted value plan classifies value fields and source authority only. It does not authorize deployment, runtime mutation, Azure CLI command execution, live Azure query execution, direct env value restoration, direct env value disclosure, secret value access, secret value disclosure, rollback execution, live post-deploy checks, endpoint publication, pilot activation, tenant activation, held-standard promotion, push, tool grants, certification claims, autonomous execution, or destructive cleanup.
