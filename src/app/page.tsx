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

import { useState, useEffect } from "react";
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
import { PWAInstallPrompt } from "@/components/pwa/install-prompt";
import { OfflineIndicator } from "@/components/pwa/offline-indicator";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { useFinanceStore } from "@/store/finance-store";
import { cn } from "@/lib/utils";

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
  const { settings } = useFinanceStore();
  // Only render after client-side mount to prevent hydration mismatches
  // The entire app depends on localStorage (Zustand persist), so SSR is meaningless
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-sm text-muted-foreground">Cargando FinTrack...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex bg-background overflow-hidden", settings.compactMode && "compact-mode")} style={{ height: '100dvh' }}>
      {/* Sidebar (desktop only, mobile uses bottom nav) */}
      <Sidebar />

      {/* Contenido principal */}
      <main className="flex-1 min-w-0 min-h-0 overflow-y-auto overscroll-contain">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 safe-area-pt pb-safe-mobile">
          <ActiveTab />
        </div>
      </main>

      {/* Mobile bottom tab bar */}
      <MobileBottomNav />

      {/* Dialogs globales */}
      <TransactionForm />
      <SavingsPlanDisplay />

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* Offline indicator */}
      <OfflineIndicator />
    </div>
  );
}
