/**
 * ============================================
 * Sidebar - Navegación Principal
 * ============================================
 * Barra lateral con navegación entre secciones.
 * Responsive: colapsa en móvil con Sheet.
 */

"use client";

import { cn } from "@/lib/utils";
import { useFinanceStore } from "@/store/finance-store";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  Brain,
  Menu,
  TrendingUp,
  Wallet,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { id: "dashboard", label: "Panel Principal", icon: LayoutDashboard },
  { id: "transactions", label: "Transacciones", icon: ArrowLeftRight },
  { id: "goals", label: "Metas de Ahorro", icon: Target },
  { id: "emergency", label: "Gastos Imprevistos", icon: ShieldAlert },
  { id: "ai-advisor", label: "Asesor IA", icon: Brain },
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
        "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
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

function NavContent() {
  const { activeTab, setActiveTab } = useFinanceStore();

  return (
    <div className="flex flex-col h-full">
      <Logo />
      <Separator className="my-3" />
      <nav className="flex flex-col gap-1 px-2">
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            id={item.id}
            label={item.label}
            icon={item.icon}
            active={activeTab === item.id}
            onClick={() => setActiveTab(item.id)}
          />
        ))}
      </nav>
      <div className="mt-auto px-2 pb-4">
        <Separator className="mb-3" />
        <div className="rounded-lg bg-muted/50 p-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-semibold">Pro Tip</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            ¿Gasto imprevisto? Usa Gastos Imprevistos para saber cómo actuar y recuperar tu estabilidad.
          </p>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card h-screen sticky top-0">
        <NavContent />
      </aside>

      {/* Mobile sidebar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center gap-2 border-b bg-card px-4 py-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
            <NavContent />
          </SheetContent>
        </Sheet>
        <Logo />
      </div>
    </>
  );
}
