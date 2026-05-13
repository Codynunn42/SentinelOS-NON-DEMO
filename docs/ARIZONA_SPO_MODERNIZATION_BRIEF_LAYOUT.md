# SentinelOS v1 Arizona SPO Modernization Brief Layout

**METADATA:** `[ROADMAP] [GOVERNMENT-POSITIONING] [CONTROLLED-RELEASE]`

**DISCLAIMER:** This document outlines strategic positioning for future government alignment. Current SentinelOS deployment is limited to enterprise pilots. No government deployment claims should be made.

Approval badge: `[DEFER:PUBLIC-SECTOR-DRAFT]`

Document status: Discussion draft. Not approved for external publication.

Artifact decision: `[DEFER:PUBLIC-SECTOR-DRAFT]`

Next step: keep paired PDF `docs/ARIZONA_SPO_MODERNIZATION_BRIEF_LAYOUT.pdf` draft-only. Before any external use, approve this source document and regenerate or explicitly label the PDF as draft.

Owner: Cody Nunn / Nunn Cloud

Version: draft-2026-05-04

Audience: Arizona State Procurement Office modernization and oversight stakeholders

Evidence status: Vendor onboarding simulation and governance controls are repo-local proof artifacts until formally approved for external presentation.

Working title: `SentinelOS v1: Governed Administrative Workflow Runtime`

Format: 10-12 page PDF systems memo

Tone: measured, institutional, evidence-led

## Approval Boundary

This document may be used for internal mapping and discussion preparation only.

It is not:

- a deployment proposal
- a procurement proposal
- an official government submission
- an approval to publish the paired PDF

The paired PDF, `docs/ARIZONA_SPO_MODERNIZATION_BRIEF_LAYOUT.pdf`, remains `[DEFER:PUBLIC-SECTOR-DRAFT]` until this source document receives final owner approval and the PDF is regenerated or explicitly labeled draft.

## Design Guidance

- Page size: US Letter
- Margins: 0.7 to 0.9 inches
- Typography: one clean sans-serif family, 10.5-11 pt body text, 16-20 pt section headings
- Color use: restrained; use green only for verified integrity, amber for advisory/escalation, red only for refusal
- Visual style: tables, callout boxes, simple process diagrams; no promotional hero graphics
- Footer: document title, version, page number, `Prepared for discussion`

## Page 1 - Cover

Title:

SentinelOS v1
Governed Administrative Workflow Runtime
Vendor Onboarding Compliance Pilot Proposal

Prepared for:

Arizona State Procurement Office

Prepared by:

[Your Name / Nunn Cloud]

Date:

[Insert Date]

Footer note:

Discussion draft. Not a deployment proposal.

## Page 2 - Executive Overview

Purpose:

Frame SentinelOS as governance infrastructure, not general-purpose AI automation.

Core message:

SentinelOS v1 is a governance-first administrative workflow runtime designed to automate structured compliance checks while enforcing uncertainty containment, human review, and immutable audit traceability.

Evidence callout:

Under conservative ambiguity simulation:

- Escalation rate: 3.0 percent in 1,000-case run
- Refusal rate: 0.6 percent
- Advisory band: 6.9 percent
- Ledger integrity: 100 percent
- Queue peak: 30
- Risk curve: smooth, no cliff behavior

## Page 3 - Arizona Procurement Context

Purpose:

Show that the proposal is aligned with Arizona's existing procurement operating environment.

Verified context:

- The Arizona Procurement Portal is the state's e-procurement system for suppliers and state employees.
- APP supports supplier/state procurement activity across Arizona agencies, boards, and commissions.
- Arizona's APP vision includes end-to-end automation, spend management, data quality, availability, and supplier management.
- ADOA guidance says businesses must register in APP to do business with the State of Arizona.

Positioning:

SentinelOS is not a replacement for APP. It is a governance runtime layer for rule validation, escalation, and audit replay around vendor onboarding workflows.

## Page 4 - Administrative AI Risk Context

Problem framing:

Public-sector workflow automation can fail when decision logic is opaque, uncertainty thresholds are hidden, human escalation is informal, audit trails are mutable, or policy versions drift from execution behavior.

SentinelOS response:

- Deterministic rule catalog
- Configurable NVOP thresholds
- Mandatory escalation review for State 2+
- Operator rationale and policy reference enforcement
- Append-only hashed ledger
- Replayable risk calculation

## Page 5 - Architecture Overview

Diagram:

`Vendor Intake -> Rule Engine -> NVOP Containment -> Latency Governor -> Escalation Interface -> Audit Ledger -> Workflow Continuation`

Component notes:

- Rule Engine: 30 deterministic vendor onboarding rules
- NVOP: `Risk Index = (1 - C) * I * D * (1 - V)`
- Latency Governor: assigns standard, advisory, human review, extended review, or halted class
- Operator Interface: inserts human authority with required rationale
- Audit Ledger: append-only, hash-linked decision record

## Page 6 - Rule Set Structure

Table:

| Group | Rule IDs | Purpose |
| --- | --- | --- |
| Structural Integrity | R-001 to R-010 | Required data, document, timestamp, and format checks |
| Policy Threshold | R-011 to R-020 | Contract, insurance, certification, sanction, jurisdiction, data classification |
| Ambiguity & Escalation | R-021 to R-030 | Overlap, proximity, conflict, metadata anomaly, partial match, sensitivity flags |

Rule metadata:

Every rule includes ID, category, deterministic condition, severity, optional NVOP impact modifier, and log trigger.

## Page 7 - Containment Calibration

Final locked thresholds:

| State | Range | Meaning |
| --- | --- | --- |
| State 0 | 0.0 to 0.5 | Pass |
| State 1 | 0.5 to 1.3 | Advisory |
| State 2 | 1.3 to 3.0 | Escalation |
| State 3 | Greater than 3.0 | Refusal |

Narrative:

The State 2 boundary was calibrated from 1.2 to 1.3 after stress testing showed the 1.2 posture was slightly elevated for modernization-unit presentation. The 1.3 posture preserved conservative oversight while stabilizing around a 3 percent escalation profile.

## Page 8 - Simulation Evidence

1,000-case conservative ambiguity run:

| Metric | Result |
| --- | --- |
| State 0 | 901 |
| State 1 | 69 |
| State 2 | 24 |
| State 3 | 6 |
| Escalation rate | 3.0 percent |
| Refusal rate | 0.6 percent |
| Queue peak | 30 |
| Ledger integrity | 100 percent |

1,500-case stability run:

| Metric | Result |
| --- | --- |
| State 0 | 1340 |
| State 1 | 113 |
| State 2 | 39 |
| State 3 | 8 |
| Escalation rate | 3.13 percent |
| Refusal rate | 0.53 percent |
| Queue peak | 47 |
| Ledger integrity | 100 percent |

Chart guidance:

Include a compact bar chart for NVOP state distribution and a simple histogram summary showing concentration in low-risk bands with a thin escalation tail.

## Page 9 - Operator Escalation Demonstration

Demo path:

1. Load escalated vendor case queue.
2. Open State 2 or State 3 case.
3. Show failed rules and ambiguity flags.
4. Replay NVOP formula inputs.
5. Submit decision with rationale, policy reference code, and risk acknowledgment.
6. Show decision hash and ledger hash.

Guardrails:

- No empty rationale
- No missing policy reference
- No missing risk acknowledgment
- No silent override
- No duplicate decision
- No rationale mutation after submission

## Page 10 - Pilot Scope Proposal

Scope:

Vendor onboarding compliance workflow.

Duration:

90 days.

Constraints:

- No autonomous approvals
- Mandatory human review for State 2+
- Full audit visibility for modernization stakeholders
- Threshold changes only through documented governance approval
- No model retraining during pilot without approval

Deliverables:

- Escalation distribution report
- Latency distribution report
- Operator throughput report
- Incident classification summary
- Governance refinement recommendations

## Page 11 - Data Handling And Governance Controls

Hosting posture:

SentinelOS can be deployed in a state-approved cloud environment with role-based access controls and data residency constraints defined during pilot scoping.

Controls:

- Centralized threshold authority
- Version-controlled rule sets
- Append-only decision ledger
- Operator documentation requirement
- Audit export readiness
- Policy replay
- Drift monitoring

Procurement positioning:

SentinelOS evaluates workflow governance and escalation discipline. It does not replace APP, supplier registration, procurement authority, or existing statutory procurement controls.

## Page 12 - Meeting Objective And Next Steps

Meeting objective:

Signal mapping, not procurement approval.

Questions for Arizona stakeholders:

- Where does vendor onboarding ambiguity create friction today?
- Which escalation thresholds are politically or operationally sensitive?
- What documentation is non-negotiable for audit review?
- Where is human review mandatory today?
- What audit export format would be required?

Proposed next steps:

1. 60-90 minute technical briefing.
2. Vendor onboarding workflow mapping session.
3. Pilot governance boundary definition.
4. Controlled integration plan.
5. 90-day evaluation.

Closing statement:

SentinelOS is proposed as governed workflow containment infrastructure for administrative modernization, not as a replacement procurement system.

## Source Notes

- Arizona State Procurement Office, Arizona Procurement Portal: <https://spo.az.gov/arizona-procurement-portal>
- Arizona State Procurement Office, Suppliers page: <https://spo.az.gov/suppliers>
- Arizona Department of Administration, Register To Be A State Vendor: <https://doa.az.gov/about/services/register-be-state-vendor>
- Arizona Procurement Portal login page: <https://app.az.gov/>
