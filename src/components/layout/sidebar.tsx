/**
 * ============================================
 * Sidebar - Navegación Principal (Desktop)
 * ============================================
 * Barra lateral con navegación entre secciones.
 * Solo visible en desktop (md+).
 * En móvil se usa MobileBottomNav en su lugar.
 */

"use client";

import { cn } from "@/lib/utils";
import { useFinanceStore } from "@/store/finance-store";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  Brain,
  TrendingUp,
  Wallet,
  ShieldAlert,
  Landmark,
  BarChart3,
  DollarSign,
  PieChart,
  CreditCard,
  Repeat,
  Bell,
  CalendarDays,
  Calculator,
  ChevronDown,
  ChevronRight,
  Settings2,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

export const navSections = [
  {
    title: "General",
    items: [
      { id: "dashboard", label: "Panel Principal", icon: LayoutDashboard },
      { id: "transactions", label: "Transacciones", icon: ArrowLeftRight },
    ],
  },
  {
    title: "Planificación",
    items: [
      { id: "budgets", label: "Presupuestos", icon: PieChart },
      { id: "goals", label: "Metas de Ahorro", icon: Target },
      { id: "debts", label: "Deudas", icon: CreditCard },
      { id: "subscriptions", label: "Suscripciones", icon: Repeat },
    ],
  },
  {
    title: "Herramientas",
    items: [
      { id: "investments", label: "Inversiones", icon: BarChart3 },
      { id: "fixed-term", label: "Plazo Fijo", icon: Landmark },
      { id: "irpf", label: "Estimador IRPF", icon: Calculator },
      { id: "calendar", label: "Calendario", icon: CalendarDays },
    ],
  },
  {
    title: "IA & Alertas",
    items: [
      { id: "alerts", label: "Alertas", icon: Bell },
      { id: "emergency", label: "Gastos Imprevistos", icon: ShieldAlert },
      { id: "extra-income", label: "Ingreso Extra IA", icon: DollarSign },
      { id: "ai-advisor", label: "Asesor IA", icon: Brain },
    ],
  },
  {
    title: "Sistema",
    items: [
      { id: "settings", label: "Configuración", icon: Settings2 },
    ],
  },
];

function NavItem({
  id,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 min-h-[44px]",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </button>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
        <Wallet className="h-5 w-5 text-primary-foreground" />
      </div>
      <div>
        <h1 className="text-base font-bold tracking-tight">FinTrack</h1>
        <p className="text-[10px] text-muted-foreground leading-none">
          Finanzas Personales
        </p>
      </div>
    </div>
  );
}

export function NavContent({ onNavigate }: { onNavigate?: () => void } = {}) {
  const { activeTab, setActiveTab } = useFinanceStore();
  const hydrated = useHydrated();
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const currentTab = hydrated ? activeTab : "";

  const toggleSection = (title: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    onNavigate?.();
  };

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      <div className="shrink-0">
        <Logo />
        <Separator className="my-3" />
      </div>
      <ScrollArea className="flex-1 min-h-0 overflow-y-auto px-2">
        <nav className="flex flex-col gap-1 pb-4">
          {navSections.map((section) => (
            <div key={section.title}>
              <button
                onClick={() => toggleSection(section.title)}
                className="flex items-center justify-between w-full px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 hover:text-muted-foreground min-h-[36px]"
              >
                {section.title}
                {collapsedSections.has(section.title) ? (
                  <ChevronRight className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
              {!collapsedSections.has(section.title) && (
                <div className="flex flex-col gap-0.5 mb-2">
                  {section.items.map((item) => (
                    <NavItem
                      key={item.id}
                      id={item.id}
                      label={item.label}
                      icon={item.icon}
                      active={currentTab === item.id}
                      onClick={() => handleNavClick(item.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </ScrollArea>
      <div className="shrink-0 px-2 pb-4">
        <Separator className="mb-3" />
        <div className="rounded-lg bg-muted/50 p-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-semibold">FinTrack PWA</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Instala la app en iOS, Android o PC para acceso rápido desde tu pantalla de inicio.
          </p>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <>
      {/* Desktop sidebar only - mobile uses MobileBottomNav */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card overflow-hidden shrink-0">
        <div className="flex flex-col h-full min-h-0 overflow-hidden">
          <NavContent />
        </div>
      </aside>
    </>
  );
}
