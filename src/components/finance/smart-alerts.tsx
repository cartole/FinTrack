/**
 * ============================================
 * Alertas Inteligentes
 * ============================================
 * Componente que analiza las finanzas del usuario
 * y muestra alertas proactivas con recomendaciones.
 */

"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useFinanceStore } from "@/store/finance-store";
import { type SmartAlert, type AlertSeverity } from "@/lib/types";
import { generateSmartAlerts } from "@/lib/smart-alerts";
import {
  AlertTriangle,
  Info,
  Bell,
  Loader2,
  CheckCheck,
  Eye,
  ShieldAlert,
  CircleDot,
  ChevronDown,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Configuración visual por severidad */
const SEVERITY_CONFIG: Record<
  AlertSeverity,
  {
    borderColor: string;
    bgColor: string;
    textColor: string;
    badgeClass: string;
    icon: React.ReactNode;
    label: string;
  }
> = {
  critical: {
    borderColor: "border-l-red-500",
    bgColor: "bg-red-50 dark:bg-red-950/20",
    textColor: "text-red-700 dark:text-red-400",
    badgeClass:
      "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-800",
    icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
    label: "Crítica",
  },
  warning: {
    borderColor: "border-l-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
    textColor: "text-amber-700 dark:text-amber-400",
    badgeClass:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    label: "Advertencia",
  },
  info: {
    borderColor: "border-l-sky-500",
    bgColor: "bg-sky-50 dark:bg-sky-950/20",
    textColor: "text-sky-700 dark:text-sky-400",
    badgeClass:
      "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 border-sky-200 dark:border-sky-800",
    icon: <Info className="h-5 w-5 text-sky-500" />,
    label: "Información",
  },
};

/** Formatea fecha relativa */
function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Ahora mismo";
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export function SmartAlerts() {
  const { transactions, budgets, subscriptions, debts } = useFinanceStore();

  // ---- Estado local ----
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set());

  // ---- Contadores por severidad ----
  const counts = useMemo(() => {
    const result = { critical: 0, warning: 0, info: 0, unread: 0 };
    for (const alert of alerts) {
      result[alert.severity]++;
      if (!alert.isRead) result.unread++;
    }
    return result;
  }, [alerts]);

  // ---- Handlers ----
  const handleAnalyze = () => {
    setIsAnalyzing(true);
    // Simular delay de "análisis IA"
    setTimeout(() => {
      const generated = generateSmartAlerts(transactions, budgets, subscriptions, debts);
      setAlerts(generated);
      setIsAnalyzing(false);
      setHasAnalyzed(true);
    }, 1800);
  };

  const handleMarkAsRead = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, isRead: true } : a))
    );
  };

  const handleMarkAllAsRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
  };

  const toggleAction = (alertId: string) => {
    setExpandedActions((prev) => {
      const next = new Set(prev);
      if (next.has(alertId)) {
        next.delete(alertId);
      } else {
        next.add(alertId);
      }
      return next;
    });
  };

  // ---- Agrupar alertas por severidad ----
  const groupedAlerts = useMemo(() => {
    const groups: Record<AlertSeverity, SmartAlert[]> = {
      critical: [],
      warning: [],
      info: [],
    };
    for (const alert of alerts) {
      groups[alert.severity].push(alert);
    }
    return groups;
  }, [alerts]);

  return (
    <div className="space-y-6">
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10">
            <Bell className="h-6 w-6 text-sky-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Alertas Inteligentes</h2>
            <p className="text-sm text-muted-foreground">
              Análisis proactivo de tus finanzas
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {alerts.length > 0 && counts.unread > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleMarkAllAsRead}
            >
              <CheckCheck className="h-4 w-4" />
              Marcar todo leído
            </Button>
          )}
          <Button
            size="sm"
            className="gap-1.5"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldAlert className="h-4 w-4" />
            )}
            {isAnalyzing ? "Analizando..." : "Analizar Alertas"}
          </Button>
        </div>
      </div>

      {/* ---- Contadores de alertas ---- */}
      {hasAnalyzed && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="border shadow-sm">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">{counts.critical}</p>
                <p className="text-[11px] text-muted-foreground">Críticas</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border shadow-sm">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{counts.warning}</p>
                <p className="text-[11px] text-muted-foreground">Advertencia</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border shadow-sm">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-900/30">
                <Info className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-sky-600 dark:text-sky-400">{counts.info}</p>
                <p className="text-[11px] text-muted-foreground">Informativas</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ---- Loading animation ---- */}
      {isAnalyzing && (
        <Card className="border shadow-sm">
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/30">
              <Loader2 className="h-8 w-8 text-sky-500 animate-spin" />
            </div>
            <p className="mt-4 text-sm font-medium">Analizando tus finanzas...</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Revisando presupuestos, gastos, suscripciones y tendencias
            </p>
          </CardContent>
        </Card>
      )}

      {/* ---- Empty state ---- */}
      {hasAnalyzed && !isAnalyzing && alerts.length === 0 && (
        <Card className="border shadow-sm">
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCheck className="h-8 w-8 text-emerald-500" />
            </div>
            <p className="mt-4 text-sm font-medium">¡Todo en orden!</p>
            <p className="mt-1 text-xs text-muted-foreground">
              No se han detectado alertas en tus finanzas
            </p>
          </CardContent>
        </Card>
      )}

      {/* ---- Initial state (before first analysis) ---- */}
      {!hasAnalyzed && !isAnalyzing && (
        <Card className="border shadow-sm">
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm font-medium">Pulsa &quot;Analizar Alertas&quot; para comenzar</p>
            <p className="mt-1 text-xs text-muted-foreground">
              El sistema revisará tus presupuestos, gastos inusuales, saldo y suscripciones
            </p>
          </CardContent>
        </Card>
      )}

      {/* ---- Alertas agrupadas por severidad ---- */}
      {hasAnalyzed && !isAnalyzing && alerts.length > 0 && (
        <div className="max-h-[600px] overflow-y-auto overscroll-contain">
          <div className="space-y-6 pr-1">
            {(["critical", "warning", "info"] as AlertSeverity[]).map((severity) => {
              const group = groupedAlerts[severity];
              if (group.length === 0) return null;

              const config = SEVERITY_CONFIG[severity];

              return (
                <div key={severity}>
                  {/* Título del grupo */}
                  <div className="flex items-center gap-2 mb-3">
                    {config.icon}
                    <h3 className="text-sm font-semibold">{config.label}</h3>
                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0.5", config.badgeClass)}>
                      {group.length}
                    </Badge>
                  </div>

                  {/* Lista de alertas del grupo */}
                  <div className="space-y-2">
                    {group.map((alert) => (
                      <Card
                        key={alert.id}
                        className={cn(
                          "border-0 border-l-4 shadow-sm transition-opacity",
                          config.borderColor,
                          alert.isRead ? "opacity-60" : "",
                          config.bgColor
                        )}
                      >
                        <CardContent className="p-4">
                          {/* Top: icon, title, badge, mark read */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div className="mt-0.5 shrink-0">
                                {SEVERITY_CONFIG[alert.severity].icon}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold leading-tight">
                                  {alert.title}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                                  {alert.message}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                {formatRelativeTime(alert.createdAt)}
                              </span>
                              {!alert.isRead && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleMarkAsRead(alert.id)}
                                  title="Marcar como leída"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Action suggestion (expandable) */}
                          {alert.actionable && alert.action && (
                            <div className="mt-2.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                                onClick={() => toggleAction(alert.id)}
                              >
                                <Lightbulb className="h-3 w-3" />
                                {expandedActions.has(alert.id)
                                  ? "Ocultar sugerencia"
                                  : "Ver sugerencia de acción"}
                                <ChevronDown
                                  className={cn(
                                    "h-3 w-3 transition-transform",
                                    expandedActions.has(alert.id) && "rotate-180"
                                  )}
                                />
                              </Button>
                              {expandedActions.has(alert.id) && (
                                <div
                                  className={cn(
                                    "mt-1.5 rounded-lg border p-2.5 text-xs leading-relaxed",
                                    alert.severity === "critical" &&
                                      "border-red-200 bg-red-50/50 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300",
                                    alert.severity === "warning" &&
                                      "border-amber-200 bg-amber-50/50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300",
                                    alert.severity === "info" &&
                                      "border-sky-200 bg-sky-50/50 text-sky-800 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-300"
                                  )}
                                >
                                  <Lightbulb className="inline h-3 w-3 mr-1 -mt-0.5" />
                                  {alert.action}
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
