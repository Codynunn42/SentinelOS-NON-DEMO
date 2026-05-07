# SentinelOS Live Demo Script v2

Goal: show that SentinelOS governs execution, not just logs activity.

## Setup

Open:

```txt
https://ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io/proof
```

Keep the demo narrow:

```txt
health -> command -> block -> audit
```

## Opening Line

```txt
SentinelOS is a governed execution OS. It sits between user intent and system action.
We do not replace your system. We control what your system is allowed to do.
```

## Flow

1. Show the surface.

Say:

```txt
This is a face plane. It is not the OS. It is the interaction layer.
```

2. Show the command path.

Say:

```txt
Every action becomes a command envelope through /v1/command.
```

3. Trigger or show the governed workflow.

Use the proof case:

```txt
application.submit -> deal.execute
```

4. Stop at the blocked action.

Say:

```txt
The system blocked deal execution because approval is required.
```

Pause for two seconds.

Say:

```txt
That is the product. SentinelOS decides before execution.
```

5. Show audit.

Say:

```txt
The decision is preserved in audit. The proof is not a screenshot. It is system behavior.
```

6. Close with the operating formula.

Say:

```txt
SentinelOS is the execution OS. Face planes adapt it. GaaS maps the rules. Docking enforces the boundary.
```

## Two-Minute Narration

```txt
SentinelOS is a governed execution OS.

We do not replace your system. We control what your system is allowed to do.

Here is a simple workflow. An application can be submitted, but deal execution is approval-gated.

When execution is attempted, SentinelOS does not guess and it does not silently continue. It blocks the action.

That block is not a failure. It is the control working.

The decision is preserved in audit, so the organization can see what was attempted, why it stopped, and what approval is required.

That is the core pattern: user action, command envelope, governance preflight, execution decision, audit record.
```

## What Not To Do

- Do not start by explaining the whole architecture.
- Do not show more than one proof case.
- Do not claim government deployment as active.
- Do not bypass the approval gate during the demo.
- Do not make the customer feel they must replace their platform.

## If Asked "What Is This For?"

Answer:

```txt
This is for organizations that need governed execution across existing systems, where actions must be authorized, auditable, and controlled before they happen.
```

## If Asked "Can It Fit Our Requirements?"

Answer:

```txt
Yes, through a face plane and a GaaS policy pack. SentinelOS remains the execution OS; the face plane and policy pack adapt the system to the mandate.
```
