"use client";

import { useEffect, useState, useMemo } from "react";
import { useStudents } from "@/hooks/use-students";
import { StudentCard } from "@/components/students/student-card";
import { StudentForm } from "@/components/students/student-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { StudentCreate } from "@/lib/types";

export default function StudentsPage() {
  const { students, loading, error, fetchStudents, createStudent } =
    useStudents();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const filtered = useMemo(() => {
    if (!search.trim()) return students;
    const q = search.toLowerCase();
    return students.filter(
      (s) =>
        s.first_name.toLowerCase().includes(q) ||
        s.last_name.toLowerCase().includes(q) ||
        (s.student_code && s.student_code.toLowerCase().includes(q)),
    );
  }, [students, search]);

  async function handleCreate(data: StudentCreate) {
    setSubmitting(true);
    try {
      await createStudent(data);
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">My Students</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            Add Student
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a new student</DialogTitle>
            </DialogHeader>
            <StudentForm
              onSubmit={handleCreate}
              onCancel={() => setOpen(false)}
              loading={submitting}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      {students.length > 0 && (
        <Input
          placeholder="Search by name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
          aria-label="Search students"
        />
      )}

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* Loading skeletons */}
      {loading && students.length === 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && students.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <svg
              className="h-8 w-8 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
              />
            </svg>
          </div>
          <h3 className="text-sm font-medium mb-1">No students yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add your first student to get started with predictions.
          </p>
          <Button onClick={() => setOpen(true)}>Add your first student</Button>
        </div>
      )}

      {/* Student grid */}
      {filtered.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((student) => (
            <StudentCard key={student.id} student={student} />
          ))}
        </div>
      )}

      {/* No search results */}
      {!loading && students.length > 0 && filtered.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No students match &ldquo;{search}&rdquo;
        </p>
      )}
    </div>
  );
}
