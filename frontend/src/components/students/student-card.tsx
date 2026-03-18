"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { StudentListItem } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

export function StudentCard({ student }: { student: StudentListItem }) {
  const router = useRouter();
  const initials = getInitials(student.first_name, student.last_name);
  const colorClass = getAvatarColor(student.first_name + student.last_name);

  return (
    <Link
      href={`/students/${student.id}`}
      aria-label={`View ${student.first_name} ${student.last_name}`}
    >
      <div className="group h-full rounded-xl border border-border/60 bg-card p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/25 hover:-translate-y-0.5">
        <div className="flex items-start gap-3.5">
          {/* Avatar */}
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${colorClass}`}>
            {initials}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-[15px] group-hover:text-primary transition-colors">
              {student.first_name} {student.last_name}
            </p>
            {student.student_code && (
              <p className="truncate text-xs text-muted-foreground mt-0.5">
                {student.student_code}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between gap-2 pt-3 border-t border-border/40">
          <div className="flex items-center gap-2">
            <Badge
              variant={student.has_prediction ? "default" : "secondary"}
              className="text-[11px]"
            >
              {student.has_prediction ? "Predicted" : "No prediction"}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">
              {formatDate(student.last_updated)}
            </span>
            {/* Chat quick-access button */}
            {student.has_prediction && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(`/students/${student.id}/chat`);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-primary-foreground"
                aria-label={`Chat about ${student.first_name} ${student.last_name}`}
                title="Open chat"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
