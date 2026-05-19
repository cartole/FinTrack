/**
 * ============================================
 * Tipos TypeScript - Finanzas Personales MVP
 * ============================================
 * Definiciones de tipos para toda la aplicación.
 * Escalables y listos para producción.
 */

/** Categorías de transacciones disponibles */
export type TransactionCategory =
  | "comida"
  | "alquiler"
  | "transporte"
  | "ocio"
  | "salud"
  | "educacion"
  | "suscripciones"
  | "ropa"
  | "ahorro"
  | "salario"
  | "freelance"
  | "inversiones"
  | "regalo"
  | "otro";

/** Tipo de transacción: ingreso o gasto */
export type TransactionType = "ingreso" | "gasto";

/** Frecuencia de la transacción */
export type RecurrenceType = "puntual" | "recurrente";

/** Interfaz principal de una transacción financiera */
export interface Transaction {
  id: string;
  amount: number;
  category: TransactionCategory;
  type: TransactionType;
  recurrence: RecurrenceType;
  description: string;
  date: string; // ISO date string
  createdAt: string;
}

/** Resumen mensual de finanzas */
export interface MonthlySummary {
  month: string; // "2026-01" format
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  byCategory: Record<TransactionCategory, number>;
}

/** Datos para gráficas de proyección */
export interface ProjectionData {
  month: string;
  projectedIncome: number;
  projectedExpenses: number;
  projectedBalance: number;
}

/** Meta de ahorro del usuario */
export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // ISO date
  createdAt: string;
}

/** Plan de ahorro generado por la IA */
export interface SavingsPlan {
  goalName: string;
  targetAmount: number;
  monthlySavingsRequired: number;
  monthsToGoal: number;
  feasibilityScore: number; // 0-100
  categoryCuts: CategoryCut[];
  projectedTimeline: TimelineStep[];
  recommendations: string[];
  summary: string;
}

/** Recorte sugerido por categoría */
export interface CategoryCut {
  category: TransactionCategory;
  currentMonthlyAvg: number;
  suggestedMax: number;
  potentialSaving: number;
  difficulty: "facil" | "moderado" | "dificil";
}

/** Paso del timeline proyectado */
export interface TimelineStep {
  month: string;
  amountToSave: number;
  cumulativeSaved: number;
  milestone: string;
}

// ============================================
// PRESUPUESTO MENSUAL
// ============================================

/** Presupuesto mensual por categoría */
export interface Budget {
  id: string;
  category: TransactionCategory;
  monthlyLimit: number;
  createdAt: string;
}

/** Estado del presupuesto en un mes */
export interface BudgetStatus {
  budget: Budget;
  spent: number;
  remaining: number;
  percentage: number;
  status: "ok" | "warning" | "over" | "none";
}

// ============================================
// GESTOR DE DEUDAS
// ============================================

/** Tipo de deuda */
export type DebtType =
  | "prestamo_personal"
  | "tarjeta_credito"
  | "hipoteca"
  | "prestamo_auto"
  | "prestamo_estudios"
  | "otro";

/** Estrategia de amortización */
export type DebtStrategy = "bola_nieve" | "avalancha";

/** Una deuda del usuario */
export interface Debt {
  id: string;
  name: string;
  type: DebtType;
  totalAmount: number;
  currentBalance: number;
  interestRate: number; // TAE anual %
  minimumPayment: number;
  dueDay: number; // día del mes de pago
  startDate: string;
  endDate?: string;
  createdAt: string;
}

/** Plan de pago de una deuda */
export interface DebtPayoffPlan {
  debt: Debt;
  monthsToPayoff: number;
  totalInterest: number;
  totalPaid: number;
  monthlyPayment: number;
  schedule: DebtPayoffStep[];
}

/** Paso del plan de pago */
export interface DebtPayoffStep {
  month: string;
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
}

/** Plan global de todas las deudas */
export interface GlobalDebtPlan {
  strategy: DebtStrategy;
  totalDebt: number;
  totalInterest: number;
  totalMonthsToFreedom: number;
  debtsOrder: Debt[];
  individualPlans: DebtPayoffPlan[];
  monthlyPaymentTotal: number;
  snowballExtra: number;
  summary: string;
}

// ============================================
// SUSCRIPCIONES
// ============================================

/** Ciclo de facturación */
export type BillingCycle = "mensual" | "trimestral" | "semestral" | "anual";

/** Una suscripción activa */
export interface Subscription {
  id: string;
  name: string;
  amount: number;
  billingCycle: BillingCycle;
  nextBillingDate: string;
  category: TransactionCategory;
  isActive: boolean;
  startDate: string;
  createdAt: string;
}

/** Resumen de suscripciones */
export interface SubscriptionSummary {
  totalMonthly: number;
  totalAnnual: number;
  activeCount: number;
  byCategory: Record<string, { count: number; monthly: number; annual: number }>;
  nextRenewals: { subscription: Subscription; daysUntil: number }[];
}

// ============================================
// ALERTAS INTELIGENTES
// ============================================

/** Tipo de alerta */
export type AlertType =
  | "budget_warning"
  | "budget_exceeded"
  | "unusual_spending"
  | "low_balance"
  | "subscription_renewal"
  | "payment_reminder"
  | "negative_trend"
  | "savings_milestone";

/** Severidad de la alerta */
export type AlertSeverity = "info" | "warning" | "critical";

/** Una alerta inteligente */
export interface SmartAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  actionable: boolean;
  action?: string;
  data?: Record<string, unknown>;
  createdAt: string;
  isRead: boolean;
}

// ============================================
// CALENDARIO DE PAGOS
// ============================================

/** Tipo de evento de calendario */
export type CalendarEventType =
  | "income"
  | "expense_recurring"
  | "subscription"
  | "debt_payment"
  | "budget_check"
  | "tax_payment";

/** Un evento en el calendario */
export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  amount: number;
  type: CalendarEventType;
  category?: TransactionCategory;
  isRecurring: boolean;
  recurrencePattern?: "monthly" | "quarterly" | "yearly";
  sourceId?: string; // ID de la suscripción, deuda, etc.
}

// ============================================
// ESTIMADOR IRPF
// ============================================

/** Situación familiar del contribuyente */
export type FamilySituation = "soltero" | "casado_monotributacion" | "casado_conjunta" | "separado" | "viudo";

/** Grado de discapacidad */
export type DisabilityDegree = "ninguna" | "33_65" | "65_plus";

/** Tipo de familia numerosa */
export type FamilyType = "normal" | "numerosa_general" | "numerosa_especial";

/** Tipo de trabajador */
export type WorkerType = "asalariado" | "autonomo" | "pensionista";

/** Perfil completo del contribuyente para IRPF */
export interface IRPFProfile {
  workerType: WorkerType;
  age: number;
  familySituation: FamilySituation;
  annualGrossIncome: number;
  // Descendientes
  descendantsUnder3: number;
  descendants3To25: number;
  // Ascendientes
  ascendantsOver65: number;
  ascendantsOver75: number;
  // Discapacidad
  disabilityDegree: DisabilityDegree;
  hasAssistant: boolean;
  // Familia numerosa
  familyType: FamilyType;
  // Comunidad autónoma
  autonomousCommunity: string;
  // Autónomo
  isAutonomo: boolean;
  annualExpenses?: number; // Gastos deducibles para autónomos
  ivaRate?: number; // Tipo de IVA aplicado
}

/** Tramo del IRPF */
export interface IRPFBracket {
  from: number;
  to: number | null;
  rate: number;
  stateRate: number;
  autonomousRate: number;
  baseInBracket: number;
  taxInBracket: number;
}

/** Resultado completo del cálculo IRPF */
export interface IRPFResult {
  grossIncome: number;
  workReduction: number;
  netWorkIncome: number;
  otherDeductions: number;
  taxableBase: number;
  minimumPersonal: number;
  minimumFamily: number;
  minimumDisability: number;
  totalMinimum: number;
  baseLiquidable: number;
  brackets: IRPFBracket[];
  stateTax: number;
  autonomousTax: number;
  totalTax: number;
  effectiveRate: number;
  marginalRate: number;
  netAnnualIncome: number;
  netMonthlyIncome: number;
  // Autónomo
  quarterlyVAT?: number;
  quarterlyIRPF?: number;
  annualIRPFWithholding?: number;
  // Resumen
  summary: string;
}

// ============================================
// CONFIGURACIÓN DE CATEGORÍAS
// ============================================

/** Configuración de colores por categoría */
export const CATEGORY_CONFIG: Record<
  TransactionCategory,
  { label: string; color: string; icon: string }
> = {
  comida: { label: "Comida", color: "#ef4444", icon: "UtensilsCrossed" },
  alquiler: { label: "Alquiler", color: "#f97316", icon: "Home" },
  transporte: { label: "Transporte", color: "#eab308", icon: "Car" },
  ocio: { label: "Ocio", color: "#a855f7", icon: "Gamepad2" },
  salud: { label: "Salud", color: "#22c55e", icon: "Heart" },
  educacion: { label: "Educación", color: "#3b82f6", icon: "GraduationCap" },
  suscripciones: { label: "Suscripciones", color: "#ec4899", icon: "Repeat" },
  ropa: { label: "Ropa", color: "#14b8a6", icon: "Shirt" },
  ahorro: { label: "Ahorro", color: "#06b6d4", icon: "PiggyBank" },
  salario: { label: "Salario", color: "#10b981", icon: "Briefcase" },
  freelance: { label: "Freelance", color: "#8b5cf6", icon: "Laptop" },
  inversiones: { label: "Inversiones", color: "#f59e0b", icon: "TrendingUp" },
  regalo: { label: "Regalo", color: "#e11d48", icon: "Gift" },
  otro: { label: "Otro", color: "#6b7280", icon: "MoreHorizontal" },
};

/** Categorías que son ingresos */
export const INCOME_CATEGORIES: TransactionCategory[] = [
  "salario",
  "freelance",
  "inversiones",
  "regalo",
  "otro",
];

/** Categorías que son gastos */
export const EXPENSE_CATEGORIES: TransactionCategory[] = [
  "comida",
  "alquiler",
  "transporte",
  "ocio",
  "salud",
  "educacion",
  "suscripciones",
  "ropa",
  "ahorro",
];

/** Tipos de deuda con su configuración */
export const DEBT_TYPE_CONFIG: Record<
  DebtType,
  { label: string; icon: string; typicalRate: number }
> = {
  prestamo_personal: { label: "Préstamo Personal", icon: "FileText", typicalRate: 8 },
  tarjeta_credito: { label: "Tarjeta de Crédito", icon: "CreditCard", typicalRate: 18 },
  hipoteca: { label: "Hipoteca", icon: "Home", typicalRate: 3 },
  prestamo_auto: { label: "Préstamo Auto", icon: "Car", typicalRate: 7 },
  prestamo_estudios: { label: "Préstamo Estudios", icon: "GraduationCap", typicalRate: 5 },
  otro: { label: "Otro", icon: "MoreHorizontal", typicalRate: 10 },
};

/** Configuración de tipos de alerta */
export const ALERT_TYPE_CONFIG: Record<
  AlertType,
  { label: string; icon: string; defaultSeverity: AlertSeverity }
> = {
  budget_warning: { label: "Presupuesto al límite", icon: "AlertTriangle", defaultSeverity: "warning" },
  budget_exceeded: { label: "Presupuesto superado", icon: "XCircle", defaultSeverity: "critical" },
  unusual_spending: { label: "Gasto inusual", icon: "TrendingUp", defaultSeverity: "warning" },
  low_balance: { label: "Saldo bajo", icon: "Wallet", defaultSeverity: "critical" },
  subscription_renewal: { label: "Renovación suscripción", icon: "Repeat", defaultSeverity: "info" },
  payment_reminder: { label: "Recordatorio de pago", icon: "Calendar", defaultSeverity: "info" },
  negative_trend: { label: "Tendencia negativa", icon: "TrendingDown", defaultSeverity: "warning" },
  savings_milestone: { label: "Hito de ahorro", icon: "Trophy", defaultSeverity: "info" },
};
