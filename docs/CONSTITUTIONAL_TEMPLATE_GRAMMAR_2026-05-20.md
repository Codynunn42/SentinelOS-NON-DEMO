# Constitutional Template Grammar - 2026-05-20

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[KEEP:CONSTITUTIONAL-TEMPLATE-GRAMMAR-2026-05-20]
```

## Grammar Boundary

This artifact defines review-only template transition grammar for SentinelOS.

It does not authorize deployment, runtime mutation, command execution, live Azure query execution, direct env value restoration, direct env value disclosure, secret value access, secret value disclosure, endpoint publication, pilot activation, tenant activation, held-standard promotion, repository push, tool grants, certification claims, autonomous execution, execution-window activation, file movement, file deletion, or destructive cleanup.

## Source Inputs

| Source | Role |
| --- | --- |
| `docs/NEXT_EXECUTIVE_TEMPLATE_2026-05-20.md` | current executive template integration |
| `docs/SENTINEL_TILDA_TEMPLATE_ORCHESTRATION_2026-05-20.md` | Sentinel/Tilda orchestration rule |
| `docs/CONSTITUTIONAL_VOCABULARY_HARDENING_2026-05-20.md` | semantic precision rules |
| `docs/CONSTITUTIONAL_ROLE_REGISTRY_2026-05-20.md` | role separation rules |
| `docs/AUTHORITY_BALANCE_DOCTRINE_2026-05-20.md` | minimum sufficient authority and compression risks |
| `docs/AUTHORITY_PROGRESSION_METRICS_2026-05-20.md` | progression and compression metric checks |
| `docs/CONSTITUTIONAL_INVARIANT_REGISTRY_2026-05-20.md` | constitutional invariants |

## Purpose

Constitutional template grammar defines how review artifacts may transition without converting structure into authority.

The core rule is:

```txt
templates_can_route_review
templates_cannot_create_authority
```

## Template Grammar Roles

| Template Role | Function | Boundary |
| --- | --- | --- |
| `Snapshot` | captures or preserves current state | does not approve action |
| `Scan` | organizes documents, evidence, or topology | does not move, delete, archive, publish, or promote |
| `Doctrine` | defines principles, vocabulary, or rules | does not implement enforcement |
| `Registry` | records canonical terms, roles, invariants, or lineage | does not activate runtime capability |
| `Metric` | scores or describes review posture | does not authorize progression |
| `Packet` | frames a bounded decision or gap | does not execute unless explicitly execution-scoped and separately approved |
| `Approval Note` | accepts a scoped review artifact | does not expand beyond named scope |
| `Closeout` | records held posture and next review lane | does not permanently complete authority |
| `Executive Template` | exposes current state and next decision surface | does not create the decision |

## Allowed Template Transitions

| From | To | Allowed When |
| --- | --- | --- |
| `Snapshot` | `Executive Template` | current state needs operator-facing summary |
| `Scan` | `Template Focus` | document topology identifies one smallest next clarity improvement |
| `Doctrine` | `Registry` | stable terms or rules need canonical indexing |
| `Registry` | `Metric` | registered concepts need review-only observability |
| `Metric` | `Grammar` | measurements need allowed and prohibited template transitions |
| `Grammar` | `Invariant Refinement` | transition rules reveal enforcement classes or severity gaps |
| `Packet` | `Approval Note` | operator accepts only the explicit packet scope |
| `Approval Note` | `Gap Register` | acceptance reveals missing bounded authority or evidence |
| `Gap Register` | `Doctrine` | repeated gaps require stable rule language |
| `Closeout` | `Next Executive Template` | session posture needs continuity without reopening execution |

## Prohibited Semantic Shortcuts

```txt
template_completed != authority_granted
template_selected != lane_authorized
metric_scored != progression_approved
registry_recorded != runtime_activated
doctrine_defined != enforcement_implemented
approval_note_accepted != blanket_authority
closeout_recorded != permanent_completion
scan_completed != file_movement_authorized
snapshot_compared != authority_merged
executive_summary_created != deployment_authorized
```

## Required Template Header Fields

Every future constitutional template should include:

```yaml
template_header:
  artifact_id:
  lane:
  authority_state: Review-Scoped | Held | Approval-Scoped | Execution-Scoped
  canonical_source:
  supporting_sources:
  requested_operator_decision:
  authority_change_requested: false
  runtime_mutation_requested: false
  publication_requested: false
```

## Required Review Checks

Every future constitutional template should include:

```yaml
constitutional_checks:
  invariant_check_result:
  vocabulary_check_result:
  role_clarity_check_result:
  authority_balance_check_result:
  authority_progression_metric_result:
  compression_status:
  hold_status:
  next_template_selected:
  authority_created: false
```

## Tilda Population Grammar

Tilda may populate:

- canonical source references
- current posture summaries
- scoped vocabulary checks
- role clarity checks
- authority balance checks
- metric summaries
- next review lane

Tilda must not populate:

- executable commands
- runtime mutation instructions
- secret values
- direct env values
- deployment steps
- publication approval
- repository push instructions
- execution-window activation
- authority expansion language

## Sentinel Review Grammar

Sentinel AI may interpret:

- authority state
- invariant alignment
- role separation
- compression pressure
- drift indicators
- next bounded review lane

Sentinel AI must not interpret:

- template completion as approval
- metric scoring as authorization
- operator enthusiasm as scope expansion
- tool availability as authority
- review readiness as execution readiness

## Transition Decision Pattern

Use this pattern before any template transition:

```yaml
template_transition_decision:
  current_template:
  proposed_next_template:
  transition_type:
  reason_for_transition:
  smallest_clarity_gain:
  authority_change_requested: false
  prohibited_shortcut_checked: true
  compression_status:
  recommended_action: continue_review | hold | request_scope_clarification
```

## Current Grammar Assessment

```yaml
constitutional_template_grammar_assessment:
  phase: SEMANTIC_HARDENING
  template_authority_separation: STRONG
  role_separation: STRONG
  vocabulary_control: STRONG
  authority_balance: MAINTAINED
  authority_progression_metrics: REVIEW_ONLY
  execution_pressure: CONTAINED
  recommended_posture: HOLD_EXECUTION
  authority_created: false
```

## Next Recommended Template

```yaml
next_template_recommendation:
  selected_lane: constitutional_stabilization
  selected_template: constitutional_invariant_registry_refinement
  reason:
    - template_grammar_is_now_defined
    - invariants_can_now_receive_classes_and_enforcement_levels
    - prohibited_shortcuts_can_be_mapped_to_invariants
  authority_created: false
```

## Non-Authorization Clause

This constitutional template grammar records review-only transition rules. It does not authorize deployment, runtime mutation, command execution, live Azure query execution, direct env value restoration, direct env value disclosure, secret value access, secret value disclosure, endpoint publication, pilot activation, tenant activation, held-standard promotion, repository push, tool grants, certification claims, autonomous execution, execution-window activation, file movement, file deletion, or destructive cleanup.
