# SentinelOS Pilot Onboarding Kit - 2026-05-17

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[HOLD:INTERNAL-PILOT-ONBOARDING-DRAFT]
```

## Approval Boundary

```txt
A7.1 - internal pilot onboarding kit draft only
```

Approved scope:

- create an internal pilot onboarding draft
- use existing proof, runtime, trust, and public-label evidence
- keep claims buyer-safe and governance-aligned
- identify what must be reviewed before external use

Not approved:

- external publication
- production-readiness claim
- government/public-sector readiness claim
- runtime mutation
- deployment mutation
- pilot activation
- tenant activation
- API key issuance
- held governance artifact promotion

## Pilot Positioning

SentinelOS is a governed execution operating framework for approval-aware workflows.

It is designed to route operational intent through policy, approval, review, and audit before an approval-bound workflow proceeds.

This onboarding kit is an internal draft for preparing a controlled pilot conversation. It is not a signed pilot offer, implementation commitment, production deployment plan, or external release packet.

## Buyer-Safe Pilot Narrative

Use this framing:

```txt
SentinelOS helps teams see where important operational actions should pause, what approval is required, and how the decision is preserved in audit.
```

Avoid claiming that SentinelOS:

```txt
acts independently without approval
guarantees compliance
is certified for production use
is approved for public-sector deployment
replaces the buyer's existing systems
```

## Pilot Scope

Recommended pilot scope:

| Scope Element | Controlled Boundary |
| --- | --- |
| Primary proof | governed deal execution reference flow |
| Primary surfaces | `/health`, `/proof`, `/mission-control`, `/v1/command`, `/v1/audit` |
| Primary behavior | submit intent, block approval-required action, show reason, approve, rerun, audit |
| Buyer promise | governance visibility and approval-bound workflow proof |
| Excluded promise | unrestricted automation, production certification, compliance guarantee, system replacement |

## Onboarding Flow

1. Confirm pilot objective.
2. Confirm workflow boundary.
3. Confirm who can submit, review, approve, and observe.
4. Confirm what must block before action.
5. Confirm what evidence must be visible in audit.
6. Run the narrow proof path.
7. Review outputs and decide whether to prepare a pilot-specific boundary definition.

## Demo Spine

Use one proof path:

```txt
submit deal
-> request execution
-> approval required
-> show reason
-> approve
-> rerun
-> audit receipt
```

The block is the product working.

Approved explanation:

```txt
SentinelOS checks authorization before an approval-bound workflow proceeds.
```

## Required Internal Readiness Checks

Before using this kit externally, refresh or review:

| Check | Status |
| --- | --- |
| Public label remediation | completed in `docs/PUBLIC_LABEL_REMEDIATION_A6_2026-05-17.md` |
| Runtime truth map | available in `docs/GENERATED_RUNTIME_MAP_2026-05-17.md` |
| Fresh Azure export | completed in `docs/AZURE_CONTAINER_APP_SANITIZED_EXPORT_2026-05-18.md` |
| Scaffold YAML warning | completed in `azure/container-app.yaml` |
| Deployment doc volatile revision cleanup | completed in `docs/DEPLOYMENT.md` |
| Demo reliability packet | available in `docs/DEMO_RELIABILITY_PACKET_2026-05-15.md` |
| Trust binder | available in `docs/TRUST_BINDER_2026-05-15.md` |
| OwnerFi pilot API spec | controlled reference in `docs/OWNERFI_PILOT_API_SPEC.md` |

## Pilot Discussion Checklist

Use during a pilot-readiness conversation:

- What workflow is being reviewed?
- Which action should require approval?
- Who is allowed to submit the request?
- Who is allowed to approve or reject it?
- What audit evidence must be visible?
- What system remains the buyer's system of record?
- What should SentinelOS not do during the pilot?
- What would count as a successful pilot signal?

## Evidence Package

Internal package candidates:

| Artifact | Use |
| --- | --- |
| `docs/SENTINELOS_PROOF_SHEET_V2.md` | concise proof narrative |
| `docs/DEMO_RELIABILITY_PACKET_2026-05-15.md` | demo flow and fallback posture |
| `docs/TRUST_BINDER_2026-05-15.md` | trust boundaries and blocked claims |
| `docs/OWNERFI_PILOT_API_SPEC.md` | controlled pilot API reference |
| `docs/PUBLIC_LABEL_REMEDIATION_A6_2026-05-17.md` | public semantic alignment evidence |
| `docs/GENERATED_RUNTIME_MAP_2026-05-17.md` | current runtime-map evidence and gaps |

## Known Holds Before External Use

| Hold | Reason |
| --- | --- |
| `A4.2` | deploy-authoritative YAML reconciliation requires explicit operator approval |
| `A6.3` | optional vocabulary rerun before buyer-facing copy use |
| pilot activation | requires separate pilot boundary definition |
| endpoint publication | requires explicit URL posture and publication approval |
| external publication | requires claim review and operator approval |

## Sentinel AI Governance Notes

### GI-A7-1 - Base URL Should Stay Conditional

The live base URL is known from existing evidence and A4.3R fresh export is complete. Buyer-facing material should still avoid publishing endpoint details until URL posture and external publication are explicitly approved.

Recommendation:

```txt
Use "pilot endpoint provided during onboarding" unless the pilot URL is freshly verified.
```

### GI-A7-2 - OwnerFi Spec Contains Direct Execute Language

`docs/OWNERFI_PILOT_API_SPEC.md` uses API terms such as `execute` because those are real endpoint semantics. That is acceptable for a technical spec, but external use should preserve the pilot disclaimer and approval-bound context.

Recommendation:

```txt
Do not rename API contract terms casually. Add surrounding approval-bound language if the spec is refreshed.
```

### GI-A7-3 - Pilot Kit Is Not A Pilot Boundary Definition

This kit prepares onboarding. It does not define tenant-specific authorization, scope, pilot success criteria, access credentials, or support model.

Recommendation:

```txt
Create a controlled pilot boundary definition before any tenant-specific activation.
```

## Next Recommended Approval

```txt
A7.2/A7.3 - refine pilot kit for buyer-safe external draft after A4.3R or explicit URL posture decision
```

Alternative path:

```txt
A8.1/A8.2 - architecture diagram inventory and sanitized diagram index
```

## Non-Authorization Clause

This pilot onboarding kit is an internal draft. It does not authorize external publication, pilot activation, tenant activation, API key issuance, runtime mutation, deployment mutation, production-readiness claims, or government/public-sector claims.
