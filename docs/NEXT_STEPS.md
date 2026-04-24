# Next Steps

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## Current Truth
SentinelOS NON-DEMO has a live, shareable OwnerFi proof surface deployed at:

`https://ca-sentinelos-proof.calmhill-388e1d39.eastus2.azurecontainerapps.io/proof`

The deployed image is:

`acrncdevsentinel.azurecr.io/sentinel-api:proof-ui-v2`

Live verification completed on 2026-04-24:
- `/proof` returns the business-result UI
- no-key demo mode runs without external writes
- `/health` returns `database: "enabled"`
- protected OwnerFi submit, evaluate, execute, and audit retrieval work live
- no-key audit access returns `401 Unauthorized`

## Immediate Meeting Prep
1. Rotate the proof API key before wider sharing.
2. Keep the Saturday demo to the controlled 5-minute flow:
   - open `/proof`
   - run no-key demo mode
   - point to Application Submitted, Decision, Deal, and Audit Trail
   - briefly open Technical details
   - close with surface-plane architecture
3. Prepare a one-page Ownership & Structure handout.
4. Keep the core ownership language short:
   - OwnerFi owns brand, workflows, and data.
   - SentinelOS is the system layer that lets the business scale without rebuilding.

## Engineering Next
1. Add basic per-IP rate limiting to `/v1/command`.
2. Connect Container Apps diagnostics to the Sentinel-backed Log Analytics workspace.
3. Verify `command.auth.denied` and `command.executed` events in Log Analytics.
4. Decide whether to commit the broader API, audit, database, and deployment files as one separate release commit.
5. Add a clean operator-facing receipt/audit lookup path.

## Platform Next
1. Formalize tenant and scope contracts.
2. Define role-based key or operator identity model.
3. Keep adding clients as surface planes, not forks.
4. Use `hotelops` as the next placeholder expansion path.
5. Turn repeated proof behavior into reusable onboarding and deployment contracts.

## Do Not Lose
- The live proof is real, deployed, and verified.
- The proof surface now speaks business first and technical detail second.
- OwnerFi is the first active surface plane, not the whole system.
- The next work should harden sharing, monitoring, and ownership clarity before expanding features.
