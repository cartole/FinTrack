/**
 * ============================================
 * Módulo de Rastreo de Suscripciones
 * ============================================
 *
 * Analiza y resume las suscripciones del usuario,
 * detecta pagos recurrentes en transacciones y
 * calcula costes mensuales/anuales equivalentes.
 *
 * Funcionalidades:
 * 1. Resumen de suscripciones (mensual, anual, por categoría)
 * 2. Conversión de ciclos de facturación a equivalente mensual
 * 3. Detección de suscripciones desde transacciones recurrentes
 * 4. Próximas renovaciones ordenadas por fecha
 */

import {
  Subscription,
  SubscriptionSummary,
  BillingCycle,
  Transaction,
  CATEGORY_CONFIG,
} from "./types";

// ---- Conversión de Ciclos ----

/**
 * Convierte cualquier ciclo de facturación a su equivalente mensual.
 * - mensual: amount
 * - trimestral: amount / 3
 * - semestral: amount / 6
 * - anual: amount / 12
 */
export function getMonthlyEquivalent(
  amount: number,
  cycle: BillingCycle
): number {
  const divisors: Record<BillingCycle, number> = {
    mensual: 1,
    trimestral: 3,
    semestral: 6,
    anual: 12,
  };
  return Math.round((amount / divisors[cycle]) * 100) / 100;
}

/**
 * Convierte cualquier ciclo de facturación a su equivalente anual.
 */
export function getAnnualEquivalent(
  amount: number,
  cycle: BillingCycle
): number {
  const multipliers: Record<BillingCycle, number> = {
    mensual: 12,
    trimestral: 4,
    semestral: 2,
    anual: 1,
  };
  return Math.round(amount * multipliers[cycle] * 100) / 100;
}

// ---- Resumen de Suscripciones ----

/**
 * Calcula un resumen completo de las suscripciones:
 * - totalMonthly: suma de equivalentes mensuales de todas las activas
 * - totalAnnual: suma de equivalentes anuales de todas las activas
 * - activeCount: número de suscripciones activas
 * - byCategory: desglose por categoría
 * - nextRenewals: próximas renovaciones ordenadas por días hasta la fecha
 */
export function calculateSubscriptionSummary(
  subscriptions: Subscription[]
): SubscriptionSummary {
  const activeSubs = subscriptions.filter((s) => s.isActive);

  // Totales
  let totalMonthly = 0;
  let totalAnnual = 0;

  for (const sub of activeSubs) {
    totalMonthly += getMonthlyEquivalent(sub.amount, sub.billingCycle);
    totalAnnual += getAnnualEquivalent(sub.amount, sub.billingCycle);
  }

  totalMonthly = Math.round(totalMonthly * 100) / 100;
  totalAnnual = Math.round(totalAnnual * 100) / 100;

  // Desglose por categoría
  const byCategory: Record<
    string,
    { count: number; monthly: number; annual: number }
  > = {};

  for (const sub of activeSubs) {
    const cat = sub.category;
    if (!byCategory[cat]) {
      byCategory[cat] = { count: 0, monthly: 0, annual: 0 };
    }
    byCategory[cat].count += 1;
    byCategory[cat].monthly += getMonthlyEquivalent(sub.amount, sub.billingCycle);
    byCategory[cat].annual += getAnnualEquivalent(sub.amount, sub.billingCycle);
  }

  // Redondear categoría
  for (const cat of Object.keys(byCategory)) {
    byCategory[cat].monthly = Math.round(byCategory[cat].monthly * 100) / 100;
    byCategory[cat].annual = Math.round(byCategory[cat].annual * 100) / 100;
  }

  // Próximas renovaciones
  const now = new Date();
  const nextRenewals: { subscription: Subscription; daysUntil: number }[] = [];

  for (const sub of activeSubs) {
    const billingDate = new Date(sub.nextBillingDate);
    const diffMs = billingDate.getTime() - now.getTime();
    const daysUntil = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    // Solo mostrar renovaciones futuras (hasta 365 días)
    if (daysUntil >= 0 && daysUntil <= 365) {
      nextRenewals.push({ subscription: sub, daysUntil });
    } else if (daysUntil < 0) {
      // Si ya pasó, calcular la siguiente fecha según el ciclo
      const nextDate = calculateNextBillingDate(
        sub.nextBillingDate,
        sub.billingCycle
      );
      const nextDiffMs = nextDate.getTime() - now.getTime();
      const nextDaysUntil = Math.ceil(nextDiffMs / (1000 * 60 * 60 * 24));
      if (nextDaysUntil >= 0 && nextDaysUntil <= 365) {
        nextRenewals.push({ subscription: sub, daysUntil: nextDaysUntil });
      }
    }
  }

  nextRenewals.sort((a, b) => a.daysUntil - b.daysUntil);

  return {
    totalMonthly,
    totalAnnual,
    activeCount: activeSubs.length,
    byCategory,
    nextRenewals,
  };
}

/**
 * Calcula la siguiente fecha de facturación a partir de una fecha y ciclo.
 */
function calculateNextBillingDate(
  lastBillingDate: string,
  cycle: BillingCycle
): Date {
  const date = new Date(lastBillingDate);
  const now = new Date();

  const monthsToAdd: Record<BillingCycle, number> = {
    mensual: 1,
    trimestral: 3,
    semestral: 6,
    anual: 12,
  };

  // Avanzar hasta que la fecha sea futura
  const result = new Date(date);
  while (result <= now) {
    result.setMonth(result.getMonth() + monthsToAdd[cycle]);
  }

  return result;
}

// ---- Detección de Suscripciones ----

/** Una suscripción detectada de transacciones */
export interface DetectedSubscription {
  description: string;
  amount: number;
  occurrences: number;
  suggestedCycle: BillingCycle;
  confidence: number; // 0-100
  category: string;
  lastDate: string;
}

/**
 * Detecta posibles suscripciones a partir de transacciones recurrentes.
 *
 * Busca transacciones con la misma descripción e importe similar
 * que se repiten con una frecuencia que sugiere una suscripción.
 */
export function detectSubscriptionFromTransactions(
  transactions: Transaction[]
): DetectedSubscription[] {
  const expenseTransactions = transactions.filter(
    (t) => t.type === "gasto" && t.recurrence !== "recurrente"
  );

  // Agrupar por descripción normalizada + importe
  const groups = new Map<
    string,
    { tx: Transaction; count: number; dates: Date[]; amounts: number[] }[]
  >();

  for (const tx of expenseTransactions) {
    // Normalizar descripción: minúsculas, sin espacios extra
    const normalizedDesc = tx.description
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ");

    // Redondear importe al euro más cercano para agrupar
    const roundedAmount = Math.round(tx.amount);

    const key = `${normalizedDesc}__${roundedAmount}`;

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    // Buscar si ya existe un grupo con importe similar
    const existingGroups = groups.get(key)!;
    let foundMatch = false;

    for (const group of existingGroups) {
      if (Math.abs(group.tx.amount - tx.amount) < 1) {
        group.count++;
        group.dates.push(new Date(tx.date));
        group.amounts.push(tx.amount);
        foundMatch = true;
        break;
      }
    }

    if (!foundMatch) {
      existingGroups.push({
        tx,
        count: 1,
        dates: [new Date(tx.date)],
        amounts: [tx.amount],
      });
    }
  }

  // Analizar grupos con 2+ ocurrencias
  const detected: DetectedSubscription[] = [];

  for (const [, groupList] of groups) {
    for (const group of groupList) {
      if (group.count < 2) continue;

      // Ordenar fechas
      const sortedDates = group.dates.sort(
        (a, b) => a.getTime() - b.getTime()
      );

      // Calcular intervalo promedio entre pagos
      let totalDaysDiff = 0;
      let intervals = 0;
      for (let i = 1; i < sortedDates.length; i++) {
        const diffDays = Math.round(
          (sortedDates[i].getTime() - sortedDates[i - 1].getTime()) /
            (1000 * 60 * 60 * 24)
        );
        if (diffDays > 0 && diffDays < 400) {
          totalDaysDiff += diffDays;
          intervals++;
        }
      }

      if (intervals === 0) continue;

      const avgDays = totalDaysDiff / intervals;

      // Determinar ciclo sugerido
      let suggestedCycle: BillingCycle;
      let confidence: number;

      if (avgDays >= 25 && avgDays <= 35) {
        suggestedCycle = "mensual";
        confidence = 85;
      } else if (avgDays >= 80 && avgDays <= 100) {
        suggestedCycle = "trimestral";
        confidence = 75;
      } else if (avgDays >= 170 && avgDays <= 195) {
        suggestedCycle = "semestral";
        confidence = 70;
      } else if (avgDays >= 350 && avgDays <= 380) {
        suggestedCycle = "anual";
        confidence = 80;
      } else if (avgDays > 35 && avgDays < 80) {
        suggestedCycle = "mensual";
        confidence = 50;
      } else {
        suggestedCycle = "mensual";
        confidence = 30;
      }

      // Aumentar confianza si hay más ocurrencias
      confidence = Math.min(95, confidence + (group.count - 2) * 5);

      // Solo incluir si confianza >= 40
      if (confidence >= 40) {
        const avgAmount =
          group.amounts.reduce((a, b) => a + b, 0) / group.amounts.length;

        detected.push({
          description: group.tx.description,
          amount: Math.round(avgAmount * 100) / 100,
          occurrences: group.count,
          suggestedCycle,
          confidence,
          category: group.tx.category,
          lastDate:
            sortedDates[sortedDates.length - 1].toISOString().split("T")[0],
        });
      }
    }
  }

  // Ordenar por confianza descendente
  return detected.sort((a, b) => b.confidence - a.confidence);
}
