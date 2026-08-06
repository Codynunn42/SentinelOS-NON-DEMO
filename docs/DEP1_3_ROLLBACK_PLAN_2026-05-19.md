# DEP1.3 Rollback Plan - 2026-05-19

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[KEEP:DEP1.3-ROLLBACK-PLAN-REVIEW-ONLY]
```

## Approval Scope

`DEP1.3` is approved as review-only deployment sub-evidence under `DEP1.2-DEP1.5`.

This artifact defines rollback posture, rollback prerequisites, and stop conditions for a future deployment decision. It does not authorize rollback execution, deployment, runtime mutation, command execution, live query execution, direct env value restoration, secret access, secret disclosure, endpoint publication, pilot activation, tenant activation, held-standard promotion, push, or autonomous execution.

## Core Invariant

```txt
Rollback planning defines reversibility posture. Rollback planning does not authorize rollback execution or deployment.
```

## Source Truth

| Source | Use |
| --- | --- |
| `docs/AZURE_CONTAINER_APP_SANITIZED_EXPORT_2026-05-18.md` | current runtime image and revision evidence at export time |
| `azure/container-app.yaml` | repo-local reconciled deployment shape evidence |
| `docs/DEPLOYMENT_APPROVAL_PACKET_DEP1_1_2026-05-19.md` | deployment authority boundary and rollback requirement |
| `docs/NEXT_APPROVAL_SET_DEP1_2_DEP1_5_2026-05-19.md` | review-only operator approval for DEP1.2-DEP1.5 evidence preparation |

## Executive Result

```yaml
dep1_3_result:
  status: prepared_review_only
  rollback_plan_prepared: true
  rollback_execution_authorized: false
  deployment_authorized: false
  runtime_mutation_authorized: false
  command_execution_authorized: false
  pre_mutation_snapshot_required: true
```

## Current Runtime Lineage Evidence

The latest available sanitized runtime evidence from A4.3R records:

| Runtime Field | Evidence |
| --- | --- |
| Container App | `ca-nc-dev-sentinel` |
| Resource Group | `rg-nc-dev-sentinel` |
| Active Revision Mode | `Single` |
| Latest Revision | `ca-nc-dev-sentinel--0000030` |
| Latest Ready Revision | `ca-nc-dev-sentinel--0000030` |
| Image | `acrncdevsentinel.azurecr.io/sentinel-api:phase1-approval-continuity-3e7308a-20260513-0645` |

This evidence is sufficient to prepare rollback planning. It may be stale before any later deployment approval and must be refreshed immediately before mutation if deployment is pursued.

## Rollback Options For Future Approval

| Option | Description | Requirement | Current Status |
| --- | --- | --- | --- |
| Image reapplication | Reapply the prior known image to the Container App if a new image mutation fails. | exact prior image verified immediately before mutation | planning only |
| Revision routing | Route traffic back to a prior revision if still available and compatible with active revision mode. | live revision list and traffic behavior verified before mutation | planning only |
| Prior manifest restoration | Restore an approved prior manifest posture. | value handling, secretRef posture, and command behavior approved | planning only |

No rollback option is approved for execution by this artifact.

## Required Pre-Mutation Snapshot

Before any future deployment authority can be considered, the operator packet must include a fresh pre-mutation snapshot covering:

- Container App ID
- resource group
- managed environment ID
- active revision mode
- latest ready revision
- current image
- ingress posture
- traffic posture
- secret names only
- env names and `secretRef` posture only
- probe posture
- scale posture

The snapshot must not include secret values, direct env values, tokens, connection strings, or credentials.

## Rollback Decision Tree

```txt
deployment approved separately
    ↓
fresh pre-mutation snapshot captured separately
    ↓
mutation command approved separately
    ↓
post-deploy verification fails or drift is detected
    ↓
stop condition evaluated
    ↓
rollback execution requires explicit approval unless a pre-approved emergency authority window exists
    ↓
rollback result must be verified and preserved as audit evidence
```

## Stop Conditions

| Stop Condition | Required Response |
| --- | --- |
| Latest ready revision cannot be verified | do not proceed with deployment |
| Prior image cannot be verified | do not proceed with deployment |
| Direct env value handling is unresolved | do not proceed with deployment |
| SecretRef source posture is unresolved | do not proceed with deployment |
| Candidate command may clear or replace values | do not proceed with deployment |
| Health/proof/audit verification plan is incomplete | do not proceed with deployment |
| Rollback path requires secret value disclosure | stop and route through secret governance |

## Non-Authorization Clause

This rollback plan is evidence only. It does not authorize rollback execution, deployment, runtime mutation, command execution, live Azure query execution, direct env value restoration, secret value access, secret value disclosure, endpoint publication, pilot activation, tenant activation, held-standard promotion, push, tool grants, certification claims, autonomous execution, or destructive cleanup.
