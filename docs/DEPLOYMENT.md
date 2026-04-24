# Deployment Guide — SentinelOS NON-DEMO

## Overview
This guide walks through completing Azure deployment for the Sentinel API.

## Current Live Deployment
As of 2026-04-24:

- Container App: `ca-sentinelos-proof`
- active revision: `ca-sentinelos-proof--0000003`
- image: `acrncdevsentinel.azurecr.io/sentinel-api:proof-rate-limit-v1`
- live proof URL: `https://ca-sentinelos-proof.calmhill-388e1d39.eastus2.azurecontainerapps.io/proof`
- `/health` verified with `database: "enabled"`
- rotated API key verified live
- per-IP command rate limiting verified live

## Required GitHub Secrets
Add the following under Settings → Secrets → Actions:

- AZURE_CREDENTIALS
- ACR_LOGIN_SERVER
- ACR_USERNAME
- ACR_PASSWORD
- CONTAINER_APP_NAME
- AZURE_RESOURCE_GROUP
- SENTINEL_API_KEY
- DATABASE_URL

## Deployment Flow
1. Push to main
2. GitHub Actions builds Docker image
3. Image is pushed to Azure Container Registry
4. Container App is updated

## Verify Deployment
Once deployed:

GET /health

Expected:
{
  "status": "ok",
  "database": "enabled"
}

POST /command without `x-api-key`

Expected:
{
  "status": "blocked",
  "error": "Unauthorized"
}

GET /v1/audit with `x-api-key`

Expected:
{
  "status": "ok",
  "count": 1
}

Proof target:
- `applications` contains the submitted workflow record
- `deals` contains the executed deal record
- `audit_logs` contains the workflow audit trail

See [MICROSOFT_SENTINEL.md](./MICROSOFT_SENTINEL.md) for the Log Analytics and Microsoft Sentinel verification path.

## Next Steps
- add custom domain (.io)
- enable TLS and secure ingress
- connect Container Apps diagnostics to the Sentinel-backed Log Analytics workspace
- verify `command.auth.denied`, `command.executed`, and `command.rate_limited` in Log Analytics
- expand audit logging and control-plane visibility
