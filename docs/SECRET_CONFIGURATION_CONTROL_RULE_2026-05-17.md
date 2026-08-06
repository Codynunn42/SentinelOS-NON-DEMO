# Secret Configuration Control Rule - 2026-05-17

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[KEEP:SECRET-CONFIGURATION-CONTROL-RULE]
```

## Approval Boundary

Approved item:

```txt
A2.3 - Add documentation rule: no direct secret-like values in runtime env exports or public reports.
```

This rule is documentation/control posture only. It does not read secrets, rotate secrets, update runtime env vars, deploy code, restart revisions, grant permissions, publish externally, or authorize future runtime mutation.

## Control Rule

Secret-class values must not be configured, exported, reported, copied, or published as direct runtime env values.

Secret-class values must be handled through:

- managed secret references
- redacted reports
- name-only inventories
- approval-bound rotation records
- runtime verification that omits values
- audit evidence that records posture, not secret material

## Prohibited Patterns

The following patterns are prohibited:

- direct secret-like runtime env values
- secret values in runtime exports
- secret values in public reports
- secret values in executive snapshots
- secret values in approval packets
- secret values in command envelopes
- secret values in screenshots, logs, or copied terminal output
- secret values in Git-tracked docs
- secret values in deployment evidence
- secret values in buyer-facing or public materials

## Required Reporting Pattern

Reports may include:

- env var name
- managed secret name
- secret reference status
- rotation timestamp marker
- health verification status
- public bridge status
- remediation status
- reviewer notes

Reports must not include:

- raw secret value
- full connection string with credential material
- bearer token
- API key
- HMAC key
- webhook credential
- database password
- registry password

## Runtime Env Classification

Runtime env vars must be classified before production-grade trust claims.

| Classification | Required Handling |
| --- | --- |
| non-secret runtime setting | may remain direct if documented |
| identifier / endpoint | may remain direct if no credential embedded |
| telemetry connection string | classify explicitly before trust claim |
| runtime flag | review if it affects security or production posture |
| secret-class value | must use managed secret reference |
| empty placeholder | remove or document if intentionally reserved |

## Verification Expectations

Secret posture verification should use redacted/name-only queries such as:

```bash
az containerapp show --name <app> --resource-group <group> --query "properties.template.containers[0].env[].{name:name,secretRef:secretRef}" -o json
az containerapp show --name <app> --resource-group <group> --query "properties.configuration.secrets[].{name:name}" -o json
```

Operators must not run or paste broad runtime exports into reports when those exports may include secret values.

## A2 Completion Linkage

This rule follows:

- `docs/SECRET_CONFIGURATION_INVENTORY_2026-05-17.md`
- `docs/SECRET_ROTATION_COMPLETION_2026-05-17.md`

Current A2 status:

```txt
A2.1 completed
A2.2 completed
A2.3 completed
secondary direct-env classification remains open
```

## Secondary Review Items

These items remain separate from the completed HMAC secret remediation:

| Item | Required Review |
| --- | --- |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | classify telemetry connection string posture |
| empty Azure config placeholders | remove or document if intentionally reserved |
| `SENTINEL_SMOKE_AUTH` | review before production-grade trust claim |

## Non-Authorization Clause

This rule documents secret configuration controls. It does not authorize additional runtime mutation, secret access, secret rotation, deployment changes, production-readiness claims, or external publication.
