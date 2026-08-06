# C6 Institutional Passport Issuance Plan

## Identity Integration for Sovereign Runtime

This plan defines how institutional identities are issued and bound to sovereign evidence chains.

### 1. Passport Authority Activation

Enable the institutional identity provider through the Sentinel Passport runtime. This authority issues:

- passportId
- institutionId
- identity metadata
- capability permissions

### 2. Passport Issuance Workflow

For each institutional user:

1. Institution submits identity metadata
2. Passport Authority generates the passport
3. Passport is bound to a governed session
4. Passport is stored in the identity registry
5. Passport becomes part of the evidence chain

Evidence emitted during this workflow includes:

- SPE session start
- SER receipt
- SEL ledger entry
- SNCS cross-provider evidence

### 3. Identity-to-Evidence Binding

Every governed session includes:

- passportId
- institutionId
- capabilityId
- providerId
- moduleId

This ensures:

- evidence status reflects identity
- executive plane shows identity-linked evidence
- ORV-3 can validate identity governance

### 4. Passport Governance

Each passport defines:

- allowed modules
- allowed capabilities
- allowed providers
- data classification boundaries

Governance violations emit:

- module-governance-denial evidence
- identity-governance-denial evidence where applicable

### 5. Passport Lifecycle

Passports support:

- issuance
- renewal
- revocation
- audit

Revocation triggers:

- governance-denial evidence
- executive plane updates

### 6. Passport Issuance Completion Criteria

Passport issuance is complete when:

- All institutional users have passports
- All passports bind correctly to evidence chains
- The executive plane shows identity-linked evidence
- ORV-3 identity tests pass
