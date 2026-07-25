# Executive Desk Review - Cloudflare Route Decision

**Record ID:** EDSR-2026-07-24-005  
**Support item:** SUP-2026-07-24-001 / Cloudflare route decision  
**Service standard:** [WGSS-001](../../standards/WHITE_GLOVE_SERVICE_STANDARD.md)  
**Prepared by:** Evidence custodian  
**Review authority:** Cody Nunn, Executive Desk / Service Steward  
**Review date:** 2026-07-24  
**Record status:** Held; July 25 configuration exception returned for evidence

## Review Purpose

Prevent an alternate public route from being created or treated as production authority without a separate governed decision.

## Current State

| Field | Record |
| --- | --- |
| Need and outcome | Determine whether an alternate route is necessary after primary-path recovery is understood |
| Current status | Public DNS and local tunnel ingress configuration exist without recorded approval; route decision remains held |
| Impact | A public DNS surface exists but is not approved, validated, or accepted as a production endpoint; Azure remains the primary recovery path |
| Accountable owner | Open - Program Gate Council is a decision body, not a named individual owner |
| Next action | Reconcile authoritative DNS and route ownership without changing configuration |
| Escalation | Return the reconciliation packet to Cody before investigation expands or any configuration changes |

## Fact, Interpretation, and Recommendation

### Facts

- On July 24, the Cloudflare tunnel was observed healthy with one replica and no published routes.
- On July 25, public DNS returned Cloudflare-proxied A and AAAA records for `api.nunncorporation.com`.
- Local Cloudflare ingress configuration maps that hostname to `http://localhost:3000`.
- Read-only tunnel inventory reported four active connections; it did not identify authoritative DNS ownership or route history.
- The available evidence does not identify Cloudflare as the cause of Azure managed compute suspension.

### Interpretation

- Public DNS and connector health do not establish an approved, healthy, or accepted production endpoint.
- The July 24 no-route claim is superseded for current-state decisions by the July 25 exception record.

### Recommendation

- Maintain the hold while Azure recovery remains the primary path.
- Reconcile authoritative DNS record ownership, route target, history, and configuration authority before any new action.

## WGSS Review

| Commitment | State | Evidence or gap |
| --- | --- | --- |
| Listen before recommending | Satisfied | Concern about the tunnel and desired continuity are recorded |
| Understand before designing | Open | Public DNS and local ingress are observed, but authoritative ownership and route history are unresolved |
| Explain before implementing | Satisfied for hold only | Current implications and recommendation are explicit |
| Confirm before executing | Satisfied for hold only | Cody recorded `Held`; no route authority exists |
| Document before closing | Open | No final route decision or closure evidence exists |
| Follow through after delivery | Open | No route delivery or primary-path recovery outcome exists |
| Remain accountable | Open | Named accountable individual is not assigned |

## Executive Desk Decision

**Disposition:** Held  
**Conditions for reconsideration:** Demonstrated need, primary-path finding, named owner, architecture and security review, rollback, monitoring, and explicit approval.  
**Authorized scope:** Preserve evidence and the held decision; prepare the required reconciliation packet only under explicit authority.  
**Explicitly not authorized:** Public hostname mapping, route creation, tunnel mutation, production substitution, or acceptance.

## Next Steps

| Sequence | Action | Owner | Trigger | State |
| --- | --- | --- | --- | --- |
| 1 | Preserve the July 24 observation and July 25 exception evidence | Evidence custodian | Current | Complete |
| 2 | Assign named DNS and Cloudflare administrators | Executive Desk | Before reconciliation work | Not started |
| 3 | Prepare sanitized DNS ownership, route target, and history evidence | Assigned administrators | Explicit authority | Returned for evidence |
| 4 | Return for separate decision | Service Steward | Reconciliation packet complete | Blocked |

## Closure Review

**Closure status:** Not eligible  
**Reason:** The route is held, observed configuration lacks reconciled authority and history, and accountability and follow-through remain open.  
**Executive Desk closure sign-off:** Not issued
