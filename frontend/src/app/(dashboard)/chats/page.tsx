"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useStudents } from "@/hooks/use-students";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function getInitials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

const AVATAR_COLORS = [
  "bg-primary/15 text-primary",
  "bg-violet-500/15 text-violet-600",
  "bg-cyan-500/15 text-cyan-600",
  "bg-emerald-500/15 text-emerald-600",
  "bg-rose-500/15 text-rose-600",
  "bg-amber-500/15 text-amber-600",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function ChatsPage() {
  const { students, loading, fetchStudents } = useStudents();
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Show students that have predictions (chat is useful when there's data to discuss)
  const chatStudents = useMemo(() => {
    const predicted = students.filter((s) => s.has_prediction);
    if (!search.trim()) return predicted;
    const q = search.toLowerCase();
    return predicted.filter(
      (s) =>
        s.first_name.toLowerCase().includes(q) ||
        s.last_name.toLowerCase().includes(q) ||
        (s.student_code && s.student_code.toLowerCase().includes(q)),
    );
  }, [students, search]);

  const unpredicted = students.filter((s) => !s.has_prediction);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Chats</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Discuss predictions and get AI-powered insights about your students.
        </p>
      </div>

      {/* Search */}
      {chatStudents.length > 0 && (
        <div className="relative max-w-md">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            aria-label="Search chats"
          />
        </div>
      )}

      {/* Loading */}
      {loading && students.length === 0 && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4">
              <Skeleton className="h-11 w-11 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-44" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-3 w-16 hidden sm:block" />
                <Skeleton className="h-4 w-4 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state — no students at all */}
      {!loading && students.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/80 bg-card py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <svg className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold mb-1">No chats yet</h3>
          <p className="text-sm text-muted-foreground mb-5 max-w-xs">
            Add students and generate predictions to start chatting about their performance.
          </p>
          <Link href="/students">
            <button className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              Go to Students
            </button>
          </Link>
        </div>
      )}

      {/* Empty state — students but no predictions */}
      {!loading && students.length > 0 && chatStudents.length === 0 && !search && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/80 bg-card py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10">
            <svg className="h-7 w-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold mb-1">No predictions yet</h3>
          <p className="text-sm text-muted-foreground mb-5 max-w-xs">
            Generate predictions for your students first, then come back to discuss their results.
          </p>
          <Link href="/students">
            <button className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              Go to Students
            </button>
          </Link>
        </div>
      )}

      {/* Conversation list */}
      {chatStudents.length > 0 && (
        <div className="space-y-2">
          {chatStudents.map((student) => {
            const initials = getInitials(student.first_name, student.last_name);
            const colorClass = getAvatarColor(student.first_name + student.last_name);

            return (
              <Link
                key={student.id}
                href={`/students/${student.id}/chat`}
                className="group flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/25 hover:-translate-y-0.5"
              >
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${colorClass}`}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[15px] group-hover:text-primary transition-colors">
                    {student.first_name} {student.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {student.student_code ? `${student.student_code} · ` : ""}
                    Discuss prediction results
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] text-muted-foreground hidden sm:block">
                    {formatDate(student.last_updated)}
                  </span>
                  <svg className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Students without predictions */}
      {!loading && unpredicted.length > 0 && chatStudents.length > 0 && !search && (
        <div className="rounded-xl border border-border/40 bg-muted/30 p-4">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">{unpredicted.length} student{unpredicted.length !== 1 ? "s" : ""}</span> without predictions — generate predictions to enable chat.
          </p>
        </div>
      )}

      {/* No search results */}
      {!loading && chatStudents.length === 0 && search && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No conversations match &ldquo;{search}&rdquo;
        </p>
      )}
    </div>
  );
}
