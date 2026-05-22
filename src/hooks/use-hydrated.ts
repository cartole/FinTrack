"use client";

import { useState, useEffect } from "react";
import { useFinanceStore } from "@/store/finance-store";

/**
 * Hook that returns true once Zustand persist has hydrated from localStorage.
 * Prevents SSR/client mismatch by showing a loading spinner until ready.
 * Falls back to true immediately if persist middleware is not configured.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => {
    // SSR guard
    if (typeof window === "undefined") return false;
    // If no persist middleware, consider hydrated immediately
    if (!useFinanceStore.persist) return true;
    return useFinanceStore.persist.hasHydrated?.() ?? false;
  });

  useEffect(() => {
    if (hydrated) return;

    // If no persist middleware, mark as hydrated
    if (!useFinanceStore.persist) {
      setHydrated(true);
      return;
    }

    // Subscribe to hydration finish
    const unsubFinish = useFinanceStore.persist.onFinishHydration?.(() => {
      setHydrated(true);
    });

    // Check if already finished (race condition)
    if (useFinanceStore.persist.hasHydrated?.()) {
      setHydrated(true);
    }

    // Safety timeout: if hydration doesn't complete in 3s, proceed anyway
    const timeout = setTimeout(() => {
      setHydrated(true);
    }, 3000);

    return () => {
      unsubFinish?.();
      clearTimeout(timeout);
    };
  }, [hydrated]);

  return hydrated;
}
