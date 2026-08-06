# SentinelOS Phase 1 Invariants

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Status

```txt
[LOCKED:PHASE-1]
```

These invariants guard the Phase 1 Deal Execution Engine from drift.

## Execution Path

- All UI actions go through the Control Plane.
- No direct UI calls to `/v1/command`.
- XE is a Command Face Plane, not a bypass.
- Deal buttons are a Deal Face Plane, not business logic.

## Demo Contract

- `/api/control/execute` returns structured demo responses.
- Demo responses use `{ status, reason?, decisionScore, alerts[] }`.
- Allowed status values are `submitted`, `blocked`, `approved`, and `executed`.
- Governance blocks return HTTP `200` with `status: "blocked"` for demo stability.

## Required Demo Loop

```txt
submit -> blocked execute -> approve -> execute
```

## Decision Panel

- Blocked: red, approval required before execution.
- Approved: yellow, approval recorded.
- Executed: green, deal executed safely.

## External Claims

- Do not claim HERGLASS, Stripe checkout, public-sector deployment, Google Edge, wallet runtime, or cryptographic build signing as shipped Phase 1 capabilities.
- Keep HERGLASS deferred as the Phase 2 Perception Face Plane.
- Keep Stripe checkout gated until price, mode, webhook, legal copy, and fulfillment rules are approved.
