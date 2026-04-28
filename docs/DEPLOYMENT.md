# Deployment Guide — SentinelOS NON-DEMO

## Overview
This guide walks through completing Azure deployment for the Sentinel API.

## Current Live Deployment
As of 2026-04-28:

- Container App: `ca-nc-dev-sentinel`
- active revision: `ca-nc-dev-sentinel--decision-signing-v1`
- image: `acrncdevsentinel.azurecr.io/sentinelos:latest`
- live URL: `https://ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io/`
- live proof URL: `https://ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io/proof`
- health URL: `https://ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io/health`
- ingress target port: `80`
- container port: `80`
- health probes: HTTP `/health` on port `80`
- traffic: 100 percent to `ca-nc-dev-sentinel--decision-signing-v1`
- Log Analytics workspace: `log-nc-dev-sentinel`

Do not use `ca-sentinelos-proof` as the current shareable proof target. It appears to be an older health-only host and is not the current release path.

## Required GitHub Secrets
Add the following under Settings → Secrets → Actions:

- AZURE_CREDENTIALS
- ACR_LOGIN_SERVER
- CONTAINER_APP_NAME
- AZURE_RESOURCE_GROUP
- SENTINEL_API_KEY
- DATABASE_URL

`AZURE_CREDENTIALS` must have permission to push to `acrncdevsentinel` and update `ca-nc-dev-sentinel`. The Container App pulls from ACR with the user-assigned managed identity `id-nc-dev-sentinel`, which should keep `AcrPull` on the registry.

## Deployment Flow
1. Push to main
2. GitHub Actions builds `acrncdevsentinel.azurecr.io/sentinelos:<commit-sha>`
3. GitHub Actions also updates `acrncdevsentinel.azurecr.io/sentinelos:latest`
4. Container App is updated with a commit-based revision suffix
5. GitHub Actions smoke-tests the public `/health` endpoint
6. GitHub Actions prints the 100% traffic revision health state

## Verify Deployment
Once deployed:

GET /proof

Expected:

```txt
HTTP 200 with the OwnerFi proof UI
```

GET /health

Expected:

```json
{
  "status": "ok",
  "service": "sentinel-api",
  "mode": "non-demo",
  "database": "enabled"
}
```

GET /v1/audit without `x-api-key`

Expected:

```json
{
  "status": "blocked",
  "error": "Unauthorized"
}
```

Protected OwnerFi proof workflow:

```bash
BASE_URL=https://ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io \
TENANT=ownerfi \
API_KEY=<current-sentinel-api-key> \
bash scripts/demo.sh
```

Expected:

- `submit.status` is `executed`
- `evaluate.applicationStatus` is `approved`
- `deal.dealStatus` is `active`
- `audit.count` is `3`

Revision health:

```bash
az containerapp revision list \
  --name ca-nc-dev-sentinel \
  --resource-group rg-nc-dev-sentinel \
  --output table
```

## Database Migrations

The live PostgreSQL database has been migrated for persistent approvals.

Applied on 2026-04-26:

- table: `approvals`
- columns: `id`, `tenant_id`, `status`, `decision`, `context`, `resolution`, `created_at`, `updated_at`, `resolved_at`
- JSON fields: `decision`, `context`, `resolution`

Migration path used:

1. Temporary PostgreSQL firewall rule for the operator IP
2. `node scripts/db-apply-schema.js`
3. schema verification through `information_schema.columns`
4. temporary PostgreSQL firewall rule removed

See [MICROSOFT_SENTINEL.md](./MICROSOFT_SENTINEL.md) for the Log Analytics and Microsoft Sentinel verification path.

## Next Steps
- add custom domain (.io)
- split dev, staging, and production Container Apps
- add `/status` and `/version`
- expand audit logging and control-plane visibility
