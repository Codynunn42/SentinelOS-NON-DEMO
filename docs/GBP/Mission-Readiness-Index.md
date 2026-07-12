# GBP Phase 5 — Mission Readiness Index (MRI)

## Purpose

Define the readiness model used by Executive Desk to measure operational preparedness, governance strength, and mission execution health.

## Definition

The Mission Readiness Index (MRI) is a configurable composite score representing the current readiness of a deployment to execute governed outcomes.

## MRI Principles

- Continuous calculation
- Executive-readable
- Drill-down capable
- Profile-configurable
- Evidence-backed
- Governance-aware

## Default MRI Categories

- Governance
- Risk
- Evidence
- Operations
- Security
- Financial
- Compliance
- AI Readiness
- Deployment Health

## Default Weights

```yaml
mission_readiness_index:
  governance:
    weight: 25
  risk:
    weight: 20
  evidence:
    weight: 20
  operations:
    weight: 15
  security:
    weight: 10
  financial:
    weight: 10
```

## MRI Calculation Rules

1. Each category must have a defined scoring method.
2. Each category must be traceable to source evidence.
3. Missing data must be handled explicitly.
4. Profile overrides may adjust weights and thresholds.
5. Overrides may not remove governance, evidence, or security from the model.

## Executive Desk Display Requirements

Executive Desk must present:

- Overall MRI score
- Category scores
- Trend over time
- Top contributing factors
- Drill-down evidence links

## Threshold Bands

- 90–100: Mission Ready
- 75–89: Ready with Conditions
- 60–74: Caution
- Below 60: Not Ready

## Phase 5 Exit Criteria

- MRI model approved
- Category weights approved
- Threshold bands approved
- Drill-down requirements approved
- Profile override rules approved
