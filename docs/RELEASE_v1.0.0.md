# v1.0.0 - Deal Execution Engine

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[KEEP:IMMUTABLE-RELEASE-LINEAGE]
```

Next step: preserve unchanged except for explicit release-lineage annotations.

## Status

```txt
[LIVE:PHASE-1-LOCKED]
```

Phase 1 release for external demo use.

## Release Thesis

```txt
Bad deals do not get through.
```

## Included

- Control Plane enforced.
- XE (`Ctrl` / `Cmd` + `K`) Command Face Plane.
- Proof UI single-screen experience.
- Run Demo and Reset controls.
- Role toggle for operator / approver.
- Activity Feed wired to the audit stream when a protected run key is present.
- Risk Alerts and Decision Score.
- Structured demo contract for `/api/control/execute`.
- Block -> Approve -> Execute flow.

## Demo Contract

Reference: `docs/DEMO_CONTRACT.md`

```txt
submitted
blocked
approved
executed
```

## Demo URL

```txt
https://ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io/proof
```

## Landing URL

```txt
https://ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io/
```

## Live Evidence

Captured on 2026-05-07:

```txt
revision: ca-nc-dev-sentinel--phase1-lock-2110
image: acrncdevsentinel.azurecr.io/sentinel-api:phase1-lock-20260507-2110
digest: sha256:7f0fc2fb4c33d4ebea07a98c06c3c40f204d595cf80ba8c328bfa9ada5c6e9cb
health: 200
landing: 200
proof: 200
auditStream: 200 stream.connected
```

Protected demo contract verification:

```txt
submit: 200 submitted
execute_before_approval: 200 blocked approval_required
approve: 200 approved approval_recorded
execute_after_approval: 200 executed
applicationId: app_514f38dc-f19d-4e17-9fcf-f84a3fc3c692
dealId: deal_c163a26c-c6ed-4a04-b557-a495f527511a
```

## External Demo Script

1. Submit Deal.
2. Execute Deal -> blocked.
3. Show reason, Decision Score, and Risk Alert.
4. Approve Deal.
5. Execute Deal -> success.
6. Show Activity Feed.

Close with:

```txt
We do not replace your system. We ensure it behaves correctly.
```

## Not Included

- HERGLASS implementation.
- Stripe checkout enablement.
- public-sector deployment claims.
- wallet runtime claims.
- cryptographic build-signing claims.
- broad repo cleanup, archival, deletion, or merge consolidation.

## Release Gate

Tag only after owner approval and after the current working tree changes are committed.

Recommended commands after approval:

```bash
git tag v1.0.0
git push origin v1.0.0
```
