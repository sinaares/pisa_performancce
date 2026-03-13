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

const TYPE_STYLES: Record<string, { label: string; dot: string; bg: string }> = {
  prediction: { label: "Prediction", dot: "bg-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
  note: { label: "Note", dot: "bg-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
  chat: { label: "Chat", dot: "bg-green-500", bg: "bg-green-50 dark:bg-green-950/30" },
  summary: { label: "Summary", dot: "bg-purple-500", bg: "bg-purple-50 dark:bg-purple-950/30" },
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
      {/* Timeline dot + line */}
      <div className="flex flex-col items-center">
        <div className={`mt-1.5 h-2.5 w-2.5 rounded-full ${style.dot}`} />
        <div className="flex-1 w-px bg-border" />
      </div>

      {/* Content */}
      <div
        className={`mb-3 flex-1 rounded-md border px-3 py-2 cursor-pointer transition-all duration-200 hover:shadow-sm ${style.bg}`}
        onClick={() => setExpanded(!expanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpanded(!expanded); } }}
        aria-expanded={expanded}
        aria-label={`${style.label} from ${formatDate(entry.date)}`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium">{style.label}</span>
          <span className="text-[11px] text-muted-foreground">
            {formatDate(entry.date)}
          </span>
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
        <CardTitle className="flex items-center justify-between text-base">
          Student History
          <span className="text-xs font-normal text-muted-foreground">
            {open ? "Hide" : "Show"}
          </span>
        </CardTitle>
      </CardHeader>
      {open && (
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No history yet.</p>
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
