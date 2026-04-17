"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminAuthStore } from "@/store/use-admin-auth";
import { toast } from "sonner";

interface AccessCodeItem {
  id: string;
  code: string;
  status: string;
  createdAt: string;
}

interface CodesListResponse {
  codes: AccessCodeItem[];
  total: number;
}

interface GenerateCodesResponse {
  codes: string[];
}

export function useAdminCodes(page: number) {
  const token = useAdminAuthStore((s) => s.token);

  return useQuery<CodesListResponse>({
    queryKey: ["admin-codes", page],
    queryFn: async () => {
      const response = await fetch(`/api/admin/codes?page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch codes");
      const json = await response.json();
      return json.data ?? json;
    },
    enabled: !!token,
  });
}

export function useGenerateCodes() {
  const token = useAdminAuthStore((s) => s.token);
  const queryClient = useQueryClient();

  return useMutation<GenerateCodesResponse, Error, { quantity: number }>({
    mutationFn: async ({ quantity }) => {
      const response = await fetch("/api/admin/codes/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message ?? "Failed to generate codes");
      }
      const json = await response.json();
      return json.data ?? json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-codes"] });
      toast.success("Codes generated!");
    },
    onError: (error) => {
      toast.error("Generation failed", { description: error.message });
    },
  });
}

export function useRevokeCode() {
  const token = useAdminAuthStore((s) => s.token);
  const queryClient = useQueryClient();

  return useMutation<AccessCodeItem, Error, string>({
    mutationFn: async (id) => {
      const response = await fetch(`/api/admin/codes/${id}/revoke`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message ?? "Failed to revoke code");
      }
      const json = await response.json();
      return json.data ?? json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-codes"] });
      toast.success("Code revoked");
    },
    onError: (error) => {
      toast.error("Revoke failed", { description: error.message });
    },
  });
}
