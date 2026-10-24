# GOV-006 signed receipt and authority-binding remediation design

**Prepared:** October 24, 2026
**Status:** Design decisions recorded; remediation code is being implemented in
the current worktree. This is not deployment approval or execution authority.
**Disposition source:** Cody's explicit decision in this conversation.

## 1. Recorded disposition

Both pinned images lack a persisted cryptographic receipt signature and
sufficient persisted authority context. The API passport HMAC does not
establish durable receipt integrity. The approval criteria remain unmet.

Plan a versioned, cryptographically signed receipt that binds the record to its
tenant, actor, API key ID, effective role/scopes, authorization decision, and
timestamp without storing credentials. Verification must succeed after
database reload and process replacement, and reject tampering.

An isolated rehearsal may characterize existing behavior only if separately
authorized. It cannot satisfy the missing signature or authority criteria. Any
narrower rehearsal must explicitly report those criteria as **NOT MET**, with
no production waiver. A remediated image receives a new immutable digest and
its own review.

## 2. Current baseline and precise gap

The current `buildWorkflowReceipt` returns a `verified: true` flag but does not
add a cryptographic signature. `/v1/command` signs an execution passport
in-process with `SENTINEL_HMAC_SECRET`; the passport is not persisted with the
receipt. The audit row persists the actor and receipt-bearing result, but not
the API key ID, effective role/scopes, or signed passport. `GET
/v1/receipts/:receiptId` checks process memory before PostgreSQL and reports
the source; a post-replacement database result is necessary but does not by
itself authenticate the receipt.

These observations were checked in the exact source commits identified by the
current R2 packet. The related traced files in current and prior pinned commits
are identical. The worktree's current branch is not either pinned image and
must not be substituted as image provenance.

## 3. Versioned receipt contract

Create a versioned `sentinel-receipt/v1` signed document. The signature covers
the complete receipt payload, normalized authority, schema version, signature
algorithm and exact key-version identifier. Verification status is computed at
read time and is not part of the signature. The current implementation shape
is:

```json
{
  "receiptId": "generated-unique-id",
  "tenantId": "resolved-tenant",
  "command": "authorized-command",
  "entity": {},
  "outcome": {},
  "timestamp": "UTC ISO-8601 timestamp",
  "schemaVersion": "sentinel-receipt/v1",
  "authority": {
    "actor": "resolved-principal-actor",
    "apiKeyId": "resolved-key-id",
    "effectiveRole": "resolved-role",
    "effectiveScopes": ["sorted", "unique", "resolved-scopes"],
    "decision": {
      "decisionId": "stable-authorization-decision-id",
      "result": "allow",
      "policyVersion": "policy-version-or-content-hash",
      "requiredScope": "scope-used-for-this-action",
      "decidedAt": "UTC ISO-8601 timestamp"
    }
  },
  "signature": {
    "algorithm": "ES256",
    "keyId": "versioned Azure Key Vault key identifier",
    "value": "base64-signature-bytes"
  }
}
```

The receipt preserves operation-specific fields from existing handlers; all
preserved fields are included in the canonical signed payload. The v1 schema
still needs a separate compatibility review before release, including required
versus nullable fields, identifier/timestamp constraints, scope and payload
limits, and unknown-field policy.

### Trust and signing rules

- Derive `tenant`, `actor`, `apiKeyId`, role and scopes from the validated
  server-side principal and the effective authorization decision. Never trust
  request body, metadata, receipt input or client claims for those values.
- Do not include API keys, passwords, HMAC secrets, private-key material or
  other credentials in the receipt or evidence.
- Resolve and record the actual policy decision that permitted the operation.
  Do not infer `allow` from a handler's success, a receipt `verified` flag, or
  a caller-supplied field.
- Define a deterministic canonical representation of every signed field,
  including explicit nulls, Unicode handling, number representation, array
  ordering and duplicate-scope rejection. Sign with explicit domain separation
  for `SentinelOS receipt v1`; algorithm and key version are themselves
  covered. No generic `JSON.stringify` ordering assumption.
- Use a dedicated, non-exportable Azure Key Vault EC P-256 key, separate from
  execution-passport and decision-signing keys. The writer is configured with
  `SENTINEL_RECEIPT_KEY_ID`, an exact versioned key identifier, and uses
  managed identity. Readiness signs and locally verifies a probe. Verification
  retrieves the exact recorded version from the same vault/key name so
  retained receipts can still be verified after rotation. Production key
  creation, access assignment, rotation, revocation and availability are not
  performed by this code change. Never store the private signing key in the
  database or commit it.
- Store the exact schema version, algorithm, key ID, canonical payload and
  signature. Keep signed payload immutable; corrections/revocations create a
  separately signed event referencing the original receipt.
- A `verified` result is computed by a verifier at read time; it is not a
  trusted persisted assertion. Legacy unsigned records are labeled
  `unsigned_legacy` / verification `not_verified`, never upgraded to PASS by
  migration.

The selected algorithm is ES256 (P-256 / SHA-256) with IEEE P1363 signature
bytes. The contract must not silently fall back to unsigned receipts or a
different key/algorithm.

## 4. Persistence and API design requirements

1. Add an additive schema migration for durable receipt records keyed by
   unique `receipt_id` and tenant, and a tenant-scoped command execution
   journal. Persist the versioned signed payload, signature metadata,
   authority, completion result and timestamps. No production migration is
   authorized here.
2. Store a signed receipt only after successful authorization and only for the
   operation outcome defined as receipt-eligible. For operations with durable
   business writes, receipt creation and relevant operation state must share a
   transaction or use an explicit transactional-outbox/idempotency design so
   success cannot be reported without durable evidence.
3. Make audit/receipt persistence errors explicit. Do not return an
   execution-success response if durable signed-receipt persistence failed.
   Define idempotent retry/reconciliation semantics without duplicating the
   business action.
4. Make receipt lookup verify the stored signature using the recorded
   version/key ID after each database read. Return the signed document and a
   computed verification result, including a clear error/status for missing
   key, unsupported version, malformed record, signature mismatch or
   revocation. Do not fall back to process memory for a durability acceptance
   test.
5. Keep tenant authorization on reads. Reject an unauthorized tenant query
   without revealing whether another tenant's receipt exists.
6. Keep old API responses and old unsigned receipts distinguishable during
   migration. Compatibility must be explicit; never synthesize signatures for
   old records or present old `verified: true` values as cryptographic results.
7. Include signer/key version and verification outcome in security-safe
   telemetry; never log key bytes, API credentials, full private data, or
   unredacted payload fields.
8. Require an explicit stable client idempotency key on every API route that
   dispatches a command. The durable journal must gate handler execution,
   replay completed results, reject payload conflicts, and block unresolved
   work. The legacy `/command` route may issue a signed `issued` receipt only;
   it must not claim that it executed the requested operation.

## 5. Required tests and acceptance criteria

The new implementation and new image must pass all of the following before
being considered for a new isolated rehearsal:

### Signature and integrity

- A valid v1 receipt verifies from the API response, a fresh database read,
  and a new process using only the approved verifier/key material.
- Mutating each signed field independently—receipt ID, tenant, command,
  entity/outcome, timestamp, actor, API key ID, role, any effective scope,
  authorization decision or policy version—causes verification failure.
- Altered signature bytes, wrong key ID, missing/unknown key, unsupported
  schema/algorithm, truncated/corrupt record, missing required field and
  malformed/non-canonical encoding fail closed with explicit errors.
- Legacy unsigned rows remain explicitly unverified and do not pass v1 tests.
- No verification path accepts the stored legacy `verified: true` flag as
  cryptographic evidence.

### Authority and tenant binding

- A caller cannot spoof actor, tenant, API key ID, role, scopes, authorization
  decision, issue time, key ID or signature by supplying request metadata.
- The persisted, signed authority tuple matches the server-resolved principal
  and effective allow decision, with only non-secret identifiers/context.
- A different tenant cannot read or verify the receipt through the public API.
  Cross-tenant lookup does not disclose the receipt's existence or content.
- Replayed, denied, expired, revoked or insufficient-scope commands do not
  produce a success-shaped signed execution receipt.

### Durability and process replacement

- One synthetic non-financial operation creates exactly one receipt ID.
- Record its response and authority tuple, stop/replace the process, then load
  the same ID from the isolated database. Require database provenance and
  cryptographic verification success after replacement.
- Verify a read-only database record matches the signed canonical payload and
  signature; no new receipt is created to stand in for the original.
- Repeat after current -> prior -> current only if the tested prior image can
  safely read/verify the v1 format. Otherwise report rollback compatibility as
  **NOT MET**. Never assume the legacy prior image can verify a new schema.
- Simulated persistence/signing failure must not produce a success result or
  an untracked side effect; retry must be idempotent.

### Build and supply-chain evidence

- Unit, API, migration/DB integration and process-replacement tests pass with
  synthetic fixtures. Negative tests assert failure, not just logs.
- Review generated SBOM/build provenance and bind each published immutable
  digest to source commit, schema version and test evidence.
- New source/image review is required. The old `7eb0724` and `c1aece8` digests
  remain historical and cannot be relabeled as containing this remediation.

## 6. Versioning and migration

- Deploy additive schema first only in an approved isolated environment. Do
  not mutate production or old evidence as part of this design task.
- New writer emits only valid v1 signed receipts. New reader handles valid v1
  and labels prior records as legacy/unverified.
- Verify database reload, rollback compatibility and key distribution before
  selecting the new image pair. If the prior image cannot safely understand the
  v1 record or schema, do not claim current -> prior -> current proves receipt
  continuity; select a compatible prior build or report criterion not met.
- Signing-key rotation retains public verification material for the entire
  retention period. Record key ID/version and rotation events; do not re-sign
  historical receipts with a new key.
- Define revocation semantics separately from signature validity: a valid
  signature proves integrity/authenticity under a key, not that an operation
  remains authorized or undisputed.

## 7. Sequenced work and decision gates

1. **Record design decisions:** ES256 and versioned Azure Key Vault signing
   are selected. Finalize schema, key lifecycle, privacy/retention and
   compatibility semantics before release.
2. **Implement in a separate code change:** receipt envelope, trusted authority
   binding, signing/verifying service, strict validation, additive persistence,
   explicit failure handling and API response behavior.
3. **Test:** unit/tampering, spoofing, tenant isolation, database reload,
   process replacement, failure/idempotency and legacy-reader behavior.
4. **Review new image:** produce new immutable digest/provenance and review the
   exact code/artifacts. Preserve the old digests and Freddie's completed
   review records as historical evidence.
5. **Re-plan isolated rehearsal:** update ACA network/image-pull design, exact
   resource identities, schedule, cost, migration setup, acceptance criteria,
   reviewer assignment and cleanup for the new image/schema pair.
6. **Separate approvals:** obtain deployment-plan approval, validation and
   attributable rehearsal execution approval. No approval carries forward
   automatically from the old R2 packet or this design.

An existing-image-only characterization can be separately approved, but its
report must state **receipt signature: NOT MET** and **persisted authority
binding: NOT MET**. It cannot clear GOV-006.

## 8. Current disposition

The code implementation is in progress in the current worktree. It includes
the signed receipt helpers and Key Vault adapter, additive schema/migration,
durable execution journal, dispatch/API integration, and legacy receipt
labeling. Focused unit tests cover signature integrity, retained key-version
lookup and journal transitions. A dedicated PostgreSQL integration check using
a disposable PostgreSQL 16 instance passed for concurrent duplicate claims,
payload/command conflicts, tenant scoping, signed receipt and authority
round-trip in a separate reader process, and fail-closed behavior after
simulated signing or persistence failure following handler start. This does not
verify the full HTTP API, Azure Key Vault/managed identity, a deployed image, or
production key configuration. No production resources, credentials, access
assignments or runtime were changed. The isolated procedure remains
non-executable until full remediation evidence and the other isolation, cost,
timing, reviewer and execution-approval conditions are closed.

**GOV-006 remains Verification / Technical HOLD.** GOV-001 remains Conditional;
GOV-002 remains HOLD. Historical Freddie findings remain preserved; a future
independent reviewer is unassigned.

## 9. Local follow-up test evidence

**Tested source baseline:** `8b18d39fb94e9606f35c2fba50c1030a9ae7c3e8`.
The follow-up commit adds the PostgreSQL integration runner and this test
record; it does not claim a deployed-image test.

Commands and recorded results:

| Command | Result |
| --- | --- |
| `pnpm test` | 133 passing |
| `pnpm exec mocha apps/sentinel/src/receipts/__tests__/signedReceipt.test.js apps/sentinel/src/db/__tests__/executionJournal.test.js apps/sentinel/src/audit/__tests__/auditLogger.test.js apps/sentinel/src/commands/__tests__/dispatch.test.js` | 13 passing |
| `pnpm run check:idempotency` | `Idempotency fail-closed check passed` |
| `pnpm run check:customerops` | Exit 0; durable journal unavailable requests were rejected |
| `pnpm run check:product-commands` | `Product command fail-closed check passed` |
| `pnpm run check:receipts` | `Receipt lookup check passed` |
| `SENTINEL_TEST_DATABASE_URL=<dedicated-disposable-PostgreSQL-URL> pnpm run check:execution-journal-postgres` | Passed against local PostgreSQL 16; test output recorded below |
| `node --check scripts/check-execution-journal-postgres.js`, `git diff --check`, `git diff HEAD^ --check` | Passed after removal of the five trailing-space lines from the two review documents |

PostgreSQL integration output:

```text
Disposable PostgreSQL test target: database=sentinel_it, server=16.15
PostgreSQL replacement-process read and signature verification passed
PostgreSQL journal concurrency, signed persistence, failure, and retry checks passed
```

The database server was a disposable local `postgres:16-alpine` container,
bound only to `127.0.0.1:15432`, with a synthetic `sentinel_it` database and
ephemeral test credentials. The runner created a uniquely named
`receipt_it_*` schema, applied `schema.sql` and the additive migration, and
dropped the schema in its cleanup. The container was stopped after the run.
The test used ephemeral ES256 keys and synthetic records; no production
database, Azure resource, Key Vault, managed identity, or credentials were
used. The command intentionally requires `SENTINEL_TEST_DATABASE_URL` and
refuses database names outside a test/integration naming pattern.

The journal-level PostgreSQL tests cover concurrent duplicate claims, one
handler-start, payload and command conflicts, tenant isolation, signed receipt
plus authority round-trip and verification in a separate Node process, and
signing/write failure after a synthetic side effect with subsequent
automatic-retry blocking. The complete authenticated HTTP flow is covered
separately below.

## 10. Authenticated HTTP and PostgreSQL integration

**Tested source:** baseline `9f5e2160102833304282c8a2c58a9feb8ff31056`
(including parent implementation `8b18d39fb94e9606f35c2fba50c1030a9ae7c3e8`)
plus the then-uncommitted HTTP runner, package-script registration, and evidence
updates. The baseline commit alone does not contain this HTTP coverage. The
follow-up commit containing these three files is the new review target;
review it together with its baseline and parent implementation.

Command:

```text
SENTINEL_TEST_DATABASE_URL=<dedicated-disposable-PostgreSQL-URL> pnpm run check:command-http-postgres
```

Recorded result against local PostgreSQL 16.15:

```text
Disposable PostgreSQL HTTP test target: database=sentinel_it, server=16.15
Authenticated HTTP execution, signed PostgreSQL receipt, duplicate/conflict, failure, and pre-handler authorization checks passed
```

This test starts the actual API server in a separate local process and calls
`POST /v1/command` with a synthetic API key, a test-only tenant handler, and
ephemeral ES256 keys. It verifies successful handler execution, signed receipt
and authority persistence, receipt signature verification against the stored
receipt, completed duplicate replay without a second handler effect,
concurrent duplicate requests, conflicting idempotency-key reuse, signing
failure after the synthetic handler effect, receipt-insert failure after the
effect, retry rejection in both failure cases, invalid API-key rejection,
and insufficient-scope denial before any handler effect.

The run used a disposable `postgres:16-alpine` container bound only to
`127.0.0.1:15433`, a synthetic `sentinel_it` database, and a uniquely named
`command_http_it_*` schema. The test confirmed the schema was dropped and
stopped the container. Signing was provided by an ephemeral local test key;
this does not verify Azure Key Vault or managed identity. No production
database, Azure resource, or live command handler was used.

This is local integration evidence, not deployed-image or rollout evidence.
Azure Key Vault/managed-identity verification, immutable-image provenance,
and independent review remain open. GOV-006 remains on HOLD.
