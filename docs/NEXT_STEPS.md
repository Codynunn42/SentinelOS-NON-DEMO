# Next Steps

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Current Truth

SentinelOS NON-DEMO has a live, shareable OwnerFi proof surface deployed at:

`https://ca-sentinelos-proof.calmhill-388e1d39.eastus2.azurecontainerapps.io/proof`

The deployed image is:

`acrncdevsentinel.azurecr.io/sentinel-api:governance-preflight-v1`

Live verification completed on 2026-04-25:

- `/proof` returns the business-result UI
- no-key demo mode runs without external writes
- command history, tenant switch, and workflow replay are live
- governance preflight now blocks invalid or unauthorized commands before handlers run
- `/health` returns `database: "enabled"`
- Container App revision `ca-sentinelos-proof--0000005` is running image `acrncdevsentinel.azurecr.io/sentinel-api:governance-preflight-v1`
- protected OwnerFi submit, evaluate, execute, and audit retrieval work live
- protected audit retrieval shows governance preflight blocks
- no-key audit access returns `401 Unauthorized`
- Log Analytics contains `command.auth.denied`, `command.executed`, `command.rate_limited`, and OwnerFi workflow events

## Hardening Focus

1. Keep the current OwnerFi proof path stable.
2. Verify live health before any meeting or share.
3. Keep billing and funnels out of the demo claim unless explicitly scoped.
4. Keep the ownership answer short:
   - OwnerFi owns brand, workflows, and data.
   - SentinelOS is the system layer that lets the business scale without rebuilding.

## Engineering Next

1. Decide whether to commit the remaining planning docs as a separate docs-only cleanup.
2. Add a clean operator-facing receipt/audit lookup path after the meeting.
3. Extend governance from the first preflight rules into a formal role/key model after the meeting.
4. Document billing and funnel readiness without implementing them yet.
5. Consider a custom domain only after the meeting path is stable.

## Platform Next

1. Formalize tenant and scope contracts.
2. Define role-based key or operator identity model.
3. Keep adding clients as surface planes, not forks.
4. Use `hotelops` as the next placeholder expansion path only when the current proof lane is accepted.
5. Treat billing and funnel work as discovery/integration requirements, not current shipped capabilities.

## Do Not Lose

- The live proof is real, deployed, and verified.
- The proof surface now speaks business first and technical detail second.
- OwnerFi is the first active surface plane, not the whole system.
- Key rotation and basic command rate limiting are meeting-readiness hardening, not expansion.
- Monitoring and ownership clarity are now proven enough for the meeting.
- Governance is now pre-execution control, not just post-execution logging.
- Billing and funnels are not ready-to-go in this repo; do not imply they are active.
- The next work should avoid expansion until after the room gives direction.
