"use server";

import { suggestionsControllerGetSuggestions } from "@/gen/client";
import { withAuth } from "@/lib/kubb-config";

export async function getSuggestions({ documentId }: { documentId: string }) {
  try {
    const suggestions = await suggestionsControllerGetSuggestions(
      { documentId },
      withAuth
    );
    return (suggestions as unknown as any[]) ?? [];
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return [];
  }
}
