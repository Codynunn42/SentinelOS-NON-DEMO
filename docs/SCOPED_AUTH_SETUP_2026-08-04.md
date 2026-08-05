# Scoped Auth Setup - 2026-08-04

## Objective

Establish a narrow, review-scoped authorization model for the GPT-to-Sentinel connection so the workflow can operate under explicit permissions without over-broad access.

## Recommended Scope Set

Use a dedicated scoped principal with the minimum permissions required for the current workflow:

- `openai:execute`
- `openai:read`
- `audit:read`
- `receipt:read`

This is sufficient for the current Executive Desk use case while preserving a bounded posture.

## Configuration Pattern

Set the following environment variable in the runtime environment:

```bash
SENTINEL_API_KEYS='[{"keyId":"key_execdesk_operator_001","secret":"<replace-with-secret>","tenant":"nunn-internal","actor":"sentinel.operator@nunn.local","role":"governance_operator","scopes":["openai:execute","openai:read","audit:read","receipt:read"],"status":"active","createdAt":"2026-08-04T00:00:00.000Z","expiresAt":"2026-12-31T23:59:59.000Z"}]'
```

## Governance Notes

- The scope set is intentionally narrow.
- The connection should not be granted broad platform or tenant-admin privileges.
- Any future expansion should require explicit review and updated scope documentation.

## Verification

After configuration, validate the setup with:

```bash
npm run check:key-registry
npm run check:openai-faceplane
```
