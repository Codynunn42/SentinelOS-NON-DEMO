# Stage 0 Canonical Synthetic Dataset and Deterministic Test Matrix v0.1

## Boundary

This package is **simulation-only, offline, synthetic, and non-operational**. It
does not connect to a facility, PLC, SCADA, gate, waterway, or live grid feed.
It does not authorize physical action and does not establish real-world energy,
emissions, environmental, safety, regulatory, or field readiness.

Sentinel is modeled as a governance layer. A human decision is distinct from
that layer. The simulated OT controller is an independent final gate for a
simulated action.

## Package

- `data/stage0-canonical-dataset-v0.1.json` — one versioned 24-hour dataset and
  25 deterministic scenarios
- `schema/stage0-canonical-dataset.schema.json` — structural contract
- `simulation/evaluate-stage0.js` — deterministic bounded evaluator
- `tests/canonical-dataset.test.js` — repeatability, evidence, and execution-boundary tests
- `run-stage0-matrix.js` — complete machine-readable matrix report
- `SHA256SUMS` — package integrity manifest

## Canonical scenario

The shared synthetic reservoir starts and ends at 5,000 m3, receives 150 m3/h,
provides a 50 m3/h environmental bypass, has a 3,500 m3 floor, a 6,500 m3
ceiling, and uses one 2,400 m3 / 200 kWh modeled generation obligation.

The DEC-011 baseline is 09:00-10:00. The primary alternative is
13:00-14:00. Additional canonical windows are 09:00-10:00 for no-improvement
testing and 16:00-17:00 for storage-ceiling failure testing.

The modeled emissions convention follows the existing DEC-011 assumption:
generation displaces marginal grid generation in its selected hour, and a
higher marginal factor represents more modeled emissions avoided. The result
is synthetic model output, not a measured reduction.

## Run

```sh
node --test research/hydropower-stage0/tests/canonical-dataset.test.js
node research/hydropower-stage0/run-stage0-matrix.js > stage0-results.json
sha256sum -c research/hydropower-stage0/SHA256SUMS
```

## Matrix coverage

The three existing DEC-011 cases remain canonical regressions:

1. `A - shift helps`
2. `B - water constraint blocks the shift`
3. `C - required input missing`

The matrix then adds:

- P-01 baseline validity
- P-02 no-improvement alternative
- P-03 modeled improvement
- P-04 valid human authorization plus OT acceptance
- P-05 multiple-candidate retention
- F-01 through F-17 from the supplied Stage 0 specification

## Acceptance criteria

- Identical canonical inputs and configuration produce identical analysis.
- Every rejected candidate retains its rejection reason.
- Storage, ending-state, bypass, and modeled-energy feasibility are evaluated
  before grid/emissions ranking.
- Missing or stale required evidence produces
  `INSUFFICIENT_EVIDENCE` and `HOLD`.
- No simulated execution occurs unless authorization is valid, the human
  decision is `APPROVE`, and simulated OT returns `ACCEPTED`.
- An OT rejection, unavailability, expired authorization, evidence change,
  human abort/rejection, or duplicate request prevents simulated execution.
- A missing receipt component prevents evidence-complete status.

No pass in this package is a claim of scientific, facility, safety, regulatory,
ALCF, or DOE acceptance.
