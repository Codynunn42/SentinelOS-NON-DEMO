# Gate REC-001: Recovery and Resilience

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud
**Mode:** resilience gate, local API recovery validation
**External Use:** engineering evidence only
**Authority Created:** false

## Objective

Validate graceful recovery from malformed input, policy-blocked requests, and clean process restart while governed execution remains available.

## Method

Exercise the local API server through the following sequence:

1. Health check before failure
2. Malformed JSON request to `/v1/command`
3. Health check after malformed request
4. Cross-tenant blocked request to `/v1/command`
5. Valid governed command after failure conditions
6. Clean server close and restart
7. Health check after restart
8. Valid governed command after restart

Execution command:

- `pnpm run check:rec-001`

## Expected Result

```yaml
gate: REC-001
invalid_json: 400_and_server_remains_healthy
cross_tenant_command: 403_tenant_mismatch
post_failure_valid_command: 200_executed_with_receipt
restart: healthy_after_restart_and_valid_command_still_executes
```

## Observed Result (Latest)

```yaml
timestamp: 2026-07-18T06:14:51Z
status: passed
scope: single_process_local_api_resilience_slice
```

## Evidence

- Script: `scripts/check-recovery-resilience.js`
- Report artifact: `docs/executive-desk/evidence/rec-001-recovery-resilience.json`
- Certification rollup: `docs/executive-desk/evidence/gate-certification-report.json`

## Pass/Fail Rule

- Pass:
  - malformed input is rejected without crashing the server
  - cross-tenant violation is blocked
  - a valid governed command still executes after failures
  - the server restarts and returns to healthy state
  - a valid governed command still executes after restart
- Fail:
  - any step above fails

## Reviewer

- `GATE_REVIEWER` environment variable (defaults to `unassigned`)

## Timestamp

- Captured in report artifact as ISO-8601 under `timestamp`

## Notes

This gate validates graceful recovery and restart behavior for the current local API architecture. It does not certify durable evidence persistence across process restarts.
