"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type {
  PredictionResponse,
  NoteResponse,
  ChatMessage,
  SummaryResponse,
} from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type TimelineEntry =
  | { type: "prediction"; date: string; data: PredictionResponse }
  | { type: "note"; date: string; data: NoteResponse }
  | { type: "chat"; date: string; data: { id: string; content: string; role: string } }
  | { type: "summary"; date: string; data: SummaryResponse };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const TYPE_STYLES: Record<string, { label: string; iconBg: string; bg: string; border: string; icon: React.ReactNode }> = {
  prediction: {
    label: "Prediction",
    iconBg: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
    bg: "bg-blue-50/50 dark:bg-blue-950/20",
    border: "border-blue-200/60 dark:border-blue-800/40",
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  note: {
    label: "Note",
    iconBg: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
    bg: "bg-amber-50/50 dark:bg-amber-950/20",
    border: "border-amber-200/60 dark:border-amber-800/40",
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
      </svg>
    ),
  },
  chat: {
    label: "Chat",
    iconBg: "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400",
    bg: "bg-green-50/50 dark:bg-green-950/20",
    border: "border-green-200/60 dark:border-green-800/40",
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
  },
  summary: {
    label: "Summary",
    iconBg: "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400",
    bg: "bg-purple-50/50 dark:bg-purple-950/20",
    border: "border-purple-200/60 dark:border-purple-800/40",
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
};

function TimelineItem({ entry }: { entry: TimelineEntry }) {
  const [expanded, setExpanded] = useState(false);
  const style = TYPE_STYLES[entry.type];

  function renderPreview() {
    switch (entry.type) {
      case "prediction": {
        const p = entry.data;
        return (
          <span className="text-sm">
            XGB: <span className="font-medium">{p.prediction_result.xgb_score}</span>
            <span className="mx-2 text-muted-foreground">|</span>
            Ridge: <span className="font-medium">{p.prediction_result.ridge_score}</span>
          </span>
        );
      }
      case "note":
        return (
          <p className="text-sm line-clamp-2">{entry.data.content}</p>
        );
      case "chat":
        return (
          <p className="text-sm line-clamp-2">
            <span className="font-medium capitalize">{entry.data.role}:</span>{" "}
            {entry.data.content}
          </p>
        );
      case "summary":
        return (
          <p className="text-sm line-clamp-2">{entry.data.summary_text}</p>
        );
    }
  }

  function renderExpanded() {
    switch (entry.type) {
      case "prediction": {
        const p = entry.data;
        return (
          <div className="space-y-1 text-sm">
            <p>XGB Score: <span className="font-medium">{p.prediction_result.xgb_score}</span></p>
            <p>Ridge Score: <span className="font-medium">{p.prediction_result.ridge_score}</span></p>
            <p className="text-muted-foreground">
              Model: {p.model_version} | Features: {p.prediction_result.features_used.length}
            </p>
          </div>
        );
      }
      case "note":
        return <p className="text-sm whitespace-pre-wrap">{entry.data.content}</p>;
      case "chat":
        return (
          <p className="text-sm whitespace-pre-wrap">
            <span className="font-medium capitalize">{entry.data.role}:</span>{" "}
            {entry.data.content}
          </p>
        );
      case "summary":
        return <p className="text-sm whitespace-pre-wrap">{entry.data.summary_text}</p>;
    }
  }

  return (
    <div className="flex gap-3">
      {/* Timeline icon + line */}
      <div className="flex flex-col items-center">
        <div className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${style.iconBg}`}>
          {style.icon}
        </div>
        <div className="flex-1 w-px bg-border/60" />
      </div>

      {/* Content */}
      <div
        className={`mb-3 flex-1 rounded-xl border px-4 py-3 cursor-pointer transition-all duration-200 hover:shadow-sm ${style.bg} ${style.border}`}
        onClick={() => setExpanded(!expanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpanded(!expanded); } }}
        aria-expanded={expanded}
        aria-label={`${style.label} from ${formatDate(entry.date)}`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold">{style.label}</span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">
              {formatDate(entry.date)}
            </span>
            <svg
              className={`h-3.5 w-3.5 text-muted-foreground/50 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>
        <div className="transition-all duration-200">
          {expanded ? renderExpanded() : renderPreview()}
        </div>
      </div>
    </div>
  );
}

export function StudentTimeline({ studentId }: { studentId: string }) {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchTimeline = useCallback(async () => {
    setLoading(true);
    try {
      const [predictions, notes, chatMessages, summaries] = await Promise.all([
        api.get<{ predictions: PredictionResponse[] }>(
          `/api/students/${studentId}/predictions`,
        ).then((r) => r.predictions).catch(() => [] as PredictionResponse[]),
        api.get<NoteResponse[]>(
          `/api/students/${studentId}/notes`,
        ).catch(() => [] as NoteResponse[]),
        api.get<ChatMessage[]>(
          `/api/chat/${studentId}/messages`,
        ).catch(() => [] as ChatMessage[]),
        api.get<SummaryResponse[]>(
          `/api/students/${studentId}/summaries`,
        ).catch(() => [] as SummaryResponse[]),
      ]);

      const all: TimelineEntry[] = [
        ...predictions.map((p) => ({
          type: "prediction" as const,
          date: p.created_at,
          data: p,
        })),
        ...notes.map((n) => ({
          type: "note" as const,
          date: n.created_at,
          data: n,
        })),
        ...chatMessages.map((m) => ({
          type: "chat" as const,
          date: m.created_at,
          data: { id: m.id, content: m.content, role: m.role },
        })),
        ...summaries.map((s) => ({
          type: "summary" as const,
          date: s.created_at,
          data: s,
        })),
      ];

      all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setEntries(all);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  function handleToggle() {
    if (!open) {
      fetchTimeline();
    }
    setOpen(!open);
  }

  return (
    <Card>
      <CardHeader className="cursor-pointer pb-3" onClick={handleToggle}>
        <CardTitle className="flex items-center gap-2 text-base">
          <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Student History
          {entries.length > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              {entries.length}
            </span>
          )}
          <span className="ml-auto flex items-center gap-1 text-xs font-normal text-muted-foreground">
            {open ? "Hide" : "Show"}
            <svg
              className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </span>
        </CardTitle>
      </CardHeader>
      {open && (
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading history...
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs text-muted-foreground">
                No activity yet. Predictions, notes, and chats will appear here.
              </p>
            </div>
          ) : (
            <div>
              {entries.map((entry, i) => (
                <TimelineItem key={`${entry.type}-${i}`} entry={entry} />
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
