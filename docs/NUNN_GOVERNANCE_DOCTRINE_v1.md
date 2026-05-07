# Nunn Governance Doctrine v1

Approval badge: `[HOLD:REVIEW]`

Document status: Internal doctrine draft. Not canonical until enforcement mapping is approved.

## Faceplane Activation Policy

1. All faceplanes are multi-tenant by design.
2. Initial activation must be restricted to an internal tenant.
3. No external tenant activation is permitted without:
   - 30 or more days of validation-window evidence
   - Drift telemetry stability
   - Escalation integrity verification
   - RBAC boundary validation
   - Audit export verification
4. All new tenant activations require a Nunn Governance Approval entry.

## internal_governance_lab Tier

The `internal_governance_lab` tier is the controlled validation tier for new faceplanes.

It permits:

- Verbose governance logging
- Aggressive escalation sensitivity
- Always-on drift tracking
- Logged threshold experimentation
- Replay visibility

It does not permit:

- Production SLA claims
- External tenant activation
- Direct model invocation outside the governance wrapper
- Tenant-level threshold changes without Nunn Governance Approval

## Enforcement Mapping

| Doctrine Claim | Enforcement / Evidence Location | Verification | Approval Status |
| --- | --- | --- | --- |
| Faceplanes are multi-tenant by design. | `apps/sentinel/src/faceplanes/openai/openaiFaceplaneConfig.js`, `apps/api/server.js` faceplane routes | `npm run check:openai-faceplane` | `[APPROVE:CONDITIONAL]` |
| Initial activation must be restricted to an internal tenant. | `internal_governance_lab` tier, faceplane config, route tenant resolution | `npm run check:openai-faceplane` | `[APPROVE:CONDITIONAL]` |
| External tenant activation requires validation-window evidence. | `docs/SENTINEL_GOVERNANCE_COMPLIANCE_APPROVAL_REPORT_2026-05-04.md`, future validation reports | Pending validation-window report | `[HOLD:REVIEW]` |
| Drift telemetry stability is required before external activation. | `apps/sentinel/src/governance/core/*`, `scripts/check-governance-drift-monitor.js`, `scripts/check-drift-governance-core.js` | `npm run check:governance-drift`, `npm run check:governance-drift-core` | `[APPROVE:CONDITIONAL]` |
| Escalation integrity verification is required. | `apps/sentinel/src/governance/vendorOnboarding/operatorEscalation.js`, `scripts/check-operator-escalation.js` | `npm run check:operator-escalation` | `[APPROVE:CONDITIONAL]` |
| RBAC boundary validation is required. | `apps/sentinel/src/security/keyRegistry.js`, `apps/sentinel/src/governance/policyEngine.js`, `docs/GOVERNANCE_PREFLIGHT.md` | `npm run check:keys`, `npm run check:policy`, `npm run check:approvals` | `[APPROVE:CONDITIONAL]` |
| Audit export verification is required. | `apps/sentinel/src/audit/auditLogger.js`, `apps/api/server.js`, `docs/GOVERNANCE_PREFLIGHT.md` | audit route checks and future export check | `[HOLD:REVIEW]` |
| New tenant activations require Nunn Governance Approval. | Approval notice pattern in `docs/SENTINEL_APPROVAL_NOTICE_2026-05-04.md` | future tenant activation approval notice | `[HOLD:REVIEW]` |

## Next Steps To Reach Approval

1. Add a validation-window evidence report template.
2. Add an audit export verification check.
3. Add a tenant activation approval notice template.
4. Re-run governance, key, approval, drift, and faceplane checks.
5. Update this badge from `[HOLD:REVIEW]` to `[APPROVE:CONDITIONAL]` only after the missing evidence paths exist.
