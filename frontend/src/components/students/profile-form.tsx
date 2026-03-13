"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FIELD_GROUPS } from "@/lib/fields";

/** Range rules for validation warnings (field key → [min, max]) */
const RANGE_RULES: Record<string, [number, number]> = {
  AGE: [5, 25],
  GRADE: [1, 15],
  ST004D01T: [1, 2],
  IMMIG: [1, 3],
  REPEAT: [0, 1],
  SCHLTYPE: [1, 2],
  SCHSIZE: [1, 50000],
  STRATIO: [0.5, 100],
};

interface Props {
  profileData: Record<string, number>;
  onSave: (data: Record<string, number>) => Promise<void>;
  missingFields?: string[];
}

export function ProfileForm({ profileData, onSave, missingFields = [] }: Props) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const group of FIELD_GROUPS) {
      for (const field of group.fields) {
        const v = profileData[field.key];
        init[field.key] = v != null ? String(v) : "";
      }
    }
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const missingSet = new Set(missingFields);

  function validateField(key: string, raw: string): string | null {
    if (raw.trim() === "") return null; // empty is ok (just missing)
    const n = parseFloat(raw);
    if (isNaN(n)) return "Must be a number";
    const range = RANGE_RULES[key];
    if (range && (n < range[0] || n > range[1])) {
      return `Expected ${range[0]}–${range[1]}`;
    }
    return null;
  }

  function handleChange(key: string, raw: string) {
    setValues((prev) => ({ ...prev, [key]: raw }));
    setSaved(false);

    const err = validateField(key, raw);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (err) {
        next[key] = err;
      } else {
        delete next[key];
      }
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // Run validation on all fields
    const errors: Record<string, string> = {};
    for (const [k, v] of Object.entries(values)) {
      if (v.trim() === "") continue;
      const n = parseFloat(v);
      if (isNaN(n)) {
        errors[k] = "Must be a number";
      }
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSaving(true);
    try {
      const numeric: Record<string, number> = {};
      for (const [k, v] of Object.entries(values)) {
        if (v.trim() !== "") {
          const n = parseFloat(v);
          if (!isNaN(n)) numeric[k] = n;
        }
      }
      await onSave(numeric);
      setSaved(true);
    } catch {
      // toast is handled by parent
    } finally {
      setSaving(false);
    }
  }

  const hasErrors = Object.keys(fieldErrors).length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {FIELD_GROUPS.map((group) => (
        <Card key={group.title}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{group.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.fields.map((field) => {
                const isMissing = missingSet.has(field.key);
                const error = fieldErrors[field.key];
                return (
                  <div key={field.key} className="space-y-1">
                    <Label
                      htmlFor={field.key}
                      className={`text-xs ${isMissing ? "text-amber-600" : ""}`}
                    >
                      {field.label}
                      {isMissing && <span className="ml-1 text-amber-500">*</span>}
                    </Label>
                    <Input
                      id={field.key}
                      type="number"
                      step="any"
                      value={values[field.key]}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      placeholder="—"
                      className={`h-8 text-sm ${error ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                    />
                    {error ? (
                      <p className="text-[11px] leading-tight text-red-500">
                        {error}
                      </p>
                    ) : (
                      <p className="text-[11px] leading-tight text-muted-foreground">
                        {field.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving || hasErrors}>
          {saving ? "Saving..." : "Save profile"}
        </Button>
        {saved && (
          <span className="text-sm text-green-600">Profile saved</span>
        )}
        {hasErrors && (
          <span className="text-sm text-red-500">Fix errors before saving</span>
        )}
      </div>
    </form>
  );
}
