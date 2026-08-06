# SentinelOS Security Event Taxonomy - 2026-05-29

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** security event taxonomy  
**Phase:** `OBSERVABILITY_MATURATION`  
**State:** Review Only  
**Authority Created:** false

## Artifact Decision

```txt
[KEEP:SENTINELOS-SECURITY-EVENT-TAXONOMY-2026-05-29]
```

## Purpose

Define which SentinelOS security and execution events are safe candidates for Microsoft Sentinel observation.

This taxonomy separates external telemetry from internal governance reasoning.

## Event Class Rules

```yaml
event_class_rules:
  externally_observable:
    definition: bounded runtime or security fact useful for monitoring and reconciliation
    requirement: no protected memory, private deliberation, secret, tenant-sensitive payload, or authority reasoning
  internal_only:
    definition: governance reasoning, protected content, operator-private deliberation, or constitutional analysis
    requirement: remain inside SentinelOS governance records unless separately classified
  authority_created: false
```

## Phase 1 Events

| Event Type | Class | Source | Microsoft Sentinel Use | Boundary |
| --- | --- | --- | --- | --- |
| `command.auth.misconfigured` | security boundary | `/v1/command` | critical alert candidate | Does not expose secret value. |
| `command.auth.denied` | security boundary | `/v1/command` | denied access detection | Does not identify protected operator context. |
| `command.request.invalid_json` | request hygiene | `/v1/command` | malformed request visibility | Does not include full sensitive payload. |
| `command.request.blocked` | governance boundary | `/v1/command` | blocked command review | Does not authorize unblock. |
| `command.executed` | execution receipt | `/v1/command` | execution trace validation | Does not replace governed receipt. |

## Phase 1 Candidate Extensions

| Event Type | Class | Expected Use | Required Review Before Emission |
| --- | --- | --- | --- |
| `proof.check.completed` | proof evidence | validate proof checks completed | define safe summary fields |
| `proof.check.failed` | proof evidence | alert on failed proof check | define safe failure reason taxonomy |
| `runtime.health.checked` | runtime health | correlate runtime health checks | avoid sensitive endpoint detail |
| `authority.expired` | authority boundary | observe stale or expired authority state | emit only metadata, not reasoning |
| `share.review.blocked` | publication boundary | observe blocked share attempts | avoid buyer-private context |

## Internal-Only Signals

| Signal | Reason |
| --- | --- |
| `memory.classification` | May reveal protected memory structure or sensitivity. |
| `protected_memory_content` | Never suitable for SIEM export. |
| `constitutional.reconciliation` | Internal reasoning should not become external telemetry by default. |
| `authority.balance.analysis` | Governance judgment belongs inside SentinelOS. |
| `directional.integrity.review` | May include private strategic reasoning. |
| `operator_private_deliberation` | Operator intent and deliberation remain internal. |
| `buyer_private_context` | Commercial context requires separate audience and disclosure review. |

## Minimum Event Shape

```yaml
minimum_event_shape:
  source: sentinel-api
  eventType: string
  timestamp: iso8601
  requestId: string_optional
  tenant: string_optional_sanitized
  command: string_optional_sanitized
  result: string
  receiptId: string_optional
  severity: informational_or_warning_or_error
```

## Forbidden Fields

```yaml
forbidden_fields:
  - raw_secret
  - api_key
  - bearer_token
  - protected_memory_content
  - sealed_packet_content
  - operator_private_notes
  - buyer_private_details
  - full_unreviewed_payload
```

## Non-Authorization

This taxonomy does not authorize event emission changes, schema changes, diagnostic settings, Microsoft Sentinel rule creation, runtime mutation, publication, staging, or committing.
