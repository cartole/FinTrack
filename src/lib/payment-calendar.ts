/**
 * ============================================
 * Calendario de Pagos - Lógica
 * ============================================
 * Genera eventos de calendario a partir de
 * transacciones, suscripciones, deudas,
 * presupuestos y pagos de impuestos.
 */

import type {
  Transaction,
  Subscription,
  Debt,
  Budget,
  CalendarEvent,
  CalendarEventType,
  BillingCycle,
} from "./types";

// ============================================
// HELPERS
// ============================================

function generateId(): string {
  return `cal-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Añade meses a una fecha.
 */
function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Formatea una fecha como ISO date string (YYYY-MM-DD).
 */
function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Obtiene el número de meses de un ciclo de facturación.
 */
function billingCycleMonths(cycle: BillingCycle): number {
  switch (cycle) {
    case "mensual":
      return 1;
    case "trimestral":
      return 3;
    case "semestral":
      return 6;
    case "anual":
      return 12;
  }
}

// ============================================
// EVENTOS DESDE TRANSACCIONES RECURRENTES
// ============================================

function generateFromRecurringTransactions(transactions: Transaction[]): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const now = new Date();

  // Filtrar transacciones recurrentes
  const recurring = transactions.filter((t) => t.recurrence === "recurrente");

  for (const tx of recurring) {
    const txDate = new Date(tx.date);
    const dayOfMonth = txDate.getDate();
    const eventType: CalendarEventType = tx.type === "ingreso" ? "income" : "expense_recurring";

    // Generar para 12 meses adelante
    for (let m = 0; m < 12; m++) {
      // Clamp day to valid range for the month (e.g., day 31 → 28 in February)
      const year = now.getFullYear();
      const month = now.getMonth() + m;
      const maxDay = new Date(year, month + 1, 0).getDate();
      const safeDay = Math.min(dayOfMonth, maxDay);
      const eventDate = new Date(year, month, safeDay);
      // Evitar duplicados con el mes original si es muy reciente
      events.push({
        id: generateId(),
        title: tx.description,
        date: toISODate(eventDate),
        amount: tx.amount,
        type: eventType,
        category: tx.category,
        isRecurring: true,
        recurrencePattern: "monthly",
        sourceId: tx.id,
      });
    }
  }

  return events;
}

// ============================================
// EVENTOS DESDE SUSCRIPCIONES
// ============================================

function generateFromSubscriptions(subscriptions: Subscription[]): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const now = new Date();
  const oneYearFromNow = addMonths(now, 12);

  for (const sub of subscriptions) {
    if (!sub.isActive) continue;

    let nextDate = new Date(sub.nextBillingDate);
    const monthsIncrement = billingCycleMonths(sub.billingCycle);
    const recurrencePattern: CalendarEvent["recurrencePattern"] =
      sub.billingCycle === "mensual"
        ? "monthly"
        : sub.billingCycle === "trimestral"
        ? "quarterly"
        : sub.billingCycle === "semestral"
        ? "yearly"  // semestral mapped to closest available pattern
        : "yearly";

    // Generar eventos hasta un año adelante
    while (nextDate <= oneYearFromNow) {
      events.push({
        id: generateId(),
        title: `Renovación: ${sub.name}`,
        date: toISODate(nextDate),
        amount: sub.amount,
        type: "subscription",
        category: sub.category,
        isRecurring: true,
        recurrencePattern,
        sourceId: sub.id,
      });
      nextDate = addMonths(nextDate, monthsIncrement);
    }
  }

  return events;
}

// ============================================
// EVENTOS DESDE DEUDAS
// ============================================

function generateFromDebts(debts: Debt[]): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const now = new Date();
  const oneYearFromNow = addMonths(now, 12);

  for (const debt of debts) {
    if (debt.currentBalance <= 0) continue;

    // Generar pagos mensuales durante 12 meses
    for (let m = 0; m < 12; m++) {
      const year = now.getFullYear();
      const month = now.getMonth() + m;
      const maxDay = new Date(year, month + 1, 0).getDate();
      const safeDay = Math.min(debt.dueDay, maxDay);
      const paymentDate = new Date(year, month, safeDay);

      if (paymentDate > oneYearFromNow) break;

      // Comprobar si la deuda seguiría viva en esa fecha
      if (debt.endDate) {
        const endDate = new Date(debt.endDate);
        if (paymentDate > endDate) break;
      }

      events.push({
        id: generateId(),
        title: `Pago: ${debt.name}`,
        date: toISODate(paymentDate),
        amount: debt.minimumPayment,
        type: "debt_payment",
        isRecurring: true,
        recurrencePattern: "monthly",
        sourceId: debt.id,
      });
    }
  }

  return events;
}

// ============================================
// EVENTOS DESDE PRESUPUESTOS
// ============================================

function generateFromBudgets(budgets: Budget[]): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const now = new Date();

  // Recordatorio de revisión de presupuesto a final de cada mes
  for (let m = 0; m < 12; m++) {
    const checkDate = new Date(now.getFullYear(), now.getMonth() + m + 1, 0); // Último día del mes

    if (budgets.length > 0) {
      events.push({
        id: generateId(),
        title: `Revisión presupuestos`,
        date: toISODate(checkDate),
        amount: budgets.reduce((sum, b) => sum + b.monthlyLimit, 0),
        type: "budget_check",
        isRecurring: true,
        recurrencePattern: "monthly",
      });
    }
  }

  return events;
}

// ============================================
// EVENTOS DE IMPUESTOS (IRPF trimestral autónomos)
// ============================================

function generateTaxEvents(): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();

  // Trimestres IRPF/IVA para autónomos
  // T1: 20 Abr, T2: 20 Jul, T3: 20 Oct, T4: 30 Ene (del año siguiente)
  const taxDates = [
    { month: 3, day: 20, label: "1T - IRPF/IVA Autónomos" },   // 20 Abr
    { month: 6, day: 20, label: "2T - IRPF/IVA Autónomos" },   // 20 Jul
    { month: 9, day: 20, label: "3T - IRPF/IVA Autónomos" },   // 20 Oct
    { month: 0, day: 30, label: "4T - IRPF/IVA Autónomos" },   // 30 Ene (next year)
  ];

  // Generar para este año y el siguiente
  for (const taxDate of taxDates) {
    const year = taxDate.month === 0 ? currentYear + 1 : currentYear;
    const date = new Date(year, taxDate.month, taxDate.day);

    // Solo añadir fechas futuras
    if (date >= now) {
      events.push({
        id: generateId(),
        title: taxDate.label,
        date: toISODate(date),
        amount: 0, // El importe se calcula aparte
        type: "tax_payment",
        isRecurring: true,
        recurrencePattern: "quarterly",
      });
    }

    // También para el año siguiente si aplica
    const nextYearDate = new Date(year + 1, taxDate.month, taxDate.day);
    if (nextYearDate >= now && nextYearDate <= addMonths(now, 12)) {
      events.push({
        id: generateId(),
        title: taxDate.label,
        date: toISODate(nextYearDate),
        amount: 0,
        type: "tax_payment",
        isRecurring: true,
        recurrencePattern: "quarterly",
      });
    }
  }

  // Declaración de la Renta: 30 Jun y 30 Sep (plazo general)
  const rentaDates = [
    new Date(currentYear, 5, 30), // 30 Jun
    new Date(currentYear, 8, 30), // 30 Sep
  ];

  for (const date of rentaDates) {
    if (date >= now) {
      events.push({
        id: generateId(),
        title: "Plazo Declaración Renta",
        date: toISODate(date),
        amount: 0,
        type: "tax_payment",
        isRecurring: true,
        recurrencePattern: "yearly",
      });
    }
  }

  return events;
}

// ============================================
// FUNCIÓN PRINCIPAL: GENERAR EVENTOS
// ============================================

export function generateCalendarEvents(
  transactions: Transaction[],
  subscriptions: Subscription[],
  debts: Debt[],
  budgets: Budget[]
): CalendarEvent[] {
  const allEvents: CalendarEvent[] = [
    ...generateFromRecurringTransactions(transactions),
    ...generateFromSubscriptions(subscriptions),
    ...generateFromDebts(debts),
    ...generateFromBudgets(budgets),
    ...generateTaxEvents(),
  ];

  // Ordenar por fecha
  allEvents.sort((a, b) => a.date.localeCompare(b.date));

  return allEvents;
}

// ============================================
// FILTROS
// ============================================

/**
 * Obtiene los eventos de un mes específico.
 */
export function getEventsForMonth(
  events: CalendarEvent[],
  year: number,
  month: number
): CalendarEvent[] {
  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  return events
    .filter((e) => e.date.startsWith(monthStr))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Obtiene los eventos de un día específico.
 */
export function getEventsForDate(events: CalendarEvent[], date: string): CalendarEvent[] {
  return events
    .filter((e) => e.date === date)
    .sort((a, b) => {
      // Ordenar: ingresos primero, luego gastos
      const typeOrder: Record<CalendarEventType, number> = {
        income: 0,
        expense_recurring: 1,
        subscription: 2,
        debt_payment: 3,
        tax_payment: 4,
        budget_check: 5,
      };
      return (typeOrder[a.type] ?? 6) - (typeOrder[b.type] ?? 6);
    });
}

/**
 * Obtiene los eventos de los próximos N días desde hoy.
 */
export function getUpcomingEvents(events: CalendarEvent[], days: number = 7): CalendarEvent[] {
  const now = new Date();
  const today = toISODate(now);
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + days);
  const endStr = toISODate(endDate);

  return events
    .filter((e) => e.date >= today && e.date <= endStr)
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ============================================
// CONFIGURACIÓN DE TIPOS DE EVENTO
// ============================================

export const EVENT_TYPE_CONFIG: Record<
  CalendarEventType,
  { label: string; color: string; bgColor: string; icon: string }
> = {
  income: {
    label: "Ingreso",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/40",
    icon: "TrendingUp",
  },
  expense_recurring: {
    label: "Gasto recurrente",
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-100 dark:bg-rose-900/40",
    icon: "Repeat",
  },
  subscription: {
    label: "Suscripción",
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-100 dark:bg-pink-900/40",
    icon: "CreditCard",
  },
  debt_payment: {
    label: "Pago deuda",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/40",
    icon: "Landmark",
  },
  budget_check: {
    label: "Revisión presupuesto",
    color: "text-sky-600 dark:text-sky-400",
    bgColor: "bg-sky-100 dark:bg-sky-900/40",
    icon: "BarChart3",
  },
  tax_payment: {
    label: "Pago impuestos",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/40",
    icon: "FileText",
  },
};
