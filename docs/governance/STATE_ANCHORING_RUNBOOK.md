# State Anchoring Runbook

Status: Approved verification workflow

## Client-Facing Language

Use:

> We create verifiable records of key system states so they can be independently validated.

Do not use customer-facing language that emphasizes chain/vendor mechanics.

## Standard Labels

- `SYSTEM_RELEASE`
- `PILOT_START`
- `EXECUTION_APPROVED`
- `BILLING_ACTIVATED`

## Current Release Anchor

Source record:

- `docs/anchors/system-release-current.json`

Generate or refresh:

```bash
npm run release:anchor
```

Verify:

```bash
npm run check:state-anchors
```

## External Anchor Procedure

1. Open `docs/anchors/system-release-current.json`.
2. Copy the `hash`.
3. Send 0 ETH to self using the approved wallet path.
4. Paste the hash into the transaction data field.
5. Capture:
   - `txId`
   - `blockNumber`
6. Record it through the Sentinel API:

```http
POST /v1/anchors/system-release/external
Authorization: Bearer <SENTINEL_API_KEY>
Content-Type: application/json

{
  "txId": "0x...",
  "blockNumber": "12345678"
}
```

This logs `STATE_ANCHORED` into Sentinel audit and marks the release anchor `VERIFIED`.

## Next Anchor Roadmap

1. `PILOT_START`
2. `EXECUTION_APPROVED`
3. `BILLING_ACTIVATED`
4. Contract / renewal transition

## Rule

Anchors represent decisions, not ordinary events.
