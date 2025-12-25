import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { DEFAULT_CHAT_MODEL } from "@/lib/constants";
import { convertToUIMessages } from "@/lib/utils";
import type { ChatMessage } from "@repo/api";

export default function Page(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="flex h-dvh" />}>
      <ChatPage params={props.params} />
    </Suspense>
  );
}

async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get("chat-model");
  
  let initialMessages: ChatMessage[] = [];
  let initialVisibilityType: "public" | "private" = "private";

  try {
    // Use Kubb client to fetch chat
    const { chatControllerGetChat } = await import('@/gen/client');
    const { getServerWithAuth } = await import('@/lib/server-api-client');
    const withAuth = await getServerWithAuth();
    
    const data = await chatControllerGetChat({ id }, withAuth);
    console.log("[ChatPage] Fetched chat data:", {
      chatId: id,
      hasChat: !!data.chat,
      messagesCount: data.messages?.length || 0,
      visibility: data.chat?.visibility,
    });
    initialMessages = convertToUIMessages(data.messages || []);
    initialVisibilityType = data.chat?.visibility || "private";
    console.log("[ChatPage] Converted messages:", initialMessages.length);
  } catch (error: unknown) {
    // Check if it's a 404 error
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 404) {
        console.log("[ChatPage] Chat not found, redirecting");
        redirect("/");
      } else {
        console.error("[ChatPage] Failed to fetch chat:", axiosError.response?.status);
      }
    } else {
      console.error("Error fetching chat:", error);
    }
    // If fetch fails, continue with empty messages (new chat)
  }

  // Check if user has access to this chat
  // Note: In production, you'd want to check session user ID
  const isReadonly = false; // TODO: Check if current user is the owner

  return (
    <>
      <Chat
        autoResume={true}
        id={id}
        initialChatModel={chatModelFromCookie?.value || DEFAULT_CHAT_MODEL}
        initialMessages={initialMessages}
        initialVisibilityType={initialVisibilityType}
        isReadonly={isReadonly}
      />
      <DataStreamHandler />
    </>
  );
}

