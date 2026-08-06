# Azure Sentinel API Connectivity Verified

Date: 2026-07-18

## Milestone

Hosted Sentinel API connectivity is verified over HTTPS from the Executive Desk environment.

## Evidence

- Hosted health endpoint response: status ok
- Service identity: sentinel-api
- Runtime mode: non-demo
- Tier profile: PUBLIC (Sentinel Public)
- Sovereign flag: false
- Database: enabled

## Integration Validation

- Executive Desk remote probe configured with hosted base URL
- Executive Desk remote probe reachable true
- Executive Desk remote probe status code 200
- Remote payload reflects hosted sentinel-api health response

## Notes

- Hosted routes discovered in public proof UI:
  - GET /api/authority/status
  - POST /api/control/execute
- Generic defaults used by the Executive Desk connector (/scan and /auth/signin) are not present on this deployment and currently return 404 when called directly.
- Connector now supports API-key header auth via SENTINEL_AI_API_KEY plus SENTINEL_AI_API_KEY_HEADER (default x-api-key), and bearer token auth via SENTINEL_AI_BEARER_TOKEN.

## Next Validation Gate

Validate one authenticated functional API call using the real API key against POST /api/control/execute, then record request and response evidence for reproducibility before load and faceplane stress testing.

## Auth Validation Attempt

- Execute call attempt from this shell returned `KEY_LEN=0`, which indicates no API key was present in the active command environment.
- Functional call still succeeded: `POST /api/control/execute` returned HTTP 200 with a governed `blocked` decision payload (`approval_required`).

## Auth Enforcement Check

- No key: `POST /api/control/execute` returned HTTP 200.
- Fake key (`x-api-key: definitely-invalid-key`): `POST /api/control/execute` returned HTTP 200.
- Conclusion: current hosted route behavior is functional and governed, but API-key enforcement is not currently active on this endpoint.

## Security Follow-up

- Treat authenticated endpoint validation as **partially complete**: functional-path verified, auth-enforcement not yet verified.
- Next: enable or confirm upstream API key/JWT enforcement (gateway or app middleware), then rerun no-key/fake-key/real-key triad and require non-200 for no-key/fake-key.

## Repeatable Validator

- Command: `node scripts/check-hosted-auth-enforcement.js`
- Optional strict mode: `REQUIRE_AUTH_ENFORCEMENT=true node scripts/check-hosted-auth-enforcement.js`

Latest observed output:

- No Credentials: HTTP 200
- Invalid Credentials: HTTP 200
- Valid Credentials: not evaluated in this run (`SENTINEL_AI_API_KEY` not present in command environment)
- Observed matrix: `{"noCredentials":200,"invalidCredentials":200,"validCredentials":null}`
