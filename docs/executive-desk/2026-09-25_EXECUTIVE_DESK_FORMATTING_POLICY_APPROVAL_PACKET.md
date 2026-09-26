# Executive Desk Formatting Policy Approval Packet — 2026-09-25

**Status:** `approval_packet_prepared_review_only`  
**Scope:** Executive-desk generated markdown outputs (weekly/daily/mob)  
**Prepared by:** Sentinel AI support lane  
**Owner:** Cody Nunn (Executive Desk)

## Purpose

This packet prepares an owner decision on generated-report formatting policy changes identified in:

- `docs/executive-desk/2026-09-25_SENTINEL_AI_WARNING_REVIEW_AND_FIX_RECOMMENDATIONS.md`

This packet does not authorize code mutation by itself.

## Decision Required

Approve one policy path for generated executive-desk markdown reports:

1. **Path A — Keep Current Canonical Wrapper (No format mutation)**
   - Keep governed metadata block and current renderer behavior.
   - Accept style/lint noise where it does not affect evidence integrity.

2. **Path B — Canonical Formatting Adjustment (Controlled mutation)**
   - Update report wrapper and/or completion markdown renderer for style alignment.
   - Preserve governance metadata semantics while normalizing markdown structure.

3. **Path C — Lint Policy Alignment (No renderer mutation)**
   - Keep current generated format.
   - Adjust lint policy/scoping so governed generated outputs are treated as canonical artifacts.

## Risk and Impact

- **Evidence integrity risk:** Low if metadata semantics are preserved.
- **Operational risk:** Medium if formatting changes are applied broadly without bounded review.
- **Review friction risk:** Medium if no action is taken and warning noise repeats weekly.
- **Authority risk:** Elevated only if formatting changes alter governance claims or approval language.

## Guardrails

Any approved execution must satisfy all guardrails:

- Preserve approval boundaries and evidence posture language.
- Preserve metadata meaning and traceability.
- Apply changes in bounded scope (`executive-desk` generators only).
- Re-run generation and evidence checks after mutation.
- Record before/after artifact comparison in dated evidence note.

## Proposed Execution Plan (If Approved)

1. Implement chosen policy path in generator/wrapper or lint policy.
2. Regenerate:
   - `docs/executive-desk/daily/<date>.md`
   - `docs/executive-desk/mob/<date>.md`
   - `docs/executive-desk/weekly/<week>.md`
3. Re-run markdown and evidence-link verification.
4. Publish closeout note with:
   - decision taken,
   - changed files,
   - residual warnings (if any),
   - explicit confirmation of no authority/evidence drift.

## Approval Record

- **Decision owner:** Cody Nunn
- **Decision date:** 2026-09-25
- **Approved path:** `PENDING_OWNER_SELECTION`
- **Approval status:** `PENDING`
- **Conditions:** `PENDING_OWNER_NOTES`

## Current State Snapshot

- Quick-win warning workflow updates are committed in `7301cf3`.
- Gated formatting policy remains intentionally deferred pending owner decision.
