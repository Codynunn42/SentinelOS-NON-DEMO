# Executive Desk v1 — Integration Checklist & Next Steps

This checklist guides the full rollout from documentation through end-to-end demo.

## Phase 1: Scaffold & Documentation (✓ Complete)

- [x] Design doc: `docs/EXECUTIVE_DESK_V1.md`
- [x] Panel specs: `apps/executive-desk/panels.md`
- [x] GPT integration: `apps/executive-desk/gpt-integration.md`
- [x] App README: `apps/executive-desk/README.md`

## Phase 2: Core API Services (Implement next)

### Receipt Store Service (Append-only, Signed)

- [ ] Create `services/receipt-store/` with:
  - `store.ts`: append-only receipt ledger (file-based or database)
  - `sign.ts`: HMAC/asymmetric signing for audit verification
  - `verify.ts`: receipt verification and chain-of-custody checking
  - `export.ts`: compliance export (CSV, JSON audit trail)
- [ ] API routes:
  - `POST /api/executive/receipts` → record a receipt
  - `GET /api/executive/receipts?skip=0&limit=100` → paginated receipts
  - `GET /api/executive/receipts/:id` → retrieve single receipt
  - `POST /api/executive/receipts/:id/verify` → verify signature

### Authority Check Service

- [ ] Create `services/authority-check/` with:
  - `check.ts`: consult identity graph and delegation rules
  - `rules.ts`: authority rules engine (who can do what on which resources)
  - `escalate.ts`: logic for escalating to required approvers
- [ ] API routes:
  - `GET /api/executive/authority?scope=...` → list active authorities
  - `POST /api/executive/authority/check` → immediate decision + approvers list
  - `POST /api/executive/authority/delegate` → grant temporary authority

### Risk Gate Service

- [ ] Create `services/risk-gate/` with:
  - `evaluate.ts`: compute risk score and gating decision
  - `probe.ts`: run health checks and readiness probes
  - `mitigate.ts`: suggest mitigations for high-risk actions
- [ ] API routes:
  - `GET /api/executive/risk?scope=...` → current risk snapshot
  - `POST /api/executive/risk/probe` → run fresh health checks
  - `GET /api/executive/risk/history?hours=24` → risk trends

### Briefing Aggregator Service

- [ ] Create `services/briefing-aggregator/` with:
  - `aggregate.ts`: combine telemetry, alerts, policy flags, calendar
  - `rank.ts`: prioritize briefing items by severity and recency
  - `recommend.ts`: suggest actions based on current state
- [ ] API routes:
  - `GET /api/executive/briefing` → prioritized daily briefing
  - `POST /api/executive/briefing/:id/ack` → acknowledge item
  - `GET /api/executive/briefing/recommendations` → action suggestions

## Phase 3: Proxy Endpoint & GPT Integration

- [ ] Deploy proxy at `/proxy/command` (see `gpt-integration.md`)
- [ ] Add authentication (Bearer token, OIDC, or mTLS)
- [ ] Test with sample GPT action schema
- [ ] Document proxy URL and auth setup for production deployment

## Phase 4: Frontend Scaffold (React/Vue/Svelte)

- [ ] Create `apps/executive-desk/components/`:
  - `BriefingPanel.tsx` (or `.vue`, `.svelte`)
  - `AuthorityPanel.tsx`
  - `RiskPanel.tsx`
  - `ReceiptPanel.tsx`
- [ ] Create `apps/executive-desk/layouts/`:
  - `DashboardLayout.tsx` (2x2 grid, resizable panels)
- [ ] Create `apps/executive-desk/hooks/`:
  - `useBriefing()` → fetch & cache briefing items
  - `useAuthority()` → fetch authority records
  - `useRisk()` → fetch risk snapshot
  - `useReceipts()` → fetch receipt ledger

## Phase 5: End-to-End Demo

- [ ] Create demo scenario:
  - User clicks "Approve" on briefing item → triggers decision
  - System runs Authority Check → "Allowed for prod/deploy scope"
  - Risk Gate evaluates → "Pass (infra healthy, no incidents)"
  - Receipt issued and added to ledger
  - UI shows receipt entry with signature and auditReference
- [ ] Create demo flow document: `apps/executive-desk/demo-flow.md`
- [ ] Record or script the demo for stakeholder review

## Deployment Checklist

- [ ] All API services have health check endpoints (`GET /health`)
- [ ] Receipt store is backed by durable storage (not in-memory)
- [ ] Proxy endpoint is behind API gateway with rate limiting
- [ ] Authority check service can load identity graph from production source
- [ ] Risk gate can query real infrastructure health (e.g., Datadog, Azure Monitor)
- [ ] Audit logging is enabled for all command executions
- [ ] Frontend is served over HTTPS with CORS configured
- [ ] GPT integration docs are updated with production proxy URL
- [ ] Team has access to:
  - Runbook for proxy endpoint troubleshooting
  - Audit log access for compliance review
  - Receipt export capability for reporting

## Success Criteria

- [ ] Daily Briefing panel displays real alerts & recommendations
- [ ] Authority Check correctly blocks unauthorized commands
- [ ] Risk Gate prevents commands when infra is degraded
- [ ] Receipt Ledger records all decisions with signatures
- [ ] Custom GPT can execute a command end-to-end (Briefing → Decision → Authority → Risk → Receipt)
- [ ] Audit trail is complete and verifiable
- [ ] All panels respond in < 500ms

## Rollout Plan

1. **Week 1–2**: Implement receipt store and authority check services
2. **Week 3**: Risk gate and briefing aggregator
3. **Week 4**: Proxy endpoint and GPT integration tests
4. **Week 5–6**: Frontend components and layout
5. **Week 7**: End-to-end demo and stakeholder review
6. **Week 8**: Production deployment and monitoring
