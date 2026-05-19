/**
 * ============================================
 * Store de Finanzas - Zustand State Management
 * ============================================
 * Estado global de la aplicación con Zustand.
 * Gestiona transacciones, metas de ahorro y UI.
 */

import { create } from "zustand";
import { Transaction, SavingsGoal, SavingsPlan } from "@/lib/types";
import { mockTransactions, mockSavingsGoals } from "@/lib/mock-data";
import { generateSavingsPlan } from "@/lib/savings-planner";

/** Genera un ID único simple */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/** Estado de la aplicación financiera */
interface FinanceState {
  // ---- Datos ----
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  currentSavingsPlan: SavingsPlan | null;

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

  // ---- UI ----
  setFormOpen: (open) => set({ isFormOpen: open }),
  setSavingsPlanOpen: (open) => set({ isSavingsPlanOpen: open }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedMonth: (month) => set({ selectedMonth: month }),
}));
