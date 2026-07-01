# The Executive Desk - Custom GPT Build Files

These files define the Custom GPT setup for The Executive Desk.

Important: if your GPT Builder does not show an `Actions` section, use the no-actions instructions and keep the OpenAPI schema parked for later.

## Files

- `the-executive-desk-no-actions-instructions.md` - paste into the GPT Instructions field when Actions are unavailable.
- `the-executive-desk-instructions.md` - paste into the GPT Instructions field only when Actions are available.
- `the-executive-desk-openapi.yaml` - import or paste into the GPT Actions schema field only when the builder exposes Actions.
- `integration-status-2026-06-30.md` - current evidence and blocker classification.

## GPT Settings

Name:

```text
The Executive Desk
```

Description:

```text
A governed executive operations desk for SentinelOS diagnostics, readiness review, and decision-surface preparation. Phase 1 is read-only and verifies the SentinelOS signing proxy only.
```

Authentication, only if Actions are available:

```text
None
```

## Phase 1 Test Prompts, Only If Actions Are Available

Use these in the GPT Builder Preview panel:

```text
Call getProxyHealth.
```

```text
Call getProxyStatus.
```

## Governance Boundary

This Phase 1 schema verifies only:

- GPT to Cloudflare tunnel reachability.
- Cloudflare tunnel to signing proxy reachability.
- Signing proxy health and configuration status.

It does not verify:

- Downstream Sentinel API command execution.
- RBAC.
- OTP.
- Receipt or audit generation.
- Broker ACK readiness.

External live claims remain disallowed until a governed downstream command returns valid evidence.

## If Actions Are Not Available

Create the GPT using `the-executive-desk-no-actions-instructions.md`.

In that mode, The Executive Desk can classify evidence and prepare decision surfaces, but it cannot directly call the Cloudflare URL or SentinelOS endpoints.

## Tunnel Note

The configured server URL is:

```text
https://beans-candles-tamil-dressed.trycloudflare.com
```

This URL works only while the local `cloudflared tunnel --url http://localhost:3001` process is running.
