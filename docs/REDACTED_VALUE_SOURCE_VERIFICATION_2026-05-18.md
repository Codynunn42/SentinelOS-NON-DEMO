# Redacted Value Source Verification - 2026-05-18

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[KEEP:REDACTED-VALUE-SOURCE-VERIFICATION-V1.1]
```

## Approval Scope

`V1.1` completes internal verification for the D1.2 value-source and binding plan.

This verification uses existing repo-local and sanitized runtime evidence only. It does not query or print secret values, direct env values, API keys, tokens, connection strings, deployment credentials, or runtime secret material. It does not authorize deployment, runtime mutation, direct env value restoration, secret access, secret disclosure, endpoint publication, pilot activation, tenant activation, held-standard promotion, or push.

## Core Invariant

```txt
Redacted verification strengthens deployment traceability. Redacted verification does not independently authorize deployment, runtime mutation, or value disclosure.
```

## Executive Result

```yaml
v1_1_result:
  status: internal_verification_completed_low_moderate
  deployment_authorized: false
  runtime_mutation_authorized: false
  secret_values_accessed: false
  direct_values_accessed: false
  values_recorded_in_repo: false
  traceability_strengthened: true
  deployment_readiness: still_blocked
```

## Source Truth

| Source | Use |
| --- | --- |
| `docs/DEPLOYMENT_VALUE_SOURCE_BINDING_PLAN_2026-05-18.md` | planned source and binding classes |
| `docs/AZURE_CONTAINER_APP_SANITIZED_EXPORT_2026-05-18.md` | sanitized runtime env names, secret names, and secretRef posture |
| `azure/container-app.yaml` | repo-local reconciled manifest shape |
| `docs/DEPLOYMENT_VALUE_BINDING_REVIEW_2026-05-18.md` | D1.1 readiness blockers |

## Verification Boundary

Verified:

- env var names are represented in the sanitized export
- secretRef posture is represented in the sanitized export
- secret names referenced by `azure/container-app.yaml` are listed in the sanitized export
- direct env value names remain intentionally value-free in repo
- secret-bearing env vars remain bound by `secretRef`
- registry password reference name is represented as metadata

Not verified:

- direct env values
- secret values
- connection strings
- token contents
- actual live runtime state after the sanitized export timestamp
- managed environment ID from a new live query
- deployment command behavior

## Direct Env Verification

| Env Name | Sanitized Export Name Present | YAML Name Present | Value Recorded | Verification |
| --- | --- | --- | --- | --- |
| `NODE_ENV` | yes | yes | no | traceable_name_only |
| `PORT` | yes | yes | no | traceable_name_only |
| `SENTINEL_VERSION` | yes | yes | no | traceable_name_only |
| `AZURE_TENANT_ID` | yes | yes | no | traceable_name_only |
| `AZURE_API_AUDIENCE` | yes | yes | no | traceable_name_only |
| `AZURE_AUTHORITY` | yes | yes | no | traceable_name_only |
| `AZURE_REDIRECT_URI` | yes | yes | no | traceable_name_only |
| `AZURE_CLIENT_ID` | yes | yes | no | traceable_name_only |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | yes | yes | no | traceable_name_only_sensitive |
| `REPORTING_WEBHOOK_URL` | yes | yes | no | traceable_name_only_sensitive |
| `APPCONFIG_ENDPOINT` | yes | yes | no | traceable_name_only |
| `SENTINEL_AUTH_MODE` | yes | yes | no | traceable_name_only |
| `SENTINEL_SMOKE_AUTH` | yes | yes | no | traceable_name_only |
| `SENTINEL_ENV` | yes | yes | no | traceable_name_only |
| `SENTINEL_KEY_ROTATED_AT` | yes | yes | no | traceable_name_only |

## SecretRef Verification

| Env Name | SecretRef | Secret Name Listed In Sanitized Export | YAML Binding Present | Verification |
| --- | --- | --- | --- | --- |
| `AZURE_CLIENT_SECRET` | `azure-client-secret` | yes | yes | traceable_secret_ref_only |
| `DATABASE_URL` | `database-url` | yes | yes | traceable_secret_ref_only |
| `STRIPE_SECRET_KEY` | `stripe-secret-key` | yes | yes | traceable_secret_ref_only |
| `BILLING_SIGN_KEY` | `billing-sign-key` | yes | yes | traceable_secret_ref_only |
| `SENTINEL_GITHUB_TOKEN` | `sentinel-github-token` | yes | yes | traceable_secret_ref_only |
| `SENTINEL_API_KEY` | `sentinel-api-key` | yes | yes | traceable_secret_ref_only |
| `SENTINEL_HMAC_SECRET` | `sentinel-hmac-secret` | yes | yes | traceable_secret_ref_only |

## Registry Verification

| Binding | Sanitized Evidence | YAML Evidence | Verification |
| --- | --- | --- | --- |
| Registry server | `acrncdevsentinel.azurecr.io` | `acrncdevsentinel.azurecr.io` | aligned_metadata_only |
| Registry username | `acrncdevsentinel` | `acrncdevsentinel` | aligned_metadata_only |
| Registry password reference | `registry-password` | `registry-password` | aligned_secret_ref_only |

## Remaining Deployment Blockers

| Blocker | Status | Required Before Deployment |
| --- | --- | --- |
| Direct env values | not restored, not printed | approved value source and mutation plan |
| Secret values | not accessed, not printed | approved secret verification path if needed |
| Managed environment ID | repo-local evidence only | sanitized read-only verification if deployment is pursued |
| Rollback plan | not complete | define prior image/revision and rollback command |
| Deployment command | not approved | explicit operator approval |
| Post-deploy verification | not approved | health/proof/audit/public bridge plan |

## Sentinel AI Recommendation

```txt
V1.1 is complete as internal verification. It strengthens deployment traceability, but deployment remains blocked.
```

The next deployment-facing step is not deployment. It is a deployment approval packet only after rollback, managed environment verification, command review, and post-deploy checks are explicitly prepared.

## Non-Authorization Clause

This redacted value source verification does not authorize deployment, runtime mutation, direct env value restoration, secret value access, secret value disclosure, registry credential mutation, managed identity migration, rollback execution, endpoint publication, pilot activation, tenant activation, held-standard promotion, push, or autonomous execution.
