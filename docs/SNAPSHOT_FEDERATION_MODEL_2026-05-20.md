# Snapshot Federation Model - 2026-05-20

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[KEEP:SNAPSHOT-FEDERATION-MODEL-2026-05-20]
```

## Purpose

Define how SentinelOS can look at the current executive snapshot for one subject, then compare it against the current snapshot for another subject, tenant, operator, agent, system, or authority lane.

This creates a governed snapshot-of-snapshots pattern without allowing cross-subject authority merge, tenant leakage, runtime mutation, or execution escalation.

## Core Answer

Yes, snapshots can exist for others.

They should exist as subject-scoped current-state artifacts:

```txt
my current snapshot
other subject current snapshot
system current snapshot
tenant current snapshot
operator current snapshot
agent current snapshot
approval-lane current snapshot
runtime current snapshot
```

The safe advancement pattern is not to let one snapshot control another. The pattern is to let SentinelOS compare them, identify alignment or drift, and route the next legitimate review lane.

## Core Invariant

```txt
snapshot federation compares authority states.
snapshot federation does not merge authority states.
```

## Directional Template Focus

Snapshot federation should operate as the directional focus system for governed templates.

It should not grant authority. It should decide:

- which template is relevant now
- what subject the template applies to
- what evidence should populate the template
- what gaps should remain blank or held
- what next lane the completed template should route toward

Core rule:

```txt
snapshot federation does not approve action.
snapshot federation focuses template population.
```

This keeps the system narrow. Instead of every template competing for attention, SentinelOS reads the current snapshot set and selects the template that fits the live authority posture.

## Template Selection Logic

| Snapshot Signal | Template Focus |
| --- | --- |
| execution window absent | `DEP3.11` execution window and authority decay packet |
| target-image intent unresolved | target image approval or hold packet |
| runtime truth stale | pre-mutation snapshot authority packet |
| publication status held | publication/send approval packet |
| push status held with checkpoint need | repository checkpoint/push approval packet |
| tenant posture unclear | tenant boundary or activation review packet |
| public claim posture unclear | buyer-safe/publication claim review packet |
| governance lineage unclear | root authority or governance consistency review |

The selected template remains governed by its own authority boundary. Federation only determines focus and input population.

## Template Population Envelope

Every template populated by snapshot federation should carry a focus envelope:

```yaml
template_focus:
  selected_by: snapshot_federation
  focus_reason: ""
  primary_snapshot: ""
  comparison_snapshots: []
  subject_scope: ""
  authority_state: ""
  allowed_population:
    - status
    - evidence_references
    - blockers
    - next_lane
    - held_actions
  prohibited_population:
    - executable_command
    - secret_value
    - direct_env_value
    - runtime_mutation_instruction
    - approval_claim
    - publication_claim
  output_boundary: review_only
```

## Directional Result

The directional result is not an approval. It is a focus decision:

```yaml
directional_focus_result:
  selected_template: DEP3.11_EXECUTION_WINDOW_AND_AUTHORITY_DECAY_PACKET
  reason:
    - execution_window_absent
    - authority_decay_rules_needed_before_execution_scope
    - deployment_status_not_authorized
  population_mode: evidence_references_only
  authority_created: false
  mutation_allowed: false
  next_state: review_template_ready_for_operator_decision
```

## Existing Snapshot Classes

| Snapshot Class | Existing Pattern | Authority Boundary |
| --- | --- | --- |
| Executive snapshot | summarizes current executive board | status and routing only |
| Register snapshot | captures governance register state | observability only |
| Audit event snapshot | captures event lineage | no audit system activation |
| Policy inheritance snapshot | captures inheritance posture | no override activation |
| Runtime/pre-mutation snapshot | captures bounded live runtime facts | read-only observation only |
| Future subject snapshot | captures another subject's current state | no cross-subject authority merge |

## Subject-Scoped Snapshot Model

Each snapshot should declare its subject explicitly:

```yaml
snapshot_subject:
  subject_type: operator | tenant | agent | system | runtime | approval_lane | external_party
  subject_id: ""
  tenant_scope: ""
  authority_scope: ""
  evidence_scope: ""
  current_as_of: ""
  expires_at: ""
  source_artifacts: []
```

No snapshot should be treated as current without:

- subject identity
- timestamp
- authority state
- evidence scope
- expiration or refresh rule
- non-authorization clause

## Federation Flow

```txt
load primary snapshot
    -> validate primary subject and authority state
    -> load comparison snapshot
    -> validate comparison subject and authority state
    -> normalize both into a comparison envelope
    -> detect alignment, drift, gaps, and conflicts
    -> produce federated snapshot board
    -> route next legitimate lane
```

## Federated Snapshot Board

A federated board should answer:

| Question | Purpose |
| --- | --- |
| What is my current authority state? | protect primary subject boundary |
| What is the other subject's current authority state? | protect comparison subject boundary |
| Are the states aligned? | identify operational coherence |
| Are there drift signals? | identify governance or runtime mismatch |
| Is one snapshot stale? | prevent stale truth from becoming current truth |
| Is there any cross-subject leakage? | protect tenant, actor, and authority isolation |
| What is the next legitimate lane? | route review without mutation |

## Allowed Output

Snapshot federation may produce:

- alignment matrix
- drift matrix
- authority comparison
- evidence completeness score
- stale snapshot warning
- conflict register
- next-lane recommendation
- executive summary
- selected template recommendation
- template focus envelope
- template population map

## Prohibited Output

Snapshot federation must not produce:

- merged authority
- inherited approval
- executable command line
- runtime mutation instruction
- secret value disclosure
- direct env value disclosure
- tenant activation
- pilot activation
- publication approval
- push approval
- tool grant
- autonomous execution permission
- approval-bearing template completion
- authority-bearing template field without separate approval

## Example

```yaml
snapshot_federation:
  primary_snapshot:
    subject_type: operator
    subject_id: cody_nunn
    authority_state: REVIEW_ONLY_DEP3.10A_NO_CHANGE_TARGET_IMAGE_APPROVED
  comparison_snapshot:
    subject_type: runtime
    subject_id: ca-nc-dev-sentinel
    authority_state: OBSERVED_READ_ONLY_DEP3.9R
  alignment:
    target_identity: aligned
    target_image: aligned
    execution_authority: absent_on_both
    mutation_authority: absent_on_both
  drift:
    - direct_env_value_handling_unresolved
    - execution_window_absent
  next_legitimate_lane: DEP3.11
  authority_merge_performed: false
```

## Why This Matters

This gives SentinelOS a higher-order governance capability:

```txt
one snapshot tells you current state
federated snapshots tell you whether current states agree
template focus tells you what to populate next
```

That is how the system can compare:

- operator intent against runtime truth
- tenant posture against platform posture
- buyer-safe claims against internal evidence
- agent state against tool authority
- deployment envelope against runtime facts
- approval lane against execution boundary

## Recommended Next Artifact

```txt
SNAP-FED-1.1 - Federated Snapshot Boundary Packet
```

Purpose:

- define the first approved subject pair
- define allowed source snapshots
- define comparison fields
- define template selection rules
- define template population boundaries
- define redaction requirements
- define staleness rules
- define next-lane routing

Initial safe subject pair:

```txt
operator executive snapshot <-> runtime snapshot
```

Recommended first comparison:

```txt
docs/EXECUTIVE_SNAPSHOT_2026-05-20.md
docs/DEP3_9R_SANITIZED_PRE_MUTATION_SNAPSHOT_RESULT_2026-05-20.md
```

## SNAP-FED-1.1 Recorded

```yaml
snap_fed_1_1:
  completed_artifact: docs/SNAP_FED_1_1_FEDERATED_SNAPSHOT_BOUNDARY_PACKET_2026-05-20.md
  primary_snapshot: docs/EXECUTIVE_SNAPSHOT_2026-05-20.md
  comparison_snapshot: docs/DEP3_9R_SANITIZED_PRE_MUTATION_SNAPSHOT_RESULT_2026-05-20.md
  hold_reference: docs/DEP3_9H_SNAPSHOT_AUTHORITY_HOLD_NOTE_2026-05-20.md
  subject_pair_defined: true
  continuity_infrastructure_refined: true
  state_anchor_rules_defined: true
  legitimacy_checkpoint_rules_defined: true
  authority_lineage_rules_defined: true
  reconciliation_rules_defined: true
  no_authority_merge_boundaries_defined: true
  freshness_rules_defined: true
  staleness_rules_defined: true
  redaction_rules_defined: true
  authority_merge_allowed: false
  next_review_lane: runtime_metrics_evidence_rules
  authority_created: false
```

## Non-Authorization Clause

This snapshot federation model defines governance doctrine only. It does not authorize deployment, runtime mutation, command execution, live Azure query execution, direct env value restoration, direct env value disclosure, secret value access, secret value disclosure, image build, image push, rollback execution, live post-deploy checks, external publication, endpoint publication, pilot activation, tenant activation, held-standard promotion, repository push, tool grants, certification claims, autonomous execution, destructive cleanup, cross-tenant context merge, or authority merge.
