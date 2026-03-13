"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type KeyboardEvent,
} from "react";
import { useChat } from "@/hooks/use-chat";
import { MessageBubble, TypingIndicator } from "./message-bubble";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

const SUGGESTIONS = [
  "Explain the prediction in simple terms",
  "What are the main factors affecting this student?",
  "What should I focus on first?",
  "Are there any positive signs?",
];

interface Props {
  studentId: string;
}

export function ChatInterface({ studentId }: Props) {
  const {
    messages,
    loading,
    sending,
    error,
    restoredInput,
    fetchHistory,
    sendMessage,
    retry,
  } = useChat(studentId);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Restore input on failure so the user doesn't lose their message
  useEffect(() => {
    if (restoredInput !== null) {
      setInput(restoredInput);
    }
  }, [restoredInput]);

  // Auto-scroll on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    sendMessage(text);
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input, sending, sendMessage]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  // Auto-resize textarea
  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      const el = e.target;
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    },
    [],
  );

  const handleSuggestion = useCallback(
    (text: string) => {
      sendMessage(text);
    },
    [sendMessage],
  );

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4">
        {loading && messages.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading chat...
          </p>
        )}

        {/* Suggestions when empty */}
        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12">
            <p className="text-sm text-muted-foreground">
              Start a conversation about this student
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSuggestion(s)}
                  className="rounded-full border bg-background px-3 py-1.5 text-xs transition-colors hover:bg-muted"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        <div className="space-y-4" role="list" aria-label="Chat messages">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {sending && <TypingIndicator />}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm">
            <p className="text-destructive">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={retry}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        )}

        <div ref={bottomRef} />
      </ScrollArea>

      {/* Input area */}
      <div className="border-t bg-background px-4 py-3">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this student's performance..."
            disabled={sending}
            rows={1}
            className="min-h-[40px] max-h-[120px] resize-none text-sm"
          />
          <Button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            size="sm"
            className="shrink-0"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
