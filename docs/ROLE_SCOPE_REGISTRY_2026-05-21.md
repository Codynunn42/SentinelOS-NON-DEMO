# Role Scope Registry - 2026-05-21

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** governance registry  
**Authority:** review-only, no key creation, no runtime mutation

## Artifact Decision

```txt
[KEEP:ROLE-SCOPE-REGISTRY-2026-05-21]
```

## Purpose

Define the canonical role and scope model that should guide future protected command surfaces.

This registry documents the intended governance contract. It does not create keys, rotate keys, mutate environment values, or change runtime policy.

## Current Source Alignment

This registry aligns with current behavior in:

```txt
apps/sentinel/src/security/keyRegistry.js
apps/sentinel/src/governance/policyEngine.js
scripts/check-key-registry.js
scripts/check-approval-access.js
```

Verified checks:

```txt
npm run check:keys
npm run check:policy
npm run check:approvals
npm run check:execution-integrity
```

## Canonical Roles

| Role | Purpose | Authority Boundary |
| --- | --- | --- |
| `viewer` | read-only operational visibility | no submit, approval, execution, or admin authority |
| `operator` | submit and operate non-execution workflows | cannot approve or execute protected actions by default |
| `approver` | review and approve controlled actions | approval authority does not equal platform admin |
| `auditor` | audit, receipt, and approval visibility | cannot mutate operational state |
| `platform` | governed platform maintenance | must be rare, explicit, and traceable |

## Scope Classes

| Scope Class | Examples | Meaning |
| --- | --- | --- |
| application | `application:submit`, `application:evaluate`, `application:read` | application workflow access |
| deal | `deal:submit`, `deal:approve`, `deal:execute` | deal lifecycle authority |
| audit | `audit:read` | audit visibility |
| receipt | `receipt:read` | receipt visibility |
| approval | `approval:read`, `approval:review` | approval visibility or review |
| tenant | `tenant:admin` | tenant administration |
| platform | `platform:admin` | platform administration |
| support | `support:write`, `support:refund` | customer operations |
| billing | `billing:read`, `billing:write`, `billing:webhook` | billing integration surfaces |
| contract | `contract:assess` | Contract Reclamation review assessment |

## Default Role/Scope Matrix

| Role | Allowed By Default | Not Allowed By Default |
| --- | --- | --- |
| `viewer` | `audit:read`, `receipt:read`, `approval:read` | submit, approve, execute, admin |
| `operator` | `application:submit`, `application:read`, `audit:read`, `receipt:read`, `approval:read` | `approval:review`, `deal:execute`, `platform:admin` |
| `approver` | operator visibility plus `approval:review`, `deal:approve` | `platform:admin` |
| `auditor` | `audit:read`, `receipt:read`, `approval:read` | submit, approve, execute, admin |
| `platform` | explicitly scoped platform operations | unrestricted default use |

## Protected Separations

```txt
approval:read != approval:review
audit:read != execution authority
receipt:read != execution authority
contract:assess != legal advice
contract:assess != execution authority
platform:admin != routine operator access
```

## Contract Reclamation Scope

Current Contract Reclamation command:

```txt
contract.reclamation.assess -> contract:assess
```

Boundary:

```yaml
review_only: true
legal_advice: prohibited
legal_certainty: prohibited
recovery_claim: prohibited
execution_authority: false
authority_created: false
```

## Required Enforcement Expectations

Every protected command should have:

1. tenant context
2. actor context
3. role context
4. required scope mapping
5. policy preflight
6. audit record
7. blocked-path behavior where applicable
8. receipt or trace where applicable

## Next Implementation Candidate

Implemented as additive runtime reference:

```txt
apps/sentinel/src/security/roleScopeRegistry.js
scripts/check-role-scope-registry.js
```

Verification:

```bash
npm run check:role-scopes
```

This implementation is additive. It does not weaken current `keyRegistry.js` or `policyEngine.js` behavior.

## Non-Authorization Clause

This registry is a governance reference only. It does not authorize deployment, runtime mutation, key creation, key rotation, secret access, secret disclosure, endpoint publication, pilot activation, billing activation, funnel activation, production claims, or autonomous execution.
