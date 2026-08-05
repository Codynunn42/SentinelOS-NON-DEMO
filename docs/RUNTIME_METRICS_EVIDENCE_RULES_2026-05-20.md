# Runtime Metrics Evidence Rules - 2026-05-20

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[KEEP:RUNTIME-METRICS-EVIDENCE-RULES-2026-05-20]
```

## Metrics Evidence Boundary

This packet defines review-only evidence rules for constitutional runtime metrics.

It does not authorize scoring automation, runtime telemetry implementation, deployment, runtime mutation, command execution, live Azure query execution, direct env value restoration, direct env value disclosure, secret value access, secret value disclosure, endpoint publication, pilot activation, tenant activation, billing activation, funnel activation, held-standard promotion, repository push, tool grants, certification claims, autonomous execution, execution-window activation, DEP3.23 activation, authority merge, file movement, file deletion, or destructive cleanup.

## Source Inputs

| Source | Use |
| --- | --- |
| `docs/CONSTITUTIONAL_RUNTIME_METRICS_PACKET_2026-05-20.md` | base constitutional metric vocabulary |
| `docs/AUTHORITY_PROGRESSION_METRICS_2026-05-20.md` | authority progression and compression metrics |
| `docs/SNAP_FED_1_1_FEDERATED_SNAPSHOT_BOUNDARY_PACKET_2026-05-20.md` | snapshot freshness, staleness, lineage, and no-merge rules |
| `docs/AUTHORITY_BALANCE_DOCTRINE_2026-05-20.md` | authority equilibrium and compression boundaries |
| `docs/CONSTITUTIONAL_INVARIANT_REGISTRY_REFINEMENT_2026-05-20.md` | invariant severity and enforcement reference |
| `docs/CONSTITUTIONAL_TEMPLATE_GRAMMAR_2026-05-20.md` | template population and transition grammar |
| `docs/STABILIZATION_LANE_PRIORITY_ORDER_2026-05-20.md` | current stabilization lane sequence |

## Purpose

Define how evidence may qualify constitutional runtime metrics without turning metrics into authority.

Core question:

```txt
What evidence can support a metric score, and when must that evidence decay, hold, or route review?
```

## Core Rule

```txt
metrics_are_evidence_summaries
metrics_are_not_authority_sources
```

Metric scores may support:

- executive visibility
- drift detection
- stability review
- next-lane selection
- hold recommendations
- evidence completeness review

Metric scores must not support:

- deployment
- runtime mutation
- command execution
- live observation
- secret access
- publication
- tenant activation
- authority inheritance
- autonomous decisioning

## Evidence Qualification Classes

| Evidence Class | Description | Metric Use | Authority Boundary |
| --- | --- | --- | --- |
| `direct_runtime_observation` | bounded runtime fact captured under explicit observation authority | high confidence while current | does not renew observation authority |
| `sanitized_runtime_snapshot` | value-free runtime evidence with secrets and direct values excluded | supports observation confidence and drift review | no mutation, no secret access |
| `executive_snapshot` | operator-facing state and routing artifact | supports legitimacy stability and directional integrity | no runtime truth by itself |
| `authority_hold_note` | record of authority decay or held posture | supports authority decay and compression review | no reusable authority |
| `doctrine_artifact` | constitutional rule, model, grammar, or registry | supports invariant and semantic review | no operational authority |
| `template_output` | populated review artifact | supports template completeness | no approval by completion |
| `business_proof_artifact` | proof or meeting readiness state | supports business stability only | no pilot or publication authority |
| `unverified_claim` | statement lacking artifact support | cannot score above weak | route clarification or hold |

## Metric Evidence Map

| Metric | Minimum Evidence | Strong Evidence | Staleness Sensitivity |
| --- | --- | --- | --- |
| `directional_integrity_score` | executive snapshot plus invariant check | executive snapshot, role registry, template grammar, no-conflict scan | medium |
| `authority_compression_pressure` | authority balance doctrine plus current lane | compression metrics, no-authority positive scan, hold list | high |
| `legitimacy_stability` | current snapshot and preserved holds | snapshot federation, invariant refinement, closeout refresh | medium |
| `drift_pressure` | drift or conflict register | federated snapshot comparison plus stale classification | high |
| `constitutional_integrity` | invariant registry reference | invariant severity mapping plus prohibited shortcut scan | medium |
| `mutation_readiness` | execution prerequisite list | current blockers, authority gaps, value posture, rollback and verification holds | high |
| `observation_confidence` | bounded observation artifact | sanitized runtime snapshot plus authority decay note | high |
| `authority_state_clarity` | named authority state | named state plus non-authorization clause and hold list | medium |
| `progression_gate_completeness` | represented gates | structural, compliance, deterministic, decay, and role gates all mapped | high |
| `evidence_authority_compression` | evidence used in current lane | scan confirming evidence does not become permission | high |

## Scoring Evidence Rules

For any metric score:

| Score | Evidence Requirement |
| --- | --- |
| `0` | absent, contradicted, or violated evidence |
| `1` | weak evidence, stale evidence, or unverified claim |
| `2` | represented but incomplete or only partially current evidence |
| `3` | represented, current enough for review, and bounded by non-authorization language |
| `4` | represented across multiple aligned artifacts with no authority-positive conflict |
| `5` | independently verified by current bounded evidence and still non-authorizing |

No score may exceed `3` if:

- evidence is stale
- evidence lacks a subject identity
- evidence lacks an authority boundary
- evidence lacks a non-authorization clause
- evidence depends on a live fact not currently approved for observation

No score may reach `5` without fresh bounded evidence and a separate note that the score remains non-authorizing.

## Freshness And Metric Decay Rules

Metric evidence must decay when its supporting snapshot or artifact becomes stale.

| Evidence Status | Metric Treatment |
| --- | --- |
| `current` | may support metric score according to evidence class |
| `stale` | metric score must cap at `2` unless refreshed |
| `historical` | may support lineage only; cannot raise current score |
| `unknown` | score must hold at `0` or `1` until clarified |
| `conflicted` | score must hold and route reconciliation |

Metric decay rule:

```txt
stale_evidence_lowers_confidence
stale_evidence_does_not_create_refresh_authority
```

## Reviewer Scope

Allowed reviewer actions:

- classify evidence class
- assign freshness status
- record metric score
- identify gaps
- identify compression pressure
- recommend one next review lane
- preserve holds

Prohibited reviewer actions:

- execute commands
- query live runtime
- restore values
- inspect secrets
- publish endpoints
- activate pilots
- grant tools
- promote held standards
- treat scores as authorization

## Evidence Redaction Rules

Metrics may cite:

- artifact paths
- timestamps
- authority states
- held actions
- sanitized runtime fields
- secretRef names already present in sanitized evidence
- non-secret env names already present in sanitized evidence
- score rationale

Metrics must not cite:

- secret values
- direct env values
- credentials
- keys
- logs
- full runtime exports
- executable command lines
- mutation instructions
- publication-ready claims

## Hold And Escalation Rules

Metrics must hold when:

- evidence is stale and the score would affect next-lane routing
- authority compression reaches active pressure
- a score is used as permission
- snapshot federation detects conflict
- the reviewer needs live truth without approved observation authority
- a template attempts to populate an authority-bearing field

Metrics may recommend a bounded review packet when:

- evidence is stale
- subject identity is missing
- authority state is ambiguous
- metric decay prevents useful executive visibility
- drift pressure cannot be resolved from existing artifacts

## Current Evidence Assessment

```yaml
runtime_metrics_evidence_rules:
  selected_lane: runtime_metrics_evidence_rules
  evidence_classes_defined: true
  metric_evidence_map_defined: true
  scoring_evidence_rules_defined: true
  freshness_rules_defined: true
  metric_decay_rules_defined: true
  reviewer_scope_defined: true
  redaction_rules_defined: true
  hold_rules_defined: true
  metrics_authorize_action: false
  scoring_automation_authorized: false
  runtime_telemetry_authorized: false
  deployment_authorized: false
  runtime_mutation_authorized: false
  command_execution_authorized: false
  next_review_lane: executive_snapshot_refresh
  authority_created: false
```

## Executive Metric Evidence Block

Future executive snapshots may include:

```yaml
constitutional_metric_evidence:
  evidence_status: current | stale | historical | unknown | conflicted
  evidence_classes_used: []
  stale_evidence_present: false
  score_caps_applied: []
  compression_pressure_status: LOW | CONTAINED | ACTIVE | HIGH | COLLAPSE_DETECTED
  scores_authorize_action: false
  recommended_next_lane: executive_snapshot_refresh
  authority_created: false
```

## Next Review Lane

```yaml
next_review_lane:
  selected_lane: executive_snapshot_refresh
  reason:
    - snapshot_federation_boundary_defined
    - metric_evidence_rules_defined
    - executive_state_can_now_reconcile_current_constitutional_posture
  authority_created: false
```

## Non-Authorization Clause

This runtime metrics evidence rules packet defines review-only evidence qualification, staleness, decay, redaction, and reviewer rules for constitutional metrics. It does not authorize scoring automation, runtime telemetry implementation, deployment, runtime mutation, command execution, live Azure query execution, direct env value restoration, direct env value disclosure, secret value access, secret value disclosure, endpoint publication, pilot activation, tenant activation, billing activation, funnel activation, held-standard promotion, repository push, tool grants, certification claims, autonomous execution, execution-window activation, DEP3.23 activation, authority merge, file movement, file deletion, or destructive cleanup.
