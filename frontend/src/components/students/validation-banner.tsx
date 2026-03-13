"use client";

import type { ValidationResponse } from "@/lib/types";
import { FIELD_MAP } from "@/lib/fields";

interface Props {
  validation: ValidationResponse | null;
  onScrollToProfile?: () => void;
}

export function ValidationBanner({ validation, onScrollToProfile }: Props) {
  if (!validation) return null;

  const { filled_count, total_required, warnings, missing_fields, is_valid } =
    validation;
  const pct = total_required > 0 ? Math.round((filled_count / total_required) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* Progress indicator */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">
            {filled_count} of {total_required} required fields completed
          </p>
          <span className="text-xs text-muted-foreground">{pct}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted">
          <div
            className={`h-2 rounded-full transition-all ${
              is_valid ? "bg-green-500" : "bg-amber-500"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Missing fields banner */}
      {!is_valid && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800">
            {missing_fields.length} required field
            {missing_fields.length !== 1 ? "s" : ""} missing.{" "}
            <button
              type="button"
              onClick={onScrollToProfile}
              className="underline underline-offset-2 hover:text-amber-900"
            >
              Complete the student profile
            </button>{" "}
            to generate a prediction.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {missing_fields.slice(0, 12).map((key) => (
              <span
                key={key}
                className="inline-block rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700"
              >
                {FIELD_MAP[key]?.label ?? key}
              </span>
            ))}
            {missing_fields.length > 12 && (
              <span className="text-xs text-amber-600">
                +{missing_fields.length - 12} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm font-medium text-yellow-800 mb-1">Warnings</p>
          <ul className="list-disc list-inside space-y-0.5">
            {warnings.map((w, i) => (
              <li key={i} className="text-xs text-yellow-700">
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
