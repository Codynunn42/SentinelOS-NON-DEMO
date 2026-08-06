# DEP1.5 Post-Deploy Verification Plan - 2026-05-19

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[KEEP:DEP1.5-POST-DEPLOY-VERIFICATION-PLAN-REVIEW-ONLY]
```

## Approval Scope

`DEP1.5` is approved as review-only deployment sub-evidence under `DEP1.2-DEP1.5`.

This artifact defines post-deploy verification checks and stop conditions for a future deployment decision. It does not authorize deployment, runtime mutation, live verification checks, command execution, direct env value restoration, secret access, secret disclosure, rollback execution, endpoint publication, pilot activation, tenant activation, held-standard promotion, push, or autonomous execution.

## Core Invariant

```txt
Post-deploy verification planning defines runtime truth checks. Post-deploy verification planning does not authorize live checks, deployment, or runtime mutation.
```

## Source Truth

| Source | Use |
| --- | --- |
| `docs/AZURE_CONTAINER_APP_SANITIZED_EXPORT_2026-05-18.md` | runtime route, revision, ingress, and probe posture evidence |
| `docs/DEPLOYMENT_APPROVAL_PACKET_DEP1_1_2026-05-19.md` | minimum post-deploy verification requirements |
| `docs/DEPLOYMENT.md` | operator route posture and deployment verification context |
| `docs/NEXT_APPROVAL_SET_DEP1_2_DEP1_5_2026-05-19.md` | review-only operator approval for DEP1.2-DEP1.5 evidence preparation |

## Executive Result

```yaml
dep1_5_result:
  status: prepared_review_only
  verification_plan_prepared: true
  live_checks_authorized: false
  deployment_authorized: false
  runtime_mutation_authorized: false
  command_execution_authorized: false
```

## Verification Plan

If deployment is later separately approved, post-deploy verification should prove observed runtime truth rather than relying on command completion.

| Check | Purpose | Expected Posture | Current Authority |
| --- | --- | --- | --- |
| `GET /health` | service health | healthy response after rollout | not authorized for live execution |
| `GET /proof` | proof surface availability | proof endpoint reachable if unchanged | not authorized for live execution |
| protected `/v1/audit` without key | auth boundary | blocked without valid key | not authorized for live execution |
| governed command approval stop | execution boundary | approval-required path blocks unapproved action | not authorized for live execution |
| public bridge status if affected | exposure/integration posture | no unexpected public behavior change | not authorized for live execution |
| revision and traffic state | rollout identity | expected revision active with expected traffic | not authorized for live execution |
| audit/receipt evidence | traceability | deployment and verification events preserved if execution is later approved | not authorized for live execution |

## Evidence Handling Requirements

Post-deploy verification evidence must:

- record timestamp and operator context
- record target Container App and resource group
- record sanitized revision and traffic state
- record response status and bounded response summaries
- avoid secret values, API keys, tokens, direct env values, connection strings, and credentials
- link verification checks to the approval envelope that authorized them
- classify any mismatch as drift until reviewed

## Stop Conditions

| Stop Condition | Required Response |
| --- | --- |
| `/health` is non-OK or unavailable | stop; do not continue rollout confidence claims |
| `/proof` is unavailable when expected | stop; classify proof surface drift |
| protected audit route is accessible without expected authorization | stop; classify security boundary failure |
| governed command silently succeeds when approval is required | stop; classify execution-boundary failure |
| revision name or traffic does not match expected rollout | stop; classify runtime truth mismatch |
| public bridge behavior changes unexpectedly | stop; classify exposure drift |
| audit/receipt evidence is missing | stop; classify traceability failure |
| verification requires secret or direct value disclosure | stop and route through secret governance |

## Future Approval Envelope Required

If live post-deploy verification is later considered, the approval must name:

- approved deployment command or mutation event being verified
- exact target runtime
- exact checks to run
- allowed response fields
- prohibited response fields
- expected stop conditions
- evidence destination
- rollback escalation rule

## Non-Authorization Clause

This post-deploy verification plan is evidence only. It does not authorize deployment, runtime mutation, live verification checks, command execution, direct env value restoration, secret value access, secret value disclosure, rollback execution, endpoint publication, pilot activation, tenant activation, held-standard promotion, push, tool grants, certification claims, autonomous execution, or destructive cleanup.
