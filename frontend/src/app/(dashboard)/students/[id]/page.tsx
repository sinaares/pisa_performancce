"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useStudent } from "@/hooks/use-students";
import { ValidationBanner } from "@/components/students/validation-banner";
import { ProfileForm } from "@/components/students/profile-form";
import { PredictionCard } from "@/components/predictions/prediction-card";
import { ExplanationCards } from "@/components/predictions/explanation-cards";
import { NotesPanel } from "@/components/notes/notes-panel";
import { StudentTimeline } from "@/components/students/student-timeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { PredictionResponse } from "@/lib/types";

function getInitials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

export default function StudentDetailPage() {
  const params = useParams();
  const studentId = params.id as string;
  const router = useRouter();
  const profileRef = useRef<HTMLDivElement>(null);

  const {
    student,
    validation,
    loading,
    fetchStudent,
    updateStudent,
    updateProfile,
    fetchValidation,
    runPrediction,
  } = useStudent(studentId);

  const [predicting, setPredicting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editFirst, setEditFirst] = useState("");
  const [editLast, setEditLast] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    fetchStudent();
    fetchValidation();
  }, [fetchStudent, fetchValidation]);

  useEffect(() => {
    if (student) {
      setEditFirst(student.first_name);
      setEditLast(student.last_name);
      setEditCode(student.student_code ?? "");
    }
  }, [student]);

  const handlePredict = useCallback(async () => {
    setPredicting(true);
    try {
      await runPrediction();
      await fetchValidation();
      toast.success("Prediction generated successfully");
    } catch {
      toast.error("Failed to generate prediction");
    } finally {
      setPredicting(false);
    }
  }, [runPrediction, fetchValidation]);

  const handleSaveProfile = useCallback(
    async (data: Record<string, number>) => {
      try {
        await updateProfile({ profile_data: data });
        await fetchValidation();
        toast.success("Profile saved");
      } catch {
        toast.error("Failed to save profile");
        throw new Error("Save failed");
      }
    },
    [updateProfile, fetchValidation],
  );

  const handleEditSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setEditSaving(true);
      try {
        await updateStudent({
          first_name: editFirst,
          last_name: editLast,
          student_code: editCode || undefined,
        });
        setEditOpen(false);
        toast.success("Student updated");
      } catch {
        toast.error("Failed to update student");
      } finally {
        setEditSaving(false);
      }
    },
    [editFirst, editLast, editCode, updateStudent],
  );

  if (loading && !student) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Hero header skeleton */}
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
          <div className="h-1.5 bg-muted" />
          <div className="p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-16 rounded-lg" />
              <Skeleton className="h-14 w-14 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-40" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-1" />
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-1.5 w-20 rounded-full" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-16 rounded-lg" />
                <Skeleton className="h-8 w-24 rounded-lg" />
              </div>
            </div>
          </div>
        </div>

        {/* Prediction card skeleton */}
        <div className="rounded-xl border border-border/60 bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="flex gap-8">
            <div className="space-y-2">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-3 w-14" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-14" />
            </div>
          </div>
        </div>

        {/* Profile form skeleton */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-36" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-8 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="mx-auto max-w-5xl text-center py-20">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <svg className="h-7 w-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold mb-2">Student not found</h2>
        <p className="text-muted-foreground mb-5">
          This student does not exist or you don&apos;t have access.
        </p>
        <Link href="/students">
          <Button variant="outline">Back to students</Button>
        </Link>
      </div>
    );
  }

  const isValid = validation?.is_valid ?? false;
  const prediction = student.latest_prediction as PredictionResponse | null;
  const explanation = student.latest_explanation;
  const initials = getInitials(student.first_name, student.last_name);
  const filledCount = validation?.filled_count ?? 0;
  const totalRequired = validation?.total_required ?? 0;
  const completionPct = totalRequired > 0 ? Math.round((filledCount / totalRequired) * 100) : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Hero header */}
      <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
        {/* Accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-primary via-primary/70 to-violet-500" />

        <div className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/students" className="shrink-0">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                  Back
                </Button>
              </Link>
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary text-lg font-bold">
                {initials}
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  {student.first_name} {student.last_name}
                </h1>
                <div className="mt-1 flex items-center gap-3">
                  {student.student_code && (
                    <span className="text-sm text-muted-foreground">
                      {student.student_code}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground/60">|</span>
                  <span className="text-xs text-muted-foreground">
                    Profile {completionPct}% complete
                  </span>
                  <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${completionPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogTrigger render={<Button variant="outline" size="sm" />}>
                  <svg className="mr-1.5 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                  Edit
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit student</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="editFirst">First name</Label>
                      <Input
                        id="editFirst"
                        value={editFirst}
                        onChange={(e) => setEditFirst(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editLast">Last name</Label>
                      <Input
                        id="editLast"
                        value={editLast}
                        onChange={(e) => setEditLast(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editCode">Student code</Label>
                      <Input
                        id="editCode"
                        value={editCode}
                        onChange={(e) => setEditCode(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setEditOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={editSaving}>
                        {editSaving ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Button
                size="sm"
                onClick={() => router.push(`/students/${studentId}/chat`)}
              >
                <svg className="mr-1.5 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
                Start Chat
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Validation banner */}
      <ValidationBanner
        validation={validation}
        onScrollToProfile={() =>
          profileRef.current?.scrollIntoView({ behavior: "smooth" })
        }
      />

      {/* Prediction + Explanation */}
      <div className="space-y-4">
        <PredictionCard
          prediction={prediction}
          isValid={isValid}
          loading={predicting}
          onPredict={handlePredict}
          validation={validation}
        />

        <ExplanationCards explanation={explanation} />
      </div>

      {/* Chat CTA — only show when prediction exists */}
      {prediction && (
        <div
          className="group relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-card to-violet-500/5 shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
          onClick={() => router.push(`/students/${studentId}/chat`)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              router.push(`/students/${studentId}/chat`);
            }
          }}
        >
          <div className="flex items-center gap-5 p-6">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold group-hover:text-primary transition-colors">
                Discuss this prediction
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Ask questions, get insights, and understand what drives {student.first_name}&apos;s predicted score.
              </p>
            </div>
            <svg className="h-5 w-5 shrink-0 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </div>
        </div>
      )}

      <Separator />

      {/* Profile form */}
      <div ref={profileRef}>
        <div className="flex items-center gap-2 mb-4">
          <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
          </svg>
          <h2 className="text-lg font-bold tracking-tight">Student Indicators</h2>
        </div>
        <ProfileForm
          profileData={student.profile ?? {}}
          onSave={handleSaveProfile}
          missingFields={validation?.missing_fields}
        />
      </div>

      <Separator />

      {/* Notes */}
      <NotesPanel studentId={studentId} />

      <Separator />

      {/* Student history timeline */}
      <StudentTimeline studentId={studentId} />
    </div>
  );
}
