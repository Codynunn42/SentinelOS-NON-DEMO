# SentinelOS GPT Action Connector

SentinelOS can be connected to a configured GPT through the existing OpenAI faceplane. The GPT should call SentinelOS as an action, while SentinelOS remains the governed execution boundary for tenant scope, policy checks, risk scoring, escalation, and audit logging.

## Action schema endpoint

Use this public OpenAPI schema URL when configuring the GPT action:

```text
GET /faceplane/openai/gpt-actions/openapi.json
```

The schema advertises both SentinelOS connection checks and the governed OpenAI faceplane routes:

- `GET /faceplane/openai/gpt-actions/connection` verifies that the GPT can reach SentinelOS, Sentinel authority state, and the OpenAI faceplane in one governed call.
- `GET /health` checks whether the SentinelOS API process is alive.
- `GET /ready` checks whether SentinelOS governance readiness checks are passing.
- `GET /faceplane/openai/status` checks whether the SentinelOS OpenAI faceplane is active for a tenant.
- `GET /faceplane/openai/config?tenantId=nunn-internal` reads tenant-scoped faceplane configuration.
- `POST /faceplane/openai/execute` submits a GPT task through SentinelOS governance.

## Authentication

The GPT action must send a SentinelOS API key in the `x-api-key` header. The key needs these scopes:

- `openai:read` for status and configuration reads.
- `openai:execute` for governed task execution.

Tenant policy is still enforced by SentinelOS. A non-platform key can only act within its own tenant.

## Minimum GPT action request

```json
{
  "tenantId": "nunn-internal",
  "prompt": "Draft a neutral internal governance note for this workflow.",
  "metadata": {
    "confidenceScore": 0.92,
    "impactRating": 1,
    "domainTier": 1,
    "verifiabilityScore": 0.9
  }
}
```

Low-risk requests return `200` with a governed response. Higher-risk requests return `202` and an operator escalation case instead of model content.

## Recommended setup steps

1. Deploy SentinelOS with `SENTINEL_PUBLIC_BASE_URL` set to the public HTTPS origin.
2. Create or select a SentinelOS API key scoped to `openai:read` and `openai:execute` for the target tenant.
3. Add a GPT action using `https://<sentinel-host>/faceplane/openai/gpt-actions/openapi.json`.
4. Configure action authentication to pass the SentinelOS API key as `x-api-key`.
5. Test the GPT with `getSentinelGPTConnectionStatus` first, then the status action, before enabling execution.

This keeps the GPT connected to SentinelOS without letting the GPT bypass SentinelOS governance.
