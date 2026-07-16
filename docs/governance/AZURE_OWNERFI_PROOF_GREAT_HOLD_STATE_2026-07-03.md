# Azure OwnerFi Proof Great Hold State - 2026-07-03

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** Azure hold-state closeout, review-held  
**External Use:** held  
**Authority Created:** false

## Purpose

Put the Azure OwnerFi proof lane into a clean holding state without losing the
bigger operating picture to deep-dive drift.

White-glove Sentinel AI remains ON for internal support triage and governed
next-step preparation. It does not replace the Azure subscription/payment/admin
action needed to restore the hosted runtime.

## Current Evidence

```yaml
azure_hold_state:
  checked_on: 2026-07-03
  subscription_id: 82bd72d4-00ef-400d-839b-e168e980c510
  subscription_state: Warned
  container_app: ca-nc-dev-sentinel
  resource_group: rg-nc-dev-sentinel
  container_app_provisioning_state: Failed
  container_app_ingress: null
  container_app_containers: null
  managed_environment: cae-nc-dev-sentinel
  managed_environment_provisioning_state: Succeeded
  managed_environment_public_network_access: Enabled
  managed_environment_default_domain: calmhill-388e1d39.eastus2.azurecontainerapps.io
  revision_list_error: ManagedClusterSuspended
  suspension_reason: subscription_disabled_or_compute_suspended
  npm_run_check_ownerfi_proof_health: fetch_failed
  direct_route_probes:
    GET /health: timeout_after_15s_http_000
    GET /proof: timeout_after_15s_http_000
    GET /v1/audit?tenant=ownerfi without key: timeout_after_15s_http_000
  live_claims_allowed: false
  external_share_allowed: false
  mutation_authority_created: false
```

## Local Sentinel AI Holding Receipt

```yaml
local_sentinel_ai:
  command: governance.canonicalize.platform
  scope: azure_great_hold_state_2026_07_03
  route: /local/sentinelos/azure-great-hold-state
  result: passed
  status_code: 200
  trust_score: 100
  reasons: []
  receipt_id: local-receipt-governance.canonicalize.platform-azure-great-hold
  audit_id: local-audit-azure_great_hold_state_2026_07_03
  authority_created: false
```

Sentinel AI was used as a governed classifier and evidence registrar. It did
not perform Azure mutation, payment action, runtime repair, redeploy, protected
secret access, staging, commit, or push.

## Interpretation

The primary hold is now the Azure subscription / Container App serving-state
gate:

`RESOLVE_AZURE_SUBSCRIPTION_AND_CONTAINER_APP_SERVING_STATE_FOR_OWNERFI_PROOF`

Route restoration remains the next technical gate, but it should not be treated
as actionable until the subscription and Container App serving state are
restored enough for read-only runtime checks to return meaningful responses.

Older July 3 records showing `provisioningState: Succeeded`, `runningStatus:
Running`, and ready revision `ca-nc-dev-sentinel--0000030` are historical only.
They are superseded by the current read-only evidence showing Container App
`Failed`, null ingress/containers, and revision listing blocked by
`ManagedClusterSuspended`.

## Great Holding Spot

```yaml
great_hold_state:
  current_primary_gate: RESOLVE_AZURE_SUBSCRIPTION_AND_CONTAINER_APP_SERVING_STATE_FOR_OWNERFI_PROOF
  next_human_or_operator_action: resolve_azure_subscription_payment_or_admin_state
  first_read_only_recheck_after_subscription_recovery:
    - az account show
    - az containerapp show --name ca-nc-dev-sentinel --resource-group rg-nc-dev-sentinel
    - az containerapp revision list --name ca-nc-dev-sentinel --resource-group rg-nc-dev-sentinel
    - az containerapp env show --name cae-nc-dev-sentinel --resource-group rg-nc-dev-sentinel
  if_container_app_still_failed_after_subscription_active:
    action: prepare_exact_runtime_restore_authority_packet
    mutation_allowed: false
  if_container_app_serving_state_restored:
    next_checks:
      - npm run check:ownerfi-proof-health
      - GET /health
      - GET /proof
      - GET /v1/audit?tenant=ownerfi without key expecting 401_or_403
  bigger_picture_preserved: true
```

## Superseding Read-Only Recheck

The route-health portion of this hold state is superseded by
`docs/governance/PHASED_OPERATIONAL_LANE_AND_OWNER_DECISION_PLAN_2026-07-03.md`.

```yaml
checked_at_utc: 2026-07-04T04:21:24Z
container_app_provisioning_state: Succeeded
container_app_running_status: Running
latest_revision: ca-nc-dev-sentinel--restore-20260703-01
latest_revision_health_state: Healthy
latest_revision_running_state: Running
npm_run_check_ownerfi_proof_health: passed
subscription_state: Warned
interpretation: route_health_cleared_with_subscription_admin_caution
```

## Do Not Chase Until Azure Clears

- Mission Control UI mutation.
- SINTENEX commercial-trigger implementation.
- protected API-key checks.
- public tunnel refresh.
- GPT Builder configuration.
- support item deep dives not required to clear Azure.
- external proof claims.
- customer contact.
- pricing, billing, payment, or timed-event execution.

## Non-Authorization

This hold state does not authorize Azure mutation, subscription/payment action
inside this repo, Container App update, revision activation, deployment,
runtime mutation, protected API-key use, external proof claims, Mission Control
UI mutation, billing activation, payment processing, staging, commit, push, or
production timed-event execution.
