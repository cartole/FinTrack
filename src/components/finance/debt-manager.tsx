/**
 * ============================================
 * Gestor de Deudas - Componente UI
 * ============================================
 *
 * "use client" component with:
 * - Summary cards (total debt, min payment, estimated interest, months to freedom)
 * - Strategy selector (Bola de Nieve vs Avalancha)
 * - Extra payment input
 * - Strategy comparison
 * - Debt list with progress bars
 * - Add/edit/delete debt dialogs
 * - Debt freedom timeline
 *
 * All text in Spanish, currency in EUR.
 */

"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFinanceStore } from "@/store/finance-store";
import {
  DEBT_TYPE_CONFIG,
  type DebtType,
  type DebtStrategy,
} from "@/lib/types";
import { formatCurrency } from "@/lib/finance-utils";
import {
  calculateDebtPayoff,
  compareStrategies,
  type StrategyComparison,
} from "@/lib/debt-manager";
import {
  TrendingDown,
  Plus,
  Trash2,
  Pencil,
  Snowflake,
  Mountain,
  Calendar,
  Wallet,
  Percent,
  Clock,
  ChevronRight,
  Trophy,
  AlertCircle,
  Loader2,
} from "lucide-react";
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
import { cn } from "@/lib/utils";

/** Form state for adding/editing a debt */
interface DebtFormData {
  name: string;
  type: DebtType;
  totalAmount: string;
  currentBalance: string;
  interestRate: string;
  minimumPayment: string;
  dueDay: string;
  startDate: string;
}

const emptyForm: DebtFormData = {
  name: "",
  type: "prestamo_personal",
  totalAmount: "",
  currentBalance: "",
  interestRate: "",
  minimumPayment: "",
  dueDay: "1",
  startDate: new Date().toISOString().split("T")[0],
};

export function DebtManager() {
  const { debts, addDebt, updateDebt, deleteDebt } = useFinanceStore();

  // Strategy state
  const [strategy, setStrategy] = useState<DebtStrategy>("avalancha");
  const [extraAmount, setExtraAmount] = useState("100");
  const [showComparison, setShowComparison] = useState(false);

  // Dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingDebtId, setEditingDebtId] = useState<string | null>(null);
  const [formData, setFormData] = useState<DebtFormData>(emptyForm);

  // Computed plans
  const extra = parseFloat(extraAmount) || 0;

  const comparison: StrategyComparison = useMemo(
    () => compareStrategies(debts, extra),
    [debts, extra]
  );

  const activePlan =
    strategy === "bola_nieve" ? comparison.snowball : comparison.avalanche;

  // Summary calculations
  const totalDebt = debts.reduce((s, d) => s + d.currentBalance, 0);
  const totalMinimumPayment = debts.reduce((s, d) => s + d.minimumPayment, 0);
  const totalInterest = activePlan.totalInterest;
  const monthsToFreedom = activePlan.totalMonthsToFreedom;

  // Handlers
  const handleOpenAdd = () => {
    setFormData(emptyForm);
    setEditingDebtId(null);
    setIsAddDialogOpen(true);
  };

  const handleOpenEdit = (debtId: string) => {
    const debt = debts.find((d) => d.id === debtId);
    if (!debt) return;
    setFormData({
      name: debt.name,
      type: debt.type,
      totalAmount: String(debt.totalAmount),
      currentBalance: String(debt.currentBalance),
      interestRate: String(debt.interestRate),
      minimumPayment: String(debt.minimumPayment),
      dueDay: String(debt.dueDay),
      startDate: debt.startDate.split("T")[0],
    });
    setEditingDebtId(debtId);
    setIsAddDialogOpen(true);
  };

  const handleSaveDebt = () => {
    const data = {
      name: formData.name,
      type: formData.type,
      totalAmount: parseFloat(formData.totalAmount) || 0,
      currentBalance: parseFloat(formData.currentBalance) || 0,
      interestRate: parseFloat(formData.interestRate) || 0,
      minimumPayment: parseFloat(formData.minimumPayment) || 0,
      dueDay: parseInt(formData.dueDay) || 1,
      startDate: new Date(formData.startDate).toISOString(),
    };

    if (editingDebtId) {
      updateDebt(editingDebtId, data);
    } else {
      addDebt(data);
    }

    setIsAddDialogOpen(false);
    setFormData(emptyForm);
    setEditingDebtId(null);
  };

  const handleDeleteDebt = (id: string) => {
    deleteDebt(id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10">
          <TrendingDown className="h-6 w-6 text-rose-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Gestor de Deudas</h2>
          <p className="text-sm text-muted-foreground">
            Planifica tu salida de deudas con la mejor estrategia
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <Wallet className="mx-auto mb-1.5 h-5 w-5 text-rose-500" />
            <p className="text-lg font-bold whitespace-nowrap">{formatCurrency(totalDebt)}</p>
            <p className="text-[10px] text-muted-foreground">Total deuda</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <Clock className="mx-auto mb-1.5 h-5 w-5 text-amber-500" />
            <p className="text-lg font-bold whitespace-nowrap">
              {formatCurrency(totalMinimumPayment)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Pago mínimo total
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <Percent className="mx-auto mb-1.5 h-5 w-5 text-orange-500" />
            <p className="text-lg font-bold whitespace-nowrap">{formatCurrency(totalInterest)}</p>
            <p className="text-[10px] text-muted-foreground">
              Intereses totales est.
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <Trophy className="mx-auto mb-1.5 h-5 w-5 text-emerald-500" />
            <p className="text-lg font-bold whitespace-nowrap">{monthsToFreedom} meses</p>
            <p className="text-[10px] text-muted-foreground">
              Para libertad
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Strategy Selector + Extra Payment */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Mountain className="h-4 w-4 text-primary" />
            Estrategia de Pago
          </CardTitle>
          <CardDescription className="text-xs">
            Elige cómo atacar tus deudas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setStrategy("bola_nieve")}
              className={cn(
                "flex flex-col items-start gap-1.5 rounded-xl border-2 p-4 text-left transition-all",
                strategy === "bola_nieve"
                  ? "border-primary bg-primary/5"
                  : "border-muted hover:border-muted-foreground/30"
              )}
            >
              <div className="flex items-center gap-2">
                <Snowflake className="h-5 w-5 text-sky-500" />
                <span className="text-sm font-bold">Bola de Nieve</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Ataca primero la deuda <strong>más pequeña</strong>. Victorias
                rápidas que mantienen la motivación.
              </p>
            </button>
            <button
              onClick={() => setStrategy("avalancha")}
              className={cn(
                "flex flex-col items-start gap-1.5 rounded-xl border-2 p-4 text-left transition-all",
                strategy === "avalancha"
                  ? "border-primary bg-primary/5"
                  : "border-muted hover:border-muted-foreground/30"
              )}
            >
              <div className="flex items-center gap-2">
                <Mountain className="h-5 w-5 text-orange-500" />
                <span className="text-sm font-bold">Avalancha</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Ataca primero la deuda con <strong>mayor interés</strong>. Óptimo
                matemático, ahorras más a largo plazo.
              </p>
            </button>
          </div>

          {/* Extra payment input */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">
              ¿Cuánto EXTRA puedes pagar al mes? (además de los mínimos)
            </Label>
            <div className="relative">
              <Input
                type="number"
                min="0"
                step="50"
                value={extraAmount}
                onChange={(e) => setExtraAmount(e.target.value)}
                className="text-lg font-semibold pr-8"
                placeholder="100"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                €/mes
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Pago mensual total:{" "}
              <span className="font-semibold">
                {formatCurrency(totalMinimumPayment + extra)}
              </span>
            </p>
          </div>

          {/* Comparison toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowComparison(!showComparison)}
            className="w-full gap-2"
          >
            {showComparison ? "Ocultar" : "Ver"} comparación de estrategias
            <ChevronRight
              className={cn(
                "h-3.5 w-3.5 transition-transform",
                showComparison && "rotate-90"
              )}
            />
          </Button>

          {/* Comparison Card */}
          {showComparison && (
            <Card className="border-0 bg-muted/50 overflow-hidden">
              <CardContent className="p-4 space-y-4">
                <h3 className="text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5 text-primary" />
                  Comparativa Detallada de Estrategias
                </h3>

                {/* Tabla comparativa con overflow controlado */}
                <div className="rounded-lg border overflow-hidden overflow-x-auto">
                  <div className="min-w-[280px]">
                    {/* Header */}
                    <div className="grid grid-cols-3 gap-1 p-2 bg-muted/70 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <span />
                      <span className="text-center text-sky-700 dark:text-sky-300 whitespace-nowrap">Bola de Nieve</span>
                      <span className="text-center text-orange-700 dark:text-orange-300 whitespace-nowrap">Avalancha</span>
                    </div>
                    {/* Meses */}
                    <div className="grid grid-cols-3 gap-1 p-2 text-xs border-t items-center">
                      <span className="text-muted-foreground font-medium whitespace-nowrap">Meses</span>
                      <span className="text-center font-bold">{comparison.snowball.totalMonthsToFreedom}</span>
                      <span className="text-center font-bold">{comparison.avalanche.totalMonthsToFreedom}</span>
                    </div>
                    {/* Intereses */}
                    <div className="grid grid-cols-3 gap-1 p-2 text-xs border-t items-center">
                      <span className="text-muted-foreground font-medium whitespace-nowrap">Intereses</span>
                      <span className="text-center font-bold text-rose-600 whitespace-nowrap">{formatCurrency(comparison.snowball.totalInterest)}</span>
                      <span className="text-center font-bold text-rose-600 whitespace-nowrap">{formatCurrency(comparison.avalanche.totalInterest)}</span>
                    </div>
                    {/* Coste total */}
                    <div className="grid grid-cols-3 gap-1 p-2 text-xs border-t items-center bg-muted/30">
                      <span className="text-muted-foreground font-medium whitespace-nowrap">Coste total</span>
                      <span className="text-center font-bold whitespace-nowrap">{formatCurrency(comparison.snowball.totalDebt + comparison.snowball.totalInterest)}</span>
                      <span className="text-center font-bold whitespace-nowrap">{formatCurrency(comparison.avalanche.totalDebt + comparison.avalanche.totalInterest)}</span>
                    </div>
                    {/* Primera deuda liquidada */}
                    <div className="grid grid-cols-3 gap-1 p-2 text-xs border-t items-center min-w-0">
                      <span className="text-muted-foreground font-medium whitespace-nowrap">1ª deuda</span>
                      <span className="text-center truncate min-w-0">
                        {comparison.snowball.individualPlans.length > 0 && (
                          <>
                            <span className="font-semibold">{comparison.snowball.debtsOrder[0]?.name}</span>
                            <span className="text-muted-foreground ml-1">({comparison.snowball.individualPlans[0]?.monthsToPayoff} meses)</span>
                          </>
                        )}
                      </span>
                      <span className="text-center truncate min-w-0">
                        {comparison.avalanche.individualPlans.length > 0 && (
                          <>
                            <span className="font-semibold">{comparison.avalanche.debtsOrder[0]?.name}</span>
                            <span className="text-muted-foreground ml-1">({comparison.avalanche.individualPlans[0]?.monthsToPayoff} meses)</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ahorro de avalancha */}
                {(comparison.interestSavedByAvalanche > 0 || comparison.monthsSavedByAvalanche > 0) && (
                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-3 text-center">
                    <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                      La Avalancha te ahorra{" "}
                      {comparison.interestSavedByAvalanche > 0 && (
                        <span className="font-bold">
                          {formatCurrency(comparison.interestSavedByAvalanche)} en intereses
                        </span>
                      )}
                      {comparison.interestSavedByAvalanche > 0 && comparison.monthsSavedByAvalanche > 0 && " y "}
                      {comparison.monthsSavedByAvalanche > 0 && (
                        <span className="font-bold">
                          {comparison.monthsSavedByAvalanche} meses antes
                        </span>
                      )}
                    </p>
                  </div>
                )}

                {/* Orden de ataque visual */}
                <div className="space-y-3 overflow-hidden">
                  <p className="text-[11px] font-semibold">Orden de ataque por estrategia:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-lg border p-2.5 space-y-1.5 overflow-hidden">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Snowflake className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                        <span className="text-[11px] font-semibold text-sky-700 dark:text-sky-300 truncate">Bola de Nieve</span>
                      </div>
                      {comparison.snowball.debtsOrder.map((debt, i) => (
                        <div key={debt.id} className="flex items-center gap-2 text-[10px] min-w-0">
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 font-bold text-[8px]">
                            {i + 1}
                          </span>
                          <span className="truncate min-w-0">{debt.name}</span>
                          <span className="text-muted-foreground ml-auto shrink-0 whitespace-nowrap">{formatCurrency(debt.currentBalance)} · {debt.interestRate}%</span>
                        </div>
                      ))}
                      {comparison.snowball.debtsOrder.length === 0 && (
                        <p className="text-[10px] text-muted-foreground">Sin deudas</p>
                      )}
                    </div>
                    <div className="rounded-lg border p-2.5 space-y-1.5 overflow-hidden">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Mountain className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                        <span className="text-[11px] font-semibold text-orange-700 dark:text-orange-300 truncate">Avalancha</span>
                      </div>
                      {comparison.avalanche.debtsOrder.map((debt, i) => (
                        <div key={debt.id} className="flex items-center gap-2 text-[10px] min-w-0">
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 font-bold text-[8px]">
                            {i + 1}
                          </span>
                          <span className="truncate min-w-0">{debt.name}</span>
                          <span className="text-muted-foreground ml-auto shrink-0 whitespace-nowrap">{formatCurrency(debt.currentBalance)} · {debt.interestRate}%</span>
                        </div>
                      ))}
                      {comparison.avalanche.debtsOrder.length === 0 && (
                        <p className="text-[10px] text-muted-foreground">Sin deudas</p>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {comparison.recommendation}
                </p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Debt List */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Tus Deudas
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {debts.length} deuda{debts.length !== 1 ? "s" : ""} registrada{debts.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <Button size="sm" onClick={handleOpenAdd} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Añadir
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {debts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="mx-auto h-10 w-10 mb-2 opacity-30" />
              <p className="text-sm font-medium">¡Sin deudas!</p>
              <p className="text-xs">Añade una deuda para empezar a planificar</p>
            </div>
          ) : (
            <ScrollArea className="max-h-96">
              <div className="space-y-3 pr-2">
                {activePlan.debtsOrder.map((debt, idx) => {
                  const plan = activePlan.individualPlans.find(
                    (p) => p.debt.id === debt.id
                  );
                  const progress =
                    debt.totalAmount > 0
                      ? ((debt.totalAmount - debt.currentBalance) /
                          debt.totalAmount) *
                        100
                      : 0;
                  const isTarget = idx === 0;

                  return (
                    <div
                      key={debt.id}
                      className={cn(
                        "rounded-xl border p-4 space-y-3 transition-all overflow-hidden",
                        isTarget &&
                          "border-primary/40 bg-primary/5 shadow-sm"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold truncate">
                              {debt.name}
                            </span>
                            <Badge
                              variant="secondary"
                              className="text-[10px] shrink-0"
                            >
                              {DEBT_TYPE_CONFIG[debt.type].label}
                            </Badge>
                            {isTarget && (
                              <Badge className="text-[10px] bg-primary text-primary-foreground shrink-0">
                                🎯 Objetivo
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleOpenEdit(debt.id)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-rose-500 hover:text-rose-600"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar deuda?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Se eliminará &quot;{debt.name}&quot; ({formatCurrency(debt.currentBalance)}). Esta acción no se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteDebt(debt.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center overflow-hidden">
                        <div className="min-w-0">
                          <p className="text-[10px] sm:text-xs font-bold truncate">
                            {formatCurrency(debt.currentBalance)}
                          </p>
                          <p className="text-[9px] sm:text-[10px] text-muted-foreground truncate whitespace-nowrap">
                            de {formatCurrency(debt.totalAmount)}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] sm:text-xs font-bold text-rose-600 truncate whitespace-nowrap">
                            {debt.interestRate}% TAE
                          </p>
                          <p className="text-[9px] sm:text-[10px] text-muted-foreground">
                            Interés
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] sm:text-xs font-bold truncate whitespace-nowrap">
                            {formatCurrency(debt.minimumPayment)}
                          </p>
                          <p className="text-[9px] sm:text-[10px] text-muted-foreground">
                            Mín./mes
                          </p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>Pagado</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>

                      {/* Payoff info */}
                      {plan && (
                        <div className="flex flex-wrap items-center justify-between text-[10px] text-muted-foreground gap-1">
                          <span className="whitespace-nowrap">
                            Intereses: {formatCurrency(plan.totalInterest)}
                          </span>
                          <span className="whitespace-nowrap">
                            Libre en {plan.monthsToPayoff} meses
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Debt Freedom Timeline */}
      {debts.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-500" />
              Timeline hacia la Libertad
            </CardTitle>
            <CardDescription className="text-xs">
              Cuándo se paga cada deuda con la estrategia{" "}
              {strategy === "bola_nieve" ? "Bola de Nieve" : "Avalancha"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activePlan.individualPlans.map((plan, idx) => {
                const maxMonths = activePlan.totalMonthsToFreedom || 1;
                const widthPercent =
                  (plan.monthsToPayoff / maxMonths) * 100;
                const colorClasses = [
                  "bg-rose-500",
                  "bg-amber-500",
                  "bg-sky-500",
                  "bg-violet-500",
                  "bg-emerald-500",
                  "bg-pink-500",
                ];
                const color = colorClasses[idx % colorClasses.length];

                return (
                  <div key={plan.debt.id} className="space-y-1.5 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium truncate">
                        {plan.debt.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">
                        {plan.monthsToPayoff} meses —{" "}
                        {new Date(
                          new Date().setMonth(
                            new Date().getMonth() + plan.monthsToPayoff
                          )
                        ).toLocaleDateString("es-ES", {
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="h-6 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full flex items-center justify-end pr-2 transition-all overflow-hidden whitespace-nowrap",
                          color
                        )}
                        style={{ width: `${Math.max(widthPercent, 8)}%` }}
                      >
                        <span className="text-[10px] font-bold text-white truncate">
                          {formatCurrency(plan.debt.currentBalance)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Freedom marker */}
              <Separator />
              <div className="flex items-center justify-center gap-2 py-2">
                <Trophy className="h-5 w-5 text-emerald-500" />
                <span className="text-sm font-bold text-emerald-600">
                  ¡Libre de deudas en {monthsToFreedom} meses!
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Debt Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[480px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {editingDebtId ? "Editar Deuda" : "Añadir Deuda"}
            </DialogTitle>
            <DialogDescription>
              {editingDebtId
                ? "Modifica los datos de tu deuda"
                : "Registra una nueva deuda para incluirla en tu plan"}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[70vh] pr-2">
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-xs">Nombre</Label>
                <Input
                  placeholder="Ej: Préstamo personal BBVA"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Tipo de deuda</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      type: v as DebtType,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.entries(DEBT_TYPE_CONFIG) as [
                        DebtType,
                        (typeof DEBT_TYPE_CONFIG)[DebtType],
                      ][]
                    ).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label} (~{config.typicalRate}% TAE)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Cantidad total (€)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="8000"
                    value={formData.totalAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        totalAmount: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Balance actual (€)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="6500"
                    value={formData.currentBalance}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        currentBalance: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">TAE (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="8.5"
                    value={formData.interestRate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        interestRate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Pago mínimo (€/mes)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="10"
                    placeholder="250"
                    value={formData.minimumPayment}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minimumPayment: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Día de pago</Label>
                  <Select
                    value={formData.dueDay}
                    onValueChange={(v) =>
                      setFormData({ ...formData, dueDay: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(
                        (day) => (
                          <SelectItem key={day} value={String(day)}>
                            Día {day}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Fecha de inicio</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        startDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <Button
                onClick={handleSaveDebt}
                disabled={!formData.name || !formData.totalAmount || !formData.currentBalance}
                className="w-full gap-2"
              >
                {editingDebtId ? "Guardar Cambios" : "Añadir Deuda"}
              </Button>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
