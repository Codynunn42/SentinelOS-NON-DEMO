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

## Initial Controls
- repository access restricted to authorized contributors
- no secrets committed to repository
- environment variables managed externally
- `/command` protected by `x-api-key` via `SENTINEL_API_KEY`
- `/v1/command` and `/v1/audit` protected by `x-api-key` via `SENTINEL_API_KEY`
- structured security events emitted for auth failures and command execution
- command audit entries captured for workflow execution review
- Microsoft Sentinel ingestion path documented for Container Apps logs

## Future Requirements
- role-based access control (RBAC)
- command signing and verification
- persistent audit logging integration
- vulnerability scanning
- dependency management

## Reporting
Security issues should be reported directly to repository maintainers.

## Status
Security baseline established. Further controls required before production deployment.
