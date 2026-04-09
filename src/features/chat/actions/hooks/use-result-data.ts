"use client";

import { useMemo } from "react";

interface ResultData<T = any> {
  data: T | null;
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string | null;
}

/**
 * Hook to extract and normalize result data from MCP tool responses.
 * Handles both `{ success, data, error }` and direct data formats.
 */
export function useResultData<T = any>(result: unknown, status?: string): ResultData<T> {
  return useMemo(() => {
    const isLoading = !result || status === "pending";

    if (isLoading) {
      return { data: null, isLoading: true, hasError: false, errorMessage: null };
    }

    let parsed: any = result;
    if (typeof result === "string") {
      try {
        parsed = JSON.parse(result);
      } catch {
        parsed = { raw: result };
      }
    }

    const hasError =
      parsed?.success === false || parsed?.error != null || parsed?.status === "error";

    const errorMessage = hasError ? (parsed?.error ?? parsed?.message ?? "Operation failed") : null;

    const data = (parsed?.data ?? parsed) as T;

    return { data, isLoading: false, hasError, errorMessage };
  }, [result, status]);
}
