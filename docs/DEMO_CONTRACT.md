# Demo Contract

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Status

```txt
[LOCKED:PHASE-1-DEMO]
```

This is the demo response contract for `/api/control/execute`.

The browser calls `/api/control/execute`.

The Control Plane calls `/v1/command`.

The browser must not call `/v1/command` directly.

## HTTP Contract

`/api/control/execute` returns HTTP `200` for demo decisions.

Governance blocks are represented in the JSON body, not by a failing HTTP status.

## Status Values

```txt
submitted
blocked
approved
executed
```

## Submitted Response

```json
{
  "status": "submitted",
  "reason": "submitted",
  "decisionScore": 72,
  "alerts": ["review_needed"]
}
```

## Blocked Response

```json
{
  "status": "blocked",
  "reason": "approval_required",
  "decisionScore": 40,
  "alerts": ["approval_required"]
}
```

## Approved Response

```json
{
  "status": "approved",
  "reason": "approval_recorded",
  "decisionScore": 88,
  "alerts": ["approval_recorded"]
}
```

## Executed Response

```json
{
  "status": "executed",
  "reason": "executed",
  "decisionScore": 96,
  "alerts": []
}
```

## Allowed Demo Flow

```txt
submit -> blocked execute -> approve -> execute
```

## Invariant

Any Face Plane can change the input surface, but not the execution path.

```txt
Face Plane -> Control Plane -> Sentinel Core -> Governance -> Audit
```
