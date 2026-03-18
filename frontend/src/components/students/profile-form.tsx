"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FIELD_GROUPS, FIELD_MAP } from "@/lib/fields";

interface Props {
  profileData: Record<string, number>;
  onSave: (data: Record<string, number>) => Promise<void>;
  missingFields?: string[];
}

const GROUP_META: Record<
  string,
  { icon: React.ReactNode; color: string; accent: string }
> = {
  Demographics: {
    color: "text-primary",
    accent: "bg-primary/10 border-primary/20",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  "Socioeconomic & Home": {
    color: "text-emerald-600",
    accent: "bg-emerald-500/10 border-emerald-500/20",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  "Behaviour & Attendance": {
    color: "text-amber-600",
    accent: "bg-amber-500/10 border-amber-500/20",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  "School Climate": {
    color: "text-cyan-600",
    accent: "bg-cyan-500/10 border-cyan-500/20",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
      </svg>
    ),
  },
  "Attitudes & Beliefs": {
    color: "text-violet-600",
    accent: "bg-violet-500/10 border-violet-500/20",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  "Technology (ICT)": {
    color: "text-blue-600",
    accent: "bg-blue-500/10 border-blue-500/20",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
      </svg>
    ),
  },
  "School Context": {
    color: "text-rose-600",
    accent: "bg-rose-500/10 border-rose-500/20",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
      </svg>
    ),
  },
};

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
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const missingSet = new Set(missingFields);

  function validateField(key: string, raw: string): string | null {
    if (raw.trim() === "") return null;
    const n = parseFloat(raw);
    if (isNaN(n)) return "Must be a number";
    const def = FIELD_MAP[key];
    if (def && (n < def.min || n > def.max)) {
      return `Expected ${def.min} to ${def.max}`;
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

  function toggleGroup(title: string) {
    setCollapsed((prev) => ({ ...prev, [title]: !prev[title] }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const errors: Record<string, string> = {};
    for (const [k, v] of Object.entries(values)) {
      const err = validateField(k, v);
      if (err) errors[k] = err;
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {FIELD_GROUPS.map((group) => {
        const meta = GROUP_META[group.title] ?? {
          color: "text-muted-foreground",
          accent: "bg-muted border-border",
          icon: null,
        };
        const filledCount = group.fields.filter(
          (f) => values[f.key]?.trim() !== "",
        ).length;
        const totalCount = group.fields.length;
        const isCollapsed = collapsed[group.title] ?? false;
        const groupHasError = group.fields.some((f) => fieldErrors[f.key]);

        return (
          <div
            key={group.title}
            className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden"
          >
            {/* Group header — clickable to collapse */}
            <button
              type="button"
              onClick={() => toggleGroup(group.title)}
              className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/30"
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${meta.accent} ${meta.color}`}
              >
                {meta.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{group.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {filledCount} of {totalCount} filled
                </p>
              </div>
              {/* Fill progress */}
              <div className="hidden sm:flex items-center gap-3 mr-2">
                <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      filledCount === totalCount ? "bg-emerald-500" : "bg-primary/60"
                    }`}
                    style={{
                      width: `${totalCount > 0 ? (filledCount / totalCount) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className={`text-xs tabular-nums font-medium ${
                  filledCount === totalCount ? "text-emerald-600" : "text-muted-foreground"
                }`}>
                  {filledCount}/{totalCount}
                </span>
              </div>
              {groupHasError && (
                <span className="mr-1 h-2 w-2 rounded-full bg-red-500 shrink-0" />
              )}
              {/* Chevron */}
              <svg
                className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                  isCollapsed ? "" : "rotate-180"
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {/* Fields */}
            {!isCollapsed && (
              <div className="border-t border-border/40 px-5 py-4">
                <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.fields.map((field) => {
                    const isMissing = missingSet.has(field.key);
                    const isFilled = values[field.key]?.trim() !== "";
                    const error = fieldErrors[field.key];
                    return (
                      <div
                        key={field.key}
                        className={`space-y-1.5 rounded-lg p-2.5 -mx-2.5 transition-colors ${
                          isMissing && !isFilled
                            ? "bg-amber-500/5"
                            : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Label
                            htmlFor={field.key}
                            className={`text-xs font-medium ${
                              isMissing && !isFilled
                                ? "text-amber-700"
                                : ""
                            }`}
                          >
                            {field.label}
                            {isMissing && !isFilled && (
                              <span className="ml-1 text-amber-500">*</span>
                            )}
                          </Label>
                          {isFilled && !error && (
                            <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                        </div>
                        <Input
                          id={field.key}
                          type="number"
                          min={field.min}
                          max={field.max}
                          step={field.step}
                          value={values[field.key]}
                          onChange={(e) =>
                            handleChange(field.key, e.target.value)
                          }
                          placeholder={`${field.min} – ${field.max}`}
                          className={`h-9 text-sm ${
                            error
                              ? "border-red-400 focus-visible:ring-red-400"
                              : ""
                          }`}
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
              </div>
            )}
          </div>
        );
      })}

      {/* Sticky save bar */}
      <div className="sticky bottom-0 z-10 -mx-5 sm:-mx-6 md:-mx-8 px-5 sm:px-6 md:px-8 py-4 bg-background/80 backdrop-blur-md border-t border-border/60">
        <div className="flex items-center gap-3 max-w-5xl mx-auto">
          <Button type="submit" disabled={saving || hasErrors}>
            {saving ? (
              <>
                <svg className="mr-1.5 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </>
            ) : (
              "Save profile"
            )}
          </Button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Profile saved
            </span>
          )}
          {hasErrors && (
            <span className="flex items-center gap-1.5 text-sm text-red-500">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              Fix errors before saving
            </span>
          )}
        </div>
      </div>
    </form>
  );
}
