# Gate PER-001: Performance SLO

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud
**Mode:** performance gate, synthetic department-scale validation
**External Use:** engineering evidence only
**Authority Created:** false

## Objective

Verify that synthetic department-scale faceplane load remains within approved latency and throughput SLO ranges while governance and evidence invariants remain intact.

## Method

Run the faceplane department scenario across three scale profiles:

1. 10 virtual operators
2. 100 virtual operators
3. 1000 virtual operators

Execution command:

- `pnpm run check:per-001`

## Expected Result

```yaml
gate: PER-001
profiles:
  - label: scale-10
    max_p95_mission_ms: 25
    max_p99_mission_ms: 50
    min_throughput_commands_per_second: 10
  - label: scale-100
    max_p95_mission_ms: 50
    max_p99_mission_ms: 100
    min_throughput_commands_per_second: 100
  - label: scale-1000
    max_p95_mission_ms: 100
    max_p99_mission_ms: 200
    min_throughput_commands_per_second: 500
governance_invariants:
  - faceplane_count_remains_10
  - scenario_commands_match_faceplane_count_times_commands_per_run
  - load_commands_match_virtual_operators_times_commands_per_run
  - approvals_plus_blocked_does_not_exceed_load_commands
  - required_checklist_items_remain_verified
```

## Observed Result (Latest)

```yaml
timestamp: 2026-07-18T06:10:16Z
scale_10: passed
scale_100: passed
scale_1000: passed
gate_result: passed
synthetic_only: true
```

## Evidence

- Script: `scripts/check-performance-slo.js`
- Scenario engine: `scripts/run-faceplane-department-scenario.js`
- Report artifact: `docs/executive-desk/evidence/per-001-performance-slo.json`
- Certification rollup: `docs/executive-desk/evidence/gate-certification-report.json`

## Pass/Fail Rule

- Pass:
  - every scale profile meets its SLO thresholds
  - every governance invariant holds
  - required checklist items remain verified
- Fail:
  - any profile breaches latency or throughput thresholds
  - any invariant breaks
  - scenario execution fails or evidence is missing

## Reviewer

- `GATE_REVIEWER` environment variable (defaults to `unassigned`)

## Timestamp

- Captured in report artifact as ISO-8601 under `timestamp`

## Notes

This gate is synthetic and single-process. It does not certify hosted, distributed, or production performance. Use it to prove repeatable engineering posture before adding hosted SLO and scale gates.
