/**
 * ============================================
 * Store de Finanzas - Zustand State Management
 * ============================================
 * Estado global de la aplicación con Zustand.
 * Gestiona transacciones, metas, presupuestos, deudas, suscripciones.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  Transaction,
  SavingsGoal,
  SavingsPlan,
  Budget,
  Debt,
  Subscription,
} from "@/lib/types";
import { mockTransactions, mockSavingsGoals, mockBudgets, mockSubscriptions, mockDebts } from "@/lib/mock-data";
import { generateSavingsPlan } from "@/lib/savings-planner";

// ---- Configuración de la app ----

export interface AppSettings {
  // Fiscalidad
  withholdingTaxRate: number;     // Retención sobre rendimientos del capital (%)
  capitalGainsTaxRate: number;    // Retención sobre plusvalías (%)

  // Economía
  inflationRate: number;          // Inflación estimada (%)
  emergencyFundMonths: number;    // Meses de fondo de emergencia recomendado
  defaultEcbRate: number;         // Tipo de interés BCE por defecto (%)

  // Visualización
  currencyDecimals: number;       // Decimales en moneda (0, 1, 2)
  dateFormat: "dd/mm/yyyy" | "yyyy-mm-dd";
  theme: "light" | "dark" | "system";  // Tema de la app
  compactMode: boolean;           // Modo compacto (menos padding)

  // Perfil personal
  userName: string;               // Nombre del usuario
  monthlyIncome: number;          // Ingresos mensuales netos (€)
  savingsRateTarget: number;      // Objetivo de tasa de ahorro (%)
  riskProfile: "conservador" | "moderado" | "agresivo";  // Perfil de riesgo

  // Notificaciones y alertas
  spendingAlertThreshold: number; // Umbral de alerta de gasto (% del presupuesto)
  subscriptionRenewalDays: number;// Días antes de renovación para avisar
  budgetWarningPercent: number;   // % del presupuesto para aviso
  enableNotifications: boolean;   // Notificaciones activadas

  // Metas de ahorro
  selectedGoalId: string;         // ID de la meta de ahorro seleccionada/activa
  autoAllocateSavings: boolean;   // Asignar automáticamente al ahorro

  // Privacidad
  dataRetentionDays: number;      // Días de retención de datos (0 = infinito)
}

const defaultSettings: AppSettings = {
  // Fiscalidad
  withholdingTaxRate: 19,
  capitalGainsTaxRate: 19,

  // Economía
  inflationRate: 2.0,
  emergencyFundMonths: 6,
  defaultEcbRate: 2.50,

  // Visualización
  currencyDecimals: 0,
  dateFormat: "dd/mm/yyyy",
  theme: "system",
  compactMode: false,

  // Perfil personal
  userName: "",
  monthlyIncome: 0,
  savingsRateTarget: 20,
  riskProfile: "moderado",

  // Notificaciones y alertas
  spendingAlertThreshold: 80,
  subscriptionRenewalDays: 7,
  budgetWarningPercent: 75,
  enableNotifications: true,

  // Metas de ahorro
  selectedGoalId: "",
  autoAllocateSavings: false,

  // Privacidad
  dataRetentionDays: 0,
};

/** Genera un ID único simple */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/** Estado de la aplicación financiera */
interface FinanceState {
  // ---- Datos principales ----
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  currentSavingsPlan: SavingsPlan | null;

  // ---- Presupuestos ----
  budgets: Budget[];

  // ---- Deudas ----
  debts: Debt[];

  // ---- Suscripciones ----
  subscriptions: Subscription[];

  // ---- Configuración ----
  settings: AppSettings;

  // ---- UI State ----
  isFormOpen: boolean;
  isSavingsPlanOpen: boolean;
  activeTab: string;
  selectedMonth: string;

  // ---- Acciones de Transacciones ----
  addTransaction: (tx: Omit<Transaction, "id" | "createdAt">) => void;
  deleteTransaction: (id: string) => void;

  // ---- Acciones de Metas de Ahorro ----
  addSavingsGoal: (goal: Omit<SavingsGoal, "id" | "createdAt">) => void;
  updateSavingsGoal: (id: string, amount: number) => void;
  editSavingsGoal: (id: string, updates: Partial<Omit<SavingsGoal, "id" | "createdAt">>) => void;
  deleteSavingsGoal: (id: string) => void;

  // ---- Acciones de IA ----
  generatePlan: (goalId: string) => void;

  // ---- Acciones de Presupuestos ----
  addBudget: (budget: Omit<Budget, "id" | "createdAt">) => void;
  updateBudget: (id: string, monthlyLimit: number) => void;
  deleteBudget: (id: string) => void;

  // ---- Acciones de Deudas ----
  addDebt: (debt: Omit<Debt, "id" | "createdAt">) => void;
  updateDebt: (id: string, updates: Partial<Omit<Debt, "id" | "createdAt">>) => void;
  deleteDebt: (id: string) => void;

  // ---- Acciones de Suscripciones ----
  addSubscription: (sub: Omit<Subscription, "id" | "createdAt">) => void;
  updateSubscription: (id: string, updates: Partial<Omit<Subscription, "id" | "createdAt">>) => void;
  deleteSubscription: (id: string) => void;

  // ---- Acciones de Configuración ----
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetSettings: () => void;
  resetAllData: () => void;
  exportData: () => string;
  importData: (json: string) => boolean;

  // ---- Acciones de UI ----
  setFormOpen: (open: boolean) => void;
  setSavingsPlanOpen: (open: boolean) => void;
  setActiveTab: (tab: string) => void;
  setSelectedMonth: (month: string) => void;
}

/** Obtiene el mes actual en formato "YYYY-MM" */
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
  // ---- Estado inicial ----
  transactions: mockTransactions,
  savingsGoals: mockSavingsGoals,
  currentSavingsPlan: null,
  budgets: mockBudgets,
  debts: mockDebts,
  subscriptions: mockSubscriptions,

  settings: { ...defaultSettings },

  isFormOpen: false,
  isSavingsPlanOpen: false,
  activeTab: "dashboard",
  selectedMonth: "2025-01", // safe default, updated on client mount

  // ---- Transacciones ----
  addTransaction: (tx) =>
    set((state) => ({
      transactions: [
        {
          ...tx,
          id: generateId(),
          createdAt: new Date().toISOString(),
        },
        ...state.transactions,
      ],
    })),

  deleteTransaction: (id) =>
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    })),

  // ---- Metas de Ahorro ----
  addSavingsGoal: (goal) =>
    set((state) => ({
      savingsGoals: [
        ...state.savingsGoals,
        {
          ...goal,
          id: generateId(),
          createdAt: new Date().toISOString(),
        },
      ],
    })),

  updateSavingsGoal: (id, amount) =>
    set((state) => ({
      savingsGoals: state.savingsGoals.map((g) =>
        g.id === id ? { ...g, currentAmount: g.currentAmount + amount } : g
      ),
    })),

  editSavingsGoal: (id, updates) =>
    set((state) => ({
      savingsGoals: state.savingsGoals.map((g) =>
        g.id === id ? { ...g, ...updates } : g
      ),
    })),

  deleteSavingsGoal: (id) =>
    set((state) => ({
      savingsGoals: state.savingsGoals.filter((g) => g.id !== id),
    })),

  // ---- IA: Generar Plan de Ahorro ----
  generatePlan: (goalId) => {
    const { transactions, savingsGoals } = get();
    const goal = savingsGoals.find((g) => g.id === goalId);
    if (!goal) return;

    const plan = generateSavingsPlan(transactions, {
      name: goal.name,
      targetAmount: goal.targetAmount - goal.currentAmount,
      currentSaved: goal.currentAmount,
      deadline: goal.deadline,
    });

    set({ currentSavingsPlan: plan, isSavingsPlanOpen: true });
  },

  // ---- Presupuestos ----
  addBudget: (budget) =>
    set((state) => ({
      budgets: [
        ...state.budgets.filter((b) => b.category !== budget.category),
        {
          ...budget,
          id: generateId(),
          createdAt: new Date().toISOString(),
        },
      ],
    })),

  updateBudget: (id, monthlyLimit) =>
    set((state) => ({
      budgets: state.budgets.map((b) =>
        b.id === id ? { ...b, monthlyLimit } : b
      ),
    })),

  deleteBudget: (id) =>
    set((state) => ({
      budgets: state.budgets.filter((b) => b.id !== id),
    })),

  // ---- Deudas ----
  addDebt: (debt) =>
    set((state) => ({
      debts: [
        ...state.debts,
        {
          ...debt,
          id: generateId(),
          createdAt: new Date().toISOString(),
        },
      ],
    })),

  updateDebt: (id, updates) =>
    set((state) => ({
      debts: state.debts.map((d) =>
        d.id === id ? { ...d, ...updates } : d
      ),
    })),

  deleteDebt: (id) =>
    set((state) => ({
      debts: state.debts.filter((d) => d.id !== id),
    })),

  // ---- Suscripciones ----
  addSubscription: (sub) =>
    set((state) => ({
      subscriptions: [
        ...state.subscriptions,
        {
          ...sub,
          id: generateId(),
          createdAt: new Date().toISOString(),
        },
      ],
    })),

  updateSubscription: (id, updates) =>
    set((state) => ({
      subscriptions: state.subscriptions.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    })),

  deleteSubscription: (id) =>
    set((state) => ({
      subscriptions: state.subscriptions.filter((s) => s.id !== id),
    })),

  // ---- Configuración ----
  updateSettings: (updates) =>
    set((state) => ({
      settings: { ...state.settings, ...updates },
    })),

  resetSettings: () => set({ settings: { ...defaultSettings } }),

  resetAllData: () =>
    set({
      transactions: mockTransactions,
      savingsGoals: mockSavingsGoals,
      currentSavingsPlan: null,
      budgets: mockBudgets,
      debts: mockDebts,
      subscriptions: mockSubscriptions,
      settings: { ...defaultSettings },
    }),

  exportData: () => {
    const state = get();
    const data = {
      transactions: state.transactions,
      savingsGoals: state.savingsGoals,
      budgets: state.budgets,
      debts: state.debts,
      subscriptions: state.subscriptions,
      settings: state.settings,
      exportedAt: new Date().toISOString(),
      version: "1.0.0",
    };
    return JSON.stringify(data, null, 2);
  },

  importData: (json) => {
    try {
      const data = JSON.parse(json);
      if (!data.transactions || !Array.isArray(data.transactions)) return false;
      set({
        transactions: data.transactions,
        savingsGoals: Array.isArray(data.savingsGoals) ? data.savingsGoals : mockSavingsGoals,
        budgets: Array.isArray(data.budgets) ? data.budgets : mockBudgets,
        debts: Array.isArray(data.debts) ? data.debts : mockDebts,
        subscriptions: Array.isArray(data.subscriptions) ? data.subscriptions : mockSubscriptions,
        settings: data.settings ? { ...defaultSettings, ...data.settings } : { ...defaultSettings },
        currentSavingsPlan: null,
      });
      return true;
    } catch {
      return false;
    }
  },

  // ---- UI ----
  setFormOpen: (open) => set({ isFormOpen: open }),
  setSavingsPlanOpen: (open) => set({ isSavingsPlanOpen: open }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedMonth: (month) => set({ selectedMonth: month }),
}),
{
  name: "fintrack-storage",
  version: 1,
  migrate: (persistedState: unknown, version: number) => {
    // If no version or older version, merge with defaults to ensure
    // all fields exist (handles schema changes gracefully)
    if (version === 0 || !version) {
      const state = persistedState as Record<string, unknown>;
      return {
        ...state,
        settings: { ...defaultSettings, ...(state.settings as Partial<AppSettings>) },
      };
    }
    return persistedState;
  },
  storage: createJSONStorage(() => {
    // SSR-safe: return noop during SSR
    if (typeof window === "undefined") {
      return {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      };
    }
    return localStorage;
  }),
  partialize: (state) => ({
    transactions: state.transactions,
    savingsGoals: state.savingsGoals,
    budgets: state.budgets,
    debts: state.debts,
    subscriptions: state.subscriptions,
    settings: state.settings,
    activeTab: state.activeTab,
    selectedMonth: state.selectedMonth,
  }),
}
  )
);
