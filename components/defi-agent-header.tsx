"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import useSWR from "swr";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { DefiAgentControls } from "./defi-agent-controls";
import { DefiAgentSidebarToggle } from "./defi-agent-sidebar-toggle";
import { Typography } from "./ui/typography";
import { ArrowLeft } from "lucide-react";
import { useDataStream } from "./data-stream-provider";
import { chatControllerGetChat } from "@/gen/client";
import { withAuth } from "@/lib/kubb-config";

type DefiAgentHeaderProps = {
  className?: string;
};

export function DefiAgentHeader({ className }: DefiAgentHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [title, setTitle] = useState("New Chat");
  const { dataStream } = useDataStream();

  // Extract chat ID from pathname (e.g., /agents/[agent-id]/[chat-id] or /agents/[id])
  const pathSegments = pathname?.split("/").filter(Boolean) || [];
  const chatId = pathSegments.length >= 2 ? pathSegments[pathSegments.length - 1] : null;

  // Fetch chat data to get title using generated client
  const { data: chatData, error, mutate } = useSWR(
    chatId && chatId !== "agents" ? `chat-${chatId}` : null,
    async () => {
      console.log('[DefiAgentHeader] Fetching chat:', chatId);
      try {
        const result = await chatControllerGetChat(chatId!, { 
          client: withAuth.client.client 
        });
        console.log('[DefiAgentHeader] Chat data received:', result);
        return result;
      } catch (err) {
        console.error('[DefiAgentHeader] Error fetching chat:', err);
        throw err;
      }
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // Log error if any
  useEffect(() => {
    if (error) {
      console.error('[DefiAgentHeader] SWR error:', error);
    }
  }, [error]);

  // Listen to data stream for title updates
  useEffect(() => {
    if (!dataStream?.length) return;

    for (const delta of dataStream) {
      if (delta.type === "data-chat-title") {
        setTitle(delta.data as string);
        // Also mutate the SWR cache to keep it in sync
        mutate();
      }
    }
  }, [dataStream, mutate]);

  useEffect(() => {
    if (chatData?.chat?.title) {
      setTitle(chatData.chat.title);
    } else if (!chatData) {
      setTitle("New Chat");
    }
  }, [chatData]);

  const handleBack = () => {
    // Always go back to /agents when clicking back
    router.push('/agents');
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex h-16 w-full items-center gap-3 bg-background p-4 sm:gap-4",
        "transition-all duration-300 ease-in-out",
        className
      )}
    >
      <Button
        className="h-8 w-8 p-0"
        onClick={handleBack}
        type="button"
        variant="outline"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div className="flex items-center gap-3">
        <Typography className="font-bold text-3xl text-foreground">
          {title}
        </Typography>
      </div>
      <div className="ml-auto flex items-center space-x-4">
        <DefiAgentControls
          showNewChatButton={true}
          showVisibilitySelector={false}
        />
        <DefiAgentSidebarToggle />
      </div>
    </header>
  );
}
