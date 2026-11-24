# Stage 0 deterministic checks and HOLD conditions

**Candidate:** `hydropower-stage0-review-candidate-2026-11-24`  
**Decision type:** Independent review readiness for offline synthetic simulation

## Deterministic checks

All checks below are required. A reviewer must record the actual command,
result, hash, and any divergence; expected values are not evidence by
themselves.

| ID | Check | Required deterministic result | Evidence |
|---|---|---|---|
| D-01 | Archive integrity: `sha256sum -c ...tar.gz.sha256` | Exact candidate archive hash verifies | Archive checksum output |
| D-02 | Package integrity: `sha256sum -c SHA256SUMS` | 7 entries pass, 0 mismatches | Complete checksum output |
| D-03 | Dataset identity | ID `hydropower-stage0-synthetic-24h-001`, schema `stage0-canonical-dataset/v0.1`, status `SIMULATION_ONLY`, provenance `SYNTHETIC` | Dataset and reviewer output |
| D-04 | Dataset dimensions | 24 hourly inflow, bypass, spill, and marginal-factor values; boundaries 0 through 24; start inclusive/end exclusive | Test output and schema review |
| D-05 | Dataset hash | Canonical content excluding only `integrity` equals `6584a4b40c6dfe1c312903e54b6004061cc1cc30622dfa2e87e21cde0af3f66f` | Test and generated report |
| D-06 | Test repeatability | `node --test tests/canonical-dataset.test.js` completes with 30 passed, 0 failed | Complete test output |
| D-07 | Matrix completion | `node run-stage0-matrix.js` completes with 25 cases, 25 passed, 0 failed | Generated JSON and exit status |
| D-08 | Result identity | Deterministic `resultSha256` equals `fec44c5c5abffebb9c790d05cb61acec7f550e18417064d48d0c18a5b07cc869` | Generated report |
| D-09 | DEC-011 regressions | A, B, and C reproduce their documented outcomes without changing fixture identity | Per-case output |
| D-10 | Feasibility ordering | Storage floor/ceiling, ending storage, environmental bypass, and modeled energy are evaluated before emissions ranking | Code review and F-03 through F-06 |
| D-11 | Missing/stale evidence | Missing required evidence or stale/uncertain evidence yields insufficient evidence and does not rank emissions | F-01, F-02, F-11, C |
| D-12 | Rejection retention | Every infeasible candidate retains one or more machine-readable rejection codes and a first-boundary indicator where applicable | Generated per-case `candidateSummary` |
| D-13 | Human authority | No simulated execution occurs unless authorization is valid and human decision is `APPROVE` | P-04 and F-07/F-08/F-14/F-15 |
| D-14 | Simulated OT independence | Simulated execution occurs only after accepted simulated OT; rejection, unavailability, and fault produce HOLD | P-04 and F-09/F-10 |
| D-15 | Duplicate blocking | A duplicate execution request produces HOLD and `DUPLICATE_EXECUTION_BLOCKED` | F-16 |
| D-16 | Receipt completeness | Missing receipt components produce `EVIDENCE_INCOMPLETE` and are not evidence-complete acceptance | F-17 |
| D-17 | Claim boundary | Candidate remains synthetic, offline, and non-operational; no facility, safety, regulatory, scientific, ALCF, or SynapseEco product claim is implied | Dataset, runbook, reports, and reviewer finding |

## Runtime scenario dispositions

The deterministic evaluator distinguishes several fail-safe states:

- `HOLD`: execution is blocked by infeasibility, insufficient evidence,
  invalid/expired/mismatched authorization, duplicate execution, or simulated OT
  rejection/unavailability/fault.
- `HUMAN_REJECTED` / `HUMAN_ABORTED`: the human decision itself prevents
  simulated execution.
- `OPERATOR_REVIEW_REQUIRED`: analysis is retained for review, but authorization
  and/or human approval is not present.
- `EVIDENCE_INCOMPLETE`: simulated execution or recommendation must not be
  represented as evidence-complete because a required receipt component is
  missing.

An evaluator output other than `HOLD` does not automatically make the candidate
reviewable as `PASS`. The independent review disposition has additional
mandatory HOLD conditions below.

## Conditions that force review HOLD

The reviewer must select **HOLD** and must not select `ACCEPT` or
`ACCEPT WITH CONDITIONS` if any condition below is true.

### Evidence identity

- H-01: the candidate archive checksum is missing, mismatched, unverifiable, or
  different from the supplied sidecar.
- H-02: any entry in `SHA256SUMS` fails, is absent, or is modified after the
  reviewed run without reissuing the candidate identity.
- H-03: the executed files cannot be tied to the reviewed archive through the
  archive manifest and extraction record.
- H-04: the original Nov 22 archive is claimed as recovered, but no exact
  byte-identical artifact and matching original sidecar are available.

### Reproduction

- H-05: a required command does not complete, exits non-zero, is interrupted,
  or has missing output.
- H-06: the test count differs from 30 passed and 0 failed.
- H-07: the matrix differs from 25 passed and 0 failed.
- H-08: the generated dataset hash or deterministic result hash differs from
  D-05 or D-08.
- H-09: two runs from the same reviewed bytes do not produce the same
  deterministic result hash.
- H-10: expected and actual per-case outcomes or rejection-code arrays
  diverge.

### Safety, authority, and evidence behavior

- H-11: infeasibility, missing/stale evidence, uncertainty, or an environmental
  failure is allowed to proceed to emissions ranking.
- H-12: simulated execution occurs without valid authorization, human
  `APPROVE`, no duplicate, and accepted simulated OT.
- H-13: authorization expiry, evidence mismatch, duplicate execution, or
  simulated OT rejection/unavailability/fault does not block execution.
- H-14: receipt components are incomplete but the final result is represented
  as evidence-complete.
- H-15: a candidate rejection is omitted or lacks machine-readable rejection
  reasons.
- H-16: the implementation or documentation transfers human, Sentinel,
  SynapseEco, or simulated-OT authority across role boundaries.

### Review and external provenance

- H-17: no eligible independent reviewer is assigned, independence is not
  established, or the reviewer did not complete their own reproduction.
- H-18: the disposition is unsigned, unverifiable, or lacks attached command
  outputs and findings.
- H-19: the external SynapseEco evaluator source snapshot and matching integrity
  manifest are required for the claimed decision but remain unavailable or
  cannot be verified.
- H-20: the review claims scientific, facility, safety, regulatory, HIL,
  operational, deployment, live-data, or physical-control acceptance.
- H-21: a critical or major finding is open without a verified remediation and
  new candidate identity.

## Conditions allowing a bounded ACCEPT

A reviewer may select `ACCEPT — offline synthetic candidate only` only when:

- D-01 through D-17 pass;
- no H-01 through H-21 condition applies within the reviewed scope;
- the reviewer has independently reproduced the candidate;
- the review evidence is attributable and signed;
- every finding is closed or explicitly authorized as a condition by the named
  decision authority; and
- external SynapseEco evaluator acceptance is either outside the reviewed scope
  or separately supported by a verified evaluator snapshot and manifest.

Even then, acceptance is limited to this candidate's offline simulation
behavior. It creates no HIL, facility, physical, operational, deployment, or
scientific authorization.

## Conflict rule

If documentation, fixture expectations, implementation, and observed output
conflict, the review result is **HOLD**. Do not repair the conflict by choosing
the most favorable artifact. Record the conflict, assign remediation, and issue
a new candidate identity after changes.
