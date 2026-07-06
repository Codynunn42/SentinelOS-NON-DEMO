# Executive Desk (apps/executive-desk)

This folder contains scaffolding and specs for Executive Desk v1 — a SentinelOS-powered executive UI focused on governed action: Briefing → Decision → Authority Check → Risk Gate → Command → Receipt → Report.

Documentation

- `docs/EXECUTIVE_DESK_V1.md`: high-level design and product vision
- `panels.md`: panel specs for v1 (Daily Briefing, Controlled Access, Risk + Infrastructure Readiness, Receipt Ledger)
- `gpt-integration.md`: GPT action integration pattern and reference implementation
- `openapi.yaml`: OpenAPI 3.1 schema (import into Custom GPT Actions)
- `INTEGRATION_CHECKLIST.md`: phased rollout plan (5 phases, from services to E2E demo)

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

Quick Start

1. **Understand the design:** [docs/EXECUTIVE_DESK_V1.md](../docs/EXECUTIVE_DESK_V1.md)
2. **Review panel specs:** [panels.md](panels.md)
3. **Check proxy implementation status:** [PROXY_IMPLEMENTATION_COMPLETE.md](PROXY_IMPLEMENTATION_COMPLETE.md)
4. **Run proxy harness:** `pnpm run check:executive-desk:proxy`
5. **Run API route suite:** `pnpm run check:executive-desk:api`
6. **Run TypeScript check:** `pnpm run check:executive-desk:types`
7. **Run frontend smoke:** `pnpm run check:executive-desk:frontend`
8. **Run E2E demo smoke:** `pnpm run check:executive-desk:e2e`
9. **Start API server:** `API_HOST=127.0.0.1 API_PORT=3137 pnpm exec tsx apps/executive-desk/server.ts`
10. **Open cockpit:** `http://127.0.0.1:3137/executive`

Next Steps

- Keep Gate 8 in regression proof while any public GPT Builder or tunnel proof remains separately held.
- Gate 9: v2 features remain out of scope for v1.
