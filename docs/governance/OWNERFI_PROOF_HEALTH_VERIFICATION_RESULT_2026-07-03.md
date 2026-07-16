# OwnerFi Proof Health Verification Result - 2026-07-03

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Gate:** `VERIFY_CURRENT_OWNERFI_PROOF_HEALTH_BEFORE_SHARE_OR_MEETING`  
**Mode:** working-network verification result  
**External Use:** held  
**Authority Created:** false

## Result

```yaml
verification_result:
  gate: VERIFY_CURRENT_OWNERFI_PROOF_HEALTH_BEFORE_SHARE_OR_MEETING
  disposition: failed_current_live_route_health
  prior_state: blocked_not_failed
  current_state: failed_not_share_ready
  live_claims_allowed: false
  external_share_allowed: false
  feature_expansion_allowed: false
  restoration_required: true
  authority_created: false
```

The working-network check reached the recorded live target, but the required
OwnerFi proof-health routes did not pass.

## Target

```yaml
target:
  base: https://ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io
  required_routes:
    - GET /health
    - GET /proof
    - GET /v1/audit?tenant=ownerfi without key
```

## Receipt

The prepared no-key receipt command was run:

```bash
npm run check:ownerfi-proof-health
```

Captured result:

```yaml
checked_at: 2026-07-03T04:36:34.524Z
checks:
  health:
    path: /health
    status: 404
    content_type: text/html; charset=utf-8
    body_sha256: 04e65bf49eb983413f139a2497d498340797f94db2bc283927786c3ff2432e58
    body_length: 1946
  proof:
    path: /proof
    status: 404
    content_type: text/html; charset=utf-8
    body_sha256: 04e65bf49eb983413f139a2497d498340797f94db2bc283927786c3ff2432e58
    body_length: 1946
  audit_no_key:
    path: /v1/audit?tenant=ownerfi
    status: 404
    expected: authorization_denial_without_key
    content_type: text/html; charset=utf-8
    body_sha256: 04e65bf49eb983413f139a2497d498340797f94db2bc283927786c3ff2432e58
    body_length: 1946
failures:
  - /health returned HTTP 404; expected 200
  - /proof returned HTTP 404; expected 200
  - /v1/audit?tenant=ownerfi without key returned HTTP 404; expected 401 or 403
```

## Read-Only Azure Metadata

Superseding update: the metadata below is historical from an earlier July 3
check. It is no longer the current Azure serving-state truth. The current
holding record is
`docs/governance/AZURE_OWNERFI_PROOF_GREAT_HOLD_STATE_2026-07-03.md`, which supersedes the
earlier `Running` metadata with Container App `Failed`, null ingress/containers,
and revision listing blocked by `ManagedClusterSuspended`.

Read-only Container App metadata was checked after the route failure:

```yaml
container_app:
  name: ca-nc-dev-sentinel
  location: East US 2
  provisioning_state: Succeeded
  running_status: Running
  external: true
  fqdn: ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io
  target_port: 80
  latest_revision_name: ca-nc-dev-sentinel--0000030
  latest_ready_revision_name: ca-nc-dev-sentinel--0000030
  image: acrncdevsentinel.azurecr.io/sentinel-api:phase1-approval-continuity-3e7308a-20260513-0645
  traffic:
    - latest_revision: true
      weight: 100
```

Read-only revision listing returned an empty list:

```yaml
revision_list: []
```

## Local Diagnostics

Local diagnostics were run before the live route check:

| Check | Result |
| --- | --- |
| `node --check scripts/check-ownerfi-proof-health-receipt.js` | passed |
| `npm run check:telemetry-harmonizer` | passed after restoring telemetry action mapping |
| `npm run check:ownerfi-pilot-api` | passed after restoring telemetry action mapping |
| `npm run check:proof-ui-flow` | passed |

## Interpretation

The old status `blocked_not_failed` no longer describes the latest attempt. The
working-network route check reached the target and received deterministic
`404` responses for all H1 required routes.

Current classification:

```yaml
ownerfi_proof_health:
  status: failed_not_share_ready
  reason: required_live_routes_return_404
  network_path: reached
  app_metadata: running_but_routes_not_serving_required_surface
  historical_next_route_gate: RESTORE_OWNERFI_PROOF_HEALTH_ROUTE_SURFACE
  superseded_by_current_gate: RESOLVE_AZURE_SUBSCRIPTION_AND_CONTAINER_APP_SERVING_STATE_FOR_OWNERFI_PROOF
  authority_created: false
```

## Azure Hold-State Update

The current July 3 Azure closeout places this lane at the subscription /
Container App serving-state gate:

```yaml
superseding_hold_state:
  source: docs/governance/AZURE_OWNERFI_PROOF_GREAT_HOLD_STATE_2026-07-03.md
  active_gate: RESOLVE_AZURE_SUBSCRIPTION_AND_CONTAINER_APP_SERVING_STATE_FOR_OWNERFI_PROOF
  container_app_provisioning_state: Failed
  container_app_ingress: null
  container_app_containers: null
  revision_list_error: ManagedClusterSuspended
  direct_route_probes:
    GET /health: timeout_after_15s_http_000
    GET /proof: timeout_after_15s_http_000
    GET /v1/audit?tenant=ownerfi without key: timeout_after_15s_http_000
  prior_running_metadata_current: false
  live_claims_allowed: false
  authority_created: false
```

## Current Rerun Update

A read-only rerun at `2026-07-03T20:03:06Z` did not reproduce the earlier 404
route responses. It failed earlier at the network fetch layer:

```yaml
latest_rerun:
  checked_at: 2026-07-03T20:03:06Z
  npm_run_check_ownerfi_proof_health: fetch_failed
  direct_curl:
    GET /health: timeout_after_20s
    GET /proof: timeout_after_20s
    GET /v1/audit?tenant=ownerfi without key: timeout_after_20s
  live_claims_allowed: false
  external_share_allowed: false
  next_gate: RESOLVE_AZURE_SUBSCRIPTION_AND_CONTAINER_APP_SERVING_STATE_FOR_OWNERFI_PROOF
  next_route_gate_after_azure_serving_state: RESTORE_OWNERFI_PROOF_HEALTH_ROUTE_SURFACE
  authority_created: false
```

## Required Next Gate

`RESOLVE_AZURE_SUBSCRIPTION_AND_CONTAINER_APP_SERVING_STATE_FOR_OWNERFI_PROOF`

Required scope:

1. Resolve the Azure subscription/payment/admin state outside this repo lane.
2. Rerun read-only Container App and managed-environment checks.
3. If Container App serving state is still failed after subscription recovery,
   prepare an exact runtime restore authority packet before mutation.
4. If serving state is restored, rerun `npm run check:ownerfi-proof-health` and
   direct route probes.

## Non-Authorization

This result does not authorize external sharing, live proof claims, release
packaging, feature expansion, runtime mutation, Azure mutation, redeploy,
staging, commit, push, customer contact, commercial activation, billing
activation, funnel activation, or SINTENEX implementation.
