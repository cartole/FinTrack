/**
 * ============================================
 * Theme Sync Hook
 * ============================================
 * Sincroniza el tema de la app (store) con el DOM.
 * Aplica/remueve la clase "dark" en <html> según
 * la preferencia del usuario o del sistema.
 *
 * También añade soporte para `dvh` (dynamic viewport height)
 * en iOS Safari, corrigiendo el problema del 100vh.
 */

"use client";

import { useEffect } from "react";
import { useFinanceStore } from "@/store/finance-store";

export function useThemeSync() {
  const theme = useFinanceStore((s) => s.settings.theme);

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    if (theme === "system") {
      // Escuchar cambios del sistema
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      applyTheme(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    } else {
      applyTheme(theme === "dark");
    }
  }, [theme]);
}

/**
 * Hook para corregir el problema de 100vh en iOS Safari.
 * Establece una CSS custom property --app-height que usa
 * window.innerHeight en lugar de 100vh.
 */
export function useViewportHeightFix() {
  useEffect(() => {
    const setHeight = () => {
      document.documentElement.style.setProperty(
        "--app-height",
        `${window.innerHeight}px`
      );
    };

    setHeight();
    window.addEventListener("resize", setHeight);
    // También escuchar orientationchange para móviles
    window.addEventListener("orientationchange", () => {
      // Pequeño delay para que el navegador calcule bien
      setTimeout(setHeight, 100);
    });

    return () => {
      window.removeEventListener("resize", setHeight);
      window.removeEventListener("orientationchange", setHeight);
    };
  }, []);
}
