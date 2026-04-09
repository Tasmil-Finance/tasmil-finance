import type { Message } from '@langchain/langgraph-sdk';

/**
 * Extracts a string summary from a message's content, supporting multimodal (text, image, file, etc.).
 * - If text is present, returns the joined text.
 * - If not, returns a label for the first non-text modality (e.g., 'Image', 'Other').
 * - If unknown, returns 'Multimodal message'.
 */
export function getContentString(content: Message['content']): string {
  if (typeof content === 'string') return content;
  const texts = content
    .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
    .map((c) => c.text);
  return texts.join(' ');
}

/**
 * Extract reasoning content from AI message.
 * Returns the content inside <reasoning>...</reasoning> or <thinking>...</thinking> tags.
 */
export function extractReasoningContent(content: string): string | null {
  if (!content) return null;

  // Try <reasoning>...</reasoning> first
  const reasoningMatch = content.match(/<reasoning>([\s\S]*?)<\/reasoning>/i);
  if (reasoningMatch?.[1]) {
    return reasoningMatch[1].trim();
  }

  // Try <thinking>...</thinking>
  const thinkingMatch = content.match(/<thinking>([\s\S]*?)<\/thinking>/i);
  if (thinkingMatch?.[1]) {
    return thinkingMatch[1].trim();
  }

  return null;
}

/**
 * Check if the content has incomplete reasoning tags (still streaming)
 */
export function hasIncompleteReasoningTags(content: string): boolean {
  if (!content) return false;

  // Has opening tag but no closing tag
  const hasOpenReasoning = /<reasoning>/i.test(content);
  const hasCloseReasoning = /<\/reasoning>/i.test(content);

  const hasOpenThinking = /<thinking>/i.test(content);
  const hasCloseThinking = /<\/thinking>/i.test(content);

  return (
    (hasOpenReasoning && !hasCloseReasoning) ||
    (hasOpenThinking && !hasCloseThinking)
  );
}

/**
 * Extract incomplete reasoning content (during streaming)
 */
export function extractIncompleteReasoningContent(
  content: string
): string | null {
  if (!content) return null;

  // Try incomplete <reasoning> tag
  const reasoningMatch = content.match(/<reasoning>([\s\S]*)$/i);
  if (reasoningMatch?.[1] != null) {
    return reasoningMatch[1].trim();
  }

  // Try incomplete <thinking> tag
  const thinkingMatch = content.match(/<thinking>([\s\S]*)$/i);
  if (thinkingMatch?.[1] != null) {
    return thinkingMatch[1].trim();
  }

  return null;
}

/**
 * Strip reasoning framework sections from AI message content.
 * These sections are captured by ReasoningUIMiddleware and displayed
 * separately in the AIReasoning component.
 *
 * Matches patterns like:
 * - <reasoning>...</reasoning>
 * - <thinking>...</thinking>
 * Also handles incomplete tags during streaming.
 */
export function stripReasoningSections(content: string): string {
  if (!content) return content;

  let result = content;

  // Remove complete <reasoning>...</reasoning> blocks
  result = result.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '');

  // Remove incomplete <reasoning> tags during streaming (no closing tag yet)
  // This handles the case where streaming is in progress
  result = result.replace(/<reasoning>[\s\S]*$/gi, '');

  // Remove complete <thinking>...</thinking> blocks
  result = result.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');

  // Remove incomplete <thinking> tags during streaming
  result = result.replace(/<thinking>[\s\S]*$/gi, '');

  // Clean up multiple newlines left behind
  result = result.replace(/\n{3,}/g, '\n\n').trim();

  return result;
}
