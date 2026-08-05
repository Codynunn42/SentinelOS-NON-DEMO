# GPT Executive Desk Connection Finalization - 2026-08-03

## Purpose

Finalize the governed GPT connection path used by the Executive Desk workflow in SentinelOS-NON-DEMO, while preserving approval and audit boundaries.

## Runtime Connection Surface

- Config endpoint: `GET /faceplane/openai/config?tenantId=nunn-internal`
- Status endpoint: `GET /faceplane/openai/status?tenantId=nunn-internal`
- Execute endpoint: `POST /faceplane/openai/execute`
- Escalation queue: `GET /operator/escalations`
- Escalation detail: `GET /operator/escalations/:workflowId`
- Escalation decision: `POST /operator/escalations/:workflowId/decision`

## Execution Modes

- `stubbed`: default mode; no external model call.
- `live`: enabled only when both conditions are true:
  - `SENTINEL_OPENAI_LIVE_MODE=true`
  - Required provider credentials and endpoint variables are present.
- `escalated_for_human_review`: high-risk execution held for operator review.

## Supported Providers

### OpenAI Provider

Required environment variables:

- `SENTINEL_OPENAI_LIVE_MODE=true`
- `OPENAI_API_KEY=...`

Optional environment variables:

- `OPENAI_BASE_URL=https://api.openai.com`
- `OPENAI_MODEL=gpt-4.1-mini`
- `SENTINEL_OPENAI_TIMEOUT_MS=30000`
- `SENTINEL_OPENAI_MAX_COMPLETION_TOKENS=512`

### Azure OpenAI Provider

Required environment variables:

- `SENTINEL_OPENAI_LIVE_MODE=true`
- `AZURE_OPENAI_ENDPOINT=https://<resource>.openai.azure.com`
- `AZURE_OPENAI_DEPLOYMENT=<deployment-name>`
- `AZURE_OPENAI_API_KEY=...`

Optional environment variables:

- `AZURE_OPENAI_API_VERSION=2024-10-21`
- `SENTINEL_OPENAI_TIMEOUT_MS=30000`
- `SENTINEL_OPENAI_MAX_COMPLETION_TOKENS=512`

## Local Sentinel Gap Commands

Run these commands locally to discover and close remaining gaps:

1. `npm run check:openai-connection-readiness`
2. `npm run check:openai-faceplane`
3. `npm start`

If live mode is requested but not ready, readiness check exits non-zero and prints a machine-readable gap list.

## Live Smoke Test (Operator-Scoped)

Use a valid operator API key with `openai:execute` scope:

```bash
curl -X POST http://localhost:3000/faceplane/openai/execute \
  -H "Content-Type: application/json" \
  -H "x-api-key: <operator-key>" \
  -d '{
    "tenantId": "nunn-internal",
    "prompt": "Produce a governance-safe one-line executive status update.",
    "metadata": {
      "confidenceScore": 0.9,
      "impactRating": 1,
      "domainTier": 1,
      "verifiabilityScore": 0.9
    }
  }'
```

Expected outcomes:

- Low risk: `status=ok` with `response.stubbed=false` in live mode.
- High risk: `status=pending_review`, routed to operator escalation queue.

## Audit Guarantees

Each OpenAI faceplane execution appends an immutable hash-chained audit ledger entry including:

- `provider`
- `executionMode`
- `promptHash`
- `riskIndex`
- `escalationState`
- `timestamp`

This keeps Executive Desk reasoning observable without exposing prompt content.
