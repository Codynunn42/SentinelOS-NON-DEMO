# Azure Container App Sanitized Export - 2026-05-18

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[KEEP:A4.3R-SANITIZED-RUNTIME-EXPORT]
```

## Approval Scope

`A4.3R` approved a fresh sanitized Azure Container App export.

This artifact records read-only runtime evidence for reconciliation review. It does not authorize deployment mutation, YAML reconciliation, secret access, secret disclosure, runtime mutation, promotion, publication, or operational activation.

## Core Invariant

```txt
Runtime evidence informs reconciliation. Runtime evidence does not independently authorize deployment mutation.
```

## Export Boundary

Captured:

- Container App identity
- provisioning state
- active revision posture
- ingress and target port
- image reference
- registry reference names
- secret names only
- environment variable names and `secretRef` posture only
- health probes
- resource settings
- scale settings

Not captured:

- secret values
- direct environment variable values
- API keys
- connection strings
- tokens
- deployment credentials

## Read-Only Export Command

```bash
az containerapp show \
  --name ca-nc-dev-sentinel \
  --resource-group rg-nc-dev-sentinel \
  --query "{id:id,name:name,resourceGroup:resourceGroup,location:location,provisioningState:properties.provisioningState,latestRevisionName:properties.latestRevisionName,latestReadyRevisionName:properties.latestReadyRevisionName,latestRevisionFqdn:properties.latestRevisionFqdn,configuration:{activeRevisionsMode:properties.configuration.activeRevisionsMode,ingress:properties.configuration.ingress,registries:properties.configuration.registries,secrets:properties.configuration.secrets[].{name:name}},template:{revisionSuffix:properties.template.revisionSuffix,containers:properties.template.containers[].{name:name,image:image,env:env[].{name:name,secretRef:secretRef},probes:probes,resources:resources},scale:properties.template.scale}}" \
  -o json
```

## Runtime Summary

| Field | Value |
| --- | --- |
| Container App | `ca-nc-dev-sentinel` |
| Resource Group | `rg-nc-dev-sentinel` |
| Location | `East US 2` |
| Provisioning State | `Succeeded` |
| Active Revision Mode | `Single` |
| Latest Revision | `ca-nc-dev-sentinel--0000030` |
| Latest Ready Revision | `ca-nc-dev-sentinel--0000030` |
| Ingress FQDN | `ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io` |
| Revision FQDN | `ca-nc-dev-sentinel--0000030.calmhill-388e1d39.eastus2.azurecontainerapps.io` |
| External Ingress | `true` |
| Allow Insecure | `false` |
| Target Port | `80` |
| Traffic | latest revision, `100%` |
| Transport | `Auto` |
| Image | `acrncdevsentinel.azurecr.io/sentinel-api:phase1-approval-continuity-3e7308a-20260513-0645` |
| Min Replicas | `1` |
| Max Replicas | `2` |
| CPU | `0.5` |
| Memory | `1Gi` |

## Registry Posture

| Server | Username | Password Reference | Identity |
| --- | --- | --- | --- |
| `acrncdevsentinel.azurecr.io` | `acrncdevsentinel` | `registry-password` | empty |

## Secret Names

Secret names were exported without values:

- `azure-client-secret`
- `billing-sign-key`
- `database-url`
- `registry-password`
- `sentinel-api-key`
- `sentinel-github-token`
- `stripe-secret-key`
- `sentinel-hmac-secret`

## Environment Variable Posture

| Name | Secret Reference |
| --- | --- |
| `NODE_ENV` | none |
| `PORT` | none |
| `SENTINEL_VERSION` | none |
| `AZURE_TENANT_ID` | none |
| `AZURE_API_AUDIENCE` | none |
| `AZURE_AUTHORITY` | none |
| `AZURE_REDIRECT_URI` | none |
| `AZURE_CLIENT_ID` | none |
| `AZURE_CLIENT_SECRET` | `azure-client-secret` |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | none |
| `REPORTING_WEBHOOK_URL` | none |
| `DATABASE_URL` | `database-url` |
| `STRIPE_SECRET_KEY` | `stripe-secret-key` |
| `BILLING_SIGN_KEY` | `billing-sign-key` |
| `APPCONFIG_ENDPOINT` | none |
| `SENTINEL_AUTH_MODE` | none |
| `SENTINEL_SMOKE_AUTH` | none |
| `SENTINEL_ENV` | none |
| `SENTINEL_GITHUB_TOKEN` | `sentinel-github-token` |
| `SENTINEL_API_KEY` | `sentinel-api-key` |
| `SENTINEL_KEY_ROTATED_AT` | none |
| `SENTINEL_HMAC_SECRET` | `sentinel-hmac-secret` |

## Health Probe Posture

| Probe | Path | Port | Initial Delay | Period | Timeout | Failure Threshold |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Liveness | `/health` | 80 | 10 | 30 | 3 | 3 |
| Readiness | `/health` | 80 | 5 | 10 | 3 | 3 |
| Startup | `/health` | 80 | 5 | 10 | 3 | 30 |

## Reconciliation Implications

The fresh sanitized export confirms the current runtime posture:

- runtime ingress target port is `80`
- runtime health path is `/health`
- runtime image is `acrncdevsentinel.azurecr.io/sentinel-api:phase1-approval-continuity-3e7308a-20260513-0645`
- active revision mode is `Single`
- latest ready revision is `ca-nc-dev-sentinel--0000030`
- secret-bearing env vars use `secretRef`
- `azure/container-app.yaml` was reconciled repo-locally under A4.2 after this export

## Sentinel AI Finding

`A4.3R` can now be classified as:

```txt
completed_with_fresh_sanitized_export
```

`A4.2` moved from:

```txt
held_until_fresh_export
```

to:

```txt
completed_repo_local_yaml_reconciliation
```

This export satisfied the runtime evidence prerequisite. A4.2 completion remains repo-local and does not authorize deployment.

## Non-Authorization Clause

This sanitized runtime export is evidence only. It does not authorize deploy-authoritative YAML reconciliation, runtime mutation, deployment mutation, secret mutation, external publication, held-standard promotion, pilot activation, tenant activation, or autonomous execution.
