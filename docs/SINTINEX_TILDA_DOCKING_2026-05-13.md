# SINTENIX TILDA Docking - 2026-05-13

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Status

```txt
[APPROVED:DOCKED-OBSERVE-ROUTE-ONLY]
```

SINTENIX is docked to SentinelOS as a TILDA-managed intake and archive-connection lane.

Accepted aliases:

- `SINTENIX`
- `SINTINEX`
- `SENTINEX`
- `SINTENX`

## Purpose

SINTENIX receives incoming information that should not automatically alter the active SentinelOS lane.

It is meant to hold:

- future-facing ideas
- Managed Results concepts
- productive drift
- archive references
- deferred public-sector or roadmap material

It is not an execution surface.

## Operating Model

```txt
incoming information
-> SINTINEX intake
-> archive/current/deferred connection
-> TILDA interpretation
-> lane decision
-> human review or active context reference
```

## Lane Decisions

| Lane | Meaning | Execution |
| --- | --- | --- |
| `sintinex_idea_ledger` | Future-facing idea or productive drift. | No execution. Hold outside active scope. |
| `archive_reference` | Historical evidence reference. | No execution. Link to lineage only. |
| `active_context` | References current Phase 1.1 truth. | No execution from SINTINEX; active work still goes through SentinelOS policy. |
| `deferred_review` | Held/deferred material such as public-sector draft work. | No execution or publication without approval. |
| `sintinex_review` | Unclassified incoming information. | Human review required. |

## Archive Connection

SINTENIX connects incoming information to the current artifact decision layer:

- current truth: `docs/EXECUTIVE_SNAPSHOT_2026-05-12.md`
- current approval: `docs/PHASE1_APPROVAL_BOARD_2026-05-12.md`
- decision register: `docs/SENTINEL_ARTIFACT_DECISION_REGISTER_2026-05-13.md`
- ingestion ledger: `docs/SINTENIX_INGESTION_LEDGER_2026-05-13.md`
- historical lineage: daily briefs, prior snapshots, prior repo scans
- deferred draft lane: Arizona SPO modernization brief

Archive means preserved in place as institutional memory. It does not mean moved, deleted, merged, or promoted.

## TILDA Boundary

SINTENIX is managed through TILDA:

```txt
apps/sentinel/src/learning/tilda.js
-> routeSintinexIntake()
-> apps/sentinel/src/sintinex/intake.js
```

TILDA may explain and route. It may not override SentinelOS policy.

## Code

- `apps/sentinel/src/sintinex/intake.js`
- `apps/sentinel/src/learning/tilda.js`
- `scripts/check-sintinex-tilda-docking.js`
- `docs/SINTENIX_INGESTION_LEDGER_2026-05-13.md`

## Validation

```sh
npm run check:sintinex
```

Expected behavior:

- Managed Results routes to `sintinex_idea_ledger`.
- SentinelOS/SINTENIX boundary notes route to `sintenix_archival_cognition`.
- Historical daily brief references route to `archive_reference`.
- Phase 1.1 references route to `active_context`.
- Arizona SPO/public-sector draft references route to `deferred_review`.
- All SINTINEX outputs set `activeExecutionAllowed: false`.

## Current Decision

SINTENIX is clicked into place as an intake and memory-routing layer only.

Do not expand it into execution, automation, publication, or active product scope until the owner explicitly approves that next boundary.
