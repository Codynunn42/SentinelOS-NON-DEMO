# CI Stabilization Implementation Packet - SentinelOS-NON-DEMO - 2026-05-23

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** implementation approval packet  
**Posture:** define proposed edits, do not edit  
**Repository:** `Codynunn42/SentinelOS-NON-DEMO`  
**Target Check:** `sentinel-api`  
**Authority Created:** false  
**Mutation Authority:** false

## Artifact Decision

`[KEEP:CI-STABILIZATION-IMPLEMENTATION-PACKET-SENTINELOS-NON-DEMO-2026-05-23]`

This packet defines the proposed implementation to stabilize CI.

It does not edit workflow files, scripts, branch protection, or runtime settings.

## Objective

Make the `sentinel-api` CI check capable of passing before it is considered for branch protection.

Current blocker:

```txt
CI starts the API without SENTINEL_HMAC_SECRET.
```

## Proposed Change Scope

| File | Proposed Change | Purpose | Requires Approval |
| --- | --- | --- | --- |
| `.github/workflows/ci.yml` | add CI-only env values for `SENTINEL_HMAC_SECRET` and `NODE_ENV` | allow the real API to start in CI without production secrets | yes |
| `.github/workflows/ci.yml` | replace fixed `sleep 2` with retrying healthcheck loop | avoid false failure while API starts | yes |
| `scripts/healthcheck.js` | optional: add retry support via env vars | make readiness reusable outside workflow | yes, optional |

## Recommended Implementation Shape

Preferred first patch:

```yaml
jobs:
  sentinel-api:
    runs-on: ubuntu-latest
    env:
      NODE_ENV: test
      SENTINEL_HMAC_SECRET: ci-smoke-secret
```

Replace:

```yaml
- name: Start API
  run: |
    node apps/api/server.js &
    sleep 2

- name: Run healthcheck
  run: node scripts/healthcheck.js
```

With a readiness loop:

```yaml
- name: Start API
  run: |
    node apps/api/server.js &

- name: Wait for healthcheck
  run: |
    for i in {1..15}; do
      node scripts/healthcheck.js && exit 0
      sleep 2
    done
    exit 1
```

This keeps the real server startup path while avoiding a fixed two-second readiness assumption.

## Optional Script Hardening

Optional later patch:

```txt
scripts/healthcheck.js supports HEALTHCHECK_RETRIES and HEALTHCHECK_RETRY_DELAY_MS.
```

Recommendation:

Hold optional script hardening until the workflow-only patch is tested. The smallest useful change is workflow-only.

## Required Approvals

| Approval ID | Approval | Required Before |
| --- | --- | --- |
| `CI-IMPL-A01` | approve editing `.github/workflows/ci.yml` | any workflow patch |
| `CI-IMPL-A02` | approve adding CI-only `SENTINEL_HMAC_SECRET` | workflow env addition |
| `CI-IMPL-A03` | approve readiness loop | workflow healthcheck loop |
| `CI-IMPL-A04` | approve optional `scripts/healthcheck.js` retry support | script edit, if chosen |

## Not Approved By This Packet

- branch protection enforcement
- required status check enforcement
- deploy workflow changes
- deployment
- publication
- runtime mutation
- cleanup
- GitHub settings changes
- production secret changes

## Post-Implementation Evidence Required

After an approved implementation, collect:

1. local diff showing only approved files changed
2. CI run URL for `sentinel-api`
3. CI conclusion for `sentinel-api`
4. proof that deploy workflow was not made a required check
5. proof no branch protection was enabled by the patch
6. updated next-steps status

Success condition:

```txt
sentinel-api == GREEN
```

Branch protection remains held until that evidence exists.

## Rollback Path

If the CI patch causes unexpected behavior:

1. revert the workflow-only CI stabilization patch
2. restore prior `.github/workflows/ci.yml`
3. keep branch protection enforcement held
4. record failed CI run and reason
5. return to CI planning with no runtime movement

Rollback does not require deployment.

## Operator Approval Language

If approving workflow implementation:

```txt
I approve CI stabilization workflow implementation for SentinelOS-NON-DEMO limited to `.github/workflows/ci.yml`.
Approved changes: CI-only `SENTINEL_HMAC_SECRET`, `NODE_ENV: test`, and a retrying healthcheck loop.
No branch protection changes, deploy workflow changes, pushes, deployment, publication, cleanup, or runtime mutation authority is granted.
```

If approving optional script hardening too:

```txt
I also approve optional `scripts/healthcheck.js` retry support for CI readiness only.
No branch protection changes, deploy workflow changes, pushes, deployment, publication, cleanup, or runtime mutation authority is granted.
```

## Gate Assessment

```yaml
ci_stabilization_implementation_packet:
  proposed_files:
    - .github/workflows/ci.yml
    - scripts/healthcheck.js_optional
  implementation_ready_for_operator_approval: true
  branch_protection_ready: false
  required_check_ready: false
  authority_created: false
  result: WAIT_FOR_OPERATOR_IMPLEMENTATION_APPROVAL
```

## Next Action

```yaml
selected_action: wait_for_ci_stabilization_implementation_approval
deliverable: operator approval or hold decision
authority_created: false
```
