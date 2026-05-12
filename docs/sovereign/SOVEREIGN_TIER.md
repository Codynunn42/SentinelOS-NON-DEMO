# Sentinel Sovereign Tier

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud

## What It Is

Sentinel Sovereign is a one-time purchase, fully air-gapped deployment of SentinelOS.

The buyer owns a licensed, self-contained instance of the operating system. No subscription. No platform connection. No call-home. No dependency on Nunn Cloud infrastructure after delivery.

## Who It Is For

- Government agencies requiring classified or air-gapped deployments
- Defense contractors operating in restricted network environments
- Sovereign entities requiring full infrastructure ownership
- Enterprises with strict data residency or network isolation requirements
- Buyers who need to own the system, not rent access to it

## What the Buyer Gets

```txt
Sentinel Sovereign Package
  ├── SentinelOS runtime (Docker image or bare metal package)
  ├── Signed sovereign license file (sentinel.license.json)
  ├── License verification key (SENTINEL_LICENSE_KEY)
  ├── Deployment documentation
  ├── Governance policy pack
  └── One-time setup support (optional)
```

The buyer runs SentinelOS entirely on their own infrastructure. Nothing leaves their environment.

## What the Buyer Does Not Get

- Access to Nunn Cloud platform services
- Automatic updates (updates are separate licensed releases)
- Subscription-based support (support is a separate contract)
- Source code (unless a source license is negotiated separately)

## How Licensing Works

Every sovereign deployment is issued a signed license file. The license is verified locally at startup using HMAC-SHA256 against the buyer's license key.

```txt
Nunn Cloud (you)
  → generates license with SENTINEL_LICENSE_SIGNING_KEY (private, never shipped)
  → delivers sentinel.license.json + SENTINEL_LICENSE_KEY to buyer

Buyer
  → places sentinel.license.json in deployment root
  → sets SENTINEL_LICENSE_KEY in environment
  → starts SentinelOS
  → license verified locally, no network call
```

The signing key stays with you. The verification key goes to the buyer. A compromised verification key cannot be used to generate new licenses.

## Pricing Model

One-time perpetual license. No recurring fees.

Suggested pricing tiers (to be finalized with legal and commercial review):

```txt
Sovereign Standard    — single deployment, single environment
Sovereign Multi-Site  — up to N deployments under one organization
Sovereign Source      — includes source license for internal modification
```

Updates and new versions are separate licensed releases, not automatic.

## Deployment Classification

When `SENTINEL_SOVEREIGN_MODE=1` is set:

- server verifies license at startup before accepting any requests
- `/health` and `/system/status` return `tier: SOVEREIGN` and `sovereign: true`
- platform-connected features are disabled
- telemetry is local-only
- no outbound calls to Nunn Cloud infrastructure

## IP Protection Model

The sovereign package is a compiled, signed, licensed artifact. The buyer receives:

- the right to run a specific version
- a signed license tied to their organization name
- no rights to redistribute, sublicense, or modify without a source license

Every license is traceable to a specific buyer via the `issuedTo` and `licenseId` fields in the signed license file.

## Build Commands

Generate a sovereign license for a buyer:

```bash
SENTINEL_LICENSE_SIGNING_KEY=<your-private-key> \
SOVEREIGN_LICENSE_ID=SOS-2026-0001 \
SOVEREIGN_ISSUED_TO="Organization Name" \
SOVEREIGN_CAPABILITIES=execute,audit,govern,drift \
node scripts/generate-sovereign-license.js
```

Verify a license locally:

```bash
SENTINEL_LICENSE_KEY=<buyer-verification-key> \
SENTINEL_LICENSE_FILE=./sentinel.license.json \
node -e "const {verifySovereignLicense} = require('./apps/sentinel/src/sovereign/sovereignLicense'); console.log(verifySovereignLicense());"
```

## Status

Scaffold complete. License generation and verification are implemented.

Before selling sovereign licenses:

1. Have a software IP attorney review the license terms
2. Define the source vs. binary delivery model
3. Establish the update and support contract model
4. Define the pricing tiers with legal sign-off
5. Add sovereign package to the product tier table in `docs/PRODUCT.md`
