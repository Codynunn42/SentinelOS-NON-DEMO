# GOV-006 Runtime Review — Remediation and Evidence Record (October 22, 2026)

Collector: Cody Nunn (read-only collector; Azure CLI identity `codynunn.azure@gmail.com`), assisted by an AI assistant.
Captured: 2026-10-22, 22:53Z–23:15Z (3:53–4:15 PM Arizona MST).
Responds to: Freddie Neale's October 22 GOV-006 runtime review (REJECT on substitute materials; criteria A–D FAIL).
Target revision: `ca-nc-dev-sentinel--sha-7eb0724-61-1` (app `ca-nc-dev-sentinel`, RG `rg-nc-dev-sentinel`, subscription `82bd72d4-00ef-400d-839b-e168e980c510`).

**Boundary.** This record is evidence only. It does not approve, deploy, roll back, or change any gate.
GOV-006 remains **Verification / Technical HOLD**, GOV-001 **Conditional**, GOV-002 **HOLD**, ACT-019 **In Progress**.
Freddie's REJECT stands until he re-reviews the delivered packet.

## 0. Packet delivery finding — root cause and fix

| Item | Finding |
|---|---|
| Freddie's finding | `apps/executive-desk/cadence/2026-10-21_OWNERFI_AND_DEAL_EXECUTION_AZURE_EVIDENCE.md` absent from `main` and `exec/oct-12-governance-checkpoint`, and not attached to the handoff email. |
| Root cause (verified) | The file and the other October 20–22 cadence records existed only as **untracked files** in Codespace `cautious-goldfish-7v5v75r7w9663xvjq`; they had never been committed or pushed. Freddie's finding was correct. |
| Fix | Published to branch `evidence/gov006-runtime-packet-2026-10-22` together with this record. Delivery to Freddie still requires a separate handoff by Cody. |

## 1. Criterion A — Image digest binding

| Evidence | Result | Source |
|---|---|---|
| Revision template image | `acrncdevsentinel.azurecr.io/sentinel-api:7eb0724c730ac5c6be545d4f30d24ce1f1d4a7cd` (tag, not digest) | `az containerapp revision list --all` |
| Running replica | `ca-nc-dev-sentinel--sha-7eb0724-61-1-dcf67fcf6-vbgfb`, created 2026-10-22T03:31:48Z, Running, restartCount 0 | ARM `revisions/.../replicas` (api 2025-01-01, 2025-02-02-preview, 2024-10-02-preview) — **no digest field is exposed** |
| Platform pull event | `Successfully pulled image ".../sentinel-api:7eb0724c…" … Image size: 91888884 bytes` at 2026-10-22T03:32:22Z for replica `…-vbgfb` | Log Analytics `ContainerAppSystemLogs_CL`, Reason `ImagePulled` |
| ACR tag → digest | `sha256:85f535354fdf7cadd4d729e6fae3341f0c861b040ae2237f6578234590d6cca9`; tag created **and last updated** 2026-10-05T04:05:33.55Z (not rewritten after) | `az acr repository show` |
| Manifest integrity | Raw manifest is 2,204 bytes and hashes to `85f53535…` | `az acr manifest show --raw` + `sha256sum` |
| Size binding | config + 9 layers = 91,886,680 bytes; + manifest 2,204 = **91,888,884 bytes = exact size reported at pull** | computed |
| Uniqueness | No other of the 58 manifests in `sentinel-api` shares that image size | `az acr manifest list-metadata` |
| Registry controls | Tag `writeEnabled: true`, `deleteEnabled: true`; trust (Notary) policy disabled; Basic SKU | `az acr show`, `az acr repository show` |

**Assessment: strengthened, not closed.**
- Tag timing, manifest hash and exact pull size together bind the running replica to `sha256:85f53535…` with high confidence.
- The platform still does not attest the digest directly, and the tag remains mutable and unsigned.
- **Forward fix (code, not deployed):** branch `fix/deploy-digest-pin-approval-gate`, commit `a28b89ddfe40ad27726462d4125f99691d5adea9`. Future revisions will be deployed as `repo@sha256:…`, will set `GIT_SHA`, and will be validated against that digest.

## 2. Criterion B — Durability and recovery

| Evidence | Result |
|---|---|
| Restarts on target revision | Replica exits (code 137) at 02:58Z and 03:32Z on Oct 22. A new replica `…-vbgfb` was created at 03:31:48Z and pulled the same tag (see v2 packet system logs). |
| Database | `psql-nc-dev-sentinel`: PostgreSQL 16, Burstable `Standard_B1ms`, 32 GB, **HA disabled**, zone 1, backup retention **7 days**, **geo-redundant backup disabled**, earliest restore 2026-10-16T17:21:16Z, public network access enabled. |
| Live readiness 22:55Z | `/health` 200 `database: enabled`; `/ready` 200 with checks `database: ok`, `auditStore: ok`, `ledger: ok`; `commit: "unknown"` because `GIT_SHA` is unset. |
| Authenticated probe 23:11Z | Key read from the app secret, never printed (64 chars). Tenant `nunncloud`: `/approvals` 200 (count 0), `/v1/metrics` 200 (3 events, all approved), `/v1/traces` 200 (0), `/v1/alerts` 200 (0). |
| `/governance/status` 23:11Z | **HTTP 503, `status: degraded`, `ready: false`.** Only failing check: `scheduler_heartbeat` (`heartbeat_missing`, path `/var/lib/sentinelos/sentinel_scheduler_heartbeat.json`). |

Code-level durability findings (repo at `7eb0724`):
1. **Audit writes are durable; audit reads are not.**
   - `auditLogger.log` inserts every entry into Postgres `audit_logs`.
   - `getAll` and `getByTenant` serve an in-process array that resets on restart.
   - `/v1/metrics`, `/v1/traces`, `/v1/alerts` and `/v1/audit/:id` therefore report only events since the current replica started. The 3 events above are post-03:31Z.
   - Receipt lookup (`/v1/receipts/:id`) does fall back to Postgres.
2. **Audit hash chain restarts on every replica start.** `lastAuditHash` is initialised to `null` and never re-seeded from the database, so each restart begins a new chain segment.
3. **Runtime ledgers are ephemeral.**
   - The app has **no volumes** (`template.volumes: []`, no mounts).
   - `/var/lib/sentinelos/*.jsonl` (drift policy ledger, scheduler heartbeat) is lost on restart; the drift ledger shows `entryCount: 0`.
4. **The scheduler heartbeat is never written in Azure.**
   - The only writer is `scripts/write-governance-heartbeat.js`.
   - The container runs `node apps/api/server.js`, and no Container Apps job exists. `/governance/status` will stay 503 until that changes.

**Assessment: FAIL remains accurate.** No pre-restart record was shown to survive.
- The only exact persistence proof available read-only would be a receipt ID created before 03:31Z, resolved via `/v1/receipts/:id`. None was available without direct database access, which was not authorized.
- Remediation options are listed in section 6.

## 3. Criterion C — Rollback readiness

| Evidence | Result |
|---|---|
| Candidate | `ca-nc-dev-sentinel--sha-c1aece8-60-1`: inactive, last state Healthy / Provisioned, created 2026-09-28T20:32:31Z, image tag `c1aece8f4b73…` → digest `sha256:c424aad744e3…` (present in ACR) |
| Lineage | `c1aece8` **is an ancestor** of `7eb0724` (main). The delta is 5 commits from PR #44 touching only `apps/sentinel/src/controlPlane/validate.js` and its test: no schema, migration, dependency or config change. **Schema-compatible rollback.** |
| Revision mode | **Single.** `az containerapp revision activate` on an old revision makes it the only active revision and shifts **100 % of production traffic** to it. |
| Rehearsal | **Not executed.** It was authorized only as "activate at 0 % traffic, no traffic shift", which Single mode cannot do. A safe rehearsal needs either a temporary switch to Multiple mode with explicit 100/0 weights, or a disposable clone app. Both need a new authorization. |

Documented rollback procedure (requires Cody's explicit authorization at the time of use):
```bash
# Option 1 — preferred: new revision pinned to the prior digest (Single mode safe, auditable)
az containerapp update -n ca-nc-dev-sentinel -g rg-nc-dev-sentinel \
  --image acrncdevsentinel.azurecr.io/sentinel-api@sha256:c424aad744e3ae7e806874c1fe23ff5319a11e930b4a4458269dcb54f4304728 \
  --revision-suffix rollback-c1aece8-<yyyymmdd>
# Option 2 — reactivate the retained revision (shifts 100% traffic immediately in Single mode)
az containerapp revision activate -n ca-nc-dev-sentinel -g rg-nc-dev-sentinel \
  --revision ca-nc-dev-sentinel--sha-c1aece8-60-1
# Verify after either option
curl -s https://ca-nc-dev-sentinel.calmhill-388e1d39.eastus2.azurecontainerapps.io/ready
az containerapp revision list -n ca-nc-dev-sentinel -g rg-nc-dev-sentinel \
  --query "[?properties.trafficWeight>\`0\`].{n:name,w:properties.trafficWeight,h:properties.healthState}" -o table
```

**Assessment: improved, still FAIL.** The target, lineage, compatibility and procedure are now documented. The rehearsal and a named approver remain open.

## 4. Criterion D — Deployment governance

| Evidence | Result |
|---|---|
| Trigger | `.github/workflows/deploy.yml` runs on `push` to `main` (and `workflow_dispatch`). Deploy run 37261908549 followed the PR #44 merge. |
| Merge record | `7eb0724`: author Cody Dale Nunn, committer `GitHub` (web merge), 2026-10-04T21:03:54-07:00. |
| Human gate | **None enforced.** The `deploy` job had **no `environment:`**, so no required-reviewer approval was possible. The merge itself triggered the Azure deployment. |
| Credential | Service principal via `secrets.AZURE_CREDENTIALS` (not OIDC federation, despite `id-token: write`). |
| Branch protection | Still unreadable (401 without admin token); remains **BLOCKED**. |

**Assessment: FAIL confirmed.** Revision `…-61-1` had no deployment authorization control beyond the merge.
- **Forward fix (code, not merged):** commit `a28b89dd` adds `environment: production` to the deploy job.
- Cody must still create the `production` environment with required reviewers (Settings → Environments). Until then the gate auto-passes.
- `scripts/check-deployment-contract.js` now fails CI if the environment gate, digest pin or `GIT_SHA` provenance is removed. Verified: it passes the new workflow and fails the old one on six rules. `tests/deployment-contract.test.js` passes 7/7.

## 5. Other observations

- `ca-sentinelos-proof` `/health` timed out in Freddie's probe. It is not attributed to the primary revision and was not re-probed here.
- The live legacy key is configured as tenant `nunncloud`, role `viewer`, scopes `repo:read,audit:read,receipt:read,approval:read` (set by `deploy.yml`). This corrects earlier uncertainty about its scopes.

## 6. Remediation still requiring Cody's authorization

| # | Action | Closes | Type |
|---|---|---|---|
| 1 | Configure required reviewers on GitHub environment `production`; review and merge `fix/deploy-digest-pin-approval-gate` via PR with independent review | D (forward), A (forward) | Repo settings + merge |
| 2 | Redeploy through the gated workflow so the serving revision is digest-pinned with `GIT_SHA` set | A for the new revision | Azure write |
| 3 | Durability: run the heartbeat in-process or as a Container Apps job; mount Azure Files at `/var/lib/sentinelos` or move ledgers to Postgres; seed `lastAuditHash` and audit reads from Postgres on startup | B | Code + Azure |
| 4 | Durability proof: create a test receipt, restart the replica, resolve the receipt by ID afterwards | B | Azure write |
| 5 | Rollback rehearsal: Multiple mode with explicit weights, or a disposable clone app | C | Azure write |
| 6 | Postgres resilience decision: HA, geo-redundant backup, retention beyond 7 days | B | Azure write / cost |

## 7. Carry-forward

| Item | Owner | Next review |
|---|---|---|
| Deliver this branch to Freddie and request a renewed GOV-006 review on the actual packet | Cody Nunn | 2026-10-29 (morning, Arizona MST) |
| Items 1–6 above | Cody Nunn | 2026-10-29 |
| Branch-policy read with admin token | Cody Nunn | 2026-10-29 |
