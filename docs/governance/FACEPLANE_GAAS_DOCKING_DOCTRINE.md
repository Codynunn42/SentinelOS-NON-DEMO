# Face Plane, GaaS, and Docking Doctrine

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Position

SentinelOS must remain the operating system.

It should not become a one-off customer application, a regulated finance app, a hotel app, a payroll app, or any other vertical product. SentinelOS is the governed execution OS that runs and constrains those surfaces.

The customer-specific or regulation-specific experience is a **face plane**.

```txt
SentinelOS
-> GaaS policy and governance services
-> Docking technology
-> Face plane
-> User, workflow, or external system
```

## Definitions

### SentinelOS

The core governed operating system.

Responsibilities:

- command routing
- policy enforcement
- approval boundaries
- audit logging
- telemetry harmonization
- execution gating
- state anchoring
- tenant isolation
- governance lifecycle

SentinelOS owns the rules of execution. It does not need to own the entire customer application.

### Face Plane

A face plane is the operational surface presented to a user, customer, partner, internal team, or regulated workflow.

Examples:

- OwnerFi vehicle finance surface
- Nunn Cloud Mission Control
- payroll operations surface
- vendor onboarding surface
- OpenAI workflow surface
- future government or enterprise compliance surface

A face plane can be specific to a domain, customer, regulation, or workflow. It should remain dependent on SentinelOS for governance and execution authority.

### GaaS

GaaS is the governance-as-a-service layer that adapts SentinelOS to a mandate, customer, workflow, or risk environment.

Responsibilities:

- translate regulations, standards, or client policies into executable controls
- define required approvals
- define blocked actions
- define evidence requirements
- define audit and retention obligations
- define telemetry visibility rules
- define role and tenant permissions

GaaS is how SentinelOS can satisfy different governance and compliance requirements without becoming a different product each time.

### Docking Technology

Docking is the boundary that connects a face plane to SentinelOS.

Responsibilities:

- validate the face plane manifest
- check requested capabilities against trust tier
- restrict or block unsupported actions
- require approval for risky or elevated capabilities
- convert external workflow intent into governed SentinelOS events
- keep the face plane operating within its approved parameters

Docking prevents face planes from bypassing SentinelOS.

## Operating Rule

```txt
Face planes may vary.
SentinelOS governance does not.
```

Every face plane must operate through:

- policy evaluation
- role and tenant scope
- approval gates
- telemetry review
- audit output
- execution receipts
- drift monitoring where applicable

No face plane should execute directly around the OS.

## Compliance Model

SentinelOS does not need to claim it is a complete compliance product for every regulation.

Instead, it should support compliance by proving:

1. the requirement was mapped
2. the policy was configured
3. the action was evaluated
4. the approval path was enforced
5. the execution result was recorded
6. the audit evidence can be reviewed

For a specific mandate, the build pattern is:

```txt
Mandate or regulation
-> GaaS policy pack
-> docking manifest
-> face plane controls
-> SentinelOS enforcement
-> audit and evidence
```

## Example: Regulated Finance Face Plane

SentinelOS should not become a financing platform.

A regulated finance face plane would provide:

- applicant workflow
- finance workflow
- disclosure workflow
- credit review workflow
- collateral workflow
- adverse action workflow

GaaS would map requirements such as TILA/Reg Z, ECOA, FCRA, or UCC Article 9 into:

- required disclosures
- prohibited actions
- approval requirements
- evidence artifacts
- retention requirements
- audit events

Docking would ensure the face plane cannot:

- execute outside its approved workflow
- expose sensitive data without policy review
- skip required approvals
- bypass audit
- exceed its trust tier

## Product Boundary

Do not say:

```txt
SentinelOS is the OwnerFi app.
SentinelOS is the compliance system of record for every regulation.
SentinelOS replaces the customer's platform.
```

Say:

```txt
SentinelOS is the governed OS.
Face planes are how users operate governed workflows.
GaaS maps requirements into controls.
Docking keeps every face plane inside the approved boundary.
```

## Hardening Implications

1. New customer or domain work starts with a face plane manifest.
2. Every face plane declares requested capabilities.
3. GaaS maps the applicable mandate or policy set before execution is enabled.
4. Docking evaluates the manifest before the face plane can run.
5. Mission Control shows face plane state, approvals, blocked actions, telemetry decisions, and audit evidence.
6. No face plane receives external activation until checks pass.

## Bottom Line

SentinelOS should think bigger by staying smaller at the core.

It becomes more powerful when it remains the governed OS and lets face planes express domain-specific behavior under GaaS and docking control.
