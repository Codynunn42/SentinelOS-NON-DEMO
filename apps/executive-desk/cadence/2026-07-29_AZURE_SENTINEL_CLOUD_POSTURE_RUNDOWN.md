# Azure and Sentinel Cloud Posture Rundown

Date: 2026-07-29
Owner: Cody Nunn (Interim, role: Executive Desk)
Mode: Read-only verification
Launch relationship: Evidence input for Stage 3 and the hosted Sentinel connector gate; no launch stage is completed by this review.

## Executive Verdict

Status: Conditional / not current across all platforms
Priority: High

Nunn Corporation's direct Azure SentinelOS runtime is healthy and database-backed, but the cloud, public front door, current source, OpenAI faceplane, and Microsoft Sentinel security tooling are not yet synchronized as one current orchestration platform.

No Azure mutation, deployment, command execution, approval creation, or secret rotation was performed during this review.

## Verified Azure Inventory

Subscription:

- Name: Azure subscription 1
- Subscription ID: 82bd72d4-00ef-400d-839b-e168e980c510
- Tenant ID: 762ce366-c9c0-449a-adec-1b7608b4ce2a
- CLI state: Warned
- Region in scope: East US 2

Resource group `rg-nc-dev-sentinel` contains 13 current resources:

- 2 Azure Container Apps
- 1 Container Apps managed environment
- 1 Azure Container Registry
- 1 PostgreSQL Flexible Server
- 1 Key Vault
- 1 App Configuration store
- 1 user-assigned managed identity
- 1 Application Insights component
- 1 Log Analytics workspace
- 1 Application Insights action group
- Microsoft Sentinel / SecurityInsights solution
- SecurityCenterFree solution

## SentinelOS Runtime

### Primary Container App

- App: `ca-nc-dev-sentinel`
- Provisioning: Succeeded
- Runtime: Running
- Active revision: `ca-nc-dev-sentinel--xeexec-wip-20260718003039`
- Image: `acrncdevsentinel.azurecr.io/sentinel-api:xeexec-wip-20260718003039`
- Image/revision date: 2026-07-18
- Traffic: 100 percent
- Replicas: minimum 1, maximum 2
- Public ingress: enabled
- Target port: 80
- Managed identity: user-assigned
- Database: enabled

Live route checks:

- [x] `GET /health` returned HTTP 200.
- [x] `GET /ready` returned HTTP 200 with `ready: true` and no failed checks.
- [x] `GET /system/status` returned HTTP 200 and `platformConnected: true`.
- [ ] `GET /faceplane/openai/gpt-actions/openapi.json` returned HTTP 404.
- [ ] `GET /faceplane/openai/gpt-actions/connection` returned HTTP 404.
- [ ] OpenAI faceplane is not active for tenant `sentinelos` in the deployed revision.

The live governance endpoint returned HTTP 503 because `scheduler_heartbeat` is missing. It reported the OpenAI faceplane active only for `nunn-internal`.

### Proof Container App

- App: `ca-sentinelos-proof`
- Provisioning: Succeeded
- Runtime: Running
- Active revision: `ca-sentinelos-proof--0000006`
- Image: `acrncdevsentinel.azurecr.io/sentinelos:latest`
- Revision date: 2026-04-26
- `GET /health`: HTTP 200

The proof app is healthy but materially older than the primary runtime and current source.

## Source-to-Runtime Drift

Current local source includes the GPT Action OpenAPI and connection routes. Targeted local verification produced:

- [x] GPT action connector check passed.
- [x] GPT action runtime verifier check passed.
- [x] Governance status check passed.
- [ ] OpenAI faceplane check failed because the current local configuration contains two active tenants while the test still expects one.

Current source changes adding tenant `sentinelos` and the metadata-evidence bridge are uncommitted. The deployed Azure image does not expose the newer GPT Action routes. ACR contains no image newer than 2026-07-18 for `sentinel-api`, and the active image is unsigned and has no verified source-commit annotation.

Verdict: Current source provenance and current Azure runtime are not reconciled.

## Public Cross-Platform Front Door

Endpoint: `https://api.nunncorporation.com`

- [ ] `/health` returned Cloudflare HTTP 530 / error 1033.
- [ ] `/ready` returned Cloudflare HTTP 530 / error 1033.
- [ ] GPT Action OpenAPI returned Cloudflare HTTP 530 / error 1033.
- [ ] No active `cloudflared` connector process was observed locally.

Verdict: Sentinel tooling is not presently available to all platforms through the governed public front door.

## Microsoft Sentinel Security Integration

Workspace: `log-nc-dev-sentinel`

- Provisioning: Succeeded
- Microsoft Sentinel / SecurityInsights solution: Succeeded
- Retention: 30 days
- Container Apps environment log destination: Log Analytics
- Current application/system log ingestion: active
- Current tables observed: `ContainerAppConsoleLogs_CL`, `ContainerAppSystemLogs_CL`, `AzureMetrics`, `Usage`, and `Operation`

Security coverage:

- [ ] Data connectors: 0
- [x] Analytics rules: 1 built-in Fusion rule enabled
- [ ] Automation rules: 0
- [ ] SecurityAlert records in the last 30 days: 0 observed
- [ ] SecurityIncident records in the last 30 days: 0 observed
- [ ] Diagnostic settings for Key Vault, ACR, PostgreSQL, and App Configuration: none observed

Verdict: Microsoft Sentinel is enabled and can query the shared workspace, but it is not yet receiving broad security telemetry or operating as a complete detection-and-response layer for the cloud.

## Azure AI Services

Resource: `codynunnazure-3068-resource`

- Kind: AIServices
- Provisioning: Succeeded
- SKU: S0
- Public network access: enabled
- Local authentication: enabled
- Model deployments: 0

No Azure AI endpoint or model deployment is wired into the active Container App environment variables.

Verdict: The Azure AI Services resource exists, but there is no current evidence that it is the intelligence runtime behind SentinelOS orchestration.

## Sentinel AI Rundown

A read-only request was sent to the live `/learning/suggestions` route with `createApproval=false`.

Sentinel AI reported:

- State: unknown
- Confidence: 0.45
- Risk: medium
- Action gate: observe_only
- Decision: restrict
- Pipeline stage: approval
- Reason: execution history is too small to trust automated recommendations
- Directive: observe, collect more history, and avoid automation until confidence improves

Only one prior governed event was available to the learning analysis at request time. No approval request was created.

## Required Closure Checks

Keep the existing launch sequence in force. These checks are evidence gates for later stages, not permission to skip Stage 1 or Stage 2.

1. [ ] Complete and verify Stage 1 public web repositioning and Executive Assessment funnel.
2. [ ] Reconcile the current local OpenAI faceplane change and its test expectation.
3. [ ] Commit a clean, reviewed source state and build a versioned, source-attributed, signed image.
4. [ ] Deploy the reviewed image through the Stage 3 auth, PostgreSQL, gateway, monitoring, and rollback controls.
5. [ ] Verify live `/health`, `/ready`, GPT Action OpenAPI, connection, faceplane status, governed command, receipt, and audit paths.
6. [ ] Restore or replace the failed Cloudflare tunnel with the approved stable public gateway path.
7. [ ] Configure Microsoft Sentinel data connectors, diagnostic settings, analytics, automation, and incident-response evidence.
8. [ ] Decide whether Azure AI Services is an intended Sentinel AI dependency; if yes, deploy and govern the model connection explicitly.
9. [ ] Seed sufficient governed execution history and rerun Sentinel learning analysis until the state is evidence-backed.
10. [ ] Run the final launch dry run and record founder sign-off only after every required check passes.

## Current Gate Decision

Do not mark Stage 3, the hosted Sentinel connector, universal tooling availability, or final launch as complete.

Next authorized launch action remains Stage 1 completion. This cloud rundown should be carried into Stage 3 design and the hosted connector verification packet.
