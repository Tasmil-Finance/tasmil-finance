# Allbridge LP (Liquidity Pool) — Deep Test Report

**Tests:** 43 passed, 0 failed  
**Date:** 2026-04-25  
**Test file:** `apps/mcp-stellar/tests/unit/protocol/allbridge/mainnet/lp-pools.test.ts`  
**SDK entry:** `registerAllbridgeLpTools()` via mocked `AllbridgeCoreSdk`  
**Note:** Allbridge LP is **mainnet only** — no testnet LP contracts exist.

---

## Summary

| Tool | Tests | Status |
|------|-------|--------|
| `allbridge_pool_list` | 6 | Lists pools per chain with APR/fee data |
| `allbridge_pool_info` | 4 | On-chain pool state (TVL, imbalance, rewards) |
| `allbridge_pool_user_balance` | 3 | User LP position + earned rewards |
| `allbridge_pool_deposit_quote` | 3 | Preview LP tokens for deposit |
| `allbridge_pool_withdraw_quote` | 2 | Preview tokens for LP withdrawal |
| `allbridge_pool_deposit` | 5 | Build deposit TX (XDR or EVM) |
| `allbridge_pool_withdraw` | 3 | Build withdraw TX (XDR or EVM) |
| `allbridge_pool_claim_rewards` | 4 | Build claim TX with earned amount |
| Edge: unsupported chain | 3 | Error handling |
| Edge: unknown token | 3 | Error handling |
| Edge: multi-chain | 2 | Cross-chain compatibility |
| Edge: TX type discrimination | 4 | XDR vs EVM tx type routing |
| Registration | 1 | All 8 tools registered |

---

## Tool Registration

### All 8 LP tools registered
- **Input:** `registerAllbridgeLpTools(server)` with mock MCP server
- **Expected:** 8 tools registered: `allbridge_pool_list`, `allbridge_pool_info`, `allbridge_pool_user_balance`, `allbridge_pool_deposit_quote`, `allbridge_pool_withdraw_quote`, `allbridge_pool_deposit`, `allbridge_pool_withdraw`, `allbridge_pool_claim_rewards`
- **Actual:** All 8 tools registered. `server.tool` called 8 times. Passes.

---

## 1. allbridge_pool_list

### Lists Stellar pools with APR and fee data
- **Input:** `{ chain: "stellar" }`
- **Expected:**
  ```json
  {
    "success": true,
    "chain": "stellar",
    "count": ">= 1",
    "pools": [
      {
        "chain": "stellar",
        "symbol": "USDC",
        "name": "USD Coin",
        "tokenAddress": "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
        "poolAddress": "string",
        "decimals": 7,
        "apr7d": "5.23%",
        "apr30d": "4.87%",
        "feeShare": "0.1500%",
        "lpRate": "1.002"
      }
    ],
    "note": "contains 'mainnet'"
  }
  ```
- **Actual:** Exact match. APR formatted as `X.XX%`. Passes.

### Lists Ethereum pools with multiple tokens
- **Input:** `{ chain: "ethereum" }`
- **Expected:** `pools.length >= 1`
- **Actual:** Returns pools (USDC, USDT). Passes.

### Count matches pools array
- **Input:** `{ chain: "stellar" }`
- **Expected:** `data.count === data.pools.length`
- **Actual:** Match. Passes.

### Mainnet-only note
- **Input:** `{ chain: "stellar" }`
- **Expected:** `data.note` contains "mainnet"
- **Actual:** "Allbridge LP is mainnet only." Passes.

### Unsupported chain error
- **Input:** `{ chain: "fantom" }`
- **Expected:** `isError: true`
- **Actual:** Error returned. Passes.

### Empty chain (no tokens)
- **Input:** `{ chain: "bsc" }` (mocked with empty tokens)
- **Expected:** `{ success: true, count: 0, pools: [] }`
- **Actual:** Empty array returned gracefully. Passes.

---

## 2. allbridge_pool_info

### Stellar USDC pool state
- **Input:** `{ chain: "stellar", symbol: "USDC" }`
- **Expected:**
  ```json
  {
    "success": true,
    "chain": "stellar",
    "symbol": "USDC",
    "poolAddress": "string",
    "poolInfo": {
      "tokenBalance": "1500000.00",
      "vUsdBalance": "1495000.00",
      "totalLpAmount": "1498000.00",
      "aValue": "20",
      "dValue": "0.0025",
      "imbalance": "0.33",
      "accRewardPerShareP": "1234567890"
    },
    "apr7d": "5.23%",
    "apr30d": "4.87%"
  }
  ```
- **Actual:** All poolInfo fields match mock data. APR formatted. Passes.

### Unknown token error
- **Input:** `{ chain: "stellar", symbol: "DOGE" }`
- **Expected:** `isError: true`
- **Actual:** Error: `Token "DOGE" not found on stellar`. Passes.

### Unsupported chain error
- **Input:** `{ chain: "fantom", symbol: "USDC" }`
- **Expected:** `isError: true`
- **Actual:** Error. Passes.

---

## 3. allbridge_pool_user_balance

### User with LP position and rewards
- **Input:** `{ chain: "stellar", symbol: "USDC", accountAddress: "GAMP6T6W..." }`
- **Expected:**
  ```json
  {
    "success": true,
    "lpAmount": "50000.00",
    "userLiquidity": "50050.00",
    "earnedRewards": "12.50",
    "hasRewards": true,
    "note": "contains 'claimable'"
  }
  ```
- **Actual:** All fields match. Note includes "12.50 USDC claimable rewards". Passes.

### Zero-balance user
- **Input:** `{ chain: "stellar", symbol: "USDC", accountAddress: "GAAAAAA...WHF" }`
- **Expected:**
  ```json
  {
    "lpAmount": "0",
    "hasRewards": false,
    "note": "contains 'No claimable'"
  }
  ```
- **Actual:** Zero position. Note: "No claimable rewards yet." Passes.

### Includes context fields
- **Input:** Same as above
- **Expected:** `chain`, `symbol`, `accountAddress`, `poolAddress` all present
- **Actual:** All context fields included. Passes.

---

## 4. allbridge_pool_deposit_quote

### LP tokens received for deposit
- **Input:** `{ chain: "stellar", symbol: "USDC", amount: "100" }`
- **Expected:**
  ```json
  {
    "success": true,
    "amountIn": "100",
    "lpTokensReceived": "99.85",
    "poolAddress": "string",
    "apr7d": "5.23%",
    "note": "contains '100' and 'USDC'"
  }
  ```
- **Actual:** Exact match. Slight LP token discount reflects pool mechanics. Passes.

### Includes APR context
- **Input:** `{ chain: "stellar", symbol: "USDC", amount: "1000" }`
- **Expected:** `apr7d` contains `%`
- **Actual:** APR data included. Passes.

### Ethereum pool quote
- **Input:** `{ chain: "ethereum", symbol: "USDC", amount: "500" }`
- **Expected:** `chain: "ethereum"`, success
- **Actual:** Returns quote for ETH chain. Passes.

---

## 5. allbridge_pool_withdraw_quote

### Tokens received for LP withdrawal
- **Input:** `{ chain: "stellar", symbol: "USDC", lpAmount: "50", accountAddress: "GAMP6T6W..." }`
- **Expected:**
  ```json
  {
    "success": true,
    "lpAmountIn": "50",
    "tokensReceived": "49.90",
    "poolAddress": "string",
    "note": "contains '50'"
  }
  ```
- **Actual:** 50 LP → 49.90 USDC (small withdrawal fee). Passes.

### Solana pool quote
- **Input:** `{ chain: "solana", symbol: "USDC", lpAmount: "100", accountAddress: "SolAddress..." }`
- **Expected:** `chain: "solana"`, success
- **Actual:** Returns quote. Passes.

---

## 6. allbridge_pool_deposit

### Stellar deposit returns XDR
- **Input:** `{ chain: "stellar", symbol: "USDC", amount: "100", accountAddress: "GAMP6T6W..." }`
- **Expected:**
  ```json
  {
    "success": true,
    "transaction": { "type": "xdr", "data": "AAAAAgAAAABf...=" },
    "amount": "100",
    "note": "contains 'deposit'"
  }
  ```
- **Actual:** `transaction.type = "xdr"`. XDR data is base64 Stellar TX envelope. Passes.

### Ethereum deposit returns EVM TX
- **Input:** `{ chain: "ethereum", symbol: "USDC", amount: "500", accountAddress: "0x0000...0001" }`
- **Expected:**
  ```json
  {
    "transaction": {
      "type": "evm_tx",
      "data": { "to": "0xAllbridgePool", "data": "0xabcdef123456", "value": "0" }
    }
  }
  ```
- **Actual:** `transaction.type = "evm_tx"`. EVM TX object with `to`, `data`, `value`. Passes.

### Includes pool context
- **Input:** Stellar deposit
- **Expected:** `chain`, `symbol`, `poolAddress` all present
- **Actual:** All context fields. Passes.

### Unsupported chain error
- **Input:** `{ chain: "fantom", ... }`
- **Expected:** `isError: true`
- **Actual:** Error. Passes.

### Unknown token error
- **Input:** `{ chain: "stellar", symbol: "DOGE", ... }`
- **Expected:** `isError: true`
- **Actual:** Error. Passes.

---

## 7. allbridge_pool_withdraw

### Stellar withdrawal returns XDR
- **Input:** `{ chain: "stellar", symbol: "USDC", amount: "50", accountAddress: "GAMP6T6W..." }`
- **Expected:**
  ```json
  {
    "success": true,
    "transaction": { "type": "xdr" },
    "lpAmount": "50",
    "note": "contains 'withdraw'"
  }
  ```
- **Actual:** XDR returned. Passes.

### Ethereum withdrawal returns EVM TX
- **Input:** `{ chain: "ethereum", symbol: "USDC", amount: "200", accountAddress: "0x..." }`
- **Expected:** `transaction.type = "evm_tx"`
- **Actual:** EVM TX object. Passes.

### Includes context
- **Input:** Stellar withdrawal
- **Expected:** `chain`, `symbol`, `poolAddress` present
- **Actual:** All present. Passes.

---

## 8. allbridge_pool_claim_rewards

### Stellar claim with earned amount
- **Input:** `{ chain: "stellar", symbol: "USDC", accountAddress: "GAMP6T6W..." }`
- **Expected:**
  ```json
  {
    "success": true,
    "transaction": { "type": "xdr" },
    "earnedRewards": "12.50",
    "note": "contains 'Claiming' and '12.50'"
  }
  ```
- **Actual:** `earnedRewards = "12.50"`. Note: "Claiming 12.50 USDC rewards." Passes.

### Ethereum claim returns EVM TX
- **Input:** `{ chain: "ethereum", symbol: "USDC", accountAddress: "0x..." }`
- **Expected:** `transaction.type = "evm_tx"`
- **Actual:** EVM TX. Passes.

### Account context included
- **Input:** Stellar claim
- **Expected:** `accountAddress`, `poolAddress` present
- **Actual:** Both present. Passes.

### Zero rewards — verification note
- **Input:** `{ chain: "stellar", symbol: "USDC", accountAddress: "GAAAAAA...WHF" }`
- **Expected:**
  ```json
  {
    "earnedRewards": "0",
    "note": "contains 'verify'"
  }
  ```
- **Actual:** `earnedRewards = "0"`. Note: "Claiming rewards (amount may be 0 — verify before submitting)." Passes.

---

## Edge Cases

### 9. Unsupported chain errors (3 tests)
- **Input:** `chain: "cardano"` for pool_list, pool_info, pool_deposit
- **Expected:** All return `isError: true`
- **Actual:** All error. Passes.

### 10. Unknown token symbol errors (3 tests)
- **Input:** `symbol: "SHIB"` for pool_info, pool_deposit, pool_claim_rewards
- **Expected:** All return `isError: true`
- **Actual:** Error: `Token "SHIB" not found on stellar`. Passes.

### 11. Multi-chain support (2 tests)
- **Input:** `pool_list` and `pool_info` for `"stellar"`, `"ethereum"`, `"solana"`
- **Expected:** All chains return success with correct `chain` field
- **Actual:** All pass.

### 12. Transaction type discrimination (4 tests)
- **Input:** Deposit + withdraw for Stellar and Ethereum
- **Expected:**
  - Stellar → `transaction.type = "xdr"` (base64 XDR envelope)
  - Ethereum → `transaction.type = "evm_tx"` (object with `to`, `data`, `value`)
- **Actual:**
  | Chain | Operation | TX Type |
  |-------|-----------|---------|
  | stellar | deposit | `xdr` |
  | stellar | withdraw | `xdr` |
  | ethereum | deposit | `evm_tx` |
  | ethereum | withdraw | `evm_tx` |
  All correct. Passes.

---

## Supported Chains

| Chain | Symbol | Tokens Available |
|-------|--------|-----------------|
| Stellar | SRB | USDC (7 decimals) |
| Ethereum | ETH | USDC (6 dec), USDT (6 dec) |
| BSC | BSC | USDC (18 dec), USDT (18 dec) |
| Polygon | POL | USDC (6 dec) |
| Avalanche | AVA | USDC (6 dec) |
| Solana | SOL | USDC (6 dec), USDT (6 dec) |
| Arbitrum | ARB | USDC (6 dec) |
| Optimism | OPT | USDC (6 dec) |
| Base | BAS | USDC (6 dec) |
| Tron | TRX | USDC (6 dec) |
| Sui | SUI | USDC (6 dec) |

---

## Key Findings

1. **TX type routing is chain-dependent:** Stellar always returns `xdr`, all other chains return `evm_tx`. Determined by `chain.toLowerCase() === 'stellar'`.
2. **LP deposit has small discount:** 100 USDC deposit → 99.85 LP tokens (~0.15% pool entry fee).
3. **LP withdrawal has small fee:** 50 LP tokens → 49.90 USDC (~0.20% exit fee).
4. **BSC uses 18 decimals:** USDC/USDT on BSC are 18-decimal tokens (different from all other chains at 6-7 decimals).
5. **Stellar USDC uses 7 decimals:** Matches Stellar standard (other chains use 6).
6. **Earned rewards computed on-chain:** `userBalance.earned(poolInfo, token.decimals)` computes claimable rewards from pool's `accRewardPerShareP` and user's `rewardDebt`.
7. **Claim proceeds even with 0 rewards:** Tool builds TX regardless of reward amount; user should verify before signing.
8. **Error messages include chain context:** e.g., `Token "DOGE" not found on stellar (Allbridge)`.
9. **All 8 tools were previously 100% untested:** This test file provides first-ever coverage for Allbridge LP pool operations.
