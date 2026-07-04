# Customer Discovery Intake And Risk Questionnaire - 2026-07-03

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** populated questionnaire template, light-mode output  
**Distribution:** Internal  
**External Use:** held  
**Authority Created:** no production authority

## Purpose

Populate the customer discovery intake and risk questionnaire required before
any customer production deal execution, customer onboarding, customer data
processing, production support commitment, or regulated finance claim can be
approved.

This questionnaire is authorized for preparation. It is not production
authorization.

## Section 1 - Customer Identity

| Field | Status | Required Before |
| --- | --- | --- |
| Customer legal name | Required | Production authorization |
| Authorized contact name | Required | Production authorization |
| Authorized contact role | Required | Production authorization |
| Authority source | Required | Production authorization |
| Customer billing/contact email | Required if paid engagement | Paid discovery or production |

## Section 2 - Implementation Objective

| Field | Allowed Values | Status |
| --- | --- | --- |
| Engagement type | Discovery, pilot, production | Required |
| Target outcome | Free text | Required |
| Success criteria | Free text | Required before production |
| Requested timeline | Free text | Required before production |

## Section 3 - Workflow Scope

| Field | Status | Notes |
| --- | --- | --- |
| Workflow commands | Required before production | List intended commands and who may invoke them. |
| Inputs and outputs | Required before production | Identify data entering and leaving the workflow. |
| Approval chain | Required before production | Identify customer approver and Nunn Corporation approver. |
| Audit receipt events | Required before production | Identify required submitted/evaluated/approved/executed/blocked receipt events. |
| Failure handling | Required before production | Define rollback, pause, or manual review expectations. |

## Section 4 - Data Classification

| Field | Status | Required Before |
| --- | --- | --- |
| Data categories | Required | Customer data processing |
| Tenant boundary | Required | Customer data processing |
| Retention expectation | Required | Customer data processing |
| Restricted or regulated data | Required | Compliance or finance claims |
| Data deletion expectation | Required | Customer onboarding |

## Section 5 - Approval Authority

| Field | Status |
| --- | --- |
| Customer approver | Required before production |
| Nunn Corporation approver | Required before production |
| Go-live authority | Required before production |
| Emergency stop authority | Required before production |
| Production exception approver | Required before production |

## Section 6 - Support Boundary

| Field | Status | Notes |
| --- | --- | --- |
| Support hours | Required before SLA or production commitment | No default SLA is created. |
| Response expectation | Required before SLA or production commitment | Must be approved separately. |
| Escalation contact | Required before production | Identify owner and backup. |
| Incident reporting expectation | Required before production | Define who receives evidence and when. |

## Section 7 - Claims Boundary

Allowed at current stage:

- Governed deal-execution reference implementation.
- Selected trusted proof review.
- Paid discovery or governed implementation assessment discussion.
- Current proof-health verification has passed, if supported by fresh receipt.

Not allowed at current stage:

- Production customer deployment claim.
- Regulated finance or compliance claim.
- Active payment processing claim.
- Customer production execution claim.
- Production SLA or support commitment.

## Quantitative Readiness Scoring

```yaml
production_authorization_threshold: 90
critical_missing_fields_allowed: 0
current_score_without_customer_specific_scope: 34
current_decision: hold_pending_completed_customer_scope
next_decision_after_complete_scope: prepare_owner_authorization_packet
```

## Completion Checklist

```yaml
required_before_owner_authorization_packet:
  customer_identity: open
  authorized_contact: open
  workflow_scope: open
  data_categories: open
  tenant_boundary: open
  approval_chain: open
  audit_receipt_requirements: open
  support_boundary: open
  allowed_claims: open
```

## Populated Result

The current-stage populated result is recorded in
`docs/CUSTOMER_DISCOVERY_INTAKE_AND_RISK_QUESTIONNAIRE_POPULATED_RESULT_2026-07-03.md`.
It populates the discovery lane for paid discovery / governed implementation
assessment while leaving customer-specific production fields open.

## Non-Authorization

This questionnaire does not authorize production customer deal execution,
customer onboarding, customer data processing, regulated finance claims,
production support commitments, live payment collection, deployment, runtime
mutation, Azure mutation, staging, commit, or push.
