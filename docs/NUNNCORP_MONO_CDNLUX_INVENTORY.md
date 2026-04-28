# NunnCorp Mono CDNLUX Inventory

## Inspection Date

2026-04-28

## Current Finding

The current `nunncorp-global-mono` checkout contains CDNLUX backend infrastructure and wallet smart contracts, but it does not currently show a dedicated CDNLUX utility-token contract wired into `apps/cdnlux-backend`.

## Found

### CDNLUX Backend

Path:

```txt
apps/cdnlux-backend
```

Current role:

```txt
Express backend with /health and /rpc
```

Observed source:

```txt
apps/cdnlux-backend/src/index.ts
apps/cdnlux-backend/src/rpc/index.ts
```

Current limitation:

```txt
No CDNLUX_CONTRACT usage found in current backend source.
No ethers/web3 contract integration found in current backend source.
```

### Wallet Contracts

Path:

```txt
apps/nunnpay-wallet/contracts
```

Found contracts:

```txt
core/WalletKernel.sol
core/SentinelGuard.sol
modules/BaseModule.sol
interfaces/IWalletKernel.sol
interfaces/ISentinelGuard.sol
interfaces/IModule.sol
```

These are relevant to SentinelOS because `SentinelGuard` models the same governance pattern: off-chain Sentinel decisions influencing on-chain authorization.

### Deployment Scripts

Found:

```txt
apps/nunnpay-wallet/scripts/deploy-sepolia.js
apps/nunnpay-wallet/scripts/deploy-base.ts
```

Not found in the current checkout:

```txt
apps/nunnpay-wallet/scripts/deploy-cdnlux.js
deployment-info.cdnlux.json
transfer-ledger.json
```

## Interpretation

The old CDNLUX contract-control lane appears to have drifted or lived in another branch/checkout. The current repo has the primitives, but not the full CDNLUX utility-token runtime.

## Recommended Cleanup In nunncorp-global-mono

Do not start with broad cleanup. Start with a focused CDNLUX consolidation pass:

1. Decide whether `CDNLUX` is an ERC-20 utility token, an internal accounting unit, or a chain/service credit.
2. Create or locate the canonical token contract.
3. Add deployment metadata under the owning app.
4. Wire `apps/cdnlux-backend` to read token metadata and wallet state.
5. Keep write actions behind SentinelOS approval and signed decisions.

## SentinelOS Action

SentinelOS now has a CDNLUX integration scaffold at:

```txt
apps/sentinel/src/integrations/cdnlux/cdnlux.js
```

This lets SentinelOS model CDNLUX actions as governed events without directly coupling Nunn Cloud runtime code to all of NunnCorp global mono.
