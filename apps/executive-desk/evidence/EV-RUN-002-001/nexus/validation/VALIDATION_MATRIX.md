# Validation Matrix — NEXUS Capability Adoption
Owner: Cody Nunn (Interim, role: Executive Desk)

| Domain | Test | Method | Pass Criteria | Evidence Artifact |
|---|---|---|---|---|
| API | Contract conformance | Schema validation | 100% required fields valid | `api-contract-test.json` |
| Bridge | Retry/idempotency | Fault injection | No duplicate side effects | `bridge-fault-test.log` |
| Security | AuthZ enforcement | Negative tests | Unauthorized calls denied | `security-negative-tests.md` |
| Runtime | Health/readiness | Endpoint + dependency checks | Stable healthy state | `runtime-health-snapshot.txt` |
| Governance | Traceability | Lineage audit | Capability → owner → evidence linked | `governance-lineage.csv` |
| AI | Knowledge retrieval fidelity | Prompt suite | Accurate citations and mapping | `ai-retrieval-eval.md` |
