# Role Key Governance Packet - 2026-05-21

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** governance hardening packet  
**Authority:** review-only, no runtime mutation

## Artifact Decision

```txt
[KEEP:ROLE-KEY-GOVERNANCE-PACKET-2026-05-21]
```

## Purpose

Formalize the next governance hardening layer from `docs/NEXT_STEPS.md`:

```txt
Formalize role/key governance next.
```

This packet records the current key, role, scope, and execution-integrity posture and defines the next operating controls.

## Current Verified Checks

| Check | Result |
| --- | --- |
| `npm run check:keys` | passed |
| `npm run check:policy` | passed |
| `npm run check:approvals` | passed |
| `npm run check:execution-integrity` | passed |
| `npm run check:role-scopes` | passed |

## Current Model

The current key registry supports:

- configured key records through `SENTINEL_API_KEYS`
- legacy key fallback through `SENTINEL_API_KEY`
- tenant binding
- actor binding
- role binding
- scope lists
- active/inactive status
- expiration checks
- platform-admin scope inheritance

Primary code:

```txt
apps/sentinel/src/security/keyRegistry.js
apps/sentinel/src/governance/policyEngine.js
apps/sentinel/src/commands/dispatch.js
```

## Governance Invariants

```yaml
api_key_required_for_protected_routes: true
tenant_required: true
actor_required: true
role_required: true
scope_required: true
inactive_key_blocked: true
expired_key_blocked: true
missing_key_blocked: true
missing_scope_blocked: true
approval_review_separate_from_approval_read: true
execution_integrity_required: true
audit_required: true
```

## Role/Scope Separation

| Role/Scope Area | Purpose | Boundary |
| --- | --- | --- |
| `approval:read` | view approval state | cannot approve |
| `approval:review` | approve/reject when role permits | must remain separate from read-only access |
| `deal:execute` | execute approved deal command | blocked by role/policy when not approved |
| `audit:read` | inspect audit records | does not create execution authority |
| `receipt:read` | inspect command receipts | does not create execution authority |
| `platform:admin` | platform-level override scope | should remain rare and explicitly governed |

## Current Local Proof

Approval access check confirmed:

- read-only approval scope cannot approve
- approval review scope can approve
- `deal.execute` blocks for approval when submitted by non-approver role
- approved request can unlock governed execution path
- audit/security events are emitted

Execution integrity check confirmed:

- signed execution path remains enforced in local verification
- execution-integrity check passed

## Next Controls

1. Define canonical roles:
   - `viewer`
   - `operator`
   - `approver`
   - `auditor`
   - `platform`
2. Define allowed scopes per role.
3. Add a role/scope matrix document or runtime registry.
4. Require explicit approval for any `platform:admin` key use outside local verification.
5. Preserve read/review separation for approvals.
6. Preserve audit and receipt access as visibility, not authority.

## Role/Scope Matrix Draft

| Role | Default Scopes | Prohibited By Default |
| --- | --- | --- |
| `viewer` | `audit:read`, `receipt:read`, `approval:read` | submit, approve, execute, admin |
| `operator` | `application:submit`, `application:read`, `audit:read`, `receipt:read`, `approval:read` | approval review, deal execute |
| `approver` | operator scopes plus `approval:review`, `deal:approve` | platform admin |
| `auditor` | `audit:read`, `receipt:read`, `approval:read` | submit, approve, execute |
| `platform` | platform-admin controlled scopes | should be restricted to maintenance and explicit governance windows |

## Current Risk

The current system has functioning key and scope enforcement, but the role model is still implied by keys and tests rather than fully documented as a canonical governance contract.

## Required Next Action

The canonical role/scope registry now exists in both document and code form.

Document:

```txt
docs/ROLE_SCOPE_REGISTRY_2026-05-21.md
```

Runtime reference:

```txt
apps/sentinel/src/security/roleScopeRegistry.js
scripts/check-role-scope-registry.js
```

Required next control is adoption: future protected command work should reference this registry before broadening access.

## Non-Authorization Clause

This packet records governance posture and next controls only. It does not authorize deployment, runtime mutation, key creation, key rotation, secret access, secret disclosure, endpoint publication, pilot activation, billing activation, funnel activation, production claims, or autonomous execution.
