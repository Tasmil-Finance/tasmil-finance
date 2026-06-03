/**
 * Lightweight NEAR RPC client for view function calls.
 * Used by TemplarAdapter (Templar lending markets live on NEAR, accessed via JSON-RPC).
 * No gas or signing required for view functions.
 *
 * Includes exponential backoff retry for 429 rate-limit responses
 * (fastnear.com rate-limits concurrent requests).
 */

const DEFAULT_NEAR_RPC = "https://rpc.fastnear.com";
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 800;

export class NearRpcError extends Error {
  public readonly code?: string | number;
  constructor(message: string, code?: string | number) {
    super(message);
    this.name = "NearRpcError";
    this.code = code;
  }
}

/**
 * Call a NEAR contract view function. No gas, no signing required.
 * Automatically retries on 429 (rate limit) with exponential backoff.
 *
 * @param contractId - NEAR contract account ID (e.g. "ixlm-ixlmusdc.v1.tmplr.near")
 * @param method - View method name
 * @param args - Method arguments (serialized to base64 JSON)
 * @returns Decoded JSON result, or null if the method exists but returns no result
 * @throws NearRpcError if the contract or account does not exist
 */
export async function nearViewCall(
  contractId: string,
  method: string,
  args: Record<string, unknown> = {},
): Promise<unknown> {
  const url = process.env["NEAR_RPC_URL"] ?? DEFAULT_NEAR_RPC;

  const body = {
    jsonrpc: "2.0",
    id: 1,
    method: "query",
    params: {
      request_type: "call_function",
      finality: "final",
      account_id: contractId,
      method_name: method,
      args_base64: Buffer.from(JSON.stringify(args)).toString("base64"),
    },
  };

  let lastErr: NearRpcError | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      // Exponential backoff: 800ms, 1600ms, 3200ms
      await new Promise((r) => setTimeout(r, RETRY_BASE_MS * 2 ** (attempt - 1)));
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.status === 429) {
      lastErr = new NearRpcError("NEAR RPC HTTP error: 429 Too Many Requests", 429);
      continue; // retry
    }

    if (!res.ok) {
      throw new NearRpcError(
        `NEAR RPC HTTP error: ${res.status} ${res.statusText}`,
        res.status,
      );
    }

    const data = (await res.json()) as Record<string, unknown>;

    if (data["error"]) {
      const err = data["error"] as Record<string, unknown>;
      throw new NearRpcError(
        `NEAR RPC error: ${err["message"] ?? JSON.stringify(err)}`,
        err["code"] as string | number | undefined,
      );
    }

    const result = data["result"] as Record<string, unknown> | undefined;
    if (result?.["result"]) {
      // result.result is a byte array; decode as UTF-8 then parse JSON
      return JSON.parse(
        Buffer.from(result["result"] as number[]).toString("utf-8"),
      );
    }

    return null;
  }

  // All retries exhausted
  throw lastErr ?? new NearRpcError("NEAR RPC: max retries exhausted", 429);
}
