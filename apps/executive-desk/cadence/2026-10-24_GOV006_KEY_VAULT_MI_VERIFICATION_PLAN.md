# GOV-006 Key Vault / managed-identity verification plan

Prepared: October 24, 2026 UTC.

**Status: documentation-only proposal. Not approved for spending, provisioning,
permission changes, execution, rehearsal or deployment.**

Review source: `36e690649a070f3f1b2fa4b77ea696528d369f7d`, including parent
`9f5e2160102833304282c8a2c58a9feb8ff31056` and implementation
`8b18d39fb94e9606f35c2fba50c1030a9ae7c3e8`. This new plan is not in those
commits. A future harness or image change creates a new exact review target.

GOV-006 remains **Verification / Technical HOLD**; runtime REJECT is unchanged.
GOV-001 remains Conditional and GOV-002 HOLD. Independent review is unassigned.
October 28 is not authorized; October 29 can remain an evidence-and-blocker review.

## 1. Objective and evidence boundary

Prove that the committed `createAzureKeyVaultReceiptSigner` uses a test-only
managed identity to retrieve the public portion of a versioned P-256 key and
request ES256 signatures, and that stored receipt/authority signatures verify
after database reload and application-process replacement. Exercise signer
failure through the real authenticated HTTP dispatch path, not only an SDK probe.

The prior local HTTP/PostgreSQL check replaced the receipt signer with an
ephemeral local signer. It is useful baseline evidence, not Key Vault or
managed-identity evidence. Do not substitute an operator's Azure CLI session,
service-principal secret, exported private key, or default credential chain for
the workload identity in this test.

This is a prerequisite test, not a current -> prior -> current rehearsal.
Neither historical rollback image contains the remediation merely because this
source plan exists. An immutable test image and its source/test provenance are
still prerequisites. Passing this plan would not by itself clear rollback
readiness, governance authorization, image provenance or independent review.

## 2. Planning context and read-only observations

Cody confirmed these assumptions for planning only:

- Subscription `82bd72d4-00ef-400d-839b-e168e980c510`; region `eastus2`.
- Dedicated Standard Key Vault, software-protected EC P-256 key, test-only
  managed identity. This is not Premium, an EC-HSM key, or a Managed HSM pool.
- Include network isolation, dependencies, logs and cleanup in cost.

Read-only queries performed October 24, approximately 19:38 UTC:

| Check | Observed result | Limit |
| --- | --- | --- |
| Current Azure account | `Azure subscription 1`, Enabled; subscription above; tenant `762ce366-c9c0-449a-adec-1b7608b4ce2a` | Authentication/read access is not proof of write, role-management or data-plane authority |
| Proposed resource group | `rg-nc-g006-rh-20261028` absent | Not reserved; recheck before any creation |
| Key Vault name check | `kvncg006mi102882bd` available | Availability can change; not reserved or created |
| Key Vault provider | Registered; vaults advertise East US 2 | Does not prove quota, policy, private-endpoint or ACA capacity |
| Crypto User role definition | Read/sign plus update, backup, encrypt/decrypt, wrap/unwrap and verify | Too broad for the proposed minimal signer |

Do not treat service availability as complete resource/capacity validation.
Before requesting execution, refresh access, name and soft-deleted-name checks,
provider registration, policies, subnet allocations, regional SKU/quota
capacity, and effective/inherited role assignments. Do not register providers,
install Azure extensions, change the selected subscription, or add access as a
side effect of a preflight.

## 3. Exact proposed resource identities

Use only the isolated option-A design already selected for further planning;
do not silently switch to a VM-only proof or provision both alternatives.
All resources below are proposals, not existing or validated resource IDs.

ARM prefix `R` means exactly:
`/subscriptions/82bd72d4-00ef-400d-839b-e168e980c510/resourceGroups/rg-nc-g006-rh-20261028`.

| Resource | Proposed identity / settings |
| --- | --- |
| Resource group | `R` |
| Standard test vault | `R/providers/Microsoft.KeyVault/vaults/kvncg006mi102882bd` |
| Signing key | `https://kvncg006mi102882bd.vault.azure.net/keys/gov006-receipt`; create two versions, capture actual versioned URLs, never use the unversioned URL at runtime |
| Wrong-key negative-test key | Same vault, key name `gov006-other`; no workload assignment to it |
| Key settings | EC, P-256, software-protected, sign/verify operations only; generate inside Key Vault, no import/export or release policy; automatic rotation off; proposed 7-day expiry |
| Signer user-assigned identity | `R/providers/Microsoft.ManagedIdentity/userAssignedIdentities/id-nc-g006-kvsign-1028` |
| Public-reader identity | `R/providers/Microsoft.ManagedIdentity/userAssignedIdentities/id-nc-g006-kvread-1028` |
| Denied identity | `R/providers/Microsoft.ManagedIdentity/userAssignedIdentities/id-nc-g006-kvdeny-1028`; no Key Vault role |
| Test app | `R/providers/Microsoft.App/containerApps/ca-nc-g006-kvtest-1028`; internal ingress, Consumption, max one replica per test phase |
| Test environment | `R/providers/Microsoft.App/managedEnvironments/cae-nc-g006-rh-1028` |
| VNet | `R/providers/Microsoft.Network/virtualNetworks/vnet-nc-g006-rh-1028` |
| Private-endpoint subnet | Child subnet `snet-g006-kvpe-1028`; no service delegation; CIDR/private IP pending reviewed network allocation |
| Key Vault private endpoint | `R/providers/Microsoft.Network/privateEndpoints/pe-nc-g006-kv-1028`, subresource `vault`; actual managed NIC ID captured after creation |
| Private DNS | `R/providers/Microsoft.Network/privateDnsZones/privatelink.vaultcore.azure.net`; link `link-nc-g006-kv-1028` to the test VNet only |
| DNS zone group / private connection | PE children named `kv-dns` / `kv-connection`; record returned ARM IDs and IPs |
| Diagnostic setting | Vault child `gov006-kv-audit`; `AuditEvent` to the dedicated test workspace, resource-specific table where supported |
| Test log workspace | `R/providers/Microsoft.OperationalInsights/workspaces/log-nc-g006-rh-1028`; no production sink |
| Test database | `R/providers/Microsoft.DBforPostgreSQL/flexibleServers/psql-nc-g006-rh-1028-82bd72d4`, database `sentinel_rehearsal`; private VNet integration, synthetic records only |
| Client / egress controls | Existing proposed option-A `vm-nc-g006-rh-client-1028`, `afw-nc-g006-rh-1028`, `afwp-nc-g006-rh-1028`, NSG and route table; see isolation comparison |

The proposed environment, database, VNet, firewall and client do not exist just
because they appear in an earlier proposal. Their full costs and approval
remain necessary. This plan adds no production ACR assignment or registry
upgrade. The digest-qualified image delivery/pull path remains unresolved.

Allocate actual tenant, client and principal IDs for each new managed identity,
role-definition GUIDs, assignment GUIDs, key-version IDs, subnet CIDRs and
private IPs in a signed execution manifest after authorized provisioning.
Do not fabricate these generated values. Missing manifest entries block tests.

## 4. Permissions and key custody

Propose two custom roles, subject to separate authorization:

| Role / principal | Allowed data actions | Assignment scope |
| --- | --- | --- |
| `GOV006 Receipt Signer 1028` / signer identity | `Microsoft.KeyVault/vaults/keys/read`, `Microsoft.KeyVault/vaults/keys/sign/action` only | Test vault key resource `/keys/gov006-receipt`, covering its versions |
| `GOV006 Receipt Public Reader 1028` / reader identity | `Microsoft.KeyVault/vaults/keys/read` only | Same test key |
| Denied identity | None | No assignment; prove no inherited grant |

No wildcard actions, secrets access, backup, key update/delete, export/release,
decrypt, wrap, role assignment, production access or subscription-wide workload
role. Local receipt verification needs no Key Vault `verify` permission; it
fetches public JWK material and uses Node crypto.

Custom definitions have no control-plane actions and are assignable only in
the test resource group, with assignments restricted to the named key. If
custom roles are disallowed, stop for an explicit permission-design decision;
do not silently substitute Crypto User. Its observed built-in role ID is
`12338af0-0e69-4776-bea7-57ae8d297424`, and its additional permissions are real.

The designated provisioner requires separately verified resource-write/identity
attachment rights in the test scope. A role administrator requires authority
to create the two custom definitions and assignments; Contributor alone does
not grant this. A named key custodian requires separately approved, temporary
Key Vault key-management rights for creation, versioning and disable/enable
failure injection. Capture their actual principal/assignment IDs and expiry;
Cody's business role is not proof of those Azure rights. Do not grant
subscription-wide Owner or User Access Administrator to run this test.

The signer must remain the unmodified production factory: use
`ManagedIdentityCredential(AZURE_CLIENT_ID)`, where `AZURE_CLIENT_ID` is the
signer's actual client ID, and `SENTINEL_RECEIPT_KEY_ID` is an exact versioned
URL. No injected fake KeyClient/CryptographyClient or `receiptSigner` override
in Azure acceptance runs. Separate phases use reader/denied client IDs. Only
the intended identity should be available to each phase; image-pull identity
must not become a signing identity.

## 5. Network, data and logging controls

- Key Vault public network access disabled; default deny; trusted-service
  bypass disabled. Private endpoint approved for this vault only.
- Resolve the vault hostname through the dedicated private DNS zone to the
  captured PE private IP. Link no production VNet or production DNS zone.
- Extend the prior default-deny NSG/UDR/firewall proposal with the exact PE
  destination on TCP 443. Permit only documented platform/image/auth/logging,
  private test database and approved test-client paths. ACA's local identity
  endpoint must work; never capture its header or bearer token.
- Internal ACA ingress is not outbound isolation. Verify production destinations
  are denied before handler execution. No broad wildcard storage exception as
  an image-pull workaround. No production traffic, data, secrets or signing keys.
- Retain synthetic API keys, tenants, receipts and side-effect marker tables
  only. No external payment, email, webhook, scheduler or business handler.
- Send test-vault AuditEvent records and bounded workload logs to the dedicated
  workspace. Correlate KeyGet/KeySign, UTC timestamps, status, key-version URL,
  request/correlation IDs, app revision and managed-identity principal ID.
  Capture errors, not just a `verified:true` flag.
- Never log access tokens, `IDENTITY_HEADER`, private key bytes, database URLs
  containing credentials or full environment dumps. Public JWK, IDs, signatures,
  synthetic authority and receipt hashes are evidence.

Network rules, source IPs, DNS, capacity, log export path and private image
delivery need reviewed implementation. This document is not that implementation.

## 6. Test matrix and measurable acceptance

All tests must produce assertions plus raw sanitized output, with an exact
source SHA, harness hash, immutable image digest, dependency-lock hash, resource
manifest, UTC times and operator. No result in this table has been executed.

| ID | Test | Required observation |
| --- | --- | --- |
| KV-01 | Managed identity and custody | Real factory signs from ACA without CLI/client-secret fallback; Key Vault logs identify signer principal; public JWK is EC/P-256 with no private `d`; key metadata matches exact version and sign/verify operations |
| KV-02 | ES256 readiness and receipt | `ensureReady()` verifies its probe; sign 10 distinct synthetic receipts with actual ES256; each decoded P1363 signature is exactly 64 bytes and verifies locally with the fetched public key |
| KV-03 | Authenticated HTTP and durability | Real `/v1/command` -> policy -> journal -> synthetic handler -> Key Vault sign -> PostgreSQL commit -> response; 10/10 successful requests have stored receipt, completed journal and exact signed tenant/actor/key ID/role/scopes/decision |
| KV-04 | Replacement and tamper | Preserve database; replace app process, clear signer/public-key cache, retrieve those 10 receipts through authenticated retrieval and reload from PostgreSQL; verify 10/10 signatures and result binding. Mutations to payload, authority, key ID or signature fail verification, never return a verified success |
| KV-05 | Versions and scope | Create version B; configure B explicitly; new receipts bind B and old A receipts verify with A. A must remain fetchable. Wrong key name/vault is rejected before cross-scope access; missing/malformed/unversioned IDs and wrong curve fail closed |
| KV-06 | Denied / read-only identity | Fresh process for each client ID: denied identity cannot read or sign; reader can fetch public key and verify old receipts but cannot sign/readiness-probe successfully; authenticated HTTP returns 503 before handler, zero side-effect markers |
| KV-07 | Missing/unattached identity | Invalid/unattached client ID or absent identity endpoint cannot authenticate; bounded failure, no CLI fallback and zero handler effects |
| KV-08 | Disabled key, before handler | Custodian disables the configured version, then a fresh process calls readiness; HTTP 503, no success receipt, zero effects; pre-mutation retry allowed only after persisted `failed_before_mutation` and explicit restoration |
| KV-09 | Unavailable signer, after effect | Controlled synthetic handler barrier: after durable side-effect marker, authorized custodian disables only the test key, then releases barrier; actual Key Vault signing fails, HTTP 503, `retryable:false`; journal unresolved/reconciliation-needed, no signed receipt/completed state; three same-key retries each 409 with exactly one total effect |
| KV-10 | Persistence failure, after real sign | Test-only PostgreSQL trigger rejects signed-receipt INSERT after synthetic handler and real Key Vault sign; HTTP 503, atomic journal/receipt rollback and persisted unresolved state; remove trigger; three retries each 409, exactly one effect, no success response |
| KV-11 | Concurrent and conflicting requests | Ten simultaneous identical-key HTTP calls cause exactly one effect and one receipt; others may replay the same verified receipt or return pending/unresolved 409. Different payload or command under that key returns conflict 409 without another effect |
| KV-12 | Auth and tenancy | Missing/invalid key 401, insufficient scope/cross-tenant 403, all before handler and journal claim; no leaked receipt or success response |
| KV-13 | Network failure | Deny only the test signer-to-PE path in a separately authorized phase: cold read and warm-cache sign fail without fallback; restore exact rule afterward; production destinations remain denied |
| KV-14 | Bounded transport/throttle faults | Separately labeled client fault-injection tests for 429/timeout/5xx with bounded SDK retries; no success or replay after possible effect. Do not manufacture throttling by load; simulated faults are not Azure-service observations |

Proposed timing: each HTTP test capped at 60 seconds (configure explicit SDK
retry/network deadlines in the future harness); up to 10 minutes for initial
role propagation before workload start, with no permission broadening.
After that, stop as BLOCKED. Require 100% expected assertions, zero invalid
signatures accepted, zero unauthorized effects and zero duplicate effects.
No threshold is met merely because an SDK call eventually succeeded.

The current signer caches public keys. A warm verifier can legitimately verify
an existing signature while Key Vault is offline or the key is disabled.
That does not prove a new signing operation works. Test cold and warm cases
separately; don't expect offline local verification to enforce revocation.
Use separate pre-created principals for denial tests, not instant RBAC
revocation as an oracle: identity/authorization caches can delay changes.

The barrier, Azure harness, bounded deadlines and result collection are future
test work, not present in the committed local runner. If source changes are
needed, review and test a new SHA/image before running Azure acceptance.

## 7. Cost estimate and stop conditions

USD public retail planning values researched October 24, 2026; no free grants,
subscription discount or hard cost cap assumed. Four hours includes setup,
propagation, logging/export and cleanup, not four hours of approved testing.
No execution window has been granted for this verification.

| Increment to selected option-A infrastructure | Quantity / rate | Estimated USD |
| --- | --- | ---: |
| Standard software EC operations | Reserve 10,000 calls at the higher Advanced Key Operations meter, $0.15/10K, including get/readiness/sign/management/retries | 0.1500 |
| Key Vault Standard private endpoint | 4 hours at $0.01/hour | 0.0400 |
| Private Link data | 0.1 GB each direction at $0.01/GB | 0.0020 |
| Additional private DNS zone | Reserve one full zone-month at $0.50 | 0.5000 |
| Additional DNS queries | 1,000 at $0.40/million | 0.0004 |
| Additional audit/workload ingestion | 0.1 GB at $2.76/GB | 0.2760 |
| User-assigned identities / custom roles | No separate service usage charge assumed; no paid identity-management add-on | 0.0000 |
| Increment subtotal / 20% contingency | $0.9684 / $0.19368 | 1.16208 |

Do not charge a Managed HSM hourly-instance meter to a Standard vault.
Standard Operations ($0.03/10K) and Advanced Key Operations ($0.15/10K)
were returned by the retail API; budget the higher meter pending exact EC
classification rather than understate it. Manual creation of version B, not
a scheduled rotation policy; no automatic-rotation charge assumed.

Fresh meter references:

- Key Vault Standard Operations: `0f824807-2376-435c-95c9-f992b67a07b0`;
  Advanced Key Operations: `0e2483c4-e549-4bdf-9f33-82fdfe3abb54`, `eastus2`.
- Virtual Network Private Link, Standard Private Endpoint:
  `e6ab7238-e433-4fe0-a2b2-2b2564df2cdb`, Global, $0.01/hour.
- Standard data ingress / egress:
  `10caa28b-6479-4852-9eb7-610870cb6417` /
  `e7f162f6-7cb8-4cea-ad4f-12cdb5dda25b`, Global, first tier $0.01/GB.

The Azure pricing tool returned no Standard Key Vault SKU rows because of
the catalog's ARM-SKU mapping; direct public Retail Prices API queries returned
the above meter rows. No empty result was treated as free.

Dependent infrastructure is not free or already approved. Carry forward the
[option-A cost comparison](2026-10-24_ROLLBACK_ISOLATION_DESIGN_COMPARISON.md):
ACA compute, managed PostgreSQL/storage/backup, firewall/data processing,
client VM/disk/IPs, private DNS, logs and miscellaneous allowance.

- Previous four-hour base including 20% contingency: **$15.54**.
- Base plus this increment: **approximately $16.71**, rounded upward.
- Previous storage-retention sensitivity plus this increment:
  **approximately $27.59**, above the proposed $25 ceiling.

The base rates are historical planning inputs, not freshly quoted here. This
addition assumes the test app fits the base's total budget of two concurrent
1-vCPU/2-GiB replicas across ALL test apps; stop other synthetic test apps while
running it. No new environment/VM/registry, longer lifetime or extra replica
is free. The base includes 1 GB logs; this adds 0.1 GB, not a second whole
workspace minimum. DNS/log rates are carried from the earlier collection.

The estimate is NOT a complete execution quote: private image delivery,
unvalidated miscellaneous/transfer/managed-network charges, exact policy/SKU
constraints and provisioning time still require resolution. A delayed
firewall deletion can dominate cost; $25 remains proposed, not approved.
Budget alerts/daily caps are not instant spending stops. Measure operations,
bytes and elapsed time during execution, stop new tests at 75% of approved
time/budget, preserve/export evidence and initiate approved cleanup; escalate
overrun or cleanup failure. Reprice/reauthorize before extending time or scope.

## 8. Evidence preservation and cleanup scope

Before deletion, export and checksum: source/image/harness manifest, public JWK
per key version, synthetic signed receipts and journal outcomes, signature and
tamper results, identity and assignment metadata, sanitized Key Vault audit
records, network-denial observations, test output and cost quantities. Export
logs before deleting the workspace, with bounded wait up to 15 minutes;
missing logs are missing evidence, not an inferred PASS. Preserve two checked
copies at an approved destination before making the vault unavailable.

Propose 7-day soft-delete retention with purge protection enabled on this
test-only vault. Key expiry is not deletion. Public JWKs allow offline receipt
verification after cleanup, but not live Key Vault replay; label that limit.
No private-key export, key backup or recovery/purge permission for workloads.

After separately authorized cleanup, in this order:

1. Stop test traffic/app executions; record final journals, remove the temporary
   database trigger/barrier state, verify no queued/retrying workloads.
2. Export evidence/logs; verify signatures and checksums using saved public keys.
3. Remove only captured test diagnostic setting and role-assignment IDs;
   detach the three test identities; remove temporary custodian grants.
4. Delete the test app; delete only the dedicated key-vault private endpoint
   and its DNS zone group; verify platform-managed NIC removal.
5. Delete the dedicated DNS record/link/zone only after verifying sole ownership;
   don't touch any shared or production zone.
6. Soft-delete the dedicated vault. Record deleted-vault ID and retention end.
   **No purge**: do not grant Purge Operator, disable retention or reuse the name
   before expiry. Purge protection cannot be bypassed.
7. Remove captured test identity resources and custom role definitions only
   after checking no remaining assignments use them.
8. If created for this combined test, remove each explicitly listed option-A
   app/environment, PostgreSQL server, firewall/policy, VM/disks/NICs/IPs,
   workspace, routes/NSG/VNet by captured ID and dependency order. If another
   approved test still needs any resource, require a priced handoff and named
   owner; don't quietly retain it.
9. Re-inventory the test group and subscription-scoped role definitions/
   assignments, deleted vault and automatically created networking; document
   residual costs/retention and escalate failures. Delete the empty group
   only if separately approved and verified empty.

No wildcard, subscription-wide, broad resource-group or production deletion.
Actual executable commands and resource IDs must be reviewed against the
authorized manifest before execution. Cleanup authority must be granted in
advance, separately from evidence review; it is not implied by this plan.

Soft-deleted software keys/vaults do not accrue normal operation usage while
deleted; purge/recovery operations are charged. That does not cancel costs
from any still-running private endpoint, logs, firewall, disk or database.

## 9. Approval and execution prerequisites

Required before an execution request:

1. Confirm live subscription access, scope-specific provisioner/role-admin/
   custodian authority, policy/capacity, names and generated IDs; revalidate the
   exact manifest. No existing access changes were performed for this plan.
2. Approve this architecture, key/role lifecycle and protected 7-day retention,
   full dependency/isolation design, image delivery and complete estimate.
3. Implement/review the bounded Azure harness and failure barriers; build a
   digest-pinned image with exact source/test provenance. Do not relabel local
   ephemeral-key tests as Azure-managed-identity tests.
4. Name the operator, Azure permission grantors, cleanup owner and replacement
   independent reviewer. Cody is proposed business authority; independent
   review remains unassigned.
5. Obtain a separate signed decision covering exact resources, assignments,
   key disable/enable fault injections, synthetic data, window/time zone,
   spending ceiling, stop conditions, evidence delivery and cleanup.
6. Complete preparation/validation gates before any authorized deployment or
   execution. This plan is not Ready for Validation, Validated or approved.

Independent source review may proceed now at the recorded SHA and ancestry.
It must not be reported as completed or as approval to create Azure resources.

## 10. Sources

- [Committed signer](../../sentinel/src/receipts/azureKeyVaultSigner.js),
  [receipt runtime](../../sentinel/src/receipts/receiptRuntime.js),
  [local HTTP runner](../../../scripts/check-command-http-postgres.js).
- [Existing remediation evidence](2026-10-24_GOV006_SIGNED_RECEIPT_REMEDIATION_DESIGN.md).
- [Key Vault private endpoints](https://learn.microsoft.com/en-us/azure/key-vault/general/private-link-service)
  and [network security](https://learn.microsoft.com/en-us/azure/key-vault/general/network-security).
- [ACA managed identities and identity endpoint](https://learn.microsoft.com/en-us/azure/container-apps/managed-identity).
- [Key Vault roles](https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles/security#key-vault-crypto-user).
- [Key Vault logging](https://learn.microsoft.com/en-us/azure/key-vault/general/logging).
- [Soft delete, retention and billing](https://learn.microsoft.com/en-us/azure/key-vault/general/soft-delete-overview).
- [Retail Prices API](https://learn.microsoft.com/en-us/rest/api/cost-management/retail-prices/azure-retail-prices),
  [Key Vault pricing](https://azure.microsoft.com/en-us/pricing/details/key-vault/),
  [Private Link pricing](https://azure.microsoft.com/en-us/pricing/details/private-link/).
