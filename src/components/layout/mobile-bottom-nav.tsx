/**
 * ============================================
 * Mobile Bottom Navigation Bar
 * ============================================
 * Fixed bottom tab bar for mobile (iOS/Android).
 * Shows 5 key sections: Dashboard, Transactions,
 * Budgets, Goals, and More (opens Sheet).
 * Only visible on mobile (below md breakpoint).
 * Respects iOS safe-area-inset-bottom.
 */

"use client";

import { useFinanceStore } from "@/store/finance-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { navSections } from "@/components/layout/sidebar";
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  Target,
  Menu,
  X,
  Wallet,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Main tabs shown in bottom bar (with their correct icons)
const mainTabs = [
  { id: "dashboard", label: "Inicio", icon: LayoutDashboard },
  { id: "transactions", label: "Movimientos", icon: ArrowLeftRight },
  { id: "budgets", label: "Presupuesto", icon: PieChart },
  { id: "goals", label: "Metas", icon: Target },
];

export function MobileBottomNav() {
  const { activeTab, setActiveTab } = useFinanceStore();
  const hydrated = useHydrated();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // Use empty string before hydration to avoid SSR/client mismatch
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
    setSheetOpen(false);
  };

  return (
    <>
      {/* Mobile header - minimal, just logo and title */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center border-b bg-card/95 backdrop-blur-lg px-4" style={{ paddingTop: 'env(safe-area-inset-top, 0px)', height: 'max(3rem, calc(env(safe-area-inset-top, 0px) + 3rem))' }}>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
            <Wallet className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-bold tracking-tight">FinTrack</span>
        </div>
      </div>

      {/* Bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-card/95 backdrop-blur-lg" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex items-center justify-around h-14">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 h-full transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground active:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium leading-none">{tab.label}</span>
              </button>
            );
          })}

          {/* More button - opens sidebar Sheet */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <button
                className="flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 h-full transition-colors text-muted-foreground active:text-foreground"
              >
                <Menu className="h-5 w-5" />
                <span className="text-[10px] font-medium leading-none">Más</span>
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 h-full overflow-hidden">
              <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
              <div className="h-full flex flex-col min-h-0 overflow-hidden" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                      <Wallet className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold tracking-tight">FinTrack</h2>
                      <p className="text-[10px] text-muted-foreground leading-none">Finanzas Personales</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 shrink-0"
                    onClick={() => setSheetOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Separator className="my-2" />
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
                            {section.items.map((item) => {
                              const Icon = item.icon;
                              return (
                                <button
                                  key={item.id}
                                  onClick={() => handleNavClick(item.id)}
                                  className={cn(
                                    "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all min-h-[44px]",
                                    currentTab === item.id
                                      ? "bg-primary text-primary-foreground shadow-sm"
                                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                  )}
                                >
                                  <Icon className="h-4 w-4 shrink-0" />
                                  <span>{item.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </nav>
                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  );
}
