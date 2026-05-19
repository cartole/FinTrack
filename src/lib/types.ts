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
