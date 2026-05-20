/**
 * ============================================
 * Store de Finanzas - Zustand State Management
 * ============================================
 * Estado global de la aplicación con Zustand.
 * Gestiona transacciones, metas, presupuestos, deudas, suscripciones.
 */

import { create } from "zustand";
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

export const useFinanceStore = create<FinanceState>((set, get) => ({
  // ---- Estado inicial ----
  transactions: mockTransactions,
  savingsGoals: mockSavingsGoals,
  currentSavingsPlan: null,
  budgets: mockBudgets,
  debts: mockDebts,
  subscriptions: mockSubscriptions,

  isFormOpen: false,
  isSavingsPlanOpen: false,
  activeTab: "dashboard",
  selectedMonth: getCurrentMonth(),

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

  // ---- UI ----
  setFormOpen: (open) => set({ isFormOpen: open }),
  setSavingsPlanOpen: (open) => set({ isSavingsPlanOpen: open }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedMonth: (month) => set({ selectedMonth: month }),
}));
