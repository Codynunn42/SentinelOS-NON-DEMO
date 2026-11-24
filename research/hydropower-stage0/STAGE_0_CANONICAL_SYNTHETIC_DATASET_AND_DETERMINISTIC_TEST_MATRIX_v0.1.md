# Stage 0 Canonical Synthetic Dataset and Deterministic Test Matrix v0.1

**Prepared:** November 22, 2026  
**Status:** Offline synthetic simulation baseline  
**Disposition:** Simulation only; no facility connection, live control,
operational approval, regulatory acceptance, or scientific validation.

## Purpose

This artifact expands the existing DEC-011 three-case replay into a bounded
Stage 0 baseline that exercises prediction/evaluation inputs, hard feasibility,
governed recommendation, human authorization, independent simulated OT
response, duplicate protection, post-action verification, and evidence
completeness.

It preserves the current DEC-011 cases A/B/C and adds P-01 through P-05 and
F-01 through F-17. The canonical machine-readable source is
[`data/stage0-canonical-dataset-v0.1.json`](./data/stage0-canonical-dataset-v0.1.json).

## Canonical dataset

| Field | Canonical value |
|---|---|
| Dataset ID | `hydropower-stage0-synthetic-24h-001` |
| Provenance | Synthetic; non-facility |
| Horizon / resolution | 24 hours / 60 minutes |
| Time zone | `America/Phoenix` |
| Starting / ending storage | 5,000 m3 / 5,000 m3 |
| Storage minimum / maximum | 3,500 m3 / 6,500 m3 |
| Hourly inflow | 150 m3/h |
| Environmental bypass | 50 m3/h |
| Spill | 0 m3/h |
| Turbine volume / modeled energy | 2,400 m3 / 200 kWh |
| Baseline window | 09:00-10:00 |
| Main alternative | 13:00-14:00 |
| Grid-emissions unit | kg CO2e/MWh, synthetic marginal factor |
| Grid data age limit | 60 minutes |
| Forecast uncertainty limit | 0.20 |
| Dataset checksum rule | SHA-256 over canonical JSON excluding only the `integrity` object |

All hourly arrays have exactly 24 values. The boundary convention is start hour
inclusive, end hour exclusive, with storage boundaries 0 through 24.

The modeled-emissions convention is inherited from DEC-011: a hydro generation
interval displaces marginal grid generation, so a higher synthetic factor yields
more **modeled avoided emissions**. The term is not an asserted real reduction.

## Expected workflow

`Observe` → `Forecast` → `Feasibility` → `SynapseEco Comparison` →
`Sentinel Governance` → `Human Decision` → `Independent Simulated OT` →
`Simulated Execution` → `Post-Action Verification` → `Evidence Receipt`

No step may borrow authority from another step. Forecasts are evidence;
SynapseEco is evaluative; Sentinel governs; the human decides; simulated OT
independently accepts or rejects; execution remains simulated; verification and
the receipt are separate outputs.

## Deterministic test matrix

| ID | Focus | Expected SynapseEco / Sentinel | Expected OT / execution / final disposition |
|---|---|---|---|
| A | Existing shift-helps regression | `MODELED_IMPROVEMENT` / `OPERATOR_REVIEW_REQUIRED` | not called / no / pending authorization |
| B | Existing storage-constraint regression | `INFEASIBLE` / `HOLD` | not called / no / infeasible |
| C | Existing missing-input regression | `INSUFFICIENT_EVIDENCE` / `HOLD` | not called / no / insufficient-evidence HOLD |
| P-01 | Baseline valid | `BASELINE_VALID` / `NO_ACTION` | not called / no / baseline verified |
| P-02 | Feasible no-improvement candidate | `NO_IMPROVEMENT_FOUND` / `NO_ACTION` | not called / no / no improvement |
| P-03 | Feasible modeled improvement | `MODELED_IMPROVEMENT` / `OPERATOR_REVIEW_REQUIRED` | not called / no / pending authorization |
| P-04 | Valid human approval and OT acceptance | `MODELED_IMPROVEMENT` / `RECOMMEND` | accepted / yes / executed verified |
| P-05 | Multiple candidate retention | `MODELED_IMPROVEMENT` / `OPERATOR_REVIEW_REQUIRED` | not called / no / pending authorization |
| F-01 | Missing inflow data | `INSUFFICIENT_EVIDENCE` / `HOLD` | not called / no / insufficient-evidence HOLD |
| F-02 | Stale grid data | `INSUFFICIENT_EVIDENCE` / `HOLD` | not called / no / insufficient-evidence HOLD |
| F-03 | Minimum-storage violation | `INFEASIBLE` / `HOLD` | not called / no / infeasible |
| F-04 | Maximum-storage violation | `INFEASIBLE` / `HOLD` | not called / no / infeasible |
| F-05 | Environmental bypass violation | `INFEASIBLE` / `HOLD` | not called / no / infeasible |
| F-06 | Terminal-storage failure | `INFEASIBLE` / `HOLD` | not called / no / infeasible |
| F-07 | Expired authorization | improvement retained / `HOLD` | not called / no / HOLD |
| F-08 | Evidence changed after approval | improvement retained / `HOLD` | not called / no / HOLD |
| F-09 | Simulated OT rejection | improvement retained / `HOLD` | rejected / no / HOLD |
| F-10 | Simulated OT unavailable | improvement retained / `HOLD` | unavailable / no / HOLD |
| F-11 | Forecast uncertainty above limit | `INSUFFICIENT_EVIDENCE` / `HOLD` | not called / no / insufficient-evidence HOLD |
| F-12 | Alternative yields less modeled avoided emissions | `NO_IMPROVEMENT_FOUND` / `NO_ACTION` | not called / no / no improvement |
| F-13 | Rebound removes apparent benefit | `NO_IMPROVEMENT_FOUND` / `NO_ACTION` | not called / no / no improvement |
| F-14 | Human rejects | improvement retained / `HUMAN_REJECTED` | not called / no / rejected by human |
| F-15 | Human aborts | improvement retained / `HUMAN_ABORTED` | not called / no / aborted by human |
| F-16 | Duplicate execution | improvement retained / `HOLD` | not called / no / HOLD |
| F-17 | Receipt component missing | improvement retained / `RECOMMEND` | accepted / yes / evidence incomplete |

## Required invariants

1. Identical data and configuration reproduce identical analytical outcomes.
2. Storage bounds, ending storage, environmental bypass, and modeled energy are
   checked before emissions ranking.
3. Missing or stale required evidence produces insufficient evidence and HOLD.
4. A rejected candidate remains in the result with one or more machine-readable
   rejection codes.
5. Green optimization cannot cure a safety, water, environmental, authority, or
   evidence failure.
6. Simulated execution occurs only when:
   - analysis is eligible;
   - authorization is valid for the evidence;
   - the human decision is `APPROVE`;
   - no duplicate is present;
   - simulated OT returns `ACCEPTED`.
7. An accepted request is not a completed run until post-action state and
   evidence-receipt completeness are verified.
8. Every executed scenario must retain an explicit result and a complete
   evidence receipt.

## Reproducibility commands

```sh
node --test research/hydropower-stage0/tests/canonical-dataset.test.js
node research/hydropower-stage0/run-stage0-matrix.js > stage0-results.json
sha256sum -c research/hydropower-stage0/SHA256SUMS
```

## Current result

The November 22, 2026 complete local rerun passed all **25 matrix cases** and
all **30 Node test assertions**, including two repeated evaluations per case,
checksum validation, rejection-reason retention, and the authorization/OT
execution invariant. All seven entries in the package `SHA256SUMS` manifest
also verified successfully.

Machine-readable output SHA-256:

`fec44c5c5abffebb9c790d05cb61acec7f550e18417064d48d0c18a5b07cc869`

This result establishes a deterministic offline simulation baseline only. It
does not validate an external SynapseEco evaluator, establish independent
review, or authorize a subsequent HIL, shadow, facility, or live-control stage.
