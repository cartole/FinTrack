/**
 * ============================================
 * Rastreador de Suscripciones - Componente UI
 * ============================================
 *
 * "use client" component with:
 * - Big summary card (shock factor: "Gastas X€/mes y Y€/año")
 * - Active subscriptions list with toggles
 * - Next renewals section (next 30 days)
 * - Category breakdown
 * - Add subscription dialog
 * - AI detection of subscriptions from transactions
 * - Annual cost breakdown per subscription
 *
 * All text in Spanish, currency in EUR.
 * Fully responsive for mobile, tablet and desktop.
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
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
import {
  CATEGORY_CONFIG,
  type BillingCycle,
  type TransactionCategory,
} from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/finance-utils";
import {
  calculateSubscriptionSummary,
  detectSubscriptionFromTransactions,
  getMonthlyEquivalent,
  getAnnualEquivalent,
  type DetectedSubscription,
} from "@/lib/subscription-tracker";
import {
  Repeat,
  Plus,
  Trash2,
  Sparkles,
  Calendar,
  CreditCard,
  TrendingUp,
  Loader2,
  Eye,
  EyeOff,
  Flame,
  PiggyBank,
  X,
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

/** Form state for adding a subscription */
interface SubFormData {
  name: string;
  amount: string;
  billingCycle: BillingCycle;
  nextBillingDate: string;
  category: TransactionCategory;
}

const emptyForm: SubFormData = {
  name: "",
  amount: "",
  billingCycle: "mensual",
  nextBillingDate: new Date().toISOString().split("T")[0],
  category: "suscripciones",
};

const CYCLE_LABELS: Record<BillingCycle, string> = {
  mensual: "Mensual",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
};

const CYCLE_PERIOD: Record<BillingCycle, string> = {
  mensual: "mes",
  trimestral: "trimestre",
  semestral: "semestre",
  anual: "año",
};

const CYCLE_BADGE_COLORS: Record<BillingCycle, string> = {
  mensual:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  trimestral:
    "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300",
  semestral:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  anual:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300",
};

export function SubscriptionTracker() {
  const {
    subscriptions,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    transactions,
  } = useFinanceStore();

  // Dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState<SubFormData>(emptyForm);

  // AI detection state
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedSubs, setDetectedSubs] = useState<DetectedSubscription[]>([]);
  const [showDetection, setShowDetection] = useState(false);

  // Computed summary
  const summary = useMemo(
    () => calculateSubscriptionSummary(subscriptions),
    [subscriptions]
  );

  const activeSubs = subscriptions.filter((s) => s.isActive);
  const inactiveSubs = subscriptions.filter((s) => !s.isActive);

  // Handlers
  const handleOpenAdd = (prefill?: Partial<SubFormData>) => {
    setFormData({ ...emptyForm, ...prefill });
    setIsAddDialogOpen(true);
  };

  const handleSaveSubscription = () => {
    const data = {
      name: formData.name,
      amount: parseFloat(formData.amount) || 0,
      billingCycle: formData.billingCycle,
      nextBillingDate: new Date(formData.nextBillingDate).toISOString(),
      category: formData.category,
      isActive: true,
      startDate: new Date().toISOString(),
    };

    addSubscription(data);
    setIsAddDialogOpen(false);
    setFormData(emptyForm);
  };

  const handleToggleActive = (id: string, currentActive: boolean) => {
    updateSubscription(id, { isActive: !currentActive });
  };

  const handleDeleteSubscription = (id: string) => {
    deleteSubscription(id);
  };

  const handleDetectSubscriptions = () => {
    setIsDetecting(true);
    setTimeout(() => {
      const detected = detectSubscriptionFromTransactions(transactions);
      setDetectedSubs(detected);
      setShowDetection(true);
      setIsDetecting(false);
    }, 1500);
  };

  const handleAddDetected = (detected: DetectedSubscription) => {
    addSubscription({
      name: detected.description,
      amount: detected.amount,
      billingCycle: detected.suggestedCycle,
      nextBillingDate: new Date(
        new Date().setMonth(new Date().getMonth() + 1)
      ).toISOString(),
      category: detected.category as TransactionCategory,
      isActive: true,
      startDate: new Date().toISOString(),
    });
    setDetectedSubs((prev) => prev.filter((d) => d !== detected));
  };

  // Next 30 days renewals
  const upcomingRenewals = summary.nextRenewals.filter(
    (r) => r.daysUntil <= 30
  );

  // Potential savings from inactive subs
  const inactiveMonthlySavings = inactiveSubs.reduce(
    (sum, s) => sum + getMonthlyEquivalent(s.amount, s.billingCycle),
    0
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-pink-500/10 shrink-0">
            <Repeat className="h-5 w-5 sm:h-6 sm:w-6 text-pink-500" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold">Rastreador de Suscripciones</h2>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              Controla todos tus pagos recurrentes
            </p>
          </div>
        </div>
        <Button size="sm" onClick={() => handleOpenAdd()} className="gap-1.5 shrink-0">
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Añadir</span>
        </Button>
      </div>

      {/* Top Row: Summary + Renewals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Big Summary Card - Shock Factor */}
        <Card className="lg:col-span-2 border shadow-sm bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/20 overflow-hidden">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
              {/* Big numbers */}
              <div className="text-center sm:text-left flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Gastas en suscripciones</p>
                <div className="flex items-baseline justify-center sm:justify-start gap-1 flex-wrap">
                  <span className="text-3xl sm:text-4xl font-bold text-rose-600">
                    {formatCurrency(summary.totalMonthly)}
                  </span>
                  <span className="text-base sm:text-lg text-muted-foreground">/mes</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-1">
                  <span className="text-lg sm:text-2xl font-semibold text-rose-500">
                    {formatCurrency(summary.totalAnnual)}
                  </span>
                  <span className="text-xs sm:text-sm text-muted-foreground">/año</span>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full sm:w-auto">
                <div className="rounded-lg bg-white/60 dark:bg-black/20 p-2.5 sm:p-3 text-center">
                  <p className="text-lg sm:text-xl font-bold text-rose-600">{summary.activeCount}</p>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground">Activas</p>
                </div>
                <div className="rounded-lg bg-white/60 dark:bg-black/20 p-2.5 sm:p-3 text-center">
                  <p className="text-lg sm:text-xl font-bold text-muted-foreground">{inactiveSubs.length}</p>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground">Inactivas</p>
                </div>
                <div className="rounded-lg bg-white/60 dark:bg-black/20 p-2.5 sm:p-3 text-center">
                  <p className="text-lg sm:text-xl font-bold text-amber-600">{upcomingRenewals.length}</p>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground">Próximas 30d</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Renewals (next 30 days) */}
        <Card className="border shadow-sm overflow-hidden">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-semibold flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-amber-500" />
              Próximas Renovaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {upcomingRenewals.length === 0 ? (
              <div className="text-center py-4">
                <Calendar className="mx-auto h-6 w-6 text-muted-foreground/40 mb-1" />
                <p className="text-[10px] text-muted-foreground">Sin renovaciones próximas</p>
              </div>
            ) : (
              <div className="max-h-36 sm:max-h-44 overflow-y-auto overscroll-contain">
                <div className="space-y-1.5">
                  {upcomingRenewals.map(({ subscription, daysUntil }) => (
                    <div
                      key={subscription.id}
                      className="flex items-center gap-2 rounded-lg border p-2"
                    >
                      <div
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                          daysUntil <= 3
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300"
                            : daysUntil <= 7
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                              : "bg-muted text-muted-foreground"
                        )}
                      >
                        {daysUntil}d
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium truncate">{subscription.name}</p>
                        <p className="text-[9px] text-muted-foreground">
                          {formatDate(subscription.nextBillingDate)}
                        </p>
                      </div>
                      <span className="text-[11px] font-bold shrink-0 whitespace-nowrap">
                        {formatCurrency(subscription.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Second Row: AI Detection + Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* AI Detection */}
        <Card className="border shadow-sm overflow-hidden">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-semibold flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Detectar Suscripciones IA
            </CardTitle>
            <CardDescription className="text-[10px]">
              Analiza tus transacciones para encontrar pagos recurrentes
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2.5">
            <Button
              variant="outline"
              onClick={handleDetectSubscriptions}
              disabled={isDetecting}
              className="w-full gap-2 h-9 text-xs"
            >
              {isDetecting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {isDetecting
                ? "Analizando..."
                : "Detectar suscripciones automáticamente"}
            </Button>

            {showDetection && (
              <div className="space-y-2">
                {detectedSubs.length === 0 ? (
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-[10px] text-muted-foreground">
                      No se han detectado nuevas suscripciones.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-40 overflow-y-auto overscroll-contain">
                    <div className="space-y-1.5">
                      {detectedSubs.map((det, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 rounded-lg border p-2 overflow-hidden"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium truncate">{det.description}</p>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-bold">{formatCurrency(det.amount)}</span>
                              <Badge variant="secondary" className="text-[8px] px-1 py-0 h-4">
                                {CYCLE_LABELS[det.suggestedCycle]}
                              </Badge>
                              <Badge
                                className={cn(
                                  "text-[8px] px-1 py-0 h-4",
                                  det.confidence >= 75
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50"
                                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/50"
                                )}
                              >
                                {det.confidence}%
                              </Badge>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-[10px] shrink-0"
                            onClick={() => handleAddDetected(det)}
                          >
                            + Añadir
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetection(false)}
                  className="w-full text-[10px] h-7"
                >
                  Cerrar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="border shadow-sm overflow-hidden">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-semibold flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              Desglose por Categoría
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {Object.keys(summary.byCategory).length === 0 ? (
              <div className="text-center py-4">
                <TrendingUp className="mx-auto h-6 w-6 text-muted-foreground/40 mb-1" />
                <p className="text-[10px] text-muted-foreground">Sin datos de categorías</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {Object.entries(summary.byCategory).map(([category, data]) => {
                  const catConfig = CATEGORY_CONFIG[category as TransactionCategory];
                  const percentage = summary.totalMonthly > 0 ? (data.monthly / summary.totalMonthly) * 100 : 0;

                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                          <div
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: catConfig?.color ?? "#6b7280" }}
                          />
                          <span className="text-[11px] font-medium truncate">{catConfig?.label ?? category}</span>
                          <span className="text-[9px] text-muted-foreground shrink-0">({data.count})</span>
                        </div>
                        <div className="text-right whitespace-nowrap shrink-0">
                          <span className="text-[11px] font-bold">{formatCurrency(data.monthly)}/m</span>
                          <span className="text-[9px] text-muted-foreground ml-1">({Math.round(percentage)}%)</span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: catConfig?.color ?? "#6b7280",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Inactive savings banner */}
      {inactiveMonthlySavings > 0 && (
        <Card className="border shadow-sm bg-emerald-50 dark:bg-emerald-950/20 overflow-hidden">
          <CardContent className="p-3 flex items-center gap-3">
            <PiggyBank className="h-5 w-5 text-emerald-600 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                Ahorras {formatCurrency(inactiveMonthlySavings)}/mes en suscripciones inactivas
              </p>
              <p className="text-[10px] text-muted-foreground">
                {formatCurrency(inactiveMonthlySavings * 12)}/año — ¡Bien hecho cancelando lo que no usas!
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Subscriptions List */}
      <Card className="border shadow-sm overflow-hidden">
        <CardHeader className="pb-2 px-4 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xs font-semibold flex items-center gap-2">
                <CreditCard className="h-3.5 w-3.5" />
                Suscripciones Activas
              </CardTitle>
              <CardDescription className="text-[10px] mt-0.5">
                {activeSubs.length} activa{activeSubs.length !== 1 ? "s" : ""} ·{" "}
                {inactiveSubs.length} inactiva{inactiveSubs.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {subscriptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Repeat className="mx-auto h-10 w-10 mb-2 opacity-30" />
              <p className="text-sm font-medium">Sin suscripciones</p>
              <p className="text-xs">
                Añade una suscripción para empezar a rastrear
              </p>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto overscroll-contain">
              <div className="space-y-2">
                {activeSubs.map((sub) => {
                  const annualCost = getAnnualEquivalent(sub.amount, sub.billingCycle);
                  const monthlyCost = getMonthlyEquivalent(sub.amount, sub.billingCycle);

                  return (
                    <div
                      key={sub.id}
                      className="flex items-center gap-2 sm:gap-3 rounded-lg border p-2.5 sm:p-3 overflow-hidden"
                    >
                      {/* Name and details */}
                      <div className="flex-1 min-w-0 space-y-0.5 overflow-hidden">
                        <div className="flex items-center gap-1.5 flex-wrap overflow-hidden">
                          <span className="text-xs sm:text-sm font-medium truncate max-w-[140px] sm:max-w-none">
                            {sub.name}
                          </span>
                          <Badge
                            className={cn("text-[8px] px-1 py-0 h-4 shrink-0", CYCLE_BADGE_COLORS[sub.billingCycle])}
                          >
                            {CYCLE_LABELS[sub.billingCycle]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-[9px] sm:text-[10px] text-muted-foreground flex-wrap">
                          <span className="whitespace-nowrap font-medium">
                            {formatCurrency(sub.amount)}/{CYCLE_PERIOD[sub.billingCycle]}
                          </span>
                          <span className="whitespace-nowrap">≈ {formatCurrency(monthlyCost)}/mes</span>
                        </div>
                        <p className="text-[9px] text-muted-foreground truncate hidden sm:block">
                          Próximo cobro: {formatDate(sub.nextBillingDate)} · {formatCurrency(annualCost)}/año
                        </p>
                      </div>

                      {/* Annual cost badge - visible on desktop */}
                      <div className="hidden sm:flex flex-col items-end shrink-0">
                        <span className="text-xs font-bold whitespace-nowrap">{formatCurrency(annualCost)}/año</span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Switch
                          checked={sub.isActive}
                          onCheckedChange={() => handleToggleActive(sub.id, sub.isActive)}
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-rose-500 hover:text-rose-600">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar suscripción?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Se eliminará &quot;{sub.name}&quot; ({formatCurrency(sub.amount)}/mes). Esta acción no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteSubscription(sub.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  );
                })}

                {/* Inactive subscriptions */}
                {inactiveSubs.length > 0 && (
                  <>
                    <Separator className="my-2" />
                    <p className="text-[10px] text-muted-foreground font-medium px-1">
                      Inactivas
                    </p>
                    {inactiveSubs.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center gap-2 sm:gap-3 rounded-lg border border-dashed p-2.5 sm:p-3 opacity-60"
                      >
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium truncate line-through max-w-[140px] sm:max-w-none">
                              {sub.name}
                            </span>
                            <Badge variant="secondary" className="text-[8px] px-1 py-0 h-4 shrink-0">
                              Cancelada
                            </Badge>
                          </div>
                          <p className="text-[9px] text-muted-foreground truncate">
                            {formatCurrency(sub.amount)}/{CYCLE_PERIOD[sub.billingCycle]}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Switch
                            checked={sub.isActive}
                            onCheckedChange={() => handleToggleActive(sub.id, sub.isActive)}
                          />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-rose-500 hover:text-rose-600">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar suscripción?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Se eliminará &quot;{sub.name}&quot;. Esta acción no se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteSubscription(sub.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Annual Cost Breakdown - horizontal bars */}
      {activeSubs.length > 1 && (
        <Card className="border shadow-sm overflow-hidden">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-semibold flex items-center gap-2">
              <Flame className="h-3.5 w-3.5 text-rose-500" />
              Coste Anual por Suscripción
            </CardTitle>
            <CardDescription className="text-[10px]">
              Lo que realmente gastas al año en cada una
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-2.5">
              {[...activeSubs]
                .sort((a, b) => {
                  const aAnnual = getAnnualEquivalent(a.amount, a.billingCycle);
                  const bAnnual = getAnnualEquivalent(b.amount, b.billingCycle);
                  return bAnnual - aAnnual;
                })
                .map((sub) => {
                  const annualCost = getAnnualEquivalent(sub.amount, sub.billingCycle);
                  const maxAnnual = Math.max(
                    ...activeSubs.map((s) => getAnnualEquivalent(s.amount, s.billingCycle))
                  );
                  const widthPercent = maxAnnual > 0 ? (annualCost / maxAnnual) * 100 : 0;

                  return (
                    <div key={sub.id} className="space-y-1 min-w-0 overflow-hidden">
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <span className="text-[11px] font-medium truncate min-w-0">
                          {sub.name}
                        </span>
                        <span className="text-[11px] font-bold shrink-0 whitespace-nowrap text-rose-600">
                          {formatCurrency(annualCost)}/año
                        </span>
                      </div>
                      <div className="h-4 rounded-full bg-muted overflow-hidden min-w-0">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all overflow-hidden whitespace-nowrap"
                          style={{ width: `${Math.max(widthPercent, 8)}%` }}
                        >
                          {widthPercent > 25 && (
                            <span className="text-[8px] font-bold text-white px-1.5 truncate inline-block">
                              {formatCurrency(annualCost)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Subscription Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[440px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Añadir Suscripción</DialogTitle>
            <DialogDescription>
              Registra un nuevo pago recurrente
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[70vh] overflow-y-auto overscroll-contain pr-2">
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-xs">Nombre</Label>
                <Input
                  placeholder="Ej: Netflix, Spotify, Gimnasio..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Importe (€)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="12.99"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="text-lg font-semibold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Ciclo de facturación</Label>
                  <Select
                    value={formData.billingCycle}
                    onValueChange={(v) => setFormData({ ...formData, billingCycle: v as BillingCycle })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensual">Mensual</SelectItem>
                      <SelectItem value="trimestral">Trimestral</SelectItem>
                      <SelectItem value="semestral">Semestral</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Monthly/Annual equivalent preview */}
              {formData.amount && (
                <div className="rounded-lg bg-muted/50 p-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Equivalente</span>
                  <div className="text-right">
                    <span className="text-sm font-bold">
                      {formatCurrency(getMonthlyEquivalent(parseFloat(formData.amount) || 0, formData.billingCycle))}/mes
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {formatCurrency(getAnnualEquivalent(parseFloat(formData.amount) || 0, formData.billingCycle))}/año
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs">Próxima fecha de cobro</Label>
                <Input
                  type="date"
                  value={formData.nextBillingDate}
                  onChange={(e) => setFormData({ ...formData, nextBillingDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Categoría</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v as TransactionCategory })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(CATEGORY_CONFIG) as [TransactionCategory, (typeof CATEGORY_CONFIG)[TransactionCategory]][]).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: config.color }} />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleSaveSubscription}
                disabled={!formData.name || !formData.amount}
                className="w-full gap-2"
              >
                <Plus className="h-4 w-4" />
                Añadir Suscripción
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
