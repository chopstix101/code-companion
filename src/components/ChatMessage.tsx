import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/lib/types";
import { User, Sparkles, ImageIcon } from "lucide-react";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-4 animate-fade-up",
        isUser ? "bg-chat-user" : "bg-chat-ai"
      )}
    >
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-primary/20 text-primary"
            : "bg-accent text-accent-foreground"
        )}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        {message.files && message.files.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {message.files.map((file, i) => (
              <div key={i} className="relative">
                {file.type.startsWith("image/") ? (
                  <img
                    src={file.dataUrl}
                    alt={file.name}
                    className="h-20 w-20 rounded-lg object-cover border border-border"
                  />
                ) : (
                  <div className="flex h-12 items-center gap-2 rounded-lg border border-border bg-secondary px-3 text-xs">
                    <ImageIcon className="h-4 w-4" />
                    {file.name}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {message.isStreaming && !message.content ? (
            <span className="typing-cursor text-muted-foreground">Thinking</span>
          ) : (
            <FormattedContent content={message.content} />
          )}
        </div>
      </div>
    </div>
  );
}

function FormattedContent({ content }: { content: string }) {
  // Simple markdown-like rendering for code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("```")) {
          const match = part.match(/```(\w*:?[^\n]*)\n([\s\S]*?)```/);
          if (match) {
            const label = match[1];
            const code = match[2];
            return (
              <div key={i} className="my-3">
                {label && (
                  <div className="rounded-t-md bg-secondary px-3 py-1.5 text-xs font-mono text-muted-foreground">
                    {label}
                  </div>
                )}
                <pre className="overflow-x-auto rounded-b-md bg-secondary/50 p-3 text-xs font-mono leading-relaxed">
                  <code>{code}</code>
                </pre>
              </div>
            );
          }
        }

        // Handle inline code and bold
        const formatted = part
          .split(/(`[^`]+`)/g)
          .map((segment, j) => {
            if (segment.startsWith("`") && segment.endsWith("`")) {
              return (
                <code
                  key={j}
                  className="rounded bg-secondary px-1.5 py-0.5 text-xs font-mono text-accent-foreground"
                >
                  {segment.slice(1, -1)}
                </code>
              );
            }
            return <span key={j}>{segment}</span>;
          });

        return <span key={i}>{formatted}</span>;
      })}
    </>
  );
}
