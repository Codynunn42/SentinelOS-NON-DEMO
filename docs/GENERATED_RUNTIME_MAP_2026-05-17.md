# Generated Runtime Map - 2026-05-17

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[KEEP:GENERATED-RUNTIME-MAP-A4.3]
```

## Approval Boundary

```txt
A4.3 - generated runtime map as authoritative evidence
```

Approved scope:

- create a sanitized runtime map
- compare live/runtime/documentation/IaC truth sources
- preserve secrets and avoid printing values
- produce remediation suggestions for later approval

Not approved:

- runtime mutation
- deployment mutation
- secret mutation
- YAML reconciliation
- marking `azure/container-app.yaml` deploy-authoritative
- public/buyer-facing publication

## Evidence Status

| Evidence Source | Status | Notes |
| --- | --- | --- |
| Prior live Container App export | available | `docs/INFRASTRUCTURE_TRUTH_RECONCILIATION_2026-05-15.md` remains the last full live export evidence |
| Public bridge status | refreshed | `https://nunncorporation.com/api/status` returned connected backend status |
| Direct Azure CLI export | blocked in this pass | approval hook denied escalated `az containerapp show`; no fresh export captured |
| Direct Container App health | blocked in this pass | sandbox DNS failed for direct Container App FQDN |
| Local IaC scaffold | inspected | `azure/container-app.yaml` remains scaffold-only with placeholders and `targetPort: 3000` |
| Deployment docs | inspected | `docs/DEPLOYMENT.md` contains older revision/image details and should not be treated as live revision authority |

## Refreshed Public Bridge Evidence

Command:

```bash
curl -sS https://nunncorporation.com/api/status
```

Result summary:

```txt
status: connected
backend.status: ok
backend.service: sentinel-api
backend.mode: non-demo
backend.tier: PUBLIC
backend.database: enabled
backend.timestamp: 2026-05-18T00:11:44.433Z
checkedAt: 2026-05-18T00:11:44.448Z
```

## Canonical Runtime Map

| Field | Current Map |
| --- | --- |
| Container App | `ca-nc-dev-sentinel` |
| Resource Group | `rg-nc-dev-sentinel` |
| Subscription | `82bd72d4-00ef-400d-839b-e168e980c510` |
| Region | `East US 2` |
| Public FQDN | `ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io` |
| Public Bridge | `https://nunncorporation.com/api/status` |
| Runtime Mode | `non-demo` per refreshed bridge evidence |
| Backend Status | `ok` per refreshed bridge evidence |
| Database | `enabled` per refreshed bridge evidence |
| Last Full Live Export | `docs/INFRASTRUCTURE_TRUTH_RECONCILIATION_2026-05-15.md` |
| Last Full Export Revision | `ca-nc-dev-sentinel--phase1-approve-0645` |
| Last Full Export Image | `acrncdevsentinel.azurecr.io/sentinel-api:phase1-approval-continuity-3e7308a-20260513-0645` |
| Last Full Export Target Port | `80` |
| Last Full Export Health Route | `/health` |
| Last Full Export Scale | `1 / 2` |
| Secret Posture | `SENTINEL_HMAC_SECRET` moved to `secretRef: sentinel-hmac-secret` per A2.2 evidence |

## Truth Source Classification

| Source | Classification | Current Treatment |
| --- | --- | --- |
| Live Azure runtime | authoritative current runtime | authoritative, but fresh export is needed before any IaC reconciliation |
| Generated runtime map | authoritative evidence artifact | records current known truth and evidence gaps |
| `azure/container-app.yaml` | scaffold-only | not deploy-authoritative; do not redeploy from it |
| `docs/DEPLOYMENT.md` | operator guide with stale volatile details | should link to runtime map for revision/image truth |
| Public bridge status | runtime reachability evidence | confirms public site reaches non-demo backend |

## Drift Findings

### A4-F1 - Scaffold IaC Drift

`azure/container-app.yaml` still contains placeholders and:

```txt
targetPort: 3000
```

Known live runtime posture from the last full export uses:

```txt
targetPort: 80
health route: /health
```

Classification: `deployment_manifest_drift`

Risk: medium

Governance note: do not use this file as a deployment source until A4.2 is explicitly approved and fresh live export evidence is available.

### A4-F2 - Volatile Deployment Doc Drift

`docs/DEPLOYMENT.md` still carries static revision/image details. Those values have historically drifted as releases changed.

Classification: `runtime_documentation_drift`

Risk: low to medium

Governance note: static deployment docs should describe how to verify revision/image, not act as the volatile revision source of truth.

### A4-F3 - Fresh Export Evidence Gap

The approved A4.3 pass attempted a fresh read-only Azure export, but the escalation hook denied `az containerapp show`. Direct Container App health also failed under sandbox DNS. The public bridge status succeeded.

Classification: `evidence_collection_gap`

Risk: medium

Governance note: A4.3 can establish the runtime map structure and current public bridge evidence, but A4.2 YAML reconciliation should remain blocked until a fresh sanitized Azure export is captured.

May 18 update:

```txt
A4.3R completed with fresh sanitized export in docs/AZURE_CONTAINER_APP_SANITIZED_EXPORT_2026-05-18.md.
A4.2 completed repo-local YAML reconciliation on 2026-05-18. Deployment remains unapproved.
```

## Sentinel AI Remediation Suggestions

### R-A4-1 - Preserve Live Runtime As Current Authority

Keep live Azure runtime as authoritative until a deploy-authoritative IaC file is explicitly reconciled and approved.

Suggested next approval:

```txt
A4.3R - refresh sanitized Azure Container App export
```

Scope: read-only export, secrets redacted, no runtime mutation.

Status update:

```txt
A4.3R was approved by operator and completed on 2026-05-18.
```

Observed blockers:

```txt
az containerapp show: permission hook denied escalated read-only Azure CLI command
direct Container App health: permission hook denied escalated curl command
public bridge refresh: sandbox DNS resolution failed when run non-escalated
```

Governance handling:

```txt
Treat A4.3R as completed_with_fresh_sanitized_export.
Do not deploy the A4.2 reconciled YAML without explicit deployment approval.
Use docs/AZURE_CONTAINER_APP_SANITIZED_EXPORT_2026-05-18.md as the fresh export evidence.
```

Recommended execution path:

```bash
az containerapp show \
  --name ca-nc-dev-sentinel \
  --resource-group rg-nc-dev-sentinel \
  --query "{name:name,resourceGroup:resourceGroup,location:location,provisioningState:properties.provisioningState,runningStatus:properties.runningStatus,latestRevisionName:properties.latestRevisionName,latestReadyRevisionName:properties.latestReadyRevisionName,latestRevisionFqdn:properties.latestRevisionFqdn,environmentId:properties.environmentId,ingress:{external:properties.configuration.ingress.external,allowInsecure:properties.configuration.ingress.allowInsecure,targetPort:properties.configuration.ingress.targetPort,traffic:properties.configuration.ingress.traffic},registries:properties.configuration.registries[].{server:server,identity:identity},containers:properties.template.containers[].{name:name,image:image,env:env[].{name:name,secretRef:secretRef},probes:probes,resources:resources},scale:properties.template.scale,secrets:properties.configuration.secrets[].{name:name}}" \
  -o json
```

Secret values must remain excluded from the export.

### R-A4-2 - Mark `azure/container-app.yaml` Scaffold-Only

Add a visible warning to `azure/container-app.yaml` that it is scaffold-only and not safe for deployment.

Suggested next approval:

```txt
A4.1 - mark azure/container-app.yaml scaffold-only and non-deployable
```

Scope: documentation/IaC comment only, no deployment.

Status:

```txt
approved_completed
```

Completion:

```txt
azure/container-app.yaml now carries [HOLD:SCAFFOLD-ONLY-NON-DEPLOYABLE] and explicitly blocks deploy use until A4.2 is approved after fresh export evidence.
```

### R-A4-3 - Move Volatile Revision/Image Truth Out Of Static Deployment Docs

Revise `docs/DEPLOYMENT.md` so revision and image values point to generated runtime-map evidence instead of aging inside the static guide.

Suggested next approval:

```txt
A5.2/A5.3 - remove volatile revision/image authority from static docs and add last-verified command/timestamp section
```

Scope: docs only, no runtime mutation.

Status:

```txt
approved_completed
```

Completion:

```txt
docs/DEPLOYMENT.md no longer presents stale static revision/image values as current authority. It links revision/image truth to runtime-map evidence and records the A4.3R completed evidence state.
```

### R-A4-4 - Block Deploy-Authoritative YAML Reconciliation Until Fresh Export Exists

A4.2 was brought forward and completed as repo-local YAML reconciliation because fresh sanitized Azure export evidence exists.

Suggested hold:

```txt
A4.2 complete - repo-local deploy-authoritative YAML reconciliation
```

Reason: reconciling IaC from stale or partial evidence can encode drift into the repo.

Status:

```txt
completed_repo_local_reconciliation
```

Governance handling:

```txt
A4.2 remains undeployed until separately approved.
```

## Non-Authorization Clause

This generated runtime map records runtime evidence, drift, and remediation suggestions. It does not authorize deployment, runtime mutation, secret mutation, YAML reconciliation, or external publication.
