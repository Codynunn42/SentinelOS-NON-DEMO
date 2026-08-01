# Deployment Recovery Procedures - 2026-05-15

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[KEEP:DEPLOYMENT-RECOVERY-PROCEDURES]
```

## Purpose

Define safe recovery behavior when runtime truth, deployment manifests, public bridge status, or repo lineage drift.

## Recovery Philosophy

```txt
verify first
classify second
modify last
```

No runtime modification is allowed from stale documentation alone.

## Current Runtime Authority

```txt
Container App: ca-nc-dev-sentinel
Resource Group: rg-nc-dev-sentinel
Revision: ca-nc-dev-sentinel--phase1-approve-0645
Image: acrncdevsentinel.azurecr.io/sentinel-api:phase1-approval-continuity-3e7308a-20260513-0645
Target port: 80
Health path: /health
```

## Recovery Step 1: Confirm Runtime

```bash
az containerapp show --name ca-nc-dev-sentinel --resource-group rg-nc-dev-sentinel -o json
curl -sS https://ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io/health
curl -sS https://nunncorporation.com/api/status
```

Expected:

```txt
runningStatus: Running
provisioningState: Succeeded
health/status: ok or connected
database: enabled
```

## Recovery Step 2: Classify Drift

| Drift | Action |
| --- | --- |
| public bridge down, direct backend healthy | inspect public site bridge/deploy |
| direct backend down | inspect Container App revision, logs, health probes |
| docs stale, runtime healthy | update docs/runtime map only |
| YAML mismatch, runtime healthy | reconcile IaC before redeploy |
| secret exposed as env value | rotate and convert to secretRef |
| repo degraded | do not deploy from degraded repo |

## Recovery Step 3: Preserve Evidence

Before changing runtime:

- save current runtime map
- save current revision/image
- save health response
- save public bridge response
- record repo branch and commit
- record approval/audit impact

## Recovery Step 4: Approval Gates

Requires explicit approval:

- Container App update
- traffic shift
- secret rotation
- image rollback
- manifest replacement
- Git cleanup in degraded repo

## Recovery Step 5: Post-Recovery Verification

Run:

```bash
curl -sS https://ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io/health
curl -sS https://nunncorporation.com/api/status
pnpm run check:execution-integrity
pnpm run check:policy
pnpm run check:approval-bottleneck
```

Record:

```txt
old revision:
new revision:
image:
health:
public bridge:
governance checks:
approval continuity:
audit impact:
```

## Source Documents

- `docs/DEPLOYMENT.md`
- `docs/INFRASTRUCTURE_TRUTH_RECONCILIATION_2026-05-15.md`
- `docs/REPO_INTEGRITY_STABILIZATION_2026-05-15.md`
