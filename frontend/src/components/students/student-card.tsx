"use client";

import Link from "next/link";
import type { StudentListItem } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function StudentCard({ student }: { student: StudentListItem }) {
  return (
    <Link
      href={`/students/${student.id}`}
      aria-label={`View ${student.first_name} ${student.last_name}`}
    >
      <Card className="h-full transition-colors hover:bg-muted/40">
        <CardContent className="flex flex-col gap-2 py-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {student.first_name} {student.last_name}
            </p>
            {student.student_code && (
              <p className="truncate text-xs text-muted-foreground">
                {student.student_code}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <Badge
              variant={student.has_prediction ? "default" : "secondary"}
              className="text-[11px]"
            >
              {student.has_prediction ? "Predicted" : "No prediction"}
            </Badge>
            <span className="text-[11px] text-muted-foreground">
              {formatDate(student.last_updated)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
