# SentinelOS Demo Reliability Packet - 2026-05-15

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[KEEP:DEMO-RELIABILITY-PACKET]
```

## Purpose

Keep the demo narrow, reliable, and aligned to governed deal execution.

## Demo Spine

```txt
submit deal
-> block execution
-> show why
-> score / signal
-> approve
-> execute
-> activity and audit
```

Do not add new proof cases during the hardening phase.

## Opening Line

```txt
SentinelOS is a governed execution operating framework.
We do not replace your system.
We coordinate what your system is allowed to do through policy, approval, and audit.
```

## What To Show

Show one governed command attempted, blocked until approval, and preserved in audit.

Primary surfaces:

```txt
/health
/proof
/mission-control
/v1/command
/v1/audit
```

Primary proof path:

```txt
application.submit -> deal.execute
```

## What The Block Means

The block is the product working.

Say:

```txt
The system blocked deal execution because approval is required.
That is the product: SentinelOS checks authorization before execution.
```

## Reliability Checks Before Demo

Run:

```bash
curl -sS https://ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io/health
curl -sS https://nunncorporation.com/api/status
pnpm run check:execution-integrity
pnpm run check:policy
pnpm run check:approval-bottleneck
```

Expected:

```txt
health/status: ok or connected
execution integrity: passed
policy: passed
approval bottleneck: passed
```

## Guardrails

Do not:

- start by explaining all architecture
- show more than one proof case
- bypass the approval gate
- claim government deployment as active
- claim production-grade trust before secret and IaC reconciliation
- make the customer feel they must replace their platform

## If Something Fails

Use this posture:

```txt
pause -> classify -> preserve -> explain -> do not improvise runtime changes
```

If live proof is unavailable, fall back to documented evidence:

- `docs/PHASE1_LIVE_VERIFICATION_2026-05-15.md`
- `docs/INFRASTRUCTURE_TRUTH_RECONCILIATION_2026-05-15.md`
- `runtime/mock-results/`

Do not force a live mutation during a demo.

## Source Documents

- `docs/SENTINELOS_DEMO_PACKAGE_V2.md`
- `docs/SENTINELOS_LIVE_DEMO_SCRIPT_V2.md`
- `docs/SENTINELOS_PROOF_SHEET_V2.md`
- `docs/PROOF_CASE_GOVERNED_DEAL_EXECUTION_V2.md`
- `docs/GOVERNED_BLOCK_DEMO_MOMENT.md`
