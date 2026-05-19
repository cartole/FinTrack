/**
 * ============================================
 * Gestor de Presupuestos
 * ============================================
 * Lógica de cálculo y recomendaciones para
 * presupuestos mensuales por categoría.
 */

import { Transaction, Budget, BudgetStatus, TransactionCategory, EXPENSE_CATEGORIES } from "./types";
import { getMonthFromISO, getRecentMonths, calculateMonthlySummary } from "./finance-utils";

/**
 * Calcula el estado de cada presupuesto para un mes dado.
 * Devuelve un BudgetStatus por cada presupuesto configurado.
 */
export function calculateBudgetStatus(
  transactions: Transaction[],
  budgets: Budget[],
  month: string
): BudgetStatus[] {
  const monthTx = transactions.filter(
    (t) => getMonthFromISO(t.date) === month && t.type === "gasto"
  );

  return budgets.map((budget) => {
    const spent = monthTx
      .filter((t) => t.category === budget.category)
      .reduce((sum, t) => sum + t.amount, 0);

    const remaining = budget.monthlyLimit - spent;
    const percentage = budget.monthlyLimit > 0
      ? Math.round((spent / budget.monthlyLimit) * 100)
      : 0;

    let status: BudgetStatus["status"] = "ok";
    if (percentage > 100) {
      status = "over";
    } else if (percentage > 80) {
      status = "warning";
    }

    return {
      budget,
      spent,
      remaining,
      percentage,
      status,
    };
  });
}

/**
 * Genera recomendaciones de límites de presupuesto basadas
 * en el historial de gastos (promedio de 3 meses + 10% buffer).
 * Solo sugiere para categorías de gasto.
 */
export function generateBudgetRecommendations(
  transactions: Transaction[],
  budgets: Budget[]
): { category: TransactionCategory; suggestedLimit: number; currentLimit?: number; avgSpending: number }[] {
  const recentMonths = getRecentMonths(transactions, 3);
  const recommendations: {
    category: TransactionCategory;
    suggestedLimit: number;
    currentLimit?: number;
    avgSpending: number;
  }[] = [];

  for (const category of EXPENSE_CATEGORIES) {
    // Calcular promedio de gasto en los últimos 3 meses
    let totalSpent = 0;
    let monthsWithData = 0;

    for (const month of recentMonths) {
      const summary = calculateMonthlySummary(transactions, month);
      const categorySpent = summary.byCategory[category] || 0;
      if (categorySpent > 0) {
        totalSpent += categorySpent;
        monthsWithData++;
      }
    }

    // Si no hay datos históricos, no recomendamos
    if (monthsWithData === 0) continue;

    const avgSpending = Math.round(totalSpent / monthsWithData);
    const suggestedLimit = Math.round(avgSpending * 1.1); // 10% buffer

    // Buscar presupuesto existente para esta categoría
    const existingBudget = budgets.find((b) => b.category === category);

    recommendations.push({
      category,
      suggestedLimit,
      currentLimit: existingBudget?.monthlyLimit,
      avgSpending,
    });
  }

  // Ordenar por gasto promedio descendente (categorías más caras primero)
  return recommendations.sort((a, b) => b.avgSpending - a.avgSpending);
}

/**
 * Obtiene el color de la barra de progreso según el porcentaje gastado.
 */
export function getProgressColor(percentage: number): string {
  if (percentage > 100) return "bg-red-500";
  if (percentage >= 80) return "bg-orange-500";
  if (percentage >= 60) return "bg-yellow-500";
  return "bg-emerald-500";
}

/**
 * Obtiene la clase de color del texto según el porcentaje gastado.
 */
export function getProgressTextColor(percentage: number): string {
  if (percentage > 100) return "text-red-600 dark:text-red-400";
  if (percentage >= 80) return "text-orange-600 dark:text-orange-400";
  if (percentage >= 60) return "text-yellow-600 dark:text-yellow-400";
  return "text-emerald-600 dark:text-emerald-400";
}

/**
 * Obtiene la etiqueta de estado en español.
 */
export function getStatusLabel(status: BudgetStatus["status"]): string {
  const labels: Record<BudgetStatus["status"], string> = {
    ok: "Correcto",
    warning: "Cuidado",
    over: "Superado",
    none: "Sin datos",
  };
  return labels[status];
}
