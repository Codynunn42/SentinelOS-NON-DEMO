# Mission Control To Sentinel Mapping - 2026-05-29

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** Mission Control to Microsoft Sentinel mapping  
**Phase:** `OBSERVABILITY_MATURATION`  
**State:** Review Only  
**Authority Created:** false

## Artifact Decision

```txt
[KEEP:MISSION-CONTROL-TO-SENTINEL-MAPPING-2026-05-29]
```

## Purpose

Map Mission Control operator-readable signals to Microsoft Sentinel observation signals without creating UI implementation authority or Microsoft Sentinel configuration authority.

## Mapping Rule

```txt
Mission Control shows governed state.
Microsoft Sentinel observes external runtime and security evidence.
Neither display surface creates authority.
```

## First-View Mapping

| Mission Control Signal | Mission Control State | Microsoft Sentinel Observation | Boundary |
| --- | --- | --- | --- |
| Direction Check | `aligned` | drift or anomaly detections may inform review | Detections do not decide direction. |
| Authority Check | `held` | `command.auth.denied`, `authority.expired` candidate | Auth events do not create authority. |
| Trust Review | `coherent` | event consistency and security validation | External validation does not publish claims. |
| Proof Check | `verified_current_scope` | `proof.check.completed` candidate, KQL evidence | Proof evidence is freshness-sensitive. |
| Runtime Health | `stable_held` | ContainerAppConsoleLogs and ContainerAppSystemLogs | Stable logs do not imply launch readiness. |
| Security Telemetry | `flowing_to_microsoft_sentinel` | command-boundary events in Log Analytics | Telemetry flow does not expand scope. |
| Receipt | `recorded` | `command.executed` with optional `receiptId` | Log record supports but does not replace receipt. |
| Next Step | `review_scoped` | phase 1 acceptance checks | Acceptance checks do not authorize implementation. |

## Example Mission Control Readout

```yaml
mission_control_readout:
  direction_check: aligned
  authority_check: held
  proof_check: verified
  runtime_health: stable
  security_telemetry: flowing_to_microsoft_sentinel
  last_receipt: command.executed
  next_step: microsoft_sentinel_phase1_acceptance_packet
  authority_created: false
```

## KQL Evidence Pointers

| Observation Need | KQL Evidence Source |
| --- | --- |
| command boundary events | `ContainerAppConsoleLogs` filtered by `source == sentinel-api` |
| unauthorized attempts | `ContainerAppConsoleLogs` filtered by `eventType == command.auth.denied` |
| executed commands | `ContainerAppConsoleLogs` filtered by `eventType == command.executed` |
| runtime support logs | `ContainerAppSystemLogs` and Container Apps revision metadata |

## UI Boundary

This mapping may inform future Mission Control display design, but it does not authorize UI implementation.

```yaml
ui_boundary:
  allowed_now:
    - document_mapping
    - preserve_signal_language
    - identify_evidence_pointers
  prohibited:
    - add_ui_panel
    - add_api_endpoint
    - rename_existing_contracts
    - create_execute_control
    - create_sentinel_configuration_workflow
  authority_created: false
```

## Non-Authorization

This mapping does not authorize Mission Control UI work, runtime mutation, command changes, API contract renaming, Microsoft Sentinel analytics-rule creation, diagnostic-setting mutation, publication expansion, staging, or committing.
