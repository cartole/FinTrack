/**
 * ============================================
 * Página Principal - FinTrack MVP
 * ============================================
 * Aplicación de finanzas personales con:
 * - Dashboard con balance y gráficas
 * - Gestión de transacciones
 * - Metas de ahorro
 * - Asesor IA para planes de ahorro
 */

"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Dashboard } from "@/components/finance/dashboard";
import { TransactionList } from "@/components/finance/transaction-list";
import { SavingsGoals } from "@/components/finance/savings-goals";
import { AIAdvisor } from "@/components/finance/ai-advisor";
import { EmergencyAdvisor } from "@/components/finance/emergency-advisor";
import { TransactionForm } from "@/components/finance/transaction-form";
import { SavingsPlanDisplay } from "@/components/finance/savings-plan-display";
import { useFinanceStore } from "@/store/finance-store";

function ActiveTab() {
  const { activeTab } = useFinanceStore();

  switch (activeTab) {
    case "dashboard":
      return <Dashboard />;
    case "transactions":
      return <TransactionList />;
    case "goals":
      return <SavingsGoals />;
    case "emergency":
      return <EmergencyAdvisor />;
    case "ai-advisor":
      return <AIAdvisor />;
    default:
      return <Dashboard />;
  }
}

export default function Home() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Contenido principal */}
      <main className="flex-1 min-w-0">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 pt-16 md:pt-6">
          <ActiveTab />
        </div>
      </main>

      {/* Dialogs globales */}
      <TransactionForm />
      <SavingsPlanDisplay />
    </div>
  );
}
