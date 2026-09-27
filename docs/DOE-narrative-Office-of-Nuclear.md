# Responsible, Governed AI for Nuclear Operations — Executive Overview & Pilot Proposal

**Company:** Nunn Corporation / Nunn Cloud LLC

## Problem Statement

Operators and decision-makers in nuclear environments require AI-assisted tools
that can accelerate analysis and decision-making while preserving strict
authority boundaries, auditability, and evidence trails. Unchecked automation
increases operational risk; existing solutions often lack an auditable
governance layer that enforces authorization and records rationale.

## Our Capability

Nunn Cloud’s SSAI platform couples an Executive Desk UX with a governed AI
workflow that enforces authority policies, prevents unauthorized actions, and
records all decisions and evidence. Key features:

- Policy-driven action gating (rules + human approvals)

- Immutable audit records for decisions and evidence provenance

- Fine-grained operator controls and escalation workflows

- Integration-ready connectors for Cloud-native runtimes (Cloudflare Workers, R2),
  secure KV, and identity providers

- Small-footprint deployment suitable for constrained operational networks

## Proposed Pilot Use Case

A 3-month pilot with the Office of Nuclear Energy to demonstrate:

- **Scenario:** Operator decision support for planned maintenance and anomaly
  triage

- **Integration points:** telemetry ingestion (read-only), operator console
  (Executive Desk), and evidence storage (preserved artifacts)

- **Success criteria:** faster triage time vs baseline, 100% auditability of
  decisions, zero unauthorized actions during the pilot window

## Approach & Deliverables (90 days)

- Week 0–2: Requirements & environment discovery (stakeholder interviews, security
  baseline)

- Week 3–6: Integration, secure testbed deployment, simulated data runs

- Week 7–10: Live operator exercises, monitoring, and evidence capture

- Week 11–12: Final evaluation, documentation of audit evidence, handoff

## Data & Security Posture

- Minimal data footprint in pilot; all external calls are controlled and auditable

- Can operate in isolated or partially-connected environments; supports deployment
  behind existing DOE identity and logging infrastructure

- Evidence preservation and hash chaining for tamper-evident audit records

## Engagement & Pricing (high-level)

- Pilot fixed-fee: $80,000 – $150,000 (6–12 week pilot, scope-dependent)

- Follow-on integration & development: Time-and-Materials (T&M) — $150–$250 per
  hour depending on resources and security posture

- Support & maintenance retainer: $5,000 – $15,000 per month

> Note: Pricing is a draft range for scoping and will be refined after the
initial discovery phase.

## Asks of DOE / Kent

- Introductions to a technical point-of-contact in Office of Nuclear Energy

- Confirmation of allowable pilot data sources and any required security approvals

- Feedback on the proposed success criteria and timeline

- Permission to schedule a 30–60 minute scoping session with program leads

## Contact / Next Steps

Proposed: deliver a 1-page technical annex and schedule a scoping call within
7–10 business days.

**Contact:** Cody Nunn — [codynunn@nunncloudllc.com](mailto:codynunn@nunncloudllc.com)

480‑215‑5131
