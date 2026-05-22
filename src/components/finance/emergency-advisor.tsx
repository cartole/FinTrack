/**
 * ============================================
 * Asesor de Gastos Imprevistos
 * ============================================
 * Componente que permite al usuario simular un gasto
 * grande inesperado y obtener un plan de acción completo.
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { useFinanceStore } from "@/store/finance-store";
import { EXPENSE_CATEGORIES, CATEGORY_CONFIG, type TransactionCategory } from "@/lib/types";
import { formatCurrency } from "@/lib/finance-utils";
import {
  generateEmergencyPlan,
  type EmergencyExpenseInput,
  type EmergencyPlan,
  type EmergencySeverity,
  type FundingSource,
} from "@/lib/emergency-advisor";
import {
  AlertTriangle,
  Zap,
  ShieldAlert,
  TrendingDown,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Lightbulb,
  Target,
  Ban,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Escenarios rápidos comunes de gastos imprevistos */
const commonEmergencies = [
  { label: "Reparación coche", amount: 800, category: "transporte" as TransactionCategory },
  { label: "Avería caldera", amount: 600, category: "alquiler" as TransactionCategory },
  { label: "Gasto médico urgente", amount: 500, category: "salud" as TransactionCategory },
  { label: "Reparación electrodoméstico", amount: 350, category: "otro" as TransactionCategory },
  { label: "Multa inesperada", amount: 200, category: "otro" as TransactionCategory },
  { label: "Gasto dental", amount: 700, category: "salud" as TransactionCategory },
];

function SeverityBadge({ severity, score }: { severity: EmergencySeverity; score: number }) {
  const variants: Record<EmergencySeverity, string> = {
    leve: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
    moderada: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    grave: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
    critica: "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300",
  };

  const labels: Record<EmergencySeverity, string> = {
    leve: "🟢 Leve",
    moderada: "🟡 Moderada",
    grave: "🟠 Grave",
    critica: "🔴 Crítica",
  };

  return (
    <Badge className={cn("text-sm font-semibold px-3 py-1.5", variants[severity])}>
      {labels[severity]} ({score}/100)
    </Badge>
  );
}

function ImpactBadge({ impact }: { impact: FundingSource["impact"] }) {
  const variants = {
    ninguno: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50",
    bajo: "bg-sky-100 text-sky-700 dark:bg-sky-900/50",
    moderado: "bg-amber-100 text-amber-700 dark:bg-amber-900/50",
    alto: "bg-rose-100 text-rose-700 dark:bg-rose-900/50",
  };

  const labels = { ninguno: "Sin impacto", bajo: "Bajo", moderado: "Moderado", alto: "Alto" };

  return (
    <Badge className={cn("text-[10px] px-1.5 py-0.5", variants[impact])}>
      {labels[impact]}
    </Badge>
  );
}

function EmergencyPlanDisplay({ plan, onClose }: { plan: EmergencyPlan; onClose: () => void }) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[680px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-orange-500" />
            Plan de Acción - Gasto Imprevisto
          </DialogTitle>
          <DialogDescription>
            Análisis y recomendaciones para tu situación
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] pr-2 overflow-y-auto overscroll-contain">
          <div className="space-y-5">
            {/* Severidad y resumen */}
            <Card className="border-0 bg-muted/50">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Evaluación de Severidad</h3>
                  <SeverityBadge severity={plan.severity} score={plan.severityScore} />
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-background p-2">
                    <p className="text-lg font-bold">{formatCurrency(plan.expenseAmount)}</p>
                    <p className="text-[10px] text-muted-foreground">Gasto imprevisto</p>
                  </div>
                  <div className="rounded-lg bg-background p-2">
                    <p className="text-lg font-bold">{plan.impactOnMonthlyBudget}%</p>
                    <p className="text-[10px] text-muted-foreground">Impacto en ingresos</p>
                  </div>
                  <div className="rounded-lg bg-background p-2">
                    <p className="text-lg font-bold">{plan.recoveryPlan.length} meses</p>
                    <p className="text-[10px] text-muted-foreground">Plan de recuperación</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Acciones inmediatas */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                Acciones Inmediatas
              </h3>
              <div className="space-y-2">
                {plan.immediateActions.map((action, idx) => (
                  <div
                    key={idx}
                    className="flex gap-2.5 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 p-3 text-xs leading-relaxed"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-amber-900 dark:text-amber-100">{action}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Fuentes de financiación */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                De Dónde Sacar el Dinero (por prioridad)
              </h3>
              <div className="space-y-2">
                {plan.fundingSources.map((source) => (
                  <div key={source.priority} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {source.priority}
                        </span>
                        <span className="text-xs font-semibold">{source.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ImpactBadge impact={source.impact} />
                        <span className="text-xs font-bold">
                          {formatCurrency(source.suggestedAmount)}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed ml-8">
                      {source.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Plan de recuperación */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Plan de Recuperación
              </h3>
              <div className="space-y-2">
                {plan.recoveryPlan.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        idx === 0
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{step.month}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatCurrency(step.amountToRecover)}/mes
                        </span>
                      </div>
                      <Progress
                        value={(step.cumulativeRecovered / plan.expenseAmount) * 100}
                        className="h-1.5 mt-1"
                      />
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {step.strategy}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Impacto en metas */}
            {plan.goalImpacts.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Target className="h-4 w-4 text-rose-500" />
                    Impacto en tus Metas de Ahorro
                  </h3>
                  <div className="space-y-2">
                    {plan.goalImpacts.map((impact) => (
                      <div key={impact.goalId} className="flex items-center gap-3 rounded-lg border p-3">
                        <Ban className="h-4 w-4 text-rose-500 shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-medium">{impact.goalName}</p>
                          <p className="text-[10px] text-muted-foreground">
                            Retraso de <span className="font-semibold text-rose-600">{impact.delayMonths} meses</span>
                          </p>
                        </div>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground">Nueva fecha</p>
                          <p className="text-xs font-medium">
                            {new Date(impact.newDeadline).toLocaleDateString("es-ES", {
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Recomendaciones */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Recomendaciones
              </h3>
              <div className="space-y-2">
                {plan.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="flex gap-2.5 rounded-lg border p-3 text-xs text-muted-foreground leading-relaxed"
                  >
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function EmergencyAdvisor() {
  const { transactions, savingsGoals, addTransaction } = useFinanceStore();
  const [emergencyAmount, setEmergencyAmount] = useState("");
  const [emergencyCategory, setEmergencyCategory] = useState<TransactionCategory | "">("");
  const [emergencyDesc, setEmergencyDesc] = useState("");
  const [canFinance, setCanFinance] = useState(false);
  const [financeMonths, setFinanceMonths] = useState("3");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [emergencyPlan, setEmergencyPlan] = useState<EmergencyPlan | null>(null);

  const handleQuickEmergency = (em: (typeof commonEmergencies)[0]) => {
    setEmergencyAmount(String(em.amount));
    setEmergencyCategory(em.category);
    setEmergencyDesc(em.label);
  };

  const handleAnalyze = () => {
    if (!emergencyAmount || !emergencyCategory) return;

    setIsAnalyzing(true);
    const input: EmergencyExpenseInput = {
      amount: parseFloat(emergencyAmount),
      category: emergencyCategory as TransactionCategory,
      description: emergencyDesc || "Gasto imprevisto",
      canFinance,
      financingMonths: canFinance ? parseInt(financeMonths) : undefined,
    };

    // Simular delay de "análisis IA"
    setTimeout(() => {
      const plan = generateEmergencyPlan(transactions, savingsGoals, input);
      setEmergencyPlan(plan);
      setIsAnalyzing(false);
    }, 1500);
  };

  const handleRegisterExpense = () => {
    if (!emergencyPlan) return;
    addTransaction({
      amount: emergencyPlan.expenseAmount,
      category: emergencyCategory as TransactionCategory,
      type: "gasto",
      recurrence: "puntual",
      description: emergencyDesc || "Gasto imprevisto",
      date: new Date().toISOString(),
    });
    setEmergencyPlan(null);
    // Reset form
    setEmergencyAmount("");
    setEmergencyCategory("");
    setEmergencyDesc("");
  };

  return (
    <div className="space-y-6">
      {/* Plan de emergencia dialog */}
      {emergencyPlan && (
        <EmergencyPlanDisplay
          plan={emergencyPlan}
          onClose={() => setEmergencyPlan(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10">
          <ShieldAlert className="h-6 w-6 text-orange-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Gastos Imprevistos</h2>
          <p className="text-sm text-muted-foreground">
            ¿Tienes un gasto grande inesperado? Te digo cómo actuar
          </p>
        </div>
      </div>

      {/* Escenarios comunes */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            Situaciones Comunes
          </CardTitle>
          <CardDescription className="text-xs">
            Selecciona un escenario típico para empezar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {commonEmergencies.map((em) => (
              <Button
                key={em.label}
                variant="outline"
                size="sm"
                onClick={() => handleQuickEmergency(em)}
                className={cn(
                  "gap-1.5",
                  emergencyDesc === em.label && "border-orange-500 bg-orange-50 dark:bg-orange-950/30"
                )}
              >
                {em.label} ({formatCurrency(em.amount)})
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Formulario de gasto imprevisto */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Describe tu Gasto Imprevisto
          </CardTitle>
          <CardDescription className="text-xs">
            Cuanta más información des, mejor será el plan de acción
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">¿Qué ha pasado?</Label>
              <Input
                placeholder="Ej: Se ha roto la caldera de casa"
                value={emergencyDesc}
                onChange={(e) => setEmergencyDesc(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">¿Cuánto cuesta? (€)</Label>
                <Input
                  type="number"
                  placeholder="800"
                  value={emergencyAmount}
                  onChange={(e) => setEmergencyAmount(e.target.value)}
                  className="text-lg font-semibold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Categoría</Label>
                <Select
                  value={emergencyCategory}
                  onValueChange={(v) => setEmergencyCategory(v as TransactionCategory)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona..." />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: CATEGORY_CONFIG[cat].color }}
                          />
                          {CATEGORY_CONFIG[cat].label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Financiación */}
            <div className="rounded-lg border p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">¿Se puede pagar a plazos?</Label>
                  <p className="text-xs text-muted-foreground">
                    Sin intereses (ej: cuotas del hospital, proveedor)
                  </p>
                </div>
                <Switch checked={canFinance} onCheckedChange={setCanFinance} />
              </div>
              {canFinance && (
                <div className="space-y-2 pt-1">
                  <Label className="text-xs">¿En cuántos meses?</Label>
                  <Select value={financeMonths} onValueChange={setFinanceMonths}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 meses</SelectItem>
                      <SelectItem value="3">3 meses</SelectItem>
                      <SelectItem value="6">6 meses</SelectItem>
                      <SelectItem value="12">12 meses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Botón analizar */}
            <Button
              onClick={handleAnalyze}
              disabled={!emergencyAmount || !emergencyCategory || isAnalyzing}
              className="w-full gap-2"
              size="lg"
              variant={parseFloat(emergencyAmount) > 1000 ? "destructive" : "default"}
            >
              {isAnalyzing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ShieldAlert className="h-5 w-5" />
              )}
              {isAnalyzing ? "Analizando tu situación..." : "Generar Plan de Acción"}
            </Button>

            {/* Info contextual */}
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-xs font-semibold">¿Cómo funciona?</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Introduce el gasto imprevisto y el sistema analizará tus finanzas actuales
                para determinar la severidad de la situación, sugerirte de dónde sacar el dinero
                (priorizando las fuentes de menor impacto), crear un plan de recuperación
                mes a mes, y calcular cómo afecta a tus metas de ahorro.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
