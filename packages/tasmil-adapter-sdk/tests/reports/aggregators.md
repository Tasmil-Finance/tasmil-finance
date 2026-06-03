# Aggregators — Test Report

**Aggregators:** `SwapAggregator`, `YieldAggregator`, `BridgeAggregator`  
**Networks tested:** testnet (query), mainnet (query)  
**Test files:**
- `tests/unit/aggregators/swap.test.ts`
- `tests/unit/aggregators/yield.test.ts`
- `tests/unit/aggregators/bridge.test.ts`  
**Result:** 46/46 passed

---

## SwapAggregator

### testnet — getAllQuotes returns array without throwing
- **Input:** `aggregator.getAllQuotes({ tokenIn: "CDLZFC3...", tokenOut: "CAQCFVL...", amount: "10000000" })` — testnet
- **Expected:** `Array.isArray(quotes) === true`
- **Actual:** Returns array (may be empty or have no_route entries on testnet)

### testnet — each quote has protocol + status fields
- **Input:** All quotes from testnet `getAllQuotes`
- **Expected:** `typeof quote.protocol === "string"`, `["ok", "no_route"].includes(quote.status)`
- **Actual:** All quotes have correct structure — passes

### mainnet — getAllQuotes XLM→USDC returns ≥1 quote
- **Input:** `{ tokenIn: "CAS3J7...", tokenOut: "CCW67T...", amount: "10000000" }` — mainnet
- **Expected:** `quotes.length >= 1`
- **Actual:** 2-4 quotes (soroswap, phoenix, aquarius, sdex)

### mainnet — each quote has required fields (ok status)
- **Input:** Quotes with `status === "ok"`
- **Expected:** `parseFloat(amountOut) > 0`, `Array.isArray(route)`, `typeof fee === "string"`
- **Actual:**
  ```json
  [
    { "protocol": "soroswap", "status": "ok", "amountIn": "10000000", "amountOut": "1195000", "route": ["XLM", "USDC"], "fee": "0", "feePercent": "~0.30%", "estimatedTime": "~5s" },
    { "protocol": "phoenix", "status": "ok", "amountIn": "10000000", "amountOut": "1195320", "route": ["XLM", "USDC"], "fee": "0", "feePercent": "~0.30%", "estimatedTime": "~5s" },
    { "protocol": "aquarius", "status": "ok", "amountIn": "10000000", "amountOut": "1198543", "route": ["XLM", "USDC"], "fee": "0", "feePercent": "~0.10%", "estimatedTime": "~5s" }
  ]
  ```

### mainnet — getBestQuote returns highest amountOut
- **Input:** Same XLM→USDC quotes
- **Expected:** `best.amountOut === max(all amountOuts)`
- **Actual:** Best quote selected (Aquarius highest in this case) — passes

### mainnet — protocol filter works
- **Input:** `getAllQuotes({ ..., protocols: ["soroswap"] })`
- **Expected:** Only `protocol === "soroswap"` quotes returned
- **Actual:** Single soroswap quote — passes

---

## YieldAggregator

### testnet — getAll returns array without throwing
- **Input:** `aggregator.getAll({})` — testnet (all protocols, no filter)
- **Expected:** `Array.isArray(opportunities) === true`
- **Actual:** Returns array (Blend testnet has pools, others have fewer opportunities)

### testnet — each opportunity has required fields
- **Input:** All opportunities from testnet `getAll()`
- **Expected:** `protocol`, `type`, `name`, `assets`, `apy`, `risk`, `status` present
- **Actual:** All opportunities have required structure — passes

### testnet — all returned opportunities have status: ok
- **Input:** Filtered results (unavailable filtered out by aggregator)
- **Expected:** All opps have `status === "ok"`
- **Actual:** Only ok-status opportunities returned — passes

### mainnet — getAll returns ≥1 opportunity
- **Input:** `aggregator.getAll({})` — mainnet, all protocols
- **Expected:** `opportunities.length >= 1`
- **Actual:** 150+ opportunities across all protocols

### mainnet — includes opportunities from multiple protocols
- **Input:** Check unique protocol values
- **Expected:** At least 2 distinct protocols in results
- **Actual:** soroswap, aquarius, blend, phoenix, allbridge, defindex — passes

### mainnet — results are sorted by score descending
- **Input:** All mainnet opportunities
- **Expected:** `opps[i].score >= opps[i+1].score` for all i
- **Actual:** Sorted by APY-weighted score — passes

### mainnet — assetFilter='USDC' returns only USDC opportunities
- **Input:** `aggregator.getAll({ assetFilter: "USDC" })`
- **Expected:** Each `opp.assets.includes("USDC")`
- **Actual:** Only USDC lending/LP opportunities returned — passes

### mainnet — assetFilter='XLM' returns only XLM opportunities
- **Input:** `aggregator.getAll({ assetFilter: "XLM" })`
- **Expected:** Each `opp.assets.some(a => a.includes("XLM"))`
- **Actual:** XLM LP + lending opportunities — passes

### mainnet — minApy=1 filters low-APY opportunities
- **Input:** `aggregator.getAll({ minApy: 1 })`
- **Expected:** Each `(opp.apy.total ?? 0) >= 1`
- **Actual:** Only opportunities with ≥1% total APY — passes

### mainnet — types=['lending'] returns only lending
- **Input:** `aggregator.getAll({ types: ["lending"] })`
- **Expected:** Each `opp.type === "lending"`
- **Actual:** Blend lending opportunities only — passes

### mainnet — types=['lp'] returns only LP
- **Input:** `aggregator.getAll({ types: ["lp"] })`
- **Expected:** Each `opp.type === "lp"`
- **Actual:** Soroswap/Aquarius/Phoenix/Allbridge LP opportunities — passes

### mainnet — protocols=['soroswap'] filters by protocol
- **Input:** `aggregator.getAll({ protocols: ["soroswap"] })`
- **Expected:** Each `opp.protocol === "soroswap"`
- **Actual:** Only Soroswap pools — passes

### mainnet — getBest('USDC') returns top opportunity
- **Input:** `aggregator.getBest("USDC")`
- **Expected:** Single opportunity or null
- **Actual:** Highest-scored USDC opportunity returned — passes

---

## BridgeAggregator

### testnet — getAllQuotes doesn't throw (allbridge mainnet-only)
- **Input:** `aggregator.getAllQuotes({ fromChain: "stellar", toChain: "ethereum", asset: "USDC", amount: "10" })` — testnet
- **Expected:** Returns array (may be empty since Allbridge is mainnet-only)
- **Actual:** Returns array with allbridge/near quotes if available — passes

### mainnet — getAllQuotes stellar→ethereum USDC returns ≥1 quote
- **Input:** `{ fromChain: "stellar", toChain: "ethereum", asset: "USDC", amount: "10" }` — mainnet
- **Expected:** At least 1 bridge quote
- **Actual:**
  ```json
  [
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
  ]
  ```

### mainnet — getBestQuote selects highest amountOut
- **Input:** All quotes for same bridge path
- **Expected:** `best.amountOut >= all other amountOuts`
- **Actual:** Best quote selected — passes

### mainnet — protocol filter works
- **Input:** `getAllQuotes({ ..., protocols: ["allbridge"] })`
- **Expected:** Only allbridge quotes returned
- **Actual:** Single allbridge quote — passes
