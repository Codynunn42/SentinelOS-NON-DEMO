# Azure Reactivation Check Result - 2026-07-03

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** read-only Azure reactivation check  
**External Use:** held  
**Authority Created:** false

## Result

```yaml
reactivation_check:
  checked_at: 2026-07-03T23:08:31Z
  subscription_id: 82bd72d4-00ef-400d-839b-e168e980c510
  subscription_state: Warned
  account_list_default_result: skipped_because_not_enabled
  account_list_all_state: Warned
  reactivation_complete: false
  mutation_authority_created: false
```

The payment appears to have partially propagated into Container App metadata,
but the subscription is not fully enabled yet.

## Container App Metadata

```yaml
primary_container_app:
  name: ca-nc-dev-sentinel
  resource_group: rg-nc-dev-sentinel
  provisioning_state: Succeeded
  running_status: Running
  fqdn: ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io
  latest_revision_name: ca-nc-dev-sentinel--0000030
  latest_ready_revision_name: ca-nc-dev-sentinel--0000030
  image: acrncdevsentinel.azurecr.io/sentinel-api:phase1-approval-continuity-3e7308a-20260513-0645
```

The metadata above is not enough to clear the gate because revision and log
commands still fail.

## Blocking Evidence

```yaml
managed_environment_or_revision_state:
  az_containerapp_revision_list:
    result: failed
    error: ManagedClusterSuspended
    message: compute_resource_for_managed_environment_suspended_due_to_subscription_disabled
  az_containerapp_revision_show_ca_nc_dev_sentinel_0000030:
    result: failed
    error: RevisionNotFound
  az_containerapp_logs_show_ca_nc_dev_sentinel:
    result: failed
    error: RevisionNotFound
```

Both app FQDNs are reachable at the edge, but they do not serve the required
OwnerFi proof routes.

```yaml
route_checks:
  ca-nc-dev-sentinel:
    GET /: 404
    GET /health: 404
    GET /proof: 404
    GET /v1/audit?tenant=ownerfi without key: 404
  ca-sentinelos-proof:
    GET /health: 404
    GET /proof: 404
    GET /v1/audit?tenant=ownerfi without key: 404
  npm_run_check_ownerfi_proof_health:
    result: failed
    reason: required_routes_return_404
```

## Decision

```yaml
gate: RESOLVE_AZURE_SUBSCRIPTION_AND_CONTAINER_APP_SERVING_STATE_FOR_OWNERFI_PROOF
status: still_open
reason: subscription_state_warned_and_managed_environment_revision_operations_still_report_suspended
next_action: wait_for_subscription_to_reach_enabled_then_rerun_read_only_checks
safe_runtime_restore_now: false
```

Do not redeploy, restart, update revisions, rotate secrets, or claim live proof
readiness while the subscription is still `Warned` and revision operations still
report `ManagedClusterSuspended`.

## Next Retry Set

Run this read-only set after Azure billing reactivation has had time to fully
propagate:

```bash
az account list --all -o json
az account show -o json
az containerapp revision list --name ca-nc-dev-sentinel --resource-group rg-nc-dev-sentinel -o json
az containerapp logs show --name ca-nc-dev-sentinel --resource-group rg-nc-dev-sentinel --tail 80
npm run check:ownerfi-proof-health
```

Gate clears only when:

```yaml
subscription_state: Enabled
revision_list: succeeds
logs_show: succeeds
GET /health: 200
GET /proof: 200
GET /v1/audit?tenant=ownerfi without key: 401_or_403
```

## Non-Authorization

This result does not authorize Azure mutation, redeploy, restart, revision
activation, image build, secret access, billing activation, external proof
claims, customer contact, staging, commit, or push.
