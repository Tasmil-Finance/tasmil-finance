"use client";

import { MessageSquare, Plus, Search, RefreshCw, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { cn } from "../../lib/utils";
import { useMultiSidebar } from "@/components/ui/multi-sidebar";
import { useThreads } from "@/providers/thread";
import { Thread } from "@langchain/langgraph-sdk";
import { getContentString } from "@/components/thread/utils";

export function ChatHistorySidebar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const { rightSidebarOpen, setRightSidebarOpen } = useMultiSidebar();
  
  // Get current agent ID from URL
  const currentAgentId = params.agentId as string || "yield";
  
  // Use threads from provider
  const { getThreads, threads, setThreads, threadsLoading, setThreadsLoading } = useThreads();

  // Load threads when sidebar opens
  useEffect(() => {
    if (rightSidebarOpen && typeof window !== "undefined") {
      setThreadsLoading(true);
      getThreads()
        .then(setThreads)
        .catch(console.error)
        .finally(() => setThreadsLoading(false));
    }
  }, [rightSidebarOpen, getThreads, setThreads, setThreadsLoading]);

  // Convert threads to chat history format
  const chatHistory = threads.map((t: Thread) => {
    let title = t.thread_id;
    let lastMessage = "";
    
    if (
      typeof t.values === "object" &&
      t.values &&
      "messages" in t.values &&
      Array.isArray(t.values.messages) &&
      t.values.messages?.length > 0
    ) {
      const firstMessage = t.values.messages[0];
      title = getContentString(firstMessage.content);
      
      const lastMsg = t.values.messages[t.values.messages.length - 1];
      lastMessage = getContentString(lastMsg.content);
    }
    
    return {
      id: t.thread_id,
      title: title.slice(0, 50) + (title.length > 50 ? "..." : ""),
      lastMessage: lastMessage.slice(0, 100) + (lastMessage.length > 100 ? "..." : ""),
      timestamp: t.created_at || new Date().toISOString(),
    };
  });

  const filteredChats = chatHistory.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group chats by date
  const groupedChats = filteredChats.reduce(
    (acc, chat) => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const chatDate = new Date(chat.timestamp);
      let group = "Older";
      
      if (chatDate.toDateString() === today.toDateString()) {
        group = "Today";
      } else if (chatDate.toDateString() === yesterday.toDateString()) {
        group = "Yesterday";
      }
      
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(chat);
      return acc;
    },
    {} as Record<string, typeof chatHistory>
  );

  const handleNewChat = () => {
    setSelectedThreadId(null);
    router.push(`/chat/${currentAgentId}/new`);
  };

  const handleSelectChat = (chatId: string) => {
    setSelectedThreadId(chatId);
    router.push(`/chat/${currentAgentId}/${chatId}`);
  };

  const handleRefresh = () => {
    setThreadsLoading(true);
    getThreads()
      .then(setThreads)
      .catch(console.error)
      .finally(() => setThreadsLoading(false));
  };

  return (
    <div className="flex h-full w-full flex-col bg-sidebar">
      {/* Header */}
      <div className="shrink-0 p-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm">Chat History</span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleRefresh}
              disabled={threadsLoading}
              className="flex h-7 w-7 items-center justify-center rounded hover:bg-sidebar-accent disabled:opacity-50"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", threadsLoading && "animate-spin")} />
            </button>
            <button
              onClick={handleNewChat}
              className="flex h-7 w-7 items-center justify-center rounded hover:bg-sidebar-accent"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setRightSidebarOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded hover:bg-sidebar-accent"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="relative mt-3">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-sidebar-foreground/50" />
          <input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-sidebar-border bg-sidebar-accent/50 py-2 pr-3 pl-9 text-sm"
          />
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4">
        {threadsLoading ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sidebar-foreground/30 mb-2"></div>
            <div className="text-sidebar-foreground/70 text-sm">Loading chats...</div>
          </div>
        ) : Object.keys(groupedChats).length > 0 ? (
          Object.entries(groupedChats).map(([timestamp, chatList]) => (
            <div key={timestamp} className="mb-4">
              <div className="mb-2 text-sidebar-foreground/50 text-xs">{timestamp}</div>
              <div className="space-y-1">
                {chatList.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => handleSelectChat(chat.id)}
                    className={cn(
                      "cursor-pointer rounded-lg px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent",
                      chat.id === selectedThreadId && "bg-sidebar-accent"
                    )}
                  >
                    <div className="font-medium truncate">{chat.title}</div>
                    <div className="text-xs text-sidebar-foreground/60 truncate mt-1">
                      {chat.lastMessage}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageSquare className="mb-2 h-8 w-8 text-sidebar-foreground/30" />
            <div className="text-sidebar-foreground/70 text-sm">
              {searchQuery ? "No chats found" : "No chats yet"}
            </div>
            <div className="text-sidebar-foreground/50 text-xs mt-1">
              Start a new conversation to see your chat history
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 p-4 pt-2">
        <button
          onClick={handleNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-sidebar-border px-3 py-1.5 text-xs transition-colors hover:bg-sidebar-accent"
        >
          <Plus className="h-3.5 w-3.5" />
          New Chat
        </button>
      </div>
    </div>
  );
}
