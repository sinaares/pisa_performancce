"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function StudentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Student page error:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md text-center py-16">
      <h2 className="text-lg font-semibold mb-2">Could not load student</h2>
      <p className="text-sm text-muted-foreground mb-4">
        This student may not exist or an error occurred.
      </p>
      <div className="flex justify-center gap-3">
        <Button variant="outline" onClick={reset}>
          Try again
        </Button>
        <Link href="/students">
          <Button>Back to students</Button>
        </Link>
      </div>
    </div>
  );
}
