# July 29 Launch Sequence Owner Runbook

Date: 2026-07-29
Assigned owner: Cody Nunn
Operating rule: Complete and verify each stage in order. A stage receives its final check mark only after its production acceptance checks pass.

## Launch Sequence

### Stage 1 — Web Repositioning and Assessment Funnel

Status: In progress

- [x] Reposition the public pages around executive outcomes.
- [x] Add the Executive Assessment intake route.
- [x] Route engagement calls to action through the assessment funnel.
- [x] Include strict no-sensitive-data intake guidance.
- [x] Pass the static production build.
- [x] Pass internal-link, CTA-routing, form-contract, and local HTTP checks.
- [x] Verify all Stage 1 routes return HTTP 200 on the Cloudflare Pages branch preview.
- [x] Reconcile and push the existing website branch without force-pushing.
- [x] Update the existing pull request with the current launch scope and validation boundary.
- [x] Resolve the pull request's conflicts with `main`.
- [ ] Confirm which repository and deployment project control `nunncorporation.com`.
- [ ] Deploy the reviewed Stage 1 source to that production target.
- [ ] Verify `/`, `/assessment/`, `/solutions/`, `/library/`, `/deal-execution/`, `/ownerfi/`, `/executive-desk/`, and `/success/` in production.
- [ ] Submit one harmless production assessment and verify receipt and routing.
- [ ] Record Stage 1 sign-off.

Pull request: https://github.com/Codynunn42/nunncorporation.com/pull/1

### Stage 2 — Concierge GPT

Status: Held behind Stage 1

- [ ] Define the strict non-sensitive scope and refusal boundaries.
- [ ] Verify the published instructions, knowledge, tools, and disclosure language.
- [ ] Publish the concierge GPT.
- [ ] Run safe-scope, sensitive-data refusal, escalation, and failure-mode checks.
- [ ] Record Stage 2 sign-off.

### Stage 3 — Production Environment

Status: Held behind Stage 2

- [ ] Approve the production architecture and source provenance.
- [ ] Stand up authentication, PostgreSQL, gateway, monitoring, secrets, and rollback controls.
- [ ] Build and deploy a versioned, source-attributed image.
- [ ] Verify availability, database readiness, access control, observability, backup, and rollback.
- [ ] Record Stage 3 sign-off.

### Stage 4 — Executive Desk to Hosted Sentinel AI

Status: Held behind Stage 3

- [ ] Connect Executive Desk to the approved hosted Sentinel AI gateway.
- [ ] Verify health, readiness, status, OpenAPI, connection, governed command, receipt, and audit endpoints.
- [ ] Verify tenant binding and cross-platform availability.
- [ ] Verify Microsoft Sentinel telemetry, detection, automation, and incident-routing coverage.
- [ ] Record Stage 4 sign-off.

### Stage 5 — Final Launch Dry Run

Status: Held behind Stage 4

- [ ] Execute the full launch checklist in production.
- [ ] Exercise success, refusal, degradation, recovery, rollback, and evidence paths.
- [ ] Reconcile every launch artifact to the same verified state.
- [ ] Obtain full checklist sign-off.
- [ ] Record final launch authorization.

## Current Cloud Evidence

The July 29 read-only Azure and Sentinel review is recorded in:

- `cadence/2026-07-29_AZURE_SENTINEL_CLOUD_POSTURE_RUNDOWN.md`

Current gate decision: Azure's primary SentinelOS runtime is healthy, but public gateway availability, deployed GPT Action routes, source-to-runtime provenance, Microsoft Sentinel security coverage, and universal tooling availability are not yet complete. These items remain evidence gates for Stages 3 and 4; they do not authorize skipping the current Stage 1 production gate.

The website branch is successfully deployed to a Cloudflare Pages preview, while `nunncorporation.com` is currently served by Vercel and does not expose the new Stage 1 routes. Four separately connected Cloudflare Workers builds also fail on the branch. The production hosting owner and duplicate build integrations must be reconciled before Stage 1 sign-off.

The local `nunncorp-global-mono` checkout is linked to Vercel project `nunncorp-global-mono-nexus-ui`, but the CLI has no current credentials, so the domain-to-project assignment could not be confirmed from Vercel. No login, deployment, merge, or DNS change was performed.
