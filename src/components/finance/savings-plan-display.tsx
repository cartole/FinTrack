/**
 * ============================================
 * Plan de Ahorro IA - Visualización
 * ============================================
 * Muestra el plan generado por el motor de IA
 * con timeline, recortes por categoría y recomendaciones.
 */

"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useFinanceStore } from "@/store/finance-store";
import { formatCurrency, formatMonth } from "@/lib/finance-utils";
import { CATEGORY_CONFIG, type TransactionCategory } from "@/lib/types";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

function FeasibilityBadge({ score }: { score: number }) {
  const variant =
    score >= 70
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
      : score >= 40
        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
        : "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300";

  const label =
    score >= 70
      ? "Alcanzable"
      : score >= 40
        ? "Desafiante"
        : "Muy ambiciosa";

  return (
    <Badge className={cn("text-xs font-semibold px-2.5 py-1", variant)}>
      {label} ({score}/100)
    </Badge>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: "facil" | "moderado" | "dificil" }) {
  const variants = {
    facil: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
    moderado: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    dificil: "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300",
  };

  const labels = { facil: "Fácil", moderado: "Moderado", dificil: "Difícil" };

  return (
    <Badge className={cn("text-[10px] px-1.5 py-0.5", variants[difficulty])}>
      {labels[difficulty]}
    </Badge>
  );
}

export function SavingsPlanDisplay() {
  const { currentSavingsPlan, isSavingsPlanOpen, setSavingsPlanOpen } = useFinanceStore();

  if (!currentSavingsPlan) return null;

  const plan = currentSavingsPlan;

  return (
    <Dialog open={isSavingsPlanOpen} onOpenChange={setSavingsPlanOpen}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Plan de Ahorro IA
          </DialogTitle>
          <DialogDescription>
            Análisis personalizado para &quot;{plan.goalName}&quot;
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh] pr-2">
          <div className="space-y-5">
            {/* Resumen */}
            <Card className="border-0 bg-muted/50">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Resumen Financiero
                  </h3>
                  <FeasibilityBadge score={plan.feasibilityScore} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase">
                      Ahorro mensual requerido
                    </span>
                    <p className="text-lg font-bold">
                      {formatCurrency(plan.monthlySavingsRequired)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase">
                      Meses para la meta
                    </span>
                    <p className="text-lg font-bold">{plan.monthsToGoal} meses</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase">
                      Monto restante
                    </span>
                    <p className="text-lg font-bold">{formatCurrency(plan.targetAmount)}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase">
                      Viabilidad
                    </span>
                    <Progress
                      value={plan.feasibilityScore}
                      className="h-2 mt-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recortes por categoría */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Oportunidades de Ahorro
              </h3>
              <div className="space-y-2">
                {plan.categoryCuts.map((cut) => (
                  <div
                    key={cut.category}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${CATEGORY_CONFIG[cut.category]?.color}20`,
                      }}
                    >
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor: CATEGORY_CONFIG[cut.category]?.color,
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">
                          {CATEGORY_CONFIG[cut.category]?.label}
                        </span>
                        <DifficultyBadge difficulty={cut.difficulty} />
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 text-[10px] text-muted-foreground">
                        <span>Actual: {formatCurrency(cut.currentMonthlyAvg)}/mes</span>
                        <ChevronRight className="h-2.5 w-2.5" />
                        <span className="font-medium text-emerald-600">
                          Máx: {formatCurrency(cut.suggestedMax)}/mes
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-emerald-600">
                        -{formatCurrency(cut.potentialSaving)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">ahorro/mes</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-3">
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  Ahorro potencial total:{" "}
                  <span className="font-bold">
                    {formatCurrency(
                      plan.categoryCuts.reduce((sum, cut) => sum + cut.potentialSaving, 0)
                    )}
                    /mes
                  </span>
                </p>
              </div>
            </div>

            <Separator />

            {/* Timeline */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Timeline Proyectado
              </h3>
              <div className="space-y-2">
                {plan.projectedTimeline.slice(0, 6).map((step, idx) => (
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
                          Ahorrar: {formatCurrency(step.amountToSave)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Progress
                          value={
                            (step.cumulativeSaved / plan.targetAmount) * 100
                          }
                          className="h-1.5 flex-1"
                        />
                        <span className="text-[10px] text-muted-foreground w-20 text-right">
                          {formatCurrency(step.cumulativeSaved)}
                        </span>
                      </div>
                      {step.milestone && (
                        <span className="text-[10px] text-primary font-medium">
                          {step.milestone}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Recomendaciones */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Recomendaciones Personalizadas
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
