# SECURITY

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Security Posture
This repository is intended to evolve into a production-facing client system. Security must be treated as a first-class requirement from the start.

## Principles
- secure by default
- least privilege access
- auditable actions
- validated command execution
- continuous monitoring readiness

## Controls

### Implemented
- repository access restricted to authorized contributors
- no secrets committed to repository
- environment variables managed externally
- `/command` protected by `x-api-key` via `SENTINEL_API_KEY`
- `/v1/command` and `/v1/audit` protected by `x-api-key` via `SENTINEL_API_KEY`
- structured security events emitted for auth failures and command execution
- command audit entries captured for workflow execution review
- Microsoft Sentinel ingestion path documented for Container Apps logs
- request body size enforced (256 KB limit) to prevent DoS via body accumulation
- API key accepted only via `x-api-key` header or `Authorization: Bearer` — query string acceptance removed to prevent credential leakage in server logs and browser history
- security response headers set on all responses (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`)
- numeric fields in faceplane mock payloads validated with type and bounds checks
- `body.payload` fields guarded against non-object types before passing to audit logger
- `body.tenantId` type-validated before use in OpenAI route authorization

### Future Requirements
- role-based access control (RBAC)
- command signing and verification
- persistent audit logging integration
- vulnerability scanning
- dependency management
- Content-Security-Policy header
- rate limiting extended to all authenticated routes (currently covers `/command` and `/v1/command`)

## Reporting
Security issues should be reported directly to repository maintainers.

## Status
Security baseline hardened. Governance pass completed 2026-08-03. Further controls required before production deployment.
