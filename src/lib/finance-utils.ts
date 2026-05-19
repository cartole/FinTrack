/**
 * ============================================
 * Utilidades Financieras
 * ============================================
 * Funciones helper para cálculos y formateo.
 */

import { Transaction, MonthlySummary, ProjectionData, TransactionCategory } from "./types";

/**
 * Formatea un número como moneda (USD por defecto).
 */
export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formatea una fecha ISO a formato legible en español.
 */
export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Formatea un mes "YYYY-MM" a nombre legible.
 */
export function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
}

/**
 * Obtiene el mes de una fecha ISO.
 */
export function getMonthFromISO(isoDate: string): string {
  return isoDate.substring(0, 7);
}

/**
 * Calcula el resumen mensual de un conjunto de transacciones.
 */
export function calculateMonthlySummary(
  transactions: Transaction[],
  month: string
): MonthlySummary {
  const monthTx = transactions.filter((t) => getMonthFromISO(t.date) === month);

  const byCategory = {} as Record<TransactionCategory, number>;
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const tx of monthTx) {
    if (!byCategory[tx.category]) byCategory[tx.category] = 0;
    byCategory[tx.category] += tx.amount;

    if (tx.type === "ingreso") totalIncome += tx.amount;
    else totalExpenses += tx.amount;
  }

  return {
    month,
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
    byCategory,
  };
}

/**
 * Obtiene los últimos N meses con datos.
 */
export function getRecentMonths(transactions: Transaction[], count: number): string[] {
  const monthsSet = new Set<string>();
  for (const tx of transactions) {
    monthsSet.add(getMonthFromISO(tx.date));
  }
  return Array.from(monthsSet).sort().slice(-count);
}

/**
 * Genera datos de proyección para los próximos meses.
 * Basado en promedios históricos con tendencias.
 */
export function generateProjections(
  transactions: Transaction[],
  monthsAhead: number = 3
): ProjectionData[] {
  const projections: ProjectionData[] = [];

  // Calcular promedios de los últimos 3 meses
  const recentMonths = getRecentMonths(transactions, 3);
  let avgIncome = 0;
  let avgExpenses = 0;

  for (const month of recentMonths) {
    const summary = calculateMonthlySummary(transactions, month);
    avgIncome += summary.totalIncome;
    avgExpenses += summary.totalExpenses;
  }

  const monthCount = Math.max(recentMonths.length, 1);
  avgIncome = Math.round(avgIncome / monthCount);
  avgExpenses = Math.round(avgExpenses / monthCount);

  // Generar proyecciones con una pequeña variación estacional
  const now = new Date();
  for (let i = 1; i <= monthsAhead; i++) {
    const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthLabel = futureDate.toLocaleDateString("es-ES", {
      month: "short",
      year: "2-digit",
    });

    // Factor estacional simple (los gastos suben en diciembre, bajan en enero)
    const monthNum = futureDate.getMonth();
    const seasonalFactor =
      monthNum === 11 ? 1.2 : monthNum === 0 ? 0.9 : monthNum === 6 || monthNum === 7 ? 1.1 : 1.0;

    const projectedIncome = Math.round(avgIncome * (0.95 + Math.random() * 0.1));
    const projectedExpenses = Math.round(avgExpenses * seasonalFactor * (0.95 + Math.random() * 0.1));

    projections.push({
      month: monthLabel,
      projectedIncome,
      projectedExpenses,
      projectedBalance: projectedIncome - projectedExpenses,
    });
  }

  return projections;
}

/**
 * Obtiene las transacciones del mes actual.
 */
export function getCurrentMonthTransactions(transactions: Transaction[]): Transaction[] {
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  return transactions
    .filter((t) => getMonthFromISO(t.date) === currentMonth)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Calcula el balance total acumulado.
 */
export function calculateTotalBalance(transactions: Transaction[]): number {
  return transactions.reduce((balance, tx) => {
    return tx.type === "ingreso" ? balance + tx.amount : balance - tx.amount;
  }, 0);
}

/**
 * Obtiene la lista de meses disponibles para el selector.
 */
export function getAvailableMonths(transactions: Transaction[]): string[] {
  const monthsSet = new Set<string>();
  for (const tx of transactions) {
    monthsSet.add(getMonthFromISO(tx.date));
  }
  return Array.from(monthsSet).sort().reverse();
}
