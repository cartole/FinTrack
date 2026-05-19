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
import { ScrollArea } from "@/components/ui/scroll-area";
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
  AlertCircle,
  Eye,
  EyeOff,
  ChevronRight,
  Loader2,
  CreditCard,
  TrendingUp,
} from "lucide-react";
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
    // Simulate "AI analysis" delay
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
    // Remove from detected list
    setDetectedSubs((prev) => prev.filter((d) => d !== detected));
  };

  // Next 30 days renewals
  const upcomingRenewals = summary.nextRenewals.filter(
    (r) => r.daysUntil <= 30
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500/10">
          <Repeat className="h-6 w-6 text-pink-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Rastreador de Suscripciones</h2>
          <p className="text-sm text-muted-foreground">
            Controla todos tus pagos recurrentes
          </p>
        </div>
      </div>

      {/* Big Summary Card - Shock Factor */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/20">
        <CardContent className="p-6 text-center space-y-2">
          <p className="text-sm text-muted-foreground">Gastas en suscripciones</p>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold text-rose-600">
              {formatCurrency(summary.totalMonthly)}
            </span>
            <span className="text-lg text-muted-foreground">/mes</span>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-2xl font-semibold text-rose-500">
              {formatCurrency(summary.totalAnnual)}
            </span>
            <span className="text-sm text-muted-foreground">/año</span>
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            {summary.activeCount} suscripción
            {summary.activeCount !== 1 ? "es" : ""} activa
            {summary.activeCount !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>

      {/* AI Detection */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Detectar Suscripciones IA
          </CardTitle>
          <CardDescription className="text-xs">
            Analiza tus transacciones para encontrar pagos recurrentes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            onClick={handleDetectSubscriptions}
            disabled={isDetecting}
            className="w-full gap-2"
          >
            {isDetecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isDetecting
              ? "Analizando transacciones..."
              : "Detectar suscripciones automáticamente"}
          </Button>

          {showDetection && (
            <div className="space-y-2">
              {detectedSubs.length === 0 ? (
                <div className="rounded-lg bg-muted/50 p-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    No se han detectado nuevas suscripciones en tus transacciones.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Se han encontrado {detectedSubs.length} posible
                    {detectedSubs.length !== 1 ? "s" : ""} suscripción
                    {detectedSubs.length !== 1 ? "es" : ""}:
                  </p>
                  <ScrollArea className="max-h-48">
                    <div className="space-y-2 pr-2">
                      {detectedSubs.map((det, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 rounded-lg border p-3"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">
                              {det.description}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-bold">
                                {formatCurrency(det.amount)}
                              </span>
                              <Badge
                                variant="secondary"
                                className="text-[9px] px-1"
                              >
                                {CYCLE_LABELS[det.suggestedCycle]}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">
                                {det.occurrences} pagos detectados
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge
                              className={cn(
                                "text-[9px] px-1.5",
                                det.confidence >= 75
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50"
                                  : det.confidence >= 50
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50"
                                    : "bg-muted text-muted-foreground"
                              )}
                            >
                              {det.confidence}% confianza
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-[10px]"
                              onClick={() => handleAddDetected(det)}
                            >
                              + Añadir
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetection(false)}
                className="w-full text-xs"
              >
                Cerrar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next Renewals (next 30 days) */}
      {upcomingRenewals.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-amber-500" />
              Próximas Renovaciones
            </CardTitle>
            <CardDescription className="text-xs">
              Renovaciones en los próximos 30 días
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-48">
              <div className="space-y-2 pr-2">
                {upcomingRenewals.map(({ subscription, daysUntil }) => (
                  <div
                    key={subscription.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
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
                      <p className="text-xs font-medium truncate">
                        {subscription.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDate(subscription.nextBillingDate)}
                      </p>
                    </div>
                    <span className="text-xs font-bold shrink-0">
                      {formatCurrency(subscription.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Category Breakdown */}
      {Object.keys(summary.byCategory).length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Desglose por Categoría
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(summary.byCategory).map(([category, data]) => {
                const catConfig =
                  CATEGORY_CONFIG[category as TransactionCategory];
                const percentage =
                  summary.totalMonthly > 0
                    ? (data.monthly / summary.totalMonthly) * 100
                    : 0;

                return (
                  <div key={category} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{
                            backgroundColor: catConfig?.color ?? "#6b7280",
                          }}
                        />
                        <span className="text-xs font-medium">
                          {catConfig?.label ?? category}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          ({data.count})
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold">
                          {formatCurrency(data.monthly)}/mes
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-1">
                          ({Math.round(percentage)}%)
                        </span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
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
          </CardContent>
        </Card>
      )}

      {/* Active Subscriptions List */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Suscripciones Activas
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {activeSubs.length} activa{activeSubs.length !== 1 ? "s" : ""} ·{" "}
                {inactiveSubs.length} inactiva
                {inactiveSubs.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => handleOpenAdd()} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Añadir
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Repeat className="mx-auto h-10 w-10 mb-2 opacity-30" />
              <p className="text-sm font-medium">Sin suscripciones</p>
              <p className="text-xs">
                Añade una suscripción para empezar a rastrear
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-96">
              <div className="space-y-2 pr-2">
                {activeSubs.map((sub) => {
                  const annualCost = getAnnualEquivalent(
                    sub.amount,
                    sub.billingCycle
                  );
                  const monthlyCost = getMonthlyEquivalent(
                    sub.amount,
                    sub.billingCycle
                  );

                  return (
                    <div
                      key={sub.id}
                      className="flex items-center gap-3 rounded-xl border p-3"
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium truncate">
                            {sub.name}
                          </span>
                          <Badge
                            className={cn(
                              "text-[9px] px-1.5",
                              CYCLE_BADGE_COLORS[sub.billingCycle]
                            )}
                          >
                            {CYCLE_LABELS[sub.billingCycle]}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="text-[9px] px-1.5"
                          >
                            {CATEGORY_CONFIG[sub.category]?.label ?? sub.category}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span>
                            {formatCurrency(sub.amount)}/
                            {sub.billingCycle === "mensual"
                              ? "mes"
                              : sub.billingCycle === "trimestral"
                                ? "trimestre"
                                : sub.billingCycle === "semestral"
                                  ? "semestre"
                                  : "año"}
                          </span>
                          <span>≈ {formatCurrency(monthlyCost)}/mes</span>
                          <span>{formatCurrency(annualCost)}/año</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Próximo cobro: {formatDate(sub.nextBillingDate)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Switch
                          checked={sub.isActive}
                          onCheckedChange={() =>
                            handleToggleActive(sub.id, sub.isActive)
                          }
                          className="scale-75"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-rose-500 hover:text-rose-600"
                          onClick={() => handleDeleteSubscription(sub.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
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
                        className="flex items-center gap-3 rounded-xl border border-dashed p-3 opacity-60"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate line-through">
                              {sub.name}
                            </span>
                            <Badge
                              variant="secondary"
                              className="text-[9px] px-1.5"
                            >
                              Cancelada
                            </Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            {formatCurrency(sub.amount)}/
                            {sub.billingCycle === "mensual"
                              ? "mes"
                              : sub.billingCycle === "trimestral"
                                ? "trimestre"
                                : sub.billingCycle === "semestral"
                                  ? "semestre"
                                  : "año"}{" "}
                            · {formatCurrency(getAnnualEquivalent(sub.amount, sub.billingCycle))}/año
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Switch
                            checked={sub.isActive}
                            onCheckedChange={() =>
                              handleToggleActive(sub.id, sub.isActive)
                            }
                            className="scale-75"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-rose-500 hover:text-rose-600"
                            onClick={() => handleDeleteSubscription(sub.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Annual Cost Breakdown */}
      {activeSubs.length > 1 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Coste Anual por Suscripción
            </CardTitle>
            <CardDescription className="text-xs">
              Lo que realmente gastas al año en cada una
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...activeSubs]
                .sort((a, b) => {
                  const aAnnual = getAnnualEquivalent(a.amount, a.billingCycle);
                  const bAnnual = getAnnualEquivalent(b.amount, b.billingCycle);
                  return bAnnual - aAnnual;
                })
                .map((sub) => {
                  const annualCost = getAnnualEquivalent(
                    sub.amount,
                    sub.billingCycle
                  );
                  const maxAnnual = Math.max(
                    ...activeSubs.map((s) =>
                      getAnnualEquivalent(s.amount, s.billingCycle)
                    )
                  );
                  const widthPercent =
                    maxAnnual > 0 ? (annualCost / maxAnnual) * 100 : 0;

                  return (
                    <div key={sub.id} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium truncate max-w-[60%]">
                          {sub.name}
                        </span>
                        <span className="text-xs font-bold shrink-0">
                          {formatCurrency(annualCost)}/año
                        </span>
                      </div>
                      <div className="h-5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full flex items-center justify-end pr-2 bg-pink-500 transition-all"
                          style={{ width: `${Math.max(widthPercent, 8)}%` }}
                        >
                          {widthPercent > 20 && (
                            <span className="text-[9px] font-bold text-white">
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

          <ScrollArea className="max-h-[70vh] pr-2">
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-xs">Nombre</Label>
                <Input
                  placeholder="Ej: Netflix, Spotify, Gimnasio..."
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
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
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    className="text-lg font-semibold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Ciclo de facturación</Label>
                  <Select
                    value={formData.billingCycle}
                    onValueChange={(v) =>
                      setFormData({
                        ...formData,
                        billingCycle: v as BillingCycle,
                      })
                    }
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
                  <span className="text-xs text-muted-foreground">
                    Equivalente
                  </span>
                  <div className="text-right">
                    <span className="text-sm font-bold">
                      {formatCurrency(
                        getMonthlyEquivalent(
                          parseFloat(formData.amount) || 0,
                          formData.billingCycle
                        )
                      )}
                      /mes
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {formatCurrency(
                        getAnnualEquivalent(
                          parseFloat(formData.amount) || 0,
                          formData.billingCycle
                        )
                      )}
                      /año
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs">Próxima fecha de cobro</Label>
                <Input
                  type="date"
                  value={formData.nextBillingDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nextBillingDate: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Categoría</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      category: v as TransactionCategory,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.entries(CATEGORY_CONFIG) as [
                        TransactionCategory,
                        (typeof CATEGORY_CONFIG)[TransactionCategory],
                      ][]
                    ).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: config.color }}
                          />
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
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
