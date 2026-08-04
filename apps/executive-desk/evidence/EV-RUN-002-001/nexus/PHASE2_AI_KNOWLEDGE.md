# NEXUS Phase 2 — AI Knowledge Baseline
**Track:** 5 of 5 — AI Knowledge
**Evidence ID:** EV-RUN-002-001
**Baseline Timestamp:** 2026-08-02T12:30:00Z
**Owner:** Cody Nunn (Interim, Executive Desk)
**Approval Authority:** Executive Desk
**Inherits:** PHASE2_DOMAIN_MAPPING.md, PHASE2_SECURITY.md, PHASE2_RUNTIME.md, PHASE2_WORKFLOW.md

---

## 1. Approved Knowledge Sources

| Source | Category | Governance |
|--------|----------|------------|
| C2.1_DECISION_RECORD.md | Runtime readiness | Must remain on disk |
| C2.2_DECISION_RECORD.md | Governance oversight | Must remain on disk |
| C2.3_DECISION_RECORD.md | Control verification | Must remain on disk |
| C2.4_DECISION_RECORD.md | Implementation verification | Must remain on disk |
| PHASE2_DOMAIN_MAPPING.md | Scope boundaries | Baseline reference |
| PHASE2_SECURITY.md | Security posture | Baseline reference |
| PHASE2_RUNTIME.md | Runtime topology | Baseline reference |
| PHASE2_WORKFLOW.md | Workflow controls | Baseline reference |
| SERVICE_BRIDGE_SPEC_v1.yaml | Bridge contract | Spec authority |
| API_CATALOG_v1.yaml | API contract | Catalog authority |
| CAPABILITY_REGISTRY_v1.yaml | Capability registry | Registry authority |

---

## 2. Retrieval Boundaries

| Knowledge Type | Allowed | Boundary |
|----------------|---------|----------|
| Internal evidence docs | Yes | apps/executive-desk/evidence/EV-RUN-002-001/nexus/ |
| Runtime logs | Yes | /tmp/sentinel-api.log and bridge responses — must be timestamped |
| Repo source files | Yes | Must reflect current branch |
| External web content | No | Not approved for NEXUS evidence synthesis |
| Unverified user prompts | No | Must be validated before use |
| Draft speculation | No | Must be marked as unverified |

**Boundary rule:** AI knowledge must be derived from retained artifacts or current repo state only.

---

## 3. Update Governance

| Change Type | Owner | Review Rule | Evidence Required |
|-------------|-------|-------------|------------------|
| New knowledge artifact | Executive Desk | Review against current NEXUS scope | Link to source artifact |
| Update to existing baseline | Executive Desk | Re-run relevant gate or checkpoint | Updated file + timestamp |
| Change in runtime topology | Executive Desk | Revalidate runtime baseline | GET /health + deployment evidence |
| Change in security posture | Executive Desk | Revalidate security baseline | Auth or threat evidence |

---

## 4. Validation Criteria

| Criterion | Required Check |
|-----------|----------------|
| Traceability | Each knowledge claim links to a retained artifact |
| Freshness | Baselines are timestamped and current |
| Governance fit | Knowledge does not contradict C2.1–C2.4 evidence |
| Scope fit | Knowledge stays within the NEXUS scope boundary |
| Evidence quality | Claims are derivable from records, not speculation |
| Access control | Knowledge updates do not expose secrets or credentials |

---

## 5. Open Items

| ID | Item | Risk | Owner | Resolution |
|----|------|------|-------|------------|
| AIK-001 | No formal AI knowledge index yet | Medium | Executive Desk | Add ARTIFACT_INDEX.md cross-reference |
| AIK-002 | No drift review cadence for knowledge updates | Medium | Executive Desk | Add monthly review trigger |
| AIK-003 | No explicit retention policy for knowledge snapshots | Low | Executive Desk | Add retention note to evidence package |

---

## Constitutional Attestation
This baseline strengthens institutional capability, preserves existing investment value, improves governance clarity, and maintains auditable evidence continuity.

## Status
AI Knowledge baseline: COMPLETE
Phase 2 complete: all five tracks retained.
