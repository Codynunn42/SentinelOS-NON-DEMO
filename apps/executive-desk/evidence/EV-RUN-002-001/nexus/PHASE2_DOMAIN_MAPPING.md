# NEXUS Phase 2 — Domain Mapping Baseline
**Track:** 1 of 5 — Domain Mapping
**Evidence ID:** EV-RUN-002-001
**Baseline Timestamp:** 2026-08-02T12:10:00Z
**Owner:** Cody Nunn (Interim, Executive Desk)
**Approval Authority:** Executive Desk

---

## 1. Scope Boundary

| Item | Value |
|------|-------|
| System | SentinelOS-NON-DEMO |
| Integration Pack | NEXUS |
| Runtime Boundary | `127.0.0.1:3000` (local); `api.nunncorporation.com` (Cloudflare tunnel); `ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io` (Azure prod) |
| In-scope services | `apps/api/server.js` — Sentinel API |
| In-scope routes | `GET /health`, `POST /faceplane/openai/execute` |
| Out-of-scope | Demo environment, sovereign tier, external tenants |
| Branch | `codex/connect-sentinelos-to-gpt-tu45u8` |
| Repo | `Codynunn42/SentinelOS-NON-DEMO` |

---

## 2. Ownership Domains

| Domain | Owner | Role | Evidence Reference |
|--------|-------|------|--------------------|
| Executive Desk | Cody Nunn | Interim Executive Desk | `C2.2_DECISION_RECORD.md` |
| NEXUS Integration Pack | Executive Desk | Oversight authority | `OVERSIGHT_OPERATING_DIRECTIVE.md` |
| Sentinel API runtime | Executive Desk | Operational owner | `CAPABILITY_REGISTRY_v1.yaml` — NEXUS-OPS-001 |
| Evidence Traceability | Executive Desk | Governance owner | `CAPABILITY_REGISTRY_v1.yaml` — NEXUS-GOV-001 |
| Bridge Spec | Executive Desk | Spec owner | `SERVICE_BRIDGE_SPEC_v1.yaml` |
| API Catalog | Executive Desk | Catalog owner | `API_CATALOG_v1.yaml` |

---

## 3. System Relationships

| From | To | Relationship | Protocol | Auth |
|------|----|--------------|----------|------|
| Executive Desk | Sentinel API | Governance oversight | HTTP | `x-api-key: SENTINEL_API_KEY` |
| Sentinel API | Faceplane (OpenAI) | Workflow execution | Internal | `gaasTier: internal_governance_lab` |
| Sentinel API | Audit log | Chain-of-custody | Internal | `auditLogEnabled: true` |
| Sentinel API | Drift tracker | Risk monitoring | Internal | `driftTrackingEnabled: true` |
| Cloudflare tunnel | Sentinel API | Public ingress | HTTPS→HTTP | Tunnel |
| Azure Container App | Sentinel API | Prod runtime | HTTPS | Container identity |
| NEXUS pack | Sentinel API | Capability consumption | HTTP | `x-api-key` |

---

## 4. Control Ownership

| Control | Owner | Gate Verified | Evidence |
|---------|-------|---------------|----------|
| fail-closed enforcement | Sentinel API / Executive Desk | C2.3 | `C2.3_DECISION_RECORD.md` |
| Idempotency | Sentinel API | C2.3 | `C2.3_DECISION_RECORD.md` |
| Auth policy (x-api-key) | Executive Desk | C2.3 | `SERVICE_BRIDGE_SPEC_v1.yaml` |
| Registry governance linkage | Executive Desk | C2.2, C2.3 | `CAPABILITY_REGISTRY_v1.yaml` |
| Health/readiness contracts | Sentinel API | C2.3, C2.4 | `API_CATALOG_v1.yaml` |
| Audit chain-of-custody | Sentinel API | C2.4 | `auditEntry.hash` in bridge response |
| Drift tracking | Sentinel API | C2.4 | `driftTrackingEnabled: true` |
| Evidence retention | Executive Desk | C2.2 | `OVERSIGHT_OPERATING_DIRECTIVE.md` |
| Constitutional compliance | Executive Desk | All gates | `C_GATE_CONSTITUTION_MAPPING.md` |

---

## 5. Inheritance Rule for Remaining Phase 2 Tracks

All Phase 2 templates (Security, Runtime, Workflow, AI Knowledge) inherit:
- Scope boundary as defined in Section 1 above
- Ownership model as defined in Section 2 above
- Control ownership as defined in Section 4 above
- Constitutional attestation requirement: strengthen institutions, preserve investment, improve governance clarity, maintain evidence continuity

Any deviation from inherited scope or ownership requires an explicit override record filed under `EV-RUN-002-001/nexus/`.

---

## Status
Domain mapping baseline: **COMPLETE**
Next track: Security (identity/access model, threat boundaries, evidence requirements, review cadence)
