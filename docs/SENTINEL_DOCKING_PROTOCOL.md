# Sentinel Docking Protocol

## Purpose

SentinelOS should work with strong external systems without hard-coding each system into the core.

The docking protocol is the adapter boundary:

```txt
External system
-> docking manifest
-> Sentinel Security
-> Sentinel Analysis
-> Sentinel Decision
-> Approval
-> Policy
-> Execution
```

This keeps SentinelOS open to CDNLUX, Azure, GitHub, Microsoft Graph, Stripe, client systems, and future agents while preserving governance.

## Source Alignment

The NunnCorp mono repository contains the larger Universal Docking Protocol concept:

```txt
docs/protocols/universal-docking-protocol.md
platform/universal-docking-protocol/README.md
```

SentinelOS should not copy the full protocol stack yet. It should implement the minimum stable adapter contract:

- manifest normalization
- capability declaration
- capability risk scoring
- trust tier assignment
- approval requirement
- Sentinel event conversion

## Sentinel Implementation

Current scaffold:

```txt
apps/sentinel/src/integrations/docking/protocol.js
fixtures/docking/udp-manifest.json
scripts/check-docking-protocol.js
```

## Trust Tiers

| Tier | Name | Meaning |
| --- | --- | --- |
| TIER_0 | observed | read-only observation only |
| TIER_1 | restricted | limited medium-risk capabilities |
| TIER_2 | governed | high-risk capabilities possible after approval |

## Capability Risk

| Capability | Risk |
| --- | --- |
| READ_TELEMETRY | low |
| READ_STATUS | low |
| READ_BALANCE | low |
| QUERY_TRUST_REGISTRY | low |
| WRITE_CAPSULE_STATE | medium |
| ACTIVATE_WALLET | medium |
| REQUEST_CDLUX_TRANSFER | high |
| DEPLOY_CONTRACT | high |
| EXECUTE_EXTERNAL_ACTION | high |
| UPDATE_AUTHORITY | high |

## Design Rule

Every external system should enter SentinelOS through a docking adapter, not through direct SDK calls in business logic.

```txt
No adapter -> no integration
No trust tier -> no capability grant
No signed decision -> no execution
No approval -> no high-risk action
```

## Operations Security Posture

Docking is fail-closed. A manifest is rejected, grants no capabilities, and cannot
enter an execution path when it has an unsupported UDP version, invalid system or
adapter identifier, invalid trust tier, duplicate capabilities, an empty capability
set, or an unknown capability. Face-plane manifests also carry a deterministic
hash; changing a manifest after it is signed for review invalidates registration.

Docking learning is limited to operations-security recommendations. It counts only
validated Universal Docking Protocol outcomes (and records rejected candidate events)
and can recommend **keep**, **upgrade validation**, or
**review/revert** actions. Learning never grants a capability, raises a trust tier,
or removes an approval gate automatically; any such change remains human-review
required and must be expressed in a new governed manifest.

Run the local security checks with:

```bash
npm run check:docking
npm run check:faceplane-sdk
```

## CDNLUX Fit

CDNLUX should dock as a utility-token adapter:

```txt
CDNLUX manifest
-> requested capabilities
-> transfer/deploy actions marked high risk
-> Sentinel approval required
-> Mission Control visibility
```

This lets CDNLUX become a governed utility layer later without forcing token execution into SentinelOS before the contract is finalized.

## Next Build

1. Route docking events through `/events/security` or a dedicated `/docking/evaluate` endpoint.
2. Store approved adapters and trust tiers.
3. Add Mission Control panel for docked systems.
4. Require signed decisions for any adapter execution path.
