"use client";

import { useChat as useAiChat } from "@ai-sdk/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@repo/api";
import { generateUUID } from "@/lib/utils";
import { getApiBaseUrl } from "@/lib/api-client";

export function useChatApi({
  id,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
}: {
  id: string;
  initialMessages: ChatMessage[];
  initialChatModel: string;
  initialVisibilityType: "public" | "private";
}) {
  const router = useRouter();
  const [currentModelId, setCurrentModelId] = useState(initialChatModel);
  const currentModelIdRef = useRef(currentModelId);

  useEffect(() => {
    currentModelIdRef.current = currentModelId;
  }, [currentModelId]);

  const {
    messages,
    setMessages,
    sendMessage: aiSendMessage,
    status,
    stop,
    regenerate,
    resumeStream,
    addToolApprovalResponse,
  } = useAiChat<ChatMessage>({
    id,
    messages: initialMessages,
    experimental_throttle: 100,
    generateId: generateUUID,
    sendAutomaticallyWhen: ({ messages: currentMessages }) => {
      const lastMessage = currentMessages.at(-1);
      const shouldContinue =
        lastMessage?.parts?.some(
          (part) =>
            part.type === "tool-call" &&
            part.toolCallId &&
            part.result === undefined &&
            part.status === "approved"
        ) ?? false;
      return shouldContinue;
    },
    async onFinish() {
      router.refresh();
    },
    transport: {
      // Use custom transport for SSE
      streamProtocol: "sse",
      send: async ({ body }) => {
        const requestBody = typeof body === "string" ? JSON.parse(body) : body;
        const API_BASE_URL = getApiBaseUrl();
        const { accessToken } = (await import('@/store/use-auth')).useAuthStore.getState();
        
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({
            id,
            message: requestBody.message,
            messages: requestBody.messages,
            selectedChatModel: currentModelIdRef.current,
            selectedVisibilityType: initialVisibilityType,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const { ChatSDKError } = await import('@repo/api');
          throw new ChatSDKError(errorData.code, errorData.cause);
        }

        if (!response.body) {
          throw new Error('Response body is null');
        }

        return response.body;
      },
    },
  });

  const sendMessage = async (message: ChatMessage) => {
    await aiSendMessage(message);
  };

  return {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    resumeStream,
    addToolApprovalResponse,
    currentModelId,
    setCurrentModelId,
  };
}

