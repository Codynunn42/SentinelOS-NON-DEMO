# Sentinel AI Record Classification And Access Segregation Policy - 2026-06-12

**COMM:** Cody Dale Nunn | Nunn Cloud  
**Directive:** `RECORD_CLASSIFICATION_AND_ACCESS_SEGREGATION_POLICY`  
**State:** founder-directed governance policy recorded; implementation held  
**Authority Created:** bounded classification and investigation-routing direction only

## Purpose

Ensure Sentinel AI investigations remain focused while preserving founder,
corporate, infrastructure, financial, strategic, and governance records without
investigation-driven deletion.

## Core Principle

```text
NO RECORD DELETION
```

No record may be deleted merely because it is unrelated to the active
investigation. Every encountered record must be classified, routed, retained,
and governed under its category-specific access policy.

Any legally required disposition, privacy deletion, authorized records
schedule, or other destruction requirement is outside this investigation
routing policy and requires a separate, explicit, lawful-disposition review and
approval. Sentinel AI may not infer that authority.

## Required Record Handling

When a record is encountered:

1. Determine whether it supports the current investigation.
2. Assign its primary record category.
3. Preserve the original record and provenance.
4. Route it through classification metadata or an approved record location.
5. Apply the category-specific access policy.
6. Record any cross-category relationship without duplicating or rewriting the
   authoritative evidence.
7. Continue the active investigation.

Classification does not authorize physical movement, repository changes,
external transfer, access-grant changes, or deletion. Those actions require
separate exact authority.

## Record Categories And Access Policy

### 1. Infrastructure Records

**Scope**

- Sentinel AI deployment
- SentinelOS
- Azure resources and Azure Foundry
- Docker and container infrastructure
- Vault, PostgreSQL, and memory-layer evidence
- compute resources and datacenter operations
- IBM server investigation
- deployment manifests, health monitoring, and network architecture

**Policy Entitlements**

- Infrastructure Team
- Founder
- Authorized Technical Governance

### 2. Founder Legacy Records

**Scope**

- family housing and vehicles
- legacy gifting and estate planning
- museum initiatives and legacy onboarding packets
- family support programs
- legacy property planning
- historical founder commitments
- legacy stewardship activities

**Policy Entitlements**

- Founder
- Legacy Division
- Authorized Estate Governance

### 3. Governance Records

**Scope**

- board directives
- approval workflows and audit policies
- constitutional controls and delegation authority
- risk management

**Policy Entitlements**

- Founder
- Governance Officers
- Authorized Auditors

### 4. Financial Records

**Scope**

- capital allocations and treasury activity
- procurement records and purchase approvals
- vendor contracts and escrow documentation

**Policy Entitlements**

- Founder
- Finance
- Authorized Auditors

### 5. Strategic Records

**Scope**

- roadmaps and partnership planning
- expansion initiatives and market analysis
- executive planning

**Policy Entitlements**

- Founder
- Executive Team

## Classification Rules

- Assign one primary category based on the record's controlling purpose.
- Record secondary relationships as cross-references.
- Preserve provenance, source location, custody, and handling restrictions.
- Do not change an authoritative record to make it fit a category.
- Do not treat policy entitlement as proof that repository, platform, or
  document-level access controls are currently implemented.
- Do not expose Founder Legacy materials during an Infrastructure investigation
  unless the Founder specifically requests them or a separately authorized
  evidence review establishes direct relevance.
- Stop and prepare a conflict summary for Founder review when category,
  ownership, sensitivity, legal hold, or access entitlement is unclear.

## Active Investigation

```yaml
active_investigation:
  category: Infrastructure_Records
  objectives:
    - discover_Sentinel_deployment_footprint
    - discover_memory_layer_architecture
    - discover_compute_infrastructure
    - discover_current_hosting_environment
    - trace_IBM_server_evidence
  founder_legacy_materials:
    preservation: required
    active_investigation_access: excluded_unless_specifically_requested_by_Founder
  unrelated_records:
    delete: prohibited
    classify: required
    route: required
    retain: required
  external_discovery_authority: false
  access_control_implementation_authority: false
```

## Access Segregation State

The access lists in this directive establish the intended policy entitlement
model. They do not prove or authorize current ACL, RBAC, repository permission,
identity-provider, Vault policy, database-role, or external-platform changes.

Before implementation:

- inventory the authoritative record locations;
- map existing identities, groups, roles, and controls;
- identify conflicts and records with overlapping custody;
- define least-privilege enforcement and emergency-access handling;
- define audit receipts, access-review cadence, and revocation behavior;
- prepare an exact implementation and rollback manifest;
- obtain the separate exact implementation approval.

## Preserved Holds

- no record deletion
- no physical record or repository movement
- no ACL, RBAC, identity, Vault, database-role, or permission mutation
- no Azure, Foundry, KQL, network, connector, or health-probe execution
- no AI operating-setup change
- no staging, commit, push, deployment, external sharing, or external contact

## Next Gates

```yaml
next_gates:
  active_investigation: REVIEW_READ_ONLY_CURRENT_SENTINEL_DEPLOYMENT_FOOTPRINT_DISCOVERY_SCOPE
  classification_operating_model: PREPARE_RECORD_CLASSIFICATION_AND_ACCESS_SEGREGATION_OPERATING_MODEL
  access_control_implementation: REQUEST_EXACT_RECORD_ACCESS_SEGREGATION_IMPLEMENTATION_REVIEW
  lawful_disposition_exception: REQUEST_EXACT_LAWFUL_RECORD_DISPOSITION_REVIEW
  authority_created: false
```
