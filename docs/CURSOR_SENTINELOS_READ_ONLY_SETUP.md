# Cursor connection to SentinelOS — read-only proposal

Prepared for Freddie Neale, COO, Nunn Applied Systems. This config is for a
local Cursor MCP process. It does not enable Microsoft Entra sign-in to
SentinelOS: the process authenticates to the existing API with a separately
scoped SentinelOS API key.

**No Azure configuration or credential was changed or created.** This is a
proposed setup pending confirmation of the tenant and authorization for an
Azure Container App configuration update.

## What Cursor can read

The local MCP server in `tools/sentinel-cursor-mcp.mjs` exposes only:

- Service health.
- Governance readiness for one configured tenant.
- OpenAI faceplane plug-in status for that tenant.
- Aggregate audit metrics for that tenant (no individual audit payloads).
- Up to 25 workflow-run summaries for that tenant.
- One sanitized workflow-run summary by run ID.

Every API call is `GET`. There are no tools for approval, workflow execution,
receipt retrieval, deployment, or writes. The caller cannot select or override
the tenant; the server pins it from local configuration and the API key must
have the same tenant.

## Proposed key (not provisioned)

Create a new key record only after confirming the tenant ID and authorizing the
Azure app configuration change:

```json
{
  "keyId": "key_sentinel_cursor_freddie_ro_20261022",
  "secret": "<generate a unique high-entropy secret; do not commit it>",
  "tenant": "<confirmed tenant ID>",
  "actor": "<Freddie's verified Entra UPN>",
  "role": "viewer",
  "scopes": ["audit:read", "task:read", "openai:read"],
  "status": "active",
  "createdAt": "<actual creation timestamp>",
  "expiresAt": "2026-11-21T00:00:00.000Z"
}
```

The narrow scopes omit `approval:read`, `approval:review`, `receipt:read`,
`task:execute`, `task:orchestrate`, `openai:execute`, `platform:admin`, and
`tenant:admin`. Do not reuse or disclose the shared legacy API key. The actor
string is audit attribution, not proof that Entra authenticated the request;
anyone holding this API key can act as that configured actor.

The deployment process must preserve the existing legacy key record while
adding this scoped principal, then roll out and verify the new revision. The
repo's key registry automatically keeps the legacy key active when its env
value is configured, even if a scoped `SENTINEL_API_KEYS` list is added.
Treat the rollout as a deployment change; it is not authorized by this draft.

## Configure Freddie's Cursor

To inspect how workflows and plug-ins are implemented in source, Freddie also
needs read access to the GitHub repository and must open a local clone in
Cursor. The MCP connection below is for live, tenant-scoped runtime summaries;
it does not provide source-code access.

1. After the key and tenant are securely provisioned, copy
   `.env.cursor.example` to `.env.cursor` at the repository root.
2. Set `SENTINELOS_TENANT_ID` to the confirmed tenant ID and
   `SENTINELOS_API_KEY` to the new scoped key. `.env.cursor` is git-ignored.
3. Open the repository in Cursor. The checked-in `.cursor/mcp.json` starts the
   local MCP server. Review its six advertised tools under Cursor's MCP
   settings before enabling them.
4. Confirm the tool list contains only the read-only tools above. Test health
   first, then governance and plug-in status. A 403 indicates missing scope or
   a tenant mismatch; do not broaden privileges as a workaround.
5. Rotate or revoke the key when it expires or access is no longer needed.

Do not put the key in prompts, source files, commits, screenshots, or chat.
Cursor MCP and API behavior should be independently reviewed before any
broader production use. GOV-006 remains Verification / technical HOLD;
GOV-001 remains Conditional; GOV-002 remains HOLD.
