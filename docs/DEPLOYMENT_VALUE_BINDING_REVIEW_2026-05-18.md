# Deployment Value Binding Review - 2026-05-18

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[KEEP:DEPLOYMENT-VALUE-BINDING-REVIEW-D1.1]
```

## Approval Scope

`D1.1` approved a deployment value and binding review for the reconciled `azure/container-app.yaml`.

This artifact is review-only. It does not authorize deployment, runtime mutation, secret value access, secret value disclosure, direct env value restoration, registry credential mutation, rollout, rollback execution, or public endpoint publication.

## Core Invariant

```txt
Deployment value review evaluates binding readiness. Deployment value review does not independently authorize deployment or runtime mutation.
```

## Source Evidence

| Source | Use |
| --- | --- |
| `docs/AZURE_CONTAINER_APP_SANITIZED_EXPORT_2026-05-18.md` | fresh sanitized runtime truth |
| `azure/container-app.yaml` | A4.2 repo-local reconciled manifest |
| `docs/A4_2_YAML_RECONCILIATION_COMPLETION_2026-05-18.md` | A4.2 completion evidence |
| `docs/DEPLOYMENT.md` | operator deployment posture |

## Review Result

```yaml
d1_1_result:
  status: review_completed_deployment_not_ready
  runtime_shape_alignment: materially_aligned
  deployment_authority: false
  runtime_mutation_authority: false
  direct_env_values_ready: false
  secret_binding_ready: partial_review_required
  registry_auth_ready: review_required
  rollback_ready: false
```

## Aligned Runtime Shape

The reconciled manifest aligns to the fresh sanitized runtime export on the major non-secret runtime shape:

| Area | Runtime Evidence | Repo Manifest | Review |
| --- | --- | --- | --- |
| Container App | `ca-nc-dev-sentinel` | `ca-nc-dev-sentinel` | aligned |
| Resource Group | `rg-nc-dev-sentinel` | `rg-nc-dev-sentinel` | aligned |
| Location | `East US 2` | `East US 2` | aligned |
| Active Revisions | `Single` | `Single` | aligned |
| Ingress | external, allow insecure false | external, allow insecure false | aligned |
| Target Port | `80` | `80` | aligned |
| Image | `acrncdevsentinel.azurecr.io/sentinel-api:phase1-approval-continuity-3e7308a-20260513-0645` | same | aligned |
| Probes | `/health` on port `80` | `/health` on port `80` | aligned |
| Scale | min `1`, max `2` | min `1`, max `2` | aligned |
| Secret Env Posture | secret-bearing vars use `secretRef` | secret-bearing vars use `secretRef` | aligned |

## Findings

### D1.1-F1 - Direct Env Values Are Intentionally Absent

The sanitized runtime export omitted direct env values by design. The reconciled YAML mirrors names and secretRef posture, but it does not restore direct values for entries such as `NODE_ENV`, `PORT`, `SENTINEL_VERSION`, Azure IDs, Application Insights, reporting webhook, App Configuration endpoint, auth mode, smoke auth, environment, or key rotation timestamp.

Classification:

```txt
deployment_blocker
```

Recommended response:

```txt
Prepare a separate value-source and binding plan that names the source of each direct value without exposing secret values in tracked docs.
```

### D1.1-F2 - Secret Names Are Present, Values Are Not

The manifest lists secret names only. That is the correct repo posture. Deployment readiness still requires confirming that every referenced secret exists in the target Container App or approved secret source before applying any manifest.

Classification:

```txt
review_required
```

Recommended response:

```txt
Verify secret presence and source binding with a redacted, name-only check before any deployment command is approved.
```

### D1.1-F3 - Registry Auth Uses Existing Password Secret Reference

The fresh export shows registry server, username, and `registry-password` password reference with no identity binding. The reconciled manifest preserves that posture.

Classification:

```txt
preserve_current_runtime_posture_review_required
```

Recommended response:

```txt
Do not change registry auth during deployment reconciliation. If managed identity migration is desired, route it as a separate approved change.
```

### D1.1-F4 - Managed Environment ID Requires Final Verification

The reconciled manifest includes the managed environment ID used in repo-local evidence. The A4.3R export did not include this field in its sanitized table.

Classification:

```txt
verification_gap
```

Recommended response:

```txt
Verify managedEnvironmentId in a sanitized, read-only query before deployment approval.
```

### D1.1-F5 - Semantic YAML Validity Does Not Equal Deployment Readiness

The manifest is structurally usable as repo-local shape evidence, but deployment would be a runtime mutation and would require value sources, secret binding confirmation, rollback posture, deployment command approval, and post-deploy health checks.

Classification:

```txt
non_authorization_guardrail
```

Recommended response:

```txt
Keep A4.2 as repo-local evidence until D1.2 value binding and a separate deployment approval are complete.
```

## Deployment Readiness Checklist

| Gate | Status | Required Before Deployment |
| --- | --- | --- |
| Fresh runtime evidence | complete | preserve A4.3R as evidence |
| Repo-local shape reconciliation | complete | preserve A4.2 as evidence |
| Direct env value source decision | blocked | identify approved source for each direct env value |
| Secret binding confirmation | review_required | verify secret names and source posture without values |
| Registry auth decision | review_required | preserve current posture or approve separate migration |
| Managed environment verification | review_required | confirm `managedEnvironmentId` read-only |
| Rollback plan | blocked | define prior image/revision posture and rollback route |
| Deployment command approval | blocked | explicit operator approval required |
| Post-deploy health verification | blocked | define `/health`, `/proof`, and audit checks |

## Recommended Next Approval

```txt
D1.2 - deployment value source and binding plan, review-only, no deployment.
```

The D1.2 plan should map each non-secret direct env var to an approved source and each secretRef to a redacted presence/source check. It should not place secret values in tracked documentation.

## Non-Authorization Clause

This deployment value binding review does not authorize deployment, runtime mutation, direct env value restoration, secret value access, secret value disclosure, registry credential mutation, rollback execution, endpoint publication, pilot activation, tenant activation, or autonomous execution.
