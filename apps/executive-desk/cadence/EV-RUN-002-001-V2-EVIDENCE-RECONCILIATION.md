# EV-RUN-002-001 V2 Evidence Reconciliation

Date: 2026-07-28
Assessment scope: Package artifact evidence vs Builder publication lifecycle
Evidence mode: Split-source reconciliation

## Executive Summary

The missing GPT Builder revision_id is treated as a metadata boundary, not a workflow failure. V2 evidence is reconciled using two complementary sources of truth:

- Artifact/source evidence (repository and schema-level identifiers)
- Builder publication evidence (publish event details visible in Builder UI)

## Source A - Package Artifact Evidence

### Verified local artifact evidence

- Repository root package: /Users/codynunn/SentinelOS/SentinelOS-NON-DEMO/SentinelOS-NON-DEMO/package.json
- name: sentinelos-non-demo
- version: 0.1.0
- description: SentinelOS NON-DEMO client operating repository

### Attested external artifact evidence

The following values were supplied by operator attestation in the V2 reconciliation package and are not locally verifiable in this workspace snapshot:

- OpenAPI file: sentinel-actions-schema.openapi-3.0.1.json
- OpenAPI value: 3.0.1
- Schema version value: 1.0.0
- Schema checksum: de31c08d79adce29419c8e6c3440f5958fa00f494fd9c90366170b96d1b1b167

Local verification result for schema file in current workspace snapshot:

- File presence: not found in local workspace path scan.
- Evidence state: Attested external artifact.

## Source B - Builder Publication Evidence

### Attested external publication evidence

From operator attestation:

- Action package was published in GPT Builder.
- Version/publish event is visible in Builder UI.
- revision_id is not exposed in Builder UI.

Evidence state: Attested external artifact.

## Metadata Boundary Analysis

1. Local repository and artifact identifiers are available and auditable.
2. Builder publication is observable as an event.
3. Builder internal revision_id may exist but is not surfaced to user-facing UI in current workflow.

Control interpretation:

- Missing revision_id does not indicate process failure by itself.
- It indicates separation between local artifact identity and Builder internal revision tracking.

## Reconciliation Verdict

- Artifact/source evidence: available (mixed verified local + attested external).
- Builder publication evidence: available as attested external publish event.
- Unified revision_id: not available in user-facing Builder UI.

Verdict: Reconciled under split evidence sources with explicit metadata-boundary notation.

## Required Follow-through

1. Keep revision_id fields explicit as Unverified until Builder exposes a value.
2. Capture Builder publish timestamp and visible label on each release cycle.
3. Continue manifest and scan controls for every evidence update.
