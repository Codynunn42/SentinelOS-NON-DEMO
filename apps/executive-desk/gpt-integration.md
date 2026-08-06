# Executive Desk GPT Integration (Production/Public)

This guide defines how to configure the GPT safely for SentinelOS.

## Board-Level Entry Point

Mission first. Technology second.

Before configuring GPT action surfaces, leadership and governance reviewers should start with the Phase 6 board package:

- `government-readiness/BOARD_INDEX.md`
- `government-readiness/governance/GBP_PHASE_6_OPERATIONAL_DOCTRINE.md`

This keeps GPT integration decisions aligned with mission package governance, ORL posture, and certification evidence boundaries.

It follows the staged rollout:

1. Stage 1: public concierge (no backend actions)
2. Stage 2: concierge with assessment funnel handoff
3. Stage 3: governed backend actions for approved read-only workflows

## Current Implementation Reality

As of v1 now:

- The only supported governed command is `repo.control.workflow.diagnose`.
- It is executed via `POST /proxy/command`.
- The proxy flow is: Authority Check -> Risk Gate -> Receipt.
- The canonical action schema is in `apps/executive-desk/openapi.yaml`.

Do not use older mutating-command examples for production GPT configuration.

## Decision: Do You Need an API?

- For Stage 1 and Stage 2 concierge: no API required.
- For Stage 3 governed execution: yes, you need a public HTTPS endpoint for `/proxy/command`.

## Stage 1 / Stage 2: Concierge GPT (No Actions)

Configure a GPT that only:

- explains Executive Desk capabilities at a high level,
- helps visitors define desired outcomes,
- routes them to Executive Assessment,
- avoids customer-specific operational execution.

### Recommended GPT Instruction Baseline

Use language equivalent to:

- role: Executive Desk Concierge for Nunn Corporation
- objective: qualify outcome goals and invite Executive Assessment
- constraints:
  - do not claim privileged access to customer systems
  - do not execute commands
  - do not collect sensitive secrets
  - do not provide legal/compliance guarantees
- handoff:
  - always propose an Executive Assessment next step
  - provide concise problem -> outcome framing

## Stage 3: Governed Action GPT (API Connected)

When you are ready for controlled execution, connect Actions to SentinelOS.

### Required Components

1. Public HTTPS domain exposing `POST /proxy/command`
2. Action schema from `apps/executive-desk/openapi.yaml`
3. Authentication on proxy endpoint (recommended mandatory in production)
4. Monitoring/audit for proxy calls and receipt IDs

### Builder Steps

1. Open GPT Builder.
2. Configure identity, description, and strict system instructions.
3. In Actions, import schema from `apps/executive-desk/openapi.yaml`.
4. Replace `servers.url` with your production proxy URL.
5. Configure authentication in GPT Builder to match your gateway.
6. Test with a safe payload for `repo.control.workflow.diagnose`.
7. Verify response includes receipt and auditReference.

## Production Security Requirements

Before enabling public action use:

- enforce auth at gateway and/or proxy,
- keep command allowlist strict (read-only command only),
- rate limit by principal and IP,
- log every request with request ID and audit reference,
- block sensitive payload fields from logging.

## Microsoft Entra ID Configuration Model (SPA + Protected API)

For Executive Desk web clients and governed API calls, use a two-application model:

1. Frontend application registration (SPA/Web App)
2. Backend protected API registration

### Environment Variables

- `NEXT_PUBLIC_AZURE_CLIENT_ID`
  - Frontend Application (Client) ID.
  - Identifies which app initiated sign-in.
- `NEXT_PUBLIC_AZURE_API_AUDIENCE`
  - Protected API identifier URI (for example `api://<api-app-id>`).
  - Must match the `aud` claim expected by API validation.
- `NEXT_PUBLIC_AZURE_API_SCOPE`
  - Delegated permission requested by the frontend (for example `api://<api-app-id>/user_impersonation`).
  - Must map to an exposed API scope and be validated in backend authorization.

### Why Audience and Scope Are Both Required

- Audience answers: which API is this token for?
- Scope answers: what permission is being requested on that API?

Both must be validated by backend policy together with issuer, signature, and expiry.

### MSAL Request Shape

```typescript
const loginRequest = {
  scopes: [process.env.NEXT_PUBLIC_AZURE_API_SCOPE!],
};
```

### Backend Validation Minimum

For each bearer token on protected API routes, validate:

1. `iss` is expected tenant/authority issuer.
2. `aud` matches `NEXT_PUBLIC_AZURE_API_AUDIENCE`.
3. signature is valid for issuer keys.
4. token is not expired.
5. `scp` includes required scope(s).

### Execution Next Step: Granular Scope Model

Current delegated scope can remain `user_impersonation` for transition, but target model should move to domain scopes that map to Executive OS capabilities.

Recommended initial scope set:

- `Executive.Read`
- `Executive.Write`
- `Governance.Review`
- `Governance.Approve`
- `Infrastructure.Manage`
- `Vault.Read`
- `Vault.Write`

Role/scopes principle:

- RBAC roles express who a principal is.
- OAuth scopes express what a client app requests to do.

Keep both enforced to preserve least-privilege posture as services scale.

## Example Safe Test Payload

```json
{
  "tenant": "nunncloud",
  "command": "repo.control.workflow.diagnose",
  "payload": {
    "principalId": "user@example.com",
    "repository": "Codynunn42/SentinelOS-NON-DEMO",
    "workflowName": "Sentinel Actions Diagnostic",
    "runId": "12345"
  }
}
```

## Expected Success Markers

- `status` is `executed` or `blocked` (never raw server errors in normal flow)
- `executionMode` is `read_only_diagnosis`
- `authorityCheckResult` is present
- `riskGateOutcome` is present
- `receipt.id` is present
- `auditReference` is present

## Recommended Public Rollout Order

1. launch Stage 1 concierge GPT without actions
2. run website + assessment funnel with real traffic
3. enable Stage 3 actions for read-only command only
4. evaluate logs and receipts for 1-2 weeks
5. decide if broader command scope is needed

## Operator Notes

- `apps/executive-desk/openapi.yaml` is the schema source of truth.
- Keep this guide synchronized when endpoint capabilities change.
