# SentinelOS Outreach Assets Organization - 2026-05-11

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Purpose

Organized index of all external-facing assets based on repo scan. Separates approved external materials from controlled/internal assets.

## APPROVED EXTERNAL ASSETS (Ready for Circulation)

### Demo Package (Fully Approved)

| Asset | Status | Audience | Restrictions | Evidence |
|---|---|---|---|---|
| `docs/SENTINELOS_DEMO_PACKAGE_V2.md` | ✅ APPROVED | Partners, prospects | 6-slide deck only | `[APPROVED:DEMO-PACKAGE]` |
| `docs/SENTINELOS_LIVE_DEMO_SCRIPT_V2.md` | ✅ APPROVED | Demo presenters | Live execution guide | `[APPROVED:DEMO-PACKAGE]` |
| `docs/SENTINELOS_PROOF_SHEET_V2.md` | ✅ APPROVED | Quick reference | One-page summary | `[APPROVED:DEMO-PACKAGE]` |
| `/Users/codynunn/Downloads/SentinelOS_Demo_Deck.pptx` | ✅ APPROVED | Presentations | 6-slide deck | `[APPROVED:DEMO-DECK]` |

### Proof Case Materials

| Asset | Status | Audience | Restrictions | Evidence |
|---|---|---|---|---|
| `docs/PROOF_CASE_GOVERNED_DEAL_EXECUTION_V2.md` | ✅ APPROVED | Technical prospects | Reference implementation | `[APPROVED:REFERENCE-IMPLEMENTATION]` |
| `docs/diagrams/sentinelos_architecture_v2.mmd` | ✅ APPROVED | Architecture discussions | High-level only | `[APPROVED:DEMO-PACKAGE]` |
| `docs/diagrams/governance_pipeline_v2.mmd` | ✅ APPROVED | Governance discussions | Block path visible | `[APPROVED:DEMO-PACKAGE]` |
| `docs/diagrams/faceplane_docking_v2.mmd` | ✅ APPROVED | Integration discussions | Face plane model | `[APPROVED:DEMO-PACKAGE]` |

## CONTROLLED RELEASE ASSETS (Add Metadata Before Circulation)

### Government & Public Sector

| Asset | Current Status | Required Metadata | Circulation Rules |
|---|---|---|---|
| `docs/ARIZONA_SPO_MODERNIZATION_BRIEF_LAYOUT.md` | ⏸️ CONTROLLED | `[ROADMAP] [GOVERNMENT-POSITIONING]` | Add disclaimer: "Future capability, not current deployment" |
| `docs/ARIZONA_SPO_MODERNIZATION_BRIEF_LAYOUT.pdf` | ⏸️ CONTROLLED | `[ROADMAP] [EXTERNAL-ASSET]` | Tie to canonical source, mark as positioning brief |
| `docs/GOVERNMENT_POSITIONING.md` | ⏸️ CONTROLLED | `[ROADMAP] [GOVERNMENT-STRATEGY]` | Current phase: enterprise pilots → institutional scaling |

### Commercial & Enterprise

| Asset | Current Status | Required Metadata | Circulation Rules |
|---|---|---|---|
| `docs/COMMERCIAL_ASSETS_2026-04-29.md` | ⏸️ CONTROLLED | `[ROADMAP] [COMMERCIAL-POSITIONING]` | Add disclaimer: "Strategic positioning, not active product" |
| `docs/COMMERCIAL_ASSETS_2026-04-29.pdf` | ⏸️ CONTROLLED | `[ROADMAP] [EXTERNAL-ASSET]` | Tie to canonical source, mark as positioning document |
| `docs/GO_TO_MARKET.md` | ⏸️ CONTROLLED | `[ROADMAP] [GTM-STRATEGY]` | Do not claim government deployment readiness |

### Technical Specifications

| Asset | Current Status | Required Metadata | Circulation Rules |
|---|---|---|---|
| `docs/OWNERFI_PILOT_API_SPEC.pdf` | ⏸️ CONTROLLED | `[PILOT] [API-SPEC]` | Mark as pilot phase, not production API |
| `docs/FACEPLANE_SDK_SPEC.md` | ✅ APPROVED | `[ACTIVE] [TECHNICAL-SPEC]` | Approved face plane contract |
| `docs/SENTINEL_DOCKING_PROTOCOL.md` | ✅ APPROVED | `[ACTIVE] [INTEGRATION-SPEC]` | Approved docking protocol |

## INTERNAL ASSETS (Do Not Circulate Externally)

### Development & Proof Materials

| Asset | Status | Purpose | Restrictions |
|---|---|---|---|
| `docs/DAILY_BRIEF_2026-04-21.md` | 🔒 INTERNAL | Auth boundary evidence | Immutable proof trail |
| `docs/DAILY_BRIEF_2026-04-23.md` | 🔒 INTERNAL | OwnerFi proof path | Immutable proof trail |
| `docs/DAILY_BRIEF_2026-04-24.md` | 🔒 INTERNAL | Proof UI development | Immutable proof trail |
| `docs/DAILY_REPORT_2026-04-21.md` | 🔒 INTERNAL | Early deployment evidence | Immutable proof trail |

### Executive & Decision Records

| Asset | Status | Purpose | Restrictions |
|---|---|---|---|
| `docs/EXECUTIVE_SNAPSHOT_2026-05-05.md` | 🔒 INTERNAL | Control-plane positioning | Decision evidence |
| `docs/EXECUTIVE_SNAPSHOT_2026-05-07.md` | 🔒 INTERNAL | Current verified state | Decision evidence |
| `docs/EXECUTIVE_BOARD_2026-05-11.md` | 🔒 INTERNAL | Latest decision board | Active working board |
| `docs/SENTINEL_APPROVAL_NOTICE_2026-05-04.md` | 🔒 INTERNAL | Approval templates | Internal governance |

### Operational Documentation

| Asset | Status | Purpose | Restrictions |
|---|---|---|---|
| `docs/DEPLOYMENT.md` | 🔒 INTERNAL | Azure deployment guide | Operational reference |
| `docs/BUILD_MANUAL_REVIEW_2026-05-06.md` | 🔒 INTERNAL | Build posture review | Internal alignment |
| `docs/REPO_CONTROL_LAYER.md` | 🔒 INTERNAL | Repository governance | Internal policy |

## ROADMAP CLAIMS (Do NOT Present as Active)

### Technology Claims (Prohibited)

| Claim | Status | Correct Wording |
|---|---|---|
| Azure Government deployment | 🚫 PROHIBITED | "Roadmap: Azure Government isolated nodes" |
| Google Edge distribution | 🚫 PROHIBITED | "Roadmap: Google Edge / public utility delivery" |
| Universal Omni Wallet | 🚫 PROHIBITED | "Roadmap: Universal wallet integration" |
| Cryptographic build signing | 🚫 PROHIBITED | "Roadmap: Build provenance verification" |
| Phase 1 Government rollout | 🚫 PROHIBITED | "Current: Enterprise pilots phase" |

### Positioning Claims (Controlled)

| Claim | Status | Required Disclaimer |
|---|---|---|
| Government modernization | ⏸️ CONTROLLED | "Strategic positioning for future government alignment" |
| Commercial asset management | ⏸️ CONTROLLED | "Enterprise positioning framework" |
| API specifications | ⏸️ CONTROLLED | "Pilot specifications, subject to change" |

## CIRCULATION CHECKLIST

### Before External Distribution

- [ ] Add metadata tags (e.g., `[ROADMAP]`, `[PILOT]`, `[ACTIVE]`)
- [ ] Include appropriate disclaimers
- [ ] Tie PDFs/assets to canonical source documents
- [ ] Verify audience boundaries (internal vs external)
- [ ] Confirm no roadmap claims presented as active
- [ ] Check for sensitive architecture exposure

### Approved Distribution Channels

| Channel | Approved Assets | Restrictions |
|---|---|---|
| **Partner Presentations** | Demo deck, proof sheet | 6-slide limit, no deep architecture |
| **Technical Discussions** | Architecture diagrams, face plane specs | High-level only, no implementation details |
| **Positioning Briefs** | Controlled release docs | Must include roadmap disclaimers |
| **Pilot Engagements** | API specs marked as pilot | Clearly labeled as non-production |

## DECISION LOG

| Asset | Decision | Date | Rationale |
|---|---|---|---|
| Demo Package v2 | ✅ APPROVED | 2026-05-06 | Consistent proof story, verified locally |
| Arizona SPO Brief | ⏸️ CONTROLLED | 2026-05-11 | Add roadmap markers before circulation |
| Commercial Assets | ⏸️ CONTROLLED | 2026-05-11 | Add positioning disclaimers |
| OwnerFi API Spec | ⏸️ CONTROLLED | 2026-05-11 | Mark as pilot phase |

## NEXT ACTIONS

1. **Add metadata to controlled assets** before any external circulation
2. **Create circulation templates** with required disclaimers
3. **Audit existing presentations** for roadmap claim violations
4. **Establish approval gate** for new external assets

---

**Key Principle:** External assets must maintain clean separation between proven capabilities and strategic positioning. Never present roadmap items as active deployments.