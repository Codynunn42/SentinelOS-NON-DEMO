# OwnerFI and Deal Execution Azure evidence - October 21, 2026

## Scope and decision boundary

Read-only evidence collected at Cody's request by an AI assistant using Copilot
SDK in VS Code. All capture times below are UTC on October 21, 2026.
The early-morning UTC captures were October 20 in Arizona; the afternoon UTC
follow-up was October 21 in Arizona. This is collection and technical assessment, not
independent human review, deployment authorization, or executive acceptance.

**Retain GOV-006 Verification/open, GOV-001 Conditional, and GOV-002 HOLD.**
No deployment, configuration, traffic, register, or gate changes were made.
No deal, approval, payment, or command POST was executed. No API keys or
secret values were retrieved. The October 20 authenticated approvals evidence
was not repeated.

### Later raw-evidence packet

The [runtime review packet and roadmap](./2026-10-21_RUNTIME_REVIEW_PACKET_AND_ROADMAP.md)
adds fresh projected source outputs from 20:46-20:47 UTC, exact-SHA check
metadata, and review-only recovery/rollback procedures. Both replica CLI and
direct ARM reads still omit image digest; the ACR match is not running-replica
binding. A local checksummed **incomplete-evidence** bundle was assembled;
it is UNSENT, and Freddie's runtime verdict remains PENDING.
Earlier narrative-only evidence is explicitly distinguished from included raw
or projected captures. No gate, register or infrastructure changes were made.

## Answer: which surface is backed by what?

| Surface | Observed implementation | Supported conclusion |
| --- | --- | --- |
| [OwnerFI / Nexus UI][ownerfi] | Next.js UI served by Vercel. Deployed page bundle requests `/api/status`, but its listing, purchase, payment-refresh, checkout-link, and subscription demo handlers construct results and update React state locally. | A demo faceplate with a separate backend-status indicator. Its visible demo receipts do not establish Sentinel command execution or Stripe processing. |
| [Deal Execution `/proof`][deal] | HTML served directly from the Sentinel Azure Container App hostname. Deployed JavaScript sends intents to same-origin `/api/control/execute`. Matching repository source routes authenticated requests through the control plane to same-origin `/v1/command`. | A backend-wired proof faceplane on the Sentinel API host, not just the OwnerFI local-state demo. Successful end-to-end execution was not tested in this collection. |
| [Separate `ca-sentinelos-proof` app][alternate] | Another Azure Container App, with failed/unhealthy active revision and repeated startup failures. | Not the hostname serving the working Deal Execution page. No evidence establishes it as OwnerFI's backend. |

OwnerFI's cache-busted status endpoint returned a current response identifying
`sentinel-api`, `mode: non-demo`, and `database: enabled`. Repository source
for the status route defaults to the Azure `ca-nc-dev-sentinel` `/health` URL,
but permits a `SENTINEL_HEALTH_URL` override. The live Vercel deployment commit
and environment value remain unverified, so the exact production upstream is
not yet proven.

## Timestamped evidence checklist

Verified applies only to the described observation, not to gate closure.
Missing means not established by this collection, not necessarily nonexistent.

| ID | Status | Observation and limitation | Source | Capture time |
| --- | --- | --- | --- | --- |
| O1 | Verified | OwnerFI document is served by Vercel; title is `Nunn Corporation / Nexus Command`, and the page presents `OwnerFI Pilot on SentinelOS`. | [Live UI][ownerfi]; HTTP headers (`server: Vercel`) | 05:21:47-05:21:50 |
| O2 | Verified | Deployed page bundle preloads three vehicles, alerts, and two recent execution entries. Its command handler builds result text and inserts `status: executed` entries into browser state, without a command fetch. The bundle's only fetch call is `/api/status`. | [Deployed page bundle][ownerfi-bundle] | 05:24:36-05:26:28 |
| O3 | Verified | `/api/status` returned HTTP 200, `connected`, and a `sentinel-api` health-shaped object. The fresh response's backend timestamp was `05:24:39.436Z`, `checkedAt` `05:24:39.458Z`. | [Cache-busted status][ownerfi-status] | 05:24:39 |
| O4 | Needs clarification | Authenticated GitHub source read found `apps/nexus-ui/src/app/api/status/route.ts` at `f6a285cee8cb990d8ff3e5fe2683698e64183502` using `process.env.SENTINEL_HEALTH_URL` or defaulting to the Azure Sentinel `/health` URL. Live Vercel deployment commit and environment value remain unverified. | [Status route source][nexus-status-source]; [status][ownerfi-status] | Source read about 05:45-05:52 |
| O5 | Verified | Unqualified `/api/status` initially returned an older backend timestamp (`04:01:05.083Z`) at capture `05:23:12.974Z`. Cache-busted response was fresh; headers included `cache-control: public, max-age=31536000, immutable`, `x-vercel-cache: MISS`, `age: 0`. | [Status endpoint][ownerfi-status-base]; cache-busted response headers | 05:23:12-05:26:53 |
| D1 | Verified | Azure app `ca-nc-dev-sentinel`, resource group `rg-nc-dev-sentinel`, subscription `82bd72d4-00ef-400d-839b-e168e980c510`; hostname matches the live Deal Execution URL. | [Azure app][azure-sentinel]; `az containerapp show` | 05:28:18-05:28:20 |
| D2 | Verified | Latest and latest-ready revision are `ca-nc-dev-sentinel--sha-7eb0724-61-1`. Revision list reported active, Healthy, Provisioned, Running, and traffic weight 100. App ingress routes 100% to latest revision. | [Azure app][azure-sentinel]; `az containerapp revision list` | App configuration 05:28:18-05:28:20; exact revision/traffic recaptured 05:32:13-05:32:18 |
| D3 | Verified | Configured image is `acrncdevsentinel.azurecr.io/sentinel-api:7eb0724c730ac5c6be545d4f30d24ce1f1d4a7cd`. This is a configured tag, not an immutable running-image identity. | [Azure app][azure-sentinel] | 05:28:18-05:28:20 |
| D4 | Missing | Running image digest was not exposed by replica-list metadata. A container runtime ID was returned, but it is not an image digest. No claim that an ACR tag lookup binds the running replica. | `az containerapp replica list` for the exact revision | 05:19:42-05:19:46 |
| D5 | Verified | Replica `ca-nc-dev-sentinel--sha-7eb0724-61-1-dcf67fcf6-27r59` reported ready, started, Running, restart count 0. This is point-in-time metadata, not a recovery test. | Exact-revision replica list | 05:19:42-05:19:46 |
| D6 | Verified | Ingress target port and startup/readiness/liveness HTTP probe ports are all 3000; probes target `/health`. | [Azure app][azure-sentinel] | 05:28:18-05:28:20 |
| D7 | Verified | `/health` HTTP 200, service `sentinel-api`, mode `non-demo`, database `enabled`, server timestamp `05:24:37.985Z`. | [Health][health] | 05:24:37-05:24:38 |
| D8 | Verified | `/ready` HTTP 200, `ready: true`, no failed checks. However, `commit: unknown`; this endpoint does not identify the running build. Health and readiness responses alone do not prove durable business transactions. | [Readiness][ready] | 05:24:38 |
| D9 | Verified | `/proof` HTTP 200. Captured HTML SHA-256 equals the repository file at configured tag commit `7eb0724c730ac5c6be545d4f30d24ce1f1d4a7cd`: `bd80a741865d72808bbb8928fa5aeb717606961574aae2d07afbcc7f4ffad473`. This binds one asset's content, not the complete container image. | [Live proof][deal]; [commit source][proof-source] | Capture 05:21:49-05:21:50; comparison 05:26:28 |
| D10 | Verified | Live proof JavaScript posts to `/api/control/execute`; source requires API-key resolution and invokes the control plane with same-origin `/v1/command`. Relevant server/control-plane files have no diff between the configured commit and local HEAD. This is wiring evidence, not successful execution evidence. | [Proof source][proof-source]; [server source][server-source]; [control-plane source][control-source] | 05:23:12-05:28:18 |
| D11 | Verified | `/api/authority/status` returned HTTP 200 and `ENFORCED`; `lastAllowed`/`lastBlocked` were null. Application-reported authority is not Cody's deployment or gate approval. | [Authority status][authority] | 05:24:38 |
| D12 | Missing | No authenticated command, deal lifecycle, database recovery, Stripe checkout, or payment settlement was performed. Audit receipt persistence and recovery remain unverified. | Collection scope; [bounded-proof policy](../../../docs/proof-surface-explanation.md) | Entire collection |
| A1 | Verified | Separate app `ca-sentinelos-proof` uses `acrncdevsentinel.azurecr.io/sentinelos:latest`, target/probe port 80, revision `ca-sentinelos-proof--0000006`. Revision reported active, Unhealthy, provisioning Failed, running Failed, and traffic weight 100. App-level provisioning `Succeeded` does not override revision failure. | [Alternate Azure app][azure-alternate]; app/revision CLI reads | 05:19:42-05:21:48 |
| A2 | Verified | Alternate app system events reported `ContainerBackOff`, `Persistent Failure to start container`, and image pulls. Its public `/health` timed out after 25 seconds, HTTP client code `000` (no HTTP response), not an HTTP 4xx/5xx. Cause not established. | Alternate app system logs; [alternate health][alternate-health] | Logs 05:24:41-05:24:42; request 05:26:28-05:26:53 |
| R1 | Verified | Recapture: `ca-nc-dev-sentinel--sha-7eb0724-61-1` remained Healthy, Provisioned, Running, 100% traffic; replica ready with restart count 0. `ca-sentinelos-proof--0000006` remained Failed/Unhealthy; both replicas were `CrashLoopBackOff` with restart counts 7,274 and 2,129. Replica image digests were null. | Azure CLI app, revision, and replica reads | 06:00:12-06:01:43 |
| R2 | Verified with limitation | ACR tags: `sentinel-api:7eb0724c730ac5c6be545d4f30d24ce1f1d4a7cd` -> `sha256:85f535354fdf7cadd4d729e6fae3341f0c861b040ae2237f6578234590d6cca9`; `sentinelos:latest` -> `sha256:4c6cdf7f9ac13ec7515cdf6302a03ce20418b304dbc2f461c21820659ec45865`. These do not bind running replicas. | ACR repository reads | 06:01:43 |
| R3 | Verified | Sentinel `/proof` returned HTTP 200. Separate app `/health` and `/proof` timed out after 15 seconds with no HTTP response. The initial filtered Activity Log query returned no events; that result is superseded by F6 below and must not be read as absence of deployment events. | Public requests; Azure Activity Log | 06:03:10 onward |
| A3 | Needs clarification | Sentinel system-event tail produced connection notices but no app events in that bounded result. This is insufficient to declare runtime logs clean. | Sentinel system log tail, 15 events requested | 05:26:28-05:26:30 |

The initial Azure MCP request failed to authenticate, but authenticated Azure
CLI reads succeeded. No Azure login or access-policy changes were performed.
Inventory of Container Apps, Web Apps, and Static Web Apps in the selected
subscription returned the two Container Apps above; this is not a tenant-wide
inventory or proof that no other compute/service exists.

## Afternoon lookup closeout - 17:55-18:05 UTC

This follow-up used authenticated Azure CLI reads. Azure MCP Resource Health
and AppLens both failed lifecycle initialization after 60 seconds; direct
Resource Health returned `UnsupportedResourceType`. Neither is a healthy or
unhealthy verdict. Revision, replica, Log Analytics, and configuration reads
below succeeded. No repair, restart, credential access, restore, or deployment
was performed.

| ID | Status | Observation and limitation | Source | Capture time |
| --- | --- | --- | --- | --- |
| F1 | Verified | Exact Sentinel revision remains `ca-nc-dev-sentinel--sha-7eb0724-61-1`, Healthy, Running, active, with 100% traffic. Exact replica remains ready, Running, restart count 0. | [Azure app][azure-sentinel]; revision/replica CLI reads | 17:59:09-18:03:35 |
| F2 | Verified | Alternate proof app console contains `bootstrap failed: password authentication failed` at 17:53:58Z. Over the rolling 24-hour Log Analytics window, 553 console records matched database password authentication failure. This identifies a startup failure, not why the credential/database configuration became inconsistent. An SSL-mode warning also precedes the failure; it is not established as the crash cause. | Bundled `containerapp-diagnostics.sh`; [Log Analytics][workspace], `ContainerAppConsoleLogs_CL` | 17:57:55; aggregate 18:02:12 |
| F3 | Verified | Rolling 24-hour system logs show 577 `ContainerBackOff` events for the alternate app. Main Sentinel console query returned only 11 rows, with zero matches for error/failed/exception/fatal and zero database authentication failures. Sparse logs are not a clean-runtime certification. | [Log Analytics][workspace], `ContainerAppSystemLogs_CL` and `ContainerAppConsoleLogs_CL` | 18:00:40-18:02:12 |
| F4 | Missing | Main Sentinel system logs over 30 days contained 12,623 rows and 5,249 pull events, but zero messages containing `sha256:`. The workspace has 30-day retention; logged revision names appeared truncated to `ca-nc-dev-sentinel--sha`. These logs do not bind the running replica to the registry digest. | [Log Analytics][workspace]; workspace configuration | 18:02:12-18:03:35 |
| F5 | Needs clarification | PostgreSQL server `psql-nc-dev-sentinel` is Ready, with seven-day backup retention, earliest restore time reported as `2026-10-15T17:19:47.694336Z`, geo-redundant backup Disabled, HA Disabled. This establishes server configuration, not that a particular receipt resides there or can be recovered. No restore or application recovery test was performed; no connection string was inspected. | [PostgreSQL server][postgres]; `az postgres flexible-server show` | 18:00:40 |
| F6 | Verified | Narrow deployment-window query found successful Sentinel app writes on October 5, including 04:05:58.8152342Z, correlation `d0970688-82d9-43a6-ab9f-bb0f7837a216`. Caller object `8ebeef20-5e93-4639-a9d9-c217581f4bdb` resolves to service principal `sentinel-deploy`, app ID `e304cc44-e6c7-4c38-98db-3cc5f6d4338f`. This supersedes the earlier empty filtered activity result. | Azure Activity Log, October 5 03:45-04:30 UTC; `az ad sp show` | 18:03:35-18:04:56 |
| F7 | Verified | GitHub run 37261908549 completed successfully for push SHA `7eb0724c730ac5c6be545d4f30d24ce1f1d4a7cd`; actor and triggering account `Codynunn42`; created October 5 04:03:58Z, updated 04:07:08Z. Timing is consistent with Azure writes, but a distinct human authorization record remains missing. | [Deployment run][deploy-run]; public GitHub REST | 18:04:56 |
| F8 | Missing | Main app uses Single revision mode, and Azure returned only the current revision. No retained prior revision is established as a ready rollback target. The May rollback plan explicitly describes review-only options and stale lineage; it does not authorize rollback of the October revision. | [Azure app][azure-sentinel]; [existing rollback plan](../../../docs/DEP1_3_ROLLBACK_PLAN_2026-05-19.md) | 17:59:09; source inspected 17:59-18:00 |
| F9 | Needs clarification | Neither of the two Container Apps has a literal `ca-sentinelos-proof` reference in its configured environment values, custom ingress domains, or Dapr configuration. No values were printed. Thirty-day AppRequests/AppDependencies hostname search returned no matching rows, and the Requests metric response supplied no usable data. These bounded negatives do not exclude browser bookmarks, external clients, uninstrumented callers, or references elsewhere. | Container App configuration projections; [Log Analytics][workspace]; Azure Monitor | 18:00:39-18:04:55 |
| F10 | Verified | Historical April 24 brief explicitly links the alternate app's `/proof`, revisions 0000002/4/5, and OwnerFi demo workflows. It is a historical consumer/demo surface, not proven unused. Do not retire it based only on present failures or lack of recent telemetry. | [Historical proof brief](../../../docs/governance/DAILY_BRIEF_2026-04-24.md) | Source inspected 18:03 |
| F8a | Needs clarification | Correction to F8: `az containerapp revision list --all` returned inactive prior Sentinel revisions. Most recent prior candidate: `ca-nc-dev-sentinel--sha-c1aece8-60-1`, created 2026-09-28T20:32:31Z, inactive, 0% traffic, Healthy, Provisioned, image `sentinel-api:c1aece8f4b73a38230408709951d72a2a0a8d74b`; ACR tag digest `sha256:c424aad744e3ae7e806874c1fe23ff5319a11e930b4a4458269dcb54f4304728`. This is a retained candidate only; compatibility, procedure, and human rollback approval remain missing. | `az containerapp revision list --all`; ACR repository read | 18:13:52-18:18:50 |
| F11 | Needs clarification | No local Vercel CLI/project linkage was found in the bounded workspace check. Unauthenticated Vercel deployment metadata request returned HTTP 403. The live production commit and `SENTINEL_HEALTH_URL` setting remain unverified; matching health responses are insufficient. | Vercel deployment metadata API for the public alias; bounded local lookup | 18:00:39 |

Additional 18:13-18:27 UTC read-only checks found 46 alternate-app console
records in the prior two hours stating `Database bootstrap failed: password
authentication failed for user "sentineladmin"`. Its `DATABASE_URL` and
`SENTINEL_API_KEY` are secret references; no values were read. The main Sentinel
app's environment values had zero literal references to the alternate app or
`sentinelos:latest`. Repository references are historical or advisory; current
deployment guidance says not to use `ca-sentinelos-proof` as the shareable proof
target. These checks do not exclude external consumers.

### Digest and assignment reconciliation

Cody supplied the October 21 executive digest for the record. It identifies
**Cody Nunn as runtime collector** and reports that Freddie's review request
was sent, his corporate address bounced, Gmail was also included, and acceptance
was not yet seen. These are supplied statements, not email/calendar checks
performed in this collection. The supplied [review thread][review-thread] is
the follow-up source. This was the earlier digest's position, not the latest
assignment status. Cody's later October 21 correction and supplied executive
template record Freddie's acceptance of the independent reviewer role,
declaration of no involvement in PRs #46/#47, and confirmation of Azure read
access. Those confirmations are supplied-source evidence; the underlying
October 21 email was not independently reopened in this collection.
**Freddie's runtime verdict remains PENDING packet receipt and review.**
Packet delivery and a report-back date are not established.

The digest's Prometheus calendar and NVIDIA statements are likewise supplied
context, not newly verified Azure evidence. Preserve the October 20 authenticated
`/approvals` 200 as its original timestamped evidence; it was not repeated or
reclassified as a new test. The exact credential method is not reopened.

### Closeout decision and carry-forward

**Decision:** close this read-only lookup pass, not runtime verification.
Retain all unsupported criteria as open and request the specific evidence
below. No human PASS, deployment approval, or executive gate change is inferred.

- **Cody / Vercel owner:** provide read access or a redacted production deployment
  export with deployment ID, full source SHA, project/alias binding, and only
  the non-secret `SENTINEL_HEALTH_URL` value or confirmed absence of an override.
- **Cody, runtime collector:** obtain replica-level immutable image identity,
  receipt persistence/recovery evidence, and a current exact rollback target
  with compatibility and approval. Registry tags and backup settings are not
  substitutes for these tests.
- **Cody, deployment authority:** locate the original human authorization for
  the October 5 deployment; execution actor attribution alone is not approval.
- **Cody / Azure resource owner:** identify owners and remaining consumers of
  the historical alternate proof app before choosing credential repair or
  retirement. Neither option is executed or authorized by this packet.
- **Freddie, accepted per supplied October 21 review:** independently review
  the packet after receipt; record its exact scope, findings, and verdict.
  Confirm packet delivery and a report-back date separately. Cody remains
  collector; the collector and independent reviewer must remain distinct.

No new completion dates are invented. Cody should confirm a next-review date
for each open item. GOV-006 remains Verification/open, GOV-001 Conditional,
and GOV-002 HOLD.

## Remaining work and proposed ownership

These are proposed carry-forwards, not accepted assignments or invented dates.

| Work | Owner / next review |
| --- | --- |
| Inspect the Vercel production `/api/status` implementation and non-secret upstream URL; bind it to a deployment/commit. Do not export API keys. | Cody / Vercel deployment owner; date to confirm |
| If OwnerFI is meant to execute real commands, explicitly scope and authorize wiring its demo handlers to governed APIs; currently no such change has been made. | Cody for scope; engineering collector to confirm |
| Obtain runtime image-digest binding, deployment authorization provenance, durability/recovery evidence, and approved rollback target/procedure. | Cody Nunn, collector per supplied digest; retain ACT-014 / ACT-019 open; next-review date to confirm |
| Diagnose or disposition the failed alternate proof app without confusing it with the healthy Sentinel host. | Azure resource owner; date to confirm |
| Review whether health-status caching and demo receipt labels meet intended freshness/claim boundaries. | UI owner and independent reviewer; date to confirm |
| Independent human assessment of the packet, with identity, date, scope, and conclusion. Collector and reviewer must be distinct for the evidence under review. | Freddie accepted per supplied October 21 review; independence and Azure read access confirmed there; runtime verdict PENDING; packet delivery/report-back date not established |

No independent human PASS is recorded here. The UI's `non-demo` health label
does not establish live financial execution, durability, or release authority.
The earlier PR #44 limited technical acceptance remains separate from these
runtime and authorization gaps.

## Source links

[ownerfi]: https://nunncorp-global-mono-nexus-ui.vercel.app/
[ownerfi-bundle]: https://nunncorp-global-mono-nexus-ui.vercel.app/_next/static/chunks/app/page-2f03e0cf60c71ad7.js?dpl=dpl_EktuH7FNomatdhkXzbnQUAoF7DeV
[ownerfi-status-base]: https://nunncorp-global-mono-nexus-ui.vercel.app/api/status
[ownerfi-status]: https://nunncorp-global-mono-nexus-ui.vercel.app/api/status?evidence=20261021T0525Z
[nexus-repo]: https://github.com/Codynunn42/nunncorp-global-mono
[nexus-status-source]: https://github.com/Codynunn42/nunncorp-global-mono/blob/f6a285cee8cb990d8ff3e5fe2683698e64183502/apps/nexus-ui/src/app/api/status/route.ts
[deal]: https://ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io/proof
[health]: https://ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io/health
[ready]: https://ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io/ready
[authority]: https://ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io/api/authority/status
[alternate]: https://ca-sentinelos-proof.calmhill-388e1d39.eastus2.azurecontainerapps.io/
[alternate-health]: https://ca-sentinelos-proof.calmhill-388e1d39.eastus2.azurecontainerapps.io/health
[azure-sentinel]: https://portal.azure.com/#resource/subscriptions/82bd72d4-00ef-400d-839b-e168e980c510/resourceGroups/rg-nc-dev-sentinel/providers/Microsoft.App/containerApps/ca-nc-dev-sentinel/overview
[azure-alternate]: https://portal.azure.com/#resource/subscriptions/82bd72d4-00ef-400d-839b-e168e980c510/resourceGroups/rg-nc-dev-sentinel/providers/Microsoft.App/containerApps/ca-sentinelos-proof/overview
[proof-source]: https://github.com/Codynunn42/SentinelOS-NON-DEMO/blob/7eb0724c730ac5c6be545d4f30d24ce1f1d4a7cd/apps/api/public/proof.html
[server-source]: https://github.com/Codynunn42/SentinelOS-NON-DEMO/blob/7eb0724c730ac5c6be545d4f30d24ce1f1d4a7cd/apps/api/server.js
[control-source]: https://github.com/Codynunn42/SentinelOS-NON-DEMO/blob/7eb0724c730ac5c6be545d4f30d24ce1f1d4a7cd/apps/sentinel/src/controlPlane/execute.js
[workspace]: https://portal.azure.com/#resource/subscriptions/82bd72d4-00ef-400d-839b-e168e980c510/resourceGroups/rg-nc-dev-sentinel/providers/Microsoft.OperationalInsights/workspaces/log-nc-dev-sentinel/overview
[postgres]: https://portal.azure.com/#resource/subscriptions/82bd72d4-00ef-400d-839b-e168e980c510/resourceGroups/rg-nc-dev-sentinel/providers/Microsoft.DBforPostgreSQL/flexibleServers/psql-nc-dev-sentinel/overview
[deploy-run]: https://github.com/Codynunn42/SentinelOS-NON-DEMO/actions/runs/37261908549
[review-thread]: https://mail.google.com/mail/u/?authuser=codynunn%40nunncloudllc.com#all/1a15c923d2468bd9
