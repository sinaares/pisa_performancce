"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useStudent } from "@/hooks/use-students";
import { ChatInterface } from "@/components/chat/chat-interface";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { FIELD_MAP } from "@/lib/fields";
import type {
  PredictionResponse,
  ExplanationResponse,
  FeatureImpact,
} from "@/lib/types";

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

  // Top 3 factors (positive + negative combined, sorted by absolute impact)
  const topFactors: FeatureImpact[] = [];
  if (explanation) {
    const all = [
      ...(explanation.top_positive_factors ?? []),
      ...(explanation.top_negative_factors ?? []),
    ];
    all.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
    topFactors.push(...all.slice(0, 3));
  }

  const sidebarContent = (
    <>
      <div className="p-4">
        <Link href={`/students/${studentId}`}>
          <Button variant="ghost" size="sm" className="mb-3">
            &larr; Back to student
          </Button>
        </Link>

        {loading && !student ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        ) : student ? (
          <div>
            <h2 className="text-sm font-semibold">
              {student.first_name} {student.last_name}
            </h2>
            {student.student_code && (
              <p className="text-xs text-muted-foreground">
                {student.student_code}
              </p>
            )}
          </div>
        ) : null}
      </div>

      <Separator />

      {/* Prediction summary */}
      <div className="p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Prediction
        </p>
        {prediction ? (
          <div className="space-y-1">
            <p className="text-2xl font-bold">
              {prediction.prediction_result.xgb_score}
            </p>
            <p className="text-xs text-muted-foreground">XGBoost score</p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No prediction yet</p>
        )}
      </div>

      <Separator />

      {/* Top factors */}
      {topFactors.length > 0 && (
        <div className="p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Top Factors
          </p>
          <div className="space-y-2">
            {topFactors.map((f) => {
              const label = FIELD_MAP[f.name]?.label ?? f.name;
              const positive = f.impact > 0;
              return (
                <div
                  key={f.name}
                  className="flex items-center justify-between"
                >
                  <span className="truncate text-xs">{label}</span>
                  <Badge
                    variant="secondary"
                    className={`shrink-0 text-[10px] ${
                      positive ? "text-green-700" : "text-amber-700"
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
    </>
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-0">
      {/* Desktop sidebar */}
      <aside
        className="hidden w-64 shrink-0 flex-col border-r bg-background lg:flex"
        aria-label="Student context"
      >
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute left-0 top-0 h-full w-64 border-r bg-background shadow-lg overflow-y-auto">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main chat area */}
      <div className="flex flex-1 flex-col">
        {/* Chat header */}
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="text-sm text-muted-foreground hover:text-foreground lg:hidden"
              aria-label="Show student context"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </button>
            <Link
              href={`/students/${studentId}`}
              className="text-sm text-muted-foreground hover:text-foreground lg:hidden"
              aria-label="Back to student"
            >
              &larr;
            </Link>
            <h1 className="text-sm font-medium">
              Chat
              {student
                ? ` — ${student.first_name} ${student.last_name}`
                : ""}
            </h1>
          </div>
        </div>

        {/* Chat interface */}
        <div className="flex-1 overflow-hidden">
          <ChatInterface studentId={studentId} />
        </div>
      </div>
    </div>
  );
}
