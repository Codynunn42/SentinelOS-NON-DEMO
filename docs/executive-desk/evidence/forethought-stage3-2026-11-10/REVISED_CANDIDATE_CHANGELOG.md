# Forethought Stage 3 — Revised Candidate Changelog

**Prepared:** 2026-11-11  
**Baseline retained:** `forethought-source-snapshot.tar.gz`  
**Revised snapshot:** `forethought-source-snapshot-revised.tar.gz`  
**Revised snapshot SHA-256:** `63baba810724ab6e152cdfa4b6e9f21f95e167bd9f63f9e8f850bdbdd3522519`

## Changes authorized by owner

1. **Environment scoping:** Retrieval now admits records whose environment matches the trusted request or is the explicit wildcard `all`. A specifically different environment (for example, `production` evidence in a `staging` request) is excluded. Adapter validation independently rejects such cross-environment records. The existing explicit `all` behavior remains for global holds and other explicitly global evidence.
2. **Support status validation:** The adapter now accepts a supporting record only when its trusted status is exactly `fixture_verified`, matching the core's support rule. Other statuses, including `failed`, are rejected.
3. **Regression coverage:** Added tests for retrieval exclusion, adapter-boundary rejection, and forged support citing `failed` evidence. The existing Stage 3 acceptance suite continues to exercise global release holds.

Implementation anchors: [`discoveryLensCore.js`](../../../../apps/sentinel/src/forethought/discoveryLens/discoveryLensCore.js#L174), [`forethoughtAdapter.js`](../../../../apps/sentinel/src/forethought/discoveryLens/forethoughtAdapter.js#L241) and [`forethoughtAdapter.js`](../../../../apps/sentinel/src/forethought/discoveryLens/forethoughtAdapter.js#L447).

The original baseline snapshot and its original run records are retained unchanged. The new snapshot is a separate revised candidate; it is not a commit, deployment, independent review, or acceptance.

## Verification

- The new regressions failed against the baseline as intended: 6 passing, 3 failing before the fixes.
- Forethought invariant regression tests after fixes: **9 passing**.
- Standalone Stage 3 harness: **42/42 probes reported passing**.
- Full repository test command `pnpm test`: **150 passing, 6 pending**, exit code `0`; see `test-output-revised-2026-11-11.log` and `test-run-metadata-revised-2026-11-11.txt`.
- Three PostgreSQL receipt-ledger persistence tests remain pending because `RECEIPT_LEDGER_TEST_DATABASE_URL` was not set. Three additional in-memory receipt-ledger tests conditionally skipped because they received no persisted records or the ledger did not expose a signature-verification method. All six remain pending, not passed.
- `revised-source-sha256.txt` records the revised source/configuration file hashes; `SHA256SUMS` covers the revised archive and report files.
- The revised source was copied into a clean worktree based on `origin/main` at `e1371a6a8d8e9f574e8703196061db359fe160c6`, with unrelated local changes excluded. A fresh `pnpm test` there reported **124 passing, 3 pending**, exit code `0`; the Stage 3 suite programmatically verified all 42 acceptance and regression tests. See `test-output-review-branch.log` and `test-run-metadata-review-branch.txt`. This is not hosted CI.
- The earlier **150 passing, 6 pending** result was from the original dirty checkout and is retained as historical local evidence only. It is not the test count for the isolated review candidate.

## Remaining gates

- No independent reviewer has verified the fixes.
- The original C4 advisory is still unavailable, so advisory fidelity cannot be established.
- No hosted CI run exists yet for this revised candidate.
- No deployment or operational integration was performed.
- HOLD remains in effect; no acceptance or governance disposition changed.
