# Operator Vocabulary Registry - 2026-05-29

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** operator vocabulary registry  
**Lane:** Productization Without Governance Loss  
**Selected Action:** `open_operator_vocabulary_registry`  
**Phase:** `PRODUCTIZATION_WITHOUT_GOVERNANCE_LOSS`  
**Objective:** create canonical operator language  
**North Star:** preserve operational trust  
**Success Metric:** operator can understand state in under 30 seconds  
**Authority Created:** false

## Artifact Decision

```txt
[KEEP:OPERATOR-VOCABULARY-REGISTRY-2026-05-29]
```

## Purpose

Define the canonical operator language layer for SentinelOS.

This registry does not replace constitutional doctrine. It translates doctrine into operator-visible terms that can appear in Mission Control, executive snapshots, pilot review material, and future product surfaces without weakening authority boundaries.

## Source Scan

```yaml
source_scan:
  artifact: docs/SENTINELOS_OPTIMIZATION_STREAMLINE_SCAN_2026-05-29.md
  strongest_finding:
    constitutional_governance_depth: strong
    operator_terminology_layer: needed
    product_experience_compression: needed
    doctrine_to_operator_mapping: not_yet_canonical
  registry_response:
    create_canonical_operator_language: true
    preserve_doctrine_under_operator_terms: true
    authority_created: false
```

## Translation Model

```txt
Operator Language
  -> Governance Language
    -> Doctrine Language
```

The operator sees the compressed term.

The governance layer preserves the rules.

The doctrine layer remains the source of meaning.

## Registry Rule

```txt
Operator terms are aliases, not replacements.
```

Any operator term must preserve:

- scope
- authority state
- proof freshness
- held-state legitimacy
- human review boundary
- public/internal separation
- memory governance boundary

## Canonical Operator Signals

| Operator Signal | Doctrine Source | Plain Meaning | Primary Display State | Forbidden Implication |
| --- | --- | --- | --- | --- |
| Direction Check | Directional Integrity | Is this movement still aligned with the verified system direction? | `aligned` | Direction check does not authorize movement. |
| Authority Check | Authority Balance / Authority Lifecycle | What permission exists, is held, or has expired? | `held` | Evidence, readiness, and review do not create authority. |
| Trust Review | Legitimacy Review | Do evidence, claims, posture, and scope agree? | `coherent` | Trust review is not approval. |
| Proof Check | Proof Freshness | Is the proof current enough for this exact use? | `verified_current_scope` | Verified proof is not permanent externalization authority. |
| Execution Gate | Bounded Execution | Is this action blocked until explicit execution authority exists? | `held` | Gate visibility is not an execute button. |
| Reconcile | Reconciliation | Align repo truth, runtime truth, doc truth, and operator posture. | `needed` | Reconciliation is not deployment or truth promotion. |
| Share Review | Externalization Governance | Can this exact material be shared with this exact audience? | `held` | Share review is not publication authority. |
| Operating Rhythm | Constitutional Operational Cadence | Where are we in orient, preflight, bound, review, hold, reassess, continue? | `hold` | Rhythm does not auto-continue. |
| Memory Rules | Memory Governance | What can memory inform, display, or block? | `governed` | Memory does not create authority or retrieval rights. |
| Runtime Health | Runtime Stability | What is the current or last verified runtime posture? | `stable_held` | Stable does not mean launch-ready. |
| Receipt | Audit / Receipt Evidence | What happened, why, and under what boundary? | `recorded` | Receipt is not permission. |
| Next Step | Controlled Outcome Selection | What is the smallest safe movement now? | `observe` | Next step is not broad lane expansion. |

## Canonical Operator Verbs

| Verb | Use | Required Scope | Forbidden Implication |
| --- | --- | --- | --- |
| Check | Read state or run a bounded validation. | what is being checked and why | Check does not approve. |
| Review | Evaluate evidence, wording, surface, readiness, or risk. | artifact, audience, or decision lane | Review does not mutate. |
| Hold | Preserve current state intentionally. | what remains held | Hold is not failure. |
| Observe | Watch external response, runtime state, or operator behavior. | observation target and window | Observation does not create authority. |
| Verify | Confirm named evidence for a named scope. | source, timestamp, and use | Verification does not expand scope. |
| Approve | Grant explicit bounded permission. | action, duration, target, and exclusions | Approval without scope is invalid. |
| Route | Send an item to the right lane, owner, queue, or gate. | destination and reason | Route does not execute. |
| Execute | Perform an approved action. | execution authority and target | Execute is invalid without explicit execution authority. |
| Reconcile | Align conflicting truths or artifacts. | truths being reconciled | Reconciliation does not deploy. |
| Learn | Record pattern or improvement insight. | learning target and boundary | Learning does not auto-change behavior. |

## State Vocabulary

### Direction Check

| State | Meaning | Operator Reading |
| --- | --- | --- |
| `aligned` | Movement matches current verified direction. | Continue review or observe. |
| `bend_detected` | Direction changed but may preserve intent. | Reconcile before continuing. |
| `fork_detected` | Competing path has appeared. | Route to review. |
| `drift_detected` | Gradual misalignment is visible. | Hold or revise. |
| `break_detected` | Current movement violates model or authority. | Stop and correct. |

### Authority Check

| State | Meaning | Operator Reading |
| --- | --- | --- |
| `held` | No movement authority exists for the requested action. | Hold is valid. |
| `review_scoped` | Review may continue, mutation may not. | Continue documentation or analysis only. |
| `approved_for_scope` | Explicit permission exists for a named scope. | Act only inside that scope. |
| `expired` | Prior approval has decayed or closed. | Re-approve before movement. |
| `blocked` | A rule prevents movement. | Correct or escalate. |

### Trust Review

| State | Meaning | Operator Reading |
| --- | --- | --- |
| `coherent` | Claims, evidence, authority, and posture align. | Preserve current framing. |
| `needs_review` | A gap or ambiguity needs human review. | Review before movement. |
| `conflict_detected` | Sources disagree. | Reconcile before claims. |
| `blocked` | Trust boundary failed. | Hold until corrected. |

### Proof Check

| State | Meaning | Operator Reading |
| --- | --- | --- |
| `verified_current_scope` | Proof supports the exact current scope. | Use only for that scope. |
| `stale` | Prior proof exists but should not support current claims. | Refresh before share or claim. |
| `missing` | Required proof is absent. | Do not externalize. |
| `blocked` | Proof route failed or contradicted claim. | Hold and correct. |

### Runtime Health

| State | Meaning | Operator Reading |
| --- | --- | --- |
| `stable_held` | Stable evidence exists but runtime authority remains held. | Observe or review only. |
| `stable_authorized_scope` | Stable and authorized for a named scope. | Act only inside approval. |
| `degraded` | Runtime signal indicates risk. | Reconcile or hold. |
| `unknown` | Runtime state has not been checked. | Do not claim current runtime truth. |

### Memory Rules

| State | Meaning | Operator Reading |
| --- | --- | --- |
| `governed` | Memory can inform review under rules. | Use bounded context only. |
| `metadata_only` | Only classifications or pointers may display. | Do not retrieve protected content. |
| `protected` | Memory content is sealed or restricted. | No display or export. |
| `blocked` | Memory use would create authority or exposure risk. | Hold memory use. |

### Next Step

| State | Meaning | Operator Reading |
| --- | --- | --- |
| `observe` | Gather response or state without mutation. | Watch and record. |
| `reconcile` | Align conflicting sources or posture. | Fix truth before movement. |
| `hold` | Preserve current outcome. | Stop intentionally. |
| `revise` | Adjust language, model, or artifact. | Change review material only. |
| `request_approval` | Explicit authority is needed. | Ask for scoped approval. |

## Display Placement Rules

| Surface | Allowed Operator Terms | Boundary |
| --- | --- | --- |
| Mission Control | Direction Check, Authority Check, Trust Review, Proof Check, Runtime Health, Memory Rules, Next Step | Display-only until implementation authority exists. |
| Executive Snapshot | all canonical signals and verbs | Must preserve authority state and next lane. |
| Public README | Direction Check, Proof Check, Share Review, Runtime Health only when bounded | Avoid internal doctrine density and protected internals. |
| Buyer/Pilot Material | Trust Review, Proof Check, Runtime Health, Receipt | Avoid execution, legal, recovery, or production-certification claims. |
| Internal Governance Docs | full doctrine and full operator layer | Must not collapse doctrine into shorthand without definitions. |
| Command/UI Labels | operator terms only after separate implementation approval | Do not rename API contracts by vocabulary decision. |

## Mission Control Conceptual Status Bar

```yaml
mission_control_status_bar:
  direction_check: aligned
  authority_check: held
  trust_review: coherent
  proof_check: verified_current_scope
  runtime_health: stable_held
  memory_rules: governed
  next_step: observe
```

Each signal should be expandable into:

- current state
- source evidence
- doctrine source
- boundary
- next allowed action
- prohibited movement

## Productization Guardrails

```yaml
productization_guardrails:
  compression_allowed: true
  doctrine_replacement_allowed: false
  display_state_allowed: true
  authority_creation_allowed: false
  api_contract_renaming_allowed: false
  ui_implementation_allowed: false
  publication_expansion_allowed: false
  runtime_mutation_allowed: false
```

## Success Criteria

```yaml
success_criteria:
  operator_can_understand_state_in_under_30_seconds: true
  doctrine_depth_preserved: true
  authority_boundaries_visible: true
  proof_freshness_visible: true
  held_state_legitimacy_visible: true
  memory_rules_visible_without_memory_activation: true
  mission_control_ready_for_signal_modeling: true
  authority_created: false
```

## Recommended Next Artifact

```yaml
recommended_next_artifact:
  name: CONSTITUTIONAL_TO_OPERATOR_TRANSLATION_MATRIX
  reason:
    - registry_defines_canonical_operator_terms
    - next_artifact_should_map_each_term_to_doctrine_source_and_display_rules
    - mission_control_signal_model_depends_on_translation_matrix
  authority_created: false
```

## Non-Authorization

This operator vocabulary registry is review-only terminology governance.

It does not authorize runtime mutation, deployment, implementation, memory activation, authority creation, publication expansion, workflow edits, command changes, UI changes, API contract renaming, branch protection changes, billing activation, funnel activation, tenant activation, external sharing, or broad public launch claims.
