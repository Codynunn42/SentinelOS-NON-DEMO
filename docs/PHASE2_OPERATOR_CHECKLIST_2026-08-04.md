# Phase 2 Operator Checklist - 2026-08-04

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud
**Mode:** Phase 2 governed verification
**Posture:** scoped, owner-driven, evidence-based

## 1. Keep readiness checks in the pre-demo runbook

- Preserve the current OwnerFi proof path as the primary demo surface.
- Treat the pre-demo runbook as a verification routine, not an authority grant.
- Include the following checks in routine pre-demo or pre-share runs:
  - `npm run check:proof-ui-flow`
  - `npm run check:openai-connection-readiness`
  - `npm run check:openai-live-smoke`
  - `npm run check:openai-live-smoke:high-risk`
  - `npm run check:receipts`
  - `npm run check:operator-escalation`

## 2. Review new docs and scripts for canonical status

- Review new governance docs, vendor onboarding assets, Arizona SPO layout assets, and new check scripts in grouped batches.
- Do not streamline or promote them yet.
- If no owner is assigned, keep them in review-only status for this pass.
- Do not treat review completion as authority creation.

## 3. Hold broad cleanup and deduplication

- Do not delete, rename, or merge files during this pass unless an owner explicitly confirms the canonical target.
- Keep the current working tree intact while the canonical owner is being determined.
- Preserve current evidence and runbook artifacts until the canonical lane is confirmed.

## 4. Preserve the current evidence-based posture

- Public signing proxy health is verified.
- SentinelOS downstream operational readiness remains unverified.
- Do not declare full operational readiness yet.
- Keep the message short and business-facing: OwnerFi owns brand, workflows, and data; SentinelOS enables scaling without rebuilding.
- Continue to collect downstream evidence for receipts, audit artifacts, and operator escalation handling.
- Keep the audit-artifact lane in the runbook with:
  - `npm run check:audit-stream`
  - `npm run check:execution-integrity`
- Both checks completed successfully in the current pass and are now part of the evidence record.

## Phase 2 Closeout

- Phase 2 is complete for the current evidence lane: proof flow, readiness, receipt lookup, operator escalation, audit stream, and execution integrity were verified.
- The current posture remains conservative and evidence-based: verified local checks are in place, but broader broker and end-to-end operational claims remain open.
- Preserve this stance in all briefings and handoffs: do not overclaim readiness beyond the validated scope.
- The next lane is broker acknowledgement and end-to-end validation, not broad operational declaration.
