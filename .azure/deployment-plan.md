# Rollback readiness assessment

Status: Planning/documentation only; not approved for deployment

## Key Vault / managed-identity verification planning

Status: Draft prepared for review; resource creation, spending, access changes,
test execution, rehearsal and deployment are not authorized.

Prepare a documentation-only verification plan against review target
`36e690649a070f3f1b2fa4b77ea696528d369f7d`, including its implementation
ancestry. The documentation-only deliverable is
[the Key Vault / managed-identity verification plan](../apps/executive-desk/cadence/2026-10-24_GOV006_KEY_VAULT_MI_VERIFICATION_PLAN.md).
It records proposed resources, custom read/sign and read-only roles,
private-endpoint isolation, acceptance/failure tests, costs and cleanup.

Cody confirmed the prior subscription
`82bd72d4-00ef-400d-839b-e168e980c510`, `eastus2`, and Standard software EC
P-256 for pricing/planning only. Read-only checks found the subscription
accessible, Key Vault registered with region support, the proposed test
group absent and proposed vault name available. These are not write-access,
quota/capacity, complete resource-availability or execution approvals.

The combined four-hour planning estimate is approximately USD 16.71,
including prior option-A dependencies and this plan's USD 1.17 rounded-up
increment with contingency. Prior dependency rates/allowances still require
execution-stage repricing and closure; storage-retention sensitivity reaches
approximately USD 27.59, above the still-proposed USD 25 ceiling.

Network allocation/image delivery, effective privileges, capacity, reviewed
Azure harness, immutable image/provenance, independent reviewer and separate
execution/cleanup authorization remain unresolved. No new application code,
infrastructure templates or executable deployment/cleanup commands were
generated. No resources, keys or permissions were created/changed. Do not
advance to Ready for Validation or execution. Historical assessment follows.

## Scope

Cody selected read-only rollback readiness checks on October 23, 2026.
This is not application preparation, infrastructure generation, or deployment
approval. No resources, runtime, traffic, data, settings, or workflows may be
modified. Do not advance this plan to deployment validation or execution.

## Assessment steps

1. Inspect existing rollback records and publication triggers.
2. Attempt bounded read-only inspection of the recorded app, revisions, and
   registry artifact using available authenticated tools. Do not retrieve
   secrets, credentials, or environment values.
3. Record observed facts, capture times, access blockers, and unresolved
   prerequisites in the rollback addendum.

## Assessment result

Read-only assessment completed October 23, 2026. Candidate revision and ACR
artifact existence, tag/digest correspondence, value-free configuration
shape, secret-reference name presence, and local source ancestry were checked.
Results and execution blockers are recorded in
`apps/executive-desk/cadence/2026-10-23_ROLLBACK_PLAN_UPDATE_REVIEW_ONLY.md`.
No rehearsal, startup test, database compatibility proof, or independent
acceptance was established. This plan is not Validated or deployment-approved.

## Completion boundary

Read-only evidence can establish candidate availability and identify gaps.
It cannot prove a rollback rehearsal, recovery, independent acceptance, or
deployment authorization. Runtime REJECT and existing gate positions remain
unchanged. No deployment artifacts or commands are to be generated or run.

## October 24 approval-request preparation

Cody selected an isolated rehearsal proposal, with Cody Nunn as proposed
operator. R2 records Cody as designated business approver/authority, a proposed
October 28 09:00-11:00 America/Phoenix window, proposed USD 25 ceiling, and
synthetic-only/test-only restrictions. Cost, isolation implementation,
exact execution scope and approval remain unresolved. Only documentation and offline synthetic
exact-source characterization are prepared; the original read-only results
remain historical evidence.

Approval request:
`apps/executive-desk/cadence/2026-10-24_ISOLATED_ROLLBACK_REHEARSAL_APPROVAL_REQUEST.md`.

Status remains unapproved and not Validated. No infrastructure, executable
deployment procedure, production change, or isolated runtime execution is
authorized. The request must resolve its explicit preconditions and receive
the applicable approvals before preparation/validation/deployment can advance.

## October 24 isolation comparison

Cody requested pricing of both a production-like ACA design and a narrower
isolated-VM rehearsal. The comparison is recorded in
`apps/executive-desk/cadence/2026-10-24_ROLLBACK_ISOLATION_DESIGN_COMPARISON.md`.
Four-hour retail planning estimates including 20% contingency are USD 15.54
for ACA and USD 2.85 for the VM, with explicit unverified miscellaneous
allowances and unvalidated implementation assumptions. An ACA one-month
disk/database/backup reserve sensitivity reaches USD 26.42, above the proposed
USD 25 ceiling. No approved spending ceiling is inferred.

Cody subsequently selected option A, Azure Container Apps, in a planning-only
decision form. Record this as authority for further design, not approval of a
complete deployment plan, provisioning, spending or rehearsal execution.

Recommend developing ACA for platform rollback evidence. The VM can only
provide narrower image/data characterization. Shared Basic ACR image access,
production egress isolation, exact implementation, complete pricing, timing and
the executable receipt/signature procedure remain blockers. No infrastructure
code or executable deployment procedure has been generated. Status remains
unapproved, not Ready for Validation, not Validated and not authorized to deploy.

## October 24 procedure review

Created
`apps/executive-desk/cadence/2026-10-24_GOV006_ISOLATED_REHEARSAL_PROCEDURE_DRAFT.md`
as a documentation-only review draft grounded in the pinned source commits.
The persisted workflow receipt has a `verified` flag but no cryptographic
signature field; the command passport HMAC is checked in-process and is not
persisted with the receipt. The audit row records the actor but not API key ID,
role/scopes or signed passport.

Cody's disposition is to retain signature and persisted-authority requirements
as acceptance blockers and plan remediation before any PASS. The
documentation-only design is
`apps/executive-desk/cadence/2026-10-24_GOV006_SIGNED_RECEIPT_REMEDIATION_DESIGN.md`.
An old-image-only rehearsal may characterize behavior only if separately
authorized and must report receipt signature and persisted authority binding
as NOT MET. Remediation needs a new immutable image digest and exact-image
review.

The future independent reviewer is unassigned per Cody's latest direction.
Freddie's prior review records are historical and retained. No source/runtime,
Azure resource, message, access assignment or canonical review record was
changed. The procedure is not executable, execution approval remains absent,
and deployment-plan status remains unapproved and not Ready for Validation.
