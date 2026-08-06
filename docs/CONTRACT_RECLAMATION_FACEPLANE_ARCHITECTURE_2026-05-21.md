# Contract Reclamation Faceplane Architecture - 2026-05-21

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[KEEP:CONTRACT-RECLAMATION-FACEPLANE-ARCHITECTURE-2026-05-21]
```

## Boundary

This artifact defines Contract Reclamation as a governed domain faceplane collection adjacent to SentinelOS, not as core SentinelOS infrastructure.

It does not authorize legal advice, legal judgment, autonomous legal interpretation, contract enforcement claims, deployment, runtime mutation, command execution, live query execution, secret access, publication, pilot activation, repository push, tool grants, or production activation.

## Architectural Separation

```txt
Faceplanes = domain intelligence
SentinelOS = governance + execution control
```

Contract Reclamation should not become the governance core.

SentinelOS remains responsible for:

- governance preflight
- approvals
- authority state
- audit
- escalation
- workflow access
- execution control

Contract Reclamation is responsible for:

- contract-state reconstruction
- evidence organization
- obligation mapping
- authority-chain reconstruction
- amendment comparison
- renewal-risk visibility
- execution-status intelligence

## Repository Shape

```txt
contract-reclamation/
├── faceplanes/
│   ├── contract-intake/
│   ├── obligation-mapper/
│   ├── authority-reconstruction/
│   ├── amendment-diff/
│   ├── renewal-risk/
│   ├── execution-status/
│   └── evidence-timeline/
│
├── governance/
│   ├── audit/
│   ├── receipts/
│   ├── signals/
│   └── approvals/
│
├── ingestion/
│   ├── pdf/
│   ├── ocr/
│   ├── extraction/
│   └── normalization/
│
├── runtime/
│   ├── workflows/
│   ├── orchestration/
│   └── state-engine/
│
└── docs/
```

## Current Repo Implementation

The first in-repo prototype now lives alongside the existing Operational Upgrade lane without renaming or merging it.

```txt
apps/sentinel/src/faceplanes/contractReclamationPlane.js
apps/sentinel/src/commands/contractReclamation.js
apps/api/public/contract-reclamation.html
docs/CONTRACT_RECLAMATION_POSITIONING.md
docs/CONTRACT_RECLAMATION_FACEPLANE.md
```

Command route:

```txt
contract.reclamation.assess
```

## Faceplane Definitions

| Faceplane | Capability | Boundary |
| --- | --- | --- |
| `contract-intake` | upload, identify, and classify contract artifacts | no legal conclusion |
| `obligation-mapper` | extract payment terms, dates, renewals, SLAs, signatures, and duties | extraction only |
| `authority-reconstruction` | map signer, approver, delegation, and authority chain evidence | evidence intelligence only |
| `amendment-diff` | compare clause and obligation changes over time | no legal interpretation |
| `renewal-risk` | identify timing, auto-renewal, missed-exit, and notice-window risks | risk signal only |
| `execution-status` | map what has happened against known obligations and approvals | operational status only |
| `evidence-timeline` | build chronological truth from contracts, emails, approvals, signatures, amendments, and execution events | reconstruction only |

## First Build Target

Build `evidence-timeline` first.

Reason:

```txt
chronology enables contract-state reconstruction
contract-state reconstruction enables obligation mapping
obligation mapping enables authority and amendment analysis
authority and amendment analysis enable execution-status review
```

## Evidence Timeline Minimum Model

```yaml
evidence_timeline_event:
  event_id: ""
  source_type: contract | amendment | email | approval | signature | payment | execution_event | note
  source_ref: ""
  occurred_at: ""
  captured_at: ""
  parties: []
  related_obligations: []
  authority_refs: []
  extracted_facts: []
  confidence: low | medium | high
  review_status: unreviewed | reviewed | disputed | superseded
  legal_judgment_made: false
```

## SentinelOS Integration Boundary

Contract Reclamation may emit governed signals into SentinelOS:

- `contract.evidence.timeline.created`
- `contract.obligation.candidate_detected`
- `contract.authority.chain_candidate_detected`
- `contract.renewal.risk_detected`
- `contract.execution.status_changed`

Those signals are evidence inputs only.

They must not create:

- execution authority
- legal conclusion
- approval authority
- autonomous enforcement
- deployment or runtime mutation authority

## Product Positioning

Correct positioning:

```txt
governed operational memory for contracts
contract-state reconstruction
operational governance
evidence intelligence
execution readiness
```

Avoid:

```txt
legal advice
legal certainty
contract recovery
automated legal interpretation
autonomous enforcement
```

## Current Recommendation

Create the Contract Reclamation repository as a sibling project, not inside SentinelOS core.

Use SentinelOS integration only through governed signals, audit receipts, approvals, and execution-control boundaries.

## Non-Authorization Clause

This architecture packet defines review-only product and repo structure. It does not authorize legal advice, legal judgment, autonomous legal interpretation, contract enforcement claims, deployment, runtime mutation, command execution, live query execution, secret access, publication, pilot activation, repository push, tool grants, production activation, or destructive cleanup.
