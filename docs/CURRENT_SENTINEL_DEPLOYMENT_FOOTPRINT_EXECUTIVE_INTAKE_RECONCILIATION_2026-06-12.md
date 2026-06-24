# Current Sentinel Deployment Footprint Executive Intake Reconciliation

**Date:** 2026-06-12
**Status:** REVIEW-HELD / EVIDENCE RECONCILED / LIVE DISCOVERY NOT AUTHORIZED
**Submitted command:** `DISCOVER_CURRENT_SENTINEL_DEPLOYMENT_FOOTPRINT`
**Authority created:** `false`

## Executive Determination

The submitted investigation correctly shifts attention from an unverified IBM
server claim toward the measurable Sentinel deployment footprint.

That shift is accepted as the recommended investigation direction. The
submitted architecture and live-state statements are not accepted as verified
current state without further evidence.

No Azure query, Foundry query, KQL query, health probe, secret retrieval,
connector execution, repository movement, automated repair, deployment, or AI
operating-setup change was authorized or performed by this reconciliation.

## Evidence First

### Repository-Supported Deployment Evidence

The repository contains evidence for the following:

| Surface | Repository evidence | Classification |
| --- | --- | --- |
| Sentinel API deployment | `.github/workflows/deploy.yml`, `Dockerfile`, and `docs/DEPLOYMENT.md` describe an Azure Container Apps deployment path | Implemented deployment contract; current-live state requires refresh |
| Azure Container App | `docs/DEPLOYMENT.md` records `ca-nc-dev-sentinel` and a historical revision | Recorded state; not verified current on 2026-06-12 |
| Azure Container Registry | Workflow and deployment documentation reference `acrncdevsentinel.azurecr.io` | Recorded/configured; current-live state requires refresh |
| PostgreSQL support | `apps/sentinel/src/db/client.js` supports optional PostgreSQL through `DATABASE_URL`; deployment documentation records prior persistence work | Implemented optional persistence; current instance and health unverified |
| Audit and governance state | Audit, approval, governance-signal, drift, and learning paths exist; some paths use in-memory or best-effort local persistence | Implemented bounded state; not proof of a general Memory Layer |
| Log Analytics / Microsoft Sentinel | Prior read-only discovery result records `log-nc-dev-sentinel` and Microsoft Sentinel enablement | Historical discovery evidence; current-live state requires refresh |
| Azure Key Vault references | Repository configuration and documentation contain Azure Key Vault references | Configuration evidence; not proof of live secret retrieval or HashiCorp Vault |
| Nexus / Bhindi / Vault retrieval | Fixture-only, default-off proof-of-concept artifacts are present in the worktree | POC/fixture concept; not a verified live service chain |

### Bounded Negative Findings

A bounded textual repository search found no direct evidence for:

* IBM purchase orders, invoices, serial numbers, rack assignments, datacenter
  receipts, or delivery confirmations.
* A verified IBM server location or operational status.
* A verified Azure AI Foundry resource or deployed Foundry integration.
* A live HashiCorp Vault service on port `8200`.
* A running Nexus UI service on port `3000`.
* A general-purpose live Sentinel Memory Layer.
* An implemented `DISCOVER_CURRENT_SENTINEL_DEPLOYMENT_FOOTPRINT` command.

These findings mean **not verified in the bounded repository evidence**, not
that the resources cannot exist externally.

## Interpretation Second

### Submitted Claim Reconciliation

| Submitted claim | Reconciled classification | Reason |
| --- | --- | --- |
| IBM server remains unverified | Accepted | No direct supporting repository evidence was found |
| `remotes/origin` indicates Git references, not server connections | Accepted | Git remote-tracking references do not establish infrastructure connectivity |
| `Nexus UI -> Sentinel API -> Vault -> PostgreSQL` is the current architecture | Not accepted as current state | It is a coherent target-state concept, but live Nexus and HashiCorp Vault services are unverified |
| Foundry is online and available to build into Sentinel | Unverified | No current Foundry resource or integration evidence was found |
| PostgreSQL is the Sentinel memory store | Partially supported | Optional PostgreSQL-backed persistence exists, but it is not evidence of a general Memory Layer |
| Vault is the trust layer | Conceptual / ambiguous | Azure Key Vault references and fixture-only Vault concepts do not establish a live HashiCorp Vault runtime |
| Current Sentinel host discovery is the highest-value next investigation | Accepted with authority limits | Current deployment evidence is measurable, but live external discovery requires an exact read-only gate |

### Current Defensible Architecture

The defensible repository-supported deployment path is:

```text
GitHub deployment workflow
        |
        v
Azure Container Registry
        |
        v
Azure Container App: Sentinel API
        |
        +--> optional PostgreSQL persistence through DATABASE_URL
        |
        +--> audit, approval, governance, drift, and learning state
        |
        +--> recorded Log Analytics / Microsoft Sentinel integration evidence
```

This diagram is a repository-supported contract and recorded-state summary. It
is not a declaration that every component is currently healthy or connected.

## Conclusion Last

The investigation direction is approved for **preparation and review only**.
The submitted command is not an implemented Sentinel command and does not
authorize external discovery.

The next controlled gate is:

```text
REVIEW_READ_ONLY_CURRENT_SENTINEL_DEPLOYMENT_FOOTPRINT_DISCOVERY_SCOPE
```

Approval of that exact gate would authorize review of the proposed discovery
scope. It would not by itself authorize execution.

## Proposed Read-Only Discovery Manifest

The discovery manifest should request only metadata needed to answer:

1. Which Azure subscription and tenant contain the recorded Sentinel resources?
2. Which resource groups, Container Apps, managed environments, and container
   registries are associated with Sentinel?
3. Which Azure AI Foundry or related AI resources, if any, are present?
4. Which PostgreSQL resources are associated with Sentinel, without retrieving
   credentials, connection strings, or customer data?
5. Which Azure Key Vault resources are associated with Sentinel, without
   listing or retrieving secret values?
6. Is there any separately evidenced HashiCorp Vault endpoint or deployment?
7. Which health endpoints are documented, and which exact probes would require
   separate network-execution approval?
8. Which repositories and workflows are deployment authorities versus
   historical, conceptual, or older-repository evidence?

## Preserved Holds

Until separately and exactly authorized:

* No Azure CLI or portal discovery.
* No KQL or telemetry query.
* No health-endpoint or network probe.
* No Foundry integration or other AI operating-setup change.
* No secret, credential, connection-string, or Vault-value retrieval.
* No external connector execution.
* No automated repair or repository movement.
* No staging, commit, push, deployment, or runtime mutation.

The active Sentinel AI change hold remains controlling. Any proposal to connect
Foundry, change models, alter prompts, add tools, or modify the current AI
operating setup requires its own exact change-review request and approval.
