"use client";

import type { ExplanationResponse, FeatureImpact } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FIELD_MAP } from "@/lib/fields";

interface Props {
  explanation: ExplanationResponse | null;
}

function FactorBar({
  factor,
  maxAbs,
  direction,
}: {
  factor: FeatureImpact;
  maxAbs: number;
  direction: "positive" | "negative";
}) {
  const field = FIELD_MAP[factor.name];
  const label = field?.label ?? factor.name;
  const pct = maxAbs > 0 ? (Math.abs(factor.impact) / maxAbs) * 100 : 0;
  const isPositive = direction === "positive";

  return (
    <div className="group flex items-center gap-3">
      {/* Label */}
      <div className="w-28 shrink-0 text-right">
        <p className="truncate text-xs font-medium" title={label}>
          {label}
        </p>
      </div>

      {/* Bar */}
      <div className="flex-1 flex items-center gap-2">
        <div className="h-5 flex-1 rounded bg-muted/60 overflow-hidden">
          <div
            className={`h-full rounded transition-all duration-300 ${
              isPositive
                ? "bg-green-500/80"
                : "bg-amber-500/80"
            }`}
            style={{ width: `${Math.max(pct, 2)}%` }}
          />
        </div>
        <span
          className={`w-16 shrink-0 text-right text-xs tabular-nums font-medium ${
            isPositive ? "text-green-700" : "text-amber-700"
          }`}
        >
          {isPositive ? "+" : ""}
          {factor.impact.toFixed(1)} pts
        </span>
      </div>

      {/* Tooltip on hover showing description */}
      {field?.description && (
        <span className="hidden lg:block w-0 overflow-hidden group-hover:w-40 transition-all text-[10px] text-muted-foreground truncate">
          {field.description}
        </span>
      )}
    </div>
  );
}

export function ExplanationCards({ explanation }: Props) {
  if (!explanation) return null;

  const positive = explanation.top_positive_factors ?? [];
  const negative = explanation.top_negative_factors ?? [];
  const allImpacts = [...positive, ...negative];
  const maxAbs = Math.max(...allImpacts.map((f) => Math.abs(f.impact)), 1);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Positive factors */}
      <Card className="border-green-200/50 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500 shadow-sm shadow-green-500/30" aria-hidden="true" />
            <span className="text-green-800 font-semibold">Positive Factors</span>
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            These push the predicted score higher
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {positive.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">None identified</p>
          ) : (
            positive.map((f) => (
              <FactorBar
                key={f.name}
                factor={f}
                maxAbs={maxAbs}
                direction="positive"
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Negative factors */}
      <Card className="border-amber-200/50 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/30" aria-hidden="true" />
            <span className="text-amber-800 font-semibold">Negative Factors</span>
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            These pull the predicted score lower
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {negative.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">None identified</p>
          ) : (
            negative.map((f) => (
              <FactorBar
                key={f.name}
                factor={f}
                maxAbs={maxAbs}
                direction="negative"
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
