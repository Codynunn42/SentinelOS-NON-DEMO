# SentinelOS v1 Vendor Onboarding Rule Set

Version: `vendor-onboarding-v1.0`

Approval badge: `[APPROVE:CONDITIONAL]`

Approval condition: Keep this document aligned with the deterministic rule implementation and passing verification checks.

This is the deterministic v1 backbone for Vendor Onboarding Compliance. It is intentionally limited to 30 rules.

## Rule Groups

- `R-001` to `R-010`: Structural Integrity
- `R-011` to `R-020`: Policy Threshold
- `R-021` to `R-030`: Ambiguity & Escalation Injection

Each rule includes:

- Rule ID
- Category
- Deterministic condition
- Severity level
- Optional NVOP impact modifier
- Log trigger

## Engine Output

```json
{
  "workflow_id": "string",
  "rule_set_version": "vendor-onboarding-v1.0",
  "passed_rules": [],
  "failed_rules": [],
  "ambiguity_flags": [],
  "compliance_score": 0,
  "derived_domain_tier": 1,
  "impact_modifier_total": 0
}
```

The engine also attaches an `nvop` object with the calculated risk index, state, threshold label, formula inputs, and threshold ranges.

## NVOP Formula

```text
Risk Index = (1 - C) * I * D * (1 - V)
```

- `C`: compliance score
- `I`: impact index
- `D`: derived domain tier
- `V`: verification score

## v1 Thresholds

- `0.0 - 0.5`: State 0, Pass
- `0.5 - 1.3`: State 1, Advisory
- `1.3 - 3.0`: State 2, Escalation
- `> 3.0`: State 3, Refusal

These thresholds represent the conservative v1.0 containment posture after baseline simulation showed permissive escalation under standard load.

## Code Pointers

- NVOP config: `apps/sentinel/src/governance/vendorOnboarding/nvopConfig.js`
- Rule definitions: `apps/sentinel/src/governance/vendorOnboarding/rules.js`
- Evaluation engine: `apps/sentinel/src/governance/vendorOnboarding/engine.js`
- Audit ledger: `apps/sentinel/src/governance/vendorOnboarding/auditLedger.js`
- Verification check: `scripts/check-vendor-onboarding-rules.js`

## Verification Mapping

| Check | Command | Status |
| --- | --- | --- |
| Rule definitions and NVOP thresholds | `npm run check:vendor-onboarding` | Passed locally on 2026-05-04 |
| Audit ledger hash chain | `npm run check:vendor-ledger` | Passed locally on 2026-05-04 |
| Containment posture | `npm run posture:containment` | Passed locally on 2026-05-04 |
| 1,000-case simulation | `npm run simulate:vendor-onboarding` | Passed locally on 2026-05-04 |

## Next Approval Step

This document can become `[APPROVED:MAPPING]` once the owner confirms it as the canonical operator/auditor reference for vendor onboarding compliance.
