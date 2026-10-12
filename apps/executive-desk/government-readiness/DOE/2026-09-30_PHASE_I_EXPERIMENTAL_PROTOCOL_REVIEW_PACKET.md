# DOE Phase I Experimental Protocol - Review Packet

**Date:** 2026-09-30<br>
**State:** DRAFT FOR OWNER REVIEW / NO ENGINEERING OR SUBMISSION AUTHORIZED<br>
**Source:** Owner-provided "DOE Phase I Experimental Protocol" (2026-09-30)<br>
**Reference head:** PR #44 `ff87fcc262d6e7ab36e27a368d03bb793f3f7ccb` (not this workspace's `main`)

## Review Decision Requested

Is a comparative feasibility study of governed runtime control worth retaining
as a reusable Phase I concept, subject to a real DOE topic match? This review
does not select a topic, adopt numerical targets, authorize a benchmark, or
certify application readiness.

## Proposed Study

**Working title:** Governed Runtime Control for Auditable AI-Assisted Technical
Workflows.

**Question:** Compared with authentication alone and conventional static RBAC,
can a governed runtime reduce unauthorized execution, approval bypass, and
evidence gaps in the same bounded AI-assisted workflows without unacceptable
false denials or latency?

**Falsifiable hypothesis:** The governed condition improves containment and
audit reconstruction over RBAC while preserving valid throughput. The null is
no material improvement or impractical overhead. Both outcomes must be reported.

| Condition | Controls to compare | Boundary |
| --- | --- | --- |
| A | Authentication only | Research baseline, never a production fallback |
| B | Authentication plus static RBAC | Fair comparator with the same workflows and identities |
| C | Authentication, RBAC, and Sentinel runtime policy/approval/evidence controls | No simulated approval or receipt counted as an independent result |

Proposed workflows: one read-only technical status/analysis flow and one
approval-controlled high-impact flow in an isolated test environment. A
scientific/laboratory use case must be specified after topic selection; general
operational similarity is not sufficient. Design a labeled corpus of about
1,000 cases across authorized, malformed, cross-tenant/authority,
contradictory-command, approval, rogue/drift, and provenance classes. Freeze
case definitions and expected outcomes before comparing conditions.

## Candidate Measures, Not Results

| Measure | Draft decision threshold | Proof required |
| --- | --- | --- |
| Critical unauthorized escape, malformed-input escape, approval bypass, cross-tenant failure, wrong-revision acceptance | Zero observed in predefined critical cases | Independent execution and deployment records, not policy logs alone |
| False denial | Under 5% of valid cases | Ground-truth labels and identical valid traffic across conditions |
| Drift and rogue-action detection | At least 95% on defined injected cases; all critical cases contained | Recorded injection and detection outcomes |
| Receipt completeness | At least 99% | Join receipts to independent request, policy, approval, revision, and result records |
| Defined tampering detection | All defined manipulations detected | Tamper corpus and independent verification |
| Non-LLM governance overhead | Median below 300 ms, provisional | Same-workload latency distributions for B and C, including p95/p99 |

Zero observed failures in a finite corpus does not prove zero real-world risk.
Set sample size, repetitions, confidence intervals, and treatment of flaky or
inconclusive cases before running the study. Predefine GO, CONDITIONAL, and
NO-GO decisions; any critical authority or tenant escape is a NO-GO candidate.

## Reuse Assessment

| Existing surface | What it supports now | What it does not yet prove |
| --- | --- | --- |
| PR #44 control-plane validator and focused tests | Normalization and malformed-input test design on the published PR head | Merge, deployed behavior, or a DOE experimental result |
| `scripts/check-tenant-isolation.js` | Local negative-control examples | A measured cross-tenant attack escape rate across A/B/C |
| `scripts/check-execution-integrity.js` and `scripts/check-receipt-lookup.js` | Signed-decision, audit-chain tamper and receipt-lookup examples | Independent receipt completeness and all proposed tamper classes |
| `scripts/check-governance-drift-monitor.js` | Injected vendor-onboarding containment-drift scenarios | General AI rogue-action detection at the proposed threshold |
| `scripts/check-performance-slo.js` | Faceplane scenario latency and throughput tooling | Incremental non-LLM governance overhead relative to RBAC |

The cited deployment-contract test was not found in this local checkout.
Confirm the exact-head source and test availability before making any
provenance-coverage claim. Existing scripts are scaffolding, not results of
this protocol; no A/B/C study was executed for this packet.

## Sentinel AI Advisory Output

The local `governance.nextsteps.quantitative.light` command with
`focus: doe_sbirsttr` returned `prepare_owner_review_packet` and
`externalExecution: not_authorized`. Its score of 72 is from fixed inputs,
not a measurement of this protocol. Its hard-coded "SAM.gov active" text
conflicts with the submitted/CAGE-pending screenshot and must not be treated
as verified evidence. The command does not ingest the protocol or perform
independent scientific review; this packet reconciles its advisory output
with the supplied protocol and local repository evidence.

## Outstanding Review Questions

1. Which actual DOE topic and lab workflow would own this feasibility question?
2. Can A and B be implemented as fair, isolated comparators without exposing
   production operations or weakening a live service?
3. Who will establish independent ground truth, case labels, and exclusions?
4. Which approval attacks, provenance mismatches, and critical actions belong
   in the frozen corpus, and who sets statistically defensible thresholds?
5. Which exact test/revision artifacts can be reproduced, and what infrastructure
   and staffing would the budget require?
6. Do the buyer/use case, IP and data rights, disclosures, and actual
   registration records support the selected solicitation?

## Recommendation and Hold

**Retain as a review-ready experimental design candidate, not a completed
protocol or application-ready package.** Reuse the local checks as starting
fixtures. Defer engineering, external claims, topic selection, target lock,
registration assertions, submission, and approval until the owner reviews a
topic-specific design and independent evidence plan. The [readiness alignment](2026-09-27_DOE_SBIRSTTR_READINESS_ALIGNMENT.md)
remains the source of registration and application-gap status; this packet does
not close those gates.
