# Infrastructure Truth Reconciliation - 2026-05-15

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[KEEP:INFRASTRUCTURE-TRUTH-MAP]
```

## Command Envelope

```txt
ENV-2026-05-15-001-INFRASTRUCTURE-TRUTH
operation: infrastructure.truth.reconcile
status: executed_read_only
```

## Executive Result

Live Azure runtime is the authoritative deployment truth for the current SentinelOS NON-DEMO backend.

`docs/DEPLOYMENT.md` mostly matches the live runtime posture. `azure/container-app.yaml` is not deploy-authoritative in its current form because it still contains scaffold placeholders and an ingress target port that does not match the live Container App export.

## Canonical Runtime Map

| Field | Live Runtime Truth |
| --- | --- |
| Container App | `ca-nc-dev-sentinel` |
| Resource Group | `rg-nc-dev-sentinel` |
| Subscription | `82bd72d4-00ef-400d-839b-e168e980c510` |
| Region | `East US 2` |
| Managed Environment | `cae-nc-dev-sentinel` |
| Running Status | `Running` |
| Provisioning State | `Succeeded` |
| Active Revision Mode | `Single` |
| Latest Revision | `ca-nc-dev-sentinel--phase1-approve-0645` |
| Latest Ready Revision | `ca-nc-dev-sentinel--phase1-approve-0645` |
| Image | `acrncdevsentinel.azurecr.io/sentinel-api:phase1-approval-continuity-3e7308a-20260513-0645` |
| Registry | `acrncdevsentinel.azurecr.io` |
| Public FQDN | `ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io` |
| Ingress | external, insecure traffic disabled |
| Target Port | `80` |
| Container Port Env | `PORT=80` |
| Traffic | 100 percent latest revision |
| Min / Max Replicas | `1 / 2` |
| Health Route | `/health` |
| Liveness Probe | HTTP `/health` on port `80` |
| Readiness Probe | HTTP `/health` on port `80` |
| Startup Probe | HTTP `/health` on port `80` |
| Database | enabled per health responses |

## Public Bridge Verification

Direct Azure health check:

```txt
GET https://ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io/health
status: ok
service: sentinel-api
mode: non-demo
tier: PUBLIC
database: enabled
```

Public bridge check:

```txt
GET https://nunncorporation.com/api/status
status: connected
backend.status: ok
backend.service: sentinel-api
backend.mode: non-demo
backend.tier: PUBLIC
backend.database: enabled
```

## Source Comparison

| Source | Current Truth Status | Notes |
| --- | --- | --- |
| Live Azure Container App export | authoritative | Read-only export confirms runtime, ingress, revision, image, probes, scale, and env posture |
| `docs/DEPLOYMENT.md` | mostly aligned but stale in revision details | Correctly states live app, ACR, port 80, health route, and Log Analytics; revision/image values are older than live export |
| `azure/container-app.yaml` | scaffold only | Contains placeholders, empty registries, and `targetPort: 3000`; does not match live `targetPort: 80` |
| `nunncorporation.com/api/status` | public bridge evidence | Confirms public site reaches non-demo backend with database enabled |
| Local repo assumptions | partially aligned | Snapshot and deployment docs align on hardening posture, but IaC source needs reconciliation |

## Drift Findings

### 1. Manifest Port Drift

`azure/container-app.yaml` shows:

```txt
targetPort: 3000
```

Live runtime shows:

```txt
targetPort: 80
PORT=80
health probes on port 80
```

Classification: `deployment_manifest_drift`

Severity: `medium`

Decision: live runtime is authoritative. Update or replace the scaffold manifest only after deciding whether this repo should own deploy-authoritative IaC.

### 2. Manifest Completeness Drift

`azure/container-app.yaml` still has placeholders for managed environment, image, and secrets. Live runtime uses a user-assigned managed identity, Key Vault-backed secrets, ACR registry settings, probes, scale settings, and revision suffix.

Classification: `scaffold_only_configuration`

Severity: `medium`

Decision: do not use this YAML for redeploy until reconciled.

### 3. Documentation Revision Drift

`docs/DEPLOYMENT.md` captures the correct Container App and port posture, but its revision and image details are older than the live export.

Classification: `runtime_documentation_drift`

Severity: `low_to_medium`

Decision: update deployment docs with the current revision/image or move revision details into a generated runtime map to avoid stale static documentation.

### 4. Secret Configuration Risk

The live Container App export includes several Key Vault-backed secrets, which is the desired posture. It also includes one HMAC-like secret value configured directly as an environment value.

Classification: `secret_configuration_risk`

Severity: `high`

Decision: rotate that value and move it behind a secret reference before treating the runtime as production-grade. The value is intentionally not reproduced in this report.

## Recommended Authoritative Deployment Source

Adopt this source-of-truth order:

1. Live Azure Container App export for current runtime truth.
2. A sanitized exported runtime map for operator review.
3. A reconciled deploy-authoritative IaC file in `azure/`.
4. `docs/DEPLOYMENT.md` as the human deployment guide.
5. `docs/EXECUTIVE_SNAPSHOT_2026-05-15.md` as executive posture, not deploy configuration.

## Required Follow-Up

1. Export a sanitized Container App configuration into a repo artifact with secrets redacted.
2. Replace or update `azure/container-app.yaml` so it matches live runtime shape.
3. Decide whether revision/image values belong in `docs/DEPLOYMENT.md` or a generated runtime map.
4. Move direct secret env values into secret references.
5. Re-run direct `/health` and public bridge checks after any deploy-manifest change.

## Commands Run

```bash
az containerapp show --name ca-nc-dev-sentinel --resource-group rg-nc-dev-sentinel -o json
curl -sS https://ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io/health
curl -sS https://nunncorporation.com/api/status
```

No runtime modification was performed.
