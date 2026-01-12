"use client";

// 🪝 Main chat session orchestration hook
// Using useCopilotChat for headless chat functionality

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useCopilotChat } from '@/features/chat-v2/hooks/use-copilot-chat';
import { useLangGraph, useChatState, usePendingMessage } from '@/features/chat-v2/providers';
import { historyService } from '@/features/chat-v2/services';
import type { UniversalMessage, ContentBlock, ToolCall } from '@/features/chat-v2/types';

interface UseChatSessionOptions {
  agentId: string;
  chatId: string;
  onNewThread?: (threadId: string) => void;
}

interface ChatSessionState {
  messages: UniversalMessage[];
  isLoading: boolean;
  isLoadingHistory: boolean;
  error: Error | null;
}

interface ChatSessionActions {
  sendMessage: (content: string, attachments?: ContentBlock[]) => void;
  regenerate: (messageId: string) => void;
  editMessage: (messageId: string, newContent: string) => void;
  stopGeneration: () => void;
  clearMessages: () => void;
}

export function useChatSession(options: UseChatSessionOptions): ChatSessionState & ChatSessionActions {
  const { agentId, chatId, onNewThread } = options;
  
  const { threadId, setThreadId } = useChatState();
  const { pendingMessage, setPendingMessage } = usePendingMessage();
  const { createThread, isInitialized } = useLangGraph();
  const [error, setError] = useState<Error | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const loadingHistoryRef = useRef(false);
  const pendingMessageSentRef = useRef(false);

  // Use the headless chat hook
  const {
    messages: rawMessages,
    sendMessage: copilotSendMessage,
    stopGeneration: copilotStopGeneration,
    isLoading,
    setMessages: copilotSetMessages,
  } = useCopilotChat();

  // Convert CopilotKit messages to Universal format
  const messages = useMemo<UniversalMessage[]>(() => {
    return rawMessages.map((msg) => {
      // Extract tool calls from assistant messages
      const toolCalls: ToolCall[] = msg.toolCalls?.map((tc) => ({
        id: tc.id,
        name: tc.name ?? 'unknown',
        args: tc.args ?? {},
        result: tc.result,
        status: tc.status ?? 'pending',
      })) || [];

      return {
        id: msg.id,
        role: msg.role === "user" ? "human" as const : "ai" as const,
        content: msg.content || "",
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        metadata: {
          generativeUI: msg.generativeUI,
          rawMessage: msg,
        },
      };
    });
  }, [rawMessages]);

  // Load message history when opening an existing thread
  useEffect(() => {
    let cancelled = false;
    
    async function loadHistory() {
      // Skip if new chat
      if (chatId === 'new') {
        setIsLoadingHistory(false);
        return;
      }

      // Wait for client to be initialized
      if (!isInitialized) {
        console.log('[ChatSession] Client not initialized yet, waiting...');
        return;
      }

      // Skip if already loading
      if (loadingHistoryRef.current) {
        return;
      }

      loadingHistoryRef.current = true;
      setIsLoadingHistory(true);
      
      try {
        console.log('[ChatSession] Loading history for thread:', chatId);
        const historyMessages = await historyService.getHistory(chatId);
        
        console.log('[ChatSession] Raw history messages:', historyMessages);
        
        if (cancelled) return;
        
        if (historyMessages.length > 0) {
          // Convert UniversalMessage to CopilotKit format for setMessages
          const copilotMessages = historyMessages.map(msg => {
            const textContent = typeof msg.content === 'string' 
              ? msg.content 
              : '';
            
            console.log('[ChatSession] Converting message:', msg.role, '|', textContent.slice(0, 50));
            
            return {
              id: msg.id,
              role: msg.role === 'human' ? 'user' as const : 'assistant' as const,
              content: textContent,
              toolCalls: msg.toolCalls?.map(tc => ({
                id: tc.id,
                name: tc.name,
                args: tc.args,
                result: tc.result,
                status: tc.status,
              })),
            };
          });
          
          console.log('[ChatSession] Setting messages via setMessages, count:', copilotMessages.length);
          copilotSetMessages(copilotMessages);
        } else {
          console.log('[ChatSession] No history found for thread:', chatId);
        }
      } catch (err) {
        console.error('[ChatSession] Failed to load history:', err);
      } finally {
        if (!cancelled) {
          loadingHistoryRef.current = false;
          setIsLoadingHistory(false);
        }
      }
    }

    loadHistory();
    
    return () => {
      cancelled = true;
    };
  }, [chatId, isInitialized, copilotSetMessages]);

  // Clear messages when chatId changes to a new chat
  useEffect(() => {
    if (chatId === 'new') {
      copilotSetMessages([]);
    }
    loadingHistoryRef.current = false;
  }, [chatId, copilotSetMessages]);

  // Initialize thread for new chats
  useEffect(() => {
    if (chatId === 'new' && !threadId) {
      // Will create thread on first message
    } else if (chatId !== 'new' && chatId !== threadId) {
      setThreadId(chatId);
    }
  }, [chatId, threadId, setThreadId]);

  // Send pending message after redirect to new thread
  useEffect(() => {
    if (
      chatId !== 'new' && 
      pendingMessage && 
      isInitialized && 
      !pendingMessageSentRef.current
    ) {
      console.log('[ChatSession] Sending pending message after redirect:', pendingMessage.slice(0, 50));
      pendingMessageSentRef.current = true;
      
      // Small delay to ensure CopilotKit is fully mounted
      setTimeout(() => {
        copilotSendMessage(pendingMessage);
        setPendingMessage(null);
      }, 100);
    }
  }, [chatId, pendingMessage, isInitialized, copilotSendMessage, setPendingMessage]);

  // Reset pending message sent flag when chatId changes
  useEffect(() => {
    pendingMessageSentRef.current = false;
  }, [chatId]);

  // Send message handler
  const sendMessage = useCallback(async (
    content: string,
    _attachments?: ContentBlock[]
  ): Promise<void> => {
    try {
      setError(null);
      console.log('[ChatSession] Sending message:', content.slice(0, 50));

      // Create thread if this is a new chat and LangGraph is initialized
      if (chatId === 'new' && !threadId && isInitialized) {
        console.log('[ChatSession] Creating new thread first...');
        
        const newThread = await createThread({
          metadata: {
            agentId,
            title: content.slice(0, 50),
          },
        });
        
        if (newThread) {
          console.log('[ChatSession] Thread created:', newThread.id);
          // Store pending message and redirect
          setPendingMessage(content);
          setThreadId(newThread.id);
          onNewThread?.(newThread.id);
          return; // Message will be sent after redirect
        }
      }

      // Send message via CopilotKit (for existing threads)
      console.log('[ChatSession] Sending via copilotSendMessage...');
      copilotSendMessage(content);
      
      console.log('[ChatSession] Message sent successfully');
    } catch (err) {
      console.error('[ChatSession] Error sending message:', err);
      setError(err instanceof Error ? err : new Error('Failed to send message'));
    }
  }, [chatId, threadId, agentId, isInitialized, createThread, setThreadId, onNewThread, copilotSendMessage, setPendingMessage]);

  // Stop generation
  const stopGeneration = useCallback(() => {
    copilotStopGeneration();
  }, [copilotStopGeneration]);

  // Regenerate message
  const regenerate = useCallback((messageId: string): void => {
    try {
      setError(null);
      
      const messageIndex = rawMessages.findIndex((m) => m.id === messageId);
      if (messageIndex === -1) return;

      const messagesBeforeAI = rawMessages.slice(0, messageIndex);
      const lastUserMessage = [...messagesBeforeAI].reverse().find((m) => m.role === "user");
      
      if (!lastUserMessage) {
        console.error("No user message found to regenerate from");
        return;
      }

      // Set messages to before the AI response
      copilotSetMessages(messagesBeforeAI);

      // Re-send the last user message
      setTimeout(() => {
        copilotSendMessage(lastUserMessage.content);
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to regenerate'));
    }
  }, [rawMessages, copilotSetMessages, copilotSendMessage]);

  // Edit message
  const editMessage = useCallback((
    messageId: string,
    newContent: string
  ): void => {
    try {
      setError(null);

      const messageIndex = rawMessages.findIndex((m) => m.id === messageId);
      if (messageIndex === -1) return;

      const messagesBefore = rawMessages.slice(0, messageIndex);
      copilotSetMessages(messagesBefore);

      // Send the edited message
      setTimeout(() => {
        copilotSendMessage(newContent);
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to edit message'));
    }
  }, [rawMessages, copilotSetMessages, copilotSendMessage]);

  // Clear messages
  const clearMessages = useCallback(() => {
    copilotSetMessages([]);
  }, [copilotSetMessages]);

  return {
    messages,
    isLoading,
    isLoadingHistory,
    error,
    sendMessage,
    regenerate,
    editMessage,
    stopGeneration,
    clearMessages,
  };
}
