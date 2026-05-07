# Nunn Cloud Control Surface Operating Model

Status: Final direction for this product lane

## Positioning

Nunn Cloud is standardizing operations under one model:

> SentinelOS is the internal control layer. Nunn Cloud Control Surface is how operators run it.

This is not a customer migration story. Existing users continue with the same experience while the underlying system moves to the latest governed operating model.

## User Model

### Existing Users

Position as a version upgrade:

> You are now on the latest operating model. No changes are required on your side.

Rules:

- no mid-contract pricing changes
- no forced renegotiation
- no visible split between direct Sentinel and OS-managed workflows
- improved governance, monitoring, and execution stay behind the scenes unless relevant

### New Users

New users enter through the pilot model:

- pilot validation
- governed workflow
- approval loop
- telemetry visibility controls
- billing/revenue gates
- conversion to paid structure after validation

### Renewals

At renewal, align users to the standard structure:

> This is now the standard operating model going forward.

No customer should feel moved away from Sentinel. The system has already been standardized; the user continues operating through the right surface for their contract.

## Internal Operating Split

This split is internal only:

| Mode | Use |
| --- | --- |
| Direct Sentinel usage | advanced workflows, custom ops, internal control |
| OS-managed workflows | standard execution, repeatable processes, external clients |

## Control Surface Scope

Nunn Cloud Control Surface is the executive/operator interface for:

- command console
- workflow board
- approval center
- telemetry harmonizer
- billing controls
- audit timeline

Everything must preserve the same governance posture:

- execution can return `SUCCESS`, `BLOCKED`, or approval-required state
- revenue actions are blocked until approved configuration exists
- telemetry export/visibility stays policy mediated
- audit tells the human-readable story of what happened

## Existing User Message

Hi,

We have rolled out an update to the underlying system that manages your workflows.

There is nothing you need to change. Your current processes continue as normal.

This update improves how workflows are governed, monitored, and executed behind the scenes, while keeping everything consistent on your side.

If anything new becomes relevant to your setup, we will walk through it together.

- Cody

## Renewal Message

As part of renewal, we are aligning accounts to the current Nunn Cloud operating model.

Your workflows and outcomes remain the focus. The updated structure gives us a cleaner governance, approval, audit, and execution path going forward.

We will walk through the renewal structure clearly before anything changes commercially.

## Guardrail

Do not describe this as separating users or moving customers off Sentinel.

Use:

> We standardized the operating model under Nunn Cloud OS.
