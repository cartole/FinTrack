/**
 * ============================================
 * Asesor de Ingreso Extra IA
 * ============================================
 * Componente que analiza automáticamente las finanzas
 * del usuario y, si la situación es mala, sugiere
 * cuánto ingreso extra necesita y cómo generarlo.
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useFinanceStore } from "@/store/finance-store";
import { formatCurrency } from "@/lib/finance-utils";
import {
  generateExtraIncomePlan,
  type ExtraIncomePlan,
  type FinancialUrgency,
  type IncomeSuggestion,
  type IncomeCategory,
} from "@/lib/extra-income-advisor";
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Zap,
  DollarSign,
  Calendar,
  Target,
  ArrowUpRight,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  ShieldAlert,
  Brain,
  Rocket,
  Briefcase,
  GraduationCap,
  Package,
  Truck,
  Search,
  Home,
  Palette,
  ShoppingBag,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Icono por categoría de ingreso */
const CATEGORY_ICONS: Record<IncomeCategory, React.ComponentType<{ className?: string }>> = {
  freelance: Briefcase,
  venta_articulos: Package,
  clases_particulares: GraduationCap,
  horas_extra: Zap,
  micro_trabajos: Search,
  alquiler_espacio: Home,
  monetizacion_habilidad: Palette,
  reventa: ShoppingBag,
  encuestas_online: Star,
  delivery_transport: Truck,
};

/** Color por nivel de urgencia */
const URGENCY_COLORS: Record<FinancialUrgency, string> = {
  estable: "text-emerald-600",
  preocupante: "text-amber-600",
  urgente: "text-orange-600",
  critica: "text-rose-600",
};

const URGENCY_BG: Record<FinancialUrgency, string> = {
  estable: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300",
  preocupante: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300",
  urgente: "bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300",
  critica: "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300",
};

const URGENCY_LABELS: Record<FinancialUrgency, string> = {
  estable: "🟢 Estable",
  preocupante: "🟡 Preocupante",
  urgente: "🟠 Urgente",
  critica: "🔴 Crítica",
};

const DIFFICULTY_LABELS = {
  facil: { label: "Fácil", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" },
  moderado: { label: "Moderado", color: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" },
  avanzado: { label: "Avanzado", color: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300" },
};

/** Componente para cada sugerencia de ingreso */
function IncomeSuggestionCard({ suggestion, index }: { suggestion: IncomeSuggestion; index: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = CATEGORY_ICONS[suggestion.category] || DollarSign;

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full text-left">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 mt-0.5">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold">{suggestion.title}</h4>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={cn("text-[10px] px-1.5 py-0.5", DIFFICULTY_LABELS[suggestion.difficulty].color)}>
                        {DIFFICULTY_LABELS[suggestion.difficulty].label}
                      </Badge>
                      <span className="text-sm font-bold text-primary">
                        ~{formatCurrency(suggestion.estimatedMonthly)}/mes
                      </span>
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    {suggestion.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {suggestion.timeToStart}
                    </span>
                    <span className="flex items-center gap-1">
                      <ArrowUpRight className="h-3 w-3" />
                      {formatCurrency(suggestion.estimatedRange.min)} - {formatCurrency(suggestion.estimatedRange.max)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t px-4 pb-4 pt-3 space-y-4">
            {/* Pasos */}
            <div className="space-y-2">
              <h5 className="text-xs font-semibold flex items-center gap-1.5">
                <Rocket className="h-3.5 w-3.5 text-primary" />
                Cómo empezar (paso a paso)
              </h5>
              <div className="space-y-1.5">
                {suggestion.steps.map((step, idx) => (
                  <div key={idx} className="flex gap-2 text-xs">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-muted-foreground leading-relaxed pt-0.5">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Plataformas */}
            {suggestion.platforms && suggestion.platforms.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs font-semibold flex items-center gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5 text-primary" />
                  Plataformas recomendadas
                </h5>
                <div className="flex flex-wrap gap-1.5">
                  {suggestion.platforms.map((platform) => (
                    <Badge key={platform} variant="secondary" className="text-[10px]">
                      {platform}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Requisitos */}
            <div className="space-y-2">
              <h5 className="text-xs font-semibold flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-primary" />
                Requisitos
              </h5>
              <ul className="space-y-1">
                {suggestion.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pros y Contras */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <h5 className="text-xs font-semibold flex items-center gap-1 text-emerald-600">
                  <ThumbsUp className="h-3 w-3" />
                  Ventajas
                </h5>
                {suggestion.pros.map((pro, idx) => (
                  <p key={idx} className="text-[11px] text-muted-foreground flex items-start gap-1">
                    <span className="text-emerald-500 mt-0.5">+</span> {pro}
                  </p>
                ))}
              </div>
              <div className="space-y-1.5">
                <h5 className="text-xs font-semibold flex items-center gap-1 text-rose-600">
                  <ThumbsDown className="h-3 w-3" />
                  Desventajas
                </h5>
                {suggestion.cons.map((con, idx) => (
                  <p key={idx} className="text-[11px] text-muted-foreground flex items-start gap-1">
                    <span className="text-rose-500 mt-0.5">-</span> {con}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

/** Componente del plan de acción semanal */
function ActionPlanTimeline({ plan }: { plan: ExtraIncomePlan }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Plan de Acción (Primeras 4 Semanas)
        </CardTitle>
        <CardDescription className="text-xs">
          Sigue este plan para empezar a generar ingresos extra lo antes posible
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {plan.actionPlan.map((step, idx) => (
            <div key={idx} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    idx === 0
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {step.week}
                </div>
                {idx < plan.actionPlan.length - 1 && (
                  <div className="w-px h-full bg-border mt-1" />
                )}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">Semana {step.week}</span>
                  <span className="text-xs text-primary font-medium">
                    +{formatCurrency(step.expectedIncome)}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">
                  {step.action}
                </p>
                <div className="flex items-center gap-2">
                  <Progress
                    value={(step.cumulativeIncome / (plan.diagnosis.extraIncomeWithSafety * 4)) * 100}
                    className="h-1.5 flex-1"
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {formatCurrency(step.cumulativeIncome)} acumulado
                  </span>
                </div>
                <Badge variant="secondary" className="text-[9px] mt-1.5">
                  {step.milestone}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ExtraIncomeAdvisor() {
  const { transactions } = useFinanceStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [plan, setPlan] = useState<ExtraIncomePlan | null>(null);

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    // Simular análisis IA
    setTimeout(() => {
      const result = generateExtraIncomePlan(transactions);
      setPlan(result);
      setIsAnalyzing(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10">
          <TrendingUp className="h-6 w-6 text-violet-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Asesor de Ingreso Extra</h2>
          <p className="text-sm text-muted-foreground">
            La IA analiza si necesitas ingresos adicionales y cómo conseguirlos
          </p>
        </div>
      </div>

      {/* Card principal de análisis */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Brain className="h-4 w-4 text-violet-500" />
            Análisis Automático de tus Finanzas
          </CardTitle>
          <CardDescription className="text-xs">
            La IA revisará tus ingresos, gastos, tendencia y balance para determinar si necesitas generar ingresos extra y de cuánto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Cómo funciona */}
            <div className="rounded-lg bg-violet-50 dark:bg-violet-950/20 p-4 space-y-2">
              <h4 className="text-xs font-semibold text-violet-700 dark:text-violet-300">
                ¿Cómo funciona?
              </h4>
              <ul className="space-y-1.5 text-[11px] text-violet-600 dark:text-violet-400 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5" />
                  Analiza tus últimos meses de ingresos y gastos para detectar si hay déficit
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5" />
                  Solo se activa cuando tu situación financiera es preocupante, urgente o crítica
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5" />
                  Calcula exactamente cuánto ingreso extra necesitas al mes
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5" />
                  Te da opciones concretas de CÓMO generar ese ingreso, con pasos detallados
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5" />
                  Si tus finanzas van bien, te lo dirá y no te sugerirá ingresos extra innecesarios
                </li>
              </ul>
            </div>

            {/* Botón analizar */}
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full gap-2"
              size="lg"
            >
              {isAnalyzing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Brain className="h-5 w-5" />
              )}
              {isAnalyzing
                ? "Analizando tus finanzas con IA..."
                : plan
                  ? "Re-Analizar mis Finanzas"
                  : "Analizar mis Finanzas"}
            </Button>

            {/* Loading animation */}
            {isAnalyzing && (
              <div className="space-y-2 py-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Evaluando tasa de ahorro...
                </div>
                <Progress value={33} className="h-1.5" />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Detectando meses con déficit...
                </div>
                <Progress value={66} className="h-1.5" />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Generando sugerencias personalizadas...
                </div>
                <Progress value={90} className="h-1.5" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resultados del análisis */}
      {plan && (
        <>
          {/* Diagnóstico */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                Diagnóstico Financiero
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Badge de urgencia */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Situación actual</span>
                  <Badge className={cn("text-sm font-semibold px-3 py-1.5", URGENCY_BG[plan.diagnosis.urgency])}>
                    {URGENCY_LABELS[plan.diagnosis.urgency]} ({plan.diagnosis.urgencyScore}/100)
                  </Badge>
                </div>

                {/* Métricas clave */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Ingreso/mes</p>
                    <p className="text-lg font-bold text-emerald-600">
                      {formatCurrency(plan.diagnosis.monthlyIncome)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Gasto/mes</p>
                    <p className="text-lg font-bold text-rose-600">
                      {formatCurrency(plan.diagnosis.monthlyExpenses)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-xs text-muted-foreground">
                      {plan.diagnosis.monthlyDeficit > 0 ? "Déficit/mes" : "Superávit/mes"}
                    </p>
                    <p
                      className={cn(
                        "text-lg font-bold",
                        plan.diagnosis.monthlyDeficit > 0 ? "text-rose-600" : "text-emerald-600"
                      )}
                    >
                      {plan.diagnosis.monthlyDeficit > 0 ? "-" : "+"}
                      {formatCurrency(Math.abs(plan.diagnosis.monthlyDeficit))}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Tasa de ahorro</p>
                    <p
                      className={cn(
                        "text-lg font-bold",
                        plan.diagnosis.savingsRate >= 0.2
                          ? "text-emerald-600"
                          : plan.diagnosis.savingsRate >= 0
                            ? "text-amber-600"
                            : "text-rose-600"
                      )}
                    >
                      {Math.round(plan.diagnosis.savingsRate * 100)}%
                    </p>
                  </div>
                </div>

                {/* Info adicional */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    Tendencia: {plan.diagnosis.balanceTrend}
                  </Badge>
                  {plan.diagnosis.deficitMonths > 0 && (
                    <Badge variant="outline" className="text-[10px] text-rose-600 border-rose-200">
                      {plan.diagnosis.deficitMonths} meses con déficit consecutivo
                    </Badge>
                  )}
                </div>

                {/* Resultado principal */}
                {plan.diagnosis.needsExtraIncome ? (
                  <div className="rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-rose-500" />
                      <span className="text-sm font-bold text-rose-700 dark:text-rose-300">
                        Necesitas generar ingresos extra
                      </span>
                    </div>
                    <p className="text-sm text-rose-600 dark:text-rose-400 leading-relaxed">
                      Tus gastos superan tus ingresos. Necesitas generar al menos{" "}
                      <strong className="text-rose-700 dark:text-rose-300">
                        {formatCurrency(plan.diagnosis.extraIncomeNeeded)}/mes
                      </strong>{" "}
                      de ingreso adicional. Con un margen de seguridad del 20%, el objetivo es{" "}
                      <strong className="text-rose-700 dark:text-rose-300">
                        {formatCurrency(plan.diagnosis.extraIncomeWithSafety)}/mes
                      </strong>.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                        Tu situación financiera es estable
                      </span>
                    </div>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 leading-relaxed">
                      No necesitas generar ingresos extra en este momento. Tus ingresos cubren tus gastos.
                      Sigue controlando tus gastos y ahorrando para el futuro.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Solo mostrar sugerencias si necesita ingreso extra */}
          {plan.diagnosis.needsExtraIncome && (
            <>
              {/* Resumen del potencial */}
              <Card className="border-0 shadow-sm bg-gradient-to-r from-primary/5 to-violet-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Ingreso extra potencial</p>
                      <p className="text-2xl font-bold text-primary">
                        ~{formatCurrency(plan.totalPotentialIncome)}/mes
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Objetivo mínimo</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(plan.diagnosis.extraIncomeWithSafety)}/mes
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                      <span>Cobertura del objetivo</span>
                      <span>
                        {Math.round(
                          (plan.totalPotentialIncome / plan.diagnosis.extraIncomeWithSafety) * 100
                        )}
                        %
                      </span>
                    </div>
                    <Progress
                      value={Math.min(
                        (plan.totalPotentialIncome / plan.diagnosis.extraIncomeWithSafety) * 100,
                        100
                      )}
                      className="h-2"
                    />
                  </div>
                  {plan.stabilizationTimeline > 1 && (
                    <p className="text-[11px] text-muted-foreground mt-2">
                      Con este ingreso extra, podrías estabilizar tus finanzas en aproximadamente{" "}
                      <strong>{plan.stabilizationTimeline} meses</strong>.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Plan de acción semanal */}
              <ActionPlanTimeline plan={plan} />

              <Separator />

              {/* Sugerencias de ingreso */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  Sugerencias de Ingreso Extra ({plan.topSuggestions.length} opciones)
                </h3>
                {plan.topSuggestions.map((suggestion, idx) => (
                  <IncomeSuggestionCard key={suggestion.category} suggestion={suggestion} index={idx} />
                ))}
              </div>

              {/* Consejo final */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/40">
                      <Lightbulb className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold mb-1">Consejo importante</h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        No intentes hacer todo a la vez. Elige 1-2 opciones que mejor se adapten a tu
                        situación y enfoque tu energía ahí. Es mejor hacer una cosa bien que cinco a
                        medias. Una vez que domines una fuente de ingreso, puedes añadir otra.
                        Recuerda que este análisis se basa en tus datos históricos: si tu situación
                        cambia, vuelve a analizar.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
