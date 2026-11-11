# Sentinel Runtime Evidence — 2026-11-11

**Collection mode:** Read-only Azure Resource Manager inspection, GitHub Actions record review, and HTTP GET probes.  
**No deployment, configuration, or credential changes were made.**

## Current Azure observation

Azure Container App `ca-nc-dev-sentinel` in `rg-nc-dev-sentinel`, `eastus2`:

- App ingress is enabled at `ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io`, target port `3000`.
- Latest and latest-ready revision: `ca-nc-dev-sentinel--sha-e1371a6-62-1`.
- Revision image: `acrncdevsentinel.azurecr.io/sentinel-api:e1371a6a8d8e9f574e8703196061db359fe160c6`.
- Revision state: `Healthy`, `Provisioned`, `Running`; one replica; traffic weight `100`.
- Startup, readiness, and liveness probes use HTTP `/health` on port `3000`.
- Azure read-only refresh was bracketed by `2026-11-11T22:01:50.695233343Z` and `2026-11-11T22:02:01.080384724Z`. The revision's creation time is `2026-11-04T06:05:42Z`.

The Azure response included configuration fields not needed for this evidence packet. Secret values and telemetry connection strings were not retained here.

## Current HTTP probes

At `2026-11-11T22:00:12.935845698Z`, read-only GET requests to the app FQDN returned:

| Request | Result |
|---|---|
| `GET /health` | HTTP `200`; response fields `status=ok`, `service=sentinel-api` |
| Unauthenticated `GET /approvals` | HTTP `401` |

No authenticated request was made during this collection; no API credential was retrieved or used.

## Exact historical deployment workflow

The deployed image commit is `e1371a6a8d8e9f574e8703196061db359fe160c6` on `main`, not the Forethought candidate commit (`fd142a8af84e396d7fcd1584348b73f455dcf910`) or its dirty/untracked source snapshot.

- Workflow: [Deploy to Azure Container Apps — run 41783025782](https://github.com/Codynunn42/SentinelOS-NON-DEMO/actions/runs/41783025782)
- Run: completed successfully, `2026-11-04T06:03:30Z`–`2026-11-04T06:06:51Z`.
- Validation job: `06:03:34Z`–`06:04:11Z`, successful.
- Deployment job: `06:04:14Z`–`06:06:50Z`, successful.
- The exact-revision health/traffic check succeeded on retry 3; its required conditions were Healthy, Provisioned, expected image/port, and 100% traffic.
- The smoke-test step succeeded. Its log explicitly recorded authenticated `GET /approvals` HTTP `200`. The workflow asserted the unauthenticated request was either `401` or `403`; the historical log does not preserve which code. The current probe above separately recorded `401`.
- The workflow's smoke test recorded `/health` as successful. The current probe above separately records the response fields.

The [successful scheduled run 42661251698](https://github.com/Codynunn42/SentinelOS-NON-DEMO/actions/runs/42661251698) on `2026-11-09` used the same `e1371a6...` commit; it is not a deployment of the Forethought candidate.

## Scope and limitations

- These observations establish current runtime status for the deployed `e1371a6...` image only. They do not establish that the Forethought candidate was deployed, tested in Azure, or operationally accepted.
- The authenticated result is from the Nov. 4 deployment workflow; no authenticated probe was made on Nov. 11.
- No hosted workflow run or pull request was found for the Forethought candidate commit/branch. The candidate files remain untracked and the `package.json` edit remains local.
- This evidence does not change GOV-001, GOV-002, GOV-006, or the Forethought HOLD.
