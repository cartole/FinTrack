/**
 * ============================================
 * Alertas Inteligentes
 * ============================================
 * Motor de detección y generación de alertas
 * basadas en el análisis del historial financiero.
 */

import {
  Transaction,
  Budget,
  Subscription,
  Debt,
  SmartAlert,
  AlertType,
  AlertSeverity,
  CATEGORY_CONFIG,
  type TransactionCategory,
} from "./types";
import {
  getMonthFromISO,
  getRecentMonths,
  calculateMonthlySummary,
  calculateTotalBalance,
} from "./finance-utils";

/** Genera un ID único simple */
function generateAlertId(): string {
  return `alert-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/** Orden de severidad para ordenar alertas (critical primero) */
const SEVERITY_ORDER: Record<AlertSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

/**
 * Genera alertas inteligentes basadas en los datos financieros del usuario.
 * Analiza presupuestos, gastos inusuales, saldo bajo, renovaciones de
 * suscripciones y tendencias negativas.
 */
export function generateSmartAlerts(
  transactions: Transaction[],
  budgets: Budget[],
  subscriptions: Subscription[],
  debts: Debt[]
): SmartAlert[] {
  const alerts: SmartAlert[] = [];
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // ---- 1. Alertas de presupuesto ----
  const currentMonthExpenses = transactions.filter(
    (t) => getMonthFromISO(t.date) === currentMonth && t.type === "gasto"
  );

  for (const budget of budgets) {
    const spent = currentMonthExpenses
      .filter((t) => t.category === budget.category)
      .reduce((sum, t) => sum + t.amount, 0);

    const percentage = budget.monthlyLimit > 0
      ? Math.round((spent / budget.monthlyLimit) * 100)
      : 0;
    const categoryLabel = CATEGORY_CONFIG[budget.category]?.label ?? budget.category;

    if (percentage > 100) {
      // Presupuesto superado
      alerts.push({
        id: generateAlertId(),
        type: "budget_exceeded",
        severity: "critical",
        title: `Presupuesto superado: ${categoryLabel}`,
        message: `Has gastado ${formatAmount(spent)} de tu límite de ${formatAmount(budget.monthlyLimit)} en ${categoryLabel}. Estás un ${percentage - 100}% por encima del presupuesto.`,
        actionable: true,
        action: `Revisa tus gastos en ${categoryLabel} y reduce lo antes posible. Considera reasignar presupuesto de otras categorías.`,
        data: { category: budget.category, spent, limit: budget.monthlyLimit, percentage },
        createdAt: now.toISOString(),
        isRead: false,
      });
    } else if (percentage > 80) {
      // Presupuesto al límite
      alerts.push({
        id: generateAlertId(),
        type: "budget_warning",
        severity: "warning",
        title: `Presupuesto al límite: ${categoryLabel}`,
        message: `Llevas gastado ${formatAmount(spent)} de ${formatAmount(budget.monthlyLimit)} en ${categoryLabel} (${percentage}%). Te quedan ${formatAmount(budget.monthlyLimit - spent)}.`,
        actionable: true,
        action: `Modera tus gastos en ${categoryLabel} durante el resto del mes para no superar el límite.`,
        data: { category: budget.category, spent, limit: budget.monthlyLimit, percentage },
        createdAt: now.toISOString(),
        isRead: false,
      });
    }
  }

  // ---- 2. Gastos inusuales ----
  const recentMonths = getRecentMonths(transactions, 3);
  const expenseCategories = new Set(
    transactions.filter((t) => t.type === "gasto").map((t) => t.category)
  );

  for (const category of expenseCategories) {
    // Calcular promedio histórico
    let totalCategorySpent = 0;
    let monthsWithData = 0;

    for (const month of recentMonths) {
      const summary = calculateMonthlySummary(transactions, month);
      const catSpent = summary.byCategory[category as TransactionCategory] || 0;
      if (catSpent > 0) {
        totalCategorySpent += catSpent;
        monthsWithData++;
      }
    }

    if (monthsWithData === 0) continue;
    const avgMonthly = totalCategorySpent / monthsWithData;

    // Gasto del mes actual
    const currentCatSpent = currentMonthExpenses
      .filter((t) => t.category === category)
      .reduce((sum, t) => sum + t.amount, 0);

    // Si el gasto actual supera en un 50% al promedio
    if (avgMonthly > 0 && currentCatSpent > avgMonthly * 1.5) {
      const percentageAbove = Math.round(((currentCatSpent - avgMonthly) / avgMonthly) * 100);
      const categoryLabel = CATEGORY_CONFIG[category as TransactionCategory]?.label ?? category;

      alerts.push({
        id: generateAlertId(),
        type: "unusual_spending",
        severity: "warning",
        title: `Gasto inusual en ${categoryLabel}`,
        message: `Tu gasto en ${categoryLabel} este mes (${formatAmount(currentCatSpent)}) es un ${percentageAbove}% superior a tu promedio de ${formatAmount(Math.round(avgMonthly))}.`,
        actionable: true,
        action: `Revisa si hay gastos innecesarios en ${categoryLabel}. Si es un gasto extraordinario, considéralo para ajustar tu presupuesto.`,
        data: {
          category,
          currentSpent: currentCatSpent,
          avgSpent: Math.round(avgMonthly),
          percentageAbove,
        },
        createdAt: now.toISOString(),
        isRead: false,
      });
    }
  }

  // ---- 3. Saldo bajo ----
  const totalBalance = calculateTotalBalance(transactions);
  if (totalBalance < 500) {
    alerts.push({
      id: generateAlertId(),
      type: "low_balance",
      severity: "critical",
      title: "Saldo bajo disponible",
      message: `Tu balance actual es de ${formatAmount(totalBalance)}, que está por debajo del umbral recomendado de 500€. Es importante tener un colchón financiero.`,
      actionable: true,
      action: "Reduce gastos discrecionales esta semana y considera transferir dinero de tu cuenta de ahorro si es necesario.",
      data: { balance: totalBalance, threshold: 500 },
      createdAt: now.toISOString(),
      isRead: false,
    });
  }

  // ---- 4. Renovación de suscripciones ----
  const threeDaysFromNow = new Date(now);
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  for (const sub of subscriptions) {
    if (!sub.isActive) continue;
    const nextBilling = new Date(sub.nextBillingDate);
    if (nextBilling >= now && nextBilling <= threeDaysFromNow) {
      const daysUntil = Math.ceil(
        (nextBilling.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      alerts.push({
        id: generateAlertId(),
        type: "subscription_renewal",
        severity: "info",
        title: `Renovación: ${sub.name}`,
        message: `${sub.name} se renovará ${daysUntil === 0 ? "hoy" : `en ${daysUntil} día${daysUntil !== 1 ? "s" : ""}`} por ${formatAmount(sub.amount)} (${sub.billingCycle}).`,
        actionable: true,
        action: daysUntil > 0
          ? `Si ya no usas ${sub.name}, cancela antes de la renovación para evitar el cargo.`
          : `La suscripción se ha renovado hoy. Revisa si la sigues necesitando para la próxima.`,
        data: { subscriptionId: sub.id, name: sub.name, amount: sub.amount, daysUntil },
        createdAt: now.toISOString(),
        isRead: false,
      });
    }
  }

  // ---- 5. Tendencia negativa (3+ meses con déficit) ----
  const last6Months = getRecentMonths(transactions, 6);
  let consecutiveDeficit = 0;

  for (let i = last6Months.length - 1; i >= 0; i--) {
    const summary = calculateMonthlySummary(transactions, last6Months[i]);
    if (summary.balance < 0) {
      consecutiveDeficit++;
    } else {
      break;
    }
  }

  if (consecutiveDeficit >= 3) {
    alerts.push({
      id: generateAlertId(),
      type: "negative_trend",
      severity: "warning",
      title: "Tendencia negativa prolongada",
      message: `Llevas ${consecutiveDeficit} meses seguidos gastando más de lo que ingresas. Esto puede comprometer tu estabilidad financiera.`,
      actionable: true,
      action: "Analiza tus gastos fijos y busca categorías donde puedas recortar. Considera incrementar tus ingresos con trabajo freelance o vendiendo artículos que no uses.",
      data: { consecutiveMonths: consecutiveDeficit },
      createdAt: now.toISOString(),
      isRead: false,
    });
  }

  // ---- Ordenar por severidad (critical primero) ----
  alerts.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  return alerts;
}

/**
 * Formatea una cantidad de forma corta para mensajes de alerta.
 */
function formatAmount(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
