# Phase 2 Tenant Scope Contract Matrix - 2026-05-23

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** Phase 2 governance hardening  
**Posture:** tenant boundaries before authority movement  
**Authority Created:** false  
**Runtime Mutation:** false  
**Deployment Authority:** false

## Artifact Decision

`[KEEP:PHASE2-TENANT-SCOPE-CONTRACT-MATRIX-2026-05-23]`

This matrix formalizes the current tenant and scope contract for governed command handling.

It does not create tenants, create keys, rotate keys, grant scopes, change policies, mutate runtime, enforce branch protection, edit workflows, publish endpoints, or activate pilots.

## Contract Rule

Every protected command must carry:

1. tenant context
2. actor context
3. role context
4. scope context
5. command scope mapping
6. policy preflight
7. audit record
8. receipt or execution trace where applicable

Missing context remains a pre-execution block, not a post-execution warning.

## Tenant Matrix

| Tenant / Surface | Current Role | Allowed Scope Families | Held Scope Families | Boundary |
| --- | --- | --- | --- | --- |
| `ownerfi` | first active proof surface plane | `application:*`, `deal:submit`, `deal:approve`, visibility scopes, selected telemetry review | billing, funnels, publication, custom domain, unapproved execution | business proof lane; not whole system |
| `customerops` | governed customer operations command surface | `support:write`, `support:refund` when governed | autonomous refunds, external writes outside approved command path | support actions remain preflighted and audited |
| `contractreclamation` | sibling governed faceplane lane | `contract:assess` | legal advice, legal certainty, recovery claims, execution | review-only contract-state reconstruction |
| `nunncloud` | platform/governance control surface | `platform:admin` only under explicit operator authority | routine operator access, unapproved repo mutation, workflow edits | platform authority must remain rare and traceable |
| `mock` | synthetic faceplane testing surface | `platform:admin` for `faceplane.mock.run` | real external integrations, unmapped `faceplane.mock.list` authority | sandboxed simulation only |
| `hotelops` | future/placeholder surface | none confirmed in current handler registry | all execution and external claims | no active tenant authority from this pass |
| `platform` | privileged governance tenant concept | explicit platform maintenance scopes | routine business workflow use | not a general-purpose bypass |

## Role Contract

| Role | Default Contract | Prohibited Drift |
| --- | --- | --- |
| `viewer` | visibility only: audit, receipt, approval read | submit, approve, execute, admin |
| `operator` | submit and operate non-execution workflows | approval review, deal execute, platform admin |
| `approver` | review and approve controlled actions | platform admin by default |
| `auditor` | audit, receipt, and approval visibility | mutation, submit, approve, execute |
| `platform` | explicitly scoped platform maintenance | routine workflow use without operator-approved purpose |

## Scope Contract

| Scope Family | Scope Examples | Contract |
| --- | --- | --- |
| application | `application:submit`, `application:evaluate`, `application:read` | OwnerFi workflow access; no execution authority by itself |
| deal | `deal:submit`, `deal:approve`, `deal:execute` | deal lifecycle authority; execute remains approval-sensitive |
| approval | `approval:read`, `approval:review` | read and review must stay separate |
| audit | `audit:read` | visibility only |
| receipt | `receipt:read` | visibility only |
| support | `support:write`, `support:refund` | governed customer operations; refund remains sensitive |
| contract | `contract:assess` | review-only contract-state reconstruction |
| telemetry | `telemetry:write`, `telemetry:export` | metric evidence only; export is sensitive and approval-gated |
| billing | `billing:read`, `billing:write`, `billing:webhook` | held; billing is not ready-to-go |
| platform | `platform:admin` | rare, explicit, traceable platform maintenance |
| security | `security:write` | held until explicit security change approval |

## Required Pre-Execution Blocks

The following conditions must block before handler execution:

| Condition | Expected Result |
| --- | --- |
| missing tenant | `TENANT_REQUIRED` |
| missing command | `COMMAND_REQUIRED` |
| missing actor | `ACTOR_REQUIRED` |
| missing role | `ROLE_REQUIRED` |
| missing scopes | `SCOPES_REQUIRED` |
| missing command-scope mapping | `SCOPE_MAPPING_REQUIRED` |
| tenant mismatch | `TENANT_MISMATCH` |
| missing required scope | `SCOPE_REQUIRED` |
| non-approver `deal.execute` | `ROLE_REQUIRED` with approval path |
| sensitive telemetry export | approval required |
| impossible travel signal | approval required / blocked |

## Current Phase 2 Gate Result

```yaml
phase2_tenant_scope_contract_matrix:
  status: COMPLETE_CURRENT_PASS
  tenant_contracts_documented: true
  role_contracts_documented: true
  scope_contracts_documented: true
  pre_execution_blocks_preserved: true
  missing_mapping_gap:
    - faceplane.mock.list
  authority_created: false
  runtime_mutation_authority: false
  deployment_authority: false
```

## Recommended Phase 2 Next Actions

1. Build the audit and receipt visibility matrix.
2. Build the approval boundary preservation checklist.
3. Decide whether `faceplane.mock.list` should receive a read-only policy mapping or remain blocked.
4. Keep CI implementation approval separate from governance hardening.

## Next Selected Action

```yaml
selected_action: phase2_audit_receipt_visibility_matrix
deliverable: docs/PHASE2_AUDIT_RECEIPT_VISIBILITY_MATRIX_2026-05-23.md
authority_created: false
```
