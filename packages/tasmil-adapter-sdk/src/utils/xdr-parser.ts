import { xdr, scValToNative } from "@stellar/stellar-sdk";

/**
 * Decode a base64 XDR ScVal result from simulateTransaction into a native JS value.
 */
export function decodeScVal(base64Xdr: string): unknown {
  const scVal = xdr.ScVal.fromXDR(base64Xdr, "base64");
  const native = scValToNative(scVal);
  return sanitizeBigInts(native);
}

function sanitizeBigInts(value: unknown): unknown {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map(sanitizeBigInts);
  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = sanitizeBigInts(v);
    }
    return result;
  }
  return value;
}
