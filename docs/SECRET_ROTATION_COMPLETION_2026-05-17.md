# Secret Rotation Completion - 2026-05-17

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[KEEP:SECRET-ROTATION-COMPLETION-EVIDENCE]
```

## Approval Boundary

Approved item:

```txt
A2.2 - rotate the direct HMAC-like runtime env value and move it behind a secret reference
```

This completion record documents the approved runtime security mutation. It does not print secret values, authorize additional rotations, approve deployment changes, grant tool access, publish externally, or promote any held governance artifact.

## Runtime Target

| Field | Value |
| --- | --- |
| Container App | `ca-nc-dev-sentinel` |
| Resource Group | `rg-nc-dev-sentinel` |
| Latest Revision Observed | `ca-nc-dev-sentinel--0000030` |
| Provisioning State | `Succeeded` |
| Running Status | `Running` |
| Rotation Timestamp Marker | `2026-05-17T10:17:04Z` |

## Mutation Performed

| Item | Result |
| --- | --- |
| New managed secret created | `sentinel-hmac-secret` |
| `SENTINEL_HMAC_SECRET` env updated | now references `secretRef: sentinel-hmac-secret` |
| Direct HMAC-class env value removed from env posture | yes |
| `SENTINEL_KEY_ROTATED_AT` updated | yes |
| Secret value printed or persisted in docs | no |

## Redacted Verification Evidence

Redacted runtime query confirmed:

```txt
SENTINEL_HMAC_SECRET -> secretRef: sentinel-hmac-secret
sentinel-hmac-secret present in managed Container App secret names
provisioningState: Succeeded
runningStatus: Running
```

Direct Sentinel health:

```txt
GET https://ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io/health
status: ok
service: sentinel-api
mode: non-demo
tier: PUBLIC
database: enabled
checked: 2026-05-17T10:37:16Z
```

Public bridge status:

```txt
GET https://nunncorporation.com/api/status
status: connected
backend.status: ok
backend.service: sentinel-api
backend.mode: non-demo
backend.tier: PUBLIC
backend.database: enabled
checkedAt: 2026-05-17T10:23:11Z
```

Note: public bridge returned connected status with a backend timestamp that did not refresh during this check. Direct backend health was verified after rotation.

## Remaining Secondary Review Items

| Item | Status |
| --- | --- |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` direct env classification | still requires documented classification |
| empty Azure config placeholders | still require cleanup review if unused |
| `SENTINEL_SMOKE_AUTH` runtime flag | still requires review before production-grade trust claim |

## A2 Status

```txt
A2.1 completed
A2.2 completed
A2.3 still recommended as documentation/control rule
```

## Non-Authorization Clause

This record documents one approved secret rotation. It does not authorize additional runtime mutation, deployment changes, external publication, production-readiness claims, or future secret access.
