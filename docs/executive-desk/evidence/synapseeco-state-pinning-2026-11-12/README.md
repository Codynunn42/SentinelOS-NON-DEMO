# SynapseEco state-pinning and PR-stack consolidation evidence

Prepared November 12, 2026. Research/review only. GOV-001 Conditional;
GOV-002 HOLD; GOV-006 verification outstanding. Independent human reviewer
assignment, source-provenance disposition and operational approval remain open.

## Exact source identity

- Original PR #74 head: `7e7a1da592015b5b7a050febc5a1b79365058171`.
- Updated PR #73 head: `39ee311273e41f76a9373707b4fc94a5595f5e5d`,
  including source correction `8133d0897a9920f340cf1e7c05f619d98c1ad583`.
- Non-rewriting stack merge: `53c950f` (both PR histories retained).
- Tested correction: `f1945bd9df5f4e52a12cabfe99bb76dd73e790e3`.
- `source-sha256.txt` pins the code, tests, fixtures, package and lockfile.
  `run-metadata.txt` records the tested commit, checkout, runtime, commands,
  start/end UTC times and exit codes. `SHA256SUMS` identifies this packet.

No main-branch merge, force-push, deployment, paid provisioning or gate advancement
is part of this correction. The shared-source suite retains all six focused
PR #73 cases and both PR #74 cases, totaling 37 C4/bridge tests. The canonical
version-binding logic and per-record content/hold checks are preserved.

## Findings and remediation

The pre-fix regressions reproduced four failures: coordinated content/policy
mutation after first C4 intake, independently valid but different Lens snapshots,
independently valid but different principals, and a 1 ms advancing clock.

The job now snapshots its request and pins the trusted principal, full Lens
snapshot, per-source policies and artifact digest/content at first authorized
intake. Every subsequent check re-fetches live adapter state and compares it
with immutable copies. The existing C4 authorization-before-read order remains
in place; no preliminary unguarded store read was added. Any observed identity
drift discards domain output: `BLOCKED`, domain `INSUFFICIENT_EVIDENCE`, code
`STATE_CHANGED_BEFORE_RELEASE`, without metrics or citations.

The simulation anchor is sampled once at job entry and validated as a trusted
UTC instant. Evaluation uses that anchor, while C4 freshness and docking
expiry/revocation still use live clocks. Regressions prove expiry is not frozen
at either the docking or evidence boundary. The unchanged standalone evaluator
continues to reject genuinely displaced forecast horizons.

These are synchronous adapter checks, not production isolation or atomic-store
semantics. Unobserved change-and-revert between reads remains outside this
contract. Real identity/registry/store implementations and independent review
remain prerequisites for operational consideration.

## Retained validation

All retained final commands exited 0 using Node `v24.14.0`, pnpm `10.33.4`,
Linux x64:

| Command | Observed result |
|---|---|
| `pnpm test` | 150 passing, 3 pending |
| `pnpm run check:synapseeco-research` | 25 passing |
| `node --test tests/forethoughtAdvisory/advisory.cases.cjs tests/forethoughtAdvisory/bridge.cases.cjs` | 37 passing, 0 failing |
| `pnpm run check:executive-desk:types` | Passed |
| `pnpm run check:deployment-gate` | 7 contract tests and wiring check passed; no deployment |
| `pnpm run benchmark:synapseeco-research` | 500 synthetic calls; semantic repeatability passed |

The full suite still programmatically verifies all 42 Stage 3 probes. The
37-case Node subprocess wrapper counts once in the 150 Mocha passes; do not
add the counts together. The three pending receipt-ledger tests remain pending.
An initial configured test attempt could not find Mocha; restoring dependencies
with `pnpm install --frozen-lockfile` resolved it without manifest changes.
Test-generated `.data/closeout-state.json` changes are excluded from commits.
Editor diagnostics were unavailable; executable tests, syntax checks and the
configured TypeScript check supplied validation instead.

The fresh benchmark retains 300 modeled improvements and 50 each blocked,
insufficient, infeasible and no-improvement outcomes. These remain synthetic
model results, not realized savings. Performance overhead from additional state
checks is included; no speedup, energy or carbon measurement is claimed.
The benchmark script's `base` field is its historical ancestry label, not the
tested source identity: use the commit above and this source manifest.
Its generated files were moved into this dated packet and the original
November 11 benchmark, samples and sample packet were restored unchanged.

## Hosted checks and review boundary

PR #73 exact-head CI run
[43128499879](https://github.com/Codynunn42/SentinelOS-NON-DEMO/actions/runs/43128499879)
passed at `39ee311273e41f76a9373707b4fc94a5595f5e5d`, reporting 125 passing,
3 pending and 42 Stage 3 probes. Its CodeQL checks passed; Macroscope skipped.
PR #74 needs separate exact-head hosted verification after this packet is
published. Local results and PR #73 checks do not substitute for that run.

The packet is eligible for technical review, not final acceptance. Original
advisory reconciliation/provenance disposition, significant-finding resolution,
required exact-head hosted CI and independent human review are still separate
acceptance requirements. The Microsoft agenda source remains unidentified.
