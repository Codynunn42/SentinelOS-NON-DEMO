# SentinelOS v1.3.0 - Governance Signals

## Artifact Decision

```txt
[KEEP:IMMUTABLE-RELEASE-LINEAGE]
```

Next step: preserve unchanged except for explicit release-lineage annotations.

## Overview

This release turns SentinelOS audit visibility into a reactive control loop.

SentinelOS now evaluates governed audit events, raises correlated Governance Signals, persists those signals, streams them independently, and can escalate high-severity signals through a configured webhook.

## Added

### Governance Signals Engine

- Generates signals from audit events.
- Detects low trust scores, blocked actions, approval-required actions, and audit persistence failures.
- Adds signal IDs and event correlation through `id` and `eventId`.

### Signal Store

- Stores signals through the database when `DATABASE_URL` is enabled.
- Falls back to a JSONL signal store for local/non-database operation.
- Keeps Mission Control, `/v1/alerts`, and `/v1/metrics` aligned to the same signal source.

### Signal Stream

- Added `/v1/signals/stream` for dedicated real-time Governance Signal streaming.
- Audit stream still includes correlated signals, while the signal stream keeps the mental model clean.

### Signal Escalation

- Added high-severity webhook escalation through `SIGNAL_WEBHOOK_URL`.
- Escalation is off unless the webhook is explicitly configured.

### Metrics Integration

- `/v1/metrics` now includes:
  - event counts
  - trust summary
  - Governance Signal totals
  - severity breakdown

## Improved

- `/ready` now reports `signalsStore`.
- Mission Control now includes:
  - Trust Dashboard
  - Live Audit Feed
  - Governance Signals panel
  - dedicated signal stream connection

## Validation

```bash
npm run check:audit-stream
npm run check:mission-control
npm run check:trust-score
npm run check:ready
npm run check:ownerfi-pilot-api
```

## Position

```txt
SentinelOS now operates as a governed control system:
GaaS policy -> execution -> audit -> signals -> metrics -> escalation.
```
