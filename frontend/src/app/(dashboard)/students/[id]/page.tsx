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

  // Sync edit dialog state when student loads
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

  // Loading state
  if (loading && !student) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="mx-auto max-w-4xl text-center py-16">
        <h2 className="text-lg font-semibold mb-2">Student not found</h2>
        <p className="text-muted-foreground mb-4">
          This student does not exist or you don't have access.
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

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/students">
            <Button variant="ghost" size="sm">
              &larr; Back
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold">
              {student.first_name} {student.last_name}
            </h1>
            {student.student_code && (
              <p className="text-sm text-muted-foreground">
                {student.student_code}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger render={<Button variant="outline" size="sm" />}>
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
            Start Chat
          </Button>
        </div>
      </div>

      {/* Validation banner */}
      <ValidationBanner
        validation={validation}
        onScrollToProfile={() =>
          profileRef.current?.scrollIntoView({ behavior: "smooth" })
        }
      />

      {/* Prediction + Explanation — visually prominent */}
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

      <Separator />

      {/* Profile form */}
      <div ref={profileRef}>
        <h2 className="mb-4 text-lg font-semibold">Student Indicators</h2>
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
