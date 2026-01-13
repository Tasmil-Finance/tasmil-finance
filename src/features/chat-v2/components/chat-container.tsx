"use client";

// 🎨 Chat container - main chat layout

import { useState, useRef, useEffect, FormEvent, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useCopilotReadable } from '@copilotkit/react-core';
import { cn } from '@/lib/utils';
import { useFileUpload } from '@/shared/hooks/use-file-upload';
import { useIsMobile } from '@/shared/hooks/use-mobile';

import { useChatSession } from '@/features/chat-v2/hooks';
import { useDefiActions, useStakingActions } from '@/features/chat-v2/actions';
import { ChatHeader } from '@/features/chat-v2/components/chat-header';
import { ChatMessages } from '@/features/chat-v2/components/chat-messages';
import { ChatInput } from '@/features/chat-v2/components/chat-input';
import { Greeting } from '@/features/chat-v2/components/greeting';
import { Suggestions } from '@/features/chat-v2/components/suggestions';
import { ScrollToBottom } from '@/features/chat-v2/components/scroll-to-bottom';
import { HistorySkeleton } from '@/features/chat-v2/components/messages';

interface ChatContainerProps {
  agentId: string;
  chatId: string;
  onNewThread?: (threadId: string) => void;
  className?: string;
}

// Wrapper component to conditionally register staking wallet tools
// This avoids the "hooks called conditionally" React error
function StakingActionsProvider({ children }: { children: React.ReactNode }) {
  useStakingActions();
  return <>{children}</>;
}

export function ChatContainer({ 
  agentId, 
  chatId, 
  onNewThread,
  className 
}: ChatContainerProps) {
  const isMobile = useIsMobile();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const [isInteractingWithContent, setIsInteractingWithContent] = useState(false);
  const lastMessageCountRef = useRef(0);

  // Get connected wallet address
  const { address, isConnected } = useAccount();

  // Make wallet address available to the AI agent
  // This allows the agent to automatically use the user's wallet address
  // for read-only queries without asking
  useCopilotReadable({
    description: "The user's connected wallet address for blockchain operations",
    value: isConnected && address 
      ? `User's wallet address: ${address}` 
      : "User has not connected their wallet yet. Ask them to connect their wallet first.",
  });

  // Initialize DeFi actions (read-only renders for all agents)
  useDefiActions(agentId);

  // File upload hook
  const {
    contentBlocks,
    setContentBlocks,
    handleFileUpload,
    dropRef,
    removeBlock,
    dragOver,
    handlePaste,
  } = useFileUpload();

  // Chat session hook
  const {
    messages,
    isLoading,
    isLoadingHistory,
    sendMessage,
    regenerate,
    editMessage,
    stopGeneration,
  } = useChatSession({ agentId, chatId, onNewThread });

  // Determine UI states
  const isNewChat = chatId === 'new';
  const showGreeting = isNewChat && messages.length === 0 && !isLoading;
  const showSuggestions = (isNewChat && messages.length === 0) || (!isLoading && messages.length > 0);
  
  // Only show AI loading when actually sending a message, not when loading history
  const showAiLoading = isLoading && !isLoadingHistory;

  // Auto-scroll to bottom only when new messages arrive and user hasn't scrolled up
  // and user is not interacting with scrollable content inside messages
  useEffect(() => {
    if (messages.length > lastMessageCountRef.current && !userScrolledUp && !isInteractingWithContent) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    lastMessageCountRef.current = messages.length;
  }, [messages.length, userScrolledUp, isInteractingWithContent]);

  // Track scroll position for scroll-to-bottom button
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
      
      if (!isNearBottom) {
        setUserScrolledUp(true);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Detect when user is interacting with scrollable content inside messages
  // This prevents auto-scroll from interrupting user's scroll inside tool UI cards
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if hovering over a scrollable element inside messages
      const scrollableParent = target.closest('[data-scrollable="true"], .overflow-y-auto, .overflow-auto');
      if (scrollableParent && scrollableParent !== container) {
        setIsInteractingWithContent(true);
      }
    };

    const handleMouseLeave = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const scrollableParent = target.closest('[data-scrollable="true"], .overflow-y-auto, .overflow-auto');
      if (scrollableParent && scrollableParent !== container) {
        setIsInteractingWithContent(false);
      }
    };

    // Use event delegation for better performance
    container.addEventListener('mouseenter', handleMouseEnter, true);
    container.addEventListener('mouseleave', handleMouseLeave, true);

    return () => {
      container.removeEventListener('mouseenter', handleMouseEnter, true);
      container.removeEventListener('mouseleave', handleMouseLeave, true);
    };
  }, []);

  const scrollToBottom = useCallback(() => {
    setUserScrolledUp(false);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();
    if ((input.trim().length === 0 && contentBlocks.length === 0) || isLoading) return;

    let messageContent = input.trim();
    
    if (contentBlocks.length > 0) {
      const fileDescriptions = contentBlocks.map(block => {
        if (block.type === 'image_url') {
          return `[Image: ${(block as any).image_url?.url || 'uploaded image'}]`;
        }
        return `[File: ${block.type}]`;
      }).join('\n');
      
      messageContent = messageContent ? `${messageContent}\n\n${fileDescriptions}` : fileDescriptions;
    }

    sendMessage(messageContent);
    setInput('');
    setContentBlocks([]);
    setUserScrolledUp(false);
  }, [input, contentBlocks, isLoading, sendMessage, setContentBlocks]);

  const handleRegenerate = useCallback((messageIndex: number) => {
    if (isLoading) return;
    
    const targetMessage = messages[messageIndex];
    if (!targetMessage || targetMessage.role !== 'ai') {
      return;
    }

    regenerate(targetMessage.id);
  }, [isLoading, messages, regenerate]);

  const handleEditMessage = useCallback((messageIndex: number, newContent: string) => {
    if (isLoading || !newContent.trim()) return;
    
    const targetMessage = messages[messageIndex];
    if (!targetMessage) return;

    editMessage(targetMessage.id, newContent);
  }, [isLoading, messages, editMessage]);

  const handleSendSuggestion = useCallback((text: string) => {
    if (!text.trim() || isLoading) return;
    sendMessage(text);
    setUserScrolledUp(false);
  }, [isLoading, sendMessage]);

  const content = (
    <div className={cn('flex h-full flex-col overflow-hidden', className)}>
      {/* Header */}
      <ChatHeader agentId={agentId} chatId={chatId} />

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        className="relative flex-1 overflow-y-auto"
      >
        <div className="mx-auto max-w-3xl px-4 pt-6 pb-4">
          {showGreeting && <Greeting agentId={agentId} />}
          
          {/* Show skeleton only when loading history */}
          {isLoadingHistory ? (
            <HistorySkeleton />
          ) : (
            <ChatMessages
              messages={messages}
              isLoading={showAiLoading}
              onRegenerate={handleRegenerate}
              onEditMessage={handleEditMessage}
            />
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to bottom button */}
        <ScrollToBottom 
          show={showScrollButton} 
          onClick={scrollToBottom} 
          isMobile={isMobile} 
        />
      </div>

      {/* Input Area */}
      <div className={cn(
        'shrink-0 bg-background px-4 py-4',
        isMobile && 'pb-6'
      )}>
        <div className="mx-auto max-w-3xl">
          {/* Suggestions */}
          {showSuggestions && !isLoadingHistory && (
            <div className="mb-4">
              <Suggestions agentId={agentId} onSendMessage={handleSendSuggestion} />
            </div>
          )}

          {/* Input Form - disable during history loading */}
          <ChatInput
            input={input}
            setInput={setInput}
            onSubmit={handleSubmit}
            isLoading={showAiLoading}
            onStop={stopGeneration}
            contentBlocks={contentBlocks as any[]}
            onRemoveBlock={removeBlock}
            onFileUpload={handleFileUpload}
            onPaste={handlePaste as any}
            dropRef={dropRef as any}
            dragOver={dragOver}
          />
        </div>
      </div>
    </div>
  );

  // Wrap with StakingActionsProvider only for staking_agent
  // This registers wallet operation tools (useHumanInTheLoop) only for staking
  if (agentId === 'staking_agent') {
    return <StakingActionsProvider>{content}</StakingActionsProvider>;
  }

  return content;
}
