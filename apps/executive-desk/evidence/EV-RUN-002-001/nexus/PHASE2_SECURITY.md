# NEXUS Phase 2 — Security Baseline
**Track:** 2 of 5 — Security
**Evidence ID:** EV-RUN-002-001
**Baseline Timestamp:** 2026-08-02T12:15:00Z
**Owner:** Cody Nunn (Interim, Executive Desk)
**Approval Authority:** Executive Desk
**Inherits:** PHASE2_DOMAIN_MAPPING.md (scope, ownership, control ownership)

---

## 1. Identity & Access Model

| Principal | Access Method | Scope | Credential Source |
|-----------|--------------|-------|-------------------|
| Executive Desk (human) | `x-api-key` header | All routes | `.env` → `SENTINEL_API_KEY` |
| NEXUS automated verification | `x-api-key` header | `/health`, `/faceplane/openai/execute` | `.env` → `SENTINEL_API_KEY` |
| Cloudflare tunnel | TLS termination | Public ingress only | Tunnel certificate |
| Azure Container App | Container identity | Prod runtime | Azure managed identity |
| Anonymous / unauthenticated | Permitted | `GET /health` only | None required |

**Auth enforcement:** `x-api-key` required on all routes except `GET /health`.
**Fail-closed:** Requests without valid key rejected. Verified: C2.3 control 3, C2.4 control 3.

---

## 2. Threat Boundaries

| Boundary | Threat | Mitigation | Status |
|----------|--------|------------|--------|
| Public internet → Cloudflare | Unauthorized access | TLS + Cloudflare WAF | Active |
| Cloudflare → localhost:3000 | Tunnel bypass | Tunnel bound to localhost only | Active |
| API key exposure | Credential leak | Key stored in `.env`, not committed | Required — verify `.gitignore` |
| Bridge prompt injection | Malicious prompt | `promptHash` logged; stub mode active | Advisory — stubbed-openai-v1 |
| Audit log tampering | Chain-of-custody break | `previousHash` chain; `driftTrackingEnabled` | Active |
| Escalation suppression | Risk index manipulation | `escalationRequired` flag in bridge response | Active |
| Unauthenticated route exposure | `/health` data leak | `tier`, `mode`, `sovereign` exposed — review sensitivity | Open — low risk |

---

## 3. Evidence Requirements

| Control | Evidence Required | Retention Location | Review Trigger |
|---------|------------------|--------------------|----------------|
| Auth policy enforcement | Bridge response with `auditEntry.hash` | `nexus/` decision records | Each C-gate run |
| Key rotation | `.env` change log or secret manager rotation record | Outside NEXUS scope — flag for ops | Quarterly or on breach |
| Audit chain integrity | `previousHash` value in consecutive bridge calls | Bridge response logs | On drift alert |
| Fail-closed verification | C2.3 checkpoint report | `docs/NEXUS_C2_3_CHECKPOINT_REPORT.md` | Each C2.3 run |
| Threat boundary review | This document + change record | `PHASE2_SECURITY.md` | On scope change |

---

## 4. Review Cadence

| Review Type | Frequency | Owner | Trigger |
|-------------|-----------|-------|---------|
| Auth policy review | Quarterly | Executive Desk | Calendar or on key rotation |
| Threat boundary review | On scope change | Executive Desk | New route, new principal, new environment |
| Audit chain spot-check | Monthly | Executive Desk Automated | Scheduled or on `riskIndex > 0.7` |
| Full security baseline review | Each major NEXUS version | Cody Nunn (Interim) | Version gate |
| Incident-triggered review | Immediate | Executive Desk | Any auth failure, escalation, or drift alert |

---

## 5. Open Items

| ID | Item | Risk | Owner | Resolution |
|----|------|------|-------|------------|
| SEC-001 | `.env` not confirmed in `.gitignore` | High — key exposure | Executive Desk | Verify before next push |
| SEC-002 | `GET /health` exposes `tier`, `mode`, `sovereign` fields | Low | Executive Desk | Assess sensitivity; mask if needed |
| SEC-003 | API key rotation process not documented | Medium | Executive Desk | Document in ops runbook |
| SEC-004 | `stubbed-openai-v1` in prod path | Medium — not real AI governance | Executive Desk | Track against NEXUS Phase 3 |

---

## Constitutional Attestation
This baseline strengthens institutional capability, preserves existing investment value, improves governance clarity, and maintains auditable evidence continuity.

## Status
Security baseline: **COMPLETE**
Open items: 4 (SEC-001 through SEC-004)
Next track: Runtime (deployment topology, health checks, operational controls, rollback/recovery)
