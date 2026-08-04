# Recall Authority Scope Rules - 2026-05-25

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** protected recall governance  
**Posture:** bounded recall visibility before operational use  
**Selected Action:** `recall_authority_scope_rules`  
**Authority Created:** false

## Artifact Decision

```txt
[KEEP:RECALL-AUTHORITY-SCOPE-RULES-2026-05-25]
```

## Purpose

Define the authority scopes required to request visibility into SentinelOS memory classes.

Recall authority scope rules do not activate memory retrieval. They define the governance gates that must exist before any future recall runtime can expose memory contents, metadata, lineage, or reconciliation state.

## Core Invariants

```txt
recall_request != recall_grant
visibility_scope != execution_scope
operator_role != universal_memory_access
executive_scope != automatic_publication_authority
governance_visibility != mutation_authority
sealed_memory_requires_explicit_legitimacy_review
```

## Non-Authorization Boundary

This packet does not authorize:

- retrieval runtime activation,
- memory content exposure,
- persistent memory storage,
- tool access,
- secret access,
- key creation,
- deployment,
- publication,
- execution,
- tenant activation,
- or runtime mutation.

It defines review rules only.

## Recall Authority Scopes

| Scope | Default Access | May Request | Must Not Do |
| --- | --- | --- | --- |
| `observer` | metadata-only status | public operational metadata | view protected content or operationalize recall |
| `operator` | scoped operational recall request | `PUBLIC_OPERATIONAL`, limited `INTERNAL_GOVERNANCE` | access sealed, core, tenant-private, or cryptographic content by default |
| `governance` | reconciliation visibility | `INTERNAL_GOVERNANCE`, lineage metadata, decay state | execute, approve, publish, or mutate from memory |
| `executive` | constitutional visibility request | `EXECUTIVE_CONFIDENTIAL`, selected `CONSTITUTIONAL_CORE` | bypass reconciliation or publication approval |
| `runtime_kernel` | isolated runtime-zone recall | `ISOLATED_RUNTIME` only within zone | export memory to general context |
| `archival_reconciliation` | historical verification | `CRYPTOGRAPHIC_ARCHIVE` metadata and lineage | promote historical memory to current truth without review |

## Visibility Class To Scope Matrix

| Visibility Class | Minimum Scope | Additional Gate |
| --- | --- | --- |
| `PUBLIC_OPERATIONAL` | `operator` | freshness and purpose check |
| `INTERNAL_GOVERNANCE` | `governance` | role, tenant, and reconciliation check |
| `EXECUTIVE_CONFIDENTIAL` | `executive` | explicit executive purpose check |
| `CONSTITUTIONAL_CORE` | `executive` plus `governance` | constitutional review gate |
| `SEALED_MEMORY` | explicit operator approval plus relevant scope | sealed legitimacy review |
| `CRYPTOGRAPHIC_ARCHIVE` | `archival_reconciliation` | lineage and decay validation |
| `ISOLATED_RUNTIME` | `runtime_kernel` | zone identity and export block |

## Recall Request Envelope

Future recall requests should be evaluated through a structured envelope before any memory is visible.

```yaml
recall_authority_request:
  request_id: "rar_20260525_001"
  actor_id: "operator_or_runtime_identity"
  requested_scope: "governance"
  requested_visibility_class: "INTERNAL_GOVERNANCE"
  recall_id: "rid:governance:sentinel:authority_bound_memory_rules:2026-05-25:pendinghash"
  purpose: "reconciliation_review"
  tenant_scope: "sentinel_internal"
  external_use_intent: false
  execution_adjacent_use: false
  requested_output: "metadata_only | summary | bounded_excerpt | full_content"
  freshness_required: true
  reconciliation_required: true
  operator_review_required: true
```

## Decision States

| State | Meaning | Allowed Output |
| --- | --- | --- |
| `DENY` | request lacks scope, purpose, or legitimacy | no memory output |
| `METADATA_ONLY` | existence and status may be shown | class, state, source pointer |
| `BOUNDED_SUMMARY` | constrained summary may be shown | non-sensitive summary |
| `RECONCILIATION_VIEW` | governance review may inspect bounded evidence | lineage, decay, conflicts |
| `SEALED_REVIEW` | explicit review gate required | no content until approved |
| `KERNEL_LOCAL_ONLY` | isolated runtime use only | no export |
| `BLOCKED` | unsafe, conflicted, stale, or unauthorized | no memory output |

## Gate Checks

Every recall request must pass:

1. actor identity check,
2. role/scope check,
3. tenant boundary check,
4. visibility class check,
5. purpose limitation check,
6. freshness and decay check,
7. cryptographic lineage check when present,
8. reconciliation check,
9. external-use and publication check,
10. execution-adjacency check.

## Fail-Closed Conditions

Recall must fail closed when:

- requested scope is absent,
- requested purpose is vague,
- actor identity is ambiguous,
- tenant boundary is unclear,
- memory class is sealed without explicit approval,
- constitutional core is requested without governance and executive review,
- cryptographic archive is requested as operational truth,
- isolated runtime memory is requested for export,
- memory is stale, conflicted, superseded, held, or blocked,
- external use is requested without publication/share approval,
- recall would create approval, execution, or mutation authority.

## Output Restrictions

| Requested Output | Default Posture |
| --- | --- |
| metadata | allowed only after classification check |
| summary | allowed only after purpose and sensitivity check |
| bounded excerpt | exceptional, review-only, source-scoped |
| full content | denied by default for protected classes |
| export | denied unless separately approved |
| runtime injection | denied in this phase |
| external publication | denied in this phase |

## Relationship To Memory Visibility

`MEMORY_VISIBILITY_CLASSIFICATION_MODEL_2026-05-25` defines what kind of memory exists and how visible it may become. This packet defines who may ask for that visibility and which gates must be passed before any bounded view is granted.

## Gate Result

```yaml
recall_authority_scope_rules:
  status: COMPLETE_CURRENT_PASS
  authority_scopes_defined: true
  visibility_scope_matrix_defined: true
  recall_request_envelope_defined: true
  decision_states_defined: true
  fail_closed_conditions_defined: true
  memory_activation_authority: false
  retrieval_runtime_authority: false
  content_exposure_authority: false
  export_authority: false
  execution_authority: false
  runtime_mutation_authority: false
  authority_created: false
```

## Next Selected Action

```txt
memory_reconciliation_access_rules
```

Next work should define how reconciliation reviewers can inspect lineage, conflicts, decay, and integrity evidence without turning visibility into truth or authority.
