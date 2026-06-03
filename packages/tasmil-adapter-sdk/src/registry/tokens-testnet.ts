/**
 * Testnet cross-chain token registry.
 *
 * Testnet tokens are all Stellar-only (no cross-chain bridging on testnet).
 * Icons reuse mainnet stellar.expert URLs.
 */

import type { CrossChainToken } from "./types.js";

const SE = "https://stellar.expert/explorer/public/asset";

function seIcon(code: string, issuer: string): string {
  return `${SE}/${code}-${issuer}/icon`;
}

function stellarToken(
  symbol: string,
  name: string,
  contract: string,
  issuer: string | null,
  logo: string,
  swappableOn: string[] = ["aquarius", "sdex"],
  decimals = 7,
): CrossChainToken {
  return {
    symbol, name, logo, decimals,
    chains: ["stellar"],
    addresses: { stellar: contract },
    ...(issuer ? { issuer } : {}),
    bridgeable: false,
    bridgeableVia: [],
    swappableOn,
  };
}

export const TOKEN_REGISTRY_TESTNET: CrossChainToken[] = [
  {
    symbol: "XLM", name: "Stellar Lumens", decimals: 7,
    logo: `${SE}/native/icon`,
    chains: ["stellar"],
    addresses: { stellar: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC" },
    bridgeable: false, bridgeableVia: [], swappableOn: ["aquarius", "sdex"],
  },
  {
    symbol: "USDC", name: "USD Coin (testnet)", decimals: 7,
    logo: seIcon("USDC", "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"),
    chains: ["stellar"],
    issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    addresses: { stellar: "CAZRY5GSFBFXD7H6GAFBA5YGYQTDXU4QKWKMYFWBAZFUCURN3WKX6LF5" },
    bridgeable: false, bridgeableVia: [], swappableOn: ["aquarius", "sdex"],
  },
  {
    symbol: "USDT", name: "USDT (testnet)", decimals: 7,
    logo: "https://cryptologos.cc/logos/tether-usdt-logo.svg",
    chains: ["stellar"],
    addresses: { stellar: "CBL6KD2LFMLAUKFFWNNXWOXFN73GAXLEA4WMJRLQ5L76DMYTM3KWQVJN" },
    bridgeable: false, bridgeableVia: [], swappableOn: ["aquarius", "sdex"],
  },
  {
    symbol: "AQUA", name: "AQUA (testnet)", decimals: 7,
    logo: seIcon("AQUA", "GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA"),
    chains: ["stellar"],
    issuer: "GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA",
    addresses: { stellar: "CDNVQW44C3HALYNVQ4SOBXY5EWYTGVYXX6JPESOLQDABJI5FC5LTRRUE" },
    bridgeable: false, bridgeableVia: [], swappableOn: ["aquarius", "sdex"],
  },
  stellarToken("BLND", "Blend (testnet)",
    "CB22KRA3YZVCNCQI64JQ5WE7UY2VAV7WFLK6A2JN3HEX56T2EDAFO7QF",
    "GDJEHTBE6ZHUXSWFI642DCGLUOECLHPF3KSXHPXTSTJ7E3JF6MQ5EZYY",
    seIcon("BLND", "GDJEHTBE6ZHUXSWFI642DCGLUOECLHPF3KSXHPXTSTJ7E3JF6MQ5EZYY")),
  stellarToken("ETH", "ETH (testnet)",
    "CC5NJ2JSJF3DDTFW5X4PZHZF2F7YCVDLVM76ZYPR5RTTNB7QNAT7KRWR",
    "GBFXOHVAS43OIWNIO7XLRJAHT3BICFEIKOJLZVXNT572MISM4CMGSOCC",
    seIcon("ETH", "GBFXOHVAS43OIWNIO7XLRJAHT3BICFEIKOJLZVXNT572MISM4CMGSOCC")),
  stellarToken("BTC", "BTC (testnet)",
    "CBSXOAE7GAW7Y3CHTNZ3D4GLB6KI43MC36DY7GTZN4AGI7AWQ5V55YIQ",
    "GDPJALI4AZKUU2W426U5WKMAT6CN3AJRPIIRYR2YM54TL2GDWO5O2MZM",
    seIcon("BTC", "GDPJALI4AZKUU2W426U5WKMAT6CN3AJRPIIRYR2YM54TL2GDWO5O2MZM")),
  stellarToken("DAI", "DAI (testnet)",
    "CDWURCDIASTOAIUKRETTTVGUCIHCUJTIK6QGDJKOW4QSID6VYGXOMGKM",
    null,
    "https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.svg"),
  stellarToken("ICE", "ICE (testnet)",
    "CCQZWA6GDCNLEMNUYTCMYGIXLX3ECAXW7RICSUZWWXM5AMDWAANC4SZK",
    "GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA",
    seIcon("ICE", "GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA")),
  stellarToken("CETES", "Etherfuse CETES (testnet)",
    "CC72F57YTPX76HAA64JQOEGHQAPSADQWSY5DWVBR66JINPFDLNCQYHIC",
    null,
    "https://stablebonds.s3.us-west-2.amazonaws.com/stablebond/spl-cetes.png"),
  stellarToken("wETH", "Wrapped ETH (testnet)",
    "CAZAQB3D7KSLSNOSQKYD2V4JP5V2Y3B4RDJZRLBFCCIXDCTE3WHSY3UE",
    "GBFXOHVAS43OIWNIO7XLRJAHT3BICFEIKOJLZVXNT572MISM4CMGSOCC",
    seIcon("ETH", "GBFXOHVAS43OIWNIO7XLRJAHT3BICFEIKOJLZVXNT572MISM4CMGSOCC")),
  stellarToken("PHO", "Phoenix Protocol (testnet)",
    "CBZ7M5B3Y4WWBZ5XK5UZCAFOEZ23KSSZXYECYX3IXM6E2JOLQC52DK32",
    "GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA",
    seIcon("PHO", "GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA")),
];
