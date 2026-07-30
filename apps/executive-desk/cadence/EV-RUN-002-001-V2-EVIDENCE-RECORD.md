# EV-RUN-002-001 V2 - Formal Evidence Record

Evidence ID: EV-RUN-002-001-V2
Date collected: 2026-07-28
Status: Verified with split evidence sources

## Evidence Summary

This record reconciles V2 evidence across artifact, publication, and runtime layers while preserving explicit Unverified handling for unavailable Builder revision metadata.

## A) Artifact Layer

### Verified local artifact

- File: /Users/codynunn/SentinelOS/SentinelOS-NON-DEMO/SentinelOS-NON-DEMO/package.json
- name: sentinelos-non-demo
- version: 0.1.0

### Attested external artifact

- Schema file: sentinel-actions-schema.openapi-3.0.1.json
- OpenAPI value: 3.0.1
- Schema version value: 1.0.0
- SHA256: de31c08d79adce29419c8e6c3440f5958fa00f494fd9c90366170b96d1b1b167

Workspace note:

- Schema file above is not locally present in this workspace snapshot and is therefore attested external.

## B) Publication Layer (Builder)

Evidence state: Attested external artifact

- Action package publication: confirmed by operator attestation.
- Visible publish event: confirmed by operator attestation.
- revision_id: Unverified (not exposed in current Builder UI workflow).

## C) Runtime Layer

Evidence state: Verified local artifact

- Evidence package: evidence/EV-RUN-002-001
- Integrity manifest present: evidence/EV-RUN-002-001/MANIFEST.sha256
- Placeholder posture: PASS (0 unresolved placeholders)
- Unverified posture: explicit markers retained for Builder revision metadata

### Metadata Bridge Runtime Evidence

Evidence state: Verified local artifact

- workflowId: wf_execdesk_metadata_bridge_live
- tenantId: sentinelos
- objective: metadata_evidence_bridge
- evidenceId: EV-RUN-002-001-V2
- metadataEvidence.posture: conditional
- metadataEvidence.builder_visibility: not_exposed
- metadataEvidence.required_response: true
- metadataEvidence.response_prompt: Provide revision_id, version_label, and revision_timestamp from Builder publish details (or explicitly confirm not exposed).

### Remaining Operator Inputs

| Field | Current state |
|---|---|
| revision_id | Unverified - Builder not exposed |
| version_label | Awaiting Builder capture |
| revision_timestamp | Awaiting Builder capture |

## Compliance Interpretation

1. Evidence controls are intact.
2. No inferred metadata values were introduced.
3. Split evidence sources provide traceability despite revision_id non-exposure.

## Closure Recommendation

Close EV-RUN-002-001 V2 as:

Verified with split evidence sources (artifact + publication + runtime), with explicit metadata-boundary notation for Builder revision_id non-exposure.
