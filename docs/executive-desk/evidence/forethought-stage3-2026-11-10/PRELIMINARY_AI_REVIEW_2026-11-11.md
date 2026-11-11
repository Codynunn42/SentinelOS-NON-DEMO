# Forethought Stage 3 — Preliminary AI-Assisted Technical Review

**Prepared:** 2026-11-11  
**Review type:** Internal AI-assisted review and direct reproduction  
**Independent human reviewer:** Not assigned  
**Disposition:** Findings were reproduced on the baseline and remediated in a separate revised candidate; independent verification remains outstanding.

This review is not an independent technical acceptance, a complete security audit, or verification against the missing C4 advisory. It was performed against the original hash-verified baseline snapshot. Findings below were reproduced locally with the baseline's `prepareEvidence` and `validatePacketInvariants` functions. Owner-authorized remediations and regression tests are recorded in `REVISED_CANDIDATE_CHANGELOG.md`; an independent reviewer still needs to verify the revised candidate.

The line references below refer to the preserved baseline source version; inserted checks mean current revised-source line numbers may differ.

## Findings

### F-01 — Cross-environment source excerpts are admitted

- **Severity:** Medium
- **Confidence:** 9/10
- **Locations:** [`discoveryLensCore.js`](../../../../apps/sentinel/src/forethought/discoveryLens/discoveryLensCore.js#L173), [`forethoughtAdapter.js`](../../../../apps/sentinel/src/forethought/discoveryLens/forethoughtAdapter.js#L234)
- **Observed behavior:** With a trusted request for `staging` and a same-tenant, same-release `production` record using the requested action tag, retrieval included the production record and excerpt. Adapter validation returned `valid: true`.
- **Why it matters:** The eligibility filter enforces tenant, sensitivity, and cutoff but not the request environment. Adapter provenance verifies that packet metadata matches the trusted source record, but does not reject a trusted source record from a different active request environment. This exposes cross-environment evidence in the packet and can contaminate downstream advisory reasoning.
- **Reproduction summary:** Create a `staging` trusted context and an otherwise eligible `production` source record with the proposed action's entity tag; call `prepareEvidence`, then `validatePacketInvariants` against that source snapshot. Observed result: record retrieved; validation valid with no errors.
- **Limit:** This reproduction demonstrates out-of-scope evidence inclusion, not that an execution or authorization boundary is bypassed.

### F-02 — Adapter accepts a forged support verdict for `failed` evidence

- **Severity:** Medium
- **Confidence:** 9/10
- **Locations:** [`discoveryLensCore.js`](../../../../apps/sentinel/src/forethought/discoveryLens/discoveryLensCore.js#L527), [`forethoughtAdapter.js`](../../../../apps/sentinel/src/forethought/discoveryLens/forethoughtAdapter.js#L479)
- **Observed behavior:** For a trusted record with status `failed`, changing the packet to `retrieval_status: "complete"` and setting its action review to `EVIDENCE_SUPPORTS_PREREQUISITES` with that record as support caused adapter validation to return `valid: true`.
- **Why it matters:** The core only emits support for verified evidence, but the adapter does not recompute the verdict or restrict supporting records to the exact permitted status. It rejects `held`, `unverified`, and `draft` but allows other non-supporting statuses such as `failed`.
- **Reproduction summary:** Prepare evidence for a trusted `failed` record, mutate the retrieval status and support verdict/IDs as above, and validate against the unchanged trusted snapshot. Observed result: validation valid with no errors.
- **Limit:** The adapter still requires `execution_allowed: false`; this is acceptance of a forged advisory verdict, not a direct execution-authorization bypass.

## Verification record

- Source hashes in `source-sha256.txt` matched at review time.
- Direct reproductions returned `valid: true` for both cases.
- Full repository test rerun: `test-output-2026-11-11.log`; **147 passing, 6 pending**, exit code `0`.
- The six pending tests are the Postgres receipt-ledger persistence/filter/signature tests shown as skipped in the captured Mocha output because the required PostgreSQL test environment was not provided.
- At the time of this baseline review, no implementation or test changes had been made. The later revised-candidate changes do not alter this baseline finding record.

## Reviewer action

An eligible independent reviewer should reproduce both findings against the exact snapshot, assess affected consumers and threat boundaries, recommend remediation, and record file-and-line findings and disposition. The original C4 advisory must still be recovered before anyone can claim candidate-to-advisory fidelity.
