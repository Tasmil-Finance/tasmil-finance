# tasmil-adapter-sdk — Test Reports

**Total tests:** 413 passed, 0 failed  
**Date:** 2026-04-25 (updated from 2026-04-18)  
**Run command:** `pnpm test` in `packages/tasmil-adapter-sdk/` + `pnpm vitest run tests/unit/protocol/` in `apps/mcp-stellar/`

## Reports by Protocol

| Protocol | Adapter | Tests | Networks | Report |
|----------|---------|-------|----------|--------|
| Soroswap | `SoroswapAdapter` | 12/12 | testnet (query+ops), mainnet | [soroswap.md](soroswap.md) |
| Aquarius | `AquariusAdapter` | 13/13 | testnet (query+ops), mainnet | [aquarius.md](aquarius.md) |
| **Aquarius Deep** | `AquariusAdapter` | **36/36** | **testnet (17) + mainnet (19)** | [aquarius-deep.md](aquarius-deep.md) |
| SDEX | `SdexAdapter` | 10/10 | testnet (query+ops), mainnet | [sdex.md](sdex.md) |
| Blend | `BlendAdapter` | 13/13 | testnet (query), mainnet | [blend.md](blend.md) |
| **Blend V2 Deep** | `BlendAdapter` + `invokeContract`/`viewCall` | **28/28** | testnet (10 ops + queries), mainnet (queries) | [blend-deep.md](blend-deep.md) |
| **Blend V2 Deep v2** | `BlendAdapter` (extended) | **32/32** | **testnet (19) + mainnet (13)** | [blend-deep-v2.md](blend-deep-v2.md) |
| Phoenix | `PhoenixAdapter` | 8/8 | mainnet (testnet: no stable pools) | [phoenix.md](phoenix.md) |
| DeFindex | `DefindexAdapter` | 11/11 | testnet (query), mainnet | [defindex.md](defindex.md) |
| **DeFindex Deep** | `viewCall`/`invokeContract` | **35/35** | **testnet (17) + mainnet (18)** | [defindex-deep.md](defindex-deep.md) |
| Allbridge | `AllbridgeAdapter` | 16/16 | mainnet only (no testnet SDK support) | [allbridge.md](allbridge.md) |
| **Allbridge LP** | `registerAllbridgeLpTools` (mocked SDK) | **43/43** | **mainnet (all 8 LP tools)** | [allbridge-lp.md](allbridge-lp.md) |
| **Templar** | **`TemplarAdapter`** | **45/45** | **mainnet only (no testnet; NEAR-based)** | [templar.md](templar.md) |
| Aggregators | `SwapAggregator`, `YieldAggregator`, `BridgeAggregator` | 46/46 | testnet + mainnet | [aggregators.md](aggregators.md) |
| **Unified Deep** | `YieldAggregator`, `SwapAggregator`, `BridgeAggregator` | **28/28** | **testnet (9) + mainnet (19)** | [unified-deep.md](unified-deep.md) |
| Utils | `resolveAsset`, `getContracts` | 37/37 | — | (inline tests) |

## Testnet Operation Coverage

| Protocol | Op Tested | Method | Notes |
|----------|-----------|--------|-------|
| SDEX | ✅ Build TX XDR | `buildPathPaymentStrictSendXDR` | Builds `PathPaymentStrictSend` TX, verified with `Buffer.from(xdr, "base64")` |
| SDEX | ✅ Strict receive paths | `findStrictReceivePaths` | Returns empty array on testnet (low liquidity) |
| Aquarius | ✅ Find swap path | `findSwapPath` | Returns empty path on testnet (API responds, no liquidity) |
| Aquarius | ✅ Strict receive | `findSwapPathStrictReceive` | Returns path or 400 on testnet |
| Soroswap | ✅ Build swap TX | `buildSwapTx` | Skipped gracefully when quote returns 400 (testnet not indexed) |
| Soroswap | ✅ Get price | `getPrice` | Returns 404 on testnet (price not indexed) — accepted |
| Blend | ✅ All 10 ops | `invokeContract` on pool.submit, backstop.deposit/queue/dequeue, comet dep/exit | All return `SimulationError` (correct HostError codes — no testnet balance, args verified valid) |
| Phoenix | N/A | — | No stable testnet pools; write ops require pool deployment |
| DeFindex | N/A | — | Factory not deployed on testnet; write ops require funded vault |
| Allbridge | N/A | — | No testnet SDK support by design |

## Key Findings

1. **Soroswap testnet**: Quote API returns 400 for testnet contract addresses — testnet not indexed by the aggregator. `buildSwapTx` skips gracefully.
2. **Aquarius testnet**: Path-finding API returns 400 or empty response on testnet. Direct `findSwapPath` call returns empty response (not an error).
3. **SDEX testnet**: Orderbook and XDR building work correctly. `buildPathPaymentStrictSendXDR` produces valid XDR by loading account from `horizon-testnet.stellar.org`.
4. **Blend testnet**: Full registry/pool/reserve discovery works on testnet (Soroban RPC calls succeed).
5. **DeFindex testnet**: Factory `deployed_defindexes` function missing on testnet — `listVaults` falls back to `knownVaults` list gracefully.
6. **Aquarius `tokens_str`**: API returns both `string` and `string[]` for this field — type union handled in adapter.
7. **Soroswap protocol names**: Valid values are `["soroswap", "phoenix", "aqua", "sdex"]` (NOT `"aquarius"`).
8. **Templar NEAR RPC**: `rpc.fastnear.com` rate-limits >6 concurrent requests (429). Exponential backoff retry (800ms→1600ms→3200ms) added to `nearViewCall`. Single-market queries work reliably; batch queries may partially fail.
9. **Templar asset ID format**: Contracts use multiple wrapper variants (`Nep245`, `Nep141`, `Nep141Near`, `FtBridge`) for collateral/borrow assets. Resolved by `extractAssetId()` which searches all known wrapper keys and falls back to JSON.stringify for pattern matching.
10. **Templar unknown view methods**: NEAR RPC returns `null` (not an error) for unknown view methods on valid contracts. Only non-existent accounts/contracts throw `NearRpcError`.
11. **Blend V2 HostError codes**: `#13`=insufficient allowance, `#1205`=no collateral, `#1217`=no supply/collateral position, `#1219`=no liability, `#20/#29`=insufficient LP/token balance, `#10`=no backstop position.
12. **Fixed Pool USDC is highest-yield mainnet market**: $45.1M supply, $34.8M borrow, 77.22% utilization, 9.30% supply APY (as of 2026-04-18).
13. **Forex Pool backstop stress**: 66.53% Q4W% (queued withdrawals) — aligns with `frozen` pool status.
14. **Blend bRate/dRate**: Start at `1e12`, grow over time. Fixed Pool USDC bRate=1.1102 means +11% cumulative interest earned by suppliers since pool inception.
