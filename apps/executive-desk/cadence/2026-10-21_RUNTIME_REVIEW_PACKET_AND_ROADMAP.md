# October 21 runtime review packet and roadmap

## Disposition and packet scope

Prepared for Cody Nunn and Freddie Neale. Collection by an AI assistant using
Copilot SDK in VS Code; Cody remains the accountable collector. This is an
**incomplete-evidence review packet**, not completed runtime assurance.
Fresh Azure captures: **2026-10-21T20:46:24Z through 20:47:51Z**.
Check the packaged `captures.tsv` for each command's actual start/end and exit
code. No infrastructure, register, gate, or business-state mutation was made.

**GOV-006 remains Verification / technical HOLD; GOV-001 Conditional;
GOV-002 HOLD; ACT-019 In Progress. PR #47's supplied REJECT is unchanged.**
These IDs retain their controlling-record meanings; this report does not
rename them to match informal product labels.

The private reviewer bundle contains projected Azure responses, exact-SHA
GitHub check metadata, deployment attribution, command receipts, source
excerpts, this report, earlier narrative indexes, and SHA-256 checksums.
Its manifest identifies included files, not evidence completeness. Earlier
endpoint captures and conflicting Activity Log searches remain referenced
narrative evidence where their original raw outputs are not included.
No email delivery, receipt acknowledgment, independent verdict, or human
authorization is established by assembling this bundle.

## October 22 v2 refresh - supersedes point-in-time rows below

A second read-only collection ran **2026-10-22T18:35:14Z through 18:36:57Z**
(per-command times and exit codes in v2 `captures.tsv`). It was packaged as
`SentinelOS_Runtime_Review_2026-10-22_v2_INCOMPLETE.zip`. The October 21 rows
below are kept as historical captures. No Azure, GitHub, register, gate or
business-state mutation was made, and no authenticated request was sent.

| Item | Status | Evidence and limitation | Source / capture UTC |
| --- | --- | --- | --- |
| Exact serving revision | Verified | `ca-nc-dev-sentinel--sha-7eb0724-61-1` is still active, Healthy, Provisioned and Running, with traffic 100 in `Single` mode. Ingress is external on target port 3000 with insecure traffic disallowed. Startup, readiness and liveness probes all check `/health:3000`. Scale is min 1 / max 2. | `app.json`, `revisions.json`; 18:35:14-18:35:23 |
| Running replica | Verified; **replaced since v1** | Current replica `…-dcf67fcf6-vbgfb` was created 03:31:48Z and is ready, Running, restartCount 0, container `containerd://d4b0aaa2…`. The v1 replica `27r59` (Oct 13) is gone. | `replicas.json`; 18:35:23-18:35:25 |
| Overnight replica replacement | Needs clarification; **appears platform-initiated** | System log sequence: Stopping 02:57:42; exit **137** at 02:58:14/15; replacement `gcptp` pulled the image at 02:58:12-16; RevisionUpdate (traffic 100% to the same revision) at 03:24:02; Stopping 03:31:49; RevisionUpdate 03:32:09; `vbgfb` pulled at 03:32:20-22; exit 137 at 03:32:21; NodeNotReady on `vbgfb` at 09:06:28. Repeated KEDA FailedGetExternalMetric warnings were also logged. Activity Log for the resource group, Oct 21 00:00Z to Oct 22 18:40Z, contains **no write to `ca-nc-dev-sentinel`**; the only entries are `getAuthToken` actions and Oct 21 19:01-19:11 role assignments. Platform or node maintenance is inferred, not confirmed by Azure. Revision identity and traffic did not change. | `system-lifecycle.json`, `activity-oct21-22.json`; 18:35:37-18:36:16 |
| Running image digest binding | **Strong inference; provider attestation still Missing** | Every recorded pull of tag `sentinel-api:7eb0724c…` was after the tag's create/last-update time, 2026-10-05T04:05:33.5527456Z. The tag has never been updated and still resolves to `sha256:85f53535…d6cca9`. Pulls: Oct 5 04:06:20, Oct 13 13:35:04, Oct 22 02:58:12, Oct 22 03:32:20, each 91,888,884 bytes. Limits: the pull logs record the tag but not the digest; the tag is mutable (`writeEnabled` true, unsigned); the replica API exposes no image digest. `latest` currently points to the same digest. | `registry-current.json`, `registry-tags.json`, `system-image-pulls.json`; 18:35:25-18:35:37 |
| Fresh endpoints | Verified, unauthenticated only | `/health` returned **200** (body timestamp 18:35:40.221Z; database enabled). `/ready` returned **200**: ready true, all seven checks ok, but `commit: "unknown"` because `GIT_SHA` is unset, so it cannot self-attest its build. `/approvals` without credentials returned **401** `API_KEY_REQUIRED`. The authenticated 200 is still the Oct 20 18:11:41Z capture; it was not repeated. | `health*`, `ready*`, `approvals-unauth*`; 18:35:39-18:35:40 |
| Runtime errors | Verified for the window | Since Oct 21 00:00Z there are 33 console lines from the main app, with **0 error/fail/fatal/exception lines** and 4 warning lines. The warnings are the `pg` SSL-mode deprecation notice at each startup, a nonblocking hardening item. | `console-summary.json`, `console-restart-window.json`; 18:36:44-18:36:57 |
| Rollback candidate | Verified as retained metadata | `…sha-c1aece8-60-1` is inactive, Stopped, with 0 replicas and traffic 0. Its tag is unchanged since 2026-09-28T20:31:54Z, digest `sha256:c424aad7…304728`. Approval and rehearsal are still Missing. | `revisions.json`, `registry-rollback.json`; 18:35:31-18:35:34 |
| Freddie Azure read access | Verified grant | On Oct 21, 19:01:50-19:11:21Z, nine **Reader** assignments were granted to `freddie.neale@codynunnazuregmail.onmicrosoft.com`. They cover both container apps, the environment, ACR, App Configuration, App Insights, Log Analytics and two alert resources. This grant was created by Cody's account; it is not a test of Freddie signing in. | `role-assignments-oct21.json`; 18:36:27-18:36:30 |
| PR #46 renewed head checks | Verified | Head `28dafebd9442060b21d93eda12a86ae21da8d5eb`. Succeeded: [sentinel-api][ci46b] 01:23:57Z, [CodeQL][ql46b] 01:24:03Z, github-advanced-security, and both Analyze jobs. [Macroscope][ms46b] was **skipped**, which is not a pass. | `pr46-checks.json`; 18:35:40-18:35:41 |
| PR #47 head | Verified unchanged | Head is still `3a0214dd64fd5607b7121c5ec62b396e06c2c2c0`, so the REJECT stands. | `pr47-head.json`; 18:35:41 |
| Branch protection | BLOCKED | The unauthenticated read returned 401 `Requires authentication`. The effective policy is still not certified. | `branch-protection.json`; 18:35:41 |
| Receipt durability / recovery | Missing | The overnight replacement started a process with empty memory, but no receipt was read before or after it. A `/ready` `auditStore: ok` result is not a round-trip proof. The recovery plan below is still unauthorized. | Recovery plan below |
| Human deployment / rollback authority | Missing | Unchanged. | Handoff record |

## Source-linked checklist

Verified means the specific observation only. Missing means not established,
not necessarily nonexistent. Needs clarification includes supplied claims
whose primary output could not be inspected.

| Item | Status | Evidence and limitation | Source / capture UTC |
| --- | --- | --- | --- |
| Main app identity | Verified | Subscription `82bd72d4-00ef-400d-839b-e168e980c510`, group `rg-nc-dev-sentinel`, app `ca-nc-dev-sentinel`; active mode `Single`. | [Azure app][app]; `app.json`; 20:46:24-20:46:27 |
| Exact serving revision | Verified | `ca-nc-dev-sentinel--sha-7eb0724-61-1`: active, Healthy, Provisioned, Running; one replica; revision traffic 100; ingress latest-revision weight 100. | [Azure app][app]; `revisions.json`, `app.json`; 20:46:24-20:46:31 |
| Running replica | Verified | `ca-nc-dev-sentinel--sha-7eb0724-61-1-dcf67fcf6-27r59`: ready, started, Running, zero restarts. Point-in-time observation, not recovery proof. | `replica.json`, `replica-arm.json`; 20:46:31-20:46:40 |
| Configured image / registry digest | Verified | Tag `acrncdevsentinel.azurecr.io/sentinel-api:7eb0724c730ac5c6be545d4f30d24ce1f1d4a7cd`; registry digest `sha256:85f535354fdf7cadd4d729e6fae3341f0c861b040ae2237f6578234590d6cca9`. | `app.json`, `registry-current.json`; 20:46:24-20:46:36 |
| Running image digest binding | Missing | Neither replica CLI nor direct ARM API `2025-01-01` exposes an image ID/digest. `containerd://...` is a container ID, not an image digest. Registry metadata does not prove running identity or human authorization. | `replica.json`, `replica-arm.json`; 20:46:31-20:46:40 |
| Ports / probes | Verified | External HTTPS ingress, insecure HTTP disallowed; target port 3000. Startup/readiness/liveness probes use `/health` on port 3000. Effective process user/listener inspection is not included. | `app.json`; 20:46:24-20:46:27; [earlier logs][azure] |
| Endpoint/authentication | Verified as earlier recorded captures | Oct 20 authenticated `/approvals` 200 at 18:11:41.218452Z; `/health` 200 at 20:17:29Z; unauthenticated `/approvals` **401** at 20:17:50Z. Separate captures; no fresh authenticated request. Original raw HTTP outputs are not added by this pass. | [Earlier due diligence][due]; retained, not recaptured |
| Deployment attribution | Verified | Run `37261908549`, success; full merge SHA `7eb0724c730ac5c6be545d4f30d24ce1f1d4a7cd`; actor and triggering account `Codynunn42`. Narrow Azure query returns successful write at Oct 5 04:05:58.8152342Z, caller `8ebeef20-5e93-4639-a9d9-c217581f4bdb`, correlation `d0970688-82d9-43a6-ab9f-bb0f7837a216`. | [Deployment run][run]; `deployment-run.json`, `deployment-activity.json`; 20:47:47-20:47:50 |
| Conflicting Activity Log searches | Needs clarification | Positive narrow query reproduced. Earlier empty searches are preserved in the prior narrative; their raw responses/complete query receipts are not in this bundle. Do not erase the discrepancy or infer absence of deployment from an empty filtered search. | [Earlier provenance F6/F7/R3][azure]; fresh `deployment-activity.command.txt` |
| Human deployment authorization | Missing | Neither actor attribution, historical success, nor PR #44 retrospective acceptance is separate human deployment authority. | [PR #44 record][due]; authorization source still required |
| Backup configuration | Verified, limited to inventory | `psql-nc-dev-sentinel` Ready, PostgreSQL 16; retention seven days, geo backup disabled, HA disabled; earliest restore date Oct 15 17:19:47.694336 UTC. Does not establish receipt recovery or independently bind the app's secret-referenced database URL to this server/database. | `database.json`; 20:46:38-20:46:39 |
| Receipt durability / recovery | Missing | Deployed source attempts PostgreSQL audit insert, but retrieval returns in-memory matches first. Persistence failures become audit events while the original entry is returned. No database-backed round trip, lifecycle recovery, load test, or restore was demonstrated. | [Audit logger][audit], [DB client][db], [receipt route][server] at merge SHA; source inspected about 20:44-20:47 |
| Rollback candidate | Verified as retained metadata | `ca-nc-dev-sentinel--sha-c1aece8-60-1`: inactive, stopped, zero replicas/traffic; reports Healthy/Provisioned historical state. Registry digest `sha256:c424aad744e3ae7e806874c1fe23ff5319a11e930b4a4458269dcb54f4304728`. It is not currently serving or freshly tested. | `revisions.json`, `registry-rollback.json`; 20:46:27-20:46:38 |
| Rollback readiness / authority | Needs clarification | Review-only procedure below; compatibility, rehearsed operation, time window, recovery criteria, named operator and signed authority remain open. | [Prior review-only plan][old-rollback]; this report |
| Alternate proof app | Verified failure | Separate `ca-sentinelos-proof--0000006`: Unhealthy, Failed provisioning/running, traffic weight 100. Earlier logs report DB authentication failures. Owner/consumers and repair-versus-retirement disposition remain open. | `alternate-revisions.json`; 20:47:50-20:47:51; [earlier failure evidence][azure] |
| OwnerFI / Deal Execution boundary | Verified within earlier collection scope | Vercel business demos use browser state; source-default Azure health linkage is not proof of workflow execution. Deal Execution `/proof` is on main Sentinel. No end-to-end business command was tested. Live Vercel SHA/override remains unverified. | [Earlier surface evidence][azure]; not repeated here |

The Activity Log inventory includes historical `listSecrets/action` events.
This collection read only their metadata; it did not invoke secret retrieval.

## Exact-head code checks, not release approval

The REST check responses include each check's `head_sha`, not merely a PR
association. All returned checks fit one page: six for #46, seven for #47.
Capture: **2026-10-21T20:46:40Z-20:46:41Z**.

| PR / candidate SHA | Observed results | Check completion UTC | Review boundary |
| --- | --- | --- | --- |
| [#46][pr46] `928c573e8574f841c032600aeca7f4bb8491c233` | [sentinel-api success][ci46]; [CodeQL success][ql46]; Macroscope **skipped**, not PASS. | sentinel-api Oct 14 05:58:38; CodeQL Oct 14 01:13:44 | Freddie ACCEPT with follow-up directly observed in [original October 21 email][review]. No new code review performed here. |
| [#47][pr47] `3a0214dd64fd5607b7121c5ec62b396e06c2c2c0` | [sentinel-api success][ci47]; [CodeQL success][ql47]; Macroscope **skipped**, not PASS. | sentinel-api Oct 12 18:09:28; CodeQL Oct 12 18:09:25 | Freddie REJECT directly observed in [original email][review]. Checks do not resolve signature compatibility, authority-context or reporting findings. |

**Current required review/check policy: Needs clarification / BLOCKED.**
Earlier direct public protection read returned 401; the public applicable-rules
response was empty. Cody subsequently reports a connected protection read
returning **403, Resource not accessible by integration**, and an active
ruleset addressing deletion/force-push restrictions only. That separate
connected response is supplied evidence, not a capture performed here.
Neither response establishes all effective protections on `main`.
`CodeQL` and `sentinel-api` remain last-observed requirements, not a newly
certified exhaustive policy. Do not declare policy PASS or merge authorization.

Check-run `head_sha` binds reported checks to the candidate, but is not a claim
about every job's checkout strategy or synthetic merge execution. Preserve the
separate historical PR #44 synthetic-merge CI distinction in [the prior record][due].

## Receipt recovery proof plan - not authorized or executed

The deployed route is `/v1/receipts/:receiptId` with `receipt:read`
authorization. Do not substitute an unmerged Executive Desk ledger or PR #47
implementation for the deployed JavaScript audit path.

1. Cody and the data owner approve environment, synthetic tenant, permitted
   command, record count, request rate, maximum duration, outage budget, stop
   thresholds, cleanup and operator. Prefer an isolated rehearsal environment.
   No numeric limits or production mutations are approved by this report.
2. Identify the real backing database without exposing its connection string;
   record schema/build identity, backup coverage and data owner. An inventory
   server's backup settings alone do not establish the application's destination.
3. Capture a permitted synthetic receipt ID, signature/version and relevant
   authority context. Prove committed storage independently of process memory.
   A same-process receipt GET returning `source: memory` is insufficient.
4. Under a separately approved restart/replacement scope, retrieve that same
   receipt from a new process with empty in-memory audit state. Require
   `source: database`, tenant isolation, signature verification and exact
   required authority-context fields. Record replica identity before/after.
5. Separately rehearse backup restore to an isolated target, not over the live
   database. Record recovery point, measured loss/recovery time, verified receipt
   set and approved acceptance thresholds. Restart survival is not backup
   recovery; neither substitutes for a bounded load/failure test.
6. Attach source outputs, command/response times, cleanup result and Freddie's
   criterion-specific verdict. Stop on writes outside the synthetic scope,
   missing committed rows, signature/context mismatch, unexpected errors,
   cross-tenant access or any unapproved disruption.

## October rollback procedure - REVIEW ONLY, approval blocked

No rollback execution is authorized. The May plan remains review-only and its
old `--0000030` lineage must not be used as the current target.
The October candidate's image tag is
`sentinel-api:c1aece8f4b73a38230408709951d72a2a0a8d74b`.

The source diff between the two commits showed no changes under
`apps/sentinel/src/db`, `apps/sentinel/src/audit`, or `apps/api/server.js`.
That bounded source comparison is **not** complete artifact, dependency,
secret, schema, data or behavioral compatibility proof.

Required approval record: named human authorizer and operator; UTC window;
app, current and candidate revisions/digests; compatibility evidence; acceptable
outage/data-loss thresholds; permitted mode/activation/traffic changes; checks
before and after; stop and recovery authority. None is filled by assistant text.
The current replica's digest gap must be explicitly dispositioned, not hidden.

Proposed operator sequence, after review, rehearsal and explicit authorization:

1. Re-read subscription/resource ID, `Single` mode, current exact revision,
   ingress, both immutable artifacts, env names/secret references, probes,
   backup coverage and target schema. Preserve a new pre-mutation snapshot.
   Confirm no competing deployment and establish operator/change coordination.
2. Validate candidate startup against current data/schema/secrets in isolation.
   Activation may execute schema initialization or background work even at
   zero traffic. Stop if that behavior is incompatible or not authorized.
3. Obtain approval specifically for a `Multiple` revision-mode transition.
   Change mode only under that approval; verify and pin the current exact
   revision at 100%, removing implicit latest-revision routing before activation.
   Never assume Multiple-mode traffic controls are valid in Single mode.
4. Activate the named candidate at zero production traffic, then inspect its
   provisioning, readiness, logs and revision-specific endpoint under the
   approved test scope. Zero replicas and historical Healthy metadata are
   not readiness. Require the approved timeout and functional checks before cutover.
5. Only after those checks, set explicit weights: candidate 100, current 0,
   all other revisions 0. Verify mode, active revisions, live ingress weights,
   health/auth behavior and durable receipt access. Record times and operator.
6. If a stop threshold is met, use pre-approved recovery authority to restore
   current 100, candidate 0 and all others 0; verify the original revision is
   healthy and serving. A traffic reversal cannot undo data/schema changes.
   If recovery is unsafe or unapproved, stop and escalate rather than improvise.
7. Preserve both revisions and evidence. Returning to Single mode, disabling
   a revision, deleting data, or restoring a database requires separate scope;
   none is implied by the routing sequence.

Official references inspected October 21:
[revision modes][modes] and [revision management][manage].
The sequence is documented but **not yet approved or rehearsed as an executable
operating change**; no rollback-readiness closure is claimed.

## Register, agenda and delivery reconciliation

The earlier cross-environment ZIP remains unavailable. The following later
observations instead come directly from shared Gmail and the live register.
These updates are repository companions; the existing **v1 INCOMPLETE ZIP
does not contain these later observations**.

| Item | Status | Direct observation | Source / capture UTC |
| --- | --- | --- | --- |
| Freddie's assignment, independence declaration and access | Verified | Original October 21 email accepts both reviewer roles, declares no authoring/other involvement in either PR, and confirms Azure read access. This records his declaration, not an independent access-permission test. | [Original review][review]; inspected 21:09-21:10 |
| Runtime verdict / delivery | Missing | Freddie explicitly says runtime PENDING and packet not received. Assignment acceptance is not delivery acknowledgment or runtime acceptance. No subsequent delivery was performed here. | [Original review][review]; inspected 21:09-21:10 |
| Live Actions inventory | Verified | HTTP 200; 22 actions, 19 open, **14 open undated**. ACT-013/016 are Verified Complete; ACT-017 Superseded. Quote-aware CSV parsing excludes these three from open counts. | [Live Actions export][actions]; 21:10:14.955 |
| Canonical gate scope/status | Verified | GOV-001: reconcile EV-RUN-002-001 conditional evidence, Conditional. GOV-002: September 6 execution outcome, Hold. GOV-006: merged hardening versus runtime findings, Verification with technical HOLD. These are not product-name aliases. | [Live Portfolio export][portfolio]; 21:11:48.075 |
| Sent agenda date | Verified in Gmail display; raw headers need clarification | Sent message and Show details both display **October 18, 2026, 4:14 PM**, from Cody to Logan. This supports October 18 rather than October 17. Show original did not yield readable headers; a direct original-view request returned 404. Raw Date timezone and Message-ID remain unverified. Phoenix/23:14 UTC conversion remains supplied, not independently header-verified. Do not resend. | [Sent agenda][agenda]; details captured 21:13:08.599 |

Live Actions rows at 21:10:14.955 UTC:

| Action | Status | Historical due date | Last updated | Carry-forward |
| --- | --- | --- | --- | --- |
| ACT-003 / GOV-002 | In Progress | 2026-09-06 | 2026-10-15 | Cody; recover attributable planned-run outcome or record supported HOLD/non-execution disposition and review point. |
| ACT-004 / GOV-003 | Overdue | 2026-08-12 | 2026-09-07 | Cody / Executive Desk; one disposition and source per live-environment blocker. |
| ACT-014 / GOV-006 | Verification | 2026-09-14 | 2026-10-15 | Cody, VR Governance Analyst support; preserve separate port, scan and persistence findings; runtime proof still open. |
| ACT-015 / GOV-007 | Next | 2026-09-14 | 2026-10-15 | Cody, VR Engineering Coordinator support; live wording still calls PRs #24/#25 drafts requiring selection. Reconcile merged implementation before closure. |
| ACT-019 / GOV-006 | In Progress | Blank | 2026-10-19 | Cody, VR Governance Analyst support; live row explicitly records completed PR #44 retrospective ACCEPT/EVD-024 while retaining separate PR #46/#47 and exact-revision runtime work. |

Preserve historical dates. No replacement dates, live wording changes, workforce
audit, outreach or gate decisions were made. PR #44 retrospective review stays
completed supporting evidence: SATISFIED/ACCEPT, PASS_WITH_FOLLOW_UP, overall
FOLLOW_UP_REQUIRED. It is not repeated or converted into runtime authorization;
packet-attributed Cody acceptance retains its primary-human-provenance limitation.

## Handoff record and next actions

| Field | Current record |
| --- | --- |
| Collector | Cody Nunn, accountable collector; assistant performed read-only collection |
| Independent reviewer | Freddie Neale; acceptance, no-involvement declaration and Azure read access directly observed in original October 21 email |
| Bundle | Local **v2** incomplete-evidence packet, `SentinelOS_Runtime_Review_2026-10-22_v2_INCOMPLETE.zip`, built from Oct 22 18:35-18:36Z captures plus this report and the PR #46 Section B record. Its contents and hashes are in its `SHA256SUMS`. v1 is retained as history. |
| Delivery | **UNSENT**; recipient confirmed in supplied update; send instruction pending |
| Receipt acknowledgment | **Missing**; do not confuse with assignment acceptance |
| Runtime verdict | **PENDING**; only Freddie can supply his independent dated conclusion |
| Human deployment / rollback authority | **Missing**; no authorization inferred |
| Next review dates | 2026-10-29, morning Phoenix, as recorded by Cody in the [PR #46 Section B][secb] |

Before delivery, version the bundle to include the later source reconciliation,
retrieve missing original supporting captures where available, and review the
sanitized bundle for recipient scope.
If Cody authorizes an incomplete-packet handoff, explicitly enumerate the gaps
instead of implying a complete assurance packet. Record actual send timestamp,
thread/message reference and bundle hash, followed separately by acknowledgment.
Use the [existing Freddie draft][reconciliation], updated to identify this packet
and its open criteria. Do not auto-send, duplicate outreach, or alter PR #47's
rejection.

**Immediate carry-forward:** Cody obtains provider-level running-image evidence,
bounded recovery-test approval, human deployment provenance and rollback
approval; supplies register/header exports; confirms any send instruction and
review dates. Freddie reviews the delivered exact packet and reports findings,
scope, date and verdict. Authorized repository owner supplies current effective
branch protection/rulesets. Azure resource owner determines alternate-app
consumers and disposition. No one is assigned invented completion dates.

## Sources

[app]: https://portal.azure.com/#resource/subscriptions/82bd72d4-00ef-400d-839b-e168e980c510/resourceGroups/rg-nc-dev-sentinel/providers/Microsoft.App/containerApps/ca-nc-dev-sentinel/overview
[azure]: ./2026-10-21_OWNERFI_AND_DEAL_EXECUTION_AZURE_EVIDENCE.md
[due]: ./2026-10-20_PR44_AND_DEPLOYMENT_DUE_DILIGENCE.md
[reconciliation]: ./2026-10-21_EXECUTIVE_TEMPLATE_RECONCILIATION.md
[old-rollback]: ../../../docs/DEP1_3_ROLLBACK_PLAN_2026-05-19.md
[audit]: https://github.com/Codynunn42/SentinelOS-NON-DEMO/blob/7eb0724c730ac5c6be545d4f30d24ce1f1d4a7cd/apps/sentinel/src/audit/auditLogger.js
[db]: https://github.com/Codynunn42/SentinelOS-NON-DEMO/blob/7eb0724c730ac5c6be545d4f30d24ce1f1d4a7cd/apps/sentinel/src/db/client.js
[server]: https://github.com/Codynunn42/SentinelOS-NON-DEMO/blob/7eb0724c730ac5c6be545d4f30d24ce1f1d4a7cd/apps/api/server.js
[run]: https://github.com/Codynunn42/SentinelOS-NON-DEMO/actions/runs/37261908549
[pr46]: https://github.com/Codynunn42/SentinelOS-NON-DEMO/pull/46
[pr47]: https://github.com/Codynunn42/SentinelOS-NON-DEMO/pull/47
[ci46]: https://github.com/Codynunn42/SentinelOS-NON-DEMO/actions/runs/38494504269/job/115705704502
[ql46]: https://github.com/Codynunn42/SentinelOS-NON-DEMO/runs/115627238109
[ci47]: https://github.com/Codynunn42/SentinelOS-NON-DEMO/actions/runs/38288934003/job/114943999359
[ql47]: https://github.com/Codynunn42/SentinelOS-NON-DEMO/runs/114944213119
[ci46b]: https://github.com/Codynunn42/SentinelOS-NON-DEMO/actions/runs/39705392210/job/119584110778
[ql46b]: https://github.com/Codynunn42/SentinelOS-NON-DEMO/runs/119584300045
[ms46b]: https://github.com/Codynunn42/SentinelOS-NON-DEMO/runs/119584098216
[secb]: ./2026-10-22_PR46_SECTION_B_GOVERNANCE.md
[modes]: https://learn.microsoft.com/azure/container-apps/revisions#revision-modes
[manage]: https://learn.microsoft.com/azure/container-apps/revisions-manage
[review]: https://mail.google.com/mail/u/0/#all/FMfcgzQhWxZpNMrTMkGTsGfDbQbZLLbZ
[agenda]: https://mail.google.com/mail/u/0/#all/FMfcgzQhWnzvNgKzhQVFpkKTBjVhfKdF
[actions]: https://docs.google.com/spreadsheets/d/1Y9YL3H_ML4trGeU83oVoLXVPJA_3ZluLaPm5G7TblUw/gviz/tq?tqx=out:csv&sheet=Actions
[portfolio]: https://docs.google.com/spreadsheets/d/1Y9YL3H_ML4trGeU83oVoLXVPJA_3ZluLaPm5G7TblUw/gviz/tq?tqx=out:csv&sheet=Portfolio
