# Partner Portal Repository Discovery And Control Direction - 2026-06-17

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** read-only local discovery and board control direction  
**Authority Created:** false

## Evidence

| Candidate Evidence | Observation | Classification |
| --- | --- | --- |
| `docs/governance/SENTINELOS_PROJECT_SITUATION_AND_PUBLICATION_CONTROL_INDEX_2026-05-30.md` | Records `Nexus` as a private/internal Client Operations Portal with pilot-ready classification | SentinelOS repository record; not an external partner-portal implementation contract |
| `/Users/codynunn/nunncorp-global-mono/apps/nexus-ui/` | Minimal Next.js Nexus UI exists in the active monorepo; current page is a Stargate-themed command/status surface | implemented frontend candidate; partner roles and workflows not identified |
| `/Users/codynunn/Documents/GitHub/nunncorp-global-mono/apps/nexus-ui/` | Contains an OwnerFI pilot Sentinel console and access-request intake | separate checkout candidate; not an authoritative partner-portal specification |
| `/Users/codynunn/Documents/nunncorp/partner_portal_blueprint.html` | Describes partner onboarding, Nexus UI, governance, SSO, RBAC review, and traceability testing | local design artifact; production-gate instruction is not authorized |
| `/Users/codynunn/Documents/nunncorp/Partner_Portal_Onboarding_Blueprints.pdf` | Partner-portal onboarding blueprint exists | local candidate source; exact authoritative status unresolved |
| `/Users/codynunn/nexus-layer/ARCHITECTURE_MAP.md` | Describes a conceptual public, operator, and partner-facing Harmonic Governance Interface | conceptual architecture in a dirty, divergent repository |
| `/Users/codynunn/Documents/GitHub/nunncorp-global-mono/CLARITY_*.md` and `apps/sentinel/src/rpc/clarity.ts` | Describe and implement an untracked Clarity vault-query candidate | untracked fixture-like candidate; routes are not identified as wired into `index.ts`; not authoritative retrieval proof |
| `apps/sentinel/src/forethought/interpretation.js` and `apps/sentinel/src/learning/interpretation.js` | Interpretation modules exist | supports TILDA as an operator-logic label, not a separate system component |

The alternate-checkout Clarity candidate uses an in-memory registry, randomized
fixture metadata, and a default signing secret fallback. It must not be treated
as a production Memory Layer, authoritative Vault, or approved partner-portal
source of record.

## Interpretation

The repository family supports a portal direction centered on governed,
role-based interaction surfaces. It does not yet establish the exact contracts
required to implement partner portals safely.

The following proposed surface model is accepted for discovery and detailed
design only:

| Surface | Proposed Primary Purpose | Current Evidence State |
| --- | --- | --- |
| Executive Portal | governance, approvals, board state | proposed; executive documents exist, portal contract unresolved |
| Partner Portal | projects, integrations, shared deliverables, onboarding | candidate artifacts found; exact contract unresolved |
| Customer Portal | tenant operations, receipts, status | proposed; OwnerFI pilot surface is candidate evidence only |
| Auditor Portal | evidence, traceability, reports | proposed; audit and receipt foundations exist, portal contract unresolved |

The Sentinel-TILDA relationship is accepted as a control-direction distinction:

- Sentinel records governed facts, approvals, traces, audit events, and receipts.
- TILDA is the operator-logic label for interpretation and must not mutate or
  overwrite authoritative evidence.
- Portal presentation must preserve the boundary between recorded evidence and
  interpreted guidance.

## Conclusion

```yaml
partner_portal_control_direction:
  state: discovery_completed_detailed_design_and_implementation_held
  accepted_direction:
    - role_based_portal_surfaces
    - Sentinel_records_authoritative_evidence
    - TILDA_interprets_without_overwriting_evidence
    - tenant_and_role_boundaries_required
    - full_trace_and_receipt_requirements_required
  unresolved:
    - authoritative_Clarity_source_location_and_access_contract
    - exact_partner_personas_and_roles
    - tenant_isolation_contract
    - portal_workflows_and_state_transitions
    - data_ownership_and_shared_deliverable_contract
    - approval_and_escalation_matrix
    - audit_receipt_and_retention_contract
    - identity_SSO_and_external_RBAC_contract
    - publication_and_branding_rules
    - implementation_repository_and_deployment_target
  query_manifest: docs/governance/CLARITY_MEMORY_LAYER_PARTNER_PORTAL_SPECIFICS_QUERY_MANIFEST_2026-06-17.md
  next_gate: AUTHORIZE_READ_ONLY_CLARITY_PARTNER_PORTAL_SPECIFICS_QUERY
  implementation_authority: false
  source_retrieval_authority: false
  connector_execution_authority: false
  production_access_authority: false
```

## Non-Authorization

This result does not authorize Clarity or Vault retrieval, connector execution,
portal implementation, production access, deployment, staging, commit, push,
customer or partner contact, or external sharing.
