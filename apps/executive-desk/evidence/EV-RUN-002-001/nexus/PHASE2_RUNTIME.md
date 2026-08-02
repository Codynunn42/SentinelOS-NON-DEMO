# NEXUS Phase 2 — Runtime Baseline
**Track:** 3 of 5 — Runtime
**Evidence ID:** EV-RUN-002-001
**Baseline Timestamp:** 2026-08-02T12:20:00Z
**Owner:** Cody Nunn (Interim, Executive Desk)
**Approval Authority:** Executive Desk
**Inherits:** PHASE2_DOMAIN_MAPPING.md, PHASE2_SECURITY.md

---

## 1. Deployment Topology

| Environment | Host | Port | Process | Start Command | Persistence |
|-------------|------|------|---------|---------------|-------------|
| Local dev | `127.0.0.1` | 3000 | `node apps/api/server.js` | `nohup env PORT=3000 node apps/api/server.js >/tmp/sentinel-api.log 2>&1 &` | PID in `/tmp/sentinel-api.pid` |
| Public (tunnel) | `api.nunncorporation.com` | 443 | Cloudflare tunnel | Cloudflare dashboard | Managed |
| Azure prod | `ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io` | 443 | Azure Container App | Azure deployment | Managed |

**Single codebase:** `apps/api/server.js` — `PORT = process.env.PORT || 3000`
**Mode flag:** `non-demo` confirmed in `/health` response.

---

## 2. Health Checks

| Check | Route | Method | Expected Response | Cadence | Owner |
|-------|-------|--------|-------------------|---------|-------|
| Liveness | `GET /health` | curl / load balancer | `{"status":"ok","service":"sentinel-api","mode":"non-demo"}` | Continuous (prod), on-demand (local) | Sentinel API |
| Bridge readiness | `POST /faceplane/openai/execute` | NEXUS verification script | `workflowId` + `auditEntry.hash` present | Each C-gate run | Executive Desk |
| Process listener | `lsof -nP -iTCP:3000 -sTCP:LISTEN` | Local only | `node <PID> codynunn 16u IPv6 *:3000 (LISTEN)` | On startup | Executive Desk |

---

## 3. Operational Controls

| Control | Implementation | Verified | Evidence |
|---------|---------------|----------|----------|
| Fail-closed | Request rejected without valid `x-api-key` | C2.3 | `NEXUS_C2_3_CHECKPOINT_REPORT.md` |
| Idempotency | Workflow executions stable across repeated calls | C2.3 | `NEXUS_C2_3_CHECKPOINT_REPORT.md` |
| Audit logging | `auditLogEnabled: true` in every bridge response | C2.4 | `C2.4_CHECKPOINT_REPORT.md` |
| Drift tracking | `driftTrackingEnabled: true` in every bridge response | C2.4 | `C2.4_CHECKPOINT_REPORT.md` |
| Risk indexing | `riskIndex` computed per request; `escalationRequired` flag present | C2.4 | Bridge response |
| Hash chaining | `previousHash` → `hash` chain in `auditEntry` | C2.1, C2.4 | Bridge response |
| Log retention | `nohup` stdout → `/tmp/sentinel-api.log` | Local only | Operational |

---

## 4. Rollback & Recovery Paths

| Scenario | Detection | Recovery Action | RTO Target | Evidence Record |
|----------|-----------|-----------------|------------|-----------------|
| API process down | `GET /health` fails (curl error 7) | `nohup env PORT=3000 node apps/api/server.js >/tmp/sentinel-api.log 2>&1 &` | < 2 min | Incident log: `incident/SENTINELAI_TOOLING_INCIDENT_2026-08-02_043143.log` |
| Port 3000 conflict | `lsof -nP -iTCP:3000` shows unexpected PID | `kill <PID>` then restart | < 5 min | Manual |
| `.env` missing | API starts but `SENTINEL_API_KEY` unset → auth failures | Restore `.env` from secure store | < 10 min | SEC-003 ops runbook (pending) |
| Azure prod unhealthy | Azure health probe fails | Azure Container App restart policy | Managed | Azure portal |
| Cloudflare tunnel down | `api.nunncorporation.com` unreachable | Restart tunnel via Cloudflare dashboard | Managed | Cloudflare dashboard |
| Corrupt audit chain | `previousHash` mismatch detected | Escalate to Executive Desk; freeze bridge | Immediate | Escalation via bridge `escalationRequired` flag |

---

## 5. Open Items

| ID | Item | Risk | Owner | Resolution |
|----|------|------|-------|------------|
| RUN-001 | No process supervisor (systemd/pm2) on local dev | Medium — manual restart on crash | Executive Desk | Add pm2 or launchd for persistent local dev |
| RUN-002 | `/tmp/sentinel-api.log` not rotated | Low — disk fill over time | Executive Desk | Add logrotate or size cap |
| RUN-003 | SEC-003 ops runbook for key restore not yet written | Medium | Executive Desk | Phase 3 item |

---

## Constitutional Attestation
This baseline strengthens institutional capability, preserves existing investment value, improves governance clarity, and maintains auditable evidence continuity.

## Status
Runtime baseline: **COMPLETE**
Open items: 3 (RUN-001 through RUN-003)
Next track: Workflow (approval flows, human decision points, evidence retention points)
