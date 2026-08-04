# Public Vocabulary Review A6.3 - 2026-05-17

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[KEEP:PUBLIC-VOCABULARY-REVIEW-A6.3]
```

## Approval Scope

A6.3 approved a second vocabulary pass over public and buyer-facing copy.

This pass:

- reviewed `README.md`
- reviewed `config/product.json`
- reviewed public HTML surfaces under `apps/api/public`
- reviewed the internal pilot onboarding draft for high-risk buyer-facing phrasing
- remediated visible copy where wording implied unqualified execution, autonomous behavior, production certification, or public-sector readiness
- preserved technical API/function names where they are implementation contracts

This pass does not publish externally, change runtime behavior, rename API contracts, grant tools, or activate pilot use.

## Scan Result

Targeted high-risk phrase scan:

```txt
SentinelOS autonomously
production certified
government ready
governed execution path
Governed Execution
Blocks unapproved execution
Intent launcher -> Control Plane -> governed execution
Sentinel is deciding before execution
Deal blocked before execution
Deal executed safely
Approved deal executed
No execution traces
Approval required before execution
```

Result:

```txt
no matches after remediation
```

## Remediation Summary

| Surface | Change |
| --- | --- |
| `config/product.json` | replaced governed execution path phrasing with approval-bound workflow language |
| `README.md` | softened production-readiness and execution framing into readiness, review, and approved-action language |
| `apps/api/public/index.html` | replaced governed execution headline and unapproved execution labels with governed workflow/action language |
| `apps/api/public/proof.html` | replaced public-facing execution status messages with approval-state, approval-gate, and approved-path language |
| `apps/api/public/operational-upgrade.html` | replaced visible execution-divergence and agreement-execution phrasing with operations/operate language |
| `apps/api/public/mission-control.html` | replaced visible empty-state execution trace language with governed workflow trace language |
| `docs/PILOT_ONBOARDING_KIT_2026-05-17.md` | replaced risky example phrases with safer “avoid claiming” language and approval-bound workflow wording |

## Preserved Technical Terms

Some terms remain intentionally preserved because they are technical implementation names, event names, endpoint names, variable names, or API contract terms:

```txt
/v1/command
/api/control/execute
deal.execute
executionMode
executionSession
executeDeal()
executeWorkflowButton
workflow/execute
```

Sentinel AI classification:

```txt
technical-contract-term
```

Required handling:

```txt
Do not rename these during public-copy remediation.
If buyer-facing material references them, surround them with approval-bound context.
```

## Remaining Holds

| Hold | Reason |
| --- | --- |
| External publication | still requires explicit claim review and operator approval |
| API contract renaming | not approved and could break runtime/client behavior |
| Mission Control full UI label review | operator/internal surface contains technical execution terms by design |
| Pilot endpoint publication | still depends on explicit URL posture and publication approval |

## Sentinel AI Governance Pass

Findings:

```txt
GI-A6.3-1 - visible buyer/public copy now avoids the prior high-risk phrases in the targeted scan
GI-A6.3-2 - technical execution terms remain in implementation contracts and should not be casually renamed
GI-A6.3-3 - Mission Control remains an operator surface and needs a separate UI semantics pass before buyer use
GI-A6.3-4 - external publication remains unapproved
```

## Non-Authorization Clause

This review is local vocabulary remediation only.

It does not authorize:

- external publication
- runtime mutation
- deployment mutation
- API contract renaming
- tool grants
- tenant activation
- pilot activation
- production-readiness claims
- public-sector claims
