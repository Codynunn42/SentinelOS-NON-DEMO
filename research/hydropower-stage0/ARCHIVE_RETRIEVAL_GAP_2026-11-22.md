# Stage 0 archive retrieval gap — 2026-11-22

**Recorded:** 2026-11-24  
**Scope:** `research/hydropower-stage0` package produced in the November 22
session.

## Retrieval result

The November 22 Stage 0 package files and their integrity manifest are present in
the working tree. The Stage 0 matrix result is also retained in the original
Copilot session artifact storage.

The requested Nov 22 Stage 0 package archive and a matching archive-level
checksum sidecar were not found in:

- the current repository working tree;
- the original November 22 session's retained artifact files;
- the other locally retained Copilot session artifact files.

No archive was reconstructed from current files because that would create a new
archive dated for the retrieval record, not recover the original byte stream.

## Retained evidence

The package directory contains seven files covered by `SHA256SUMS`; all seven
checks pass. The retained matrix result reports deterministic `resultSha256`
`fec44c5c5abffebb9c790d05cb61acec7f550e18417064d48d0c18a5b07cc869`; the
retained JSON file's byte-level SHA-256 is
`ec7b5f48f82311ce984d7c63f1a82f5cda16d1dbcb9d17d137cfc547c5b52f97`. The
November 22 local verification recorded 30/30 tests and 25/25 matrix cases.

These retained files establish the current package's local integrity and the
session's reported result. They do not establish the identity or integrity of a
missing original Stage 0 archive.

`hydropower-stage0-review-candidate-2026-11-24.tar.gz` is a newly generated
review candidate with a newly generated checksum sidecar. It must not be treated
as a byte-for-byte recovery of the missing November 22 archive.

## Record boundary

- This gap does not close Stage 0 source/archive provenance.
- It does not identify or recover an external SynapseEco evaluator snapshot.
- It does not independently reproduce the 25 matrix cases.
- It does not assign an independent reviewer or record a signed disposition.
- The original Stage 0 archive and archive checksum sidecar remain unavailable
  pending a new recovery lead.
