# SentinelOS Human Steering Commands - 2026-05-15

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Purpose

Human input is part of the steering system.

Sentinel may detect drift and propose forks, but a human operator must be able to modify, redirect, hold, reject, or approve the suggestion before it becomes implementation work.

## OS Communication Path

Human instruction communicates with SentinelOS through the governed command plane:

```txt
human instruction -> signed /v1/command envelope -> governance preflight -> signed decision -> handler -> audit
```

The current command is:

```txt
drift.recommendation.instruct
```

Scope:

```txt
platform:admin
```

## Supported Actions

| Action | Meaning | Resulting Status |
| --- | --- | --- |
| `accept` | Human accepts the recommendation as the right direction. | `approved` |
| `hold` | Human pauses the recommendation for more review. | `pending_approval` |
| `reject` | Human rejects the recommendation. | `rejected` |
| `redirect` | Human keeps the drift signal but changes the steering direction. | `pending_approval` |
| `modify` | Human changes the recommendation details or proposed fork. | `pending_approval` |

## Safety Boundary

Human input can steer suggestions, but cannot bypass immutable boundaries.

Blocked fork targets include:

- `apps/sentinel/src/governance/authorityState.js`
- `apps/sentinel/src/governance/executionGuard.js`
- `apps/sentinel/src/governance/executionPassport.js`
- `apps/sentinel/src/security/signing.js`
- `apps/sentinel/src/audit/auditLogger.js`
- `apps/sentinel/src/approval/approval.js`

Allowed steering targets remain governed by `apps/sentinel/src/drift/driftPolicies.js`.

## Example Instruction

```json
{
  "tenant": "nunncloud",
  "command": "drift.recommendation.instruct",
  "payload": {
    "recommendationId": "drift_rec_example",
    "action": "redirect",
    "humanInput": "Keep the fork narrow. Do not touch policy yet. Add retry guidance only.",
    "modifiedRecommendation": {
      "recommendedAction": "Add retry guidance to blocked command responses before changing policy."
    },
    "proposedFork": {
      "branchName": "fork/drift-workflow-retry-reduction",
      "targetFiles": ["apps/sentinel/src/commands/dispatch.js"],
      "rationale": "Human-directed retry guidance before policy changes."
    }
  }
}
```

## Why This Matters

This completes the steering loop:

```txt
drift signal -> Sentinel suggestion -> human instruction -> bounded fork -> verification -> audit
```

SentinelOS can now communicate through commands and instructions, not just passive reports.

## Verification

```txt
pnpm run check:human-steering
pnpm run check:faceplane-fork-continuity
pnpm run check:workflow-retry
pnpm run check:execution-integrity
```

## Status

Status: `active`

Human steering is now a governed command capability.
