# GBP Deployment Profile — {{Profile Name}}

## Profile Name

{{Profile Name}}

## Purpose

{{One-sentence mission context for this deployment profile.}}

## Inheritance

- Inherits from MOB
- Inherits from GBP
- Uses the common Outcome Engine catalog
- Uses the common governance and evidence model

## Profile Characteristics

- {{Characteristic 1}}
- {{Characteristic 2}}
- {{Characteristic 3}}
- {{Characteristic 4}}

## Required Outcome Engines

- Governance Engine
- Evidence Engine
- Executive Operations Engine
- Mission Operations Engine
- Workflow Engine
- Integration Engine
- Identity Engine
- {{Additional Engine(s)}}

## Common Mission Packages

- {{Mission Package 1}}
- {{Mission Package 2}}
- {{Mission Package 3}}

## Policy Overlays

- {{Policy overlay 1}}
- {{Policy overlay 2}}
- {{Policy overlay 3}}
- {{Policy overlay 4}}

## Required Integrations

- Identity provider / SSO
- ITSM platform
- Monitoring and observability stack
- Records management archive
- {{Additional Integration(s)}}

## Evidence Requirements

- Receipts
- Approval chain logs
- Policy decisions
- Workflow traces
- Reporting snapshots
- {{Additional Evidence Artifact(s)}}

## MRI Profile Settings

```yaml
mission_readiness_index:
  governance: {{weight}}
  risk: {{weight}}
  evidence: {{weight}}
  operations: {{weight}}
  security: {{weight}}
  financial: {{weight}}
  compliance: {{weight}}
  ai_readiness: {{weight}}
  deployment_health: {{weight}}
```

## Readiness Criteria

- Identity integration validated
- Governance controls approved
- Evidence retention confirmed
- Operational dashboards active
- Profile-specific reporting enabled

## Profile Override Rules

- Overrides must be explicit
- Overrides may not weaken governance
- Overrides may not weaken evidence retention
- Overrides may not weaken auditability
- Overrides must remain compatible with GBP and MOB

## Exit Criteria

- Profile approved
- Required engines mapped
- Mission packages selected
- Integrations validated
- MRI settings approved
- Governance overlays documented
