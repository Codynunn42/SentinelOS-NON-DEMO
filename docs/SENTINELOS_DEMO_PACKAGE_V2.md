# SentinelOS Demo Package v2

Status: current external narrative and proof package

## Positioning

Use this line everywhere:

```txt
SentinelOS = Execution OS
Face Planes = Interaction Layer
GaaS = Policy Layer
Docking = Enforcement Boundary
```

Official proof story:

```txt
We do not replace your system.
We control what your system is allowed to do.
```

## What To Show

Show one simple proof:

```txt
A governed command is attempted, blocked until approval, and preserved in audit.
```

Demo sequence:

```txt
Submit action
-> Attempt execution
-> BLOCK
-> Approval
-> Execute
-> Audit log
```

Do not show ten workflows. Do not start with architecture. Show the system making a decision.

## Visual Diagrams

- [System Architecture v2](./diagrams/sentinelos_architecture_v2.mmd)
- [Governance Pipeline v2](./diagrams/governance_pipeline_v2.mmd)
- [Face Plane Docking v2](./diagrams/faceplane_docking_v2.mmd)

## Live Proof Endpoints

Primary proof path:

- `/health`
- `/v1/command`
- `/v1/audit`

Current demo surfaces:

- `/proof`
- `/mission-control`

## Current Proof Case

[Governed Deal Execution - Reference Implementation](./PROOF_CASE_GOVERNED_DEAL_EXECUTION_V2.md)

## Live Demo Script

[SentinelOS Live Demo Script v2](./SENTINELOS_LIVE_DEMO_SCRIPT_V2.md)

## One-Page Proof Sheet

[SentinelOS Proof Sheet v2](./SENTINELOS_PROOF_SHEET_V2.md)

## Language Guardrails

Say:

```txt
SentinelOS governs execution before action happens.
We do not build apps. We control how apps behave.
```

Avoid:

```txt
SentinelOS is a regulated-finance product.
SentinelOS is government-ready today.
SentinelOS replaces the customer's platform.
```

The correct posture is:

```txt
Enterprise pilot hardening now.
Institutional scaling next.
Government alignment after proof.
Public utility later.
```
