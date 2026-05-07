# Face Plane SDK Spec

Status: initial hardening scaffold

## Purpose

The Face Plane SDK defines how a surface is registered with SentinelOS without changing the SentinelOS core. A face plane is an operating surface for a tenant, customer, regulation, or workflow. The OS remains the authority; the face plane declares what it wants to do.

## Contract

Every face plane must produce a manifest with:

- `facePlaneId`
- `tenantId`
- `name`
- `purpose`
- `owner`
- `gaasPolicyPack`
- `requestedCapabilities`
- `approvalModel`
- `telemetryMode`
- `dataClasses`
- `evidence`

The SDK validates the manifest, hashes it, converts it into a Universal Docking Protocol manifest, and evaluates whether it can register, must wait for approval, or must be blocked.

## Lifecycle

1. Surface architect drafts a face plane manifest.
2. SDK normalizes and hashes the manifest.
3. Docking evaluates requested capabilities and trust tier.
4. GaaS policy pack is bound to the manifest.
5. Sentinel returns one of:
   - `REGISTERABLE`
   - `PENDING_APPROVAL`
   - `RESTRICTED`
   - `INVALID`
6. Only approved surfaces can execute governed actions.

## Capability Model

Low-risk capabilities:

- `FACEPLANE_READ`
- `DOCKING_MANIFEST_REGISTER`
- `READ_STATUS`
- `READ_TELEMETRY`

Medium-risk capabilities:

- `FACEPLANE_WRITE`
- `GAAS_POLICY_APPLY`

High-risk capabilities:

- `FACEPLANE_EXECUTE`
- `FACEPLANE_EXPORT`

High-risk capabilities require approval before execution.

## Governance Rules

- A face plane cannot bypass SentinelOS command execution.
- A face plane cannot execute without an approval model.
- A face plane cannot export telemetry unless the policy pack allows it.
- A face plane must identify its tenant, owner, data classes, and evidence.
- The GaaS policy pack is mandatory because it maps the surface to the relevant compliance and governance obligations.

## Reference Fixture

`fixtures/faceplanes/governed-workflow-faceplane.json` demonstrates a governed workflow face plane for Nunn Cloud.

## Verification

Run:

```bash
npm run check:faceplane-sdk
```

The check verifies:

- manifest construction
- manifest validation
- docking manifest conversion
- high-risk approval behavior
- registration event creation
- invalid manifest blocking
