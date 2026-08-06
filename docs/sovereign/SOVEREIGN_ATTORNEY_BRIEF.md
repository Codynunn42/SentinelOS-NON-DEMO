# Sentinel Sovereign Tier — IP Attorney Brief

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud
**Prepared:** 2026-06-08
**Purpose:** Attorney review package for Sentinel Sovereign commercial licensing

---

## What You Are Reviewing

SentinelOS is a governed AI execution control plane built and owned by Cody Nunn / Nunn Cloud. The software is fully operational and deployed.

The Sentinel Sovereign Tier is a proposed commercial product that allows a buyer to purchase a one-time, perpetual license to run SentinelOS on their own infrastructure — fully air-gapped, with no ongoing platform dependency.

This brief covers what you need to advise on before the first sovereign license is sold.

---

## Ownership Statement

SentinelOS was designed, built, and is owned entirely by Cody Nunn operating as Nunn Cloud. There are no co-founders, no outside contributors with IP claims, and no open-source components that carry copyleft license obligations in the core runtime.

Key dependencies to verify:

| Dependency | License | Usage |
|---|---|---|
| `pg` (node-postgres) | MIT | Database client — permissive, no copyleft |
| Node.js runtime | MIT | Runtime — permissive |
| All other runtime modules | To be confirmed in npm audit | Verify no GPL/AGPL obligations |

**Action for attorney:** Confirm there are no copyleft obligations in the dependency tree that would require source disclosure upon distribution.

---

## What the Sovereign License Covers

The buyer receives:

1. A signed `sentinel.license.json` file tied to their organization name
2. A license verification key (`SENTINEL_LICENSE_KEY`) to verify the license locally at startup
3. The SentinelOS runtime as a Docker image or deployable package
4. Deployment documentation and governance policy pack
5. Optional one-time setup support (separate agreement)

The buyer does **not** receive:

- Source code (unless a separate Source License is negotiated)
- Rights to redistribute, sublicense, or resell
- Access to Nunn Cloud platform infrastructure
- Automatic updates (updates are separate licensed releases)
- Subscription support (support is a separate contract)

---

## The License File — Technical Structure

Every sovereign deployment is issued a cryptographically signed license file. The proposed signing model uses Ed25519. The license file contains:

```json
{
  "licenseId": "SOS-2026-0001",
  "tier": "SOVEREIGN",
  "issuedTo": "Organization Name",
  "issuedAt": "2026-06-08T00:00:00.000Z",
  "version": "1.0",
  "capabilities": ["execute", "audit", "govern", "drift"],
  "signatureAlgorithm": "ed25519:v1",
  "signature": "<base64-signature>"
}
```

The proposed signature model uses an Ed25519 private signing key that never leaves Nunn Cloud. The buyer receives only the corresponding public verification key. The public key can verify licenses but cannot generate valid signatures.

Every license is traceable to a specific buyer via `issuedTo` and `licenseId`. This creates an audit trail of who holds what license.

**Action for attorney:** Review whether this technical binding is sufficient to constitute a valid license enforcement mechanism, or whether additional contractual terms are needed alongside the technical file.

---

## Questions for the Attorney

### 1. License Agreement Structure

Do we need a separate written End User License Agreement (EULA) that the buyer must sign before receiving the license file — or is the signed license file plus a click-through or email acceptance sufficient?

### 2. Restriction Language

What language is needed to clearly prohibit:

- Redistribution of the software or license
- Sublicensing to third parties
- Reverse engineering of the compiled runtime
- Use of the software beyond the licensed organization

### 3. Source vs Binary Delivery

The proposed default is binary-only (Docker image). A "Sovereign Source" tier would include source code under a separate commercial source license.

What additional terms are needed if source code is included? Specifically:

- Can the buyer modify for internal use only?
- Can the buyer create derivative works?
- What restrictions apply to the modified version?

### 4. Transferability

Can the buyer transfer the license to a successor organization (e.g. acquisition, merger)? What terms govern this?

### 5. Update and Version Rights

Updates are proposed as separate licensed releases — not automatic. Does the license agreement need to explicitly define what version rights the buyer has, and what happens when a new version is released?

### 6. Support and Liability

What limitations of liability and warranty disclaimers are needed given that this is a deployed governance system used in potentially regulated or government environments?

### 7. Export Controls

Given that sovereign buyers may include government agencies and defense contractors, are there any EAR (Export Administration Regulations) or ITAR considerations for distributing cryptographic software that uses Ed25519 signing to certain buyers or jurisdictions?

### 8. Trade Secret Protection

The signing key used to generate licenses is a critical trade secret. What agreements or handling procedures should be documented to establish and preserve trade secret protection for that key?

### 9. Pricing Model Implications

The proposed model is a one-time perpetual license with updates as separate purchases. Does this create any implied warranty of fitness or ongoing support obligations under applicable state or federal law?

### 10. IP Assignment Confirmation

Confirm that all IP created during the development of SentinelOS is properly assigned to Nunn Cloud / Cody Nunn and that no contractor, employee, or prior agreement creates any competing claim.

---

## Proposed Pricing Tiers — For Review

These are not final. Attorney input on structure is requested.

| Tier | Description | Proposed Model |
|---|---|---|
| Sovereign Standard | Single deployment, single environment, one organization | One-time perpetual license fee |
| Sovereign Multi-Site | Multiple deployments under one organization (up to N) | One-time fee, higher than Standard |
| Sovereign Source | Includes source code license for internal modification | Separate commercial source license agreement |
| Sovereign Support | Annual support contract (separate from license) | Annual fee |
| Sovereign Update | New version license | Per-version fee |

---

## Current Technical Candidate

The current technical candidate includes:

- Ed25519 license generation and verification candidate is built for review
- License verification is built into the server startup sequence
- The system will not start in sovereign mode without a valid verified license
- Every license is cryptographically tied to the buyer organization name
- Deployment tier classification is implemented (`PUBLIC`, `ENTERPRISE`, `GOVERNMENT`, `SOVEREIGN`)

**Nothing has been sold yet.** No licenses have been issued. License issuance remains held pending approval of the Ed25519 candidate, legal framework, and key-management procedures.

---

## Documents to Bring to the Meeting

1. This brief
2. `docs/sovereign/SOVEREIGN_TIER.md` — technical tier specification
3. `scripts/generate-sovereign-license.js` — the license generation script (for attorney review of the technical mechanism)
4. A sample generated license file (can be generated for review purposes using a test key)
5. Any existing contractor or employment agreements relevant to IP ownership confirmation

---

## Next Steps After Attorney Meeting

1. Draft EULA / License Agreement based on attorney guidance
2. Define final pricing tiers with legal sign-off
3. Decide binary vs source delivery model
4. Document key management procedures (signing key handling, rotation, escrow)
5. Generate first sovereign license for first buyer
6. Record the license issuance in the governance audit trail

---

**Owner:** Cody Nunn | Sentinel AI | Nunn Cloud
**Classification:** Attorney-Client Privileged — Draft
