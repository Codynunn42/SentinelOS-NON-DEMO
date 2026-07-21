# Sentinel-First Evidence Runbook - 2026-07-20

**Owner:** Executive Governance  
**Applies To:** `docs/governance`, `apps/api`, `apps/executive-desk`, `runtime`, `scripts`  
**State:** Active (review-held)

## Purpose

This runbook defines the minimum evidence sequence required before any cloud
provider support escalation, external contact, or governance approval request.
It keeps Sentinel-first triage as the first control surface.

## Required Sequence

1. Identify the issue and the affected lane.
2. Confirm whether Sentinel can resolve or classify the issue internally.
3. Record the relevant receipt, scan, or packet path.
4. Determine whether AWS or Azure escalation is actually required.
5. Prepare the provider-specific gate packet only after the evidence trail is complete.

## Minimum Evidence Set

Each escalation packet should include:

- requestId
- lane
- timestamp
- issue summary
- evidence link
- internal remediation attempts
- provider-specific ask
- expected response artifact

## Guardrails

- Do not contact a provider before the evidence set is recorded.
- Do not create staging, commit, runtime, or external-contact authority by
  running evidence collection alone.
- Keep AWS and Azure escalation requests separate unless a cross-cloud issue is
  explicitly justified.

## Output

Use this runbook as the source of truth for the support escalation gate
template and any provider-specific escalation packet prepared on 2026-07-20.

## Non-Authorization

This runbook does not authorize provider contact, support case creation,
runtime mutation, deployment, staging, commit, or cloud changes.
