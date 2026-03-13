"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">500</h1>
        <p className="text-muted-foreground mb-4">
          Something went wrong. Please try again.
        </p>
        <button
          onClick={reset}
          className="text-sm underline underline-offset-4 hover:text-foreground"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
