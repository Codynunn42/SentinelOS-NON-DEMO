# Recall Identity Registry Template - 2026-05-25

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** recall identity registry template  
**Posture:** registry scaffold, no retrieval activation  
**Selected Action:** `recall_identity_registry_template`  
**Authority Created:** false

## Artifact Decision

`[KEEP:RECALL-IDENTITY-REGISTRY-TEMPLATE-2026-05-25]`

This template defines how recall identities should be recorded during memory-layer reconstruction.

It does not authorize memory activation, persistent storage deployment, runtime retrieval, serverless deployment, runtime mutation, publication, tool grants, tenant activation, or memory-derived approval.

## Registry Purpose

The recall identity registry records deterministic memory references so Sentinel AI, SentinelOS, Tilda, and the operator can reason about memory lineage without treating memory as authority.

## Registry Schema

| Field | Required | Notes |
| --- | --- | --- |
| `recall_id` | yes | deterministic address |
| `title` | yes | human-readable name |
| `memory_class` | yes | governance, snapshot, audit, operational, archive, identity, orchestration, public-safe |
| `scope` | yes | system, sentinel-core, ownerfi, contract-reclamation, repo, runtime, public |
| `source_artifact` | yes | file, receipt, snapshot, packet, log, external reference |
| `source_status` | yes | current, historical, draft, held, approved, superseded, stale |
| `lineage_ref` | yes | source chain |
| `freshness_state` | yes | current, fresh, aging, stale, unknown |
| `sensitivity` | yes | public, internal, private, tenant-sensitive, secret-adjacent |
| `authority_state` | yes | informational, evidence, review-only, approval-required, blocked |
| `reconciliation_required` | yes | true/false plus reason |
| `operator_review_required` | yes | true/false plus trigger |
| `allowed_use` | yes | what this recall can support |
| `prohibited_use` | yes | what this recall cannot support |

## Initial Registry Entries

| recall_id | title | memory_class | scope | source_status | authority_state |
| --- | --- | --- | --- | --- | --- |
| `rid:gov:sentinel-core:memory-architecture-standard:2026-05-25:held` | Memory Architecture Standard | governance | sentinel-core | held_draft | informational_only |
| `rid:arch:sentinel-core:archive-intelligence-docking:2026-05-13:observe` | Archive Intelligence Docking | archive | sentinel-core | approved_observe_route_only | evidence_review_only |
| `rid:orch:sentinel-core:tilda-template-orchestration:2026-05-20:bounded` | Tilda Template Orchestration | orchestration | sentinel-core | current_review_artifact | review_only |
| `rid:snap:sentinel-core:snapshot-federation-refinement:2026-05-24:lineage` | Snapshot Federation Refinement | snapshot | sentinel-core | complete_current_pass | evidence_only |
| `rid:snap:sentinel-core:snapshot-lineage-model:2026-05-24:lineage` | Snapshot Lineage Model | snapshot | sentinel-core | complete_current_pass | evidence_only |
| `rid:gov:sentinel-core:constitutional-memory-model:2026-05-24:model` | Constitutional Memory Model | governance | sentinel-core | complete_current_pass | review_only |
| `rid:gov:sentinel-core:authority-bound-memory-rules:2026-05-25:rules` | Authority-Bound Memory Governance Rules | governance | sentinel-core | complete_current_pass | review_only |

## Entry Template

```yaml
recall_registry_entry:
  recall_id:
  title:
  memory_class:
  scope:
  source_artifact:
  source_status:
  lineage_ref: []
  freshness_state:
  sensitivity:
  authority_state:
  reconciliation_required:
    required:
    reason:
  operator_review_required:
    required:
    trigger:
  allowed_use: []
  prohibited_use: []
```

## Registry Rules

1. Registry entry does not activate retrieval.
2. Registry entry does not approve memory use.
3. Registry entry does not verify current truth.
4. Registry entry must preserve source and status.
5. Registry entry must include authority state.
6. Registry entry must include prohibited use.
7. Registry entry must fail closed if source or scope is ambiguous.

## Gate Result

```yaml
recall_identity_registry_template:
  status: COMPLETE_CURRENT_PASS
  registry_schema_defined: true
  initial_registry_entries_defined: true
  retrieval_activation: false
  memory_activation_authority: false
  runtime_mutation_authority: false
  deployment_authority: false
  publication_authority: false
  authority_created: false
```

## Next Selected Action

```yaml
selected_action: memory_decay_governance_packet
deliverable: docs/MEMORY_DECAY_GOVERNANCE_PACKET_2026-05-25.md
authority_created: false
```
