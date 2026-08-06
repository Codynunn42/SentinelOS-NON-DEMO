# HERGLASS Face Plane Plan

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Status

```txt
[DEFERRED:PHASE-2]
```

HERGLASS is not part of the Phase 1 Deal Execution Engine launch path.

It is reserved as a Phase 2 Perception Face Plane after the first pilot or strong demo feedback confirms the core governed execution loop.

## Purpose

HERGLASS should convert real-world input into governed system actions.

Product language:

```txt
Type -> Execute
Click -> Execute
Scan -> Execute
```

## Architecture

```txt
Camera / Input
    -> HERGLASS Perception Plane
    -> Intent
    -> Control Plane
    -> Sentinel Core
    -> Governance
    -> Result
```

HERGLASS must never execute directly.

It must emit intent into the same governed path used by:

- Deal Plane buttons
- XE Command Plane
- future Face Planes

## Phase 1 Boundary

Do not build HERGLASS during Phase 1.

Phase 1 remains:

- Deal Execution Engine
- XE Command Plane
- Control Plane
- governed `/v1/command`
- audit, signals, score, approvals
- outreach and demos

## Phase 2 Trigger

Start incorporating HERGLASS only after one of these happens:

- first pilot is accepted
- strong demo feedback asks for real-world/scanning input
- owner explicitly approves Phase 2 input-diversity work

## Intended Phase 2 Positioning

Do not lead with:

- NFT audio system
- vision pipeline
- model demo

Lead with:

```txt
Scan real-world inputs to trigger governed system actions.
```

## Example Intent

```json
{
  "intent": "deal.trigger.from.visual",
  "entity": "deal",
  "action": "trigger.from.visual",
  "context": {
    "object": "contract_document",
    "source": "herglass"
  },
  "actor": {
    "role": "operator"
  },
  "tenantId": "ownerfi"
}
```

## Guardrail

HERGLASS is a Face Plane, not a separate product path.

```txt
HERGLASS -> Intent -> Control Plane -> Sentinel Core
```

Never:

```txt
HERGLASS -> direct execution
HERGLASS -> direct /v1/command browser call
HERGLASS -> ungated reward/output path
```

## Bottom Line

HERGLASS fits SentinelOS as the Phase 2 Perception Face Plane.

It should make the system accept intent from vision while preserving the same governance contract that already controls keyboard and UI actions.
