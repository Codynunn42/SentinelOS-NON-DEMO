# Proof UI + Control Plane Release Note - 2026-05-07

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Status

```txt
[LIVE:VERIFIED-2026-05-07]
```

This release note packages the proof/control-plane work and the live verification evidence captured on 2026-05-07.

## Release Thesis

```txt
Bad deals do not get through.
```

The proof surface now demonstrates controlled execution visually:

```txt
Submit Deal -> Execute Deal blocked -> Approve Deal -> Execute Deal succeeds
```

## What Changed

### Control Plane

- Added a strict Control Plane layer under `apps/sentinel/src/controlPlane`.
- Normalizes intent into a command envelope.
- Validates `intent === entity.action`.
- Sends through `/v1/command`; no business logic lives in the Control Plane.

### UI Control Boundary

- Added `POST /api/control/execute` in `apps/api/server.js`.
- Browser proof UI calls `/api/control/execute`.
- Browser proof UI no longer calls `/v1/command` directly.

### Proof UI

- Replaced the broad proof console with a single-screen Deal Execution Engine.
- Left side: deal actions.
- Right side: decision score, alert, state, reason.
- Bottom: live activity feed.
- Added XE Command Plane overlay on `Ctrl+K` / `Cmd+K`.
- XE parses simple operator commands and routes them through the same Control Plane handlers as the buttons.
- XE does not call `/v1/command` directly.

### Governed Deal Commands

- Added `deal.submit`.
- Added `deal.approve`.
- Preserved `deal.execute` as the governed execution step.
- Added scopes and policy mappings for the new command names.

## Local Verification

Passed:

```bash
node scripts/check-control-plane.js
node scripts/check-control-ui.js
node scripts/check-control-ui-route.js
node scripts/check-proof-ui-flow.js
node scripts/check-policy-engine.js
node scripts/check-key-registry.js
node scripts/check-task-templates.js
node scripts/check-receipt-lookup.js
node scripts/check-governance-drift-monitor.js
node scripts/check-drift-governance-core.js
node scripts/check-mission-control-surface.js
node scripts/check-demo-assets-v2.js
```

Loopback note:

`check-control-ui-route` and `check-proof-ui-flow` require temporary local `127.0.0.1` port binding.

## Proof Flow Evidence

Latest local proof flow:

```txt
status: proof-ui-flow-check-passed
blockedStatus: blocked
executedStatus: executed
xeSurface: present
xeRoute: /api/control/execute
```

## Live Verification Evidence

Captured on 2026-05-07:

- Container App: `ca-nc-dev-sentinel`
- Active revision: `ca-nc-dev-sentinel--proof-control-plane-2000`
- Revision health: `Healthy`
- Traffic: `100`
- Image: `acrncdevsentinel.azurecr.io/sentinel-api:proof-control-plane-20260507-2000`
- ACR digest: `sha256:fca33908675ad7db4444a94ac0efddd1a3f2fcde8e34034ffa1e150e8abf0bdd`
- Live `/health`: `200`
- Live `/proof`: `200`, served `SentinelOS Deal Execution`
- Protected `/v1/audit?tenant=ownerfi`: `200`

Protected `/api/control/execute` proof run:

```txt
applicationId: app_dbff0a8b-72bf-4869-94d3-c06df59a044b
submit: 200 executed
execute_before_approval: 409 blocked
blocked_reason: Application must be approved before deal execution
approve: 200 executed
execute_after_approval: 200 executed
dealId: deal_3ee8cb9d-094d-496d-a671-4ff3e72ef136
```

XE Command Plane follow-up deploy:

```txt
activeRevision: ca-nc-dev-sentinel--xe-command-plane-2055
image: acrncdevsentinel.azurecr.io/sentinel-api:xe-command-plane-20260507-2055
digest: sha256:e72542934bb6027b2f8706431c86fbd3a947adc3ad4f05f4cc1595f69f0d9890
liveHealth: 200
liveProof: 200
proofContainsXE: true
proofContainsControlRoute: true
```

Protected XE-image proof run:

```txt
applicationId: app_d01dc4da-7964-4347-b0b6-94929cf78985
submit: 200 executed
execute_before_approval: 409 blocked
blocked_reason: Application must be approved before deal execution
approve: 200 executed
execute_after_approval: 200 executed
dealId: deal_39e9376f-6160-45f9-a367-706ac63bf498
```

Log Analytics refreshed for the new release:

```txt
workspace: log-nc-dev-sentinel
table: ContainerAppConsoleLogs_CL
ownerfi.deal.submitted: present
ownerfi.deal.approved: present
ownerfi.deal.active: present
```

Known evidence gap:

The blocked execution is confirmed by the protected API response and protected audit feed, but it did not appear as a distinct searchable `policy_blocked` / blocked-deal business event in Log Analytics during this pass.

## Approval Boundary

This release note does not approve:

- deployment
- external publication
- held public-sector documents
- Stripe checkout enablement
- repo cleanup, deletion, archival, merge consolidation, or broad streamlining

## Recommended Approval

Approve this as the local release candidate package, then separately approve the live redeploy/verification pass.
