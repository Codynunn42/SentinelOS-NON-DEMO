# Rollback plan update - October 23, 2026

**Status recorded October 23, 2026:** October 23 rollback addendum - prepared
locally, documentation only; uncommitted and unpublished.

Local documentation preparation is complete. Publication and independent
review remain outstanding. Before publication, inspect the actual diff and
applicable workflow triggers. Freddie must review the exact published commit
or delivered document; this status entry does not establish delivery or review.

**Rollback readiness remains unverified. Runtime REJECT and GOV-006
Verification / Technical HOLD remain unchanged.**

## Purpose and boundary

Documentation-only addendum to the existing rollback plan. Cody requested that
the newly assembled evidence, administrative reconciliation, and proposed
changes be recorded as an update to that plan without changing or augmenting
runtime.

This addendum updates the review record, not the deployed baseline. It does
not execute a rollback, deploy an update, create a revision, restart a process,
shift traffic, change revision mode, alter configuration or data, grant access,
change repository settings, or authorize any of those actions. Initial preparation performed no live Azure
collection. The later read-only assessment below refreshed projected metadata
under Cody's selected scope; no runtime test or mutation was performed.

No application code, workflow, dependency, infrastructure, or runtime
configuration is changed by this update. No commit, push, merge, or workflow
dispatch is part of this work. A later publication must first account for any
deployment workflow triggered by a push or merge; documentation-only content
does not guarantee that publication has no runtime side effects.

**GOV-006 remains Verification / Technical HOLD; GOV-001 Conditional;
GOV-002 HOLD; ACT-019 In Progress.** The supplied independent runtime verdict
remains REJECT with A-D FAIL until a new attributable review is recorded.
This addendum is not independent review, executive acceptance, or a Sentinel
ACK receipt.

## Existing rollback work retained

| Record | Retained contribution |
| --- | --- |
| [Deployment recovery procedures](../../../docs/DEPLOYMENT_RECOVERY_PROCEDURES_2026-05-15.md) | Verify, classify, preserve evidence, obtain approval, recover, and verify results. Runtime identifiers in that record are historical. |
| [DEP1.3 rollback plan](../../../docs/DEP1_3_ROLLBACK_PLAN_2026-05-19.md) | Rollback options, pre-mutation snapshot, prerequisites, and stop conditions. |
| [DEP2.11 authority packet](../../../docs/DEP2_11_ROLLBACK_POST_DEPLOY_AUTHORITY_PACKET_2026-05-19.md) | Separate rollback and verification authority requirements. |
| [DEP3.15 authority packet](../../../docs/DEP3_15_ROLLBACK_EXECUTION_AUTHORITY_PACKET_2026-05-20.md) | Trigger policy and requirements for a bounded rollback window. |
| [October 22 remediation record, section 3](./2026-10-22_GOV006_RUNTIME_REMEDIATION_EVIDENCE.md#3-criterion-c--rollback-readiness) | Named candidate, recorded image digest, lineage assessment, procedure, and blocked rehearsal. |

These source records retain their original dates, findings, and authority
limits. This addendum does not rewrite an earlier failed handoff or turn a
planned procedure into a completed rehearsal.

## Recorded baseline and candidate

The following values are carried forward from the October 22 record, not
freshly verified live facts or approved execution inputs:

| Field | Recorded value |
| --- | --- |
| Application / resource group | `ca-nc-dev-sentinel` / `rg-nc-dev-sentinel` |
| Revision under runtime review | `ca-nc-dev-sentinel--sha-7eb0724-61-1` |
| Configured source/image tag | `7eb0724c730ac5c6be545d4f30d24ce1f1d4a7cd` |
| Registry digest for that tag | `sha256:85f535354fdf7cadd4d729e6fae3341f0c861b040ae2237f6578234590d6cca9` |
| Rollback candidate | `ca-nc-dev-sentinel--sha-c1aece8-60-1` |
| Candidate image digest | `sha256:c424aad744e3ae7e806874c1fe23ff5319a11e930b4a4458269dcb54f4304728` |
| Compatibility assessment | October 22 collector reported an ancestor relationship and five intervening commits limited to validation code and its test, with no schema, migration, dependency, or configuration changes. Not a successful rollback test. |
| Revision mode / rehearsal | Single mode recorded; zero-traffic rehearsal not executed because its no-traffic-shift boundary could not be guaranteed. |

Registry correlation is not provider-attested running-image identity. A
retained revision is not automatically a verified safe baseline. Deploying
the prior digest as a new revision would still be a runtime change; it is
not authorized by calling this document an update.

## Changes incorporated into the review record

| Item | Status and evidence boundary | Remaining action |
| --- | --- | --- |
| Rollback planning | Existing plans and October candidate/procedure located in repository records. | Reuse them rather than restart planning; refresh inputs before any separately authorized execution. |
| PR #46 documentation review | Supplied review records ACCEPT with follow-up at `28dafebd9442060b21d93eda12a86ae21da8d5eb`, separate from runtime assurance. | Preserve exact-head scope; acceptance does not transfer to later edits or this addendum. |
| Cody's Section B | [Completed record](./2026-10-22_PR46_SECTION_B_GOVERNANCE.md) exists for that documentation head. | Preserve it; no duplicate signature created here. |
| Latest materials transmission | Cody reported sending the readable materials on October 23. The supplied reconciliation report identifies a 3:36 PM inline email and evidence-branch reference; email was not inspected for this addendum. | Record the actual sent file/content list and message reference; obtain Freddie's acknowledgment and access confirmation. Do not mark the complete raw packet delivered. |
| October 29 review | Supplied reconciliation report says 8:30-9:30 AM Arizona time is scheduled. Calendar not inspected here. | Confirm Freddie's attendance or written report-back; do not create a duplicate event from this record. |
| ACT-015 premise | Supplied reconciliation report says PRs #24/#25 are merged, making draft selection outdated. PR state and implementation not rechecked here. | Propose acceptance-evidence reconciliation through the required register-update route; no live-register write or GOV-007 closure here. |
| PR #47 | Supplied record retains REJECT at `3a0214dd64fd5607b7121c5ec62b396e06c2c2c0`. | Resolve findings and identify a new full head for renewed review; new SHA alone is not acceptance. |

## Proposed technical changes are not deployed changes

The [October 22 record](./2026-10-22_GOV006_RUNTIME_REMEDIATION_EVIDENCE.md)
references proposed workflow commit
`a28b89ddfe40ad27726462d4125f99691d5adea9` for digest pinning, `GIT_SHA`
provenance, and a production environment reference. Its present merge,
deployment, and environment-enforcement status was not rechecked here.
The record's reported tests are historical results, not tests run for this
addendum.

Heartbeat scheduling, persistent ledgers, database-backed audit reads/hash
continuity, storage mounts, and database resilience options remain proposals
or findings in that record. None is implemented, configured, deployed, or
certified by this documentation update. None is assumed to exist in the
rollback candidate.

## Open evidence and authority requirements

Cody remains the accountable collector/coordinator in the supplied records;
Freddie remains the independent reviewer. Operator identity and execution
authority must be recorded separately for any later test.

| Criterion | Current gap | Next evidence or decision needed |
| --- | --- | --- |
| A - Image identity | Correlation available; direct running-digest attestation missing. | Freddie's criterion-specific assessment and acceptable proof; fresh attributable capture if separately arranged. |
| B - Durability/recovery | No demonstrated same-receipt lifecycle persistence. | Prepare a bounded same-receipt before/after process-replacement test covering database retrieval, signature verification, tenant, and authority fields. Test environment, data, operator, authorization, cleanup, and stop conditions remain undecided. No test executed here. |
| C - Rollback readiness | Candidate and procedure recorded; rehearsal verification deferred. | Refresh candidate availability, compatibility, configuration, and recovery inputs; select an explicitly authorized test/traffic boundary. An isolated test must not silently reuse the production database. |
| D - Deployment governance | Attributable historical authorization and enforced human-gate evidence unresolved. | Locate the applicable authorization and enforcement records. An unsuccessful bounded search does not prove absence; future approval cannot be backdated to authorize the historical deploy. |
| Packet provenance | Reconstructed materials are incomplete; supporting source ZIP and original v2 raw captures were not supplied in this handoff. | Recover the originals with timestamps/manifests or explicitly record unavailability. Any new collection must be dated as new, not reconstructed as original raw evidence. |

Missing packet named in the records:
`SentinelOS_Runtime_Review_2026-10-22_v2_INCOMPLETE.zip`.
Sending readable documents, publishing a branch, confirming access, and
receiving a new verdict are distinct events.

## Completion of this update versus future execution

This update is complete as a documentation reconciliation when the existing
rollback work, newly reported administrative status, proposed changes, and
remaining gaps are recorded without altering runtime. It does not close the
runtime criteria.

Before any future rollback or update can execute, a separate decision must
identify the exact target and refreshed snapshot, reviewed change set,
image/configuration/data compatibility, named approver and operator,
bounded window, traffic and database impact, stop/recovery conditions, and
post-change evidence requirements. A successful technical review would not
itself change a governance gate.

## Read-only readiness assessment - October 23 follow-up

**Assessment status: read-only preflight completed; execution readiness NOT
established.** Cody selected read-only checks, retaining the prohibition on
runtime changes. This is collector evidence, not Freddie's independent verdict.

Azure capture requests began at 23:11:45, 23:12:06, 23:12:16, and 23:12:33 UTC
on October 23, 2026. Azure CLI identity:
`codynunn.azure@gmail.com`; subscription:
`82bd72d4-00ef-400d-839b-e168e980c510`. Tool calls completed successfully.
The Container Apps MCP read-only list also confirmed the app exists in
`rg-nc-dev-sentinel` with provisioning state Succeeded.

### Fresh evidence

| Check | Observation | Meaning / limitation |
| --- | --- | --- |
| Serving revision | `ca-nc-dev-sentinel--sha-7eb0724-61-1`: active, Running, Healthy, Provisioned, one replica, traffic weight 100. Latest and latest-ready match. | Point-in-time platform metadata, not business-function or durability proof. |
| Revision/traffic mode | Single; ingress uses latest revision at weight 100. | No zero-traffic activation was attempted or authorized. |
| Retained candidate | `ca-nc-dev-sentinel--sha-c1aece8-60-1`: inactive, Stopped, zero replicas, traffic weight 0; retained metadata says Healthy / Provisioned. | Candidate still exists, but retained Healthy is NOT a fresh startup or rehearsal result. |
| Candidate artifact | Candidate digest `sha256:c424aad744e3ae7e806874c1fe23ff5319a11e930b4a4458269dcb54f4304728` exists in ACR; retained revision's tag `c1aece8f4b73a38230408709951d72a2a0a8d74b` resolves to it. | Registry metadata only; image was not pulled or started. Tag and digest metadata permit write/delete; no retention lock established. |
| Current registry identity | Current revision's configured `7eb0724c730ac5c6be545d4f30d24ce1f1d4a7cd` tag still resolves to `sha256:85f535354fdf7cadd4d729e6fae3341f0c861b040ae2237f6578234590d6cca9`. | Does not establish the running-replica digest. |
| Configuration shape | Exact-revision projections match for environment names/secret references, probes, mounts, volumes, and scale. Both have no volumes/mounts, min 1 / max 2, and `/health` probes on port 3000. | Environment VALUES, secret contents, external dependencies, and runtime behavior were not compared. |
| Secret-reference names | Every candidate environment secret reference is present in app secret-name metadata. | Names only. No listSecrets call or secret-value retrieval; presence is not credential validity. |
| Source lineage | Local Git confirms `c1aece8` is an ancestor of `7eb0724`, with five intervening commits and two changed paths: validation implementation and its test. | No migration/schema/dependency/config file changes in this source delta; live database compatibility remains unverified. |
| Behavioral delta | PR #44 adds command normalization/bare-command support and validation/cross-validation changes. | Rolling back removes these changes. This regression trade-off requires review even without a schema delta. |
| Publication trigger | Checked-out `.github/workflows/deploy.yml` triggers on pushes to `main` with no documentation-path exclusion; deploy job requires the main ref. Executive Desk deployment is manually dispatched in its separate workflow. | Local workflow inspection only, not a certification of remote branch policy/settings. No push, merge, dispatch, build, or deployment performed. |

### Readiness checklist and handoff

| Requirement | Status after this pass | What remains before execution readiness |
| --- | --- | --- |
| Plan and named candidate | Prepared; candidate existence refreshed | Preserve exact target and refresh again before a future execution window. |
| Registry artifact availability | Confirmed by read-only registry metadata | Preserve artifact availability under approved retention controls if needed; changing those controls is outside this scope. |
| Source and configuration comparison | Bounded comparison completed | Review loss of PR #44 behavior and establish actual database/external-dependency compatibility. |
| Safe test boundary | Not selected / not authorized | Decide isolated rehearsal versus production scope, including database isolation, traffic impact, cost, and cleanup. |
| Operator, approver, window | Not established for execution | Name operator and authorized approver; document bounded scope and expiration. Read-only approval is not execution approval. |
| Recovery from failed rollback | Not tested | Identify return-to-current procedure and evidence/stop thresholds under the same approved window. |
| Candidate startup and functional verification | Not performed | Verify readiness, expected command contracts and rejection behavior, tenant/authority boundaries, and audit/receipt behavior in an approved test environment. |
| Durability / recovery | Not tested | Same receipt before and after approved process replacement, including database retrieval, signature, tenant, and authority evidence. |
| Rehearsal result and independent review | Not available | Preserve timed command/results and have Freddie review the exact evidence set; no PASS inferred from this preflight. |

### Evidence files and reproducibility boundary

Fresh projected JSON captures are saved in the session's persistent files area,
not committed or published with this addendum. A local handoff archive
`rollback-readonly-evidence-2026-10-23.zip` contains:

- `rollback-readonly-app-2026-10-23.json`
- `rollback-readonly-revisions-2026-10-23.json`
- `rollback-readonly-candidate-image-2026-10-23.json`
- `rollback-readonly-candidate-tag-2026-10-23.json`
- `rollback-readonly-current-image-2026-10-23.json`
- `rollback-readonly-candidate-config-2026-10-23.json`
- `rollback-readonly-current-config-2026-10-23.json`
- `rollback-readonly-secret-names-2026-10-23.json`
- `rollback-readonly-summary-2026-10-23.json`
- `rollback-readonly-2026-10-23.sha256`
- A snapshot of this addendum as `rollback-readiness-assessment.md`.

Collection used explicit subscription/resource-group/app identifiers:
`az containerapp show`, `az containerapp revision list --all`,
`az containerapp revision show`, and `az acr repository show` with projections
restricted to the metadata described above. The source comparison used
`git merge-base --is-ancestor`, `git log`, and `git diff` on the two named
commits. The summary records capture-start times, identity, source-delta
commits, comparison results, and limitations; it is not a full per-command
start/end receipt log.

Checksums cover the nine JSON files. They establish integrity of these saved
projections, not provider signatures, evidence completeness, receipt by
Freddie, or the original October 22 raw-capture manifest. No new claim is made
that the missing v2 bundle has been recovered.

**Carry-forward:** no runtime changes, rollback, rehearsal, new independent
acceptance, gate change, or Sentinel ACK occurred. Runtime REJECT and GOV-006
Verification / Technical HOLD remain unchanged.
