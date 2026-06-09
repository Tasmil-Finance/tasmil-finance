/**
 * Kubb-compatible HTTP client for the NestJS backend (port 6756).
 *
 * This module is referenced by kubb.config.backend.js as the `importPath`
 * for pluginClient, so every generated file in src/gen-backend/client/ will
 * import its `fetch` default and RequestConfig / ResponseErrorConfig types
 * from here — automatically routing all requests through `backendAxios`
 * (which attaches JWT Bearer tokens and handles 401s globally).
 *
 * We re-export RequestConfig / ResponseErrorConfig from the official Kubb axios
 * client so the gen-backend hook files can import compatible types.
 */

import type { RequestConfig, ResponseErrorConfig } from "@kubb/plugin-client/clients/axios";
import backendAxios from "@/lib/kubb-backend";

export type { RequestConfig, ResponseErrorConfig };
export type Client = typeof fetch;

/**
 * Drop-in for @kubb/plugin-client/clients/axios fetch.
 * Uses the same RequestConfig signature so generated hook files that type
 * `client?: typeof fetch` remain compatible with this module.
 */
async function fetch<TData = unknown, _TError = unknown, _TVariables = unknown>(
  config: RequestConfig
): Promise<{ data: TData }> {
  return backendAxios.request<TData>({
    method: config.method,
    url: config.url,
    params: config.params,
    data: config.data,
    headers: config.headers as Record<string, string>,
    signal: config.signal,
  });
}

export default fetch;
