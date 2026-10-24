# SentinelOS Local Verification Audit Record

Status: local evidence inventory and reconciliation; not independent acceptance
or execution authorization.

- **Accountable owner:** Cody Nunn, user-designated business authority.
  This record does not certify independent review or Azure permissions.
- **Original draft timestamp:** October 24, 2026, 20:15 UTC / 13:15 MST
  (America/Phoenix), supplied with the draft; not a proven test-run timestamp.
- **Checksum reconciliation:** October 24, 2026, 20:17 UTC / 13:17 MST.
- **Target implementation:** `36e690649a070f3f1b2fa4b77ea696528d369f7d`,
  including `9f5e2160102833304282c8a2c58a9feb8ff31056` and implementation
  `8b18d39fb94e9606f35c2fba50c1030a9ae7c3e8`.
- **Planning checkpoint:** `46db75b870cb923c7440387d4ea1d0185ccd82b5`.
- **Original audit draft:** `58bb4b7eed54eef557905848402eaf91f67a26c9`.
- **Branch:** `cadence/gov006-planning-2026-10-24`.

## 1. Preserved local evidence

The explicit evidence inventory is in the ignored local directory
[`evidence-staging/2026-10-24-local-remediation/`](../../../evidence-staging/2026-10-24-local-remediation/).
The logs are not included in this Git commit or automatically accessible to a
remote reviewer. Delivery and reviewer receipt remain outstanding.

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `npm-test-133.log` | 9361 | `fe77a2ee2588194733d1f6db269f3a2317181d3f31cf4ab42aedea88eb89e43e` |
| `http-postgres-test.log` | 207 | `fe551d2afd5ded23f812e88684fa371ef062fa0b1152c0efd6272edaf0f1e03c` |

Observed contents:

- The suite log records **133 passing, 6 pending**, with no failing-test
  summary. Pending tests remain pending, not passes. The supplied draft
  attributes this to `npm test`; the log is not by itself a full provenance
  record establishing the shell command, exit status or exact tested checkout.
- The HTTP log records database `sentinel_test`, PostgreSQL **16.15**, and
  `Authenticated HTTP execution, signed PostgreSQL receipt, duplicate/conflict,
  failure, and pre-handler authorization checks passed`.
  This is a successful local PostgreSQL result, not merely a missing-database
  failure. It is a distinct capture from the earlier documented `sentinel_it`
  runs; do not silently merge their database identities.
- The HTTP runner requires `SENTINEL_TEST_DATABASE_URL` and rejects missing
  configuration. That failure-path behavior is not evidence of a successful
  durable run by itself.
- Log modification times observed during reconciliation were
  `2026-10-24T20:05:04.875553730Z` and
  `2026-10-24T20:15:08.782584145Z`, respectively. These are filesystem metadata,
  not authoritative execution timestamps or run IDs. The preserved files do
  not establish complete source/environment/run provenance.

The earlier manifest mistakenly hashed itself while being generated.
Reconciliation removed only that exact `SHA256SUMS` file and regenerated it
from this explicit two-log allowlist, without changing either log:

```text
sha256sum http-postgres-test.log npm-test-133.log > SHA256SUMS
sha256sum --check SHA256SUMS
http-postgres-test.log: OK
npm-test-133.log: OK
```

The regenerated manifest's SHA-256 is
`0d390cf456a1f02957f7e5fe7147c90e531ef07116a6de07aad1396357db9918`.
It intentionally does not contain a checksum of itself. Matching hashes prove
the inventoried bytes match at this check, not their origin, completeness,
independent acceptance or permanent immutability.

No tests were rerun for this reconciliation. Earlier execution details and
limitations remain in the
[signed-receipt remediation evidence](2026-10-24_GOV006_SIGNED_RECEIPT_REMEDIATION_DESIGN.md).
Missing commands, run IDs, exit-status captures and exact source attestation
must be reconciled or explicitly marked unavailable before reviewer handoff.
Do not reconstruct missing originals or attribute these later logs to the
target SHA solely because their test totals match.

## 2. Criteria disposition ledger

| Criterion | Local verification findings | Azure cloud status | Technical disposition |
| --- | --- | --- | --- |
| A: Image digest binding | Source and local test records exist; no reviewed immutable image/build binding for this remediation is established here. | Historical image digest is not proof that the remediation runs. No fresh running-replica/digest observation in this reconciliation. | UNVERIFIED / OPEN |
| B: Durability and recovery | Earlier journal and HTTP PostgreSQL integration results are recorded, alongside unit tests; not memory-only evidence. The newly inventoried HTTP log reports another local PostgreSQL success, with provenance limits above. | Key Vault/managed identity, Azure replica replacement, ledger persistence, audit-chain reseeding/continuity and heartbeat recovery remain unproven. Historical governance-status 503 is not a fresh observation. | UNVERIFIED / OPEN |
| C: Rollback readiness | Candidate source is `c1aece8f4b73a38230408709951d72a2a0a8d74b`; historical revision name is `ca-nc-dev-sentinel--sha-c1aece8-60-1`, not a commit SHA. Absence of a source schema delta is not demonstrated runtime/data compatibility. Validation regressions remain blockers. | Approved isolated current -> prior -> current rehearsal has not been demonstrated. No production activation or zero-traffic assumption is authorized. | UNVERIFIED / OPEN |
| D: Deployment governance | Tests and documentation do not prove attributable deployment authorization, environment protection or required human decision enforcement. | Effective permissions, applicable protection rules and approval bound to the exact source/image/operation remain unverified here. | UNVERIFIED / OPEN |

## 3. Next review boundary

Local preparation can continue with the
[Key Vault / managed-identity verification plan](2026-10-24_GOV006_KEY_VAULT_MI_VERIFICATION_PLAN.md)
and the existing isolated execution proposal. This audit does not lock or
independently accept a baseline, complete evidence handoff, or remove the
possibility of overstating proof.

Resolve source/log provenance, explicit evidence delivery, immutable-image
provenance, Azure signing verification, required human approval behavior,
original-finding coverage and independent reviewer assignment. Obtain separate
resource/access/spending/execution/cleanup approval before any cloud mutation.
October 28 remains a conditional target; October 29 may be an evidence-and-
blocker review.

**GOV-006 remains Verification / Technical HOLD.** The last recorded runtime
verdict remains **REJECT**; new Azure acceptance criteria remain unverified.
GOV-001 remains Conditional; GOV-002 HOLD. No deployment, rollback, resource
creation, access change or rehearsal is authorized by this record.
