# Stage 0 independent reviewer runbook

**Review candidate date:** 2026-11-24  
**Expected candidate root:** extracted `hydropower-stage0-review-candidate-2026-11-24`

## 1. Establish scope

Review only the offline, synthetic, simulation-only candidate. Do not treat it
as a physical-control, facility, safety, regulatory, SynapseEco product, or
ALCF acceptance package.

The proposed review is for:

- canonical dataset structure and integrity;
- deterministic evaluator behavior for all 25 cases;
- rejection ordering and retained rejection reasons;
- authorization, human-decision, and simulated-OT execution gates;
- reproducibility from the candidate files;
- evidence-contract completeness and stated limitations.

## 2. Verify before extraction

From the directory containing the archive:

```sh
sha256sum -c hydropower-stage0-review-candidate-2026-11-24.tar.gz.sha256
tar -xzf hydropower-stage0-review-candidate-2026-11-24.tar.gz
cd hydropower-stage0-review-candidate-2026-11-24
```

Do not continue if the archive checksum fails.

## 3. Verify candidate inputs

```sh
sha256sum -c SHA256SUMS
node --version
uname -a
node --test tests/canonical-dataset.test.js
node run-stage0-matrix.js > reviewer-stage0-results.json
```

Expected local results:

- original package manifest: 7/7 checks;
- tests: 30 passed, 0 failed;
- matrix: 25 passed, 0 failed;
- dataset SHA-256:
  `6584a4b40c6dfe1c312903e54b6004061cc1cc30622dfa2e87e21cde0af3f66f`;
- deterministic result SHA-256:
  `fec44c5c5abffebb9c790d05cb61acec7f550e18417064d48d0c18a5b07cc869`.

Inspect the generated result:

```sh
node -e "const r=require('./reviewer-stage0-results.json'); console.log(JSON.stringify({status:r.status,caseCount:r.caseCount,passCount:r.passCount,failCount:r.failCount,datasetSha256:r.datasetSha256,resultSha256:r.resultSha256}, null, 2));"
```

Record actual tool output; do not infer a pass from this runbook.

## 4. Review the evidence contract

Use
[`DETERMINISTIC_CHECKS_AND_HOLD_CONDITIONS.md`](DETERMINISTIC_CHECKS_AND_HOLD_CONDITIONS.md)
as the controlling reviewer checklist. Confirm or document findings for each
criterion:

- [ ] Candidate archive checksum and original package manifest verify.
- [ ] Dataset identity and synthetic provenance are clear.
- [ ] All 25 cases execute deterministically.
- [ ] DEC-011 cases A/B/C remain represented.
- [ ] Feasibility precedes emissions ranking.
- [ ] Missing/stale evidence fails closed.
- [ ] Human authorization and simulated-OT acceptance are independently gated.
- [ ] Rejected candidates retain explicit reasons.
- [ ] Execution and receipt behavior is bounded as documented.
- [ ] Output distinguishes deterministic result identity from file-byte identity.
- [ ] Missing Nov 22 original archive is explicitly treated as a provenance gap.
- [ ] External SynapseEco evaluator provenance is explicitly unresolved.
- [ ] No prohibited scientific, facility, safety, or operational claim is made.

Treat every `H-01` through `H-21` trigger in that document as a mandatory review
HOLD. In particular, `EVIDENCE_INCOMPLETE` in the simulator is a distinct
runtime disposition but still forces the review HOLD when the reviewer is asked
to establish evidence-complete acceptance.

## 5. Record reproduction evidence

Capture:

- reviewer name and affiliation/eligibility basis;
- review date and timezone;
- platform and Node.js version;
- archive and package checksum results;
- test and matrix commands with complete outcome;
- generated result and file hashes;
- divergences, findings, and remediation requests.

## 6. Complete disposition

Use `REVIEW_DISPOSITION_TEMPLATE.md`. A review cannot close the external
SynapseEco provenance item unless the exact evaluator source snapshot and its
matching manifest are supplied and separately verified.

Do not backfill a signature, reviewer identity, approval, or external-evaluator
claim on the reviewer's behalf.
