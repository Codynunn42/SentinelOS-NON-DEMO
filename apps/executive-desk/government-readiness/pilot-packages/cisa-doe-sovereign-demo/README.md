# CISA DOE Sovereign Demo Package

## Purpose

This package is a self-contained, local-first demonstration bundle for government evaluation. It is designed to open locally or from an internal static host without requiring outbound network access.

## Entry Points

- `index.html`: landing page with package intent and delivery map.
- `executive-view.html`: executive-facing mission governance walkthrough.
- `operator-view.html`: operator-facing ledger, controls, and overlay inspection view.

## Included Proof Surfaces

- Interactive control plane simulation.
- Verification ledger with signed, chained entries.
- Executable overlay scaffolds for day-one engineering evaluation.

## Usage

1. Open `index.html` in a browser.
2. Select the executive or operator view.
3. Use the simulation controls to review governance behavior and inspect the ledger.
4. Review the overlay scaffolds in the `overlays/` directory.
5. Run `node generate-ledger.mjs` after new Executive Desk runtime activity to refresh the faceplane ledger from real receipts.
6. Run `node ../../../../../scripts/run-faceplane-department-scenario.js` to refresh the scenario evidence, repeatability summary, and reproduction recipe for the portal.
7. Run `./seal-package.sh` to produce a sealed handoff bundle and checksum manifest.

## Security Posture

- No external API calls are required.
- No cloud sign-in is required.
- All demonstration data is embedded for offline review.

## White Glove Positioning

Use this package as a white glove plug-and-play faceplane bundle: leadership receives a guided executive narrative, operators receive job-specific proof and overlays, and the docking model remains tied to mission scope rather than a generic portal.
