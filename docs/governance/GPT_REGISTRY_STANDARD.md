# GPT Registry Standard

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[HOLD:GPT-REGISTRY-STANDARD-DRAFT]
```

## Purpose And Scope

Define registration requirements, identifiers, classifications, ownership, scope, permissions, lifecycle status, dependency mapping, approval status, and prohibited registration patterns for governed GPTs, agents, prompts, modules, and AI entities under the SentinelOS inheritance stack.

This standard treats the registry as a governance identity system. Registration makes an entity visible, classifiable, reviewable, and constrained. Registration does not create operational authority.

This document does not authorize runtime mutation, deployment changes, external tenant activation, new GPT or agent activation, tool grants, permission grants, persistent memory activation, public capability claims, autonomous execution, or governance bypass.

## Constitutional And Runtime Inheritance

This standard inherits from:

```txt
docs/governance/SENTINELOS_CONSTITUTION.md
docs/governance/APPROVED_VOCABULARY_DICTIONARY.md
docs/governance/SENTINELOS_ARCHITECTURE_SPECIFICATION.md
docs/governance/SENTINEL_RUNTIME_EXECUTION_BOUNDARY_SPECIFICATION.md
docs/governance/MULTI_AGENT_FRAMEWORK_STANDARD.md
docs/governance/MEMORY_ARCHITECTURE_STANDARD.md
```

Core invariant:

```txt
Registration identifies and constrains an entity. Registration does not authorize execution.
```

Registry systems must preserve:

- human authority
- governance supremacy
- semantic control
- runtime boundary enforcement
- agent authority limits
- memory non-authorization
- lifecycle traceability
- dependency visibility
- permission explicitness
- no implicit activation

## Registry Principles

The registry exists to make governed AI entities visible and accountable.

Core principles:

1. Registration creates identity, not authority.
2. Every entity must declare type, scope, owner, lifecycle state, and dependencies.
3. Permissions must be explicit; they are not inherited by registration alone.
4. Dependencies must be visible and reviewable.
5. Lifecycle state must be separate from runtime activation.
6. Held or draft entities must not be treated as active capabilities.
7. Registry metadata must preserve governance lineage.
8. Unregistered entities must not participate in governed execution.
9. Registration must not bypass runtime, agent, memory, or tool governance.
10. Public claims must not be derived from registry existence alone.

## Governed Entity Types

Entities that may require registry treatment:

| Entity Type | Description | Boundary |
| --- | --- | --- |
| GPT | A governed conversational or reasoning entity | Cannot execute unless separately authorized through runtime boundary |
| Agent | A governed participant with class, scope, and task behavior | Inherits Multi-Agent Framework Standard |
| Prompt | A reusable instruction, policy block, or prompt module | Cannot grant authority by wording alone |
| Module | A bounded subsystem or capability package | Must declare inputs, outputs, dependencies, and execution boundary |
| Orchestration Component | Task routing, workflow coordination, or command-envelope preparation component | Coordinates; does not self-authorize |
| Interface Entity | Public, operator, tenant, API, or face-plane interaction surface | Cannot directly authorize execution |
| Memory-Linked Entity | Entity that retrieves, stores, or references memory | Inherits Memory Architecture Standard |
| Tool Adapter | Entity that exposes a tool, API, integration, or connector | Requires explicit tool access governance |
| Policy Pack | Rule, approval, or governance logic package | Must declare authority source and scope |
| Audit Entity | Entity that reviews or exports evidence, receipts, or trace records | Cannot rewrite lineage |

Entity type assignment must happen before review, activation, or tool access.

## Identifier Standards

Every registered entity must have a stable identifier.

Identifier format:

```txt
<domain>.<entity_type>.<name>.<version>
```

Examples:

```txt
sentinel.agent.review.v0
sentinel.prompt.governance-preflight.v1
sentinel.module.audit-export.v0
sentinel.interface.proof-surface.v1
sentinel.memory.audit-reference.v0
```

Identifiers should include:

- domain
- entity type
- unique name
- version
- lifecycle state
- owner
- dependency references

Identifiers must not:

- imply approval
- imply production readiness
- imply tenant activation
- imply runtime authority
- hide experimental or held status

## Ownership And Stewardship

Every registered entity must declare ownership.

Ownership fields:

- governance owner
- technical owner
- review owner
- escalation owner
- maintenance owner
- archive owner where applicable

Owner responsibilities:

- maintain registry accuracy
- classify scope and risk
- preserve lifecycle status
- review dependency changes
- request approval for promotion
- suspend entities when drift or risk appears
- preserve evidence for audit

No entity may be promoted without a responsible owner.

## Classification And Scope

Every entity must declare classification and scope.

Classification options:

| Classification | Meaning | Runtime Posture |
| --- | --- | --- |
| `advisory_only` | Analysis, drafting, recommendation, review, or explanation | No execution |
| `review_only` | Checks risk, policy, vocabulary, drift, or completeness | May recommend stop; no execution |
| `orchestration_preparation` | Prepares command envelopes or routes work | No self-authorization |
| `memory_linked` | Retrieves or references governed memory | Cannot authorize |
| `tool_adapter` | Connects to tool or integration | Requires tool access governance |
| `policy_pack` | Encodes rule or approval logic | Must declare authority source |
| `audit_support` | Supports traceability or evidence review | Cannot rewrite history |
| `experimental` | Conceptual or lab-only entity | Not active |
| `held` | Drafted but not approved | Not active |
| `prohibited` | Blocked classification or unsafe pattern | Must not be used |

Scope fields:

- tenant scope
- actor or role scope
- workflow scope
- data scope
- memory scope
- tool scope
- runtime scope
- publication scope

Scope must be least-privilege.

## Permission And Dependency Mapping

Permissions must be declared separately from registration.

Registry entries may record requested or approved permissions, but registration alone does not grant them.

Permission fields:

- read permissions
- write permissions
- tool permissions
- memory permissions
- external interaction class
- automation class
- approval requirements
- audit requirements
- expiration or review window

Dependency fields:

- inherited governance documents
- prompt dependencies
- agent dependencies
- module dependencies
- memory dependencies
- tool dependencies
- policy dependencies
- runtime dependencies
- interface dependencies

Dependency rules:

- dependencies must be visible
- dependency changes require review
- implicit capability inheritance is prohibited
- higher-risk dependency changes may require lifecycle downgrade
- dependencies cannot grant authority by association

## Lifecycle States

Registry lifecycle states:

| State | Meaning | Operational Posture |
| --- | --- | --- |
| `proposed` | Entity concept identified | No use |
| `drafted` | Entity definition exists | Held; no activation |
| `held` | Explicitly contained pending review | No activation |
| `review_pending` | Awaiting governance, technical, security, or operator review | No expansion |
| `restricted_internal` | Approved for bounded internal use | Limited by scope |
| `approved_internal` | Approved for controlled internal use | Still bound by runtime and tool governance |
| `limited_pilot` | Approved for bounded pilot use | Tenant and scope limited |
| `suspended` | Use paused due to risk, drift, or missing evidence | Blocked |
| `deprecated` | Replaced or no longer recommended | Avoid new use |
| `archived` | Preserved as historical record | No active use |
| `prohibited` | Not allowed | Blocked |

Lifecycle state must be visible in the registry.

No lifecycle state authorizes execution by itself.

## Approval Status Rules

Approval status must be explicit.

Approval dimensions:

- governance review
- vocabulary review
- runtime boundary review
- security review
- tool access review
- memory access review
- public claim review
- tenant activation review
- deployment review where applicable

Approval statuses:

| Status | Meaning |
| --- | --- |
| `not_requested` | No approval requested |
| `requested` | Approval requested but not complete |
| `approved_scope_limited` | Approved only for declared scope |
| `approved_internal` | Approved for internal use |
| `rejected` | Approval denied |
| `expired` | Approval no longer valid |
| `revoked` | Approval withdrawn |
| `unknown` | Approval cannot be verified |

Unknown approval status must fail closed for execution-sensitive use.

## Prohibited Registration Patterns

Registry systems must prohibit:

- self-registration into active state
- self-approval
- undeclared dependencies
- hidden tool access
- implicit permission inheritance
- registration as proof of production readiness
- registration as proof of runtime availability
- hidden execution classification
- bypass registration for runtime-sensitive entities
- unauthorized activation linkage
- public claims based only on registry existence
- memory state used as approval
- cross-tenant registry leakage
- dependency masking
- lifecycle promotion without evidence

Registration identifies and constrains an entity. Registration does not authorize execution.

## Auditability And Traceability

Registry changes must be auditable.

Traceability should capture:

- entity identifier
- entity type
- lifecycle state
- owner
- classification
- scope
- permissions requested
- permissions approved
- dependencies
- approval status
- review history
- change timestamp
- reviewer or approving authority
- related audit evidence

Registry audit should distinguish:

- entity creation
- metadata update
- scope change
- dependency change
- permission request
- approval change
- lifecycle transition
- suspension
- deprecation
- archive action

Registry history must not be rewritten to hide drift.

## Registry Entry Template

```yaml
id: sentinel.agent.example.v0
name: Example Agent
entity_type: agent
classification: advisory_only
lifecycle_state: drafted
approval_status: not_requested
governance_owner: TBD
technical_owner: TBD
review_owner: TBD
scope:
  tenant: none
  actor_roles: []
  workflows: []
  data: []
  tools: []
permissions:
  read: []
  write: []
  tools: []
  memory: []
dependencies:
  governance:
    - docs/governance/SENTINELOS_CONSTITUTION.md
    - docs/governance/APPROVED_VOCABULARY_DICTIONARY.md
    - docs/governance/SENTINEL_RUNTIME_EXECUTION_BOUNDARY_SPECIFICATION.md
  prompts: []
  modules: []
  memory: []
  tools: []
audit:
  created_at: TBD
  last_reviewed_at: TBD
  evidence: []
notes:
  - Registration identifies and constrains this entity.
  - Registration does not authorize execution.
```

## Non-Authorization Clause

This standard is a draft governance artifact.

Core invariant:

```txt
Registration identifies and constrains an entity. Registration does not authorize execution.
```

This standard does not authorize:

- GPT activation
- agent activation
- module activation
- runtime mutation
- deployment changes
- tool grants
- permission grants
- memory activation
- secret access
- tenant activation
- public claims
- autonomous execution
- production readiness claims
- publication of held materials
- bypass of policy, approval, or audit

Any registry, entity, or capability derived from this standard must be separately reviewed, scoped, approved, and audited.

## Current Maturity Boundary

Current status:

```txt
gpt_registry_standard_drafted
not_registry_activation_authority
not_entity_activation_authority
not_runtime_authority
not_deployment_authority
not_public_claim_authority
```

Open dependencies before promotion:

- Constitution review
- Vocabulary Dictionary review
- Architecture Specification review
- Runtime Boundary review
- Multi-Agent Framework review
- Memory Architecture review
- Governance Lifecycle Manual
- Tool Access Governance Standard
- registry implementation design
- registry audit template

## Next Controlled Moves

1. Review this standard against the Multi-Agent Framework Standard.
2. Review this standard against the Memory Architecture Standard.
3. Keep it internal until governance review is complete.
4. Use it as the source outline for agent and GPT registration templates.
5. Use it as the inheritance source for the future `Tool Access Governance Standard`.
6. Do not activate registry infrastructure from this draft alone.

