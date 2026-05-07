# Sentinel Orchestrated Workflow Engine

Approval Badge: `[APPROVED:TASK-SYSTEM]`

Status: Implemented as a governed orchestration layer.

Date: 2026-05-04

## Demo Language

| Internal name | Operator/demo label |
| --- | --- |
| Task Templates | Orchestrated Workflow Engine |
| Ingest | Initialize Workflow |
| Run | Execution Session |

## Purpose

The Orchestrated Workflow Engine lets Sentinel ingest planning material, organize it into a timeline, classify human approvals, and queue XE assistance without executing anything prematurely.

This is the bridge between:

- repo/document governance,
- category approval notices,
- human approval gates,
- Sentinel XE assistance,
- audit evidence.

## Runtime Mapping

| Capability | Location | Governance reason |
| --- | --- | --- |
| Template classification | `apps/sentinel/src/orchestration/taskTemplates.js` | Keeps task categories deterministic before approval. |
| Timeline orchestration | `apps/sentinel/src/orchestration/taskTemplates.js` | Gives Sentinel an ordered view of what should happen next. |
| Human approval candidates | `apps/sentinel/src/orchestration/taskTemplates.js` | Separates approval-needed work from ordinary follow-through. |
| XE assistance queue | `apps/sentinel/src/orchestration/taskTemplates.js` | Marks actions XE can assist with only after approval gates are met. |
| Approval boundary output | `apps/sentinel/src/orchestration/taskTemplates.js` | Returns `requiresApproval`, `xeActions`, `blockedActions`, and `allowedActions` for demo-visible governance. |
| Execution block | `apps/sentinel/src/orchestration/taskTemplates.js` | Returns `BLOCKED` for approval-gated steps until the matching approval is approved. |
| Command bridge | `task.template.execute` | Treats workflow step execution as a governed command. |
| API ingest route | `POST /task-templates/ingest` | Lets Sentinel ingest a task set and optionally raise approval records. |
| API run listing | `GET /task-templates/runs` | Lets operators inspect orchestrated runs. |
| API run detail | `GET /task-templates/runs/:runId` | Lets operators review the full timeline, approvals, and XE queue. |
| API step execution | `POST /task-templates/runs/:runId/steps/:taskId/execute` | Attempts execution and blocks if approval is still pending. |
| Route policy | `apps/sentinel/src/governance/policyEngine.js` | Requires `task:orchestrate` or `task:read`. |
| Principal scopes | `apps/sentinel/src/security/keyRegistry.js` | Platform keys include task read/orchestrate capability. |
| Verification | `scripts/check-task-templates.js` | Proves classification, timeline, approval candidates, XE queue, and approval creation. |

## Categories

| Category | Badge | Approval behavior | XE behavior | Final approval path |
| --- | --- | --- | --- | --- |
| `mapping_alignment` | `[APPROVED:MAPPING]` | Human review unless explicitly marked not required. | Not XE by default. | Confirm mapping evidence and preserve canonical source. |
| `conditional_approval` | `[APPROVE:CONDITIONAL]` | Human review required. | XE eligible when assistance is requested. | Gather evidence, verify, then approve or reject. |
| `held_review` | `[HOLD:REVIEW]` | Human review required. | Not XE by default. | Resolve source, audience, compliance boundary, and publication status. |
| `xe_assistance` | `[XE:ASSISTANCE]` | Approval before execution. | XE eligible. | Create approval, approve, then run through XE with audit logging. |

## Ingest Contract

```json
{
  "tenant": "ownerfi",
  "runId": "task_run_ownerfi_approval_cycle",
  "createApprovals": true,
  "tasks": [
    {
      "id": "task_vendor_final",
      "title": "Finalize vendor onboarding approval",
      "category": "conditional",
      "source": "docs/VENDOR_ONBOARDING_RULE_SET_V1.md",
      "xeRequired": true,
      "nextStep": "Route final evidence for human approval."
    }
  ]
}
```

## Output

Sentinel returns:

- `timeline`: ordered tasks with category, badge, due time, status, approval need, and next step.
- `approvalCandidates`: tasks that must reach human approval.
- `requiresApproval`: demo-visible approval boundary rows.
- `xeQueue`: tasks XE can assist with, including the guardrail status.
- `xeActions`: demo-visible actions ready for XE.
- `blockedActions`: step names blocked by approval requirements.
- `allowedActions`: step names allowed for XE.
- `approvalRecords`: created approval IDs when `createApprovals` is true.
- `auditHash`: deterministic hash of the orchestrated run.

## Execution Enforcement

Workflow execution uses the governed command label `task.template.execute`.

If a step requires approval and the matching approval is still pending, execution returns:

```json
{
  "status": "BLOCKED",
  "reason": "Approval required",
  "requiredRole": "approver",
  "command": "task.template.execute"
}
```

After the matching approval is approved, the same step can return `SUCCESS`.

## Approval Boundary

This system does not approve work by itself. It organizes the work, brings the approval forward, and blocks execution until approval exists.

No XE action should execute when its queue item says `waiting_for_approval`.

No held review item should become canonical or external based only on template ingestion.

No streamlining, deletion, archive, merge, or runtime refactor is authorized by this system unless a matching approval notice exists.

## Verification

Run:

```bash
npm run check:task-templates
```

Expected result:

```text
Task template orchestration check passed
```
