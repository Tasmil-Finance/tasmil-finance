import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { convertToUIMessages } from "@/lib/utils";
import type { ChatMessage } from "@repo/api";
import { AgentChatClient } from "./agent-chat-client";

export default async function Page(props: {
  params: Promise<{ "agent-id": string; "chat-id": string }>;
}) {
  const params = await props.params;
  const { "agent-id": agentId, "chat-id": chatId } = params;

  const session = await auth();

  // Log session for debugging
  console.log("[Page] Session check:", {
    hasSession: !!session,
    hasUser: !!session?.user,
    userId: session?.user?.id,
  });

  // Allow access even if session.user is null, backend will verify
  // Only redirect if session itself is null (shouldn't happen)
  if (!session) {
    redirect("/api/auth/guest");
  }

  // Load agent info using Kubb client
  try {
    const { agentsControllerGetAgent } = await import('@/gen/client');
    const { getServerWithAuth } = await import('@/lib/server-api-client');
    const withAuth = await getServerWithAuth();
    const agentData = await agentsControllerGetAgent(agentId, withAuth);
    
    if (!agentData || !agentData.id) {
      console.error("Invalid agent data received:", agentData);
      notFound();
      return;
    }
    console.log("[Page] Agent loaded successfully:", agentData.id);
  } catch (error) {
    console.error("Failed to load agent:", error);
    notFound();
    return;
  }

  // Load chat from backend API (similar to /app/chat/chat/[id]/page.tsx)
  let chatData = null;
  let uiMessages: ChatMessage[] = [];
  let chatVisibility: "public" | "private" = "private";
  let isReadonly = false;

  // Always try to load chat if chatId is provided (not "new")
  if (chatId && chatId !== "new") {
    try {
      // Use Kubb client to fetch chat
      const { chatControllerGetChat } = await import('@/gen/client');
      const { getServerWithAuth } = await import('@/lib/server-api-client');
      const withAuth = await getServerWithAuth();
      
      console.log("[Page] Fetching chat:", chatId);
      chatData = await chatControllerGetChat(chatId, withAuth);
      console.log("[Page] Chat data received:", {
        hasChat: !!chatData?.chat,
        hasMessages: !!chatData?.messages,
        messagesCount: chatData?.messages?.length || 0,
        chatId: chatData?.chat?.id,
      });
      
      if (chatData?.chat) {
        const chat = chatData.chat;
        // Backend already verified permissions (returns 403 if no access)
        // So if we get here with 200, user has access
        chatVisibility = chat.visibility;
        console.log("[Page] Raw messages from API:", {
          messages: chatData.messages,
          messagesType: typeof chatData.messages,
          isArray: Array.isArray(chatData.messages),
          length: chatData.messages?.length,
        });
        uiMessages = chatData.messages ? convertToUIMessages(chatData.messages) : [];
        // Check if user is owner based on session (if available) or assume readonly if session is null
        isReadonly = session.user ? session.user.id !== chat.userId : false;
        
        console.log("[Page] Chat loaded successfully:", {
          chatId: chat.id,
          rawMessagesCount: chatData.messages?.length || 0,
          uiMessagesCount: uiMessages.length,
          visibility: chatVisibility,
          isReadonly,
          firstUIMessage: uiMessages[0],
        });
      } else {
        // Response ok but no chat data, treat as new chat
        console.log("[Page] No chat data in response, treating as new chat");
      }
    } catch (error: unknown) {
      // Check if it's a 403 or 404 error
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 403) {
          console.error("Access forbidden to chat");
          notFound();
          return;
        } else if (axiosError.response?.status === 404) {
          console.log("Chat not found (404), treating as new chat");
        } else {
          console.error("Error fetching chat:", axiosError);
        }
      } else {
        console.error("Error fetching chat:", error);
      }
      // Continue with empty messages for new chat
    }
  }

  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get("chat-model");

  console.log("[Page] Rendering AgentChatClient with:", {
    chatId,
    messagesCount: uiMessages.length,
    agentId,
    isReadonly,
    chatVisibility,
  });

  return (
    <AgentChatClient
      autoResume={true}
      chatId={chatId}
      initialChatModel={chatModelFromCookie?.value || DEFAULT_CHAT_MODEL}
      initialMessages={uiMessages}
      initialVisibilityType={chatVisibility}
      isReadonly={isReadonly}
      agentId={agentId}
    />
  );
}

