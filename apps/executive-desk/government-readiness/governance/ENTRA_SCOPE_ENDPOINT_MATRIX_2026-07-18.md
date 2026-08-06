# Entra Scope-to-Endpoint Matrix

Program: Nunn Corporation 2030  
Date: 2026-07-18  
Status: Execution baseline (v1) with middleware implemented

## Purpose

Define the first concrete least-privilege map between Microsoft Entra delegated scopes and Executive Desk API surfaces.

This matrix is the execution bridge from a broad user_impersonation model to granular scope governance.

## Token Model (Required)

For protected API calls, backend validation must enforce:

1. iss (expected tenant/authority)
2. aud (matches API audience)
3. signature (valid issuer keys)
4. exp/nbf (token valid time window)
5. scp (required scope present)

## Scope Definitions (Initial)

1. Executive.Read

- Read executive posture, status, and non-mutating operational data.

1. Governance.Approve

- Execute or approve governed actions that alter governance state or approval logs.

1. Infrastructure.Manage

- Run infrastructure-affecting operational actions and managed scan controls.

1. Vault.Read

- Read evidence, receipts, exports, and audit bundles.

## Endpoint Mapping (v1 Baseline)

Audience required for all rows:

- api://a9f534fe-9f3b-42db-a03f-f7bdd958f601

| Endpoint | Method | Current Control | Required Scope (Target) | Notes |
|---|---|---|---|---|
| /api/executive/receipts | GET | Principal header + auth middleware | Vault.Read | Receipt list is evidence data.
| /api/executive/receipts/:id | GET | Principal header + auth middleware | Vault.Read | Single receipt access.
| /api/executive/receipts/export | GET | Principal header + auth middleware | Vault.Read | Export is high-sensitivity evidence path.
| /api/executive/receipts/stats | GET | Principal header + auth middleware | Executive.Read or Vault.Read | Executive metrics; may include audit-sensitive content.
| /api/executive/delegations | GET | Principal header + auth middleware | Executive.Read | Governance visibility, read-only.
| /api/executive/delegations/:id | GET | Principal header + auth middleware | Executive.Read | Delegation detail visibility.
| /api/executive/risk/status | GET | Principal header + auth middleware | Executive.Read | Executive risk posture.
| /api/executive/risk/factors | GET | Principal header + auth middleware | Executive.Read | Time-series risk factors.
| /api/executive/closeout/state | GET | Principal header + auth middleware | Executive.Read | Read personal/team closeout posture.
| /api/executive/closeout/state | PUT | Principal header + auth middleware | Governance.Approve | Mutates closeout state.
| /api/executive/closeout/mob-runs | GET | Principal header + auth middleware | Executive.Read | Read run history and summaries.
| /api/executive/closeout/mob-runs | POST | Principal header + auth middleware | Governance.Approve | Writes completion/failure records.
| /api/executive/closeout/mob-runs/export | GET | Principal header + auth middleware | Vault.Read | Export path for run evidence.
| /api/executive/closeout/export-bundle | GET | Principal header + auth middleware | Vault.Read | Bundle includes evidence + summaries.
| /api/executive/sentinel-ai/status | GET | Principal header + auth middleware | Executive.Read | Read hosted scan posture.
| /api/executive/sentinel-ai/scan | POST | Principal header + auth middleware | Infrastructure.Manage | Operational scan trigger.
| /proxy/command | POST | Proxy bearer auth + rate limit | Governance.Approve | Governed command execution surface.

## Endpoints Requiring Hardening Before Scope Enforcement

| Endpoint | Method | Risk | Required Change |
|---|---|---|---|
| /api/executive/connect/status | GET | Currently outside protected router | Move behind token auth and scope check.
| /api/executive/connect/signin | POST | Credential entry surface | Move behind explicit trust boundary and add scope restriction.

## Recommended Scope Validation Rules

1. Read-only default:

- GET endpoints require Executive.Read unless data is evidence export class, then Vault.Read.

1. Mutation default:

- PUT/POST on governance-state resources require Governance.Approve.

1. Operational control default:

- Infrastructure-facing scan/action endpoints require Infrastructure.Manage.

1. Evidence export default:

- Any export or audit bundle endpoint requires Vault.Read.

## Execution Next Steps

1. Scope-check middleware implemented in `api/express-adapter.ts` behind `ENTRA_SCOPE_ENFORCEMENT`.
2. Route-level scope requirements applied per endpoint in `api/express-adapter.ts`.
3. OpenAPI security sections updated with scope requirements in `openapi.yaml`.
4. Route tests added for missing-scope and wrong-scope cases in `api/__tests__/routes.test.ts`.
5. Keep `user_impersonation` as temporary fallback only during transition window via `ENTRA_ALLOW_USER_IMPERSONATION_FALLBACK`.

## Exit Criteria for This Work Item

1. Scope map approved by Governance and Platform audiences.
2. Route-level scope checks implemented on all protected endpoints.
3. Negative tests passing for scope denial.
4. Workbook status moved to Complete with evidence links.
