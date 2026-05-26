# Phase 3 Operator Verification Runbook - 2026-05-23

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** operator verification routine  
**Posture:** repeatable checks before external use  
**Authority Created:** false  
**Runtime Mutation:** false  
**Deployment Authority:** false

## Artifact Decision

`[KEEP:PHASE3-OPERATOR-VERIFICATION-RUNBOOK-2026-05-23]`

This runbook defines the lightweight operator verification routine for the current proof lane.

It does not authorize deployment, runtime mutation, workflow edits, CI changes, branch protection enforcement, key changes, secret access, publication, custom-domain activation, billing, funnels, or pilot activation.

## When To Run

Run before:

- any meeting
- any live share
- any buyer-facing proof claim
- any executive readiness checkpoint

Run again if:

- the proof URL changes
- the active runtime changes
- CI or deployment status changes
- more than one operating day has passed since the last external-use refresh
- the meeting audience or claim scope changes

## Required Command

```bash
npm run check:meeting-stability
```

Required pass condition:

```yaml
health:
  statusCode: 200
  ok: true
proof:
  statusCode: 200
  ok: true
auditNoKey:
  statusCode: 401
  ok: true
meetingReady: true
failures: []
```

## Required Operator Review

After the command passes, confirm:

- the proof surface speaks business first and technical detail second
- no-key audit access remains blocked
- governance is framed as pre-execution control
- OwnerFi is described as the first active surface plane, not the whole system
- billing and funnels are not claimed as ready-to-go
- Contract Reclamation remains a sibling governed faceplane repo
- custom-domain work remains deferred
- deployment and runtime mutation are not implied

## Optional Presentation Confidence

Optional:

```txt
visual_browser_walkthrough
```

Purpose:

- confirm browser rendering
- rehearse narration
- reduce meeting-surface friction

Boundary:

- optional walkthrough does not replace the command check
- optional walkthrough does not create publication authority

## Failure Response

| Failure | Response |
| --- | --- |
| `/health` not 200 | stop external claim; investigate runtime health |
| `/proof` not 200 | stop external proof share; investigate proof surface |
| no-key audit not 401 | stop external share; investigate audit protection immediately |
| `meetingReady: false` | do not claim meeting-ready proof |
| DNS/network failure from local sandbox | rerun with approved network access before judging runtime |
| visual walkthrough issue | use command result for backend truth, but do not present until browser issue is understood |

## Operator Language

Approved:

```txt
The proof path has been refreshed and is responding. Health and proof are live, no-key audit access is blocked, and governance remains pre-execution.
```

Not approved:

```txt
This is deployed as a final production release.
Billing and funnels are ready.
Custom domain is ready.
Contract Reclamation is legal recovery.
The proof check authorizes runtime mutation.
```

## Current Runbook Status

```yaml
phase3_operator_verification_runbook:
  status: COMPLETE_CURRENT_PASS
  required_command: npm run check:meeting-stability
  latest_current_pass_result: PASSED
  optional_visual_walkthrough: OPTIONAL
  external_use_requires_rerun: true
  authority_created: false
```

## Recommended Phase 3 Next Actions

1. Create the receipt/audit lookup operator note as visibility-only.
2. Keep CI stabilization implementation waiting for operator decision.
3. Keep custom-domain and deployment work deferred.
4. Prepare Phase 3 closeout after the visibility note is complete.

## Next Selected Action

```yaml
selected_action: phase3_receipt_audit_lookup_operator_note
deliverable: docs/PHASE3_RECEIPT_AUDIT_LOOKUP_OPERATOR_NOTE_2026-05-23.md
authority_created: false
```
