"use client";

import { useMutation } from "@tanstack/react-query";
import { useAdminAuthStore } from "@/store/use-admin-auth";
import { toast } from "sonner";

interface CampaignDto {
  name: string;
  targetEmails?: string;
}

export function useAdminCampaign() {
  const token = useAdminAuthStore((s) => s.token!);

  const { mutateAsync: sendCampaignFn, isPending: isSending } = useMutation({
    mutationFn: async (dto: CampaignDto) => {
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

      return response.json();
    },
    onSuccess: () => {
      toast.success("Campaign sent!", { description: "Access emails are being delivered." });
    },
    onError: (error: Error) => {
      toast.error("Campaign failed", { description: error.message });
    },
  });

  async function getCampaignStatus(campaignId: string) {
    const response = await fetch(`/api/admin/campaign/${campaignId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Failed to get campaign status");
    return response.json();
  }

  return { sendCampaign: sendCampaignFn, getCampaignStatus, isSending };
}