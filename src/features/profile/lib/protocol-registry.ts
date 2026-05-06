import type { Protocol } from "./types";

// Mainnet contracts that we explicitly recognise.
// IDs from CLAUDE.md (Mainnet 2026-04-24 deploy table) and public protocol docs.
const MAINNET_PROTOCOLS: ReadonlyArray<readonly [string, Protocol]> = [
  // Tasmil-deployed strategies (treat as their underlying protocol so the row reads naturally)
  ["CDF37Z2B5JDF5UB3I3Y3COFTH3I3JF3ECKKIXDZBOUAVEO7LN5LH2SXN", "blend"],
  ["CDITBCJV22JTYF7CXO443HJYOSXQCMJ45Z3MDWDVNPKLTO2MXWMYAUUJ", "blend"],
  ["CA4NOB3SE3FAPPIY5FVRRYNEQFY6F7BBGPLQZRTLEKDZK57DLMRPBWRE", "soroswap"],
  ["CCVSVSUAD3NWYGFSRBC5EXKDYLPOSF4VCUJMOIWM74IYH4UBGUXG6JJW", "soroswap"],
  ["CAR7JB66FA3HPKKME5V73F6E2OWB2XFD36NHGE6YWN63D3JHI2ZHIVES", "aquarius"],
  ["CCOYCEAFEET7PCDDSKJ3XWR7HUCVE6ZJFDIPCH4YTRKV5TE6L6D4J46S", "aquarius"],
];

const TESTNET_PROTOCOLS: ReadonlyArray<readonly [string, Protocol]> = [
  // Filled by env override; the testnet contract IDs rotate per redeploy.
];

function buildMap(): Map<string, Protocol> {
  const isMainnet = process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet";
  const base = isMainnet ? MAINNET_PROTOCOLS : TESTNET_PROTOCOLS;
  const map = new Map<string, Protocol>(base.map(([id, p]) => [id, p]));

  // Optional override: `NEXT_PUBLIC_STELLAR_PROTOCOL_OVERRIDES="C123:blend,C456:soroswap"`
  const raw = process.env.NEXT_PUBLIC_STELLAR_PROTOCOL_OVERRIDES;
  if (raw) {
    for (const pair of raw.split(",")) {
      const [id, proto] = pair.split(":").map((s) => s.trim());
      if (
        id &&
        (proto === "blend" ||
          proto === "soroswap" ||
          proto === "aquarius" ||
          proto === "phoenix" ||
          proto === "stellar")
      ) {
        map.set(id, proto);
      }
    }
  }
  return map;
}

const PROTOCOL_BY_CONTRACT = buildMap();

export function lookupProtocol(contractId: string | undefined): Protocol | undefined {
  if (!contractId) return undefined;
  return PROTOCOL_BY_CONTRACT.get(contractId);
}
