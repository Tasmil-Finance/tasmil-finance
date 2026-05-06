/**
 * Token-chain registry for the frontend aggregator API routes.
 * Same data as mcp-stellar/token-registry, without MCP-specific imports.
 */

export interface ChainInfo {
  id: string;
  name: string;
  symbol: string;
  logo: string;
}

export interface TokenInfo {
  symbol: string;
  name: string;
  logo?: string;
  decimals: number;
  chains: string[];
  addresses: Record<string, string>;
  bridgeable: boolean;
  bridgeableVia: string[];
  swappableOn: string[];
}

// ─── Supported Chains ───────────────────────────────────────────

export const SUPPORTED_CHAINS: ChainInfo[] = [
  { id: "stellar", name: "Stellar", symbol: "SRB", logo: "/chains/stellar.png" },
  { id: "ethereum", name: "Ethereum", symbol: "ETH", logo: "/chains/ethereum.png" },
  { id: "arbitrum", name: "Arbitrum", symbol: "ARB", logo: "/chains/arbitrum.png" },
  { id: "base", name: "Base", symbol: "BAS", logo: "/chains/base.png" },
  { id: "polygon", name: "Polygon", symbol: "POL", logo: "/chains/polygon.png" },
  { id: "solana", name: "Solana", symbol: "SOL", logo: "/chains/solana.png" },
  { id: "bsc", name: "BNB Chain", symbol: "BSC", logo: "/chains/bsc.png" },
  { id: "avalanche", name: "Avalanche", symbol: "AVA", logo: "/chains/avalanche.png" },
  { id: "optimism", name: "Optimism", symbol: "OPT", logo: "/chains/optimism.png" },
];

// ─── Chain groupings ────────────────────────────────────────────

const EVM_CHAINS = ["ethereum", "arbitrum", "base", "polygon", "bsc", "avalanche", "optimism"];
const ALL_BRIDGE_CHAINS = [...EVM_CHAINS, "solana"];
const USDC_CHAINS = ["stellar", ...ALL_BRIDGE_CHAINS];
const USDT_CHAINS = [
  "stellar",
  "ethereum",
  "arbitrum",
  "polygon",
  "bsc",
  "avalanche",
  "optimism",
  "solana",
];

const ALL_SWAP = ["soroswap", "aquarius", "phoenix", "sdex"];
const DEX_SWAP = ["soroswap", "aquarius", "sdex"];
const ALLBRIDGE_TEMPLAR = ["allbridge", "templar"];
const ALLBRIDGE_ONLY = ["allbridge"];
const TEMPLAR_ONLY = ["templar"];

const SE = "https://stellar.expert/explorer/public/asset";
const seIcon = (code: string, issuer: string) => `${SE}/${code}-${issuer}/icon`;

// Local token images — takes priority over external URLs when available
const LOCAL_TOKEN: Record<string, string> = {
  XLM: "/token/xlm.png",
  USDC: "/token/usdc.png",
  USDT: "/token/usdt.png",
  BLND: "/token/blnd.png",
  ETH: "/token/eth.png",
  BTC: "/token/btc.png",
  XRP: "/token/xrp.png",
  AQUA: "/token/aqua.png",
  EURC: "/token/eurc.png",
  PYUSD: "/token/pyusd.png",
  USDY: "/token/usdy.png",
  SCOP: "/token/scop.png",
  CETES: "/token/cetes.png",
  yXLM: "/token/yxlm.png",
  yUSDC: "/token/yusdc.png",
  yETH: "/token/yeth.png",
  yBTC: "/token/ybtc.png",
  DAI: "/token/dai.png",
  ICE: "/token/ice.svg",
};

/** Returns local image if available, otherwise stellar.expert URL */
function tokenLogo(code: string, issuer: string): string {
  return LOCAL_TOKEN[code] ?? seIcon(code, issuer);
}

function stellarToken(
  symbol: string,
  name: string,
  contract: string,
  logo: string,
  swappableOn: string[] = DEX_SWAP,
  decimals = 7
): TokenInfo {
  return {
    symbol,
    name,
    logo,
    decimals,
    chains: ["stellar"],
    addresses: { stellar: contract },
    bridgeable: false,
    bridgeableVia: [],
    swappableOn,
  };
}

// ─── Mainnet Registry ────────────────────────────────────────────

export const TOKEN_REGISTRY: TokenInfo[] = [
  {
    symbol: "USDC",
    name: "USD Coin",
    logo: tokenLogo("USDC", "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"),
    decimals: 7,
    chains: USDC_CHAINS,
    addresses: {
      stellar: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
      ethereum: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      arbitrum: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      polygon: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      solana: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      bsc: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
      avalanche: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
      optimism: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    },
    bridgeable: true,
    bridgeableVia: ALLBRIDGE_TEMPLAR,
    swappableOn: ALL_SWAP,
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    logo: tokenLogo("USDT", ""),
    decimals: 7,
    chains: USDT_CHAINS,
    addresses: {
      stellar: "CCPRPXYHNKFMZFVNM5F3GYPAR6TFJWCGV6D72BM3MVCIRU7GOOS3FI52",
      ethereum: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      arbitrum: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
      polygon: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
      bsc: "0x55d398326f99059fF775485246999027B3197955",
      avalanche: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7",
      optimism: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
      solana: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    },
    bridgeable: true,
    bridgeableVia: ALLBRIDGE_ONLY,
    swappableOn: DEX_SWAP,
  },
  {
    symbol: "XLM",
    name: "Stellar Lumens",
    logo: tokenLogo("XLM", "native"),
    decimals: 7,
    chains: ["stellar"],
    addresses: { stellar: "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA" },
    bridgeable: false,
    bridgeableVia: TEMPLAR_ONLY,
    swappableOn: ALL_SWAP,
  },
  stellarToken(
    "EURC",
    "Euro Coin",
    "CDTKPWPLOURQA2SGTKTUQOWRCBZEORB4BWBOMJ3D3ZTQQSGE5F6JBQLV",
    tokenLogo("EURC", "GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2"),
    ALL_SWAP
  ),
  stellarToken(
    "USDY",
    "Ondo U.S. Dollar Yield",
    "CB3YA656OYIHU57657I5KGSBRHE5I3OZU4VFC22PYAOANFZHEWNYGAGP",
    tokenLogo("USDY", "GAJMPX5NBOG6TQFPQGRABJEEB2YE7RFRLUKJDZAZGAD5GFX4J7TADAZ6")
  ),
  stellarToken(
    "USDGLO",
    "Glo Dollar",
    "CB226ZOEYXTBPD3QEGABTJYSKZVBP2PASEISLG3SBMTN5CE4QZUVZ3CE",
    seIcon("USDGLO", "GBBS25EGYQPGEZCGCFBKG4OAGFXU6DSOQBGTHELLJT3HZXZJ34HWS6XV")
  ),
  stellarToken(
    "PYUSD",
    "PayPal USD",
    "CCCRWH6Q3FNP3I2I57BDLM5AFAT7O6OF6GKQOC6SSJNDAVRZ57SPHGU2",
    tokenLogo("PYUSD", "GDQE7IXJ4HUHV6RQHIUPRJSEZE4DRS5WY577O2FY6YQ5LVWZ7JZTU2V5")
  ),
  stellarToken(
    "oUSD",
    "Orbit USD",
    "CBZPEXQLJCGUYTAQRQ4FGCXUV5O4TZER5WSOMCGNDNIIO4EJ4FU5GQNZ",
    seIcon("oUSD", "GBIWJGAOSFC4KUPHXM573TKTWHMI7VW7D4GCHYZYH243Q6HVBV7ORBIT")
  ),
  stellarToken(
    "USDx",
    "Decentralized USD Coin",
    "CDIKURWHYS4FFTR5KOQK6MBFZA2K3E26WGBQI6PXBYWZ4XIOPJHDFJKP",
    seIcon("USDx", "GAVH5ZWACAY2PHPUG4FL3LHHJIYIHOFPSIUGM2KHK25CJWXHAV6QKDMN")
  ),
  stellarToken(
    "EURx",
    "Decentralized EUR Coin",
    "CBN3NCJSMOQTC6SPEYK3A44NU4VS3IPKTARJLI3Y77OH27EWBY36TP7U",
    seIcon("EURx", "GAVH5ZWACAY2PHPUG4FL3LHHJIYIHOFPSIUGM2KHK25CJWXHAV6QKDMN")
  ),
  stellarToken(
    "GBPx",
    "Decentralized GBP Coin",
    "CBCO65UOWXY2GR66GOCMCN6IU3Y45TXCPBY3FLUNL4AOUMOCKVIVV6JC",
    seIcon("GBPx", "GAVH5ZWACAY2PHPUG4FL3LHHJIYIHOFPSIUGM2KHK25CJWXHAV6QKDMN")
  ),
  stellarToken(
    "ARS",
    "ARS by Anclap",
    "CCD6H4LBTHAPY3NGEE6TLLRUSPJGX4K5XI2J6E4MUNDB5TNXEKC23H5B",
    seIcon("ARS", "GCYE7C77EB5AWAA25R5XMWNI2EDOKTTFTTPZKM2SR5DI4B4WFD52DARS")
  ),
  stellarToken(
    "NGNC",
    "NGNC Coin",
    "CBYFV4W2LTMXYZ3XWFX5BK2BY255DU2DSXNAE4FJ5A5VYUWGIBJDOIGG",
    seIcon("NGNC", "GASBV6W7GGED66MXEVC7YZHTWWYMSVYEY35USF2HJZBLABLYIFQGXZY6")
  ),
  stellarToken(
    "BLND",
    "Blend Protocol",
    "CD25MNVTZDL4Y3XBCPCJXGXATV5WUHHOWMYFF4YBEGU5FCPGMYTVG5JY",
    tokenLogo("BLND", "GDJEHTBE6ZHUXSWFI642DCGLUOECLHPF3KSXHPXTSTJ7E3JF6MQ5EZYY")
  ),
  stellarToken(
    "AQUA",
    "Aquarius Protocol",
    "CAUIKL3IYGMERDRUN6YSCLWVAKIFG5Q4YJHUKM4S4NJZQIA3BAS6OJPK",
    tokenLogo("AQUA", "GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA")
  ),
  stellarToken(
    "PHO",
    "Phoenix Protocol",
    "CBZ7M5B3Y4WWBZ5XK5UZCAFOEZ23KSSZXYECYX3IXM6E2JOLQC52DK32",
    seIcon("PHO", "GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA"),
    ALL_SWAP
  ),
  stellarToken(
    "YBX",
    "YieldBlox",
    "CBRP2VD3CZLEQIQZ4JMBXGA5AC2U6JE26YU5CCIOICIZCVWPGBO2QRUB",
    seIcon("YBX", "GBUYYBXWCLT2MOSSHRFCKMEDFOVSCAXNIEW424GLN666OEXHAAWBDYMX")
  ),
  stellarToken(
    "SCOP",
    "Scopuly",
    "CCJVS6IVXAAXWCMFVK6QLWHZHR4RTVRSEZRQ53GOAEDN3VY2BLPVY72J",
    tokenLogo("SCOP", "GC6OYQJIZF3HFXCYPFCBXYXNGIBQ4TNSFUBUXQJOZWIP6F3YZK4QH3VQ")
  ),
  stellarToken(
    "yXLM",
    "yXLM by Ultra Capital",
    "CBZVSNVB55ANF24QVJL2K5QCLOAB6XITGTGXYEAF6NPTXYKEJUYQOHFC",
    tokenLogo("yXLM", "GARDNV3Q7YGT4AKSDF25LT32YSCCW4EV22Y2TV3I2PU2MMXJTEDL5T55")
  ),
  stellarToken(
    "yUSDC",
    "yUSDC",
    "CDOFW7HNKLUZRLFZST4EW7V3AV4JI5IHMT6BPXXSY2IEFZ4NE5TWU2P4",
    tokenLogo("yUSDC", "GDGTVWSM4MGS4T7Z6W4RPWOCHE2I6RDFCIFZGS3DOA63LWQTRNZNTTFF")
  ),
  stellarToken(
    "yETH",
    "yETH by Ultra Capital",
    "CDYEOOVL6WV4JRY45CXQKOBJFFAPOM5KNQCCDNM333L6RM2L4RO3LKYG",
    tokenLogo("yETH", "GDYQNEF2UWTK4L6HITMT53MZ6F5QWO3Q4UVE6SCGC4OMEQIZQQDERQFD")
  ),
  stellarToken(
    "yBTC",
    "yBTC by Ultra Capital",
    "CB2XMFB6BDIHFOSFB5IXHDOYV3SI3IXMNIZLPDZHC7ENDCXSBEBZAO2Y",
    tokenLogo("yBTC", "GBUVRNH4RW4VLHP4C5MOF46RRIRZLAVHYGX45MVSTKA2F6TMR7E7L6NW")
  ),
  stellarToken(
    "ETH",
    "ETH by Ultra Capital",
    "CBH4M45TQBLDPXOK6L7VYKMEJWFITBOL64BN3WDAIIDT4LNUTWTTOCKF",
    tokenLogo("ETH", "GBFXOHVAS43OIWNIO7XLRJAHT3BICFEIKOJLZVXNT572MISM4CMGSOCC")
  ),
  stellarToken(
    "BTC",
    "BTC by Ultra Capital",
    "CAO7DDJNGMOYQPRYDY5JVZ5YEK4UQBSMGLAEWRCUOTRMDSBMGWSAATDZ",
    tokenLogo("BTC", "GDPJALI4AZKUU2W426U5WKMAT6CN3AJRPIIRYR2YM54TL2GDWO5O2MZM")
  ),
  stellarToken(
    "XRP",
    "XRP by Muyu Network",
    "CAAV3AE3VKD2P4TY7LWTQMMJHIJ4WOCZ5ANCIJPC3NRSERKVXNHBU2W7",
    tokenLogo("XRP", "GBXRPL45NPHCVMFFAYZVUVFFVKSIZ362ZXFP7I2ETNQ3QKZMFLPRDTD5")
  ),
  stellarToken(
    "CETES",
    "Etherfuse CETES",
    "CAL6ER2TI6CTRAY6BFXWNWA7WTYXUXTQCHUBCIBU5O6KM3HJFG6Z6VXV",
    tokenLogo("CETES", "GCRYUGD5NVARGXT56XEZI5CIFCQETYHAPQQTHO2O3IQZTHDH4LATMYWC")
  ),
  stellarToken(
    "USTRY",
    "Etherfuse USTRY",
    "CBLV4ATSIWU67CFSQU2NVRKINQIKUZ2ODSZBUJTJ43VJVRSBTZYOPNUR",
    seIcon("USTRY", "GCRYUGD5NVARGXT56XEZI5CIFCQETYHAPQQTHO2O3IQZTHDH4LATMYWC")
  ),
  stellarToken(
    "SHX",
    "Stronghold SHx",
    "CCKCKCPHYVXQD4NECBFJTFSCU2AMSJGCNG4O6K4JVRE2BLPR7WNDBQIQ",
    seIcon("SHX", "GDSTRSHXHGJ7ZIVRBXEYE5Q74XUVCUSEKEBR7UCHEUUEK72N7I7KJ6JH")
  ),
  stellarToken(
    "SSLX",
    "SSLX Cassator",
    "CBHBD77PWZ3AXPQVYVDBHDKEMVNOR26UZUZHWCB6QC7J5SETQPRUQAS4",
    seIcon("SSLX", "GBHFGY3ZNEJWLNO4LBUKLYOCEK4V7ENEBJGPRHHX7JU47GWHBREH37UR")
  ),
  stellarToken(
    "KALE",
    "The Blockchain Superfood",
    "CB23WRDQWGSP6YPMY4UV5C4OW5CBTXKYN3XEATG7KJEZCXMJBYEHOUOV",
    seIcon("KALE", "GBDVX4VELCDSQ54KQJYTNHXAHFLBCA77ZY2USQBM4CSHTTV7DME7KALE")
  ),
  stellarToken(
    "AFR",
    "AFREUM",
    "CCG27OZ5AV4WUXS6XTECWAXEY5UOMEFI2CWFA3LHZGBTLYZWTJF3MJYQ",
    seIcon("AFR", "GBX6YI45VU7WNAAKA3RBFDR3I3UKNFHTJPQ5F6KOOKSGYIAM4TRQN54W")
  ),
  stellarToken(
    "CARBON",
    "Stellarcarbon CARBON",
    "CDDS7IQJGQ2ZMO66E3MUYXZ56H2OO7RBTTAGZLZKOEA4EXCGZX65JGA7",
    seIcon("CARBON", "GCBOATLWKXACOWKRRWORARDI2HFDSYPALMTS23YBZKHOB6XLW6CARBON"),
    DEX_SWAP,
    3
  ),
];

// ─── Testnet Registry ────────────────────────────────────────────

export const TOKEN_REGISTRY_TESTNET: TokenInfo[] = [
  {
    symbol: "XLM",
    name: "Stellar Lumens",
    decimals: 7,
    logo: tokenLogo("XLM", "native"),
    chains: ["stellar"],
    addresses: { stellar: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC" },
    bridgeable: false,
    bridgeableVia: [],
    swappableOn: ["aquarius", "sdex"],
  },
  {
    symbol: "USDC",
    name: "USD Coin (testnet)",
    decimals: 7,
    logo: tokenLogo("USDC", "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"),
    chains: ["stellar"],
    addresses: { stellar: "CAZRY5GSFBFXD7H6GAFBA5YGYQTDXU4QKWKMYFWBAZFUCURN3WKX6LF5" },
    bridgeable: false,
    bridgeableVia: [],
    swappableOn: ["aquarius", "sdex"],
  },
  {
    symbol: "USDT",
    name: "USDT (testnet)",
    decimals: 7,
    logo: tokenLogo("USDT", ""),
    chains: ["stellar"],
    addresses: { stellar: "CBL6KD2LFMLAUKFFWNNXWOXFN73GAXLEA4WMJRLQ5L76DMYTM3KWQVJN" },
    bridgeable: false,
    bridgeableVia: [],
    swappableOn: ["aquarius", "sdex"],
  },
  {
    symbol: "AQUA",
    name: "AQUA (testnet)",
    decimals: 7,
    logo: tokenLogo("AQUA", "GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA"),
    chains: ["stellar"],
    addresses: { stellar: "CDNVQW44C3HALYNVQ4SOBXY5EWYTGVYXX6JPESOLQDABJI5FC5LTRRUE" },
    bridgeable: false,
    bridgeableVia: [],
    swappableOn: ["aquarius", "sdex"],
  },
  stellarToken(
    "BLND",
    "Blend (testnet)",
    "CB22KRA3YZVCNCQI64JQ5WE7UY2VAV7WFLK6A2JN3HEX56T2EDAFO7QF",
    tokenLogo("BLND", "GDJEHTBE6ZHUXSWFI642DCGLUOECLHPF3KSXHPXTSTJ7E3JF6MQ5EZYY"),
    ["aquarius", "sdex"]
  ),
  stellarToken(
    "ETH",
    "ETH (testnet)",
    "CC5NJ2JSJF3DDTFW5X4PZHZF2F7YCVDLVM76ZYPR5RTTNB7QNAT7KRWR",
    tokenLogo("ETH", "GBFXOHVAS43OIWNIO7XLRJAHT3BICFEIKOJLZVXNT572MISM4CMGSOCC"),
    ["aquarius", "sdex"]
  ),
  stellarToken(
    "BTC",
    "BTC (testnet)",
    "CBSXOAE7GAW7Y3CHTNZ3D4GLB6KI43MC36DY7GTZN4AGI7AWQ5V55YIQ",
    tokenLogo("BTC", "GDPJALI4AZKUU2W426U5WKMAT6CN3AJRPIIRYR2YM54TL2GDWO5O2MZM"),
    ["aquarius", "sdex"]
  ),
  stellarToken(
    "DAI",
    "DAI (testnet)",
    "CDWURCDIASTOAIUKRETTTVGUCIHCUJTIK6QGDJKOW4QSID6VYGXOMGKM",
    tokenLogo("DAI", "GDDJX4IZH6BKOXMD3BOQFB7LPXQPXRPE7ZB6TQDB3JLYQM3C73QHFVB"),
    ["aquarius", "sdex"]
  ),
  stellarToken(
    "ICE",
    "ICE (testnet)",
    "CCQZWA6GDCNLEMNUYTCMYGIXLX3ECAXW7RICSUZWWXM5AMDWAANC4SZK",
    tokenLogo("ICE", "GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA"),
    ["aquarius", "sdex"]
  ),
  stellarToken(
    "wETH",
    "Wrapped ETH (testnet)",
    "CAZAQB3D7KSLSNOSQKYD2V4JP5V2Y3B4RDJZRLBFCCIXDCTE3WHSY3UE",
    tokenLogo("ETH", "GBFXOHVAS43OIWNIO7XLRJAHT3BICFEIKOJLZVXNT572MISM4CMGSOCC"),
    ["aquarius", "sdex"]
  ),
  stellarToken(
    "PHO",
    "Phoenix (testnet)",
    "CBZ7M5B3Y4WWBZ5XK5UZCAFOEZ23KSSZXYECYX3IXM6E2JOLQC52DK32",
    seIcon("PHO", "GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA"),
    ["aquarius", "sdex"]
  ),
];

// ─── Helpers ────────────────────────────────────────────────────

export function getStellarNetworkFromEnv(): "mainnet" | "testnet" {
  return "testnet";
}

export function getActiveRegistry(): TokenInfo[] {
  return TOKEN_REGISTRY_TESTNET;
}

export function getFilteredTokens(req: {
  selectedToken: string;
  selectedChain: string;
  direction: "in" | "out";
}): { tokens: TokenInfo[]; chains: string[] } {
  const { selectedToken, selectedChain } = req;
  const registry = getActiveRegistry();
  const tokenBySymbol = new Map(registry.map((t) => [t.symbol, t]));
  const selected = tokenBySymbol.get(selectedToken);
  const chainExists = SUPPORTED_CHAINS.some((c) => c.id === selectedChain);

  if (!selected || !chainExists) return { tokens: [], chains: [] };

  const resultTokens: TokenInfo[] = [];
  const resultChains = new Set<string>();
  const seen = new Set<string>();

  function addToken(token: TokenInfo) {
    if (!seen.has(token.symbol)) {
      seen.add(token.symbol);
      resultTokens.push(token);
    }
  }

  if (selectedChain === "stellar") {
    for (const token of registry) {
      if (token.symbol === selectedToken) continue;
      if (token.chains.includes("stellar")) {
        addToken(token);
        resultChains.add("stellar");
      }
    }
    if (selected.bridgeable) {
      for (const chain of selected.chains) if (chain !== "stellar") resultChains.add(chain);
    }
    for (const token of registry) {
      if (token.symbol === selectedToken) continue;
      if (token.bridgeable) {
        for (const chain of token.chains) {
          if (chain !== "stellar") {
            resultChains.add(chain);
            addToken(token);
          }
        }
      }
    }
  } else {
    if (selected.bridgeable) {
      for (const chain of selected.chains) if (chain !== selectedChain) resultChains.add(chain);
    }
    for (const token of registry) {
      if (token.chains.includes("stellar")) {
        resultChains.add("stellar");
        addToken(token);
      }
    }
    for (const token of registry) {
      if (token.symbol === selectedToken) continue;
      if (token.bridgeable) {
        for (const chain of token.chains) {
          if (chain !== selectedChain) {
            resultChains.add(chain);
            addToken(token);
          }
        }
      }
    }
  }

  const filtered = resultTokens.filter(
    (t) => t.symbol !== selectedToken || t.chains.some((c) => c !== selectedChain)
  );

  return {
    tokens: filtered,
    chains: Array.from(resultChains).sort((a, b) => {
      if (a === "stellar") return -1;
      if (b === "stellar") return 1;
      return a.localeCompare(b);
    }),
  };
}
