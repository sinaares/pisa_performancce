"use client";

import type { PredictionResponse, ValidationResponse } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  prediction: PredictionResponse | null;
  isValid: boolean;
  loading: boolean;
  onPredict: () => void;
  validation?: ValidationResponse | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Return a color class based on PISA-like score bands */
function scoreColor(score: number): string {
  if (score >= 550) return "text-green-600";
  if (score >= 475) return "text-blue-600";
  if (score >= 400) return "text-amber-600";
  return "text-red-600";
}

function Spinner() {
  return (
    <svg
      className="h-5 w-5 animate-spin text-primary"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function PredictionCard({
  prediction,
  isValid,
  loading,
  onPredict,
  validation,
}: Props) {
  if (loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <Spinner />
          <p className="mt-3 text-sm text-muted-foreground">
            Generating prediction...
          </p>
        </CardContent>
      </Card>
    );
  }

  const filledInfo = validation
    ? `${validation.filled_count} of ${validation.total_required} fields completed`
    : null;

  if (!prediction) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prediction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Complete the profile to generate a prediction.
          </p>
          {!isValid && filledInfo && (
            <p className="text-xs text-muted-foreground">{filledInfo}</p>
          )}
          <div
            title={
              !isValid
                ? "Complete all required profile fields before generating a prediction"
                : undefined
            }
          >
            <Button
              onClick={onPredict}
              disabled={!isValid}
              aria-label="Generate prediction"
            >
              Generate Prediction
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const result = prediction.prediction_result;

  return (
    <Card className="border-primary/15 shadow-md">
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Prediction</CardTitle>
        <Badge variant="secondary" className="text-xs font-medium">
          {prediction.model_version}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center gap-12 py-4">
          <div className="text-center">
            <p className="text-xs font-medium text-muted-foreground mb-1.5">XGBoost</p>
            <p
              className={`text-4xl font-bold tracking-tight ${scoreColor(result.xgb_score)}`}
            >
              {result.xgb_score}
            </p>
          </div>
          <div className="h-12 w-px bg-border/60" />
          <div className="text-center">
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Ridge</p>
            <p
              className={`text-4xl font-bold tracking-tight ${scoreColor(result.ridge_score)}`}
            >
              {result.ridge_score}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          <p className="text-xs text-muted-foreground">
            {formatDate(prediction.created_at)}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onPredict}
            aria-label="Regenerate prediction"
          >
            Regenerate
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
