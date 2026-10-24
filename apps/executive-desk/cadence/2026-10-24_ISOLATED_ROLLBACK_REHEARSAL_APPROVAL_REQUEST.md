# Isolated rollback rehearsal - approval request

Packet ID: GOV006-ROLLBACK-ISOLATED-20261024-R2

Prepared October 24, 2026 UTC (October 23 in Arizona).

**Status: prepared for approval review; NOT approved, NOT execution-ready.**
Evidence available now is attached to the handoff bundle. Missing execution
inputs and rehearsal results are explicitly outstanding; this packet does
not claim that all evidence to proceed is present.

## 1. Decision requested and selected scope

Cody selected an **isolated rehearsal first**, with **Cody Nunn as proposed
operator**. This selection authorizes preparation of this request only.
The subsequent planning decisions in section 12 supersede the original
undecided planning entries: October 28 window proposed, USD 25 ceiling proposed,
and synthetic-only restrictions selected. These are not execution approval.

Requested future operation: in a separately approved isolated test environment,
establish the current-image baseline, change only the isolated app to the
prior image, verify behavior and persistence, and return that isolated app
to the current image. Production remains unchanged throughout.

This is NOT a request to activate the retained production revision, change
production revision mode, shift production traffic, restart production,
copy production data, alter production database/schema, or approve deployment
to production. An isolated rehearsal is still resource creation/runtime
mutation and cost; none is authorized or executed by this packet.

Approving document completeness is distinct from approving execution.
Freddie is the proposed independent evidence reviewer, not the deployment
authorizer. Cody designated himself approver/authority as Founder and CEO,
Nunn Cloud LLC; accountable owner and authorizing officer for this isolated
rehearsal. This is a user-stated business role, not independent verification
of corporate authority and not a signed execution decision.

## 2. Exact image and source identity

Registry: `acrncdevsentinel.azurecr.io/sentinel-api`

| Role | Source commit | Immutable registry digest |
| --- | --- | --- |
| Current-image baseline and return target | `7eb0724c730ac5c6be545d4f30d24ce1f1d4a7cd` | `sha256:85f535354fdf7cadd4d729e6fae3341f0c861b040ae2237f6578234590d6cca9` |
| Prior-image candidate | `c1aece8f4b73a38230408709951d72a2a0a8d74b` | `sha256:c424aad744e3ae7e806874c1fe23ff5319a11e930b4a4458269dcb54f4304728` |

Production identifiers are exclusion targets, not rehearsal targets:

- Subscription of historical evidence: `82bd72d4-00ef-400d-839b-e168e980c510`.
- Production resource group: `rg-nc-dev-sentinel`.
- Production app: `ca-nc-dev-sentinel`.
- Serving revision recorded October 23: `ca-nc-dev-sentinel--sha-7eb0724-61-1`.
- Retained revision: `ca-nc-dev-sentinel--sha-c1aece8-60-1`.
- Production database server recorded earlier: `psql-nc-dev-sentinel`.

Fresh read-only capture requests began October 23 at 23:11:45 through
23:12:33 UTC. The retained revision existed, stopped with zero replicas;
its Healthy metadata is not a fresh startup result. ACR held both recorded
artifacts, and the candidate tag resolved to the prior digest.

Use digest-qualified images in the future isolated plan. Rebuilds from the
same source commit are different artifacts and require separate identity and
review. Refresh artifact availability before execution; do not assume a
retention lock or direct running-digest attestation.

## 3. Existing evidence and integrity

The handoff includes the two unchanged October 23 deliverables:

| Deliverable | SHA-256 |
| --- | --- |
| `2026-10-23_ROLLBACK_PLAN_UPDATE_REVIEW_ONLY.md` | `4f219bd238d9186b1eebef03bde78379b8ac1037aec1cb178adde40431684e92` |
| `rollback-readonly-evidence-2026-10-23.zip` | `11c98c7954f5c02c91fa0dee01e34b2d1b559500a246102c3e0d4c2a8aa4bb2b` |

The ZIP contains nine checksummed metadata/summary JSON files and an assessment
snapshot. These are new October 23 projections, not recovered October 22
captures. The recorded Azure identity is `codynunn.azure@gmail.com`.
Environment values and secret contents were excluded; only environment names,
secret-reference names, and secret-name metadata were compared.

Existing facts support candidate availability and bounded configuration
comparison, not startup, credential validity, database compatibility, receipt
durability, successful rollback, or historical deployment authorization.

Source lineage confirms the candidate is an ancestor of the current commit.
Five intervening commits change only the validation implementation and its
test; no schema/migration file delta is present. This does not prove that
the live database or external state is compatible.

Reference: [historical rollback update and October 23 preflight](./2026-10-23_ROLLBACK_PLAN_UPDATE_REVIEW_ONLY.md).
That document and its existing delivery archive are intentionally not edited
for this new approval request, preserving their previously supplied hashes.

## 4. PR #44 rollback behavior review

An offline probe loaded the validator and its shared helper from the exact
Git commits above, using synthetic inputs and no application server, database,
credentials, or network. Eight cases produced 16 asserted outcomes. The
handoff includes the reproducible script and JSON result with source hashes.
This is characterization evidence, not a deployed-container or endpoint test.

| Case | Candidate validator | Current validator |
| --- | --- | --- |
| Fully specified matching `system.status` contract | Accepts | Accepts |
| Bare `command: status` without explicit entity/action/intent | Rejects | Accepts |
| Intent does not match entity/action | Rejects | Rejects |
| Null context with otherwise canonical input | Rejects | Rejects |
| Array metadata with otherwise canonical input | Rejects | Rejects |
| Null payload with otherwise canonical input | Accepts | Rejects |
| Array payload with otherwise canonical input | Accepts | Rejects |
| Canonical `system.status` intent/entity/action plus contradictory `command: deal.execute` | Accepts | Rejects |

The candidate does not validate the separate payload/command fields in those
last cases. Acceptance by this function is not proof of successful execution
or an authorization bypass through the full app.

**Disposition selected by Cody:** characterize these differences only in
isolated synthetic tests. They remain production blockers, not accepted
production regressions. Freddie's independent assessment remains outstanding.
No production acceptance or waiver is implied. Candidate failures must be
preserved, not silently corrected,
relabelled PASS, or hidden by adding fixes to the candidate image. Any changed
image constitutes a new candidate requiring separate review.

## 5. Required isolation design - unresolved until reviewed

Before executable infrastructure or commands are approved, specify:

1. Exact test subscription, region, dedicated resource group, app/environment,
   database, identities, registry access path, and resource IDs.
2. Separate test database, synthetic test tenants/receipts, and test-only
   credentials selected by Cody. No production database endpoint, credentials,
   snapshot, customer records, signing key, API key, or copied environment
   values. Credential generation/distribution and network controls still
   require reviewed implementation before execution approval.
3. Test-only signing/authentication credentials with approved lifecycle and
   least privilege; secret values never appear in evidence or this document.
4. Explicit approved endpoint/egress allowlist. Inventory startup dependencies;
   disable or safely isolate scheduler, payment, webhook, GitHub write,
   notification, and command side effects. If either image cannot run safely
   without production access, STOP rather than relaxing isolation.
5. Private/restricted test ingress and an approved test client. Reusing a
   production environment, network, managed identity, DNS, or database is not
   implicitly allowed; justify shared infrastructure or use dedicated resources.
6. Dedicated resource scope excluding all production IDs above; operator must
   independently verify target IDs before every approved mutation.
7. Isolated baseline matching the relevant image, runtime configuration,
   database schema/version and test contracts. Document material differences:
   a simplified clone cannot certify production compatibility.
8. Method to verify no production-target writes or traffic/config changes,
   with pre/post configuration fingerprints and relevant activity records.
   Any unrelated production drift must be investigated, not erased.

No production change is an acceptable recovery step for a failed isolated test.

## 6. Preconditions to any execution approval

| ID | Required input / evidence | Status |
| --- | --- | --- |
| P1 | Named authorized approver, authority basis, Cody's operator identity and verified least-privilege test access | PARTIAL - Cody designated authority and operator; subscription Owner assignments observed, least-privilege test access not established |
| P2 | Exact test resource IDs, region/subscription, reviewed network/dependency isolation design, implementation diff and executable procedure | OPEN |
| P3 | Start/end time, time zone, authorization expiry, startup/verification timeouts, and abort thresholds | PROPOSED - October 28 09:00-11:00 America/Phoenix; section 12 thresholds, not execution-approved |
| P4 | Resource/SKU inventory, cost estimate, maximum spend, lifetime and cleanup deadline | OPEN - USD 25 proposed, no priced topology or approved ceiling |
| P5 | Explicit data classification/restrictions, synthetic dataset, test credential/key plan and evidence redaction rules | PARTIAL - synthetic-only/test-only restrictions selected; fixtures, keys and enforcement implementation outstanding |
| P6 | PR #44 behavior assessment, approved test cases/expected results, and documented candidate limitations | PARTIAL - isolated characterization only selected; independent assessment and endpoint test implementation outstanding |
| P7 | Fresh ACR artifact availability and provenance checks for both digest-qualified images; no tag-only substitution | OPEN - October 23 metadata supplied |
| P8 | Approved test schema/fixtures, database backup/restore safeguard, receipt verification tooling and dependency compatibility assessment | OPEN |
| P9 | Return-to-current test procedure, failure containment, named escalation contact, cleanup ownership and preservation plan | PARTIAL - Cody operator/approver and evidence-first cleanup selected; exact deletion scope and reviewed implementation outstanding |
| P10 | Actual diff and publication/workflow-trigger review for the eventual implementation; required preparation/validation completed before deployment | OPEN |

The checked-out production deploy workflow triggers on pushes to `main`
without a docs-path exclusion. No merge, push, workflow dispatch, settings
change, infrastructure creation, image build/pull, or deployment is part of
this request. Do not publish an execution implementation into an automatic
production deploy path under the label "documentation only."

## 7. Proposed rehearsal sequence - not executable authority

After all preconditions and separately reviewed tooling are approved:

1. **Admission check:** verify signed scope, unexpired window, budget, exact
   test targets and production exclusions, operator identity, artifact
   digests, test data, and evidence destination. Stop on any discrepancy.
2. **Create isolated fixtures:** provision only the named test resources,
   apply the approved test schema/fixtures, and configure test-only credentials
   and approved dependencies. Record configuration with values redacted.
3. **Establish current baseline:** start the current digest in the isolated
   app. Capture revision/image identity, startup and readiness results.
   Run the approved functional, authentication and tenant-boundary checks.
   If baseline fails, stop; no candidate success claim can be made.
4. **Create traceable test receipt:** execute only an approved synthetic
   non-financial test intent. Record the same receipt ID, tenant, authority,
   signature-verification result and durable database-row metadata before
   any replacement. If no safe receipt-generating intent is identified,
   stop rather than substituting a health response or creating a real deal.
5. **Rehearse prior-image transition:** change the isolated app to the pinned
   candidate digest. Preserve revision/event chronology and verify requested
   versus actual serving identity/traffic within the test environment.
   Measure startup and outage against thresholds fixed in P3.
6. **Verify candidate and continuity:** read the SAME receipt through the
   candidate, confirm database-backed retrieval, verify signature using the
   approved test verification mechanism, and compare tenant/authority fields.
   Run canonical-contract, malformed-input, authentication, cross-tenant,
   audit, and receipt checks. Characterize PR #44 differences; approval must
   define which differences block the rehearsal objective.
7. **Explicit recovery check:** if included in the signed scope, replace a
   candidate process without altering the isolated database, then repeat
   the SAME receipt and identity checks. Creating a replacement receipt is
   not persistence proof. Do not equate revision-switch retrieval with a
   separate restart/failover test unless that event was actually captured.
8. **Return to current:** change the isolated app back to the pinned current
   digest; verify startup, approved functionality, SAME receipt continuity,
   and test traffic/identity. Record whether return-to-current succeeds.
9. **Contain and close:** preserve evidence, verify production exclusions
   remained intact, and clean up only separately authorized, exact isolated
   resource IDs after preservation. Obtain Freddie's evidence-specific review.

If schema/fixture changes occur during testing, preserve them and reassess
compatibility before returning an image. Do not assume image rollback
restores the database. No destructive database restore is authorized by this
sequence.

## 8. Stop conditions and failed-rehearsal recovery

Stop immediately on wrong target ID, production dependency/credential use,
unapproved egress or writes, expired authority, budget/time breach, artifact
mismatch, missing/corrupt evidence, baseline failure, signature/tenant/authority
failure, unexpected data mutation, or inability to establish image identity.
Do not broaden scope or change production to get the test to pass.

Within the approved isolated recovery window, return only the isolated app
to the pinned current image if the reviewed procedure and database state
permit it. Otherwise halt test requests, contain isolated side effects by
the preapproved method, preserve logs/data, and escalate to the named
approver. Do not retry indefinitely, erase failed evidence, rotate production
secrets, or destroy fixtures without the approved cleanup decision.

## 9. Evidence required from execution - not yet available

| Record | Minimum required fields |
| --- | --- |
| Approval | Packet ID/hash/version, approver/authority basis, operator, exact scope/resource IDs, window/expiry, cost/data limits, exclusions and signatures/attributable decision link |
| Commands and events | Actual tool/command or operation ID, target, operator, UTC start/end, exit/result, requested image, actual revision/image identity, traffic, and errors; no secrets |
| Isolation | Pre/post production configuration fingerprints, test resource/dependency inventory and redacted configuration, egress/access checks, applicable activity records |
| Baseline/candidate/return | Each stage's health/readiness plus approved functional and denial results, expected/actual comparison, duration and unmet thresholds |
| Receipt lifecycle | Same receipt ID and pre/post times, test tenant, authority fields, signature check, database-backed provenance, process/revision replacement event and unchanged-data comparison |
| PR #44 behavior | Inputs, expected behavior per image, observed candidate/current differences, reviewer assessment and blocking conditions |
| Failure/cleanup | Stop/escalation record if applicable; exact resources retained/deleted, operator/time/authority, costs and residual resources |
| Integrity/handoff | Explicit file list, sanitized outputs, SHA-256 manifest, delivery reference and reviewer receipt/hash confirmation |
| Independent review | Freddie's identity, date, exact packet/files reviewed, criterion-specific finding and residual gaps |

Do not include credentials or plaintext secret/environment values. Checksums
protect captured bytes; they do not prove provider authenticity, completeness,
or independent receipt.

## 10. Approval worksheet - intentionally unsigned

| Field | Entry |
| --- | --- |
| Requested operation | Isolated rollback rehearsal only; no production writes or traffic change |
| Proposed operator | Cody Nunn - execution identity/access pending |
| Authorized approver / authority basis | Cody Nunn - Founder and CEO, Nunn Cloud LLC; accountable owner and authorizing officer for this isolated rehearsal (user-designated; no execution approval) |
| Independent reviewer | Freddie Neale proposed; review not yet returned for this packet |
| Test resource scope / IDs | Section 12 proposed fallback IDs; subscription/name availability and network design require final acceptance |
| Window / expiry / thresholds | Proposed October 28, 09:00-11:00 America/Phoenix, including cleanup; see section 12 |
| Budget ceiling / cleanup deadline | USD 25 proposed, estimate/ceiling approval pending; cleanup within proposed window |
| Data restrictions / credentials / dependencies | Synthetic-only, separate database/tenant/keys/ledgers selected; implementation not approved |
| Decision | NOT RECORDED - no execution approval |
| Preconditions P1-P10 disposition | Open/partial/proposed as listed; no admission to execution |
| Approved packet and implementation hashes | NOT RECORDED |
| Attributable approval reference / date | NOT RECORDED |

The approver may request changes or hold this packet. Approval for preparation
or document review cannot be used to bypass unresolved execution prerequisites.
Record an updated bounded packet and reviewed implementation before granting
execution authority.

## 11. Carry-forward

This packet prepares the decision and identifies the missing evidence. It
does not establish rollback readiness, criterion C PASS, resolution of A/B/D,
or historical deployment authorization. Even a successful isolated rehearsal
would support a scoped technical finding, not prove production rollback
readiness by itself.

GOV-006 remains Verification / Technical HOLD; GOV-001 Conditional; GOV-002
HOLD; ACT-019 In Progress. Runtime REJECT remains unchanged. No Sentinel ACK,
email send, independent acceptance, new deployment, or rollback occurred.

## 12. R2 planning decisions and admission criteria

Recorded October 24, 2026 UTC, from Cody's selections in this conversation.
Source is Cody's supplied planning direction, not an independently inspected
calendar or a signed execution authorization. The prior R1 delivery archive
remains unchanged; this R2 request requires a new handoff/hash.

### Window, deadline, and authority

- Proposed execution: **October 28, 2026, 09:00-11:00 America/Phoenix
  (UTC-07:00), equivalent to 16:00-18:00 UTC**, supervised by Cody, including
  provisioning, testing, evidence export and cleanup.
- No authorization starts from this proposal. A later signed decision must
  name that exact window and expiry. No automatic extension, retries beyond
  the window, or unattended continuation.
- Proposed schedule: 09:00-09:30 admission/provisioning; 09:30-10:15
  baseline/prior-image/replacement/return checks; 10:15-10:30 evidence export;
  10:30-11:00 cleanup and resource inventory. If setup is not ready at 09:30,
  stop progression and preserve/clean up; do not compress safety checks.
  Stop new test transitions at 10:15 to retain cleanup time. These are planning
  cutoffs, not a promise of provisioning speed.
- Target delivery to Freddie: **October 28 by 12:00 America/Phoenix
  (19:00 UTC)**. Request assessment before the October 29 08:30 Arizona review.
  October 29 is the review deadline, not execution authorization. Freddie's
  availability and attendance are unconfirmed. No calendar event was created;
  the user's supplied calendar-availability statement was not checked here.
- Cody is designated business approver and proposed operator; Freddie remains
  independent reviewer. No new approval, signature, or gate disposition is
  inferred from naming these roles.

### Resource identity proposal and read-only checks

The Azure CLI account list exposed only subscription
`82bd72d4-00ef-400d-839b-e168e980c510` ("Azure subscription 1", Enabled).
No dedicated nonproduction subscription is visible to this login. This does
not prove none exists elsewhere. Prefer an existing dedicated nonproduction
subscription if Cody supplies one; otherwise the following is the proposed
fallback, not a confirmed final target.

Location: **eastus2**. Resource group proposed:
`/subscriptions/82bd72d4-00ef-400d-839b-e168e980c510/resourceGroups/rg-nc-g006-rh-20261028`.

Each suffix below is relative to that exact proposed resource-group ID:

| Resource | Proposed ARM ID suffix / database identity | Check / status |
| --- | --- | --- |
| Container Apps environment | `/providers/Microsoft.App/managedEnvironments/cae-nc-g006-rh-1028` | No matching name in subscription resource inventory; not created |
| Container App | `/providers/Microsoft.App/containerApps/ca-nc-g006-rh-1028` | No matching name in inventory; not created |
| Dedicated managed identity | `/providers/Microsoft.ManagedIdentity/userAssignedIdentities/id-nc-g006-rh-1028` | No matching name in inventory; not created |
| PostgreSQL flexible server | `/providers/Microsoft.DBforPostgreSQL/flexibleServers/psql-nc-g006-rh-1028-82bd72d4` | Proposed concrete unique suffix; global name availability, version/SKU/quota not checked |
| Test database | `/providers/Microsoft.DBforPostgreSQL/flexibleServers/psql-nc-g006-rh-1028-82bd72d4/databases/sentinel_rehearsal` | Not created; synthetic data only |
| VNet, subnets, route/filter resources, DNS, test client, secret store and evidence destination | NOT SELECTED | Must be enumerated as exact IDs with isolation design and priced before approval |

`az group exists` returned false for the proposed group. A resource inventory
returned no matching group/app/environment/identity names. That is not a
global name-availability, provider/quota, policy, or deployment validation.
Do not silently suffix/substitute resource names during execution; update
the approval scope if any selected identity is unavailable.

Existing registry access is the sole proposed shared dependency:
`/subscriptions/82bd72d4-00ef-400d-839b-e168e980c510/resourceGroups/rg-nc-dev-sentinel/providers/Microsoft.ContainerRegistry/registries/acrncdevsentinel`.
Read-only metadata showed `LegacyRegistryPermissions`. Pull by the recorded
digests, using a dedicated identity with the applicable approved pull role.
Creating that identity's role assignment is a separate explicit control-plane
write to the shared registry scope; it is NOT covered by "no production
changes." If registry-scope permission changes are prohibited, select a
different reviewed artifact-access approach rather than silently assigning
roles. Do not use registry admin credentials or permit registry push/delete.

An email-based operator role lookup failed to resolve the login alias.
The read-only signed-in-user lookup instead resolved object ID
`d9675118-7fd7-4c27-87b1-90f041baf4f5`,
`Codynunn@codynunnazuregmail.onmicrosoft.com`. Role lookup by that ID returned
two subscription-scope Owner assignment entries and Foundry User at
2026-10-24 approximately 00:18-00:19 UTC. This records assignments, not a
complete effective-permissions, deny-assignment, policy, or least-privilege
assessment. No identity/role was created or changed.

### Budget and isolation design gate

**USD 25 total is a proposed ceiling, not approved spending authority or a
verified cost estimate.** No resource SKUs or complete network topology have
been selected/priced. Do not assert this design fits the ceiling.

The estimate must include app compute/revisions, environment charges,
PostgreSQL compute/storage/backup, private network/DNS, any outbound filter,
test client, logs/metrics ingestion, evidence storage/transfer, registry
transfer/access, applicable minimum billing units, and teardown/retention.
Do not assume unused free grants, zero-cost idle storage, instant deletion
or real-time billing. Price the full topology and contingency first.

No provisioning until Cody approves both estimate and ceiling. Cost alerts
are not a hard cap; supervised runtime, resource inventory, and approved
cleanup deadlines are required. Stop if the conservative projected total,
including cleanup/retained resources, would exceed the approved ceiling.

A separate resource group or internal ingress is NOT outbound isolation.
Microsoft's [Container Apps outbound routing guidance](https://learn.microsoft.com/en-us/azure/container-apps/user-defined-routes)
requires a suitable VNet/workload-profiles design and actual outbound
controls for the described filtered-egress approach. The final design must
deny production database/service connections and unapproved internet egress
while allowing reviewed platform/image-pull/test-database paths. NAT alone
does not implement a destination allowlist. Do not deploy an unpriced
firewall or weaken isolation to force the design under USD 25. Resolve
feasibility or seek a new approved scope.

### Data, regression disposition, and measurable thresholds

- Synthetic records only; separate database, credentials, test tenants and
  ledgers. No production data, snapshots, secret/key values, shared writable
  storage or production deployment workflow. Use two synthetic tenants for
  boundary tests, not real tenant data.
- Prior-image validation differences may be characterized only under this
  isolated scope. Bare-command rejection, contradictory-command acceptance,
  and malformed-payload acceptance must be recorded separately, not marked
  as successful validation. They remain blockers for production promotion;
  this rehearsal is not a waiver.
- Each image transition must reach ready within **600 seconds** of the
  recorded transition start. Require **three consecutive HTTP 200 health
  and readiness pairs**, **10 seconds apart**, with readiness body
  `ready: true` and required database/ledger checks passing. Pin and verify
  serving image/revision identity at each stage. A timeout/error resets the
  consecutive-success count; no extending the 600-second limit.
- Keep the **same receipt ID** across baseline, prior-image, candidate
  process replacement, and return-to-current. Compare immutable receipt
  content, test tenant, attributable authority fields, and independently
  verified signature/passport proof linked to that receipt. Database-backed
  lookup after replacement is mandatory; `source: memory`, `/health: 200`,
  or a receipt field claiming `verified: true` is not durability/signature proof.
- Full endpoint/authentication tests must record **zero cross-tenant data
  disclosure and zero unauthorized executions**. Unknown/missing
  credentials, malformed inputs and denied cross-tenant access must not
  produce successful business mutations. A known source-function regression
  is not a waiver for endpoint authorization or data-integrity failure.
- Stop immediately on unexpected production connectivity/writes, receipt
  loss, signature/tenant/authority mismatch, unexpected writes, unplanned
  validation behavior, identity mismatch, or budget/window breach. Capture
  and classify the failure; do not silently patch the candidate and continue.

### Executable procedure and cleanup - not yet review-complete

Section 7 is an operation sequence, **not a reviewed executable procedure**.
The exact-image database client runs its bundled schema on startup;
therefore schema access MUST target only the isolated database. Source
inspection located `/v1/receipts/:receiptId` with database fallback, but the
existing `scripts/check-receipt-lookup.js` explicitly asserts an in-memory
lookup and uses a locally constructed receipt. It cannot be reused as proof
of restart persistence or receipt-signature validity.

Before executable admission, supply and review the actual isolated provisioning
and deployment artifact, target guards, test-only auth/signing setup, safe
nonfinancial receipt-generating path, database provenance assertions, real
cryptographic verification linked to the receipt, deny-case request set,
stage timers, stop/recovery behavior, and exact-ID cleanup operations.
If the images do not provide the required proof, record a failed/blocked
test; do not invent a signed receipt or substitute a boolean field.

Cleanup owner: Cody. Export sanitized evidence and verify the manifest
before any deletion. Approve an explicit list of exact test resource IDs,
including dependencies and any shared-scope assignment created under a
separate authorization. Exclude every existing production resource.
No broad group/subscription deletion, wildcard deletion, production cleanup,
or unreviewed snapshot deletion. Verify completion and residual billed
resources; stopping an app is not deletion and database storage can still
accrue costs.

Do not leave resources running past 11:00 Arizona without a separately
approved bounded extension. Evidence export failure or delayed deletion
requires immediate escalation to Cody and the preapproved containment plan;
it does not authorize destroying unpreserved evidence or ignoring costs.
The cleanup/containment contingency must be executable and approved before
resources are created.
