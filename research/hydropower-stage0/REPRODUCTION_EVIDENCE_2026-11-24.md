# Stage 0 clean-room reproduction evidence — 2026-11-24

**Candidate:** `hydropower-stage0-review-candidate-2026-11-24`  
**Status:** Locally reproduced for independent review; not independently accepted

## Reproduction boundary

The seven files listed in the original package `SHA256SUMS` were copied into a
new, separate candidate directory before any verification command ran. The
candidate did not reuse an extracted original archive. It is a review artifact
created from the retained Stage 0 package, not a recovery of a November 22
archive.

The Nov 22 original-archive retrieval gap and external SynapseEco evaluator
provenance gap remain open.

## Environment

- Node.js: `v24.14.0`
- Platform: `Linux 6.8.0-1070-azure x86_64 GNU/Linux`
- Package schema: `stage0-canonical-dataset/v0.1`
- Dataset ID: `hydropower-stage0-synthetic-24h-001`

## Commands

From the candidate directory:

```sh
sha256sum -c SHA256SUMS
node --test tests/canonical-dataset.test.js
node run-stage0-matrix.js > stage0-results.json
```

The generated report was checked to require:

- `status: PASS`
- `caseCount: 25`
- `passCount: 25`
- `failCount: 0`
- deterministic `resultSha256`:
  `fec44c5c5abffebb9c790d05cb61acec7f550e18417064d48d0c18a5b07cc869`

## Observed results

- Package manifest: **7/7 verified**
- Node tests: **30 passed, 0 failed**
- Matrix: **25 passed, 0 failed**
- Dataset SHA-256:
  `6584a4b40c6dfe1c312903e54b6004061cc1cc30622dfa2e87e21cde0af3f66f`
- Deterministic result SHA-256:
  `fec44c5c5abffebb9c790d05cb61acec7f550e18417064d48d0c18a5b07cc869`
- Retained/generated `stage0-results.json` byte SHA-256:
  `ec7b5f48f82311ce984d7c63f1a82f5cda16d1dbcb9d17d137cfc547c5b52f97`

## Claim boundary

This evidence supports local reproducibility of the retained simulation-only
package. The independent-review decision must also apply
`DETERMINISTIC_CHECKS_AND_HOLD_CONDITIONS.md`; a successful local reproduction
alone does not override a mandatory HOLD trigger.

It does not:

- constitute independent human reproduction or acceptance;
- recover the missing November 22 Stage 0 archive or its original checksum
  sidecar;
- identify, recover, or validate an external SynapseEco evaluator snapshot;
- establish scientific, facility, safety, regulatory, HIL, or operational
  readiness;
- authorize any live connection or physical action.
