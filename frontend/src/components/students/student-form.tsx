"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { StudentCreate } from "@/lib/types";

interface StudentFormProps {
  onSubmit: (data: StudentCreate) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function StudentForm({ onSubmit, onCancel, loading }: StudentFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await onSubmit({
        first_name: firstName,
        last_name: lastName,
        student_code: studentCode || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add student");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="firstName">First name</Label>
        <Input
          id="firstName"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lastName">Last name</Label>
        <Input
          id="lastName"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="studentCode">
          Student code{" "}
          <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="studentCode"
          value={studentCode}
          onChange={(e) => setStudentCode(e.target.value)}
          placeholder="e.g. STU-0042"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Adding..." : "Add student"}
        </Button>
      </div>
    </form>
  );
}
