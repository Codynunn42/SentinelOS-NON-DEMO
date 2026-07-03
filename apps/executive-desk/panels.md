# Executive Desk — Panel Specs (v1)

This file lists the minimal fields and interactions for the four v1 panels.

1) Daily Briefing
- Fields: `id`, `title`, `summary`, `severity`, `source`, `timestamp`, `recommendedAction` (optional)
- Interactions: mark as read, pin, create decision (transforms to Decision item)

API expectations:
- GET `/api/executive/briefing` → list of `BriefingItem`
- POST `/api/executive/briefing/ack` → acknowledge item

2) Controlled Access / Authority Status
- Fields: `principalId`, `displayName`, `role`, `scope`, `grantedBy`, `grantedAt`, `expiresAt`, `status` (active/expired/revoked)
- Interactions: view delegation chain, request escalation, attach attestation

API expectations:
- GET `/api/executive/authority?scope=...` → AuthorityRecord[]
- POST `/api/executive/authority/check` {principalId, action, resource} → {allowed:boolean, requiredApprovers:[]}

3) Risk + Infrastructure Readiness
- Fields: `id`, `score` (0-100), `summary`, `issues`[], `infraStatus` (ok/degraded/down), `timestamp`
- Interactions: view issues, request mitigation, run readiness probe

API expectations:
- GET `/api/executive/risk?scope=...` → RiskSnapshot
- POST `/api/executive/risk/probe` → updated RiskSnapshot

4) Receipt Ledger
- Fields: `id`, `command`, `executor`, `decisionContext`, `authorityChecks`[], `riskOutcome`, `status` (issued/executed/failed), `timestamp`
- Interactions: export receipt, view history, verify signature

API expectations:
- GET `/api/executive/receipts` → Receipt[]
- POST `/api/executive/receipts` {receipt} → 201 Created

Minimal UX flows

- Execute Command (happy path): user selects recommendedAction in Briefing → system runs Authority Check → Risk Gate returns pass → system records Receipt (issued & executed) → UI shows success + receipt entry.
- Blocked Execution: Risk Gate returns block → UI shows mitigation recommendations; command is not executed; Receipt is recorded with `status=failed` and `riskOutcome=block`.

Security guidance

- POST endpoints that create receipts or trigger commands MUST require an attestation token and include the executing principal id.
- Receipt store should be append-only and support signature verification.
