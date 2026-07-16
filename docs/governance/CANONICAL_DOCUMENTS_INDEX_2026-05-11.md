# SentinelOS Canonical Documents Index - 2026-05-11

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Purpose

This index compiles all repository documents into canonical categories based on the Sentinel repo scan. Documents are separated into:

- **ACTIVE**: Currently implemented and verified capabilities
- **ROADMAP**: Future capabilities (do not claim as active)
- **OUTREACH**: External-facing assets and presentations
- **ARCHITECTURE**: Technical design and implementation docs
- **GOVERNANCE**: Policy, compliance, and operational doctrine
- **EVIDENCE**: Immutable proof and audit trails
- **INTERNAL**: Development and operational references

## ACTIVE (Currently Implemented & Verified)

### Core Product Capabilities

| Document | Status | Purpose | Evidence |
|---|---|---|---|
| `docs/governance/PROOF_CONTROL_PLANE_RELEASE_2026-05-07.md` | ✅ ACTIVE | Live proof UI and Control Plane verification | Container App deployment verified |
| `docs/governance/SENTINELOS_DEMO_PACKAGE_V2.md` | ✅ ACTIVE | 6-slide demo deck for external use | `[APPROVED:DEMO-PACKAGE]` |
| `docs/governance/SENTINELOS_LIVE_DEMO_SCRIPT_V2.md` | ✅ ACTIVE | Live demo execution script | `[APPROVED:DEMO-PACKAGE]` |
| `docs/governance/SENTINELOS_PROOF_SHEET_V2.md` | ✅ ACTIVE | One-page proof summary | `[APPROVED:DEMO-PACKAGE]` |
| `docs/governance/PROOF_CASE_GOVERNED_DEAL_EXECUTION_V2.md` | ✅ ACTIVE | Governed deal execution workflow | `[APPROVED:REFERENCE-IMPLEMENTATION]` |

### Technical Implementation

| Document | Status | Purpose | Evidence |
|---|---|---|---|
| `docs/governance/FACEPLANE_GAAS_DOCKING_DOCTRINE.md` | ✅ ACTIVE | Face plane and docking protocol | `[APPROVED:FACEPLANE-DOCTRINE]` |
| `docs/governance/FACEPLANE_SDK_SPEC.md` | ✅ ACTIVE | Face plane SDK specification | `[APPROVED:FACEPLANE-SDK-SPEC]` |
| `apps/sentinel/src/faceplanes/sdk/facePlaneSdk.js` | ✅ ACTIVE | Face plane SDK implementation | `[APPROVED:FACEPLANE-SDK]` |
| `apps/sentinel/src/commands/customeropsHandlers.js` | ✅ ACTIVE | Customer operations command handlers | Local and live verified |
| `apps/sentinel/src/schemas/customerops.js` | ✅ ACTIVE | Customer ops validation schemas | Local and live verified |

### Governance & Security

| Document | Status | Purpose | Evidence |
|---|---|---|---|
| `docs/governance/NUNN_GOVERNANCE_DOCTRINE_v1.md` | ✅ ACTIVE | Canonical governance doctrine | `[APPROVED]` - reflects implemented behavior |
| `SECURITY.md` | ✅ ACTIVE | Security posture and API protection | Live verified with API keys |
| `docs/governance/GOVERNANCE_PREFLIGHT.md` | ✅ ACTIVE | Governance preflight checks | `npm run check:governance-preflight` passes |

## ROADMAP (Future Capabilities - Do NOT Claim Active)

| Document | Status | Purpose | Guardrail |
|---|---|---|---|
| `docs/governance/GO_TO_MARKET.md` | 🚫 ROADMAP | GTM strategy and positioning | Do not claim government deployment |
| `docs/governance/GOVERNMENT_POSITIONING.md` | 🚫 ROADMAP | Government sector positioning | Current phase: enterprise pilots → institutional scaling → government alignment |
| `docs/governance/ARIZONA_SPO_MODERNIZATION_BRIEF_LAYOUT.md` | 🚫 ROADMAP | Arizona SPO modernization brief | `[APPROVED:CONTROLLED-RELEASE]` - mark as roadmap, not active |
| `docs/governance/COMMERCIAL_ASSETS_2026-04-29.md` | 🚫 ROADMAP | Commercial asset positioning | `[APPROVED:CONTROLLED-RELEASE]` - mark as roadmap, not active |
| `docs/governance/HERGLASS_FACEPLANE_PLAN.md` | 🚫 ROADMAP | HerGlass face plane integration | Not verified in current checkout |
| `docs/governance/OPENAI_FACEPLANE_PLAN.md` | 🚫 ROADMAP | OpenAI face plane internal pilot plan | Internal governance lab validation |
| `docs/governance/OWNERFI_PILOT_API_SPEC.md` | 🚫 ROADMAP | OwnerFi pilot API specification | Pilot phase, not production |
| `docs/governance/PLATFORM_CONTRACT_OWNERSHIP.md` | 🚫 ROADMAP | Platform contract ownership model | Future governance expansion |
| `docs/governance/INVARIANTS.md` | 🚫 ROADMAP | System invariants and guarantees | Core principles, not all implemented |

### Technology Roadmap (Do NOT Claim)

| Document | Status | Guardrail |
|---|---|---|
| Azure Government deployment | 🚫 ROADMAP ONLY | Current proof: Azure Container Apps standard region |
| Google Edge / public utility distribution | 🚫 ROADMAP ONLY | No local proof in current SentinelOS-NON-DEMO |
| Universal Omni Wallet integration | 🚫 ROADMAP ONLY | Not verified; treat as sibling-system integration |
| Cryptographic build signing | 🚫 ROADMAP ONLY | Release image/tag exists; provenance not verified |
| Phase 1 Government rollout | 🚫 ROADMAP ONLY | Current phase: enterprise pilots → institutional scaling |

## OUTREACH (External-Facing Assets)

### Approved for External Use

| Document | Status | Audience | Restrictions |
|---|---|---|---|
| `docs/governance/SENTINELOS_DEMO_PACKAGE_V2.md` | ✅ EXTERNAL | Partners, prospects | 6-slide deck only |
| `docs/governance/SENTINELOS_PROOF_SHEET_V2.md` | ✅ EXTERNAL | Quick reference | One-page summary |
| `/Users/codynunn/Downloads/SentinelOS_Demo_Deck.pptx` | ✅ EXTERNAL | Presentations | `[APPROVED:DEMO-DECK]` |

### Controlled Release (Add Metadata Before Circulation)

| Document | Status | Required Metadata | Current Block |
|---|---|---|---|
| `docs/governance/ARIZONA_SPO_MODERNIZATION_BRIEF_LAYOUT.md` | ⏸️ CONTROLLED | Add: `[ROADMAP] [GOVERNMENT-POSITIONING]` | No audience boundaries |
| `docs/governance/ARIZONA_SPO_MODERNIZATION_BRIEF_LAYOUT.pdf` | ⏸️ CONTROLLED | Add: `[ROADMAP] [EXTERNAL-ASSET]` | Tie to canonical source |
| `docs/governance/COMMERCIAL_ASSETS_2026-04-29.pdf` | ⏸️ CONTROLLED | Add: `[ROADMAP] [COMMERCIAL-POSITIONING]` | Tie to canonical source |
| `docs/governance/OWNERFI_PILOT_API_SPEC.pdf` | ⏸️ CONTROLLED | Add: `[PILOT] [API-SPEC]` | Mark as pilot, not production |

## ARCHITECTURE (Technical Design & Implementation)

### Core Architecture

| Document | Status | Purpose |
|---|---|---|
| `docs/governance/EXECUTION_ARCHITECTURE.md` | ✅ ARCHITECTURE | Command execution flow |
| `docs/diagrams/sentinelos_architecture_v2.mmd` | ✅ ARCHITECTURE | System architecture diagram |
| `docs/diagrams/governance_pipeline_v2.mmd` | ✅ ARCHITECTURE | Governance enforcement pipeline |
| `docs/diagrams/faceplane_docking_v2.mmd` | ✅ ARCHITECTURE | Face plane integration model |

### Implementation Details

| Document | Status | Purpose |
|---|---|---|
| `docs/governance/DEPLOYMENT.md` | ✅ ARCHITECTURE | Azure Container Apps deployment |
| `docs/governance/BUILD_MANUAL_REVIEW_2026-05-06.md` | ✅ ARCHITECTURE | Build and release posture |
| `docs/governance/SENTINEL_DOCKING_PROTOCOL.md` | ✅ ARCHITECTURE | Docking protocol specification |
| `apps/sentinel/src/types/command.js` | ✅ ARCHITECTURE | Command envelope types |

## GOVERNANCE (Policy & Compliance)

### Canonical Doctrine

| Document | Status | Purpose |
|---|---|---|
| `docs/governance/NUNN_GOVERNANCE_DOCTRINE_v1.md` | ✅ CANONICAL | Governance enforcement language |
| `docs/governance/GOVERNANCE_PREFLIGHT.md` | ✅ CANONICAL | Preflight governance checks |
| `docs/GOVERNANCE_DOCTRINE_v1.md` | ✅ CANONICAL | Core governance principles |

### Operational Governance

| Document | Status | Purpose |
|---|---|---|
| `docs/governance/NUNN_CLOUD_CONTROL_SURFACE_OPERATING_MODEL.md` | ✅ GOVERNANCE | Operating model doctrine |
| `docs/governance/REPO_CONTROL_LAYER.md` | ✅ GOVERNANCE | Repository governance |
| `docs/governance/PLATFORM_CONTRACT_OWNERSHIP.md` | ✅ GOVERNANCE | Contract ownership model |

## EVIDENCE (Immutable Proof & Audit Trails)

### Release Evidence

| Document | Status | Purpose |
|---|---|---|
| `docs/governance/RELEASE_v1.0.0.md` | ✅ EVIDENCE | Initial release evidence |
| `docs/governance/RELEASE_v1.2.0.md` | ✅ EVIDENCE | RBAC and command proof |
| `docs/governance/RELEASE_v1.3.0.md` | ✅ EVIDENCE | Current live deployment |
| `docs/governance/PROOF_CONTROL_PLANE_RELEASE_2026-05-07.md` | ✅ EVIDENCE | Latest proof verification |

### Daily Briefs (Immutable Evidence)

| Document | Status | Purpose |
|---|---|---|
| `docs/DAILY_BRIEF_2026-04-21.md` | ✅ EVIDENCE | Auth boundary establishment |
| `docs/governance/DAILY_BRIEF_2026-04-23.md` | ✅ EVIDENCE | OwnerFi proof path |
| `docs/governance/DAILY_BRIEF_2026-04-24.md` | ✅ EVIDENCE | Productized proof UI |
| `docs/governance/DAILY_REPORT_2026-04-21.md` | ✅ EVIDENCE | Early deployment evidence |

### Executive Snapshots (Immutable Evidence)

| Document | Status | Purpose |
|---|---|---|
| `docs/governance/EXECUTIVE_SNAPSHOT_2026-05-05.md` | ✅ EVIDENCE | Control-plane positioning |
| `docs/governance/EXECUTIVE_SNAPSHOT_2026-05-07.md` | ✅ EVIDENCE | Current verified state |
| `docs/governance/EXECUTIVE_BOARD_2026-05-11.md` | ✅ EVIDENCE | Latest decision board |

## INTERNAL (Development & Operations)

### Development References

| Document | Status | Purpose |
|---|---|---|
| `docs/governance/README.md` | ✅ INTERNAL | Repository navigation index |
| `README.md` | ✅ INTERNAL | Root repository overview |
| `docs/governance/PRODUCT.md` | ✅ INTERNAL | Product definition |
| `docs/governance/INVARIANTS.md` | ✅ INTERNAL | System invariants |

### Operational Scripts

| Document | Status | Purpose |
|---|---|---|
| `package.json` | ✅ INTERNAL | Operator command registry |
| `scripts/sentinel-repo-organization-scan.js` | ✅ INTERNAL | Repo organization utility |
| `scripts/check-control-plane.js` | ✅ INTERNAL | Control plane verification |

### Approval & Decision Records

| Document | Status | Purpose |
|---|---|---|
| `docs/governance/SENTINEL_APPROVAL_NOTICE_2026-05-04.md` | ✅ INTERNAL | Approval notice template |
| `docs/governance/SENTINEL_DECISION_PATTERN_APPROVAL_NOTICE_2026-05-06.md` | ✅ INTERNAL | Decision pattern approval |
| `docs/governance/SENTINEL_APPROVAL_RESUMPTION_2026-05-06.md` | ✅ INTERNAL | Approval resumption record |

## SIMILARITY GROUPS (From Repo Scan)

### README Files (similar_name_1)

- `README.md` (root)
- `apps/README.md`
- `docs/governance/README.md` (canonical internal index)
- `infrastructure/README.md`
- `services/README.md`

**Canonical:** `docs/governance/README.md` for documentation index

### Registry Files (similar_name_2)

- `apps/sentinel/src/commands/registry.js`
- `apps/sentinel/src/surface/registry.js`

**Canonical:** Both active - command vs surface registries

### Forethought Interpretation Files (similar_name_3)

- `apps/sentinel/src/forethought/interpretation.js`
- `apps/sentinel/src/learning/interpretation.js`

**Canonical:** Both active modules - different domains. `TILDA` is an operator logic label, not the system component name.

### Drift Config Files (similar_name_4)

- `apps/sentinel/src/governance/core/driftConfig.js`
- `apps/sentinel/src/governance/vendorOnboarding/driftConfig.js`

**Canonical:** Both active - core vs vendor onboarding

### Drift Monitor Files (similar_name_5)

- `apps/sentinel/src/governance/core/driftMonitor.js`
- `apps/sentinel/src/governance/vendorOnboarding/driftMonitor.js`

**Canonical:** Both active - core vs vendor onboarding

## DECISION LOG

| Decision | Date | Rationale |
|---|---|---|
| Held Public Docs | 2026-05-11 | Approved controlled release with roadmap markers |
| Governance Doctrine | 2026-05-11 | Approved as canonical - reflects implemented behavior |
| Stripe Checkout | 2026-05-11 | Held until onboarding flow finalized |
| Repo Scan | 2026-05-11 | Approved - documentation sprawl risk identified |

## NEXT ACTIONS

1. **Add metadata to controlled release docs** (Arizona SPO, Commercial Assets)
2. **Update external presentations** with roadmap disclaimers
3. **Archive obsolete duplicates** after owner review
4. **Create outreach asset index** for controlled circulation

---

**Guardrail Reminder:** Do NOT claim roadmap items as active capabilities. Use this index to maintain clean separation between implemented features and future plans.


## Phase 2 Movement Update (2026-07-16)

- Movement receipts: docs/reviews/2026-07-16-repository-governance/PHASE2_MOVEMENT_RECEIPTS.csv
- Execution report: docs/reviews/2026-07-16-repository-governance/PHASE2_EXECUTION_REPORT.md
- Reference validation: docs/reviews/2026-07-16-repository-governance/PHASE2_REFERENCE_VALIDATION.md
- Held unresolved items remain in SUPPORT_NEEDED_REGISTER.md
