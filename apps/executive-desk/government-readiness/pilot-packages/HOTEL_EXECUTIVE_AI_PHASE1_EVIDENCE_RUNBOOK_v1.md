# Hotel Executive AI Pilot - Phase 1 Evidence Runbook (v1)

Date: 2026-07-21  
Owner: Nunn Corporation  
Scope: Connectivity-only verification for GPT Actions + Entra OAuth + API JSON response path

## 1. Objective

Produce a repeatable evidence packet that proves end-to-end connectivity for the hotel pilot without enabling operational mutation.

Phase 1 pass is strictly:

1. OpenAPI import succeeds.
2. OAuth sign-in succeeds.
3. Access token is issued.
4. Protected endpoint call succeeds.
5. Structured JSON response returns to GPT.

## 2. In-Scope Endpoint Contract

Safe endpoints only:

- GET /health
- GET /ready
- GET /version
- GET /whoami
- GET /status

No write or state-change endpoints are in scope.

## 3. Security Rules for Evidence Collection

Do not capture or share:

- Client secrets
- Access tokens
- Authorization codes
- Refresh tokens
- OTP values
- Private keys

All request and response logs must be redacted before sharing externally.

## 4. Preflight

### 4.1 Required Inputs

- Tenant value used in auth URL (`common`, tenant domain, or tenant GUID)
- Exact GPT callback URL from GPT Builder
- Action endpoint base URL
- Confirmed test principal

### 4.2 Local Runtime Readiness

From repository root:

```bash
pnpm run start:executive-desk:local-sentinel
```

Expected startup signal:

- API server listening on `http://0.0.0.0:3000`

## 5. Connectivity Verification Commands

Run in a second terminal after server startup.

### 5.1 Status Probe

```bash
pnpm run scan:executive-desk:sentinel-status
```

Expected result:

- JSON response with:
  - `remote.configured: true`
  - `remote.reachable: true`
  - `statusCode: 200`

### 5.2 Connectivity Scan Probe

```bash
pnpm run scan:executive-desk:sentinel-oauth-fix
```

Expected result:

- Valid JSON envelope returned with `data.generatedAt`
- `remote.configured: true`
- `remote.reachable: true`

### 5.3 Optional Direct Curl (explicit focus string)

```bash
curl -sS -X POST http://127.0.0.1:3000/api/executive/sentinel-ai/scan \
  -H 'content-type: application/json' \
  -H 'X-Principal-Id: founder@nunncorp.example' \
  -d '{"focus":"pilot connectivity mode verification"}'
```

## 6. GPT Builder Test Evidence Capture

For each tested action, record:

- Failure stage (`before sign-in`, `after sign-in`, `token exchange`, `API call`)
- Action name
- Full redacted request payload
- HTTP status code
- Full redacted response body

Minimum evidence set:

1. Successful OAuth sign-in screen completion
2. Successful protected endpoint call
3. JSON response body showing expected fields

## 7. Pass/Fail Decision Matrix

Pass when all are true:

- OpenAPI imported without schema errors
- OAuth callback URI matches exactly
- Token exchange succeeds
- Protected API returns HTTP 200
- Response payload is structured JSON

Fail when any are true:

- OAuth callback mismatch
- Tenant URL segment blank or incorrect
- Token exchange returns 4xx/5xx
- Protected endpoint returns 401/403 unexpectedly
- Response is non-JSON or malformed JSON

## 8. Failure Triage Guide

- 401 usually means token/auth failure (missing/invalid/expired token, audience/issuer mismatch, or exchange failure).
- 403 usually means authorization/policy failure (missing scope/role, policy block, or step-up requirements).

## 9. Evidence Packet Output

Store packet under a dated path, for example:

- `docs/executive-desk/evidence/hotel-pilot-phase1-YYYY-MM-DD.md`

Include:

- Test date/time
- Environment
- Principal used
- Endpoint(s) tested
- Request/response excerpts (redacted)
- Final pass/fail
- Remediation actions if failed

## 10. Exit Criteria

If pass:

- Mark Phase 1 complete
- Proceed to Phase 2 planning (read-only executive insights)

If fail:

- Log blocker category (`OAuth config`, `callback mismatch`, `scope/audience`, `API contract`)
- Apply remediation
- Re-run runbook from Section 4
