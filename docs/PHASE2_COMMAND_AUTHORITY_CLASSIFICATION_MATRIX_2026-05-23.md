# Phase 2 Command Authority Classification Matrix - 2026-05-23

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** Phase 2 governance hardening  
**Posture:** classify before changing authority  
**Authority Created:** false  
**Runtime Mutation:** false  
**Deployment Authority:** false

## Artifact Decision

`[KEEP:PHASE2-COMMAND-AUTHORITY-CLASSIFICATION-MATRIX-2026-05-23]`

This matrix classifies current command authority posture for Phase 2 governance hardening.

It does not create scopes, keys, branch protection rules, deployment authority, publication authority, workflow edits, or runtime mutation authority.

## Classification Source

This pass reviewed current local command and governance surfaces:

```txt
apps/sentinel/src/governance/policyEngine.js
apps/sentinel/src/security/roleScopeRegistry.js
apps/sentinel/src/surface/registry.js
apps/sentinel/src/commands/dispatch.js
docs/ROLE_SCOPE_REGISTRY_2026-05-21.md
docs/ROLE_KEY_GOVERNANCE_PACKET_2026-05-21.md
```

Verified opening checks are recorded in:

```txt
docs/PHASE2_GOVERNANCE_HARDENING_OPENING_PACKET_2026-05-23.md
```

## Authority Classes

| Class | Meaning | Movement Allowed |
| --- | --- | --- |
| `READ_ONLY_VISIBILITY` | visibility, lookup, audit, receipt, or state review | no mutation |
| `REVIEW_ONLY_ASSESSMENT` | organizes evidence or produces review artifacts | no execution authority |
| `OPERATOR_WORKFLOW` | routine governed workflow action | requires tenant, actor, role, scope, policy preflight, audit |
| `APPROVAL_REQUIRED` | may proceed only after approval path unlocks | approval is explicit and auditable |
| `PLATFORM_GOVERNED` | platform-maintenance or structural command | restricted to rare, explicit platform authority |
| `BLOCKED_OR_UNMAPPED` | no safe active authority classification yet | requires mapping or operator review before use |
| `EXTERNAL_OR_SENSITIVE` | external movement, sensitive payload, billing, export, or webhook class | held unless separately approved |

## Canonical Separations

```txt
approval:read != approval:review
audit:read != execution authority
receipt:read != execution authority
review artifact != authority
assessment != authorization
metrics != authority
platform:admin != routine operator access
contract:assess != legal advice
contract:assess != execution authority
```

## Current Command Matrix

| Command | Surface | Required Scope | Class | Boundary |
| --- | --- | --- | --- | --- |
| `application.submit` | OwnerFi | `application:submit` | `OPERATOR_WORKFLOW` | governed submit; not approval or execution |
| `deal.submit` | OwnerFi | `deal:submit` | `OPERATOR_WORKFLOW` | governed deal intake; not execution |
| `application.evaluate` | OwnerFi | `application:evaluate` | `OPERATOR_WORKFLOW` | evaluation only; not execution authority |
| `deal.approve` | OwnerFi | `deal:approve` | `APPROVAL_REQUIRED` | approval action; does not equal platform admin |
| `deal.execute` | OwnerFi | `deal:execute` | `APPROVAL_REQUIRED` | blocked for non-approver roles; approval unlock required |
| `media.polish` | OwnerFi | `media:polish` | `OPERATOR_WORKFLOW` | consent-based media workflow; not publication |
| `sentinel.media.polish` | OwnerFi | `media:polish` | `OPERATOR_WORKFLOW` | consent-based media workflow; not publication |
| `telemetry.harmonize` | OwnerFi | `telemetry:write` | `REVIEW_ONLY_ASSESSMENT` | harmonization artifact; metrics do not authorize execution |
| `support.ticket.create` | Customer Operations | `support:write` | `OPERATOR_WORKFLOW` | creates governed support ticket; no refund authority |
| `ticket.create` | Customer Operations | `support:write` | `OPERATOR_WORKFLOW` | alias class for support ticket creation |
| `support.refund.request` | Customer Operations | `support:refund` | `APPROVAL_REQUIRED` | request path; refund execution remains governed |
| `refund.request` | Customer Operations | `support:refund` | `APPROVAL_REQUIRED` | alias class for refund request |
| `contract.reclamation.assess` | Contract Reclamation | `contract:assess` | `REVIEW_ONLY_ASSESSMENT` | no legal advice, legal certainty, recovery claim, or execution |
| `approval.bottleneck.analyze` | Nunn Cloud | `platform:admin` | `PLATFORM_GOVERNED` | analysis only unless separately approved |
| `drift.issues.classify` | Nunn Cloud | `platform:admin` | `REVIEW_ONLY_ASSESSMENT` | classification; not corrective action |
| `drift.recommendation.instruct` | Nunn Cloud | `platform:admin` | `APPROVAL_REQUIRED` | instruction package remains pending approval |
| `repo.control.workflow.diagnose` | Nunn Cloud | `platform:admin` | `REVIEW_ONLY_ASSESSMENT` | diagnosis only; no workflow edits |
| `repo.control.workflow.retry` | Nunn Cloud | `platform:admin` | `PLATFORM_GOVERNED` | held unless operator explicitly approves retry authority |
| `repo.update.structure` | Nunn Cloud | `platform:admin` | `APPROVAL_REQUIRED` | repo mutation class; no authority from this document |
| `system.validate.integrity` | Nunn Cloud | `platform:admin` | `REVIEW_ONLY_ASSESSMENT` | validation only |
| `system.reframe.product` | Nunn Cloud | `platform:admin` | `PLATFORM_GOVERNED` | product language governance; no deployment |
| `ui.sync.labels` | Nunn Cloud | `platform:admin` | `PLATFORM_GOVERNED` | UI label sync requires explicit approval if mutating files |
| `dealFlow.run.demo` | Nunn Cloud | `platform:admin` | `REVIEW_ONLY_ASSESSMENT` | demo run only; no external claim without live refresh |
| `faceplane.mock.run` | Mock Faceplane | `platform:admin` | `REVIEW_ONLY_ASSESSMENT` | synthetic only; no real external integrations |
| `faceplane.mock.list` | Mock Faceplane | unmapped | `BLOCKED_OR_UNMAPPED` | handler exists but no policy scope mapping was found |
| `cdnlux.token.evaluate` | Nunn Cloud | `platform:admin` | `REVIEW_ONLY_ASSESSMENT` | evaluation only |
| `cdnlux.contract.evaluate` | Nunn Cloud | `platform:admin` | `REVIEW_ONLY_ASSESSMENT` | evaluation only |
| `docking.evaluate` | Nunn Cloud | `platform:admin` | `REVIEW_ONLY_ASSESSMENT` | evaluation only |

## Policy-Mapped Commands Without Active Surface Handler In This Pass

These commands are policy-scoped but were not confirmed as active surface handlers in the current registry pass. Treat them as blocked or integration-held until a handler, route, role, and operator purpose are verified.

| Command | Required Scope | Class | Boundary |
| --- | --- | --- | --- |
| `approval.read` | `approval:read` | `READ_ONLY_VISIBILITY` | view only |
| `approval.review` | `approval:review` | `APPROVAL_REQUIRED` | review authority only; not execution |
| `audit.read` | `audit:read` | `READ_ONLY_VISIBILITY` | visibility only |
| `receipt.read` | `receipt:read` | `READ_ONLY_VISIBILITY` | visibility only |
| `tenant.admin` | `tenant:admin` | `PLATFORM_GOVERNED` | tenant administration held |
| `platform.admin` | `platform:admin` | `PLATFORM_GOVERNED` | rare explicit authority only |
| `policy.evaluate` | `policy:evaluate` | `REVIEW_ONLY_ASSESSMENT` | policy review only |
| `security.write` | `security:write` | `EXTERNAL_OR_SENSITIVE` | held pending explicit approval |
| `telemetry.metric.write` | `telemetry:write` | `REVIEW_ONLY_ASSESSMENT` | metric evidence only |
| `telemetry.audit.summary` | `telemetry:write` | `REVIEW_ONLY_ASSESSMENT` | summary evidence only |
| `telemetry.export.external` | `telemetry:export` | `EXTERNAL_OR_SENSITIVE` | policy marks approval required |
| `telemetry.payload.sensitive` | `telemetry:export` | `EXTERNAL_OR_SENSITIVE` | policy marks approval required |
| `billing.checkout.session.create` | `billing:write` | `EXTERNAL_OR_SENSITIVE` | billing not ready-to-go; held |
| `billing.checkout.session.status` | `billing:read` | `READ_ONLY_VISIBILITY` | read only if handler/integration verified |
| `billing.webhook.receive` | `billing:webhook` | `EXTERNAL_OR_SENSITIVE` | webhook integration held |
| `openai.faceplane.execute` | `openai:execute` | `EXTERNAL_OR_SENSITIVE` | external execution held |
| `openai.faceplane.read` | `openai:read` | `READ_ONLY_VISIBILITY` | read only if handler verified |
| `task.template.orchestrate` | `task:orchestrate` | `REVIEW_ONLY_ASSESSMENT` | orchestration cannot create authority |
| `task.template.read` | `task:read` | `READ_ONLY_VISIBILITY` | read only |
| `task.template.execute` | `task:execute` | `APPROVAL_REQUIRED` | execution-adjacent; held |
| `learning.read` | `learning:read` | `READ_ONLY_VISIBILITY` | read only |
| `learning.write` | `learning:write` | `EXTERNAL_OR_SENSITIVE` | held unless approved |

## Gate Result

```yaml
phase2_command_authority_classification:
  status: COMPLETE_CURRENT_PASS
  review_only_commands_identified: true
  approval_required_commands_identified: true
  platform_governed_commands_identified: true
  unmapped_commands_identified:
    - faceplane.mock.list
  billing_and_external_execution: HELD
  repository_mutation_authority: false
  runtime_mutation_authority: false
  deployment_authority: false
  authority_created: false
```

## Recommended Phase 2 Next Actions

1. Build the tenant and scope contract matrix.
2. Build the audit and receipt visibility matrix.
3. Build the approval boundary preservation checklist.
4. Decide whether `faceplane.mock.list` should receive a read-only policy mapping or remain blocked.
5. Keep CI implementation approval separate from governance classification.

## Next Selected Action

```yaml
selected_action: phase2_tenant_scope_contract_matrix
deliverable: docs/PHASE2_TENANT_SCOPE_CONTRACT_MATRIX_2026-05-23.md
authority_created: false
```
