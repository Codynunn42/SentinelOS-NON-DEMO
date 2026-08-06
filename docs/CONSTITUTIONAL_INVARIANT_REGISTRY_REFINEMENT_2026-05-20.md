# Constitutional Invariant Registry Refinement - 2026-05-20

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[KEEP:CONSTITUTIONAL-INVARIANT-REGISTRY-REFINEMENT-2026-05-20]
```

## Refinement Boundary

This artifact refines the existing constitutional invariant registry with invariant classes, severity, enforcement levels, inheritance rules, and prohibited-shortcut mappings.

It does not authorize deployment, runtime mutation, command execution, live Azure query execution, direct env value restoration, direct env value disclosure, secret value access, secret value disclosure, endpoint publication, pilot activation, tenant activation, held-standard promotion, repository push, tool grants, certification claims, autonomous execution, execution-window activation, file movement, file deletion, or destructive cleanup.

## Source Inputs

| Source | Role |
| --- | --- |
| `docs/CONSTITUTIONAL_INVARIANT_REGISTRY_2026-05-20.md` | base invariant registry |
| `docs/CONSTITUTIONAL_TEMPLATE_GRAMMAR_2026-05-20.md` | prohibited shortcuts and transition grammar |
| `docs/CONSTITUTIONAL_VOCABULARY_HARDENING_2026-05-20.md` | semantic collapse controls |
| `docs/CONSTITUTIONAL_ROLE_REGISTRY_2026-05-20.md` | role separation invariants |
| `docs/AUTHORITY_BALANCE_DOCTRINE_2026-05-20.md` | authority balance rules |
| `docs/AUTHORITY_PROGRESSION_METRICS_2026-05-20.md` | progression and compression metric conditions |

## Purpose

The base invariant registry states what must remain true.

This refinement defines how invariants are classified, reviewed, and held when a future artifact risks violating them.

## Invariant Classes

| Class | Meaning | Examples |
| --- | --- | --- |
| `AUTHORITY_SEPARATION` | prevents facts, review, templates, metrics, roles, or readiness from becoming authority | `INV-001`, `INV-007`, `INV-009` |
| `MUTATION_BOUNDARY` | prevents read/review/modeling artifacts from changing runtime or external state | `INV-002`, `INV-004` |
| `EXECUTION_ADJACENCY` | prevents modeled execution and output planning from becoming executable action | `INV-003`, `INV-010` |
| `AUTHORITY_LIFECYCLE` | requires bounded authority to decay and return to held posture | `INV-005` |
| `TRUTH_RECONCILIATION` | ensures observed reality outranks stale assumptions | `INV-006` |
| `STABILIZATION_LEGITIMACY` | protects hold, closeout, and non-escalation as valid outcomes | `INV-008` |
| `ROLE_SEPARATION` | prevents Sentinel, Tilda, operator, template, metric, and tool scopes from collapsing | `INV-011`, `INV-012` |
| `TEMPLATE_GRAMMAR` | prevents template completion, selection, or formatting from creating authority | `INV-013`, `INV-014` |
| `AUTHORITY_BALANCE` | preserves minimum sufficient authority and prevents compression or concentration | `INV-015`, `INV-016` |

## Refined Invariant Set

| ID | Invariant | Class | Severity | Enforcement |
| --- | --- | --- | --- | --- |
| `INV-001` | `evidence != authority` | `AUTHORITY_SEPARATION` | `CRITICAL` | `P0_HOLD` |
| `INV-002` | `review != mutation` | `MUTATION_BOUNDARY` | `CRITICAL` | `P0_HOLD` |
| `INV-003` | `modeled_execution != authorized_execution` | `EXECUTION_ADJACENCY` | `CRITICAL` | `P0_HOLD` |
| `INV-004` | `observation != execution` | `MUTATION_BOUNDARY` | `CRITICAL` | `P0_HOLD` |
| `INV-005` | `authority_must_decay` | `AUTHORITY_LIFECYCLE` | `CRITICAL` | `P0_HOLD` |
| `INV-006` | `runtime_truth_overrides_static_assumptions` | `TRUTH_RECONCILIATION` | `HIGH` | `P1_CORRECT` |
| `INV-007` | `readiness_does_not_force_authorization` | `AUTHORITY_SEPARATION` | `CRITICAL` | `P0_HOLD` |
| `INV-008` | `hold_is_a_legitimate_outcome` | `STABILIZATION_LEGITIMACY` | `HIGH` | `P1_CORRECT` |
| `INV-009` | `snapshot_focus_does_not_grant_authority` | `AUTHORITY_SEPARATION` | `CRITICAL` | `P0_HOLD` |
| `INV-010` | `output_boundaries_precede_execution_results` | `EXECUTION_ADJACENCY` | `HIGH` | `P1_CORRECT` |
| `INV-011` | `tilda_population_does_not_authorize` | `ROLE_SEPARATION` | `CRITICAL` | `P0_HOLD` |
| `INV-012` | `sentinel_review_does_not_execute` | `ROLE_SEPARATION` | `CRITICAL` | `P0_HOLD` |
| `INV-013` | `template_completion_does_not_grant_authority` | `TEMPLATE_GRAMMAR` | `CRITICAL` | `P0_HOLD` |
| `INV-014` | `metric_scoring_does_not_authorize_progression` | `TEMPLATE_GRAMMAR` | `CRITICAL` | `P0_HOLD` |
| `INV-015` | `minimum_sufficient_authority_must_be_preserved` | `AUTHORITY_BALANCE` | `HIGH` | `P1_CORRECT` |
| `INV-016` | `authority_compression_requires_hold_or_correction` | `AUTHORITY_BALANCE` | `CRITICAL` | `P0_HOLD` |

## Enforcement Levels

| Enforcement | Meaning | Required Handling |
| --- | --- | --- |
| `P0_HOLD` | violation would create authority drift, mutation risk, role collapse, or execution adjacency collapse | hold the artifact until corrected |
| `P1_CORRECT` | violation weakens truth, stabilization, or balance but does not yet create direct authority collapse | correct before treating artifact as stable |
| `P2_CLARIFY` | wording is directionally acceptable but too broad or under-scoped | clarify in current or next review pass |

## Severity Definitions

| Severity | Meaning |
| --- | --- |
| `CRITICAL` | violation can create implied authority, mutation, execution, role collapse, or compression |
| `HIGH` | violation can weaken stability, truth reconciliation, or authority balance |
| `MEDIUM` | violation can create ambiguity or future drift pressure |
| `LOW` | wording or formatting issue with low immediate authority impact |

## Prohibited Shortcut Mapping

| Prohibited Shortcut | Mapped Invariant | Enforcement |
| --- | --- | --- |
| `template_completed != authority_granted` | `INV-013` | `P0_HOLD` |
| `template_selected != lane_authorized` | `INV-013` | `P0_HOLD` |
| `metric_scored != progression_approved` | `INV-014` | `P0_HOLD` |
| `registry_recorded != runtime_activated` | `INV-001` | `P0_HOLD` |
| `doctrine_defined != enforcement_implemented` | `INV-002` | `P0_HOLD` |
| `approval_note_accepted != blanket_authority` | `INV-007` | `P0_HOLD` |
| `closeout_recorded != permanent_completion` | `INV-008` | `P1_CORRECT` |
| `scan_completed != file_movement_authorized` | `INV-002` | `P0_HOLD` |
| `snapshot_compared != authority_merged` | `INV-009` | `P0_HOLD` |
| `executive_summary_created != deployment_authorized` | `INV-007` | `P0_HOLD` |

## Inheritance Rules

```txt
constraints_inherit
obligations_inherit
holds_inherit
audit_requirements_inherit
semantic_boundaries_inherit
authority_does_not_inherit
execution_permission_does_not_inherit
publication_permission_does_not_inherit
tool_access_does_not_inherit
```

## Review Application

Future artifacts should include:

```yaml
invariant_refinement_check:
  invariants_checked:
  critical_violations:
  high_risk_ambiguities:
  prohibited_shortcuts_checked:
  inheritance_boundary_preserved:
  enforcement_result: pass | correct | hold
  authority_created: false
```

## Current Refinement Assessment

```yaml
constitutional_invariant_refinement:
  invariant_classes_defined: true
  severity_levels_defined: true
  enforcement_levels_defined: true
  prohibited_shortcuts_mapped: true
  inheritance_rules_defined: true
  critical_violations_detected: false
  recommended_posture: HOLD_EXECUTION
  authority_created: false
```

## Next Recommended Template

```yaml
next_template_recommendation:
  selected_lane: constitutional_stabilization
  selected_template: constitutional_stabilization_closeout_refresh
  reason:
    - vocabulary_roles_balance_metrics_grammar_and_invariants_are_now_hardened
    - stabilization_state_should_be_recapped_before_any_new_lane
    - execution_pressure_should_remain_contained
  authority_created: false
```

## Non-Authorization Clause

This constitutional invariant registry refinement records review-only invariant classes, severity, enforcement levels, inheritance rules, and prohibited-shortcut mappings. It does not authorize deployment, runtime mutation, command execution, live Azure query execution, direct env value restoration, direct env value disclosure, secret value access, secret value disclosure, endpoint publication, pilot activation, tenant activation, held-standard promotion, repository push, tool grants, certification claims, autonomous execution, execution-window activation, file movement, file deletion, or destructive cleanup.
