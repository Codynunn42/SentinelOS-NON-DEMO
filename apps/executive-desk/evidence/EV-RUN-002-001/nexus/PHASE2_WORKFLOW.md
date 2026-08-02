# NEXUS Phase 2 — Workflow Baseline
**Track:** 4 of 5 — Workflow
**Evidence ID:** EV-RUN-002-001
**Baseline Timestamp:** 2026-08-02T12:25:00Z
**Owner:** Cody Nunn (Interim, Executive Desk)
**Approval Authority:** Executive Desk
**Inherits:** PHASE2_DOMAIN_MAPPING.md, PHASE2_SECURITY.md, PHASE2_RUNTIME.md

---

## 1. Approval Flows

| Step | Actor | Action | Required Evidence | Decision Gate |
|------|-------|--------|-------------------|---------------|
| 1 | Executive Desk | Launch verification run | NEXUS gate checklist | C2.1–C2.4 |
| 2 | Executive Desk | Review runtime evidence | GET /health, bridge response | Proceed / block |
| 3 | Executive Desk | Review governance evidence | C2.2 decision record | Proceed / block |
| 4 | Executive Desk | Review control evidence | C2.3 checkpoint report | Proceed / block |
| 5 | Executive Desk | Review implementation evidence | C2.4 checkpoint report | Close gate / reopen |

**Decision rule:** Any failed control or missing evidence causes workflow pause until corrected.

---

## 2. Human Decision Points

| Decision Point | Trigger | Human Owner | Required Output |
|----------------|---------|-------------|-----------------|
| Runtime restore | Health probe fails | Executive Desk | Restart command + incident note |
| Auth failure | Invalid or missing x-api-key | Executive Desk | Key validation log / rotation note |
| Drift alert | driftTrackingEnabled false or mismatch | Executive Desk | Escalation record |
| Governance exception | Missing evidence or owner gap | Executive Desk | Exception memo + remediation action |
| Release readiness | All C-gates PASS | Executive Desk | Phase 2 signoff |

---

## 3. Evidence Retention Points

| Workflow Stage | Retention Point | Artifact |
|----------------|-----------------|----------|
| Verification start | Before execution | C-gate checklist / run command |
| Runtime health check | After each run | /health output record |
| Bridge execution | After each run | Bridge response JSON |
| Governance review | After each gate | Decision record markdown |
| Control review | After each gate | Checkpoint report markdown |
| Implementation review | After each gate | Checkpoint report + decision record |
| Final signoff | End of workflow | Phase 2 baseline bundle |

**Retention expectation:** Each phase gate must retain an artifact that can be independently reviewed later.

---

## 4. Evidence Continuity Controls

| Control | Implementation | Evidence |
|---------|---------------|----------|
| Timestamped decisions | Every decision record includes UTC timestamp | C2.1–C2.4 decision records |
| Reviewer attribution | Each record includes reviewer or owner | C2.2 decision record |
| Triage trail | Failures go to incident/evidence log | incident/ directory |
| Immutable anchors | SHA256 anchors where available | C2.4 decision record |
| Reproducibility | Scripts and commands retained | nexus/scripts/ |

---

## 5. Open Items

| ID | Item | Risk | Owner | Resolution |
|----|------|------|-------|------------|
| WF-001 | No formal approval checklist file yet | Medium | Executive Desk | NEXUS_APPROVAL_CHECKLIST.md — created this session |
| WF-002 | No designated signoff reviewer beyond Executive Desk | Medium | Executive Desk | Name one reviewer for final gate pack |
| WF-003 | Incident evidence log path not fully standardized | Low | Executive Desk | Standardize under evidence/EV-RUN-002-001/incident/ |

---

## Constitutional Attestation
This baseline strengthens institutional capability, preserves existing investment value, improves governance clarity, and maintains auditable evidence continuity.

## Status
Workflow baseline: COMPLETE
