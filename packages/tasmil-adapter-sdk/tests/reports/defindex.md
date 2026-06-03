# DeFindex Protocol — Test Report

**Adapter:** `DefindexAdapter`  
**Networks tested:** testnet (query), mainnet (query)  
**Test file:** `tests/unit/protocols/defindex.test.ts`  
**Result:** 11/11 passed  
**Note:** DeFindex testnet factory has a copy-paste bug (shares address with Blend factory). Testnet uses hardcoded `knownVaults` list instead of factory discovery.

---

## Testnet — Query

### getDefindexContracts returns factory and knownVaults
- **Input:** `getDefindexContracts("testnet")` (static, no network call)
- **Expected:** `typeof contracts.factory === "string"`, `Array.isArray(contracts.knownVaults ?? [])`
- **Actual:**
  ```json
  {
    "factory": "CDKFHFJIET3A73A2YN4KV7NSV32S6YGQMUFH3DNJXLBWL4SKEGVRNFKI",
    "knownVaults": [
      { "name": "TestVault", "address": "C...", "asset": "USDC" }
    ]
  }
  ```

### listVaults returns array (uses knownVaults on testnet)
- **Input:** `adapter.listVaults()` — testnet (factory not used; falls back to knownVaults)
- **Expected:** `Array.isArray(vaults) === true`
- **Actual:** Array of vaults from knownVaults list — passes
- **Note:** Factory on testnet returns `HostError: trying to invoke non-existent contract function "deployed_defindexes"` — silently swallowed

### each vault has required fields
- **Input:** All vaults from `listVaults()`
- **Expected:** `isContractAddress(vault.address)`, `vault.name.length > 0`, `vault.asset`, `["ok", "unavailable"].includes(vault.status)`
- **Actual:** All fields present — passes

### getVault returns vault info for known testnet vault
- **Input:** First vault address from `contracts.knownVaults`
- **Expected:** `vault.address === firstVault.address`, `["ok", "unavailable"].includes(vault.status)`
- **Actual:** Returns vault with status `"ok"` or `"unavailable"` depending on on-chain state — passes

### getYieldOpportunities returns vault opportunities
- **Input:** `adapter.getYieldOpportunities()`
- **Expected:** Each `opp.protocol === "defindex"`, `opp.type === "vault"`, `opp.risk === "low"`, `opp.assets.length >= 1`
- **Actual:**
  ```json
  {
    "protocol": "defindex",
    "type": "vault",
    "name": "DeFindex TestVault",
    "assets": ["USDC"],
    "apy": { "base": null, "reward": null, "total": null },
    "risk": "low",
    "status": "ok"
  }
  ```

---

## Mainnet — Query

### getDefindexContracts returns valid mainnet factory address
- **Input:** `getDefindexContracts("mainnet")`
- **Expected:** `contracts.factory.length > 0`
- **Actual:** Returns factory address — passes

### listVaults returns array (factory discovery on mainnet)
- **Input:** `adapter.listVaults()` — mainnet (calls factory contract via RPC to get all deployed vaults)
- **Expected:** `Array.isArray(vaults) === true`
- **Actual:** Returns array (may be empty if factory has no deployed vaults yet) — passes
- **Known issue:** Factory `deployed_defindexes` function not found on testnet — works on mainnet with correct factory

### each vault address is a valid contract address or placeholder
- **Input:** All vaults from mainnet `listVaults()`
- **Expected:** `typeof vault.address === "string"`, `vault.address.length > 0`
- **Actual:** Valid C... addresses — passes

### getVault for a known address does not throw
- **Input:** First vault from `listVaults()` (or from knownVaults)
- **Expected:** `vault.address === firstVault.address`
- **Actual:** Returns vault info with name, asset, APY, status — passes

### getYieldOpportunities maps vaults to YieldOpportunity format
- **Input:** `adapter.getYieldOpportunities()` — mainnet
- **Expected:** Each `opp.protocol === "defindex"`, `opp.type === "vault"`, `opp.risk === "low"`
- **Actual:** All vaults mapped to YieldOpportunity structure — passes

### vault APY fields are null or valid numbers
- **Input:** All vaults from `listVaults()`
- **Expected:** `vault.apy === null || (typeof vault.apy === "number" && isFinite(vault.apy))`
- **Actual:** APY is `null` for vaults without on-chain APY data, or valid number when available — passes
