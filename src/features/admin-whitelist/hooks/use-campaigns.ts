"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminAuthStore } from "@/store/use-admin-auth";
import { toast } from "sonner";

export interface CampaignRun {
  id: string;
  name: string;
  status: string;
  targetedCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

interface CampaignStatusResponse {
  id: string;
  name: string;
  status: string;
  targetedCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
}

export function useCampaignHistory() {
  const token = useAdminAuthStore((s) => s.token);

  return useQuery<CampaignRun[]>({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const response = await fetch("/api/admin/campaigns", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch campaigns");
      const json = await response.json();
      return json.data ?? json;
    },
    enabled: !!token,
  });
}

export function useCampaignStatus(id: string | null) {
  const token = useAdminAuthStore((s) => s.token);

  return useQuery<CampaignStatusResponse>({
    queryKey: ["campaign-status", id],
    queryFn: async () => {
      const response = await fetch(`/api/admin/campaign/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch campaign status");
      const json = await response.json();
      return json.data ?? json;
    },
    enabled: !!token && !!id,
    refetchInterval: (query) =>
      query.state.data?.status === "RUNNING" ? 2000 : false,
  });
}

export function useSendCampaign() {
  const token = useAdminAuthStore((s) => s.token);
  const queryClient = useQueryClient();

  return useMutation<{ campaignId: string; targeted: number }, Error, { name: string }>({
    mutationFn: async (dto) => {
      const response = await fetch("/api/admin/campaign/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dto),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message ?? "Failed to send campaign");
      }
      const json = await response.json();
      return json.data ?? json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campaign started!", { description: "Access emails are being delivered." });
    },
    onError: (error) => {
      toast.error("Campaign failed", { description: error.message });
    },
  });
}
