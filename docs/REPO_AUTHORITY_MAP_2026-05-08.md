# Repo Authority Map

Date: 2026-05-08
Mode: Phase 1 reality check
Scope: mapping only, no code movement

## Objective

Establish system authority across the active repositories without creating repo sprawl.

Target model:

```text
nunncorp-global-mono -> Brain / source of truth
SentinelOS NON-DEMO -> Execution engine / orchestrator
Other repos -> Managed surfaces
```

## Repository Roles

### nunncorp-global-mono

Classification:

```yaml
role: brain_plus_legacy_execution
desired_role: brain_control_authority
status: partially_aligned
```

Confirmed authority surfaces:

- `packages/shared-libs/src/governance/*` is documented as the authoritative source for governance event contracts and configuration schemas.
- `.github/README.md` defines branch protection, zero-override, no direct commits, no force pushes, and exception process.
- `docs/governance/repository-governance-policy.md` defines the high-level governed automation chain and prohibits governance bypass.
- Release and runbook docs preserve the broader command-plane operating history.

Current drift:

- The repo still contains execution workflows under `.github/workflows/*`.
- Several docs still include direct `git push` / workflow trigger examples.
- The repo is not yet a pure brain; it is a brain with legacy execution and deployment surfaces.

Phase 1 decision:

```yaml
keep_as_brain_candidate: true
do_not_move_code_today: true
flag_manual_execution_language: true
```

### SentinelOS NON-DEMO

Classification:

```yaml
role: execution_engine_orchestrator
desired_role: muscle_under_brain_authority
status: aligned_with_one_policy_drift
```

Confirmed execution surfaces:

- `apps/api/server.js` exposes the runtime routes.
- `apps/sentinel/src/commands/dispatch.js` performs command normalization, governance preflight, handler routing, and audit.
- `apps/sentinel/src/governance/preflight.js` and `policyEngine.js` enforce tenant, actor, role, scope, and risk rules.
- `apps/sentinel/src/audit/auditLogger.js` records audit events with hashes.
- `apps/sentinel/src/controlPlane/*` normalizes intent into command envelopes.
- `apps/sentinel/src/commands/repo/control.js` now governs repo workflow diagnosis and retry decisions.

Current drift:

- NON-DEMO defines command scope mappings locally in `policyEngine.js`.
- In the target model, canonical command and policy schema definitions should come from Global Mono, while NON-DEMO executes them.

Phase 1 decision:

```yaml
keep_runtime_enforcement_here: true
do_not_remove_local_policy_today: true
flag_policy_mapping_for_future_extraction: true
```

### Other Sentinel-Managed Repos

Classification:

```yaml
role: managed_surfaces
status: not_audited_in_this_pass
```

Required future standard:

- Receive commands only through Sentinel.
- Do not define independent governance rules.
- Do not expose direct execution paths that bypass Sentinel.
- Return classified outcomes instead of raw failures.

## Bypass Path Findings

### Confirmed Governance Language

Global Mono already states:

- no direct commits to protected branches
- no force pushes to protected branches
- no admin bypass of required status checks
- no governance bypass without exception request

### Confirmed Runtime Enforcement

NON-DEMO already enforces:

- `/v1/command` as the primary execution route
- Sentinel execution passport via HMAC-signed envelope
- timestamp and nonce replay protection
- tenant and surface scope enforcement
- API key / identity resolution
- tenant, actor, role, and scopes
- policy preflight before handler execution
- audit logging for allowed and blocked outcomes
- untagged, unsigned, replayed, or tampered execution blocked as `UNAUTHORIZED_EXECUTION`

### Drift To Track

```yaml
drift:
  type: authority_boundary_drift
  source:
    - brain repo still contains execution workflows
    - execution repo still defines local policy mappings
    - docs still include direct git/workflow commands
  severity: medium
  next_action: map_before_move
```

## One Bounded Next Action

Create a shared governance standard in Global Mono:

```text
docs/governance/REPO_GOVERNANCE_STANDARD.md
```

It should define:

1. Command entry requirements.
2. Bypass detection requirements.
3. Repo failure classification requirements.
4. Retry and escalation rules.
5. Audit receipt requirements.

Then NON-DEMO can align its `repo.control.*` commands to that standard without moving runtime code yet.

## Guardrails

- Do not refactor both repos at once.
- Do not remove local policy mappings until the shared contract exists.
- Do not add more repo commands beyond diagnose and retry right now.
- Do not treat GitHub platform failures as repo code failures.
- Keep Global Mono as authority candidate, not execution replacement.

## Step 1 Lock Applied

Execution guard added in NON-DEMO:

```text
apps/sentinel/src/governance/executionGuard.js
```

Verification:

```text
npm run check:repo-control
npm run check:policy
npm run check:control-plane
```

Result:

```text
signed Sentinel execution -> allowed
untagged execution -> blocked as unauthorized_execution
source spoof without signature -> blocked as unauthorized_execution:missing_signature
tampered signature -> blocked as unauthorized_execution:bad_signature
passport replay -> blocked as unauthorized_execution:replay
```

## Step 2 Lock Applied

Execution authority is now cryptographically enforced in NON-DEMO:

```text
apps/sentinel/src/governance/executionPassport.js
apps/sentinel/src/governance/executionGuard.js
```

Control Plane and `/v1/command` mint signed passports before dispatch.

Operator-readable authority state:

```text
Execution Authority: ENFORCED
Passport: HMAC + nonce + tenant/surface scope
Unauthorized Outcomes: missing_signature | bad_signature | replay | scope_violation
Next Action: route through Sentinel Control Plane
```
