"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useStudent } from "@/hooks/use-students";
import { ChatInterface } from "@/components/chat/chat-interface";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FIELD_MAP } from "@/lib/fields";
import type {
  PredictionResponse,
  ExplanationResponse,
  FeatureImpact,
} from "@/lib/types";

function getInitials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

function scoreColor(score: number): string {
  if (score >= 550) return "text-green-500";
  if (score >= 475) return "text-blue-500";
  if (score >= 400) return "text-amber-500";
  return "text-red-500";
}

export default function ChatPage() {
  const params = useParams();
  const studentId = params.id as string;
  const { student, loading, fetchStudent } = useStudent(studentId);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchStudent();
  }, [fetchStudent]);

  const prediction = student?.latest_prediction as PredictionResponse | null;
  const explanation =
    student?.latest_explanation as ExplanationResponse | null;

  const topFactors: FeatureImpact[] = [];
  if (explanation) {
    const all = [
      ...(explanation.top_positive_factors ?? []),
      ...(explanation.top_negative_factors ?? []),
    ];
    all.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
    topFactors.push(...all.slice(0, 5));
  }

  const initials = student
    ? getInitials(student.first_name, student.last_name)
    : "";

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Student header */}
      <div className="p-5">
        <Link href={`/students/${studentId}`}>
          <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground">
            <svg className="mr-1 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to student
          </Button>
        </Link>

        {loading && !student ? (
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ) : student ? (
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold">
              {initials}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold truncate">
                {student.first_name} {student.last_name}
              </h2>
              {student.student_code && (
                <p className="text-xs text-muted-foreground truncate">
                  {student.student_code}
                </p>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mx-4 h-px bg-border/60" />

      {/* Prediction summary */}
      <div className="p-5">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
          Prediction
        </p>
        {prediction ? (
          <div className="flex items-baseline gap-4">
            <div>
              <p className={`text-3xl font-bold tracking-tight ${scoreColor(prediction.prediction_result.xgb_score)}`}>
                {prediction.prediction_result.xgb_score}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">XGBoost</p>
            </div>
            <div className="h-8 w-px bg-border/60" />
            <div>
              <p className={`text-xl font-semibold tracking-tight ${scoreColor(prediction.prediction_result.ridge_score)}`}>
                {prediction.prediction_result.ridge_score}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Ridge</p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">No prediction yet</p>
          </div>
        )}
      </div>

      <div className="mx-4 h-px bg-border/60" />

      {/* Top factors */}
      {topFactors.length > 0 && (
        <div className="flex-1 overflow-y-auto p-5">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            Key Factors
          </p>
          <div className="space-y-2.5">
            {topFactors.map((f) => {
              const label = FIELD_MAP[f.name]?.label ?? f.name;
              const positive = f.impact > 0;
              return (
                <div
                  key={f.name}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="truncate text-xs">{label}</span>
                  <Badge
                    variant="secondary"
                    className={`shrink-0 text-[10px] font-medium ${
                      positive
                        ? "bg-green-500/10 text-green-700 border-green-500/20"
                        : "bg-amber-500/10 text-amber-700 border-amber-500/20"
                    }`}
                  >
                    {positive ? "+" : ""}
                    {f.impact.toFixed(1)}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick suggestions */}
      <div className="mx-4 h-px bg-border/60" />
      <div className="p-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
          Quick Links
        </p>
        <div className="space-y-1">
          <Link
            href={`/students/${studentId}`}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            View Profile
          </Link>
          <Link
            href="/chats"
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
            All Chats
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-0 -m-5 sm:-m-6 md:-m-8">
      {/* Desktop sidebar */}
      <aside
        className="hidden w-72 shrink-0 flex-col border-r border-border/60 bg-card lg:flex"
        aria-label="Student context"
      >
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute left-0 top-0 h-full w-72 border-r border-border/60 bg-card shadow-2xl overflow-y-auto">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main chat area */}
      <div className="flex flex-1 flex-col bg-background">
        {/* Chat header */}
        <div className="flex items-center justify-between border-b border-border/60 bg-card px-5 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="text-muted-foreground hover:text-foreground lg:hidden"
              aria-label="Show student context"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
              </div>
              <div>
                <h1 className="text-sm font-semibold">
                  {student
                    ? `${student.first_name} ${student.last_name}`
                    : "Chat"}
                </h1>
                <p className="text-[11px] text-muted-foreground">AI-powered student insights</p>
              </div>
            </div>
          </div>
          <Link href={`/students/${studentId}`} className="lg:hidden">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
              Profile
            </Button>
          </Link>
        </div>

        {/* Chat interface */}
        <div className="flex-1 overflow-hidden">
          <ChatInterface studentId={studentId} />
        </div>
      </div>
    </div>
  );
}
