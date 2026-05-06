import type { Checkpoint, Message } from "@langchain/langgraph-sdk";
import { useState } from "react";
import { useStreamContext } from "@/features/chat/hooks";
import { getContentString } from "@/features/chat/lib/thread-utils";
import { MultimodalPreview } from "@/features/chat/thread/components/multimodal-preview";
import { isBase64ContentBlock } from "@/lib/multimodal-utils";
import { cn } from "@/lib/utils";
import { Textarea } from "@/shared/ui/textarea";
import { BranchSwitcher, CommandBar } from "./shared";

function EditableContent({
  value,
  setValue,
  onSubmit,
}: {
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
  onSubmit: () => void;
}) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <Textarea
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      className="focus-visible:ring-0"
    />
  );
}

export function HumanMessage({
  message,
  isLoading,
  onEdit,
}: {
  message: Message;
  isLoading: boolean;
  onEdit?: (
    message: Message,
    newContent: string,
    parentCheckpoint: Checkpoint | null | undefined,
    messagesBeforeCurrent: Message[]
  ) => void;
}) {
  const thread = useStreamContext();
  // biome-ignore lint/suspicious/noExplicitAny: thread runtime metadata accessor isn't typed
  const meta = (
    thread as any
  ).getMessagesMetadata?.(message);

  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState("");
  const contentString = getContentString(message.content);

  const handleSubmitEdit = () => {
    setIsEditing(false);
    if (!onEdit) return;

    const currentMessageIndex = thread.messages.findIndex((m) => m.id === message.id);
    const messagesBeforeCurrent =
      currentMessageIndex > 0 ? thread.messages.slice(0, currentMessageIndex) : [];

    // parent_checkpoint is the LangGraph checkpoint BEFORE this human message was added
    const parentCheckpoint = meta?.firstSeenState?.parent_checkpoint as
      | Checkpoint
      | null
      | undefined;

    onEdit(message, value, parentCheckpoint, messagesBeforeCurrent);
  };

  return (
    <div
      className={cn(
        "group ml-auto flex max-w-[75%] items-center gap-2",
        isEditing && "w-full max-w-xl"
      )}
    >
      <div className={cn("flex min-w-0 flex-col gap-2", isEditing && "w-full")}>
        {isEditing ? (
          <EditableContent value={value} setValue={setValue} onSubmit={handleSubmitEdit} />
        ) : (
          <div className="flex flex-col gap-2">
            {/* Render images and files if no text */}
            {Array.isArray(message.content) && message.content.length > 0 && (
              <div className="flex flex-wrap items-end justify-end gap-2">
                {message.content.reduce<React.ReactNode[]>((acc, block, idx) => {
                  if (isBase64ContentBlock(block)) {
                    acc.push(<MultimodalPreview key={idx} block={block} size="md" />);
                  }
                  return acc;
                }, [])}
              </div>
            )}
            {/* Render text if present, otherwise fallback to file/image name */}
            {contentString ? (
              <p className="ml-auto break-all rounded-3xl bg-muted px-4 py-2 text-right text-sm">
                {contentString}
              </p>
            ) : null}
          </div>
        )}

        <div className={cn("ml-auto flex items-center gap-2", isEditing && "opacity-100")}>
          <BranchSwitcher
            branch={meta?.branch}
            branchOptions={meta?.branchOptions}
            onSelect={(branch) => (thread as any).setBranch?.(branch)}
            isLoading={isLoading}
          />
          <CommandBar
            isLoading={isLoading}
            content={contentString}
            isEditing={isEditing}
            setIsEditing={(c) => {
              if (c) {
                setValue(contentString);
              }
              setIsEditing(c);
            }}
            handleSubmitEdit={handleSubmitEdit}
            isHumanMessage={true}
          />
        </div>
      </div>
    </div>
  );
}
