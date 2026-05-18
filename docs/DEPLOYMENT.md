# Deployment Guide — SentinelOS NON-DEMO

## Overview
This guide walks through completing Azure deployment for the Sentinel API.

## Current Live Deployment

- Container App: `ca-nc-dev-sentinel`
- live URL: `https://ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io/`
- live proof URL: `https://ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io/proof`
- health URL: `https://ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io/health`
- ingress target port: `80`
- container port: `80`
- health probes: HTTP `/health` on port `80`
- Log Analytics workspace: `log-nc-dev-sentinel`

Revision and image values are volatile runtime truth. Do not treat this static guide as the revision or image authority.

Current runtime evidence lives in:

- `docs/AZURE_CONTAINER_APP_SANITIZED_EXPORT_2026-05-18.md`
- `docs/GENERATED_RUNTIME_MAP_2026-05-17.md`
- `docs/INFRASTRUCTURE_TRUTH_RECONCILIATION_2026-05-15.md`

Last full live export evidence:

```txt
document: docs/INFRASTRUCTURE_TRUTH_RECONCILIATION_2026-05-15.md
revision: ca-nc-dev-sentinel--phase1-approve-0645
image: acrncdevsentinel.azurecr.io/sentinel-api:phase1-approval-continuity-3e7308a-20260513-0645
targetPort: 80
health route: /health
```

Most recent bridge evidence:

```txt
document: docs/GENERATED_RUNTIME_MAP_2026-05-17.md
bridge: https://nunncorporation.com/api/status
status: connected
backend.status: ok
backend.mode: non-demo
backend.database: enabled
checkedAt: 2026-05-18T00:11:44.448Z
```

Fresh sanitized Azure export status:

```txt
A4.3R completed_with_fresh_sanitized_export.
A4.2 completed_repo_local_yaml_reconciliation.
Deployment of the reconciled YAML remains unapproved and requires separate value/binding review.
```

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

## Secret Configuration Control

Secret-class runtime values must use managed secret references. Do not place direct secret-like values in runtime env values, runtime exports, deployment evidence, executive snapshots, approval packets, public reports, or buyer-facing materials.

Verification reports should use name-only, redacted queries and should record `secretRef` posture without printing values. The active control rule is documented in `docs/SECRET_CONFIGURATION_CONTROL_RULE_2026-05-17.md`.

## Role-Scoped API Keys

Preferred production configuration is `SENTINEL_API_KEYS`, a JSON array of key records:

```json
[
  {
    "keyId": "key_ownerfi_operator_001",
    "secret": "<secret-value>",
    "tenant": "ownerfi",
    "actor": "gregg@ownerfi.com",
    "role": "operator",
    "scopes": [
      "application:submit",
      "application:read",
      "audit:read",
      "receipt:read",
      "approval:read"
    ],
    "status": "active",
    "createdAt": "2026-04-29T00:00:00.000Z",
    "expiresAt": "2026-07-29T00:00:00.000Z"
  }
]
```

`SENTINEL_API_KEY` remains as a compatibility bridge, but the server still resolves it into a full principal before protected routes or commands can run.

Every protected request must resolve:

```txt
tenant + actor + role + scopes
```

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

POST /v1/command with an operator-scoped key trying to execute `deal.execute`

Expected:

```json
{
  "status": "blocked",
  "error": "SCOPE_REQUIRED",
  "requiredScope": "deal:execute"
}
```

GET /v1/receipts/:receiptId with `x-api-key`

Expected:

```json
{
  "status": "ok",
  "receiptId": "rcpt_...",
  "receipt": {
    "receiptId": "rcpt_..."
  },
  "entry": {
    "command": "application.submit"
  }
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

Idempotency check:

```bash
node scripts/check-idempotency.js
```

Expected:

- duplicate `commandId` and identical payload returns `idempotentReplay: true`
- duplicate `commandId` with changed payload returns `IDEMPOTENCY_CONFLICT`

Approval access check:

```bash
node scripts/check-approval-access.js
```

Expected:

- operator key with `approval:read` can list and read pending approvals
- operator key without `approval:review` cannot approve or reject approvals
- approver key with `approval:review` can resolve approvals outside the demo boundary
- approval reads create `approval.viewed` audit events

Trust-test evidence:

```txt
docs/TRUST_TESTS_2026-04-29.md
```

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
