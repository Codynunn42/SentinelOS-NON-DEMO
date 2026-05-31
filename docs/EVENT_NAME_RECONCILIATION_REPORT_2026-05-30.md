# Event Name Reconciliation Report - 2026-05-30

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** event name reconciliation report  
**Selected Action:** `APPROVE_EVENT_NAME_RECONCILIATION_REPORT_ONLY`  
**State:** Report Only  
**Authority Created:** false

## Artifact Decision

```txt
[KEEP:EVENT-NAME-RECONCILIATION-REPORT-2026-05-30]
```

## Purpose

Improve Microsoft Sentinel Phase 1 taxonomy accuracy without changing runtime event emission.

This report reconciles event names for future KQL and detection design. It does not rename events, add aliases, edit code, query Log Analytics, mutate diagnostics, or create Microsoft Sentinel rules.

## Reconciliation Table

| Design Concept | Current Runtime Event Or Pattern | Current Source | Recommended Phase 1 Query Posture | Future Implementation Question |
| --- | --- | --- | --- | --- |
| auth misconfigured | `command.auth.misconfigured` | `apps/api/server.js` | query exact event | none |
| auth denied | `command.auth.denied` | `apps/api/server.js` | query exact event | none |
| invalid command JSON | `command.request.invalid_json` | `apps/api/server.js` | query exact event | none |
| governed command block | `blocked-path` | `apps/sentinel/src/shared/telemetryEventBuilder.js` | query `blocked-path` for `/v1/command` governance blocks | decide later whether alias `command.request.blocked` is needed |
| legacy command missing fields | `command.request.blocked` | `apps/api/server.js` legacy `/command` | query exact event only for legacy route | decide later whether legacy and governed routes should remain distinct |
| legacy command executed | `command.executed` | `apps/api/server.js` legacy `/command` | query exact event only for legacy route | decide later whether universal command execution event is needed |
| governed command success | handler-specific events and audit records | command handlers and audit logger | do not claim universal `command.executed` for `/v1/command` yet | define event alias or KQL correlation later if authorized |
| rate limit block | `command.rate_limited` | `apps/api/server.js` | classify as adjacent command-boundary event | decide later whether Phase 1 taxonomy should include it |
| passport signing failure | `command.passport.signing_failed` | `apps/api/server.js` | classify as adjacent command-boundary event | decide later whether Phase 1 taxonomy should include it |

## Recommended KQL Design Posture

```yaml
recommended_KQL_design_posture:
  use_exact_event_names_where_verified: true
  do_not_claim_universal_command_executed_for_v1_command_yet: true
  include_blocked_path_as_governance_block_evidence: true
  keep_legacy_command_route_distinct_from_v1_command_route: true
  classify_rate_limit_and_passport_failure_before_detection_claims: true
  live_query_execution_authorized: false
  authority_created: false
```

## Future Decisions

```yaml
future_decisions:
  - decide_if_blocked_path_should_remain_canonical_for_governed_blocks
  - decide_if_command_request_blocked_alias_is_needed
  - decide_if_universal_command_executed_event_is_needed_for_v1_command
  - classify_command_rate_limited_as_phase1_or_phase2_event
  - classify_command_passport_signing_failed_as_phase1_or_phase2_event
```

## Non-Authorization

This reconciliation report does not authorize event emission changes, event renaming, telemetry aliases, command handler changes, API contract changes, diagnostic settings, Microsoft Sentinel analytics rules, Log Analytics queries, runtime mutation, staging, committing, pushing, publication expansion, or external sharing.
