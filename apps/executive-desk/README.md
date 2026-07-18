# Executive Desk (apps/executive-desk)

Mission first. Technology second.

Leadership Fast Path

1. Board index: [government-readiness/BOARD_INDEX.md](government-readiness/BOARD_INDEX.md)
2. Phase 6 doctrine: [government-readiness/governance/GBP_PHASE_6_OPERATIONAL_DOCTRINE.md](government-readiness/governance/GBP_PHASE_6_OPERATIONAL_DOCTRINE.md)
3. Mission package framework: [government-readiness/governance/GBP_PHASE_6_MISSION_PACKAGE_TEMPLATE_CISA_GOVERNANCE_OVERLAY.md](government-readiness/governance/GBP_PHASE_6_MISSION_PACKAGE_TEMPLATE_CISA_GOVERNANCE_OVERLAY.md)
4. ORL scorecard: [government-readiness/governance/GBP_PHASE_6_ORL_ASSESSMENT_SCORECARD_TEMPLATE.md](government-readiness/governance/GBP_PHASE_6_ORL_ASSESSMENT_SCORECARD_TEMPLATE.md)
5. Promotion policy: [government-readiness/governance/CERTIFICATION_PROMOTION_POLICY.md](government-readiness/governance/CERTIFICATION_PROMOTION_POLICY.md)

This folder contains scaffolding and specs for Executive Desk v1 — a SentinelOS-powered executive UI focused on governed action: Briefing → Decision → Authority Check → Risk Gate → Command → Receipt → Report.

Executive Priority

Turn Sentinel AI + Executive Desk into a revenue-producing business while maintaining governance, with government relationship building and readiness to start a government engagement as the leading motion.

Operating Summary

- Ready to go: governance doctrine, cadence, board reporting, MOB integration, government messaging, and Gate 6-8 verification.
- Focus now: GBP mission package, government relationship building, readiness assets, pilot readiness, and Sentinel AI runtime verification.
- Scan logic: use Sentinel AI to enact the user's logic, show what is ready, and surface the highest-value focus areas for government engagement.

Documentation

- `docs/EXECUTIVE_DESK_V1.md`: high-level design and product vision
- `panels.md`: panel specs for v1 (Daily Briefing, Controlled Access, Risk + Infrastructure Readiness, Receipt Ledger)
- `gpt-integration.md`: GPT action integration pattern and reference implementation
- `openapi.yaml`: OpenAPI 3.1 schema (import into Custom GPT Actions)
- `INTEGRATION_CHECKLIST.md`: phased rollout plan (5 phases, from services to E2E demo)
- `SENTINEL_AI_WORK_PACKET_DOE_EXECUTIVE_ASSESSMENT.md`: hosted Sentinel AI work packet for DOE-oriented assessment and hardening

Government Readiness (Executive Artifacts)

- `government-readiness/BOARD_INDEX.md`: board-facing entry point for Phase 6 review
- `GOVERNMENT_READINESS_DAILY_CADENCE_2026-07-14.md`: daily mission cadence and end-of-day success criteria
- `government-readiness/README.md`: Government Readiness Library overview and usage
- `government-readiness/DOE/EXECUTIVE_INTRODUCTION_ONE_PAGER.md`: executive introduction for government outreach
- `government-readiness/DOE/GOVERNMENT_EXECUTIVE_DESK_OVERVIEW.md`: executive desk overview for government audiences
- `government-readiness/DOE/OUTCOME_FIRST_MESSAGING.md`: outcome-first positioning language and guardrails
- `government-readiness/DOE/DISCOVERY_MEETING_FRAMEWORK.md`: discovery framework for executive outreach meetings
- `government-readiness/DOE/GOVERNMENT_CONTACT_LIST.md`: relationship-first government contact tracker
- `government-readiness/executive-intelligence/EXECUTIVE_INTELLIGENCE_BRIEF_DOCTRINE.md`: permanent doctrine for Executive Intelligence Briefs
- `government-readiness/deployment-profiles/GOVERNMENT_DEPLOYMENT_BLUEPRINT_2026-07-14.md`: federal profile refinement and compatibility matrix
- `government-readiness/governance/EXECUTIVE_REVIEW_CHECKLIST_GOVERNMENT_POSTURE.md`: executive review checklist for posture alignment
- `government-readiness/mission-outcomes/GOVERNMENT_OUTCOME_REFERENCE_LIBRARY_OUTLINE.md`: stretch-goal outline organized by mission outcomes

Implementation Status

- ✅ Gate 1: Documentation-first scaffold (complete)
- ✅ Gate 2: Proxy action implementation (complete)
  - Read-only handler for `repo.control.workflow.diagnose`
  - Authority Check, Risk Gate, Receipt Ledger services
  - Full governance metadata in response
  - Test harness with 4 test cases
- ✅ Gate 3: Receipt persistence (complete)
- ✅ Gate 4: Authority integration (complete)
- ✅ Gate 5: Risk gate integration (complete)
- ✅ Gate 6: API routes (verified 2026-07-03)
  - Receipt, delegation, and risk endpoints mounted under `/api/executive`
  - Principal header required for protected routes
  - Route tests, proxy harness, TypeScript check, and localhost smoke passed
- ✅ Gate 7: Frontend components (verified 2026-07-03)
  - Read-only cockpit served at `/executive`
  - Four panels connected to Gate 6 APIs
  - Frontend route/assets covered by API route tests
- ✅ Gate 8: E2E demo (verified 2026-07-05)
  - Local GPT-style request posts to `/proxy/command`
  - Authority Check, Risk Gate, command execution, receipt creation, and receipt lookup verified
  - Public GPT Builder/tunnel execution remains separate and held
- ✅ Sentinel AI remote connector
  - Hosted Sentinel AI status and scan endpoints mounted under `/api/executive/sentinel-ai`
  - Scan output folds in roadmap, checklist, work packet, readiness, cost, and green-energy signals
  - Remote endpoint uses `SENTINEL_AI_BASE_URL` plus optional bearer token and timeout settings

Quick Start

1. **Understand the design:** [docs/EXECUTIVE_DESK_V1.md](../docs/EXECUTIVE_DESK_V1.md)
2. **Review board index:** [government-readiness/BOARD_INDEX.md](government-readiness/BOARD_INDEX.md)
3. **Review panel specs:** [panels.md](panels.md)
4. **Check proxy implementation status:** [PROXY_IMPLEMENTATION_COMPLETE.md](PROXY_IMPLEMENTATION_COMPLETE.md)
5. **Run proxy harness:** `pnpm run check:executive-desk:proxy`
6. **Run API route suite:** `pnpm run check:executive-desk:api`
7. **Run TypeScript check:** `pnpm run check:executive-desk:types`
8. **Run frontend smoke:** `pnpm run check:executive-desk:frontend`
9. **Run E2E demo smoke:** `pnpm run check:executive-desk:e2e`
10. **Start API server:** `API_HOST=127.0.0.1 API_PORT=3137 pnpm exec tsx apps/executive-desk/server.ts`
11. **Probe Sentinel AI status:** `curl -H 'X-Principal-Id: user@example.com' http://127.0.0.1:3137/api/executive/sentinel-ai/status`
12. **Run Sentinel AI scan:** `curl -X POST -H 'X-Principal-Id: user@example.com' -H 'Content-Type: application/json' -d '{"focus":"hardening"}' http://127.0.0.1:3137/api/executive/sentinel-ai/scan`
13. **Open cockpit:** `http://127.0.0.1:3137/executive`

Production proxy auth

- Set `AUTH_ENABLED=true` to require bearer auth on `POST /proxy/command`.
- Set `AUTH_BEARER_TOKEN=<strong-random-token>` (preferred).
- If `AUTH_BEARER_TOKEN` is unset, `JWT_SECRET` is used as fallback.
- Use this token in GPT Action auth or upstream API gateway auth policy.

Sentinel AI remote connector

- Set `SENTINEL_AI_BASE_URL` to the hosted Sentinel AI endpoint.
- Optionally set `SENTINEL_AI_HEALTH_PATH` and `SENTINEL_AI_SCAN_PATH` if the remote paths differ from `/health` and `/scan`.
- Set `SENTINEL_AI_BEARER_TOKEN` when the hosted service expects Authorization bearer auth.
- Set `SENTINEL_AI_API_KEY` when the hosted service expects API-key auth.
- Set `SENTINEL_AI_API_KEY_HEADER` to override the API-key header name (defaults to `x-api-key`).
- Set `SENTINEL_AI_TIMEOUT_MS` to tune the probe timeout for slower gateways.
- Set `SENTINEL_AI_REASONING_LENS=quantitative_accuracy` to keep Sentinel AI optimized for accuracy, traceable reasoning, and defensible evidence over raw speed claims.
- Use `GET /api/executive/sentinel-ai/status` to confirm reachability before scan-driven course setting.
- Use `POST /api/executive/sentinel-ai/scan` to synthesize the current hardening, cost-reduction, and green-energy course from local and remote signals.

Executive Status Note

- Before: Sentinel AI returned posture and hardening guidance only.
- After: The scan/status payload now publishes a structured `efficiencyPlan` for cost, latency, compute, and green-mode actions.
- Plan: Keep the hosted connection gated, then use Sentinel AI to trim cost, reduce latency, right-size compute, and apply the green energy module.

Next Steps

- Keep Gate 8 in regression proof while any public GPT Builder or tunnel proof remains separately held.
- Gate 9: v2 features remain out of scope for v1.

Local SentinelOS Executive Desk Runtime

- PowerShell orchestration entrypoint: `pwsh ./scripts/sentinel.ps1`
- Local-only mode with governed report output and no external mutation.
- Business rules and report composition are implemented in TypeScript runtime modules under `apps/executive-desk`.

Required command set:

- `pwsh ./scripts/sentinel.ps1 executive daily`
- `pwsh ./scripts/sentinel.ps1 executive weekly`
- `pwsh ./scripts/sentinel.ps1 executive monthly`
- `pwsh ./scripts/sentinel.ps1 executive board`
- `pwsh ./scripts/sentinel.ps1 government readiness`
- `pwsh ./scripts/sentinel.ps1 mob review`
- `pwsh ./scripts/sentinel.ps1 evidence scan`
- `pwsh ./scripts/sentinel.ps1 outcome status`
- `pwsh ./scripts/sentinel.ps1 health`
- `pwsh ./scripts/sentinel.ps1 help`

Optional aliases:

- `pwsh ./scripts/sentinel.ps1 daily`
- `pwsh ./scripts/sentinel.ps1 weekly`
- `pwsh ./scripts/sentinel.ps1 monthly`
- `pwsh ./scripts/sentinel.ps1 board`

Dry run:

- `pwsh ./scripts/sentinel.ps1 executive daily -WhatIf`

Generated report targets:

- `docs/executive-desk/daily/YYYY-MM-DD.md`
- `docs/executive-desk/weekly/YYYY-Www.md`
- `docs/executive-desk/monthly/YYYY-MM.md`
- `docs/executive-desk/board/YYYY-MM.md`
- `docs/executive-desk/government-readiness/YYYY-MM-DD.md`
- `docs/executive-desk/evidence/YYYY-MM-DD-evidence-index.json`
- `docs/executive-desk/evidence/YYYY-MM-DD-evidence-summary.md`
