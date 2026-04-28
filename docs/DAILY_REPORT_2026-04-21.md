# Daily Report — 2026-04-21

**Prepared:** 2026-04-21 MST
**Focus:** SentinelOS NON-DEMO auth hardening, Microsoft Sentinel readiness, and `nunncorporation.com` OwnerFI pilot positioning

## Executive Summary

Today moved the platform from open demo behavior toward controlled, monitorable execution.

The strongest outcomes were:

- `/command` in `SentinelOS-NON-DEMO` was locked behind `SENTINEL_API_KEY`
- structured security events were added so Azure Container Apps logs can flow into Microsoft Sentinel
- Azure Container App secret and environment variable wiring were completed for the live API
- live `/health` was confirmed in Azure
- `nunncorporation.com` was updated in the monorepo to present an `OwnerFI Pilot on SentinelOS` instead of the prior hotel-oriented demo scenario
- the `apps/nexus-ui` production build and targeted lint pass completed successfully after repairing a damaged monorepo dependency tree

## Work Completed

### 1. SentinelOS NON-DEMO API auth boundary

Repository:

- `/Users/codynunn/SentinelOS/SentinelOS-NON-DEMO/SentinelOS-NON-DEMO`

Completed:

- added `REQUIRED_API_KEY = process.env.SENTINEL_API_KEY`
- updated `/command` to fail closed
- unauthorized requests now return `401 Unauthorized`
- missing server key returns `500 Server misconfigured: missing API key`
- valid requests preserve the receipt-based execution response

Files changed:

- `apps/api/server.js`
- `azure/container-app.yaml`
- `.env.example` was already aligned and used as the contract reference

Local verification completed:

- `node --check apps/api/server.js`
- unauthorized local `POST /command` returned blocked
- authorized local `POST /command` returned executed with receipt
- unset server key path returned `500`

### 2. Microsoft Sentinel phase-1 integration path

Repository:

- `/Users/codynunn/SentinelOS/SentinelOS-NON-DEMO/SentinelOS-NON-DEMO`

Completed:

- added structured stdout security events:
  - `command.auth.misconfigured`
  - `command.auth.denied`
  - `command.request.invalid_json`
  - `command.request.blocked`
  - `command.executed`
- documented the Microsoft Sentinel integration path and KQL verification queries
- updated security, deployment, docs index, and status reporting to reflect the new monitored-control posture

Files changed:

- `apps/api/server.js`
- `docs/MICROSOFT_SENTINEL.md`
- `docs/DEPLOYMENT.md`
- `docs/README.md`
- `SECURITY.md`
- `STATUS_REPORT.md`

Local verification completed:

- structured JSON events were emitted for both denied and executed command paths

### 3. Azure live secret wiring and auth verification progress

Azure resource:

- `ca-nc-dev-sentinel`

Completed in Azure:

- created Container App secret `sentinel-api-key`
- mapped environment variable `SENTINEL_API_KEY` to the secret
- confirmed live `GET /health` response from the Container App

Important outcome:

- unauthenticated live `POST /command` still returned `executed`

Interpretation:

- the live app is still serving an older handler or older revision
- secret wiring is present, but the code path enforcing auth is not yet the active deployed revision

This means:

- the code hardening work is done in repo
- live Azure revision verification is still open

### 4. `nunncorporation.com` OwnerFI pilot repositioning

Repository:

- `/Users/codynunn/Documents/GitHub/nunncorp-global-mono`

Completed:

- updated the live `apps/nexus-ui` landing/demo surface to present:
  - `OwnerFI Pilot on SentinelOS`
  - controlled vehicle-finance workflow messaging
  - `Powered by Nunn Corporation`
  - a tighter guided demo flow
- replaced hotel-oriented demo commands with:
  - `listing.create`
  - `purchase.initiate`
  - `payment.status.refresh`
- rewrote seeded alerts, receipts, suggestions, and demo script around the OwnerFI pilot story
- preserved the proven `Launch Demo` plus `Ctrl + K` command-surface pattern

Primary file changed:

- `apps/nexus-ui/src/app/sentinel-console.tsx`

Verification completed:

- repaired damaged monorepo dependencies with `pnpm install --offline --force`
- `next build` passed in `apps/nexus-ui`
- targeted `eslint` pass for `src/app/sentinel-console.tsx` passed

## Problems Encountered

### 1. SentinelOS-NON-DEMO local checkout was incomplete at the start

Observed:

- the initial checkout only contained `README.md`

Resolution:

- fetched and fast-forwarded `origin/main`
- recovered the actual API, docs, and deployment files before making changes

### 2. Monorepo dependency tree was damaged

Observed:

- `next build` initially failed with missing `require-hook`
- `eslint` initially failed with missing `debug/src/index.js`
- package directories contained metadata without full runtime file contents

Resolution:

- repaired dependencies with `pnpm -C /Users/codynunn/Documents/GitHub/nunncorp-global-mono install --offline --force`
- reran verification after the repair

### 3. Sandbox-only build verification was not reliable

Observed:

- `next build` hit `EPERM` on `.next/trace` inside the sandbox

Resolution:

- reran the final `apps/nexus-ui` build with elevated filesystem access
- obtained a true production build signal

## Current State At End Of Day

### SentinelOS NON-DEMO

State:

- code hardening is implemented
- Microsoft Sentinel integration path is documented
- Azure secret/env mapping is in place
- live auth behavior is not yet proven because the active revision still appears old

### nunncorp-global-mono / nunncorporation.com

State:

- OwnerFI pilot landing/demo changes are implemented
- compile and lint verification for the edited `apps/nexus-ui` surface are green
- ready for deployment when you want the public site updated

## Open Items

1. Deploy the updated `SentinelOS-NON-DEMO` API revision so `/command` enforces the live API key boundary.
2. Re-run live `/command` verification:
   - without key should return `401`
   - with key should return `200`
3. Enable `ContainerAppConsoleLogs` and `ContainerAppSystemLogs` to the Microsoft Sentinel-backed Log Analytics workspace.
4. Run the KQL queries in `docs/MICROSOFT_SENTINEL.md` to confirm auth-denied and command-executed events are ingesting.
5. Deploy the updated `apps/nexus-ui` OwnerFI pilot surface to `nunncorporation.com`.

## Tomorrow Checklist

Use this order so the next session starts from live truth and ends with public-facing progress.

### Priority 1 — Fix live API auth proof

1. Check the active Azure Container App revision and image for `ca-nc-dev-sentinel`.
2. Confirm whether the auth-hardened `SentinelOS-NON-DEMO` code has been pushed and deployed.
3. Re-test live `POST /command`:
   - no key -> expect `401`
   - correct key -> expect `200`
4. Do not move on until the live endpoint matches the repo behavior.

### Priority 2 — Complete Microsoft Sentinel visibility

1. Enable `ContainerAppConsoleLogs`.
2. Enable `ContainerAppSystemLogs`.
3. Route both to the Microsoft Sentinel-backed Log Analytics workspace.
4. Run the KQL queries from `docs/MICROSOFT_SENTINEL.md`.
5. Capture the first proof of:
   - `command.auth.denied`
   - `command.executed`

### Priority 3 — Ship the OwnerFI pilot surface

1. Deploy the updated `apps/nexus-ui` build.
2. Verify the live landing page shows:
   - `OwnerFI Pilot on SentinelOS`
   - `Powered by Nunn Corporation`
   - the OwnerFI command flow
3. Confirm `Launch Demo` and `Ctrl + K` still work on the public surface.

## Proof Required Next Session

- Azure Container App active revision name
- active image tag or digest
- live unauthenticated `/command` response
- live authenticated `/command` response
- first Sentinel KQL result showing API security events
- public confirmation that the OwnerFI pilot surface is deployed

## Recommended Next Step Tomorrow

Start with live truth:

1. verify which `SentinelOS-NON-DEMO` image and revision are active in Azure
2. push or deploy the auth-hardened API revision if needed
3. confirm live `401` on unauthenticated `/command`
4. then turn on Microsoft Sentinel diagnostics and query the first events
5. after that, ship the OwnerFI pilot landing surface publicly
