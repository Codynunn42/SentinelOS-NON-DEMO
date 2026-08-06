# Fresh Proof Rerun Result - 2026-06-01

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** proof rerun result  
**Selected Action:** `REQUEST_FRESH_PROOF_RERUN_BEFORE_SHARE`  
**State:** Partially Verified, Local Bind Blocked  
**Authority Created:** false

## Artifact Decision

```txt
[KEEP:FRESH-PROOF-RERUN-RESULT-2026-06-01]
```

## Purpose

Record the proof freshness attempt requested from the current executive decision queue.

## Result

```yaml
proof_rerun_result:
  local_bind_dependent_checks:
    scripts/check-proof-ui-flow.js:
      status: blocked_by_environment
      error: listen_EPERM_127_0_0_1
    scripts/check-ready-endpoint.js:
      status: blocked_by_environment
      error: listen_EPERM_127_0_0_1
    escalated_retry:
      status: denied_by_permission_hook
  non_bind_checks:
    scripts/check-control-ui.js: passed
    scripts/check-demo-assets-v2.js: passed
    scripts/check-docking-protocol.js: passed
    scripts/check-faceplane-sdk.js: passed
  proof_freshness_status: not_fully_refreshed_due_to_environment_bind_constraint
  runtime_regression_indicated: false
  external_share_authorized: false
  authority_created: false
```

## Interpretation

The proof rerun did not complete the bind-dependent local flow because the environment blocked `127.0.0.1` listeners and the escalated retry was denied. Static proof surface, demo asset, docking, and faceplane SDK checks passed.

Before any meeting, share, or external claim, rerun the bind-dependent proof checks in an environment that permits local server binding or against the approved live proof target.

## Non-Authorization

This result does not authorize external sharing, publication, proof freshness claims beyond the checks listed above, Azure mutation, KQL, runtime mutation, staging, committing, pushing, or deployment.
