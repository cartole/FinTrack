/**
 * ============================================
 * Dashboard - Panel Principal
 * ============================================
 * Vista principal con balance, gráficas, meta de ahorro y actividad reciente.
 */

"use client";

import { useMemo } from "react";
import { useFinanceStore } from "@/store/finance-store";
import { BalanceCards } from "./balance-cards";
import { TrendChart, ProjectionChart, CategoryBreakdownChart } from "./charts";
import { TransactionForm, AddTransactionButton } from "./transaction-form";
import { SavingsPlanDisplay } from "./savings-plan-display";
import {
  formatCurrency,
  formatDate,
  getCurrentMonthTransactions,
  getAvailableMonths,
  getMonthFromISO,
} from "@/lib/finance-utils";
import { CATEGORY_CONFIG } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpRight, ArrowDownRight, Repeat, CalendarDays, Trash2, Target, Rocket, Plane, Laptop } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

/** Icono según nombre de la meta */
function getGoalIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("viaje") || lower.includes("japón") || lower.includes("vacaciones")) return Plane;
  if (lower.includes("macbook") || lower.includes("laptop") || lower.includes("ordenador")) return Laptop;
  return Rocket;
}

export function Dashboard() {
  const { transactions, savingsGoals, selectedMonth, setSelectedMonth, deleteTransaction, setActiveTab, settings, updateSettings } = useFinanceStore();
  const { toast } = useToast();
  const allMonths = useMemo(() => getAvailableMonths(transactions), [transactions]);
  // Limit months shown in dropdown to last 12 + current
  const availableMonths = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const months = allMonths.filter(m => m <= currentMonth);
    return months.slice(-12);
  }, [allMonths]);
  const selectedGoalId = settings.selectedGoalId;

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  const selectedGoal = useMemo(
    () => savingsGoals.find((g) => g.id === selectedGoalId) ?? savingsGoals[0] ?? null,
    [savingsGoals, selectedGoalId]
  );

  const handleSelectGoal = (goalId: string) => {
    updateSettings({ selectedGoalId: goalId });
  };

  const handleDelete = (id: string, desc: string) => {
    deleteTransaction(id);
    toast({
      title: "Transacción eliminada",
      description: desc,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header con selector de mes y botón de añadir */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Panel Principal</h2>
          <p className="text-sm text-muted-foreground">
            Resumen de tus finanzas personales
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <CalendarDays className="h-3.5 w-3.5 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map((month) => (
                <SelectItem key={month} value={month}>
                  {new Date(month + "-01").toLocaleDateString("es-ES", {
                    month: "long",
                    year: "numeric",
                  })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <AddTransactionButton />
        </div>
      </div>

      {/* Tarjetas de balance */}
      <BalanceCards />

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TrendChart />
        <ProjectionChart />
      </div>

      {/* Distribución por categoría y meta de ahorro */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CategoryBreakdownChart />

        {/* Meta de ahorro activa */}
        {selectedGoal && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Mi Meta de Ahorro
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => setActiveTab("goals")}
                >
                  Ver todas
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  {(() => {
                    const Icon = getGoalIcon(selectedGoal.name);
                    return <Icon className="h-5 w-5 text-primary" />;
                  })()}
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-sm font-semibold truncate">{selectedGoal.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {Math.max(0, Math.ceil((new Date(selectedGoal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} días restantes
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{formatCurrency(selectedGoal.currentAmount)}</span>
                  <span className="font-semibold">{formatCurrency(selectedGoal.targetAmount)}</span>
                </div>
                <Progress
                  value={Math.min(100, Math.round((selectedGoal.currentAmount / selectedGoal.targetAmount) * 100))}
                  className="h-2.5"
                />
                <div className="flex justify-between">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px]",
                      selectedGoal.currentAmount / selectedGoal.targetAmount >= 0.75
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50"
                        : selectedGoal.currentAmount / selectedGoal.targetAmount >= 0.4
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50"
                          : "bg-rose-100 text-rose-700 dark:bg-rose-900/50"
                    )}
                  >
                    {Math.round((selectedGoal.currentAmount / selectedGoal.targetAmount) * 100)}% completado
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    Faltan {formatCurrency(selectedGoal.targetAmount - selectedGoal.currentAmount)}
                  </span>
                </div>
              </div>

              {/* Selector de meta */}
              {savingsGoals.length > 1 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Cambiar meta activa</p>
                  <div className="flex flex-wrap gap-1.5">
                    {savingsGoals.map((goal) => (
                      <Button
                        key={goal.id}
                        variant={selectedGoal.id === goal.id ? "default" : "outline"}
                        size="sm"
                        className="text-[10px] h-7 gap-1.5 max-w-full"
                        onClick={() => handleSelectGoal(goal.id)}
                      >
                        {(() => {
                          const Icon = getGoalIcon(goal.name);
                          return <Icon className="h-3 w-3 shrink-0" />;
                        })()}
                        <span className="truncate max-w-[120px] sm:max-w-[200px]">{goal.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!selectedGoal && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Meta de Ahorro
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Target className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">Sin meta de ahorro</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 text-xs"
                onClick={() => setActiveTab("goals")}
              >
                Crear meta
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Actividad reciente */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50 transition-colors"
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    tx.type === "ingreso"
                      ? "bg-emerald-100 dark:bg-emerald-950/40"
                      : "bg-rose-100 dark:bg-rose-950/40"
                  )}
                >
                  {tx.type === "ingreso" ? (
                    <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5 text-rose-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{tx.description}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge
                      variant="secondary"
                      className="text-[9px] px-1 py-0 h-3.5"
                      style={{
                        backgroundColor: `${CATEGORY_CONFIG[tx.category]?.color}20`,
                        color: CATEGORY_CONFIG[tx.category]?.color,
                      }}
                    >
                      {CATEGORY_CONFIG[tx.category]?.label}
                    </Badge>
                    {tx.recurrence === "recurrente" && (
                      <Repeat className="h-2.5 w-2.5 text-muted-foreground" />
                    )}
                    <span className="text-[9px] text-muted-foreground">
                      {formatDate(tx.date)}
                    </span>
                  </div>
                </div>
                <span
                  className={cn(
                    "text-xs font-semibold shrink-0",
                    tx.type === "ingreso" ? "text-emerald-600" : "text-rose-600"
                  )}
                >
                  {tx.type === "ingreso" ? "+" : "-"}
                  {formatCurrency(tx.amount)}
                </span>
                {/* Botón eliminar */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar transacción?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Se eliminará &quot;{tx.description}&quot; ({formatCurrency(tx.amount)}).
                        Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(tx.id, tx.description)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
