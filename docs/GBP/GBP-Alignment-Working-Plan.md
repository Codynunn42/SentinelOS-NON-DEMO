# GBP Alignment Working Plan

## Purpose

Align the Government Deployment Blueprint to source materials before further specialization.

## Source Documents

### Primary Authoritative Sources

- MOB Constant: `docs/GBP/doctrine/NUNN_CORPORATION_MASTER_OPERATING_BINDER_2026-06-15.md`
- MOB Overlay: `docs/GBP/doctrine/JULY_03_MASTER_OPERATING_BLUEPRINT_OVERLAY_2026-07-03.md`
- Executive Template: `docs/governance/SENTINEL_EXECUTIVE_OPERATING_TEMPLATE_2026-07-03.md`
- Executive Template Addendum: `docs/GBP/assessments/SENTINEL_EXECUTIVE_OPERATING_TEMPLATE_JULY_05_ADDENDUM_2026-07-05.md`
- Board Template: `docs/EXECUTIVE_BOARD_2026-07-01.md`
- Board Template Addendum: `docs/GBP/assessments/EXECUTIVE_BOARD_JULY_05_ADDENDUM_2026-07-05.md`

### Supporting Evidence Sources

- `docs/GBP/assessments/MOB_VERIFICATION_MATRIX_ADDENDUM_2026-07-05.md`
- `docs/GBP/assessments/MOB_COMPLETION_QUEUE_REFRESH_OVERLAY_2026-07-05.md`
- `docs/GBP/assessments/MOB_MOVEMENT_MAP_2026-07-05.md`
- `docs/GBP/assessments/MOB_MOVEMENT_QUEUE_PROCESSING_RESULT_2026-07-05.md`
- `docs/GBP/doctrine/JUNE_CLOSEOUT_AND_RUNTIME_ALIGNMENT_SCAN_2026-07-06.md`
- `apps/executive-desk/gates/GATE_8_E2E_DEMO.md`
- `docs/GBP/Mission-Readiness-Index.md`

## Extraction Areas

### MOB

- Core principles
- Inheritance rules
- Non-negotiable controls
- Operating model boundaries
- Overlay model without replacing the MOB constant

### Executive Template

- Executive reporting expectations
- Readiness visibility
- Approval flows
- Mission status presentation
- Executive Desk support boundary
- Local proof vs public proof distinction

### Board Templates

- Oversight requirements
- Governance review cadence
- Decision records
- Evidence review expectations
- Non-authorization boundaries

## Placement Decisions

- MOB-derived content -> GBP baseline and inheritance sections
- Executive template content -> Phase 5 Government Executive Desk
- Board template content -> governance, approvals, reporting, review workflows
- AI docking / control surface -> separate architecture note with references from Phases 3 and 5
- Verification overlays -> supporting evidence, not primary doctrine

## Proposed New/Updated Files

- `docs/GBP/Government-Deployment-Blueprint.md`
- `docs/GBP/Phase-3-Outcome-Engines.md`
- `docs/GBP/Phase-4-Deployment-Profiles.md`
- `docs/GBP/Phase-5-Government-Executive-Desk.md`
- `docs/GBP/AI-Docking-and-Control-Surface.md`

## Immediate Next Steps

1. Extract authoritative statements from the six primary source files.
2. Build a doctrine crosswalk from source -> GBP destination.
3. Add Executive Desk control-surface language to Phase 5.
4. Add non-authorization and oversight boundaries from Board materials.
5. Add inheritance and overlay model from MOB constant + overlay.
6. Keep verification artifacts referenced as evidence, not doctrine.

## Crosswalk Table

| Source | Statement / Requirement | GBP Destination | Action |
| --- | --- | --- | --- |
| `docs/GBP/doctrine/NUNN_CORPORATION_MASTER_OPERATING_BINDER_2026-06-15.md` | MOB remains the constant source; later materials operate as overlays, not replacements | `Government-Deployment-Blueprint.md` / Inheritance | add |
| `docs/GBP/doctrine/JULY_03_MASTER_OPERATING_BLUEPRINT_OVERLAY_2026-07-03.md` | Current operating model may be layered over MOB without replacing it | `Government-Deployment-Blueprint.md` / Profile Inheritance | add |
| `docs/governance/SENTINEL_EXECUTIVE_OPERATING_TEMPLATE_2026-07-03.md` | Executive Desk is an operating surface for guided, governed executive review | `Phase-5-Government-Executive-Desk.md` | add |
| `docs/GBP/assessments/SENTINEL_EXECUTIVE_OPERATING_TEMPLATE_JULY_05_ADDENDUM_2026-07-05.md` | Gate 8 local completion is valid while public GPT proof remains separate | `Phase-5-Government-Executive-Desk.md` | add |
| `docs/EXECUTIVE_BOARD_2026-07-01.md` | Board surface does not itself authorize runtime mutation or broad control actions | `Government-Deployment-Blueprint.md` / Prohibited Behavior | add |
| `docs/GBP/assessments/EXECUTIVE_BOARD_JULY_05_ADDENDUM_2026-07-05.md` | Board / Executive / MOB surfaces must remain synchronized through addenda and review-held overlays | `Phase-4-Deployment-Profiles.md` and governance sections | add |
| `docs/releases/# GBP Phase 5 — Mission Readiness Index .md` | MRI is a required readiness interpretation surface for executive review and must remain visible to AI-guided and governed control-surface flows | `Phase-5-Government-Executive-Desk.md` and `AI-Docking-and-Control-Surface.md` | add |
| `docs/GBP/Executive-Runtime.md` | Executive Runtime is a trusted local execution facilitator and not a governance authority; it preserves session, envelope, authority, evidence, proof-lane, and receipt context across API handoff | `Government-Deployment-Blueprint.md` and `AI-Docking-and-Control-Surface.md` | add |

## First-Pass Doctrine Extraction

### 1. MOB Constant

#### Source

`docs/GBP/doctrine/NUNN_CORPORATION_MASTER_OPERATING_BINDER_2026-06-15.md`

#### Extracted Doctrine

- The MOB is the constant operating binder.
- Later packets, overlays, and addenda do not replace the MOB.
- Operating queues, evidence requirements, and approval boundaries inherit from the MOB.
- Runtime restoration, provenance, and release-manifest refresh remain governed queue items until explicitly cleared.

**GBP implication**

- GBP must be defined as inheriting from a constant source doctrine.
- Deployment profiles must specialize behavior without creating a separate architecture.
- Overlay and addendum mechanisms must be explicitly allowed without permitting source replacement.

### 2. MOB Overlay

**Source:** `docs/GBP/doctrine/JULY_03_MASTER_OPERATING_BLUEPRINT_OVERLAY_2026-07-03.md`

**Extracted doctrine**

- The current operating model may be expressed as an overlay on top of the MOB constant.
- Executive Desk is an owner-facing operating surface.
- Executive Desk does not bypass approval packets.
- The overlay is the current operating-model layer, not a replacement for the underlying binder.

**GBP implication**

- GBP should define an overlay model for current-state specialization.
- Government profiles should be described as overlays and inherited constraints, not forks.
- Executive control surfaces must remain governed and non-bypass.

### 3. Executive Template

**Source:** `docs/governance/SENTINEL_EXECUTIVE_OPERATING_TEMPLATE_2026-07-03.md`

**Extracted doctrine**

- Executive surfaces should present current status, next gates, and held boundaries.
- Executive Desk GPT is an operating surface for guided review.
- GPT or executive assistance is bounded by approval and proof status.
- Executive presentation is valid only when aligned with the current operating model and evidence state.

**GBP implication**

- Phase 5 should define the Government Executive Desk as a governed decision surface.
- Executive displays must show readiness, holds, evidence posture, and next authorized actions.
- Executive assistance must not be treated as direct execution authority.

### 4. Executive Template Addendum

**Source:** `docs/GBP/assessments/SENTINEL_EXECUTIVE_OPERATING_TEMPLATE_JULY_05_ADDENDUM_2026-07-05.md`

**Extracted doctrine**

- Gate 8 local completion is recorded without widening authority.
- Local proof and public proof are separate lanes.
- Gate 9 v2 features remain out of scope for the current v1 posture.
- Addenda are used to bring the executive surface current without replacing the template source.

**GBP implication**

- Phase 5 should distinguish local validation from public/external proof.
- Executive Desk readiness should support layered proof states.
- Out-of-scope future capabilities should be classified separately from current authorization.

### 5. Board Template

**Source:** `docs/EXECUTIVE_BOARD_2026-07-01.md`

**Extracted doctrine**

- The Board recognizes the governance foundation for alignment across Board, Executive Template, and MOB.
- The Board surface is review and oversight oriented.
- The Board surface does not authorize runtime mutation, Azure mutation, external sharing, PR merge, staging, commit, push, deployment, billing activation, funnel activation, broad SentinelOS control, or mutating `/proxy/command` operations.

**GBP implication**

- GBP must include explicit non-authorization boundaries.
- Board-facing surfaces must be defined as oversight and governance layers, not execution layers.
- Prohibited actions should be stated directly in blueprint governance language.

### 6. Board Addendum

**Source:** `docs/GBP/assessments/EXECUTIVE_BOARD_JULY_05_ADDENDUM_2026-07-05.md`

**Extracted doctrine**

- Board drift is remediated through addenda rather than source replacement.
- Board, Executive, and MOB surfaces must remain synchronized.
- Gate observations may be recorded as verified without widening authority.
- Review-held overlays are valid mechanisms for keeping oversight current.

**GBP implication**

- Phase 4 should require synchronized profile governance artifacts.
- Blueprint governance should permit review-held addenda to maintain current truth.
- Oversight surfaces should track verification state without becoming approval substitutes.

### 7. Mission Readiness Index (MRI)

**Source:** `docs/GBP/Mission-Readiness-Index.md`

**Extracted doctrine**

- MRI is a required readiness interpretation surface for executive review.
- MRI should expose readiness state, blockers, degraded factors, and confidence/freshness.
- MRI visibility must be preserved across Executive Desk and AI-guided control surfaces.
- MRI interpretation informs routing and holds; it does not create independent execution authority.

**GBP implication**

- `Phase-5-Government-Executive-Desk.md` should require MRI visibility in executive readiness views.
- `AI-Docking-and-Control-Surface.md` should preserve MRI outputs as governed inputs.
- Blocked/degraded MRI posture must remain intact through advisory and routing flows.

### 8. Executive Runtime

**Source:** `docs/GBP/Executive-Runtime.md`

**Extracted doctrine**

- Executive Runtime is a trusted local execution facilitator.
- It manages session context, command-envelope preparation, Executive Desk API handoff, and local persistence/operator interaction.
- It is not a governance authority and does not grant approvals or widen authorization.
- It must preserve authority, evidence, proof-lane, and receipt/audit context across handoff boundaries.

**GBP implication**

- `Government-Deployment-Blueprint.md` should recognize Executive Runtime as an architectural execution facilitator.
- `AI-Docking-and-Control-Surface.md` should treat Executive Runtime as part of the execution layer behind governed control surfaces.
- Governance authority remains in inherited controls (authority, risk, approval, receipt), not in runtime convenience layers.

## Draft Blueprint Inserts

### Baseline inheritance rule

GBP inherits from the MOB constant and may use overlays, addenda, and review-held current-state records to remain accurate without replacing the underlying source doctrine.

### Executive control-surface rule

The Government Executive Desk is a governed executive operating surface. It may present readiness, evidence, risk, and next authorized actions, but it does not bypass approval packets or underlying governance controls.

### Board non-authorization rule

Board surfaces provide oversight, synchronization, and governance review. They do not themselves authorize runtime mutation, external release, broad platform control, or direct mutating operations.

### Proof-separation rule

Local proof, internal proof, and public proof are separate evidence lanes. Completion in one lane does not imply completion or authorization in another.

## Next Draft Targets

1. Add baseline inheritance language to `Government-Deployment-Blueprint.md`.
2. Add synchronization and overlay language to `Phase-4-Deployment-Profiles.md`.
3. Add Executive Desk control-surface and proof-separation language to `Phase-5-Government-Executive-Desk.md`.
4. Add AI docking as a governed interface note in `AI-Docking-and-Control-Surface.md`.
