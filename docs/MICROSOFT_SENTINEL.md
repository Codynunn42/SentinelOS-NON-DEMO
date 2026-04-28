# Microsoft Sentinel Integration

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Purpose

This repository emits structured security and command-execution events that are intended to flow into Azure Log Analytics and Microsoft Sentinel.

The immediate goal is simple:

- keep `/command` locked behind `SENTINEL_API_KEY`
- emit machine-readable audit/security events to stdout
- route Container Apps console logs into the Log Analytics workspace that has Microsoft Sentinel enabled

## Repo Signals

The API now emits JSON events for the `/command` boundary in [apps/api/server.js](../apps/api/server.js):

- `command.auth.misconfigured`
- `command.auth.denied`
- `command.request.invalid_json`
- `command.request.blocked`
- `command.executed`

These are written to stdout and should appear in Azure Container Apps console logs.

## Azure Wiring

Use an existing Log Analytics workspace that has Microsoft Sentinel enabled.

### 1. Container App secret and env

Set the application secret in Azure Container Apps:

- secret name: `SENTINEL_API_KEY`
- environment variable: `SENTINEL_API_KEY`

The repo template also shows a secret-backed version in [azure/container-app.yaml](../azure/container-app.yaml).

### 2. Send Container Apps logs to Log Analytics

In Azure:

1. Open the Container Apps environment that hosts the Sentinel API.
2. Go to `Diagnostic settings`.
3. Add a diagnostic setting that sends logs to the Log Analytics workspace used by Microsoft Sentinel.
4. Enable at least:
   - `ContainerAppConsoleLogs`
   - `ContainerAppSystemLogs`

Microsoft documents the Container Apps console log table as `ContainerAppConsoleLogs` when routed through Azure Monitor diagnostic settings. Source:

- <https://learn.microsoft.com/en-us/azure/azure-monitor/reference/tables/containerappconsolelogs>

## Verification Queries

Run these in the Log Analytics workspace that backs Microsoft Sentinel.

### Recent Sentinel API security events

```kusto
ContainerAppConsoleLogs
| where TimeGenerated > ago(1h)
| where ContainerAppName == "sentinel-api"
| where Log contains "\"source\":\"sentinel-api\""
| order by TimeGenerated desc
```

### Unauthorized attempts

```kusto
ContainerAppConsoleLogs
| where TimeGenerated > ago(24h)
| where ContainerAppName == "sentinel-api"
| where Log contains "\"eventType\":\"command.auth.denied\""
| project TimeGenerated, ContainerAppName, RevisionName, Log
| order by TimeGenerated desc
```

### Executed commands

```kusto
ContainerAppConsoleLogs
| where TimeGenerated > ago(24h)
| where ContainerAppName == "sentinel-api"
| where Log contains "\"eventType\":\"command.executed\""
| project TimeGenerated, ContainerAppName, RevisionName, Log
| order by TimeGenerated desc
```

## Detection Ideas

Start with these Microsoft Sentinel analytics ideas:

- alert on repeated `command.auth.denied` events from the same time window
- alert on any `command.auth.misconfigured` event
- alert on command volume spikes outside normal operator windows
- correlate `command.executed` with deployment or revision changes

## Current Boundary

This integration gives the workspace a real monitoring path, but it is not full SIEM maturity yet.

Still planned:

- persistent audit store in addition to stdout
- receipt lookup by `receiptId`
- key rotation procedure
- role-based access beyond a single API key

## Definition Of Done

This workspace can be considered Microsoft Sentinel-ready for phase 1 when:

1. the Container App secret is set
2. `/command` rejects requests without `x-api-key`
3. Container Apps diagnostics send console logs to the Sentinel-backed workspace
4. the KQL queries above return the expected auth and execution events
