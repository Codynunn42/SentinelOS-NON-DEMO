# Wait Or Refresh Gate - 2026-05-22

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** wait-or-refresh gate  
**Authority:** routing-only, no expansion approval

## Artifact Decision

```txt
[KEEP:WAIT-OR-REFRESH-GATE-2026-05-22]
```

## Purpose

Close the current sequence with a standing gate:

```txt
wait for room direction
or
rerun live refresh before external share
```

This is not a new build lane. It is a control point that prevents stale proof evidence, premature expansion, and buyer-facing overclaiming.

## Boundary

This gate does not authorize deployment, runtime mutation, command execution beyond pre-meeting verification scripts, live Azure management queries, secret access, endpoint publication, pilot activation, tenant activation, billing activation, funnel activation, buyer-facing publication, production certification, legal claims, recovery claims, repository push, tool grants, autonomous execution, authority merge, cross-tenant context merge, score-based permission, DEP3.23 activation, execution-window activation, file movement, file deletion, or destructive cleanup.

## Gate Rule

```yaml
wait_or_refresh_gate:
  default_posture: WAIT_FOR_ROOM_DIRECTION
  refresh_required_before:
    - external_meeting
    - live_share
    - buyer_facing_claim
    - endpoint_use_in_conversation
    - pilot_scope_discussion_with_live_proof
  refresh_not_required_for:
    - internal_review
    - document_reconciliation
    - narrative_rehearsal
    - held-state planning
  expansion_allowed_without_room_direction: false
  authority_created: false
```

## Refresh Commands

When the trigger exists, rerun:

```bash
npm run check:meeting-stability
npm run check:clean-proof-rehearsal
```

Required pass condition:

```yaml
required_pass_condition:
  health_status: 200
  proof_status: 200
  audit_no_key_status: 401
  clean_no_key_proof_rehearsal: passed
  no_api_key_header_sent: true
  authority_created: false
```

## Protected Truths

| Truth | Gate Treatment |
| --- | --- |
| live proof is real in recorded evidence | preserve as evidence, not permanent freshness |
| proof must be refreshed before external use | rerun verification before future live share |
| proof surface speaks business first | lead with workflow, approval stop, and audit visibility |
| OwnerFi is first active surface plane | avoid whole-system framing |
| governance is pre-execution control | explain block-before-handler behavior |
| billing and funnels are not ready-to-go | keep held; do not imply activation |
| Contract Reclamation is sibling repo | do not merge into SentinelOS core |
| next work avoids expansion | wait for room/operator direction |

## Allowed While Waiting

- rehearse the business-first narrative
- review the buyer-safe explanation packet internally
- preserve proof and governance docs
- prepare to rerun the refresh checks
- capture meeting questions after they happen
- draft bounded pilot scope only if requested

## Prohibited While Waiting

- add new product surfaces
- activate billing or funnels
- publish endpoint claims
- promote Contract Reclamation into legal advice or recovery positioning
- represent OwnerFi as the whole platform
- treat prior refresh as permanently current
- reopen deployment or runtime mutation
- convert metrics, snapshots, or review artifacts into authority

## Current State

```yaml
current_state:
  date: 2026-05-22
  selected_gate: wait_for_room_direction_or_rerun_refresh_before_share
  last_live_refresh: docs/PRE_MEETING_LIVE_REFRESH_2026-05-21.md
  last_operator_direction: docs/MEETING_OR_OPERATOR_DIRECTION_2026-05-22.md
  current_posture: HOLD_EXPANSION
  next_external_use_requires_refresh: true
  meeting_ready_claim_without_refresh: prohibited
  billing_claims: held
  funnel_claims: held
  publication_claims: held
  deployment_authorized: false
  runtime_mutation_authorized: false
  authority_created: false
```

## Next Action

```yaml
next_action:
  selected_action: hold_until_room_direction
  if_external_share_is_scheduled:
    - rerun npm run check:meeting-stability
    - rerun npm run check:clean-proof-rehearsal
    - record a new dated pre-meeting refresh packet
  if_room_requests_pilot:
    - prepare bounded pilot scope draft only
    - preserve no activation authority
  authority_created: false
```

## Non-Authorization Clause

This packet records a wait-or-refresh gate only. It does not authorize deployment, runtime mutation, command execution beyond pre-meeting verification scripts, live Azure management queries, secret access, endpoint publication, pilot activation, tenant activation, billing activation, funnel activation, buyer-facing publication, production certification, legal claims, recovery claims, repository push, tool grants, autonomous execution, authority merge, cross-tenant context merge, score-based permission, DEP3.23 activation, execution-window activation, file movement, file deletion, or destructive cleanup.
