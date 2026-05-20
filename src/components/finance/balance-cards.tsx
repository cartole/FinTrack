/**
 * ============================================
 * Balance Cards - Tarjetas de Resumen
 * ============================================
 * Muestra el balance actual, ingresos y gastos
 * del mes seleccionado con indicadores visuales.
 */

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useFinanceStore } from "@/store/finance-store";
import {
  calculateMonthlySummary,
  calculateTotalBalance,
  formatCurrency,
  getMonthFromISO,
} from "@/lib/finance-utils";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function BalanceCards() {
  const { transactions, selectedMonth } = useFinanceStore();

  const summary = calculateMonthlySummary(transactions, selectedMonth);
  const totalBalance = calculateTotalBalance(transactions);

  // Calcular cambio vs mes anterior
  const [year, month] = selectedMonth.split("-").map(Number);
  const prevMonth = new Date(year, month - 2, 1);
  const prevMonthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`;
  const prevSummary = calculateMonthlySummary(transactions, prevMonthStr);

  const incomeChange =
    prevSummary.totalIncome > 0
      ? ((summary.totalIncome - prevSummary.totalIncome) / prevSummary.totalIncome) * 100
      : 0;
  const expenseChange =
    prevSummary.totalExpenses > 0
      ? ((summary.totalExpenses - prevSummary.totalExpenses) / prevSummary.totalExpenses) * 100
      : 0;

  const cards = [
    {
      title: "Balance Total",
      value: formatCurrency(totalBalance),
      subtitle: "Acumulado histórico",
      icon: Wallet,
      trend: null,
      color: "text-foreground",
      bgColor: "bg-card",
    },
    {
      title: "Ingresos del Mes",
      value: formatCurrency(summary.totalIncome),
      subtitle: getMonthFromISO(selectedMonth)
        ? new Date(selectedMonth + "-01").toLocaleDateString("es-ES", {
            month: "long",
          })
        : selectedMonth,
      icon: TrendingUp,
      trend: incomeChange,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    },
    {
      title: "Gastos del Mes",
      value: formatCurrency(summary.totalExpenses),
      subtitle: getMonthFromISO(selectedMonth)
        ? new Date(selectedMonth + "-01").toLocaleDateString("es-ES", {
            month: "long",
          })
        : selectedMonth,
      icon: TrendingDown,
      trend: expenseChange,
      color: "text-rose-600",
      bgColor: "bg-rose-50 dark:bg-rose-950/30",
    },
    {
      title: "Superávit del Mes",
      value: formatCurrency(summary.balance),
      subtitle: summary.balance >= 0 ? "Positivo" : "Negativo",
      icon: PiggyBank,
      trend: null,
      color: summary.balance >= 0 ? "text-emerald-600" : "text-rose-600",
      bgColor:
        summary.balance >= 0
          ? "bg-emerald-50 dark:bg-emerald-950/30"
          : "bg-rose-50 dark:bg-rose-950/30",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card) => (
        <Card
          key={card.title}
          className={cn("border shadow-sm hover:shadow-md transition-shadow", card.bgColor)}
        >
          <CardContent className="p-3 sm:p-5">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {card.title}
              </span>
              <card.icon className={cn("h-4 w-4", card.color)} />
            </div>
            <div className="space-y-1">
              <p className={cn("text-lg sm:text-2xl font-bold tracking-tight whitespace-nowrap", card.color)}>
                {card.value}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">{card.subtitle}</span>
                {card.trend !== null && card.trend !== 0 && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                      card.trend > 0 && card.title.includes("Gastos")
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300"
                        : card.trend > 0
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                    )}
                  >
                    {card.trend > 0 ? (
                      <ArrowUpRight className="h-2.5 w-2.5" />
                    ) : (
                      <ArrowDownRight className="h-2.5 w-2.5" />
                    )}
                    {Math.abs(Math.round(card.trend))}%
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
