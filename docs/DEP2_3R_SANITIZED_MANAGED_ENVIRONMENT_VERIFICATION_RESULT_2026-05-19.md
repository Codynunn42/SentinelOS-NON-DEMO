# DEP2.3R Sanitized Managed Environment Verification Result - 2026-05-19

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[KEEP:DEP2.3R-SANITIZED-MANAGED-ENVIRONMENT-VERIFICATION-RESULT]
```

## Approval Scope

`DEP2.3` was explicitly approved by the operator for one narrow read-only Azure query:

```bash
az containerapp show \
  --name ca-nc-dev-sentinel \
  --resource-group rg-nc-dev-sentinel \
  --query "{managedEnvironmentId:properties.managedEnvironmentId}" \
  -o json
```

This artifact records the sanitized result and comparison against `azure/container-app.yaml`.

This artifact does not authorize deployment, runtime mutation, command execution beyond the approved read-only observation, direct env value restoration, secret access, secret disclosure, rollback execution, live post-deploy checks, endpoint publication, pilot activation, tenant activation, held-standard promotion, push, tool grants, certification claims, autonomous execution, or destructive cleanup.

## Core Invariant

```txt
Read-only observation may verify target identity. Read-only observation does not authorize deployment or mutation.
```

## Executed Observation Boundary

| Field | Value |
| --- | --- |
| Command type | read-only Azure Container App show |
| Output query | `{managedEnvironmentId:properties.managedEnvironmentId}` |
| Approved output fields | `managedEnvironmentId` only |
| Secret values returned | no |
| Direct env values returned | no |
| Full Container App export returned | no |
| Runtime mutation performed | no |

## Sanitized Query Result

```json
{
  "managedEnvironmentId": "/subscriptions/82bd72d4-00ef-400d-839b-e168e980c510/resourceGroups/rg-nc-dev-sentinel/providers/Microsoft.App/managedEnvironments/cae-nc-dev-sentinel"
}
```

## Repo-Local Comparison

`azure/container-app.yaml` contains:

```txt
/subscriptions/82bd72d4-00ef-400d-839b-e168e980c510/resourceGroups/rg-nc-dev-sentinel/providers/Microsoft.App/managedEnvironments/cae-nc-dev-sentinel
```

Comparison result:

```yaml
managed_environment_id:
  live_read_only_result_matches_repo_local_yaml: true
  deployment_authorized: false
  runtime_mutation_authorized: false
  command_execution_authorized: false
```

## Stop Condition Review

| Stop Condition | Result |
| --- | --- |
| Command would return more than `managedEnvironmentId` | not triggered |
| Azure account/subscription context is unclear | not triggered by returned target evidence |
| Query output contains sensitive material | not triggered |
| Managed environment ID mismatches repo-local YAML | not triggered |
| Query fails or access is unavailable | not triggered after approved execution context |

## Deployment Impact

DEP2.3R closes the managed environment identity evidence gap.

It does not close:

- CLI/YAML name-only env behavior
- direct env value handling
- command execution authority
- pre-mutation snapshot authority
- rollback execution authority
- live post-deploy verification authority
- deployment authority

## Recommended Next Scope

```txt
DEP2.5 - deployment authority gap review after DEP2.3R.
```

Purpose:

```txt
Recalculate remaining deployment blockers now that managed environment ID is verified, while preserving command execution and runtime mutation holds.
```

## Still Not Authorized

```yaml
still_not_authorized:
  - deployment
  - runtime_mutation
  - az_containerapp_update
  - command_execution_beyond_the_completed_read_only_observation
  - direct_env_restoration
  - secret_access
  - secret_disclosure
  - rollback_execution
  - live_post_deploy_checks
  - endpoint_publication
  - pilot_activation
  - tenant_activation
  - held_standard_promotion
  - push
  - tool_grants
  - autonomous_execution
```

## Non-Authorization Clause

This sanitized managed environment verification result is evidence only. It does not authorize deployment, runtime mutation, command execution beyond the completed approved read-only observation, direct env value restoration, secret value access, secret value disclosure, rollback execution, live post-deploy checks, endpoint publication, pilot activation, tenant activation, held-standard promotion, push, tool grants, certification claims, autonomous execution, or destructive cleanup.
