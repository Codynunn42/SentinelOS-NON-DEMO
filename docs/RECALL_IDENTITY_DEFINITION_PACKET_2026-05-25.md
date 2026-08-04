# Recall Identity Definition Packet - 2026-05-25

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** deterministic recall identity definition  
**Posture:** identity before retrieval  
**Selected Action:** `recall_identity_definition_packet`  
**Authority Created:** false

## Artifact Decision

`[KEEP:RECALL-IDENTITY-DEFINITION-PACKET-2026-05-25]`

This packet defines deterministic recall identity for Sentinel memory-layer reconstruction.

It does not authorize memory activation, persistent storage deployment, runtime retrieval, serverless deployment, cryptographic key creation, runtime mutation, publication, tool grants, tenant activation, autonomous execution, or memory-derived approval.

## Purpose

Recall identity gives SentinelOS a stable way to address memory artifacts, memory classes, sources, lineage chains, and reconciliation states.

Recall identity is:

```txt
addressing + classification + lineage reference
```

Recall identity is not:

```txt
truth + approval + authority
```

## Core Invariant

```txt
recall_id != current_truth
recall_id != authority
recall_id != approval
```

## Recall ID Format

Recommended canonical shape:

```txt
rid:{memory_class}:{scope}:{source_slug}:{date_or_version}:{short_hash}
```

Example:

```txt
rid:governance:sentinel-core:memory-architecture-standard:2026-05-25:a13f9c
```

## Recall Identity Fields

Every recall identity must carry:

| Field | Purpose | Required |
| --- | --- | --- |
| `recall_id` | deterministic address | yes |
| `memory_class` | governance, snapshot, audit, operational, archive, identity, orchestration, public-safe | yes |
| `scope` | tenant, actor, repo, runtime, workflow, system, public, private | yes |
| `source_artifact` | file, receipt, snapshot, log, packet, external reference | yes |
| `source_status` | current, historical, draft, held, approved, superseded, stale | yes |
| `lineage_ref` | parent/source chain | yes |
| `freshness_state` | current, fresh, aging, stale, unknown | yes |
| `sensitivity` | public, internal, private, tenant-sensitive, secret-adjacent | yes |
| `authority_state` | informational, evidence, review-only, approval-required, blocked | yes |
| `reconciliation_required` | true/false plus reason | yes |
| `operator_review_required` | true/false plus trigger | yes |

## Memory Class Prefixes

| Prefix | Memory Class |
| --- | --- |
| `gov` | Governance Memory |
| `snap` | Snapshot Memory |
| `aud` | Audit Memory |
| `ops` | Operational Memory |
| `arch` | Archive Memory |
| `id` | Identity Memory |
| `orch` | Orchestration Memory |
| `pub` | Public-Safe Memory |

Optional compact format:

```txt
rid:{prefix}:{scope}:{source_slug}:{version}:{hash}
```

## Recall Scope Rules

| Scope | Meaning | Boundary |
| --- | --- | --- |
| `system` | SentinelOS-wide non-tenant doctrine | no tenant-specific claims |
| `sentinel-core` | core governance/runtime artifacts | no domain pollution |
| `ownerfi` | OwnerFi proof surface context | cannot generalize to all tenants |
| `contract-reclamation` | sibling faceplane context | cannot become SentinelOS core |
| `repo` | repository governance state | requires current verification if drift-prone |
| `runtime` | live runtime posture | requires freshness before external or operational use |
| `public` | buyer-safe/public materials | requires publication review |

## Recall Legitimacy States

| State | Meaning | Operational Use |
| --- | --- | --- |
| `current` | verified current for scoped use | usable within scope |
| `fresh` | recently verified but may need rerun for external use | usable with caution |
| `historical` | accurate as record, not current truth | lineage only |
| `draft` | unapproved or not promoted | review only |
| `held` | intentionally not active | cannot activate |
| `stale` | may be outdated | refresh required |
| `conflicted` | conflicts with other evidence | reconciliation required |
| `blocked` | cannot be used safely | fail closed |

## Recall ID Envelope

```yaml
recall_identity:
  recall_id: rid:gov:sentinel-core:memory-architecture-standard:2026-05-25:a13f9c
  memory_class: governance
  scope: sentinel-core
  source_artifact: docs/governance/MEMORY_ARCHITECTURE_STANDARD.md
  source_status: held_draft
  lineage_ref:
    - docs/SENTINEL_MEMORY_LAYER_PRIOR_ARTIFACT_RECALL_2026-05-24.md
    - docs/MEMORY_LAYER_RECONSTRUCTION_OPENING_PACKET_2026-05-24.md
  freshness_state: historical_review_current
  sensitivity: internal
  authority_state: informational_only
  reconciliation_required: true
  reconciliation_reason: recalled_standard_is_held_draft_not_activation_authority
  operator_review_required: true
  operator_review_trigger: any_memory_activation_or_runtime_use
```

## Recall Identity Rules

1. A recall ID points to a source; it does not verify the source.
2. A recall ID preserves lineage; it does not merge authority.
3. A recall ID can be stable while the recalled truth decays.
4. A recall ID must carry scope to prevent context bleed.
5. A recall ID must carry authority state to prevent memory-authority collapse.
6. A recall ID must carry freshness state to prevent stale truth promotion.
7. A recall ID must be reviewed before execution-sensitive use.

## Invalid Recall Patterns

| Pattern | Reason |
| --- | --- |
| ID without source artifact | lineage broken |
| ID without scope | context bleed risk |
| ID without freshness state | stale truth risk |
| ID without authority state | authority compression risk |
| cross-tenant ID reuse | tenant boundary violation |
| public-safe ID from private memory | publication boundary violation |
| operational ID from historical snapshot | current truth violation |

## Gate Result

```yaml
recall_identity_definition_packet:
  status: COMPLETE_CURRENT_PASS
  deterministic_recall_addressing_defined: true
  recall_identity_fields_defined: true
  recall_scope_rules_defined: true
  recall_legitimacy_states_defined: true
  recall_id_is_current_truth: false
  recall_id_is_authority: false
  memory_activation_authority: false
  runtime_mutation_authority: false
  deployment_authority: false
  publication_authority: false
  authority_created: false
```

## Next Selected Action

```yaml
selected_action: recall_identity_registry_template
deliverable: docs/RECALL_IDENTITY_REGISTRY_TEMPLATE_2026-05-25.md
authority_created: false
```
