/**
 * ============================================
 * Theme Provider
 * ============================================
 * Componente cliente que sincroniza el tema
 * de la app con el DOM y corrige el viewport
 * height para iOS Safari.
 */

"use client";

import { useThemeSync, useViewportHeightFix } from "@/hooks/use-theme-sync";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useThemeSync();
  useViewportHeightFix();
  return <>{children}</>;
}
