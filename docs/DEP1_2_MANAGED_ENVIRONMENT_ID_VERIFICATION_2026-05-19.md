# DEP1.2 Managed Environment ID Verification - 2026-05-19

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[KEEP:DEP1.2-MANAGED-ENVIRONMENT-ID-VERIFICATION-REVIEW-ONLY]
```

## Approval Scope

`DEP1.2` is approved as review-only deployment sub-evidence under `DEP1.2-DEP1.5`.

This artifact verifies current repo-local managed environment identity evidence and defines the remaining read-only evidence requirement before any future deployment approval can be considered. It does not authorize deployment, runtime mutation, command execution, live query execution, direct env value restoration, secret access, secret disclosure, rollback execution, endpoint publication, pilot activation, tenant activation, held-standard promotion, push, or autonomous execution.

## Core Invariant

```txt
Managed environment verification confirms target identity. Managed environment verification does not authorize deployment or runtime mutation.
```

## Source Truth

| Source | Use |
| --- | --- |
| `azure/container-app.yaml` | repo-local managed environment shape evidence |
| `docs/AZURE_CONTAINER_APP_SANITIZED_EXPORT_2026-05-18.md` | fresh sanitized runtime evidence from A4.3R |
| `docs/DEPLOYMENT_VALUE_BINDING_REVIEW_2026-05-18.md` | D1.1 managed environment verification gap |
| `docs/DEPLOYMENT_APPROVAL_PACKET_DEP1_1_2026-05-19.md` | DEP1.1 deployment authority boundary |
| `docs/NEXT_APPROVAL_SET_DEP1_2_DEP1_5_2026-05-19.md` | review-only operator approval for DEP1.2-DEP1.5 evidence preparation |

## Executive Result

```yaml
dep1_2_result:
  status: prepared_review_only
  managed_environment_repo_local_present: true
  managed_environment_live_sanitized_verified: false
  deployment_authorized: false
  runtime_mutation_authorized: false
  command_execution_authorized: false
  remaining_requirement: read_only_live_sanitized_verification_before_deployment_approval
```

## Repo-Local Evidence

The reconciled repo-local deployment manifest contains:

```txt
/subscriptions/82bd72d4-00ef-400d-839b-e168e980c510/resourceGroups/rg-nc-dev-sentinel/providers/Microsoft.App/managedEnvironments/cae-nc-dev-sentinel
```

Current classification:

```txt
repo_local_present_live_sanitized_verification_required_before_deployment
```

## Evidence Finding

| Check | Result | Notes |
| --- | --- | --- |
| Container App name | present | `ca-nc-dev-sentinel` |
| Resource Group | present | `rg-nc-dev-sentinel` |
| Managed Environment ID | present in repo-local YAML | requires live sanitized confirmation before deployment approval |
| A4.3R export coverage | partial | A4.3R did not include `managedEnvironmentId` in captured sanitized fields |
| Deployment authority | absent | no mutation authority exists |

## Future Read-Only Verification Candidate

The following is a candidate read-only verification command for a later approval. It is not approved for execution by this artifact.

```bash
az containerapp show \
  --name ca-nc-dev-sentinel \
  --resource-group rg-nc-dev-sentinel \
  --query "{managedEnvironmentId:properties.managedEnvironmentId}" \
  -o json
```

Required handling if later approved:

- capture only the managed environment ID
- do not capture env values, secret values, tokens, connection strings, or deployment credentials
- compare the result to `azure/container-app.yaml`
- preserve the result as sanitized evidence
- keep deployment held until a separate deployment approval exists

## Stop Conditions

| Stop Condition | Required Response |
| --- | --- |
| Managed environment ID mismatch | hold deployment lane and route discrepancy through governance review |
| Live query requires broader capture than approved | stop and request narrower approval |
| Query returns secret or direct env material | stop, redact, and route through secret governance |
| Runtime target cannot be confirmed | keep deployment held |

## Non-Authorization Clause

This managed environment ID verification artifact is evidence only. It does not authorize deployment, runtime mutation, command execution, live Azure query execution, direct env value restoration, secret value access, secret value disclosure, rollback execution, endpoint publication, pilot activation, tenant activation, held-standard promotion, push, tool grants, certification claims, autonomous execution, or destructive cleanup.
