"use client";

// 🎨 Chat messages list component

import { memo, type ReactNode } from 'react';
import type { UniversalMessage } from '@/features/chat-v2/types';
import { HumanMessage, AssistantMessage, AssistantLoading } from '@/features/chat-v2/components/messages';

interface ChatMessagesProps {
  messages: UniversalMessage[];
  isLoading: boolean;
  onRegenerate: (index: number) => void;
  onEditMessage: (index: number, newContent: string) => void;
}

/**
 * Check if message content is a raw JSON tool result that should be hidden
 */
function isToolResultMessage(message: UniversalMessage): boolean {
  if (message.role !== 'ai') return false;
  
  const content = typeof message.content === 'string' ? message.content.trim() : '';
  if (!content) return false;
  
  // Check if content starts with { and looks like JSON tool result
  if (content.startsWith('{') && content.includes('"success"')) {
    try {
      const parsed = JSON.parse(content);
      // If it has success field, it's likely a tool result
      if ('success' in parsed) return true;
    } catch {
      // Not valid JSON, keep the message
    }
  }
  
  return false;
}

function ChatMessagesComponent({
  messages,
  isLoading,
  onRegenerate,
  onEditMessage,
}: ChatMessagesProps) {
  // Check if last AI message has content (streaming complete for that message)
  const lastAiMessage = messages.filter(m => m.role === 'ai').pop();
  const isAiStreaming = isLoading && lastAiMessage && !lastAiMessage.content;

  // Filter out raw JSON tool result messages
  const filteredMessages = messages.filter(msg => !isToolResultMessage(msg));

  return (
    <div className="flex flex-col gap-4">
      {filteredMessages.map((message, index) => {
        return message.role === 'human' ? (
          <HumanMessage
            key={message.id || `${message.role}-${index}`}
            message={message}
            isLoading={isLoading}
            onEdit={(newContent) => onEditMessage(index, newContent)}
          />
        ) : (
          <div key={message.id || `${message.role}-${index}`}>
            <AssistantMessage
              message={message}
              isLoading={isLoading}
              handleRegenerate={() => onRegenerate(index)}
            />
            {/* Render generative UI if available */}
            {(() => {
              const generativeUI = message.metadata?.['generativeUI'];
              if (!generativeUI) return null;
              return (
                <div className="mt-2 ml-11">
                  {typeof generativeUI === 'function' 
                    ? (generativeUI as () => ReactNode)() 
                    : generativeUI as ReactNode}
                </div>
              );
            })()}
          </div>
        );
      })}

      {/* Show loading only when waiting for first token */}
      {isLoading && (!lastAiMessage || isAiStreaming) && <AssistantLoading />}
    </div>
  );
}

export const ChatMessages = memo(ChatMessagesComponent);
