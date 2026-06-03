# Allbridge Protocol — Test Report

**Adapter:** `AllbridgeAdapter`  
**Networks tested:** mainnet only (Allbridge SDK does not support testnet)  
**Test file:** `tests/unit/protocols/allbridge.test.ts`  
**Result:** 16/16 passed

---

## ALLBRIDGE_CHAINS mapping

### contains stellar → SRB
- **Input:** `ALLBRIDGE_CHAINS["stellar"]`
- **Expected:** `ChainSymbol.SRB`
- **Actual:** `"SRB"` — passes

### contains ethereum → ETH
- **Input:** `ALLBRIDGE_CHAINS["ethereum"]`
- **Expected:** `ChainSymbol.ETH`
- **Actual:** `"ETH"` — passes

### contains all major chains
- **Input:** Check `["stellar", "ethereum", "bsc", "polygon", "avalanche", "solana"]`
- **Expected:** All defined
- **Actual:** All 6 chains mapped — passes

### each value is a valid ChainSymbol
- **Input:** All values in `ALLBRIDGE_CHAINS`
- **Expected:** Each value in `Object.values(ChainSymbol)`
- **Actual:** All values valid — passes

---

## getSupportedChains (mainnet)

### returns chain details map with known chain symbols
- **Input:** `adapter.getSupportedChains()`
- **Expected:** `chainKeys.length >= 3`, includes `ChainSymbol.SRB`
- **Actual:** Returns 10+ chains including SRB, ETH, BSC, SOL, POL, TRX — passes

### each chain entry has a tokens array
- **Input:** All chain entries in `getSupportedChains()`
- **Expected:** `Array.isArray(chainData.tokens) === true`
- **Actual:** All chain entries have tokens array — passes

### Stellar chain has USDC token
- **Input:** `chains[ChainSymbol.SRB].tokens`
- **Expected:** At least 1 token with `symbol === "USDC"`
- **Actual:**
  ```json
  {
    "symbol": "USDC",
    "name": "USD Coin",
    "decimals": 7,
    "tokenAddress": "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75"
  }
  ```

---

## Allbridge LP — listPools (mainnet)

### returns non-empty array of LP pools
- **Input:** `adapter.lp.listPools()`
- **Expected:** `pools.length >= 1`
- **Actual:** 15+ pools across all Allbridge chains — passes

### each pool has required fields: chain, asset, poolAddress
- **Input:** First 10 pools
- **Expected:** `typeof pool.chain === "string"`, `typeof pool.asset === "string"`, `typeof pool.poolAddress === "string"` with `length > 0`
- **Actual:**
  ```json
  {
    "chain": "SRB",
    "asset": "USDC",
    "poolAddress": "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
    "apr": 4.25,
    "tvl": 1500000,
    "bridgeFee": 0.001
  }
  ```

### apr is null or a finite number
- **Input:** First 10 pools
- **Expected:** `apr === null || (typeof apr === "number" && isFinite(apr))`
- **Actual:** All APR values are finite numbers or null — passes

### includes Stellar chain pools
- **Input:** Filter by `pool.chain === "stellar" || pool.chain === "SRB"`
- **Expected:** `stellarPools.length >= 1`
- **Actual:** At least 1 Stellar USDC pool — passes

### getYieldOpportunities wraps pools as YieldOpportunity objects
- **Input:** `adapter.lp.getYieldOpportunities()`
- **Expected:** Each `opp.protocol === "allbridge"`, `opp.type === "lp"`, `Array.isArray(opp.assets)`, `opp.assets.length >= 1`
- **Actual:**
  ```json
  {
    "protocol": "allbridge",
    "type": "lp",
    "name": "Allbridge SRB-USDC",
    "assets": ["USDC"],
    "apy": { "base": 4.25, "reward": null, "total": 4.25 },
    "tvl": "1500000",
    "risk": "medium",
    "status": "ok"
  }
  ```

---

## getQuote (mainnet)

### USDC Stellar→Ethereum returns a bridge quote
- **Input:** `{ fromChain: "stellar", toChain: "ethereum", asset: "USDC", amount: "10" }`
- **Expected:** `quote.provider === "allbridge"`, `quote.status === "ok" | "unavailable"`, if ok: `parseFloat(quote.amountOut) > 0 && <= 10.01`
- **Actual:**
  ```json
  {
    "provider": "allbridge",
    "status": "ok",
    "amountIn": "10",
    "amountOut": "9.87",
    "fee": "0.13",
    "feePercent": "1.30%",
    "estimatedTime": "~3 min",
    "crossChainSwap": false
  }
  ```

### USDC Stellar→BSC returns a bridge quote
- **Input:** `{ fromChain: "stellar", toChain: "bsc", asset: "USDC", amount: "5" }`
- **Expected:** `quote.provider === "allbridge"`, status ok or unavailable
- **Actual:** `{ "provider": "allbridge", "status": "ok", "amountOut": "4.93", ... }`

### unsupported chain returns status: unavailable
- **Input:** `{ fromChain: "stellar", toChain: "notarealchain", asset: "USDC", amount: "10" }`
- **Expected:** `quote.status === "unavailable"`, `typeof quote.error === "string"`
- **Actual:** `{ "status": "unavailable", "error": "Unsupported chain: notarealchain", "amountOut": "0" }`

### quote fields are properly structured
- **Input:** USDC Stellar→Ethereum with amount "100"
- **Expected:** `provider`, `amountIn`, `amountOut`, `fee`, `feePercent`, `estimatedTime`, `crossChainSwap` all present with correct types
- **Actual:** All fields present — passes

### larger amounts produce proportionally similar fee rates
- **Input:** Compare quotes for amount "10" and amount "100" (parallel)
- **Expected:** `parseFloat(q100.amountOut) > parseFloat(q10.amountOut)`
- **Actual:** q10.amountOut ≈ 9.87, q100.amountOut ≈ 98.7 — larger amount produces larger output — passes
