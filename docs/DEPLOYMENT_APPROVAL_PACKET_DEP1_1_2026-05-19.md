# Deployment Approval Packet - DEP1.1 - 2026-05-19

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[HOLD:DEPLOYMENT-APPROVAL-PACKET-DEP1.1-REVIEW-ONLY]
```

## Approval Scope

`DEP1.1` prepares the deployment approval packet for executive review.

This packet is review-only. It does not authorize deployment, runtime mutation, direct env value restoration, secret value access, secret value disclosure, registry credential mutation, rollback execution, endpoint publication, pilot activation, tenant activation, held-standard promotion, push, or autonomous execution.

## Core Invariant

```txt
Deployment approval packets prepare operator decisions. Deployment approval packets do not independently authorize deployment or runtime mutation.
```

## Executive Result

```yaml
dep1_1_result:
  status: deployment_approval_packet_prepared_review_only
  deployment_authorized: false
  runtime_mutation_authorized: false
  command_execution_authorized: false
  direct_env_restoration_authorized: false
  secret_value_access_authorized: false
  recommendation: hold_runtime_mutation_until_sub_evidence_closes
  next_required_before_deployment_approval:
    - DEP1.2 managed environment ID verification
    - DEP1.3 rollback plan
    - DEP1.4 deployment command review
    - DEP1.5 post-deploy verification plan
```

## Source Truth

| Source | Use |
| --- | --- |
| `docs/COMMAND_ENVELOPE_GOVERNANCE_MODEL_2026-05-19.md` | command-envelope authority boundary |
| `docs/SENTINEL_EXECUTIVE_APPROVAL_REGISTER_2026-05-18.md` | executive approval state |
| `docs/DEPLOYMENT_VALUE_BINDING_REVIEW_2026-05-18.md` | D1.1 blockers and readiness posture |
| `docs/DEPLOYMENT_VALUE_SOURCE_BINDING_PLAN_2026-05-18.md` | D1.2 value-source plan |
| `docs/REDACTED_VALUE_SOURCE_VERIFICATION_2026-05-18.md` | V1.1 redacted verification evidence |
| `docs/AZURE_CONTAINER_APP_SANITIZED_EXPORT_2026-05-18.md` | A4.3R runtime evidence |
| `azure/container-app.yaml` | A4.2 repo-local reconciled shape evidence |
| `docs/DEPLOYMENT.md` | operator deployment posture and verification routes |

## Current Executive Decision

```yaml
decision:
  deploy_now: false
  prepare_packet: true
  preserve_holds: true
  correct_next_lane: DEP1.2_DEP1.3_DEP1.4_DEP1.5_sub_evidence
```

DEP1.1 is sufficient to organize a deployment decision, but it is not sufficient to approve the deployment itself.

## Deployment Readiness Review

| Gate | Evidence | Status | Impact |
| --- | --- | --- | --- |
| Fresh runtime evidence | A4.3R sanitized export | complete | runtime shape known at evidence time |
| Repo-local YAML reconciliation | A4.2 `azure/container-app.yaml` | complete repo-local | manifest shape evidence exists |
| Direct env value source plan | D1.2 | planned, values absent | deployment remains blocked |
| SecretRef name verification | V1.1 | name-only verified | values still inaccessible and undisclosed |
| Managed environment ID | repo-local YAML only | evidence gap | needs sanitized read-only confirmation |
| Rollback plan | current image/revision known | evidence gap | rollback path not yet executable |
| Deployment command | no command approved | held | command execution remains blocked |
| Post-deploy verification | routes identified | evidence gap | verification plan not yet approved |

## Critical Runtime Mutation Risk

`azure/container-app.yaml` intentionally contains direct environment variable names without direct values. That is the correct repo-local evidence posture, but it is not automatically safe as a mutation payload.

If applied without an approved value restoration and mutation plan, the manifest could:

- omit required direct runtime values
- weaken runtime truth instead of preserving it
- create config drift between docs, repo, and runtime
- obscure whether a failure came from code, config, or deployment mechanics

Classification:

```txt
deployment_blocker
```

Required handling:

```txt
Do not apply azure/container-app.yaml until direct value handling is explicitly approved and verified without committing values.
```

## Candidate Deployment Command Review

The following command family is listed only for review. It is not approved for execution.

```bash
az containerapp update \
  --name ca-nc-dev-sentinel \
  --resource-group rg-nc-dev-sentinel \
  --yaml azure/container-app.yaml
```

Command-review requirements before any execution approval:

- confirm the exact Azure CLI command and supported flags for the installed CLI version
- confirm whether the YAML payload would preserve or replace direct env values
- confirm managed environment ID against sanitized read-only runtime metadata
- confirm secretRef names exist without printing values
- confirm target image and prior image/revision before mutation
- define a stop condition before command execution
- require an explicit operator approval that names the command, target app, target resource group, target manifest, and rollback posture

## Rollback Posture

Current runtime evidence from A4.3R:

| Runtime Field | Evidence |
| --- | --- |
| Container App | `ca-nc-dev-sentinel` |
| Resource Group | `rg-nc-dev-sentinel` |
| Latest Ready Revision | `ca-nc-dev-sentinel--0000030` |
| Image | `acrncdevsentinel.azurecr.io/sentinel-api:phase1-approval-continuity-3e7308a-20260513-0645` |
| Active Revision Mode | `Single` |

Rollback requirements before deployment approval:

- preserve the latest ready revision and image immediately before mutation
- define whether rollback uses image reapplication, revision routing, or prior manifest restoration
- confirm rollback does not require secret value disclosure
- define rollback stop conditions
- require separate rollback execution approval unless emergency authority is explicitly granted

Rollback is not approved by this packet.

## Post-Deploy Verification Requirements

If deployment is later approved, verification must be defined before mutation.

Minimum checks to approve in a later packet:

| Check | Purpose | Current Posture |
| --- | --- | --- |
| `GET /health` | service health | route known, execution not approved |
| `GET /proof` | proof surface | route known, execution not approved |
| protected audit route without key | auth block verification | expected block documented |
| governed command approval stop | execution boundary verification | expected blocked state documented |
| public bridge status if affected | external integration visibility | bridge evidence exists, recheck not approved |
| revision and traffic state | confirm rollout target | read-only check required |

## DEP1 Sub-Issue Board

| ID | Required Evidence | Status | Recommendation | Still Held |
| --- | --- | --- | --- | --- |
| `DEP1.2` | Managed environment ID verification | evidence_gap | prepare sanitized read-only verification artifact | deployment |
| `DEP1.3` | Rollback plan | evidence_gap | prepare rollback plan using image/revision lineage without execution | rollback execution |
| `DEP1.4` | Deployment command review | held | prepare command-review artifact; do not run command | command execution |
| `DEP1.5` | Post-deploy verification plan | evidence_gap | prepare verification plan with stop conditions | post-deploy execution |

## Sentinel AI Recommendation

```txt
Do not approve deployment yet.
```

DEP1.1 should be treated as a deployment decision packet that exposes the remaining authority and evidence gaps. The safest next work is to prepare the DEP1.2 through DEP1.5 sub-evidence artifacts in review-only mode.

## Non-Authorization Clause

This deployment approval packet does not authorize deployment, runtime mutation, direct env value restoration, secret value access, secret value disclosure, registry credential mutation, managed identity migration, rollback execution, endpoint publication, pilot activation, tenant activation, held-standard promotion, push, or autonomous execution.
