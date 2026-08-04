# Contract Reclamation Faceplane

Status: `[HOLD:CONTRACT-RECLAMATION-PROTOTYPE-REVIEW]`  
Date: 2026-05-21  
Command: `contract.reclamation.assess`  
Authority: review only

## Purpose

Contract Reclamation is a governed faceplane family for contract-state reconstruction. It uses the Operational Upgrade pattern but remains its own lane with its own command, public surface, and review boundary.

## File Map

```txt
apps/sentinel/src/faceplanes/contractReclamationPlane.js
apps/sentinel/src/commands/contractReclamation.js
apps/api/public/contract-reclamation.html
docs/CONTRACT_RECLAMATION_POSITIONING.md
docs/CONTRACT_RECLAMATION_FACEPLANE.md
```

## Faceplane Sequence

1. `evidence-timeline`
2. `contract-intake`
3. `obligation-mapper`
4. `authority-reconstruction`
5. `amendment-diff`
6. `renewal-risk`
7. `execution-status`

## Governance Boundary

```yaml
prototype_review_lane: true
non_adversarial_language: true
legal_advice_provided: false
legal_certainty_claimed: false
governance_trace_required: true
execution_blocked_until_approved: true
authority_created: false
```

## Command Behavior

`contract.reclamation.assess` assembles:

- a timeline of contract-state evidence,
- an intake record,
- obligation records,
- authority-chain evidence,
- amendment comparisons,
- renewal risk flags,
- and execution-status review output.

The command returns a review artifact. It does not produce legal conclusions or execute any contract action.

## SentinelOS Boundary

```txt
Faceplanes = domain intelligence
SentinelOS = governance + execution control
```

Contract Reclamation may organize evidence and readiness signals. SentinelOS preserves command routing, audit trace, policy scope, and blocked execution posture.

## Verification

```bash
npm run check:contract-reclamation
```

Expected outcome:

```txt
Contract Reclamation verification passed
```
