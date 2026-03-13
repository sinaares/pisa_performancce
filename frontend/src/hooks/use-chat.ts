"use client";

import { useState, useCallback, useRef } from "react";
import { api, ApiError } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";

const RATE_LIMIT_MS = 2000;

export function useChat(studentId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFailedRef = useRef<string | null>(null);
  const lastSentRef = useRef<number>(0);
  // Holds the input text that should be restored on failure
  const [restoredInput, setRestoredInput] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<ChatMessage[]>(`/api/chat/${studentId}`);
      setMessages(data);
    } catch {
      setError("Failed to load chat history.");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  const sendMessage = useCallback(
    async (message: string) => {
      // Client-side rate limit
      const now = Date.now();
      if (now - lastSentRef.current < RATE_LIMIT_MS) {
        setError("Please wait a moment before sending another message.");
        return;
      }

      setError(null);
      setRestoredInput(null);
      lastFailedRef.current = null;

      // Optimistic: add user message immediately
      const optimistic: ChatMessage = {
        id: `temp-${Date.now()}`,
        student_id: studentId,
        teacher_id: "",
        role: "user",
        content: message,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);
      setSending(true);
      lastSentRef.current = now;

      try {
        await api.post<ChatMessage>("/api/chat", {
          student_id: studentId,
          message,
        });
        // Refetch full history so we get the assistant reply
        await fetchHistory();
      } catch (err) {
        lastFailedRef.current = message;
        // Remove the optimistic message
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        // Restore the input so the user doesn't lose their message
        setRestoredInput(message);

        if (err instanceof ApiError && err.status === 429) {
          setError("Please wait a moment before sending another message.");
        } else {
          setError(
            "Sorry, the chat service is temporarily unavailable. Your message has been kept in the input.",
          );
        }
      } finally {
        setSending(false);
      }
    },
    [studentId, fetchHistory],
  );

  const retry = useCallback(() => {
    if (lastFailedRef.current) {
      sendMessage(lastFailedRef.current);
    }
  }, [sendMessage]);

  return {
    messages,
    loading,
    sending,
    error,
    restoredInput,
    fetchHistory,
    sendMessage,
    retry,
  };
}
