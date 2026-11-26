# Faceplate Docking Protocol Specification

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Artifact Decision

```txt
[APPROVED:LOCAL-READ-ONLY-EVALUATION]
```

## Purpose And Scope

Define the protocol for docking contextual Faceplates into SentinelOS without redefining the OS Core.

This specification preserves the separation between Faceplate business context, GaaS constraint interpretation, and OS Core deterministic enforcement.

Owner approval recorded 2026-11-24 is limited to use of the SSAI Read-Only Report Synthesis Faceplate for local, read-only evaluation of repository materials and preparation of report syntheses. It does not authorize changing repository materials through the Faceplate or publishing prepared syntheses.

The current canary identity and digest have not been verified, and no authorization linked to a current run is retained. The runtime connection, live-source access, `/proxy/command`, and production authentication remain separately gated. Independent reviews remain outstanding.

This approval does not establish that the Faceplate is implemented or connected to a runtime. It does not authorize runtime implementation, runtime connection, live-source access, tool grants, tenant activation, pilot activation, endpoint publication, deployment, external publication, held-standard promotion, or autonomous execution.

## Constitutional Inheritance

This specification inherits from:

```txt
docs/governance/SENTINELOS_CONSTITUTION.md
docs/governance/SENTINELOS_ARCHITECTURE_SPECIFICATION.md
docs/governance/SENTINEL_RUNTIME_EXECUTION_BOUNDARY_SPECIFICATION.md
docs/governance/POLICY_INHERITANCE_STANDARD.md
docs/governance/TOOL_ACCESS_GOVERNANCE_STANDARD.md
docs/governance/AUDIT_TRACEABILITY_STANDARD.md
docs/governance/DISCIPLINED_AUTHORITY_PROGRESSION_STANDARD.md
```

## Core Invariant

```txt
Faceplates provide contextual governance manifests. Faceplates do not redefine OS Core authority.
```

## Docking Separation

| Layer | Responsibility | Prohibited Behavior |
| --- | --- | --- |
| Faceplate | provides contextual governance manifest, requested scopes, workflow context, and constraints | self-authorizing execution |
| GaaS | interprets constraints, negotiates capability scope, routes governance evaluation | bypassing OS Core |
| OS Core | enforces runtime boundaries, deterministic containment, and audit requirements | absorbing business-specific authority logic |

## Hybrid Deterministic Manifest Model

| Manifest Layer | Behavior |
| --- | --- |
| Structural Schema | static, deterministic, versioned, signed where required |
| Capability Negotiation | dynamic but bounded |
| Authority Elevation | runtime ephemeral and explicit |
| Governance Constraints | immutable during active session |

## Faceplate Manifest Requirements

A Faceplate manifest should declare:

- manifest id
- version
- owner
- scope
- intended context
- requested capabilities
- prohibited capabilities
- policy dependencies
- vocabulary constraints
- audit requirements
- lifecycle state
- expiration or review window

The manifest must not include:

- secret values
- direct runtime mutation authority
- deployment authority
- publication authority
- tenant activation authority
- governance override authority

## Docking Flow

```txt
Faceplate manifest submitted
    ↓
structural schema validation
    ↓
policy inheritance check
    ↓
vocabulary and claim review
    ↓
capability negotiation
    ↓
authority progression gate
    ↓
command envelope generation
    ↓
operator approval where required
    ↓
audit registration
```

## Non-Authorization Clause

The approval above is local and read-only only. It does not authorize runtime connection or activation, live-source or credential access, `/proxy/command` use, production authentication, repository mutation through the Faceplate, deployment, direct environment-value restoration, external publication, endpoint release, pilot or tenant activation, held-standard promotion, push, additional tool grants, certification claims, autonomous execution, or destructive cleanup.
