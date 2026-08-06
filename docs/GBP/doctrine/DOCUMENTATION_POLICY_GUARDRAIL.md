# Documentation Policy Guardrail

## Purpose

Define how documentation is classified and maintained so doctrine and evidence do not compete as sources of truth.

## Directory Roles

### `docs/GBP/` — Canonical Doctrine

Use for living architecture, governance doctrine, and operating specifications.

Rules:

- Canonical source for current policy and architecture.
- Updated through normal review and merge workflow.
- Referenced by implementation docs and operating procedures.

### `docs/releases/` — Release Evidence

Use for immutable release records, verification outputs, and historical artifacts.

Rules:

- Evidence of what happened at a point in time.
- Not a replacement for doctrine.
- Corrections should be additive (append note/new artifact), not silent rewrites.

## Canonical vs Evidence Rule

If a document defines **how the system should operate**, it belongs in `docs/GBP/`.  
If a document records **what was verified/released**, it belongs in `docs/releases/`.

## Draft Handling

Drafts should either:

- live next to the canonical target with a clear suffix (example: `.release-draft.md`) while under review, then be merged/removed, or
- remain outside canonical paths until approved.

## Naming and Linking

- Use stable, descriptive filenames (avoid placeholder tokens in canonical docs).
- Prefer relative links inside the same folder set.
- Keep one canonical file per doctrine topic (no competing duplicates).

## Change Control

- Doctrine updates: commit with rationale and source alignment.
- Release evidence: commit as historical record tied to gates/releases.
- When promoting release material into doctrine, move content intentionally and update crosswalk references.
