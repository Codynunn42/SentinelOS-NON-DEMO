# Sentinel-First Support Policy - 2026-07-20

**Owner:** Executive Governance  
**Applies To:** `apps/sentinel`, `apps/api`, `apps/executive-desk`, `runtime`, `scripts`  
**State:** Active (proposed for immediate adoption)

## 1) Policy Statement

Sentinel AI is the first-line system for diagnostics, triage, evidence assembly, and decision support.
External support channels (Azure/AWS/vendor support) are exception lanes used only after Sentinel-first evidence is recorded.

## 2) Authority Boundaries (Default)

- `staging_authority: false`
- `commit_authority: false`
- `runtime_authority: false`
- `external_contact_authority: false`

No authority is created by running Sentinel analysis alone.

## 3) Cloud Operating Posture

- Azure is the primary operating lane for production governance workflows.
- AWS support is used only for AWS-resident components or provider-side incidents.
- Mixed-cloud escalations require explicit justification and gate approval.

## 4) Required Sentinel-First Sequence

1. Run Sentinel health and scope scan.
2. Record evidence receipt and risk posture.
3. Determine: resolved internally vs unresolved provider-side.
4. If unresolved, open escalation gate packet before external support contact.

## 5) Escalation Criteria (External Support Allowed)

External support may be used only when one or more are true:

- Sev-1/Sev-2 production availability or security risk.
- Provider control-plane or managed-service failure is likely.
- Billing/quotas/subscription controls block governed execution.
- Sentinel evidence indicates internal remediation is insufficient.

## 6) Control Requirements

- Every case must include `requestId`, actor, lane, timestamp, and evidence link.
- Every escalation must include a reason code and expected provider outcome.
- Repeated support requests for same issue must become a runbook within one cycle.

## 7) Monthly Governance Review

Track and review:

- number of support cases by provider
- mean time to resolution
- preventable vs non-preventable
- top recurring causes
- runbook conversion status
