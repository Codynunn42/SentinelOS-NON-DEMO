# GOV-006 isolated rehearsal procedure — review draft

**Packet:** GOV006-ROLLBACK-ISOLATED-20261024-R2
**Drafted:** October 24, 2026
**Status:** Design/procedure review only. **Not executable; NOT approved.**
**Selected planning scope:** isolated Azure Container Apps (ACA), by Cody's
planning-only selection. This does not authorize spending, provisioning,
deployment or rehearsal.

## 1. Purpose and evidence boundary

If separately approved after all blockers below close, rehearse this isolated
sequence with the two already-pinned images:

1. Current-image baseline: `7eb0724c730ac5c6be545d4f30d24ce1f1d4a7cd`,
   `sha256:85f535354fdf7cadd4d729e6fae3341f0c861b040ae2237f6578234590d6cca9`.
2. Prior-image candidate: `c1aece8f4b73a38230408709951d72a2a0a8d74b`,
   `sha256:c424aad744e3ae7e806874c1fe23ff5319a11e930b4a4458269dcb54f4304728`.
3. Return to the exact current digest above.

Only the dedicated synthetic test application/database may change. No
production resources, credentials, data, traffic, DNS, role assignments or
settings may be touched. A run that cannot establish these exclusions stops
before starting an image.

The planned window remains October 28, 2026 09:00-11:00 America/Phoenix
(16:00-18:00 UTC), including cleanup. It is proposed, not confirmed executable.
October 29 is the governance review, not an execution window. Freddie's prior
reviews remain historical evidence. Per Cody's latest direction, any future
independent reviewer is **unassigned**; no new independent acceptance is
implied.

## 2. Source-grounded findings that constrain the test

The following behavior was checked in both exact Git commits in section 1.
The current local checkout is a different revision
(`review/pr47-exact-baseline`, HEAD `87b6cd83507b4a72fe3b12473c07d17c0b7480ac`);
it is not itself proof of the bytes in either image. At both pinned commits,
the traced API, audit logger, DB client/schema, passport, support-ticket
handler/schema, and key registry files are byte-identical.

- `POST /v1/command` API-key authenticates the request, then the API signs a
  command passport with `SENTINEL_HMAC_SECRET`; the execution guard verifies
  it in-process. That signed passport is not included in the receipt lookup
  response or persisted as part of the receipt row.
- `support.ticket.create` validates a ticket payload, constructs an in-memory
  synthetic ticket and a workflow receipt, then returns both. It does not call
  an external ticket provider in the inspected handler. This is the proposed
  fixture command, subject to the same-deny network tests and isolated
  test-only API key.
- The receipt builder sets `verified: true`; the receipt has no cryptographic
  signature field. The flag is not proof of a signature. Policy decision
  HMACs, if present, are a separate object and do not sign the receipt.
- `auditLogger.log` inserts the command result into `audit_logs`. Its DB-write
  failure handler records an in-memory failure entry but does not fail the
  command response. Therefore an HTTP success and in-process receipt lookup
  are insufficient evidence of persistence.
- The persisted audit row contains the actor but not the API key ID, principal
  role/scopes, or signed execution passport. A receipt/audit-row read alone
  cannot prove which authorization context issued the command. Preserve
  attributable test-key metadata separately, without revealing its secret;
  if the acceptance criterion requires role/scope to be bound to the receipt,
  this is a second blocker.
- `GET /v1/receipts/:receiptId` is tenant-scoped and requires `receipt:read`.
  It checks process memory first and only then queries PostgreSQL. A lookup
  made after confirmed process replacement must return `source: "database"`;
  `source: "memory"` is an automatic test failure.
- `/health` reports database configuration status; `/ready` evaluates
  readiness, but neither alone proves a successful database write/read. Require
  the post-replacement receipt lookup plus an independent read-only row check
  scoped by the generated receipt ID and synthetic tenant.
- The schema bootstrap executes the bundled `schema.sql`. No migration or
  destructive restore is part of this rehearsal. Each image must use the same
  newly created, isolated database and synthetic fixtures.

**Cryptographic receipt and authority blockers:** Cody's disposition is to
retain both requirements as acceptance blockers and plan remediation before
claiming a PASS. The remediation design is
[2026-10-24_GOV006_SIGNED_RECEIPT_REMEDIATION_DESIGN.md](2026-10-24_GOV006_SIGNED_RECEIPT_REMEDIATION_DESIGN.md).
The pinned application does not provide a cryptographically signed receipt or
persisted key ID/role/scope binding. An in-process passport test would verify a
different object and must not be represented as receipt-signature proof.

An isolated rehearsal may characterize existing behavior only if separately
authorized. Any narrower report must state **receipt signature: NOT MET** and
**persisted authority binding: NOT MET**, with no production waiver. A
remediated image requires a new immutable digest and its own review.

## 3. Required admission package — all must be closed first

The operator checks and records every item before resource creation or image
startup:

1. Attributable, time-bounded execution approval naming the packet version/hash,
   operator, approver and authority basis, exact operation, expiry and criteria.
   Cody's design selection is not this approval.
2. Approved total-cost ceiling, quantity assumptions, monitoring/stop
   mechanism, billing buffer and exact cleanup deadline. The currently modeled
   four-hour ACA cost is $15.54 with 20% contingency; the one-month
   storage/database/backup sensitivity is $26.42. Neither is a guaranteed cap.
   No budget alert alone is a hard stop.
3. Complete approved ACA/VNet/firewall/PostgreSQL/test-client architecture,
   exact subscription and resource IDs, CIDRs/subnets/route table, private
   DNS, ingress source, identity, database name/SKU, region/capacity check,
   source and destination egress rules, logging and evidence path.
4. Proven production denial, including production ACR/blob/auth dependencies
   and metadata endpoints. The existing production ACR is Basic, public-network
   enabled, with no dedicated data endpoint. No broad blob exception, shared
   registry role assignment, production credential, peering or fallback
   allow-rule is permitted without an explicit scope decision.
5. Separate test-only database, generated test-only API key with the minimum
   required `support:write` and `receipt:read` scopes, and generated
   `SENTINEL_HMAC_SECRET`. Record secret version/creation metadata only;
   never print or export values. Confirm no production key/configuration is
   present in the isolated app.
6. Image identity and artifact availability rechecked by digest; provenance
   evidence links each digest to the approved source commit. No mutable tag or
   rebuild substitution.
7. A reviewed answer to the cryptographic receipt blocker in section 2. Do not
   weaken or silently reinterpret the R2 acceptance criteria.
8. Startup/side-effect review for both images, approved ingress, egress deny
   tests, and exact ACA revision/traffic configuration. If isolation or
   candidate safety cannot be demonstrated, stop.
9. Exact-resource cleanup inventory and commands reviewed against IDs
   captured from the new isolated resource group. No wildcard or whole
   subscription/resource-group deletion.
10. A feasible setup and teardown schedule. Thirty minutes for firewall,
    environment, DB, policy and test-client setup is unproven; pre-staging
    needs a separately approved scope, window and cost.

Any missing item means **NO-GO**. No placeholder command may be run against a
subscription until replaced with reviewed exact IDs and the approval record.

## 4. Proposed isolated fixture and decision-safe command

Subject to approved identities and policy, use one synthetic support ticket,
not a loan application, deal, payment, customer case or refund. Example body:

```json
{
  "tenant": "support",
  "command": "support.ticket.create",
  "payload": {
    "customerId": "synthetic-gov006-customer-001",
    "channel": "internal",
    "subject": "Synthetic GOV-006 receipt durability probe",
    "description": "Test-only; no customer or financial data."
  }
}
```

The example is not an authorization to execute. The test key tenant must be
`support`; its principal needs only the scopes needed to create this synthetic
ticket and read its receipt. Do not use a platform-admin or production key.
Generate one unique fixture ID per approved run. Capture the response's
`receipt.receiptId` and ticket ID; redact any key/header material.

If the policy rejects this command, an app requires external integration, or
the handler differs in the approved digest, stop. Do not substitute a refund,
deal, payment, approval or other write without separate review.

## 5. Stage procedure and pass/fail evidence

All time limits are measured from the attributable operation event. Capture
UTC timestamps and operator identity. Preserve failed results.

### Stage 0 — isolate and validate target

- Verify signed approval, window, current budget forecast and cleanup time.
- Enumerate subscription, resource group and every target resource ID.
  Assert no target ID equals or descends from production
  `rg-nc-dev-sentinel`, `ca-nc-dev-sentinel`, `cae-nc-dev-sentinel`,
  `psql-nc-dev-sentinel` or the production registry.
- Capture network/routing/identity/ingress/egress configuration. From the test
  subnet, verify approved test connectivity and denied production, internet,
  metadata, peer-VNet and unapproved Azure-service paths. If any deny is
  uncertain or test evidence cannot be exported, **NO-GO**.
- Verify DB is a new isolated server/database with no restored/imported
  production data and approved schema version. Verify only generated test
  credentials are present.

### Stage 1 — current-image baseline

- Deploy only the pinned current image by immutable digest to the isolated ACA
  app. Maximum one serving replica; only approved test-client ingress.
- Verify control-plane app/revision/image digest and observed replica identity
  agree. Capture revision state, replica count and test-only traffic.
- Within 600 seconds, require `/health` HTTP 200 and `/ready` HTTP 200 with
  `ready: true`, database enabled, and required governance checks passing.
  Repeat the health/ready pair three times, at least 10 seconds apart.
- Verify a database connectivity/write-read using the dedicated test database;
  readiness fields alone do not establish persistence.
- Submit the synthetic fixture once. Require success, one receipt ID, tenant
  `support`, test actor, and no payment/refund/deal/approval or external effect.
- Immediately retrieve it with the same key/tenant and record `source`. The
  pre-replacement response may be memory-backed; label it baseline only.
- Save redacted request/response, DB row identifier/fields, event times and
  image/revision evidence. If any baseline check fails, stop; do not test the
  candidate.

### Stage 2 — current to prior candidate

- Record start time; change only the isolated app to the pinned prior digest.
  Do not alter DB, schema, credentials, identity, routing policy or fixture.
- Within 600 seconds, verify actual active revision/replica image digest equals
  the pinned prior digest and no old current replica can serve the test route.
- Require the same three health/ready pairs and DB checks as Stage 1.
- Retrieve the exact baseline receipt ID with the same tenant. Record
  source; this may still be memory-backed if the same process served the read,
  so it is not yet durability proof.
- Run only approved canonical and regression characterization with synthetic
  non-executable payloads, using the existing offline exact-source probe or an
  approved validation-only harness that cannot dispatch commands. Do not send
  contradictory commands or malformed execution inputs to `/v1/command`.
  Preserve expected/actual results separately for candidate and current.

### Stage 3 — process replacement and durable receipt test

- Force a **test-only** ACA process/revision replacement using the approved
  operation, keeping the same isolated PostgreSQL server/database and never
  reusing the prior process. Record old replica stop/replacement and new replica
  identity. A simple read on the same process does not meet this step.
- Within 600 seconds, require three health/ready pairs, at least 10 seconds
  apart, and the independent DB query.
- Retrieve the original receipt ID after replacement. **Pass only if**
  response is successful, `source` is exactly `database`, receipt ID and
  canonical receipt fields match baseline, tenant remains `support`, and
  database row has the same test actor/command/tenant/result. Require an
  independently attributable record of the test principal's approved
  key ID/role/scopes; the row itself does not persist them. Require independent
  DB read scoped to this receipt and tenant; do not alter the row.
- Verify the cryptographic requirement only under the approved disposition
  from section 2. The current receipt's `verified: true` is not a passing
  signature result.
- Repeating /ready, re-creating the fixture, finding it in memory, or relying
  on an audit `verified`/`status` flag is **FAIL** for durability/signature.

### Stage 4 — return to current image

- Record transition start; change only the isolated app back to the pinned
  current digest. Preserve the same DB, row and fixture.
- Within 600 seconds, verify actual serving image/revision, no prior replica
  serving, the same three health/ready pairs and DB connectivity.
- Retrieve the original receipt ID. Require `source: "database"`, same receipt
  and tenant/actor metadata, separate attributable test-principal authority
  evidence, and the approved signature result.
- Run only the approved harmless synthetic behavior and denied-access checks.
  Record all differences from baseline. Any unexpected write, cross-tenant
  exposure, unauthorized action or identity mismatch is **FAIL**.

### Stage 5 — evidence and exact cleanup

- Stop workload/test requests. Export redacted evidence and manifest to the
  approved isolated evidence destination; hash files and verify archive
  integrity before deletion.
- Compare live resource inventory to the approved allowlist. Delete only the
  exact approved test resources and child resources, individually by full ID.
  Do not remove shared ACR permissions/resources, subscription objects, or
  production resources.
- Capture deletion operation IDs/results, then re-enumerate the resource group
  and subscription for residual target resources. A failed export or deletion
  is escalated; retain only within the approved bounded exception and record
  owner/deadline/cost. Do not extend the window silently.
- Reconcile actual meter usage and remaining resources against the approved
  ceiling. Close the run as PASS only if all gates pass; otherwise classify
  the exact failed criteria and keep GOV-006 HOLD.

## 6. Global abort criteria

Abort immediately for wrong subscription/resource ID, wrong image digest,
unknown egress, production dependency or secret, production write/traffic
change, test data outside synthetic scope, expired approval, cost/forecast
breach, unavailable evidence export, health/readiness timeout, DB failure,
receipt mismatch, `source != "database"` after replacement, missing authority
evidence, signature failure/unavailable criterion, unexpected side effect,
cross-tenant disclosure, inability to confirm the prior process stopped, or
cleanup failure.

After abort, make no additional image transition unless the signed recovery
scope permits returning the isolated app to the pinned current digest. Preserve
the failing environment/evidence as explicitly authorized; do not broaden scope
or delete evidence to recover a PASS.

## 7. Open approval decisions

1. Approve the signed receipt contract, signer/key custody, and versioned
   migration in the remediation design before code work begins.
2. Is `support.ticket.create` approved as the sole synthetic, non-financial
   fixture command, with `support` as its isolated test tenant?
3. What resource, credential, registry-image-pull, network, evidence-export,
   cost and cleanup implementation closes the admission list?
4. Who is the newly assigned independent reviewer? No future reviewer is
   currently assigned. Historical Freddie findings remain preserved and are
   not erased or renewed.
5. Is the schedule feasible, including setup, transition, evidence, cleanup
   and contingency? If not, submit a revised window before approval.

Until these decisions are attributable and every admission item is closed,
this remains a **procedure review draft**, not an executable rollback plan.
GOV-006 stays Verification / Technical HOLD; GOV-001 Conditional; GOV-002
HOLD. No reviewer acceptance, deployment authorization, rollback or runtime
change is claimed.

## 8. Source map

The implementation observations refer to the two pinned Git revisions, not a
claim about a live serving replica:

- `apps/api/server.js`: `buildWorkflowReceipt`, `/health`, `/ready`,
  `/v1/receipts/:receiptId`, `/v1/command`.
- `apps/sentinel/src/audit/auditLogger.js`: `log` and `getByReceiptId`.
- `apps/sentinel/src/db/client.js` and `apps/sentinel/src/db/schema.sql`.
- `apps/sentinel/src/governance/executionPassport.js` and
  `apps/sentinel/src/governance/executionGuard.js`.
- `apps/sentinel/src/commands/customeropsHandlers.js` and
  `apps/sentinel/src/schemas/customerops.js`.
- `apps/sentinel/src/security/keyRegistry.js`.
