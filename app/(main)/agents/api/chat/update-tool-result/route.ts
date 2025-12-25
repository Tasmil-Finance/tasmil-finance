import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import postgres from "postgres";
import { auth } from "@/lib/auth";
import { getMessagesByChatId } from "@/lib/db/queries";
import { message } from "@/lib/db/schema";

const client = postgres(process.env.POSTGRES_URL ?? "");
const db = drizzle(client);

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId, messageId, toolCallId, transactionResult } =
      await req.json();

    console.log("chatId", chatId);
    console.log("messageId", messageId);
    console.log("toolCallId", toolCallId);
    console.log("transactionResult", transactionResult);

    if (!chatId || !messageId || !toolCallId || !transactionResult) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get the messages for this chat
    const messages = await getMessagesByChatId({ id: chatId });
    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages not found" },
        { status: 404 }
      );
    }

    // Find the specific message and update the tool result
    const targetMessage = messages.find((msg: any) => msg.id === messageId);
    if (!targetMessage) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Get the parts (already parsed object, not JSON string)
    const parts =
      typeof targetMessage.parts === "string"
        ? JSON.parse(targetMessage.parts)
        : targetMessage.parts;
    const updatedParts = parts.map((part: any) => {
      if (
        part.type.startsWith("tool-") &&
        "toolCallId" in part &&
        part.toolCallId === toolCallId &&
        "output" in part
      ) {
        return {
          ...part,
          output: {
            ...part.output,
            ...transactionResult,
          },
        };
      }
      return part;
    });

    // Update the message in database with new parts
    await db
      .update(message)
      .set({
        parts: JSON.stringify(updatedParts),
      })
      .where(eq(message.id, messageId));

    console.log("Updated parts:", updatedParts.length, "parts processed");
    console.log(
      "Found tool part to update:",
      updatedParts.some((p: any) => p.toolCallId === toolCallId)
    );
    console.log("Database updated successfully for messageId:", messageId);

    return NextResponse.json({
      success: true,
      updatedPartsCount: updatedParts.length,
      toolFound: updatedParts.some((p: any) => p.toolCallId === toolCallId),
      databaseUpdated: true,
    });
  } catch (error) {
    console.error("Error updating tool result:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
