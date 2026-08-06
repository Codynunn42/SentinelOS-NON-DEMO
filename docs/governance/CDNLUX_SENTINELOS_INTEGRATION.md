# CDNLUX SentinelOS Integration

## Purpose

CDNLUX should be treated as a NunnCorp utility-token and infrastructure signal that SentinelOS can govern from the Nunn Cloud side.

The boundary is:

```txt
Nunn Corporation / nunncorp-global-mono
-> CDNLUX token, wallet, backend, chain assets

Nunn Cloud LLC / SentinelOS
-> governance, trust scoring, approval, policy, execution control
```

SentinelOS should not directly absorb the entire monorepo. It should consume stable CDNLUX contracts, deployment metadata, wallet state, and token events through an integration boundary.

## Current Source Material

Current verified source in `nunncorp-global-mono`:

- `apps/cdnlux-backend` is an Express/RPC backend.
- `apps/nunnpay-wallet/contracts/core/WalletKernel.sol` is an immutable wallet kernel.
- `apps/nunnpay-wallet/contracts/core/SentinelGuard.sol` is an off-chain Sentinel-controlled authorization guard.
- `apps/nunnpay-wallet/scripts/deploy-sepolia.js` deploys `WalletKernel` and `SentinelGuard` to Base Sepolia.
- `apps/nunnpay-wallet/scripts/deploy-base.ts` exists for Base mainnet but uses older ethers-style deployment calls.

Current verified gap:

- no dedicated `CDNLUX.sol` was found in the current checkout
- no current `CDNLUX_CONTRACT` usage was found in `apps/cdnlux-backend`
- no current `deploy-cdnlux.js` or `deployment-info.cdnlux.json` file was found in the current checkout
- older memory indicates those artifacts may have existed in an older branch or checkout

## Canonical Sentinel Pipeline

```txt
CDNLUX event
-> Sentinel Security trust context
-> Sentinel Learning
-> Sentinel Analysis
-> Sentinel Decision
-> Sentinel Approval
-> Sentinel Policy
-> Execution
-> Audit
-> Mission Control
```

## Integration Contract

SentinelOS should accept CDNLUX events in this shape:

```json
{
  "type": "cdnlux.token.transfer_requested",
  "tenant": "nunncloud",
  "symbol": "CDNLUX",
  "network": "base-sepolia",
  "contractAddress": "0x...",
  "walletAddress": "0x...",
  "action": "transfer",
  "amount": 25,
  "requestedBy": "sentinel-operator",
  "evidence": ["source=nunncorp-global-mono/apps/nunnpay-wallet"]
}
```

The integration module turns that into a Sentinel security event:

```txt
cdnlux event
-> trustContext
-> riskLevel
-> evidence
-> approval requirement
```

## Initial Risk Rules

| CDNLUX action | Risk | Sentinel posture |
| --- | --- | --- |
| observe | low | allow read-only |
| quote | low | allow read-only |
| balance_check | low | allow read-only |
| activate_wallet | medium | restrict |
| transfer | high | approval required |
| deploy_contract | high | approval required |
| update_contract_authority | high | approval required |

## What SentinelOS Owns

- trust scoring for CDNLUX actions
- signed decisions before CDNLUX execution
- approval gating for transfer/deploy/authority actions
- audit history for operator actions
- Mission Control visibility

## What nunncorp-global-mono Owns

- CDNLUX token implementation
- wallet contracts
- backend runtime
- deployment scripts
- chain-specific metadata

## Next Build

1. Add a dedicated CDNLUX token contract or identify the correct existing contract artifact.
2. Produce deployment metadata: `deployment-info.cdnlux.json`.
3. Add a SentinelOS endpoint or command route for `cdnlux.*` events.
4. Route high-risk CDNLUX actions into persistent approvals.
5. Add Mission Control display for CDNLUX utility-token state.
