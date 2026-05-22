/**
 * ============================================
 * Formatter Hooks
 * ============================================
 * Hooks that read settings from the store
 * and provide formatting functions that
 * respect user preferences (decimals, dateFormat).
 */

"use client";

import { useFinanceStore } from "@/store/finance-store";
import { formatCurrency, formatDate } from "@/lib/finance-utils";

/**
 * Hook that provides a formatCurrency function
 * respecting the user's currencyDecimals setting.
 */
export function useFormatCurrency() {
  const { settings } = useFinanceStore();
  return (amount: number, currency?: string) =>
    formatCurrency(amount, currency, settings.currencyDecimals);
}

/**
 * Hook that provides a formatDate function
 * respecting the user's dateFormat setting.
 */
export function useFormatDate() {
  const { settings } = useFinanceStore();
  return (isoDate: string) => formatDate(isoDate, settings.dateFormat);
}
