# Observability Signal Classification Matrix - 2026-05-29

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** observability signal classification  
**Phase:** `OBSERVABILITY_MATURATION`  
**State:** Review Only  
**Authority Created:** false

## Artifact Decision

```txt
[KEEP:OBSERVABILITY-SIGNAL-CLASSIFICATION-MATRIX-2026-05-29]
```

## Purpose

Classify SentinelOS governance and runtime signals by observability destination before Microsoft Sentinel implementation expands.

## Classification Legend

| Class | Meaning |
| --- | --- |
| `external_observable` | Safe for Microsoft Sentinel when emitted as bounded telemetry. |
| `metadata_only` | May be observable only as minimal state, count, or reference. |
| `internal_only` | Must remain inside SentinelOS governance records. |
| `not_authorized` | No current authority to emit or implement. |

## Matrix

| Signal | Classification | Destination | Rationale | Current Authority |
| --- | --- | --- | --- | --- |
| `command.auth.denied` | `external_observable` | Microsoft Sentinel | Security boundary evidence. | Existing event. |
| `command.auth.misconfigured` | `external_observable` | Microsoft Sentinel | Critical auth state evidence. | Existing event. |
| `command.request.invalid_json` | `external_observable` | Microsoft Sentinel | Request hygiene and attack-pattern visibility. | Existing event. |
| `command.request.blocked` | `external_observable` | Microsoft Sentinel | Governance boundary event. | Existing event. |
| `command.executed` | `external_observable` | Microsoft Sentinel | Execution trace and receipt support. | Existing event. |
| `proof.check.completed` | `metadata_only` | Future candidate | Useful proof evidence if summarized safely. | Review only. |
| `proof.check.failed` | `metadata_only` | Future candidate | Useful alert if reason taxonomy is safe. | Review only. |
| `runtime.health.checked` | `metadata_only` | Future candidate | Supports runtime health validation. | Review only. |
| `authority.expired` | `metadata_only` | Future candidate | Authority state may be observable without reasoning. | Review only. |
| `share.review.blocked` | `metadata_only` | Future candidate | Publication boundary can be visible without buyer context. | Review only. |
| `memory.classification` | `internal_only` | SentinelOS only | May expose memory sensitivity structure. | Held. |
| `protected_memory_content` | `internal_only` | SentinelOS only | Protected content is not SIEM telemetry. | Held. |
| `constitutional.reconciliation` | `internal_only` | SentinelOS only | Internal reasoning, not runtime telemetry. | Held. |
| `authority.balance.analysis` | `internal_only` | SentinelOS only | Governance judgment stays inside SentinelOS. | Held. |
| `directional.integrity.review` | `internal_only` | SentinelOS only | Strategic reasoning can exceed observability scope. | Held. |

## Export Rules

```yaml
export_rules:
  allowed_now:
    - existing_command_boundary_events
  future_candidates_require:
    - event_shape_review
    - privacy_review
    - payload_minimization
    - operator_approval
    - implementation_authority
  always_blocked:
    - secrets
    - protected_memory_content
    - private_deliberation
    - unreviewed_payloads
  authority_created: false
```

## Non-Authorization

This matrix does not authorize implementation, event expansion, Microsoft Sentinel rule creation, diagnostic-setting mutation, command changes, API contract renaming, protected memory exposure, staging, or committing.
