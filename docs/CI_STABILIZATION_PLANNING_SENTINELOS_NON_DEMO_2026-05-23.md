# CI Stabilization Planning - SentinelOS-NON-DEMO - 2026-05-23

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** CI stabilization planning  
**Posture:** plan, decide, do not edit workflows  
**Repository:** `Codynunn42/SentinelOS-NON-DEMO`  
**Target Check:** `sentinel-api`  
**Authority Created:** false

## Artifact Decision

`[KEEP:CI-STABILIZATION-PLANNING-SENTINELOS-NON-DEMO-2026-05-23]`

This packet identifies the likely CI failure path and prepares a stabilization sequence.

It does not modify CI.

## Source Evidence

| Source | Evidence |
| --- | --- |
| `docs/BRANCH_PROTECTION_CHECK_NAME_DISCOVERY_SENTINELOS_NON_DEMO_2026-05-23.md` | exact CI job name discovered as `sentinel-api`; recent runs failing |
| `.github/workflows/ci.yml` | CI starts `node apps/api/server.js` then runs `node scripts/healthcheck.js` |
| `apps/api/server.js` | server startup requires `SENTINEL_HMAC_SECRET` |
| local startup test | `node apps/api/server.js` exits with `FATAL: SENTINEL_HMAC_SECRET missing` |
| `scripts/healthcheck.js` | checks `http://localhost:3000/health` by default |
| local sandbox startup with `SENTINEL_HMAC_SECRET` | bind attempt reached server listen path but local sandbox blocked port bind with `EPERM` |

## Current CI Workflow

Current `CI` workflow:

```yaml
workflow: CI
trigger:
  - push to main
  - pull_request
job: sentinel-api
steps:
  - checkout
  - setup node 20
  - npm install || true
  - node apps/api/server.js &
  - sleep 2
  - node scripts/healthcheck.js
```

## Failure Hypothesis

Primary likely cause:

```txt
CI starts the real API without SENTINEL_HMAC_SECRET.
```

Why this matters:

`apps/api/server.js` calls `requireAuthoritySecret()` when run directly. If `SENTINEL_HMAC_SECRET` is missing, startup exits before `/health` can respond.

Observed locally:

```txt
FATAL: SENTINEL_HMAC_SECRET missing
```

Secondary risk:

```txt
sleep 2 may be too weak as readiness handling.
```

Even after startup requirements are satisfied, CI should wait for `/health` with retries instead of assuming the server is ready after two seconds.

## Stabilization Options

| Option | Description | Pros | Risks | Recommendation |
| --- | --- | --- | --- | --- |
| `A` | Set a non-secret CI smoke `SENTINEL_HMAC_SECRET` in workflow env | minimal, preserves real server path | must ensure it is test-only and not production-looking | recommended first |
| `B` | Add a CI-only startup mode that bypasses signing secret | explicit test path | risks weakening production semantics if not tightly guarded | not first |
| `C` | Replace server startup with module-level health route test | avoids port/server startup fragility | less representative of real runtime | fallback only |
| `D` | Use existing higher-level check scripts instead of raw healthcheck | aligns with current governance checks | may be slower and broader than branch required check | evaluate after A |

## Recommended Minimal Plan

Planning recommendation:

1. Add workflow env for CI only:

```yaml
SENTINEL_HMAC_SECRET: ci-smoke-secret
NODE_ENV: test
```

2. Replace fixed `sleep 2` with retrying healthcheck loop or make `scripts/healthcheck.js` retry.
3. Keep CI target limited to `/health` first.
4. Run CI on the current hardening branch.
5. Require `sentinel-api` only after it is green.

## Branch Protection Dependency

Branch protection should not require `sentinel-api` until:

```txt
sentinel-api == GREEN
```

Current state:

```txt
sentinel-api == FAILING_RECENT_RUNS
```

Therefore:

```txt
branch_protection_required_check_enforcement == HELD
```

## What Must Not Be Included

Do not include the deploy workflow as a required branch protection check.

Do not make the CI stabilization packet:

- deploy
- change runtime
- publish
- alter branch protection
- alter GitHub settings
- introduce production secrets
- weaken `SENTINEL_HMAC_SECRET` requirements in production

## Decision Queue

| Decision ID | Decision | Recommended Choice | Authority If Approved |
| --- | --- | --- | --- |
| `CI-D01` | Approve CI stabilization patch planning | approve | planning only |
| `CI-D02` | Approve adding CI-only `SENTINEL_HMAC_SECRET` to workflow env | approve after review | workflow edit authority required later |
| `CI-D03` | Approve healthcheck retry handling | approve after review | script or workflow edit authority required later |
| `CI-D04` | Approve branch protection enforcement | hold | not ready |

## Operator Approval Language

If approving implementation planning:

```txt
I approve CI stabilization implementation planning for SentinelOS-NON-DEMO.
No branch protection changes, workflow changes, pushes, deployment, publication, cleanup, or runtime mutation authority is granted yet.
```

If later approving workflow edits, use a separate implementation approval.

## Gate Assessment

```yaml
ci_stabilization:
  failure_path_identified: true
  likely_primary_cause: missing_SENTINEL_HMAC_SECRET_in_CI
  required_check_candidate: sentinel-api
  branch_protection_enforcement_ready: false
  implementation_authority_created: false
  result: PASS_TO_CI_STABILIZATION_IMPLEMENTATION_PACKET
```

## Next Action

```yaml
selected_action: ci_stabilization_implementation_packet_sentinelos_non_demo
deliverable: docs/CI_STABILIZATION_IMPLEMENTATION_PACKET_SENTINELOS_NON_DEMO_2026-05-23.md
authority_created: false
operation_type: approval_packet_before_workflow_edit
```
