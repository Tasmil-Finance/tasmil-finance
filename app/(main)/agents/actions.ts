"use server";

import { generateText, type UIMessage } from "ai";
import { cookies } from "next/headers";
import { chatControllerUpdateChatVisibility } from "@/gen/client";
import { withAuth } from "@/lib/kubb-config";
import type { VisibilityType } from "@/components/visibility-selector";
import { titlePrompt } from "@/lib/ai/prompts";
import { getTitleModel } from "@/lib/ai/providers";

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set("chat-model", model);
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: UIMessage;
}) {
  // Convert UIMessage to string for title generation
  let messageText = "";
  if (typeof message === "string") {
    messageText = message;
  } else if (message && typeof message === "object" && "parts" in message) {
    messageText = (message.parts as Array<{ type: string; text?: string }>)
      .filter((part) => part.type === "text")
      .map((part) => part.text || "")
      .join("");
  }
  
  const { text: title } = await generateText({
    model: getTitleModel(),
    system: titlePrompt,
    prompt: messageText,
  });

  return title;
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  try {
    const { chatControllerDeleteTrailingMessages } = await import('@/gen/client');
    const { withAuth } = await import('@/lib/kubb-config');
    await chatControllerDeleteTrailingMessages({ id } as any, withAuth);
  } catch (error) {
    console.error("Failed to delete trailing messages:", error);
    throw error;
  }
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  try {
    await chatControllerUpdateChatVisibility(
      { id: chatId, visibility },
      withAuth
    );
  } catch (error) {
    console.error("Failed to update chat visibility:", error);
    throw error;
  }
}
