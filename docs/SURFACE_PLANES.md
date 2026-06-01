# Surface Planes

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Purpose
Define the platform direction for SentinelOS as a shared core with isolated client-facing surface planes.

## Definition
A surface plane is a tenant-isolated operational layer running on SentinelOS.

New clients are deployed as surface planes, not new systems.

## Core Model
SentinelOS keeps one shared execution core:
- command dispatch
- workflow execution
- audit logging
- RBAC and governance
- database access

Each client is represented as a surface plane:
- tenant namespace
- workflow handlers
- tenant-scoped data
- tenant-scoped audit visibility
- tenant-specific UI or proof surface

## Examples
- `ownerfi` -> financing workflows
- `hotelops` -> property workflows
- `operational-upgrade` -> obligation and evidence alignment workflows, internal-only and runtime-held

## Current Implementation Direction
The current repo now supports a compatibility bridge:
- new format: `tenant: "ownerfi", command: "application.submit"`
- legacy format: `ownerfi.application.submit`

Both currently resolve into the same OwnerFi surface plane so existing proof flows continue working while the platform shape evolves.

## Current Rules
- do not fork the core per client
- add new client surfaces through registry and tenant-scoped configuration
- persist `tenant_id` alongside workflow data and audit data
- keep proof surfaces tenant-aware from the start

## Current Surface Registry
Today the registry contains:
- `ownerfi`
- `hotelops`

## Operational Upgrade Faceplane

The Operational Upgrade Faceplane is defined as an internal SentinelOS faceplane pattern for preserving an existing operator motion while adding governance, evidence mapping, approval visibility, drift classification, and receipts.

Current status:
- canonical docs: `docs/OPERATIONAL_UPGRADE_POSITIONING.md`, `docs/OPERATIONAL_UPGRADE_FACEPLANE.md`
- internal legacy alias: `contractreclamation`
- public status: internal only
- runtime status: not ready
- implementation status: held
- required next gate for code repair: `APPROVE_RUNTIME_REGISTRY_CONTRACT_REPAIR_PLAN`

Future tenants should be added as new surface entries, not as separate apps or command forks.

## Near-Term Next Steps
1. add tenant-aware query routes where useful beyond audit
2. add tenant-scoped config loading
3. add multi-tenant RBAC policy mapping
4. add additional surface planes without changing the shared API contract
