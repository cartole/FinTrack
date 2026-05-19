/**
 * ============================================
 * Planificador de Presupuestos Mensuales
 * ============================================
 * Componente que permite gestionar, visualizar y
 * obtener recomendaciones IA para presupuestos.
 */

"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFinanceStore } from "@/store/finance-store";
import {
  EXPENSE_CATEGORIES,
  CATEGORY_CONFIG,
  type TransactionCategory,
  type Budget,
} from "@/lib/types";
import { formatCurrency } from "@/lib/finance-utils";
import {
  calculateBudgetStatus,
  generateBudgetRecommendations,
  getProgressColor,
  getProgressTextColor,
  getStatusLabel,
} from "@/lib/budget-manager";
import {
  Plus,
  Pencil,
  Trash2,
  Sparkles,
  Wallet,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  CircleDot,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Mapa de iconos de categoría */
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  comida: <span className="text-base">🍽️</span>,
  alquiler: <span className="text-base">🏠</span>,
  transporte: <span className="text-base">🚗</span>,
  ocio: <span className="text-base">🎮</span>,
  salud: <span className="text-base">❤️</span>,
  educacion: <span className="text-base">🎓</span>,
  suscripciones: <span className="text-base">🔄</span>,
  ropa: <span className="text-base">👕</span>,
  ahorro: <span className="text-base">🐷</span>,
};

export function BudgetPlanner() {
  const { transactions, budgets, addBudget, updateBudget, deleteBudget, selectedMonth } =
    useFinanceStore();

  // ---- Estado local ----
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRecommendDialogOpen, setIsRecommendDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<TransactionCategory | "">("");
  const [newLimit, setNewLimit] = useState("");
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [editLimit, setEditLimit] = useState("");
  const [isApplyingRecommendations, setIsApplyingRecommendations] = useState(false);

  // ---- Cálculos ----
  const budgetStatuses = useMemo(
    () => calculateBudgetStatus(transactions, budgets, selectedMonth),
    [transactions, budgets, selectedMonth]
  );

  const recommendations = useMemo(
    () => generateBudgetRecommendations(transactions, budgets),
    [transactions, budgets]
  );

  const totalBudgeted = useMemo(
    () => budgets.reduce((sum, b) => sum + b.monthlyLimit, 0),
    [budgets]
  );

  const totalSpent = useMemo(
    () => budgetStatuses.reduce((sum, bs) => sum + bs.spent, 0),
    [budgetStatuses]
  );

  const overallPercentage = useMemo(
    () => (totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0),
    [totalSpent, totalBudgeted]
  );

  // Categorías sin presupuesto asignado
  const categoriesWithoutBudget = useMemo(
    () => EXPENSE_CATEGORIES.filter((cat) => !budgets.some((b) => b.category === cat)),
    [budgets]
  );

  // ---- Handlers ----
  const handleAddBudget = () => {
    if (!selectedCategory || !newLimit || parseFloat(newLimit) <= 0) return;
    addBudget({
      category: selectedCategory as TransactionCategory,
      monthlyLimit: parseFloat(newLimit),
    });
    setSelectedCategory("");
    setNewLimit("");
    setIsAddDialogOpen(false);
  };

  const handleEditBudget = () => {
    if (!editingBudget || !editLimit || parseFloat(editLimit) <= 0) return;
    updateBudget(editingBudget.id, parseFloat(editLimit));
    setEditingBudget(null);
    setEditLimit("");
    setIsEditDialogOpen(false);
  };

  const handleDeleteBudget = (id: string) => {
    deleteBudget(id);
  };

  const openEditDialog = (budget: Budget) => {
    setEditingBudget(budget);
    setEditLimit(String(budget.monthlyLimit));
    setIsEditDialogOpen(true);
  };

  const handleApplyRecommendations = () => {
    setIsApplyingRecommendations(true);
    // Simular delay de "procesamiento IA"
    setTimeout(() => {
      for (const rec of recommendations) {
        const existingBudget = budgets.find((b) => b.category === rec.category);
        if (existingBudget) {
          updateBudget(existingBudget.id, rec.suggestedLimit);
        } else {
          addBudget({
            category: rec.category,
            monthlyLimit: rec.suggestedLimit,
          });
        }
      }
      setIsApplyingRecommendations(false);
      setIsRecommendDialogOpen(false);
    }, 1500);
  };

  // ---- Render helpers ----
  const renderProgressBar = (percentage: number) => {
    const clampedValue = Math.min(percentage, 100);
    return (
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all duration-500", getProgressColor(percentage))}
          style={{ width: `${clampedValue}%` }}
        />
        {percentage > 100 && (
          <div
            className="absolute top-0 right-0 h-full w-3 animate-pulse rounded-full bg-red-700"
            style={{ width: "6px" }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
            <Wallet className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Presupuestos Mensuales</h2>
            <p className="text-sm text-muted-foreground">
              Controla tus límites de gasto por categoría
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setIsRecommendDialogOpen(true)}
          >
            <Sparkles className="h-4 w-4" />
            Recomendar IA
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => setIsAddDialogOpen(true)}
            disabled={categoriesWithoutBudget.length === 0}
          >
            <Plus className="h-4 w-4" />
            Añadir
          </Button>
        </div>
      </div>

      {/* ---- Overall Summary Card ---- */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Presupuestado</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalBudgeted)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gastado</p>
              <p className={cn("text-xl font-bold", getProgressTextColor(overallPercentage))}>
                {formatCurrency(totalSpent)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">General</p>
              <p className={cn("text-xl font-bold", getProgressTextColor(overallPercentage))}>
                {overallPercentage}%
              </p>
            </div>
          </div>
          <div className="mt-3">{renderProgressBar(overallPercentage)}</div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Restante: {formatCurrency(totalBudgeted - totalSpent)}</span>
            <span>
              {budgetStatuses.filter((bs) => bs.status === "over").length} superado
              {budgetStatuses.filter((bs) => bs.status === "over").length !== 1 ? "s" : ""} ·{" "}
              {budgetStatuses.filter((bs) => bs.status === "warning").length} en riesgo
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ---- Budget List ---- */}
      {budgetStatuses.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-center">
            <CircleDot className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              No tienes presupuestos configurados
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Añade tu primer presupuesto o usa &quot;Recomendar IA&quot;
            </p>
            <Button
              className="mt-4 gap-1.5"
              size="sm"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Añadir presupuesto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="max-h-[500px]">
          <div className="space-y-3 pr-1">
            {budgetStatuses.map((bs) => {
              const config = CATEGORY_CONFIG[bs.budget.category];
              const icon = CATEGORY_ICONS[bs.budget.category] || <CircleDot className="h-4 w-4" />;

              return (
                <Card key={bs.budget.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    {/* Top row: icon, name, status badge, actions */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-lg"
                          style={{ backgroundColor: `${config.color}15` }}
                        >
                          {icon}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{config.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(bs.spent)} / {formatCurrency(bs.budget.monthlyLimit)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] px-1.5 py-0.5",
                            bs.status === "over" &&
                              "border-red-300 text-red-700 dark:border-red-800 dark:text-red-400",
                            bs.status === "warning" &&
                              "border-orange-300 text-orange-700 dark:border-orange-800 dark:text-orange-400",
                            bs.status === "ok" &&
                              "border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400"
                          )}
                        >
                          {getStatusLabel(bs.status)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEditDialog(bs.budget)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-red-600"
                          onClick={() => handleDeleteBudget(bs.budget.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Progress bar */}
                    {renderProgressBar(bs.percentage)}

                    {/* Bottom row: percentage + remaining */}
                    <div className="mt-1.5 flex items-center justify-between text-xs">
                      <span className={cn("font-medium", getProgressTextColor(bs.percentage))}>
                        {bs.percentage}% gastado
                      </span>
                      <span
                        className={cn(
                          bs.remaining < 0
                            ? "text-red-600 dark:text-red-400"
                            : "text-muted-foreground"
                        )}
                      >
                        {bs.remaining < 0 ? (
                          <span className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Excedido {formatCurrency(Math.abs(bs.remaining))}
                          </span>
                        ) : (
                          `Quedan ${formatCurrency(bs.remaining)}`
                        )}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}

      {/* ============================================================ */}
      {/* DIALOG: Añadir presupuesto                                    */}
      {/* ============================================================ */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Nuevo Presupuesto</DialogTitle>
            <DialogDescription>
              Establece un límite mensual para una categoría de gasto
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs">Categoría</Label>
              <Select
                value={selectedCategory}
                onValueChange={(v) => setSelectedCategory(v as TransactionCategory)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría..." />
                </SelectTrigger>
                <SelectContent>
                  {categoriesWithoutBudget.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: CATEGORY_CONFIG[cat].color }}
                        />
                        {CATEGORY_CONFIG[cat].label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Límite mensual (€)</Label>
              <Input
                type="number"
                placeholder="200"
                value={newLimit}
                onChange={(e) => setNewLimit(e.target.value)}
                className="text-lg font-semibold"
                min={1}
              />
              {selectedCategory && newLimit && (
                <p className="text-[11px] text-muted-foreground">
                  Gasto promedio histórico:{" "}
                  {formatCurrency(
                    recommendations.find((r) => r.category === selectedCategory)?.avgSpending ?? 0
                  )}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddBudget}
              disabled={!selectedCategory || !newLimit || parseFloat(newLimit) <= 0}
            >
              Crear presupuesto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* DIALOG: Editar presupuesto                                    */}
      {/* ============================================================ */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Editar Presupuesto</DialogTitle>
            <DialogDescription>
              {editingBudget
                ? `Modificar límite de ${CATEGORY_CONFIG[editingBudget.category].label}`
                : "Modificar límite de presupuesto"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="flex items-center gap-2">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: `${CATEGORY_CONFIG[editingBudget?.category ?? "comida"].color}15`,
                  }}
                >
                  {CATEGORY_ICONS[editingBudget?.category ?? "comida"]}
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {CATEGORY_CONFIG[editingBudget?.category ?? "comida"].label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Límite actual: {formatCurrency(editingBudget?.monthlyLimit ?? 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Nuevo límite mensual (€)</Label>
              <Input
                type="number"
                value={editLimit}
                onChange={(e) => setEditLimit(e.target.value)}
                className="text-lg font-semibold"
                min={1}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleEditBudget}
              disabled={!editLimit || parseFloat(editLimit) <= 0}
            >
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* DIALOG: Recomendaciones IA                                    */}
      {/* ============================================================ */}
      <Dialog open={isRecommendDialogOpen} onOpenChange={setIsRecommendDialogOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Recomendaciones IA
            </DialogTitle>
            <DialogDescription>
              Basadas en tu historial de gastos (promedio 3 meses + 10% margen)
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[400px] pr-2">
            <div className="space-y-2 py-2">
              {recommendations.map((rec) => {
                const config = CATEGORY_CONFIG[rec.category];
                const icon = CATEGORY_ICONS[rec.category];
                const isOverBudget =
                  rec.currentLimit !== undefined && rec.avgSpending > rec.currentLimit;

                return (
                  <div
                    key={rec.category}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3",
                      isOverBudget && "border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/20"
                    )}
                  >
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${config.color}15` }}
                    >
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">{config.label}</p>
                        {isOverBudget && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 border-orange-300 text-orange-700 dark:border-orange-800 dark:text-orange-400">
                            Sobre límite
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Promedio: {formatCurrency(rec.avgSpending)}</span>
                        {rec.currentLimit !== undefined && (
                          <span>
                            Límite actual: {formatCurrency(rec.currentLimit)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(rec.suggestedLimit)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">sugerido</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRecommendDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleApplyRecommendations}
              disabled={isApplyingRecommendations}
              className="gap-1.5"
            >
              {isApplyingRecommendations ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Aplicando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Aplicar todas
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
