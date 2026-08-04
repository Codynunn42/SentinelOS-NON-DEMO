# Secret Configuration Inventory - 2026-05-17

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[KEEP:REDACTED-SECRET-INVENTORY]
```

## Approval Boundary

Approved item:

```txt
A2.1 - Prepare a read-only secret inventory report that lists secret names only, with values redacted.
```

This report is read-only. It does not rotate secrets, update runtime env vars, create Container App secrets, restart revisions, deploy code, change infrastructure, or authorize A2.2.

Secret values are intentionally omitted.

## Source Runtime

| Field | Value |
| --- | --- |
| Container App | `ca-nc-dev-sentinel` |
| Resource Group | `rg-nc-dev-sentinel` |
| Revision Mode | `Single` |
| Ingress | `external` |
| Target Port | `80` |

## Container App Secret Names

The live Container App currently exposes these managed secret names:

| Secret Name | Value Status |
| --- | --- |
| `azure-client-secret` | redacted |
| `billing-sign-key` | redacted |
| `database-url` | redacted |
| `registry-password` | redacted |
| `sentinel-api-key` | redacted |
| `sentinel-github-token` | redacted |
| `stripe-secret-key` | redacted |

## Env Vars Using Secret References

| Env Var | Secret Reference | Value Status |
| --- | --- | --- |
| `AZURE_CLIENT_SECRET` | `azure-client-secret` | redacted |
| `DATABASE_URL` | `database-url` | redacted |
| `STRIPE_SECRET_KEY` | `stripe-secret-key` | redacted |
| `BILLING_SIGN_KEY` | `billing-sign-key` | redacted |
| `SENTINEL_GITHUB_TOKEN` | `sentinel-github-token` | redacted |
| `SENTINEL_API_KEY` | `sentinel-api-key` | redacted |

## Direct Env Vars Observed

The following env vars are configured directly rather than through a secret reference.

| Env Var | Classification | Recommended Posture |
| --- | --- | --- |
| `NODE_ENV` | non-secret runtime setting | keep direct |
| `PORT` | non-secret runtime setting | keep direct |
| `SENTINEL_VERSION` | non-secret release marker | keep direct |
| `AZURE_TENANT_ID` | identifier / tenant setting | acceptable direct if intended public identifier |
| `AZURE_API_AUDIENCE` | identifier / API audience setting | acceptable direct if intended public identifier |
| `AZURE_AUTHORITY` | empty / config placeholder | review and remove if unused |
| `AZURE_REDIRECT_URI` | empty / config placeholder | review and remove if unused |
| `AZURE_CLIENT_ID` | empty / config placeholder | review and remove if unused |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | telemetry connection string | review; consider managed secret or documented non-secret posture |
| `REPORTING_WEBHOOK_URL` | empty / config placeholder | review and remove if unused |
| `APPCONFIG_ENDPOINT` | service endpoint | acceptable direct if no credential embedded |
| `SENTINEL_AUTH_MODE` | runtime mode setting | keep direct |
| `SENTINEL_SMOKE_AUTH` | runtime mode flag | review before production-grade claim |
| `SENTINEL_ENV` | environment label | keep direct |
| `SENTINEL_KEY_ROTATED_AT` | rotation timestamp marker | keep direct |
| `SENTINEL_HMAC_SECRET` | secret-class direct value | rotate and move behind secret reference |

## Primary Finding

```txt
SENTINEL_HMAC_SECRET is configured as a direct runtime env value.
```

Severity:

```txt
high
```

Required next posture:

```txt
approve A2.2 before mutation
```

Recommended A2.2 remediation:

1. Generate replacement HMAC secret value outside reports.
2. Store the replacement as a managed Container App secret.
3. Update `SENTINEL_HMAC_SECRET` to reference the managed secret.
4. Update rotation marker after successful change.
5. Verify `/health`.
6. Verify public bridge `/api/status`.
7. Record redacted completion evidence.

## Secondary Review Items

| Item | Reason |
| --- | --- |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` direct env | may be acceptable telemetry configuration, but should be explicitly classified |
| empty Azure config placeholders | reduce runtime ambiguity if unused |
| `SENTINEL_SMOKE_AUTH` direct runtime flag | review before production-grade trust claim |

## Non-Authorization Clause

This inventory identifies secret posture. It does not authorize rotation, runtime mutation, deployment, restart, revision change, external publication, or production-readiness claim.

A2.2 remains blocked until explicitly approved.
