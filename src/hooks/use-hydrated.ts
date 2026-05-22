"use client";

import { useState, useEffect } from "react";
import { useFinanceStore } from "@/store/finance-store";

/**
 * Hook that returns true once Zustand persist has hydrated from localStorage.
 * Prevents SSR/client mismatch by showing a loading spinner until ready.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => {
    // Check synchronously on first render (client-side only)
    if (typeof window === "undefined") return false;
    return useFinanceStore.persist?.hasHydrated?.() ?? false;
  });

  useEffect(() => {
    // If already hydrated on mount, nothing to do
    if (hydrated) return;

    // Subscribe to hydration finish
    const unsubFinish = useFinanceStore.persist?.onFinishHydration?.(() => {
      setHydrated(true);
    });

    // Also check if it already finished (race condition)
    if (useFinanceStore.persist?.hasHydrated?.()) {
      setHydrated(true);
    }

    return () => {
      unsubFinish?.();
    };
  }, [hydrated]);

  return hydrated;
}
