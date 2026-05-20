/**
 * ============================================
 * Dashboard - Panel Principal
 * ============================================
 * Vista principal con balance, gráficas y actividad reciente.
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
import { ArrowUpRight, ArrowDownRight, Repeat, CalendarDays, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function Dashboard() {
  const { transactions, selectedMonth, setSelectedMonth, deleteTransaction } = useFinanceStore();
  const { toast } = useToast();
  const availableMonths = useMemo(() => getAvailableMonths(transactions), [transactions]);

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

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

      {/* Distribución por categoría y actividad reciente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CategoryBreakdownChart />
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
    </div>
  );
}
