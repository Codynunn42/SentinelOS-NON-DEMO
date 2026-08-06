# Pilot Onboarding External Review Draft - 2026-05-17

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[HOLD:EXTERNAL-REVIEW-PILOT-DRAFT]
```

## Approval Scope

A7.2/A7.3 approved creation of an externally reviewable pilot onboarding draft.

This draft:

- removes internal risk language
- excludes secret/configuration detail
- excludes repo-internal diagnostics
- uses verified proof surfaces only at a high level
- keeps pilot language approval-bound and non-autonomous
- does not publish externally
- does not activate a pilot
- does not provide endpoint URLs, credentials, tenant activation, or deployment instructions

## Positioning

SentinelOS is a governed execution operating framework for approval-aware workflows.

It helps teams see when an operational action should pause, what approval is required, and how the decision is preserved in audit.

## Pilot Purpose

The pilot is intended to evaluate a narrow governed workflow:

```txt
submit intent
-> request approval-bound action
-> receive approval-required status
-> review reason
-> approve through the governed path
-> rerun the approved action
-> review audit evidence
```

The approval stop is the proof point.

## Recommended Pilot Boundary

| Area | Pilot Boundary |
| --- | --- |
| Workflow scope | one defined operational workflow |
| Primary behavior | approval-required action blocks until authorized |
| Evidence | decision reason, status, approval path, audit receipt |
| Buyer system of record | remains unchanged during pilot evaluation |
| SentinelOS role | governed workflow review and approval-bound orchestration evidence |
| Excluded scope | unrestricted automation, system replacement, production certification, compliance guarantee |

## Onboarding Conversation

Recommended discussion path:

1. Confirm the workflow to evaluate.
2. Confirm the action that must require approval.
3. Confirm who may submit the request.
4. Confirm who may approve or reject.
5. Confirm what evidence should appear in audit.
6. Run the narrow proof path.
7. Decide whether a pilot-specific boundary definition should be prepared.

## Proof Surfaces

Available proof surfaces may include:

| Surface | Use |
| --- | --- |
| Health/readiness check | confirms service availability during review |
| Proof surface | demonstrates approval-required workflow behavior |
| Operator review surface | shows governed status, decision state, and activity |
| Audit view | preserves evidence of request, decision, and outcome |

Endpoint details, credentials, and tenant-specific access are provided only through a separate approved onboarding step.

## Buyer-Safe Explanation

Use:

```txt
SentinelOS routes important workflow intent through policy, approval, review, and audit before an approved action proceeds.
```

Avoid:

```txt
independent action without approval
automatic replacement of existing systems
production certification claims
public-sector readiness claims
compliance guarantees
unrestricted automation claims
```

## Required Internal Checks Before Sending

| Check | Required Status |
| --- | --- |
| Public vocabulary review | complete |
| Pilot boundary definition | required before pilot activation |
| Runtime evidence posture | refresh or explicitly accept current posture |
| Claim review | required before sending externally |
| Endpoint publication decision | separate approval required |

## Remaining Holds

This draft is not approved for:

- external publication
- outreach distribution
- tenant activation
- pilot activation
- API key issuance
- runtime mutation
- deployment mutation
- production-readiness claims
- public-sector claims

## Sentinel AI Governance Pass

Findings:

```txt
GI-A7.2-1 - internal risk and repo diagnostic details are removed from this draft
GI-A7.2-2 - endpoint details remain withheld pending explicit URL posture and publication approval
GI-A7.3-1 - pilot scope is limited to verified high-level proof behavior
GI-A7.3-2 - pilot activation remains separate from onboarding material approval
```

Recommended next approval:

```txt
Pilot boundary definition before any tenant-specific activation or external onboarding use.
```

## Non-Authorization Clause

This draft is a review artifact only.

It does not authorize publication, outreach use, tenant activation, pilot activation, runtime mutation, deployment mutation, credential issuance, or production-readiness claims.
