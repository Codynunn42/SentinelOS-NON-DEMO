# GOV-006 isolated rollback: design and cost comparison

**Collected:** October 24, 2026. **Status:** option A selected for further planning
only; spending, provisioning and execution remain unapproved.

This supplements the [R2 approval request](2026-10-24_ISOLATED_ROLLBACK_REHEARSAL_APPROVAL_REQUEST.md);
it does not replace its historical evidence or constitute an executable procedure.
No application, image, database, production setting, access assignment or traffic
was changed. Runtime REJECT and GOV-006 Verification / Technical HOLD remain.

## 1. Decision in plain language

| Option | What it can demonstrate | What it cannot demonstrate |
| --- | --- | --- |
| A: isolated Azure Container Apps (ACA), managed PostgreSQL, filtered VNet | Current -> prior -> current using ACA revisions, probes and managed database, plus receipt persistence and signature tests if implemented successfully | Production readiness, production traffic rollback, or exact equivalence to production merely because the services match |
| B: isolated Linux VM, identical app images, containerized PostgreSQL | Image startup, isolated validator characterization, and database-backed receipt/signature recovery across app process/container replacement | ACA revision switching, routing, managed identity image pulls, managed PostgreSQL recovery, or ACA platform behavior |

**Recommendation:** develop option A for the requested ACA rollback-readiness
evidence. Option B is a lower-cost preliminary image/data rehearsal, not a
substitute for platform rollback evidence. Choosing B changes the evidence scope
and must be recorded as such; it does not clear criterion C.

Both options have short-lived planning estimates below the proposed $25 ceiling.
Neither is ready for execution approval: network implementation, quantities,
quota/capacity, executable tests, cleanup and applicable minimum billing must
still be verified. Do not treat the estimates as a spending guarantee.

**Cody's selection:** through the planning-only decision form, Cody selected
option A, Azure Container Apps, for further design. Option B is comparison
material, not selected implementation. This decision does not approve the
proposed $25 spending ceiling, deployment plan or rehearsal execution.

## 2. Shared boundaries and exact proposed identities

- Subscription: `82bd72d4-00ef-400d-839b-e168e980c510`; region: `eastus2`.
- Resource group: `rg-nc-g006-rh-20261028`, previously observed absent.
- Synthetic tenants, keys, receipts, ledgers and database only. No production
  database, storage, snapshots, secrets or financial execution.
- Same two exact image digests as R2, not a rebuild or validator repair.
- Cody is the designated business approver and proposed operator. Freddie's
  completed assessments remain historical evidence; a future independent
  reviewer is currently unassigned. Design selection is not execution approval
  or approval of historical deployments.
- Proposed October 28 window: 09:00-11:00 America/Phoenix, including cleanup.
  October 29 08:30-09:30 is the review meeting, not an execution authorization.

| Resource | Option A proposed name | Option B proposed name |
| --- | --- | --- |
| VNet | `vnet-nc-g006-rh-1028` | `vnet-nc-g006-rh-1028` |
| NSG / route table | `nsg-nc-g006-rh-1028` / `rt-nc-g006-rh-1028` | `nsg-nc-g006-rh-1028` / no route table selected |
| ACA environment / app | `cae-nc-g006-rh-1028` / `ca-nc-g006-rh-1028` | None |
| Test identity | `id-nc-g006-rh-1028` | No workload Azure identity |
| Database server / database | `psql-nc-g006-rh-1028-82bd72d4` / `sentinel_rehearsal` | PostgreSQL container `g006-rh-postgres` / `sentinel_rehearsal` |
| Firewall / policy / public IP | `afw-nc-g006-rh-1028` / `afwp-nc-g006-rh-1028` / `pip-nc-g006-rh-fw-1028` | None |
| Linux test VM / NIC / SSH public IP | `vm-nc-g006-rh-client-1028` / `nic-nc-g006-rh-client-1028` / `pip-nc-g006-rh-client-1028` | `vm-nc-g006-rh-1028` / `nic-nc-g006-rh-1028` / `pip-nc-g006-rh-1028` |
| VM OS disk | `osdisk-nc-g006-rh-client-1028` | `osdisk-nc-g006-rh-1028` |
| VM database disk | None | `datadisk-nc-g006-rh-1028` |
| Dedicated log workspace | `log-nc-g006-rh-1028` | None; bounded local evidence |

Names are proposals, not reserved resources or validated ARM IDs. Do not deploy
both options into the shared proposed names. Exact subnet CIDRs, private DNS
names, PostgreSQL image/version, test-client source IP, evidence destination,
all generated child-resource IDs and cleanup IDs remain to be resolved.
No globally unique database name availability or SKU capacity is established.

## 3. Option A: closer platform fidelity, more isolation work

Proposed topology:

- Workload-profiles ACA environment using the **Consumption** profile, not a
  dedicated compute profile. Internal ingress; maximum two app replicas.
- Separate ACA, delegated PostgreSQL, test-client and `AzureFirewallSubnet`
  subnets. PostgreSQL private VNet integration, no public database access.
- UDR and Azure Firewall Standard, DNS proxy as required, default-deny
  application egress; only individually justified platform/image/auth paths.
  No VNet peering, production private DNS links or shared writable services.
- Small private test-client VM, with SSH limited to the approved operator
  source address and no public application ingress. No Bastion in this estimate.
- Explicit capture of routes, NSGs, DNS, firewall policy and denial tests before
  the candidate is started. Internal ingress alone is not egress isolation.

**Unresolved image-pull boundary:** read-only `az acr show` on October 24 returned
`acrncdevsentinel`, Basic tier, public network enabled, `dataEndpointEnabled:false`.
Existing ACA guidance includes registry/blob/auth dependencies. A broad
`*.blob.core.windows.net` exception is not proof that production storage is
unreachable. Do not mark production isolation complete with that exception.
Resolve a narrow artifact-transfer/pull design and test its denies first.

Creating an AcrPull assignment on the shared registry is a control-plane write
outside the isolated resource group. It is **not authorized** by this proposal.
No registry tier upgrade, new assignment, credential read or image copy occurred.
An approved read-only pull path or separately priced isolated registry design
must be chosen without quietly expanding the production-change boundary.

The 30-minute setup segment is not established as feasible for firewall,
environment and PostgreSQL provisioning. Either prove that timing or approve a
separate bounded pre-staging window and include its costs. Otherwise stop at
09:30 without progressing; the extra two hours in a cost model do not authorize
an extension to the execution window.

## 4. Option B: cheaper, narrower image/data evidence

Proposed host: Linux `Standard_B2ms` (2 vCPU, 8 GiB), two 32-GiB Standard SSD
E4 LRS disks. Run only the selected app image and isolated PostgreSQL on a
dedicated internal container network. Preserve the database volume across app
replacement, not by keeping the app process alive.

Before workload start:

1. Approve how images and test tooling arrive, with digest checks. Bootstrap
   must not execute the candidate or load production credentials.
2. Remove temporary registry authentication; no workload Azure identity.
3. Deny workload external/VNet/production egress and metadata access, permit
   only the isolated database/test paths, and verify container-namespace denies.
   Disable privileged containers and host networking. Host firewall handling
   must account for Docker forwarding; a UFW setting alone is insufficient.
4. Override NSG default Internet/VNet outbound allows; restrict SSH to the
   approved operator source. Bind test endpoints to loopback, not public ingress.
5. Prove the restrictions before app startup; export evidence over the approved
   SSH management session after the test. No new public storage required.

These are implementation requirements, not already-tested firewall rules.
A private subnet or resource-group label alone does not prove isolation.
Containerized PostgreSQL is intentionally different from the managed service.

## 5. Transparent planning costs

USD public Consumption retail rates retrieved October 24; East US 2 except
global DNS. No free grants, credits, negotiated discounts or tax assumed.
Compute is on-demand Linux, not Spot or reservations.

| Meter | Unit price used |
| --- | ---: |
| ACA active vCPU / GiB memory | $0.000024 / $0.000003 per second |
| ACA requests | $0.40 per million |
| ACA conditional environment-management reserve | $0.10/hour |
| Firewall Standard deployment / processing | $1.25/hour / $0.016/GB |
| Optional Standard capacity-unit reserve, applicability unresolved | $0.07/unit-hour, two units reserved |
| PostgreSQL Flexible Server retail B1MS | $0.017/hour |
| PostgreSQL storage / charged backup reserve | $0.115 / $0.095 per GB-month |
| Test-client Linux B2s / alternative Linux B2ms | $0.0416 / $0.0832 per hour |
| Standard SSD E4 LRS, 32 GiB | $2.40/disk-month |
| Standard static IPv4 | $0.005/address-hour |
| Private DNS zone / queries, higher first tier | $0.50/zone-month / $0.40 per million |
| Log Analytics charged ingestion | $2.76/GB |

ACA model budgets two full 1-vCPU/2-GiB replicas throughout, 10,000 requests,
2 GB firewall processing, 32 GB database plus 32 GB charged backup reserve,
one B2s client and disk, two IPs, two full zone-months, 10,000 DNS queries,
1 GB logs, and **$2 miscellaneous allowance**. Both optional fees are reserved,
not asserted to be universally additive. A Consumption-only environment does
not incur dedicated management merely because it is a workload-profiles
environment; private endpoint/planned-maintenance features affect applicability.

VM model budgets one B2ms host, two E4 disks, one IP, local bounded logs and
**$2 miscellaneous allowance**. No Azure log-ingestion service is assumed.

| Cost scenario, including 20% contingency | Option A: ACA | Option B: VM |
| --- | ---: | ---: |
| Two-hour resource lifetime, monthly storage prorated | $11.25 | $2.63 |
| Four-hour lifetime to model provisioning/deletion delay | $15.54 | $2.85 |
| Four-hour compute plus a full month reserved for listed disks/database/backup | $26.42 | $8.58 |

Monthly proration uses 730 hours only as an estimating convention. The final row
is retention sensitivity, **not** a claim that deleting storage after four hours
necessarily incurs a full month. It also does not cover leaving compute running
for a month: Firewall Standard deployment alone is $30 for 24 hours.

The $2 line is an **unverified planning allowance**, not a quote or guaranteed
upper bound for disk transactions, evidence storage, transfer or ACA-managed
network resources. A broad supporting-price lookup hit HTTP 429; narrower
queries succeeded, but those miscellaneous costs are not fully itemized.
Replace allowances with bounded quantities and applicable retail meters before
calling this a complete approval estimate.

No Bastion, NAT Gateway, private endpoints, dedicated ACA compute, isolated ACR,
marketplace premium, additional network appliance or out-of-region transfer is
priced. Adding any requires a new topology and estimate.

**Budget decision:** the four-hour estimates are below $25, but neither is a
hard cap. The retention-reserve ACA scenario exceeds it. Keep $25 proposed, not
approved spending; do not auto-increase it or rely on budget alerts to stop cost.

## 6. What still blocks an execution-ready package

1. Architecture scope is selected for further planning; Cody must still approve
   the complete design and fully itemized ceiling before provisioning is
   authorized. Design selection alone is not authority to provision.
2. Resolve network/image-pull isolation, exact child-resource IDs and source IP;
   verify SKU/quota/name/policy availability without changing production.
3. Produce and review the executable current -> prior -> current procedure,
   including signed synthetic receipt generation and actual cryptographic
   verification. A `verified:true` flag or memory lookup is not proof.
4. Demonstrate the same receipt, database provenance after app replacement,
   unchanged tenant/authority fields, and signature validity at every stage.
   Preserve R2's 600-second transition limit, three health/readiness successes
   ten seconds apart and zero unauthorized/cross-tenant results.
5. Retain the candidate's null/array-payload and contradictory-command
   differences as isolated characterization only. No production waiver or
   assumption that 16 offline outcomes prove endpoint/container behavior.
6. Review exact-resource cleanup, including NICs, IPs, disks, DNS, logs and any
   approved assignment. Export and verify evidence first. No wildcard or broad
   resource-group delete; fail explicitly and escalate if export/deletion fails.
7. Obtain explicit execution approval, then required preparation/validation.
   The procedure-review draft is
   [2026-10-24_GOV006_ISOLATED_REHEARSAL_PROCEDURE_DRAFT.md](2026-10-24_GOV006_ISOLATED_REHEARSAL_PROCEDURE_DRAFT.md);
   it records a cryptographic receipt blocker and is not executable.

## 7. Sources and reproducibility

- [Azure Retail Prices API](https://learn.microsoft.com/en-us/rest/api/cost-management/retail-prices/azure-retail-prices)
- [ACA billing and conditional management charges](https://learn.microsoft.com/en-us/azure/container-apps/billing)
- [ACA user-defined routes](https://learn.microsoft.com/en-us/azure/container-apps/user-defined-routes)
- [ACA with Azure Firewall](https://learn.microsoft.com/en-us/azure/container-apps/use-azure-firewall)
- [NSG default rules and stateful behavior](https://learn.microsoft.com/en-us/azure/virtual-network/network-security-groups-overview)

Session deliverables preserve the 177-row core catalog, collector-transcribed
support rates with meter IDs, a reproducible cost-model script, its JSON output
and the private-DNS response. They are a new October 24 collection, not recovered
October 22 captures or independently accepted runtime evidence.

No email sent, publication performed or Freddie receipt/review inferred.
