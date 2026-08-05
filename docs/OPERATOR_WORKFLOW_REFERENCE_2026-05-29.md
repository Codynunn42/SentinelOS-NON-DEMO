# Operator Workflow Reference - 2026-05-29

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** docs-only operator reference  
**Source Approval:** `docs/DOCS_ONLY_IMPLEMENTATION_APPROVAL_PACKET_2026-05-29.md`  
**State:** Docs Only  
**Authority Created:** false

## Artifact Decision

```txt
[KEEP:OPERATOR-WORKFLOW-REFERENCE-2026-05-29]
```

## Purpose

Provide a concise operator reference for using SentinelOS review workflows without creating implementation, runtime, publication, memory, command, or UI authority.

This reference compresses `docs/OPERATOR_WORKFLOW_MODEL_2026-05-29.md` for daily use. It does not replace the source model or authorize workflow automation.

## Operator Rule

```txt
Understand state.
Choose the smallest bounded review action.
Do not infer authority from clarity.
```

## First 30 Seconds

An operator should first answer:

- What is aligned?
- What is held?
- What proof is current for this scope?
- What needs review or reconciliation?
- What is the smallest safe next step?
- What requires explicit approval?

## Daily Loop

| Step | Operator Action | Expected Result | Boundary |
| --- | --- | --- | --- |
| 1 | Check signal bar | Understand direction, authority, trust, proof, runtime, memory, and next step. | Signal state is not control authority. |
| 2 | Review evidence pointers | Confirm source, scope, freshness, and boundary. | Evidence is not approval. |
| 3 | Sort items | Place items into needs review, held, reconcile, request approval, observe, or receipt review. | Sorting does not authorize movement. |
| 4 | Act within review | Review, hold, observe, reconcile, revise artifact, or request scoped approval. | Do not execute, deploy, publish, or retrieve protected memory. |
| 5 | Record receipt or decision | Preserve what was reviewed and why. | Receipt is not permission. |
| 6 | Reassess next step | Select hold, observe, reconcile, revise, or request approval. | No automatic continuation. |

## Review Queues

| Queue | Use When | Allowed Actions | Blocked Actions |
| --- | --- | --- | --- |
| Needs Review | Claims, evidence, or posture are unclear. | review, revise, hold | approve, execute |
| Held | Authority is absent, proof is stale, or movement is blocked. | hold, request approval, refresh proof | treat hold as failure |
| Reconcile | Repo, runtime, doc, public, or operator truth conflicts. | reconcile sources, revise artifact | deploy, promote truth |
| Request Approval | Exact scoped authority is needed. | draft bounded approval request | infer approval |
| Observe | Understanding can increase without authority. | observe, record, reassess | mutate, expand |
| Receipt Review | An audit event or receipt exists. | review, preserve, reconcile | convert receipt to permission |

## Hold Workflow

Use hold when authority is absent, proof is stale, publication is not authorized, memory is protected, implementation is not authorized, or a conflict exists.

```yaml
hold_workflow:
  sequence:
    - identify_held_signal
    - read_forbidden_implication
    - confirm_required_gate
    - record_hold_as_valid_outcome
    - select_next_allowed_action
  valid_next_actions:
    - observe
    - reconcile
    - request_approval
    - refresh_proof
    - maintain_hold
  invalid_next_actions:
    - execute
    - deploy
    - publish
    - retrieve_memory
    - override_authority
  authority_created: false
```

## Reconcile Workflow

Use reconcile when evidence conflicts, status is stale, doc truth differs from runtime truth, public claims differ from proof, or operator posture is unclear.

```yaml
reconcile_workflow:
  sequence:
    - name_conflicting_truths
    - identify_source_of_record_for_each_truth
    - select_review_scope
    - correct_or_update_artifact_if_authorized_for_docs
    - preserve_runtime_and_publication_holds
    - record_reconciled_state_or_remaining_gap
  valid_outcomes:
    - complete_for_scope
    - needs_fresh_proof
    - needs_operator_decision
    - hold
  authority_created: false
```

## Approval Request Workflow

Approval request is not approval. It is the act of preparing a bounded ask.

| Required Field | Meaning |
| --- | --- |
| `requested_action` | The exact action being requested. |
| `exact_scope` | The files, surfaces, audience, or runtime scope involved. |
| `target_artifact_or_surface` | The artifact or surface to be changed or used. |
| `duration_or_expiration` | When the authority ends or must be reassessed. |
| `evidence_pointer` | The proof, review, or artifact supporting the request. |
| `exclusions` | What is explicitly not authorized. |
| `rollback_or_hold_condition_if_applicable` | When to stop, revert, or hold. |

Invalid requests include broad authority, implied runtime mutation, publication without exact material, memory activation without rules, and API renaming without contract review.

## Observe Workflow

Use observe when the public surface is established, external response is useful, no share window is active, or the next step is understanding without authority.

```yaml
observe_workflow:
  sequence:
    - define_observation_target
    - define_observation_window
    - record_questions_or_misunderstandings
    - classify_patterns
    - decide_hold_reconcile_or_review
  prohibited:
    - publication_expansion
    - funnel_activation
    - runtime_mutation
    - product_expansion
  authority_created: false
```

## Signal Routing

| Signal State | Route To | Reason |
| --- | --- | --- |
| `direction_check: aligned` | Observe or continue review | Movement remains coherent. |
| `direction_check: drift_detected` | Reconcile | Direction needs correction before movement. |
| `authority_check: held` | Hold or request approval | Authority is absent. |
| `trust_review: needs_review` | Needs Review queue | Claims or evidence need review. |
| `proof_check: stale` | Refresh proof | Proof cannot support the current claim. |
| `runtime_health: unknown` | Refresh or hold | No current runtime truth should be claimed. |
| `memory_rules: protected` | Hold memory use | No retrieval or display. |
| `share_review: held` | Hold share or request approval | Publication or sharing is not authorized. |
| `next_step: observe` | Observe workflow | Understanding can increase without authority. |

## Non-Authorization

This operator workflow reference is docs-only.

It does not authorize runtime mutation, deployment, implementation beyond this named reference artifact, memory activation, authority creation, publication expansion, workflow automation, command changes, UI changes, API contract renaming, branch protection changes, billing activation, funnel activation, tenant activation, external sharing, broad public launch claims, proof claims beyond the current recorded evidence, file movement, file deletion, archival changes, staging, or committing.
