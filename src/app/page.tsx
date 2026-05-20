/**
 * ============================================
 * Página Principal - FinTrack MVP
 * ============================================
 * Aplicación de finanzas personales con:
 * - Dashboard con balance y gráficas
 * - Gestión de transacciones
 * - Metas de ahorro
 * - Presupuestos mensuales
 * - Gestor de deudas
 * - Rastreador de suscripciones
 * - Calendario de pagos
 * - Alertas inteligentes
 * - Estimador IRPF
 * - Asesor IA para planes de ahorro
 */

"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Dashboard } from "@/components/finance/dashboard";
import { TransactionList } from "@/components/finance/transaction-list";
import { SavingsGoals } from "@/components/finance/savings-goals";
import { AIAdvisor } from "@/components/finance/ai-advisor";
import { EmergencyAdvisor } from "@/components/finance/emergency-advisor";
import { InvestmentCalculator } from "@/components/finance/investment-calculator";
import { FixedTermCalculator } from "@/components/finance/fixed-term-calculator";
import { ExtraIncomeAdvisor } from "@/components/finance/extra-income-advisor";
import { BudgetPlanner } from "@/components/finance/budget-planner";
import { DebtManager } from "@/components/finance/debt-manager";
import { SubscriptionTracker } from "@/components/finance/subscription-tracker";
import { SmartAlerts } from "@/components/finance/smart-alerts";
import { PaymentCalendar } from "@/components/finance/payment-calendar";
import { IRPFCalculator } from "@/components/finance/irpf-calculator";
import { Settings } from "@/components/finance/settings";
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
    case "budgets":
      return <BudgetPlanner />;
    case "debts":
      return <DebtManager />;
    case "subscriptions":
      return <SubscriptionTracker />;
    case "emergency":
      return <EmergencyAdvisor />;
    case "investments":
      return <InvestmentCalculator />;
    case "fixed-term":
      return <FixedTermCalculator />;
    case "irpf":
      return <IRPFCalculator />;
    case "calendar":
      return <PaymentCalendar />;
    case "alerts":
      return <SmartAlerts />;
    case "extra-income":
      return <ExtraIncomeAdvisor />;
    case "ai-advisor":
      return <AIAdvisor />;
    case "settings":
      return <Settings />;
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
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 pb-24 safe-area-pt">
          <ActiveTab />
        </div>
      </main>

      {/* Dialogs globales */}
      <TransactionForm />
      <SavingsPlanDisplay />
    </div>
  );
}
