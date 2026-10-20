# GOV-006 Runtime Evidence Capture Log

**Capture date:** 2026-10-14  
**Approximate Azure Portal observation window:** 19:23–19:31 UTC  
**Record prepared:** 2026-10-14 20:40 UTC  
**Status:** Evidence collection in progress; GOV-006 remains **Verification — open**. No final PASS is established.

**Date correction note (2026-10-16):** The no-volume/no-mount and diagnostics-capture references in this log are aligned to the Operations Register date of **2026-10-15**.

## Scope and authority

This log records read-only observations made in the signed-in Azure Portal session and the evidence gaps encountered. It does not authorize or record a deployment, restart, image push, secret access or rotation, configuration change, or gate-status change.

## Resource identification

| Field | Observed value |
|---|---|
| Subscription ID | `82bd72d4-00ef-400d-839b-e168e980c510` |
| Resource group | `rg-nc-dev-sentinel` |
| Container App | `ca-nc-dev-sentinel` |
| Container Apps environment | `cae-nc-dev-sentinel` |
| Active revision shown | `ca-nc-dev-sentinel--sha-7eb0724-61-1` |
| Replica shown | `ca-nc-dev-sentinel--sha-7eb0724-61-1-dcf67fcf6-27r59` |
| Container | `sentinel` |

## Observations

| Evidence item | Observation | Source and qualification |
|---|---|---|
| App status | **Running** and **Ready for traffic** | Azure Portal Container App overview, observed during the capture window. |
| Revision status | Active revision shown as **Running** and **Healthy**, with one replica | Azure Portal revision view. The traffic column displayed `N/A`; no traffic percentage is asserted. |
| Configured image | `acrncdevsentinel.azurecr.io/sentinel-api:7eb0724c730ac5c6be545d4f30d24ce1f1d4a7cd` | Azure Portal revision/container configuration. This is a tag reference, not an immutable manifest digest or proof of the resolved image. |
| Ingress | Enabled; public access shown; target port **3000**; transport **Auto** | Azure Portal ingress configuration. |
| Probes | Startup, readiness, and liveness all use HTTP `/health` on port **3000** | Azure Portal container probe configuration. |
| Volumes | No app volumes and no container volume mounts shown | Azure Portal app Volumes and container Volume Mounts views. This is a configuration observation, not a durability test. |
| Historical startup log | `Sentinel API running on port 3000`, timestamped `2026-10-13T13:35:02Z` | Application log entry previously observed in Portal. It is historical and does not directly prove the current process is listening. |

## Collection attempts and limitations

- The Container Apps console page showed the active revision, replica, and `sentinel` container selected. Clicking **Connect** did not establish a console session. No command ran in the replica; effective user and live process/listener details remain unverified.
- An ACR repository/tag/digest lookup through the available authenticated Azure MCP path returned HTTP 401. The ACR Portal page did not expose usable repository/tag/digest details in the inspected view. No digest-to-revision binding was obtained.
- Browser Portal authentication was available, but Azure CLI/MCP credentials were not available for these additional read-only queries.
- The revision table displayed traffic as `N/A`; precise traffic allocation remains unverified.
- No restart/replacement or write test was performed. Durability across restart/replacement remains unverified.

## Evidence conclusions

1. The inspected configuration aligns on port **3000** across ingress target and all three probes. The historical startup log also reports port 3000. This does not substitute for direct current-process listener evidence.
2. The active revision is associated in the Portal with a SHA-like image tag. The immutable image digest and exact artifact provenance are still unknown.
3. No Azure volume or container volume mount was visible. Runtime write behavior and persistence durability have not been established.
4. These partial observations do not close the historical source/CI gaps concerning anchor initialization or scanner completeness.

## Open evidence requirements

- Capture an authoritative immutable image digest and tie it to the active revision.
- Capture direct, read-only runtime evidence of the effective user and listener for the selected replica.
- Obtain explicit revision traffic allocation from an authoritative view or API.
- Collect approved, non-destructive evidence of persistence behavior across restart/replacement.
- Independently review the completed evidence set before any GOV-006 disposition.

## Disposition and next action

**GOV-006: Verification — open. No final PASS.** Continue read-only evidence collection for the gaps above. This record does not change the governance gate or grant authority for runtime mutation. Keep PR #47 on HOLD under its separate review and validation requirements.

## Source-Level Storage and Retention Map — 2026-10-16

This is a source-code configuration map, not proof of the active Azure environment variables, live database target, successful writes, backup configuration, or retention enforcement. The October 15 Portal observation found no app volumes or container mounts on the inspected revision; it did not establish whether an external database or log workspace retains each record.

| Record or state | Source-defined destination | Restart/revision implication | Runtime/retention evidence |
|---|---|---|---|
| Sentinel command audit events | `audit_logs` in PostgreSQL through `DATABASE_URL` (`apps/sentinel/src/audit/auditLogger.js`, `apps/sentinel/src/db/client.js`, `apps/sentinel/src/db/schema.sql`). The logger also keeps an in-process `auditLog` array. | Database rows can outlive a container replacement if the configured database is external and available. The in-memory copy cannot. A failed database write is only added to the in-process array. | Database URL target, current DB write success, backups, and retention/expiry policy were not verified for GOV-006. |
| Sentinel governance/vendor/AI ledgers | JSONL files under `getRuntimeDataPath`, which uses `SENTINEL_DATA_DIR` or defaults to the OS temp directory (`apps/sentinel/src/runtime/dataPaths.js`). Source includes governance signal, drift-policy, threshold-change, vendor audit/operator, and OpenAI faceplane audit ledgers. | The Dockerfile sets `/var/lib/sentinelos` as `SENTINEL_DATA_DIR`, but the inspected Azure revision had no volume or mount. Files held only in the container writable layer must not be assumed to survive replacement. | Exact deployed environment and file contents were not inspected. No rotation, expiry, or backup policy was established by this review. |
| Scheduler heartbeat and system-release anchor | Heartbeat is a runtime-data JSON file. The release anchor is written under runtime data when `SENTINEL_DATA_DIR` is set, otherwise under repository `docs/anchors` (`apps/sentinel/src/governance/core/governanceStatus.js`, `apps/sentinel/src/verification/stateAnchors.js`). | File persistence depends on the configured path and any durable mount; neither a mount nor restart survival was verified. | No external anchor service or retention/backup evidence was established here. |
| Executive Desk command receipts | `RECEIPT_LEDGER_BACKEND` defaults to `memory`; optional `file` writes `.data/receipts.jsonl`; optional `postgres` uses `DATABASE_URL` (`apps/executive-desk/services/receipt-ledger.ts`, `receipt-ledger-file.ts`, `receipt-ledger-pg.ts`). | Memory is process-only. A file in the container filesystem is not durable across replacement absent a persistent mount. PostgreSQL is the source-defined durable option, but active selection is unverified. | The Executive Desk integration checklist still lists switching the live ledger to PostgreSQL as open. This is a distinct service and is not established as part of the inspected GOV-006 Sentinel API revision. |
| Executive Desk closeout state and run history | `CLOSEOUT_STATE_BACKEND` defaults to file at `.data/closeout-state.json`; optional memory backend is process-only (`apps/executive-desk/services/closeout-state.ts`). | File data needs a persistent external mount or a durable backend; no such mount was observed on the GOV-006 revision. | Active backend, backup, retention, and restart behavior are unverified. This is a distinct service, not proof of Sentinel API storage behavior. |
| Container console/system logs | The October 15 Portal capture showed Container Apps environment diagnostics enabled for console and system logs to `log-nc-dev-sentinel`; HTTP logs were disabled. | Logs are outside the app container when successfully delivered to the workspace. | Delivery/query was not tested in that capture; workspace retention duration, archive/export, and deletion policy remain unverified. |

### Preservation Priority and Open Verification

For GOV-006, treat command receipts, command audit events, approvals/governance decisions, and governance/vendor/AI audit ledgers as records requiring durable retention until an approved retention schedule says otherwise. Preserve operational heartbeat/cache state only if its recovery requirements call for it; distinguish it from authoritative audit evidence. This is a proposed classification for verification, not a retention-policy approval.

Read-only evidence still needed before making a durability claim:

1. Identify the active backends and non-secret destination/resource names for the inspected revision; do not expose connection strings or secret values.
2. Establish which listed records must survive restart, revision replacement, and regional recovery, and identify an approved retention schedule for each.
3. Verify database backup/retention and Log Analytics retention from authoritative configuration, plus the storage/mount or external backup destination for required file-based records.
4. Obtain authorized, non-destructive evidence that required records are present and can be read after a restart/replacement test. Do not run a restart or reconstruct historical evidence without separate authorization.

**Disposition unchanged:** GOV-006 remains Verification — open; no PASS, gate closure, runtime mutation, or storage-policy approval is established by this source-level map.

## Azure Read-Only Runtime Evidence Update — 2026-10-17

**Capture method:** read-only Azure CLI/API queries (no restart, no deployment, no secret-value retrieval).
**Status impact:** GOV-006 remains **Verification — open (technical HOLD)**.

### 1) Effective container/runtime storage configuration

| Evidence item | Observation (2026-10-17 capture) | Qualification |
|---|---|---|
| Active revision | `ca-nc-dev-sentinel--sha-7eb0724-61-1` (latest + ready) | Confirms runtime revision identity at capture time. |
| Ingress and port | External ingress enabled, targetPort `3000`, 100% traffic to latest revision | Aligns with prior Oct 15 observation; no port-change action indicated from this evidence pass. |
| Storage-related env selector | `DATABASE_URL` is populated by secret reference `database-url` | Confirms configured selector only, not secret value content. |
| Secret backing for DB selector | Secret `database-url` is mapped to Key Vault secret URL `.../secrets/billing-database-url` via user-assigned identity `id-nc-dev-sentinel` | Identifies destination reference path without exposing credentials. |
| Container volumes/mounts | `volumes: []` and `volumeMounts: null` | No configured app volume or mount in this revision. |
| Command/args override | none (`null`) | No runtime command override observed. |

### 2) Persistence destination (configured vs. proven writes)

| Evidence item | Observation (2026-10-17 capture) | Qualification |
|---|---|---|
| PostgreSQL resource present | `psql-nc-dev-sentinel` (`Microsoft.DBforPostgreSQL/flexibleServers`) in `rg-nc-dev-sentinel` | Establishes candidate persistence target resource in scope. |
| DB activity proxy | `active_connections` metric shows non-zero hourly maxima (7–10) on 2026-10-16 and 8–9 at 2026-10-17 00:00–01:00 UTC | Supports active DB connectivity in period; does not by itself prove specific Sentinel record writes for GOV-006 artifacts. |

### 3) Retention and recovery controls

| Evidence item | Observation (2026-10-17 capture) | Qualification |
|---|---|---|
| PostgreSQL backup retention | `backupRetentionDays: 7`, `geoRedundantBackup: Disabled`, `earliestRestoreDate` present | Confirms configured PITR window and geo-backup posture; does not prove restore exercise. |
| PostgreSQL HA | `highAvailability.mode: Disabled` | Documents recovery posture input for risk evaluation. |
| Log Analytics workspace | `log-nc-dev-sentinel` with `retentionInDays: 30` | Workspace-level retention confirmed. |
| Container Apps tables retention | `ContainerAppConsoleLogs`, `ContainerAppSystemLogs`, `ContainerAppHTTPLogs` (and `_CL` variants) each show `retentionInDays: 30` / `totalRetentionInDays: 30` | Table-level retention confirmed for relevant Container Apps logs. |
| Actual log delivery evidence | Query on `ContainerAppConsoleLogs_CL` for `ca-nc-dev-sentinel` over last 7 days returned `Count = 13`, `Latest = 2026-10-13T13:35:04.7974376Z`; sampled rows include startup log (`Sentinel API running on port 3000`) and emitted JSON security events (`surface.viewed`, `policy.route.blocked`, `command.auth.denied`) | Confirms ingestion occurred and app-origin logs are present; does not establish complete coverage for all required record types. |

### Remaining GOV-006 evidence gaps after this pass

1. **Record-level persistence proof:** still required for the specific governed records (receipts, audit events, governance/vendor/AI ledgers), not just infrastructure connectivity/activity.
2. **File-record durability proof:** no configured volume/mount in current revision; records that still write to container-local paths remain non-durable across replacement unless moved to approved durable backing.
3. **Recovery validation:** backup/PITR settings are now captured, but no authorized restore/readback exercise evidence is attached in this record.

## Artifact-Level Persistence Map — 2026-10-17

**Capture method:** read-only Azure resource/configuration queries, existing Log Analytics records, and source inspection. The database secret value was not retrieved. No data was written, and no restart or restore was performed. **GOV-006 remains Verification — technical HOLD.**

| Record class | Current evidence | Finding and remaining limit |
|---|---|---|
| PostgreSQL audit events | Active Sentinel revision `ca-nc-dev-sentinel--sha-7eb0724-61-1` has `DATABASE_URL` mapped to secret reference `database-url`; that ACA secret references Key Vault secret path `billing-database-url`. The resource group contains Flexible Server `psql-nc-dev-sentinel` (`psql-nc-dev-sentinel.postgres.database.azure.com`) and database `sentineldb`. Source defines `audit_logs` and `governance_signals` tables and writes Sentinel audit events/signals to them. | **Relationship not confirmed:** without reading the secret value or connecting through the app's configured database connection, the reference cannot be tied to `psql-nc-dev-sentinel` / `sentineldb`. PostgreSQL Entra query access returned 401. A read-only query attempt through ACA exec connected to the replica, but the non-interactive environment rejected its TTY and the SQL did not run. Existing row counts, timestamps, and attribution therefore remain unverified. |
| File-based governance/audit ledgers | Dockerfile sets `SENTINEL_DATA_DIR=/var/lib/sentinelos`; current ACA env has no override for `SENTINEL_DATA_DIR` or `SIGNAL_STORE_PATH`. Source routes governance signal, drift-policy, threshold-change, vendor audit/operator, OpenAI audit, scheduler heartbeat, and release-anchor files under that runtime directory (unless a per-file override is set). The active revision has no volumes or mounts. | These paths resolve to container-local storage under the inspected configuration; no durable file destination or external copy is configured in the ACA template. This establishes a replacement-durability risk, not that records have already been lost. Governance signals also have best-effort PostgreSQL persistence in source, but successful writes were not verified. |
| Console security events | In the preceding 30 days, `ContainerAppConsoleLogs_CL` contains Sentinel-origin structured events: `command.auth.denied` (6; latest Oct 10), `surface.viewed` (5; latest Oct 11), and `policy.route.blocked` (1; latest Oct 10). Source emits these JSON events with `console.log`; the app also emits other event types, but they were not observed in this query window. | Confirms delivery of these event classes, not complete security/audit coverage. Source audit-log writes and approval/governance records are not thereby shown to be emitted to console. Thirty-day Log Analytics retention is not an approved application-record retention schedule. |
| Executive Desk receipts/closeout | Resource inventory found two Container Apps: `ca-nc-dev-sentinel` (Sentinel API image) and `ca-sentinelos-proof` (image `sentinellos:latest`). Neither app template declares `RECEIPT_LEDGER_BACKEND` or `CLOSEOUT_STATE_BACKEND`. There is no separately named Executive Desk Container App in this resource group. | No dedicated Executive Desk deployment was identified. The `ca-sentinelos-proof` image's contents/entrypoint were not established, so its presence alone cannot prove whether Executive Desk is or is not bundled there. Its active receipt/closeout backend is therefore **not established**. |

### GOV-006 record survival and acceptance matrix

This matrix translates the current evidence into the exact decision questions still open for GOV-006: what each record is, where it currently lands, what must survive restart or replacement, and what proof is required before claiming acceptance.

| Record class | Current known storage path or service | Must survive restart? | Must survive replacement? | Acceptance proof still required |
|---|---|---:|---:|---|
| Sentinel audit events (`audit_logs`) | Intended PostgreSQL destination through `DATABASE_URL`; exact live target not yet tied to the inspected server/database | Yes | Yes | Read-only proof that the app's configured `DATABASE_URL` resolves to the approved PostgreSQL target, plus attributable rows showing successful writes and backup/retention coverage. |
| Governance signals with DB + file paths | Source writes governance signals to file paths under `SENTINEL_DATA_DIR`; source also defines PostgreSQL persistence for governance signals | Yes | Yes | Identify which copy is authoritative, prove successful durable writes to that authority, and show retention/backup coverage for the approved record of truth. |
| Drift-policy, threshold-change, vendor audit/operator, and OpenAI audit ledgers | Container-local JSONL paths under `SENTINEL_DATA_DIR` with no observed ACA volume or mount | Yes | Yes | Either prove an approved durable external backing or classify these as non-authoritative/transient. If they remain authoritative, show readback after restart/replacement or approved equivalent durability evidence. |
| Scheduler heartbeat | Container-local runtime data file under `SENTINEL_DATA_DIR` | Usually yes for continuity; exact requirement still needs approval | Not necessarily, unless recovery design depends on preserving prior heartbeat state | Explicit classification as operational state versus authoritative record, then proof aligned to that classification. |
| System-release anchor | Runtime data under `SENTINEL_DATA_DIR` when set; otherwise repository anchor path | Yes | Requirement depends on whether it is treated as operational convenience or authoritative evidence | Confirm deployed path and intended authority. If authoritative, provide durable backing/readback evidence; if not, record the boundary. |
| Container console/system logs | Log Analytics workspace `log-nc-dev-sentinel`, 30-day table/workspace retention | Yes, within configured retention | Yes, within configured retention | Show ingestion for the required event classes and confirm whether Log Analytics is accepted as evidence storage or only as secondary telemetry. |
| Executive Desk command receipts | Unknown in deployed environment; source defaults are memory, file, or PostgreSQL depending on `RECEIPT_LEDGER_BACKEND` | Yes | Yes | Identify the deployed backend for the live review surface, then prove readback durability across restart/replacement if receipts are authoritative review records. |
| Executive Desk closeout state / run history | Unknown in deployed environment; source default is file `.data/closeout-state.json` unless overridden | Yes, if needed for review continuity | Requirement depends on approved operating model | Confirm whether this state is authoritative workflow evidence or convenience state, then prove durable backing if required. |

### Evidence boundary and next action

The artifact-level pass confirms current selectors, candidate resources, container-local file paths, and specific console event classes. It does **not** establish that the configured database is the listed PostgreSQL server, that Sentinel records were successfully written there, that all required records are represented in Log Analytics, or that Executive Desk is deployed with a durable backend. Resolve those items through authorized read-only database access and proof-image identification; separately prepare any write, restart, or restore test for review and authorization.
