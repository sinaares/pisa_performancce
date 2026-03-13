"use client";

import type { ChatMessage } from "@/lib/types";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      role="listitem"
    >
      <div
        className={`group relative max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        }`}
      >
        <span className="sr-only">{isUser ? "You" : "Assistant"}: </span>
        <p className="whitespace-pre-wrap">{message.content}</p>
        <span
          className={`absolute -bottom-5 text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 ${
            isUser ? "right-1" : "left-1"
          }`}
          aria-label={`Sent at ${formatTime(message.created_at)}`}
        >
          {formatTime(message.created_at)}
        </span>
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex justify-start" role="status" aria-label="Assistant is typing">
      <div className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-3">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:300ms]" />
      </div>
    </div>
  );
}
