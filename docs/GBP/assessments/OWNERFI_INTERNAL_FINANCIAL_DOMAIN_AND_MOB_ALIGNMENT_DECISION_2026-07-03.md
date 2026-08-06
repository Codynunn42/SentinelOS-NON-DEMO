# OwnerFi Internal Financial Domain And MOB Alignment Decision - 2026-07-03

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** architecture decision, MOB alignment  
**Distribution:** Internal  
**External Use:** held  
**Authority Created:** documentation and architecture classification only

## Decision

OwnerFi is set as the Nunn Corporation internal financial management domain.
AI Financial Management must not remain a parallel effort beside OwnerFi. It is
classified as an implementation capability set inside OwnerFi.

This decision does not copy files, move files, activate runtime behavior, or
authorize financial operations. It sets the governing architecture and the
migration direction.

## Ecosystem Architecture

```text
Nunn Corporation
|
|-- SentinelOS
|   Internal operating platform
|
|-- OwnerFi
|   Internal financial management domain
|   |-- AI Financial Management
|   |-- Treasury
|   |-- Budgeting
|   |-- Forecasting
|   |-- Revenue Intelligence
|   |-- Accounts Payable
|   |-- Accounts Receivable
|   |-- Payroll Governance
|   |-- Expense Governance
|   |-- Financial Receipts
|   |-- Executive Financial Dashboard
|   `-- Financial AI Agents
|
|-- Sintinex / SINTENEX
|   Commercial portfolio and commercial trigger review lane
|
|-- Deal Execution Engine
|   Customer revenue path
|
|-- Sentinel AI
|   Intelligence layer
|
`-- Sentinel Light
    Public experience
```

## OwnerFi Capability Model

| Capability | Includes |
| --- | --- |
| Treasury | Cash position, banking, liquidity, reserves |
| Revenue Intelligence | ARR/MRR, pipeline, forecasts, pricing, profitability |
| Budget and Planning | Annual budgets, departmental budgets, variance analysis |
| Expense Governance | Approvals, purchasing, reimbursement workflows |
| Payroll Governance | Payroll approvals, compensation controls, executive approvals |
| Financial Receipts | Immutable approval ledger, audit evidence, financial receipts |
| AI Financial Management | Financial copilots, forecasting, recommendations, anomaly detection |
| Executive Finance | CEO dashboard, KPIs, board reporting |

## Migration Direction

```yaml
migration:
  source:
    name: AI Financial Management
    current_state: scattered_or_parallel_financial_work
  destination:
    domain: OwnerFi
    classification: implementation_modules_inside_internal_financial_management_domain
  preserve:
    - prompts
    - workflows
    - governance
    - models
    - documentation
    - calculations
  reorganize_into:
    - treasury
    - budgeting
    - forecasting
    - accounting
    - executive_reporting
    - ai_agents
    - governance
  execution_status: planned_review_held
  file_moves_authorized: false
```

## Relationship Rules

| Surface | Responsibility |
| --- | --- |
| Deal Execution Engine | Generates customer revenue and routes customer-facing deal work. |
| SINTENEX / Sintinex | Decides commercial packaging, trigger review, timed-event posture, and launch routing. |
| OwnerFi | Records, analyzes, forecasts, approves, and reports Nunn Corporation internal financial operations. |
| SentinelOS | Orchestrates workflows, governance, authority, receipts, and audit controls. |
| Sentinel AI | Provides intelligence across domains while respecting authority boundaries. |

## MOB Action

The Master Operating Binder must treat this decision as the governing domain
architecture for financial operations until superseded by a later owner-approved
MOB revision.

```yaml
mob_update:
  ownerfi_role: internal_financial_management_domain
  ai_financial_management_role: ownerfi_capability_set
  next_gate: PREPARE_OWNERFI_AI_FINANCIAL_MANAGEMENT_MIGRATION_MANIFEST
  authority_created: documentation_classification_only
```

## Non-Authorization

This decision does not authorize live banking actions, payment collection,
payroll execution, accounts payable execution, customer production deal
execution, customer onboarding, regulatory claims, file movement, staging,
commit, push, deployment, or Azure resource mutation.
