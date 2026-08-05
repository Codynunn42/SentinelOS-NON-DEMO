# Mission Control Signal Reference - 2026-05-29

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** docs-only signal reference  
**Source Approval:** `docs/DOCS_ONLY_IMPLEMENTATION_APPROVAL_PACKET_2026-05-29.md`  
**State:** Docs Only  
**Authority Created:** false

## Artifact Decision

```txt
[KEEP:MISSION-CONTROL-SIGNAL-REFERENCE-2026-05-29]
```

## Purpose

Provide a concise reference for Mission Control operator signals before any UI implementation is considered.

This reference compresses `docs/MISSION_CONTROL_SIGNAL_MODEL_2026-05-29.md` and `docs/CONSTITUTIONAL_TO_OPERATOR_TRANSLATION_MATRIX_2026-05-29.md` into a docs-only signal guide. It does not authorize Mission Control UI edits.

## Signal Rule

```txt
Signal state is readable governance state.
Signal state is not control authority.
```

Each signal may show current state, evidence pointer, doctrine source, governance boundary, next allowed action, and prohibited movement.

Each signal must block execute control, deploy control, publication control, memory retrieval control, authority override, and API contract change.

## First-View Signals

| Signal | Default State | Meaning | Next Review Action | Forbidden Implication |
| --- | --- | --- | --- | --- |
| Direction Check | `aligned` | Movement remains directionally coherent. | observe, review, reconcile, hold | Alignment does not authorize movement. |
| Authority Check | `held` | Authority is absent or scoped to review. | hold, request approval, review scope | Evidence or readiness does not create authority. |
| Trust Review | `coherent` | Claims, evidence, authority, and posture agree for review. | preserve, revise, reconcile, hold | Trust review is not approval. |
| Proof Check | `verified_current_scope` | Proof supports the named scope. | refresh proof, preserve scope, hold share | Verified proof is not permanent share authority. |
| Runtime Health | `stable_held` | Runtime appears stable but authority remains held. | observe, refresh runtime proof, hold | Stable does not mean launch-ready. |
| Memory Rules | `governed` | Memory is under visibility and authority rules. | use metadata, hold memory, request review | Visibility does not grant retrieval. |
| Next Step | `observe` | The smallest safe move is review or observation. | perform review step, hold, request approval | Next step is not broad lane expansion. |

## Extended Signals

| Signal | Primary Use | Boundary |
| --- | --- | --- |
| Execution Gate | Shows whether execution-sensitive movement has explicit authority. | Gate visibility is not an execute control. |
| Reconcile | Shows whether repo, runtime, doc, public, or operator truths need alignment. | Reconciliation is not deployment or truth promotion. |
| Share Review | Shows whether material can be shared with a named audience. | Share review is not publication authority. |
| Receipt | Shows what happened, why, and under what boundary. | Receipt is not permission. |
| Operating Rhythm | Shows where the system is in orient, preflight, review, hold, reassess, or continue. | Cadence does not auto-authorize. |

## Signal Detail Pattern

Every signal detail should show:

- `signal_label`
- `current_state`
- `plain_language_meaning`
- `doctrine_source`
- `governance_rule`
- `artifact_pointer`
- `evidence_scope`
- `freshness_or_expiration_condition`
- `forbidden_implication`
- `prohibited_movement`
- `next_allowed_action`
- `required_gate_if_any`

## Signal State Tones

| Tone | Meaning |
| --- | --- |
| `stable` | State is coherent for review, not a launch signal. |
| `held` | Authority is intentionally not present. |
| `freshness_sensitive` | Evidence is valid only for a named scope and time. |
| `stable_but_held` | Runtime appears stable, but authority is not expanded. |
| `protected` | Content or memory is governed and not retrievable. |
| `review_only` | Current movement is documentation or review. |
| `blocked` | Movement is prevented until corrected or scoped approval exists. |

## Display-Only Boundary

```yaml
display_only_boundary:
  allowed:
    - show_signal_state
    - show_evidence_pointer
    - show_doctrine_source
    - show_boundary
    - show_next_allowed_review_action
  prohibited:
    - approve_from_signal_card
    - execute_from_signal_card
    - deploy_from_signal_card
    - publish_from_signal_card
    - retrieve_memory_from_signal_card
    - override_authority_from_signal_card
    - rename_api_contract_from_signal_card
  authority_created: false
```

## Relationship To Existing Mission Control

Existing Mission Control already has approvals, metrics, governance signals, audit feed, drift, billing checks, and pipeline stages.

This signal reference does not replace those surfaces. It defines a higher-level reference model:

```txt
operator signal
  -> evidence pointer
    -> existing Mission Control panel or artifact
```

Any future UI work should reuse existing signal, metrics, audit, and approval surfaces instead of creating a parallel control loop.

## Technical Contracts Preserved

The following names remain technical contracts and are not renamed by this reference:

- `/health`
- `/proof`
- `/v1/audit`
- `/v1/command`
- `/v1/audit/stream`
- `/v1/signals/stream`
- `/v1/metrics`
- `/approvals`
- `approval:read`
- `approval:review`
- `APPROVAL_REQUIRED`

## Non-Authorization

This Mission Control signal reference is docs-only.

It does not authorize runtime mutation, deployment, Mission Control UI implementation, command changes, API contract renaming, memory activation, authority creation, publication expansion, external sharing, proof claims beyond current recorded evidence, file movement, file deletion, archival changes, staging, or committing.
