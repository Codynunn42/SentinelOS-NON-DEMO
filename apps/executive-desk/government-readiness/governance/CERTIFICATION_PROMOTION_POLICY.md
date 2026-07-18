# GBP Phase 6: Certification Promotion Policy

Date: 2026-07-18
Status: Draft for executive review
Scope: SentinelOS Executive Desk certification promotion policy

Mission first. Technology second.

## Purpose

Define the promotion rules that govern movement across Operational Readiness Levels (ORLs) and certification posture.

This policy is read-only governance guidance. It does not itself authorize runtime mutation or deployment.

## Promotion Principles

- Promotion must be evidence-backed, not assumption-backed.
- Promotion must follow the North Star governance chain.
- Promotion must preserve authority chain integrity.
- Promotion must respect mission package boundaries.
- Promotion must never bypass negative-control validation.

## Promotion Triggers

A promotion review may be opened when:

- Required entry criteria for the target ORL are satisfied.
- Bridge-gap blockers are resolved or formally accepted with authority.
- Gate evidence is complete for the requested scope.
- Operational cadence evidence supports the proposed posture.

## Promotion Decision Levels

### Hold

- Current posture remains unchanged.
- Blocking conditions remain unresolved.
- More evidence or remediation is required.

### Conditional Advance

- Minor gaps remain but are explicitly accepted by authority.
- Deadlines and mitigation plans are documented.
- Follow-up evidence is required before final advancement.

### Advance

- All required criteria are met.
- Evidence is complete and reviewable.
- No unresolved blocking conditions remain.

### Rollback

- New critical governance risk is detected.
- Evidence contradicts the current certification claim.
- Authority directs a lower ORL posture.

## ORL Advancement Rules

| From ORL | To ORL | Required Condition | Required Evidence | Default Decision |
|---|---|---|---|---|
| 1 | 2 | Local sandbox stability and policy mapping | Local contract and command tests | Hold until verified |
| 2 | 3 | Integrated command governance and bridge-gaps output | Integration tests, policy maps, receipts | Hold until verified |
| 3 | 4 | Pilot governance maturity and negative-control coverage | Bridge-gap artifacts, authority mapping, gate evidence | Hold until verified |
| 4 | 5 | Departmental candidate posture and cadence discipline | Full certification set and cadence logs | Hold until verified |
| 5 | 5 | Multi-agency certification maintenance | Continuous evidence and authority continuity | Maintain |

## Mandatory Approval Chain

1. Operator lead
2. Governance reviewer
3. Platform authority owner
4. Executive approver when required

No promotion may skip an applicable approval level.

## Evidence Requirements by Promotion Type

- ORL promotion requires scorecard completion.
- Mission package promotion requires mission package documentation and authority mapping.
- Certification promotion requires traceable evidence across doctrine, bridge gaps, implementation, and gate validation.
- Executive-level promotion requires sign-off and explicit retention of evidence artifacts.

## Disqualifying Conditions

- Missing gate evidence.
- Missing or unapproved authority mapping.
- Unresolved critical bridge-gap blockers.
- Non-deterministic command or response contract.
- Claims that outpace evidence.

## Required Artifacts

- GBP Phase 6 Operational Doctrine
- ORL Assessment Scorecard Template
- Mission Package Template
- Operational Cadence Evidence Template
- ORL Advancement Review Checklist
- Bridge Gaps Report output
- Gate certification report

## Sign-off

- Policy owner:
- Governance reviewer:
- Platform authority owner:
- Executive approver (if required):
- Approval date:
