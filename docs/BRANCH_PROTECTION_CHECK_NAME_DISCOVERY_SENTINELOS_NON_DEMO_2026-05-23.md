# Branch Protection Check Name Discovery - SentinelOS-NON-DEMO - 2026-05-23

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** read-only check discovery  
**Posture:** discover, record, do not enforce  
**Repository:** `Codynunn42/SentinelOS-NON-DEMO`  
**Target Branch:** `main`  
**Authority Created:** false

## Artifact Decision

`[KEEP:BRANCH-PROTECTION-CHECK-NAME-DISCOVERY-SENTINELOS-NON-DEMO-2026-05-23]`

This packet records exact GitHub Actions workflow/job names for future branch protection planning.

It does not change branch protection.

## Source Evidence

| Source | Evidence |
| --- | --- |
| `.github/workflows/ci.yml` | workflow `CI`, job key `sentinel-api` |
| `.github/workflows/deploy.yml` | workflow `Deploy to Azure Container Apps`, job key `deploy` |
| `gh run list` read-only query | recent CI and deploy runs are failing |
| `gh run view` read-only query | exact job names confirmed as `sentinel-api` and `deploy` |

## Recent Run Evidence

| Run ID | Workflow | Event | Branch | Conclusion | Job Name |
| --- | --- | --- | --- | --- | --- |
| `26004490724` | `CI` | `pull_request` | `hardening/telemetry-signature-correlation` | failure | `sentinel-api` |
| `25832323257` | `CI` | `push` | `main` | failure | `sentinel-api` |
| `25832323261` | `Deploy to Azure Container Apps` | `push` | `main` | failure | `deploy` |

## Check Name Discovery Result

Exact discovered job names:

```yaml
checks:
  ci:
    workflow: CI
    job_name: sentinel-api
    status: DISCOVERED_BUT_RECENTLY_FAILING
  deploy:
    workflow: Deploy to Azure Container Apps
    job_name: deploy
    status: DISCOVERED_BUT_EXCLUDED_FROM_BRANCH_PROTECTION
authority_created: false
```

## Branch Protection Implication

Recommended future required check candidate:

```txt
sentinel-api
```

Do not enforce it yet.

Reason:

```txt
Recent CI runs are failing. Requiring the check now could block normal branch flow before CI is stabilized.
```

Deploy check:

```txt
deploy
```

Branch protection treatment:

```txt
Do not require deploy as a branch protection check in this packet.
```

Reason:

`deploy` is runtime-adjacent and currently runs on push to `main`. Requiring it as a branch protection condition would bind branch governance to deployment behavior before a release policy exists.

## Required Before Enforcement

Before any branch protection enforcement packet can be approved:

1. CI must be repaired or intentionally re-scoped.
2. `sentinel-api` must pass on the target branch or a controlled test branch.
3. Branch protection settings must list the exact required check.
4. Deploy workflow must remain excluded unless a separate release policy says otherwise.
5. Operator approval must explicitly authorize enforcement.

## Non-Authorization Clause

This discovery does not authorize:

- enabling branch protection
- requiring `sentinel-api`
- requiring `deploy`
- changing workflow files
- pushing commits
- deployment
- publication
- runtime mutation

## Gate Assessment

```yaml
check_name_discovery:
  exact_ci_job_name_discovered: true
  exact_deploy_job_name_discovered: true
  ci_currently_green: false
  deploy_excluded_from_branch_protection: true
  branch_protection_enforcement_ready: false
  result: PASS_TO_CI_STABILIZATION_PLANNING
  authority_created: false
```

## Next Action

```yaml
selected_action: ci_stabilization_implementation_packet_sentinelos_non_demo
deliverable: docs/CI_STABILIZATION_IMPLEMENTATION_PACKET_SENTINELOS_NON_DEMO_2026-05-23.md
authority_created: false
operation_type: approval_packet_before_workflow_edit
```
