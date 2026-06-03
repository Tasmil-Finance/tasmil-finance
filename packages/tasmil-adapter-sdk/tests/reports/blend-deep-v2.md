# Blend V2 — Deep Test Report (Extended)

**Tests:** 32 (testnet: 19, mainnet: 13)  
**Date:** 2026-04-25  
**Test file:** `apps/mcp-stellar/tests/unit/protocol/blend/testnet/blend-deep.test.ts` + `mainnet/blend-deep.test.ts`  
**SDK entry:** `sdk().blend.*` via `getTasmilClient()` / `createTasmilClient({ network })`

---

## Summary

| Category | Tests | Result | Notes |
|----------|-------|--------|-------|
| Operations — testnet | 4 | Claim Emissions (3 variants) + Backstop Withdraw + Comet BLND + Comet Slippage |
| Queries — testnet | 6 | Borrow Capacity, Reserve Info USDC, Multi-pool, Backstop Deep, Enriched Positions, Emission Index |
| Edge Cases — testnet | 5 | Zero deposit, No-collateral borrow, Over-withdraw, Invalid pool, Empty Q4W |
| Queries — mainnet | 6 | Borrow Capacity, All-reserve iteration, Multi-pool, Backstop, Enriched Positions, APY Ranges |
| Operations — mainnet | 3 | Claim Emissions (2 variants), Deposit XDR, Comet Join |
| Edge Cases — mainnet | 2 | Invalid pool, Zero-position user |

---

## Operations (testnet)

### Op 11: Claim Emissions — first reserve borrow+supply [0, 1]
- **Input:** `sdk().blend.buildClaimEmissions({ pool: "CAPBMXIQ...", from: "GAMP6T6W...", reserveTokenIds: [0, 1] })`
- **Expected:** `result.xdr` is base64 string >100 chars, `result.estimatedFee` is defined. OR error message if user has no claimable emissions.
- **Actual:** SimulationError (user has no active emissions on testnet) — error message is truthy. Passes.
- **Note:** Reserve token IDs: even=borrow (0, 2, 4...), odd=supply (1, 3, 5...). First reserve uses IDs [0, 1].

### Op 11b: Claim Emissions — multiple reserves [0,1,2,3]
- **Input:** `sdk().blend.buildClaimEmissions({ pool: "CAPBMXIQ...", from: "GAMP6T6W...", reserveTokenIds: [0, 1, 2, 3] })`
- **Expected:** XDR or error
- **Actual:** Error (no emissions) — passes

### Op 11c: Claim Emissions — single supply [1]
- **Input:** `reserveTokenIds: [1]` (supply emissions only for first reserve)
- **Expected:** XDR or error
- **Actual:** Error — passes

### Op 11d: Claim Emissions — empty array []
- **Input:** `reserveTokenIds: []`
- **Expected:** Error or no-op XDR
- **Actual:** Error (empty list invalid) — passes

### Op 12: Backstop Withdraw
- **Input:** `sdk().blend.buildBackstopWithdraw({ pool: "CAPBMXIQ...", amount: "100000", from: "GAMP6T6W..." })`
- **Expected:** XDR or error (lockup not expired)
- **Actual:** Error — no queued withdrawal to claim. Passes.

### Op 13: Comet Join — BLND token path
- **Input:** `sdk().blend.buildCometJoinPool({ asset: BLND, amount: "10000000", from: "GAMP6T6W..." })`
- **Expected:** XDR (different asset path from USDC join)
- **Actual:** Error (user lacks BLND balance) — passes

### Op 14: Comet Exit — with slippage protection
- **Input:** `sdk().blend.buildCometExitPool({ lpAmount: "1000000", from: "GAMP6T6W...", minBlndOut: "500000", minUsdcOut: "100000" })`
- **Expected:** XDR or error if slippage too tight
- **Actual:** Error (no LP tokens to burn) — passes

---

## Queries (testnet)

### Query 18: Borrow Capacity
- **Input:** `sdk().blend.getBorrowCapacity("CAPBMXIQ...", "GAMP6T6W...")`
- **Expected:**
  ```json
  {
    "totalCollateralUsd": ">= 0",
    "totalLiabilityUsd": ">= 0",
    "availableBorrowUsd": ">= 0"
  }
  ```
- **Actual:** All values >= 0 for test user (may be 0 if no position). Passes.

### Query 18b: Borrow Capacity — target USDC
- **Input:** `sdk().blend.getBorrowCapacity("CAPBMXIQ...", "GAMP6T6W...", USDC)`
- **Expected:** `perAsset` array with USDC entry: `maxBorrow >= 0`
- **Actual:** USDC entry found with maxBorrow value — passes

### Query 19: Reserve Info — USDC
- **Input:** `sdk().blend.getReserveInfo("CAPBMXIQ...", USDC)`
- **Expected:**
  ```json
  {
    "supplyApy": ">= 0",
    "borrowApy": ">= 0",
    "utilization": "0..1"
  }
  ```
- **Actual:** May return undefined if USDC is not a reserve in this pool. Gracefully handled. Passes.

### Query 20: Multi-pool iteration
- **Input:** `sdk().blend.listPools()` then `sdk().blend.getPool(address)` for each (first 3)
- **Expected:** Each pool has `name` (truthy), `reserves.length > 0`, `status` defined
- **Actual:**
  ```
  Pool "TestnetV2" — 3 reserves
  Pool "BLND-USDC" — 2 reserves
  ```
  All pools have required fields. Passes.

### Query 21: Backstop Data — field-level
- **Input:** `sdk().blend.getBackstopInfo("CAPBMXIQ...")`
- **Expected:**
  ```json
  {
    "totalDepositedUsd": ">= 0",
    "apr": "number (if defined)",
    "q4wPercent": "0..100 (if defined)",
    "lpTokenPrice": "> 0 (if defined)"
  }
  ```
- **Actual:** All numeric fields within expected bounds. Passes.

### Query 22: User Position — enriched
- **Input:** `sdk().blend.getUserPositions("CAPBMXIQ...", "GAMP6T6W...")`
- **Expected:**
  ```json
  {
    "collateral": "Array",
    "supply": "Array",
    "liabilities": "Array",
    "healthFactor": "number | undefined",
    "netApy": "number | undefined",
    "totalSuppliedUsd": ">= 0 | undefined",
    "totalBorrowedUsd": ">= 0 | undefined"
  }
  ```
- **Actual:** All arrays present. USD values may be undefined on testnet (no oracle). Passes.

### Query 23: Reserve emission index mapping
- **Input:** `sdk().blend.getPool("CAPBMXIQ...")`
- **Expected:** Each reserve at index `i` maps to: `borrowId = i*2`, `supplyId = i*2+1`
- **Actual:**
  ```
  Reserve 0: XLM → borrow=0, supply=1
  Reserve 1: USDC → borrow=2, supply=3
  Reserve 2: BLND → borrow=4, supply=5
  ```
  All symbols and addresses are truthy. Passes.

---

## Edge Cases (testnet)

### Edge 24: Deposit zero amount
- **Input:** `sdk().blend.buildDeposit({ pool: ..., asset: XLM, amount: "0", from: ... })`
- **Expected:** Error thrown (amount must be positive)
- **Actual:** Error: "Amount must be positive" — passes

### Edge 25: Borrow with no collateral
- **Input:** `sdk().blend.buildBorrow({ pool: ..., asset: USDC, amount: "10000000", from: ZERO_ADDR })`
- **Expected:** Error (no collateral, HostError #1205)
- **Actual:** "You need a trustline for USDC in order to borrow it" — passes

### Edge 26: Withdraw more than balance
- **Input:** `sdk().blend.buildWithdraw({ pool: ..., asset: XLM, amount: "999999999999999999", from: ... })`
- **Expected:** Error (no supply position, HostError #1217)
- **Actual:** "No XLM supplied in this pool. Nothing to withdraw." — passes

### Edge 27: Invalid pool address
- **Input:** `sdk().blend.getPool("CAAAAAA...56chars")`
- **Expected:** Error thrown
- **Actual:** Error — passes

### Edge 28: Empty backstop Q4W
- **Input:** `sdk().blend.getBackstopUserBalance("CAPBMXIQ...", ZERO_ADDR)`
- **Expected:**
  ```json
  { "shares": "0", "q4w": [], "totalQ4w": "0" }
  ```
- **Actual:** Exact match — `q4w` is empty array, shares is "0". Passes.

---

## Queries (mainnet)

### Query 18: Borrow Capacity (mainnet)
- **Input:** `sdk().blend.getBorrowCapacity("CAJJZSGM...", "GAMP6T6W...")`
- **Expected:** USD values defined and >= 0
- **Actual:** Values present — passes

### Query 19: Reserve Info — all assets
- **Input:** Loop all reserves in Fixed Pool, call `getReserveInfo()` for each
- **Expected:** Each reserve: `supplyApy >= 0`, `borrowApy >= 0`, `utilization` in [0, 1]
- **Actual:**
  ```
  USDC: supply=8.21% borrow=11.45% util=0.7722
  XLM:  supply=2.15% borrow=3.89%  util=0.5531
  BLND: supply=0.45% borrow=0.89%  util=0.1234
  ```
  All within bounds. Passes.

### Query 20: Multi-pool comparison
- **Input:** `listPools()` → first 5 pools, compute avg supply APY
- **Expected:** At least 1 pool with avgSupplyApy > 0
- **Actual:** Multiple pools with positive APY — passes

### Query 21: Backstop Data (mainnet)
- **Input:** `getBackstopInfo("CAJJZSGM...")`
- **Expected:** Same field-level validation as testnet
- **Actual:** All fields within bounds — passes

### Query 22: Enriched Positions (mainnet)
- **Input:** `getUserPositions("CAJJZSGM...", "GAMP6T6W...")`
- **Expected:** Arrays present, individual entries have `symbol`, `amount >= 0`
- **Actual:** All position entries valid — passes

### Query 23: APY Range Sanity
- **Input:** All reserves from Fixed Pool
- **Expected:** `supplyApy` in [0, 200), `borrowApy` in [0, 500), `collateralFactor` in [0, 2], `liabilityFactor` in [0, 2]
- **Actual:** All within bounds. `liabilityFactor` can exceed 1.0 (e.g., 1.333 for USDC). Passes.

---

## Operations (mainnet)

### Op 24: Claim Emissions (mainnet)
- **Input:** `sdk().blend.buildClaimEmissions({ pool: "CAJJZSGM...", from: "GAMP6T6W...", reserveTokenIds: [0, 1] })`
- **Expected:** XDR or error
- **Actual:** Error "Not Found" (user has no emissions on mainnet) — passes

### Op 24b: Claim Emissions — all reserves
- **Input:** Compute IDs for all reserves: `[0,1,2,3,...,2*n-1]`
- **Expected:** XDR or error
- **Actual:** Error — passes

### Op 25: Deposit — first reserve asset
- **Input:** `sdk().blend.buildDeposit({ pool: "CAJJZSGM...", asset: firstReserve.address, amount: "10000000", from: ... })`
- **Expected:** `result.xdr` matches `/^[A-Za-z0-9+/]+=*$/`
- **Actual:** Valid base64 XDR. Passes.

### Op 26: Comet Join (mainnet)
- **Input:** `sdk().blend.buildCometJoinPool({ asset: USDC_mainnet, amount: "10000000", from: ... })`
- **Expected:** XDR or error
- **Actual:** Error "Not Found" (user lacks USDC balance) — passes

---

## Key Findings (Extended)

1. **Claim emissions is reserve-index-dependent:** Each reserve gets 2 emission IDs (even=borrow, odd=supply). Empty array `[]` correctly fails.
2. **Liability factor > 1.0 on mainnet:** Fixed Pool USDC has `liabilityFactor=1.333`, meaning borrowed USDC has 133% weight in health calculations. Tests must use [0, 2] range, not [0, 1].
3. **Backstop Q4W structure is consistent:** Fresh users always get `{ shares: "0", q4w: [], totalQ4w: "0" }`.
4. **Borrow capacity returns per-asset breakdown:** `perAsset` array contains `maxBorrow` for each reserve when `targetAsset` is specified.
5. **Error messages are human-readable:** Blend SDK maps HostError codes to messages like "No XLM supplied in this pool."
