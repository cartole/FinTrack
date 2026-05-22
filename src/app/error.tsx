"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-8">
      <p className="text-lg font-semibold text-destructive">Error</p>
      <p className="text-sm text-muted-foreground">{error.message || "Algo salió mal"}</p>
      <button
        onClick={reset}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Reintentar
      </button>
    </div>
  );
}
