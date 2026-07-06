# Gate 8: E2E Demo

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud
**Mode:** implementation gate, local E2E verification
**External Use:** held
**Authority Created:** false

## Purpose

Prove the Executive Desk v1 local read-only loop end to end:

`GPT-style request -> /proxy/command -> Authority Check -> Risk Gate -> Command -> Receipt -> Report`

## Scope

```yaml
gate: GATE_8_E2E_DEMO
status: verified_complete_local
proxy_surface: POST /proxy/command
command: repo.control.workflow.diagnose
execution_mode: read_only_diagnosis
receipt_lookup: GET /api/executive/receipts/:id
public_gpt_builder_execution: held
public_tunnel_reuse: held
mutating_actions: false
authority_created: false
```

## Verified Flow

1. Local demo client submits a GPT-style workflow diagnosis payload.
2. API adapter routes `POST /proxy/command` to the governed command handler.
3. Command handler validates tenant, command, and `payload.principalId`.
4. Authority Check allows the read-only command for the mock principal.
5. Risk Gate passes the read-only command with low risk.
6. Diagnosis command returns read-only findings.
7. Receipt Ledger records an executed receipt with signature.
8. Demo client fetches the receipt back by `auditReference`.
9. Demo client submits an unsupported mutating command and verifies it is
   blocked with a rejected receipt.

## Verification

```yaml
checks:
  pnpm_run_check_executive_desk_types: passed
  pnpm_run_check_executive_desk_api: 31_passing
  pnpm_run_check_executive_desk_e2e: passed
e2e_command: pnpm run check:executive-desk:e2e
e2e_surface: http://127.0.0.1:3148
verified_receipt_lookup: true
unsupported_mutating_command_blocked: true
authority_created: false
```

## Boundary

Gate 8 proves the local Executive Desk governed loop. It does not prove that a
public GPT Builder Action, Cloudflare tunnel, production gateway, hosted
runtime, customer tenant, or external user can execute the same flow.

Those remain separate proof lanes.

## Non-Authorization

This gate does not authorize deployment, production runtime mutation, Azure
mutation, public tunnel reuse, GPT Builder mutation, external sharing, customer
contact, live billing, checkout activation, pricing publication, production
customer execution, SINTENEX implementation, file movement, staging, commit, or
push.
