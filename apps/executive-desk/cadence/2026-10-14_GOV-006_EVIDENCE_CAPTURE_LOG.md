# GOV-006 Runtime Evidence Capture Log

**Capture date:** 2026-10-14  
**Approximate Azure Portal observation window:** 19:23–19:31 UTC  
**Record prepared:** 2026-10-14 20:40 UTC  
**Status:** Evidence collection in progress; GOV-006 remains **Verification — open**. No final PASS is established.

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

This is a source-code configuration map, not proof of the active Azure environment variables, live database target, successful writes, backup configuration, or retention enforcement. The October 14 Portal observation found no app volumes or container mounts on the inspected revision; it did not establish whether an external database or log workspace retains each record.

| Record or state | Source-defined destination | Restart/revision implication | Runtime/retention evidence |
|---|---|---|---|
| Sentinel command audit events | `audit_logs` in PostgreSQL through `DATABASE_URL` (`apps/sentinel/src/audit/auditLogger.js`, `apps/sentinel/src/db/client.js`, `apps/sentinel/src/db/schema.sql`). The logger also keeps an in-process `auditLog` array. | Database rows can outlive a container replacement if the configured database is external and available. The in-memory copy cannot. A failed database write is only added to the in-process array. | Database URL target, current DB write success, backups, and retention/expiry policy were not verified for GOV-006. |
| Sentinel governance/vendor/AI ledgers | JSONL files under `getRuntimeDataPath`, which uses `SENTINEL_DATA_DIR` or defaults to the OS temp directory (`apps/sentinel/src/runtime/dataPaths.js`). Source includes governance signal, drift-policy, threshold-change, vendor audit/operator, and OpenAI faceplane audit ledgers. | The Dockerfile sets `/var/lib/sentinelos` as `SENTINEL_DATA_DIR`, but the inspected Azure revision had no volume or mount. Files held only in the container writable layer must not be assumed to survive replacement. | Exact deployed environment and file contents were not inspected. No rotation, expiry, or backup policy was established by this review. |
| Scheduler heartbeat and system-release anchor | Heartbeat is a runtime-data JSON file. The release anchor is written under runtime data when `SENTINEL_DATA_DIR` is set, otherwise under repository `docs/anchors` (`apps/sentinel/src/governance/core/governanceStatus.js`, `apps/sentinel/src/verification/stateAnchors.js`). | File persistence depends on the configured path and any durable mount; neither a mount nor restart survival was verified. | No external anchor service or retention/backup evidence was established here. |
| Executive Desk command receipts | `RECEIPT_LEDGER_BACKEND` defaults to `memory`; optional `file` writes `.data/receipts.jsonl`; optional `postgres` uses `DATABASE_URL` (`apps/executive-desk/services/receipt-ledger.ts`, `receipt-ledger-file.ts`, `receipt-ledger-pg.ts`). | Memory is process-only. A file in the container filesystem is not durable across replacement absent a persistent mount. PostgreSQL is the source-defined durable option, but active selection is unverified. | The Executive Desk integration checklist still lists switching the live ledger to PostgreSQL as open. This is a distinct service and is not established as part of the inspected GOV-006 Sentinel API revision. |
| Executive Desk closeout state and run history | `CLOSEOUT_STATE_BACKEND` defaults to file at `.data/closeout-state.json`; optional memory backend is process-only (`apps/executive-desk/services/closeout-state.ts`). | File data needs a persistent external mount or a durable backend; no such mount was observed on the GOV-006 revision. | Active backend, backup, retention, and restart behavior are unverified. This is a distinct service, not proof of Sentinel API storage behavior. |
| Container console/system logs | The October 14 Portal capture showed Container Apps environment diagnostics enabled for console and system logs to `log-nc-dev-sentinel`; HTTP logs were disabled. | Logs are outside the app container when successfully delivered to the workspace. | Delivery/query was not tested in that capture; workspace retention duration, archive/export, and deletion policy remain unverified. |

### Preservation Priority and Open Verification

For GOV-006, treat command receipts, command audit events, approvals/governance decisions, and governance/vendor/AI audit ledgers as records requiring durable retention until an approved retention schedule says otherwise. Preserve operational heartbeat/cache state only if its recovery requirements call for it; distinguish it from authoritative audit evidence. This is a proposed classification for verification, not a retention-policy approval.

Read-only evidence still needed before making a durability claim:

1. Identify the active backends and non-secret destination/resource names for the inspected revision; do not expose connection strings or secret values.
2. Establish which listed records must survive restart, revision replacement, and regional recovery, and identify an approved retention schedule for each.
3. Verify database backup/retention and Log Analytics retention from authoritative configuration, plus the storage/mount or external backup destination for required file-based records.
4. Obtain authorized, non-destructive evidence that required records are present and can be read after a restart/replacement test. Do not run a restart or reconstruct historical evidence without separate authorization.

**Disposition unchanged:** GOV-006 remains Verification — open; no PASS, gate closure, runtime mutation, or storage-policy approval is established by this source-level map.
