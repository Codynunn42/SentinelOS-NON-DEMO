# Gate SEC-001: Hosted Authentication Enforcement

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud
**Mode:** security gate, hosted endpoint validation
**External Use:** allowed as engineering evidence
**Authority Created:** false

## Objective

Verify that hosted authentication enforcement is active on `POST /api/control/execute` and that only valid credentials are accepted.

## Method

Run a three-case credential probe against the hosted execute endpoint:

1. No credentials
2. Invalid credentials
3. Valid credentials (when `SENTINEL_AI_API_KEY` is available)

Execution command:

- `pnpm run check:sec-001`
- `pnpm run check:sec-001:strict`

## Expected Result

```yaml
gate: SEC-001
no_credentials: 401_or_403
invalid_credentials: 401_or_403
valid_credentials: 200
strict_mode_behavior: fail_if_expectation_not_met
```

## Observed Result (Latest)

```yaml
timestamp: 2026-07-18T05:31:54Z
no_credentials: 200
invalid_credentials: 200
valid_credentials: not_evaluated
api_key_loaded: false
strict_mode: off
gate_result: partial_functional_only
```

## Evidence

- Script: `scripts/check-hosted-auth-enforcement.js`
- Report artifact: `docs/executive-desk/evidence/sec-001-auth-enforcement.json`
- Connectivity milestone: `docs/executive-desk/evidence/2026-07-18-hosted-sentinel-connectivity.md`

## Pass/Fail Rule

- Pass (strict):
  - no credentials returns 401 or 403
  - invalid credentials returns 401 or 403
  - valid credentials returns 200 (when key case is executed)
- Fail (strict): any deviation from the matrix above.

## Reviewer

- `GATE_REVIEWER` environment variable (defaults to `unassigned`)

## Timestamp

- Captured in report artifact as ISO-8601 under `timestamp`

## Notes

This gate validates authentication enforcement behavior only. It does not replace authorization, governance, or evidence gates. Use this gate before performance and scale certifications.
