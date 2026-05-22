/**
 * ============================================
 * Configuración - Componente UI
 * ============================================
 *
 * "use client" component with:
 * - Perfil Personal (name, income, savings target, risk profile)
 * - Fiscalidad (tax settings)
 * - Economía (economy settings)
 * - Visualización (display settings, theme, compact mode)
 * - Notificaciones y Alertas (thresholds, warnings)
 * - Metas de Ahorro (selected goal, auto-allocation)
 * - Privacidad (data retention)
 * - Datos (data management: reset, export, import)
 * - Información de la app
 *
 * All text in Spanish, professional emerald/dark theme.
 */

"use client";

import { useState, useRef, useEffect } from "react";
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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useFinanceStore } from "@/store/finance-store";
import { formatCurrency } from "@/lib/finance-utils";
import { cn } from "@/lib/utils";
import {
  Settings2,
  RotateCcw,
  Download,
  Upload,
  Info,
  Percent,
  Landmark,
  Eye,
  Database,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Trash2,
  User,
  Wallet,
  Target,
  Bell,
  Lock,
  Sun,
  Moon,
  Monitor,
  PiggyBank,
  TrendingUp,
  Shield,
  Zap,
} from "lucide-react";

export function Settings() {
  const {
    settings,
    updateSettings,
    resetSettings,
    resetAllData,
    exportData,
    importData,
    savingsGoals,
    transactions,
  } = useFinanceStore();

  // Hydration-safe mount check
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Toast-like feedback state
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Import state
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset data dialog state
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3000);
  };

  // ---- Handlers ----

  const handleExport = () => {
    try {
      const json = exportData();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fintrack-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showFeedback("success", "Datos exportados correctamente");
    } catch {
      showFeedback("error", "Error al exportar los datos");
    }
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const success = importData(text);
      if (success) {
        showFeedback("success", "Datos importados correctamente");
      } else {
        showFeedback("error", "El archivo no tiene un formato válido");
      }
    } catch {
      showFeedback("error", "Error al leer el archivo");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleResetSettings = () => {
    resetSettings();
    showFeedback("success", "Configuración restablecida");
  };

  const handleResetAllData = () => {
    // First reset the Zustand store state
    resetAllData();
    // Close the dialog
    setResetDialogOpen(false);
    // Clear localStorage completely to ensure old data is gone
    try {
      localStorage.removeItem("fintrack-storage");
    } catch {}
    // Force page reload to start fresh
    window.location.reload();
  };

  // Clamped update helpers
  const clampAndUpdate = (key: keyof typeof settings, value: number, min: number, max: number) => {
    const clamped = Math.min(Math.max(value, min), max);
    updateSettings({ [key]: clamped });
  };

  // Computed: current month income and expenses
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthTransactions = transactions.filter(
    (t) => t.date.startsWith(currentMonth)
  );
  const monthIncome = monthTransactions
    .filter((t) => t.type === "ingreso")
    .reduce((s, t) => s + t.amount, 0);
  const monthExpenses = monthTransactions
    .filter((t) => t.type === "gasto")
    .reduce((s, t) => s + t.amount, 0);
  const currentSavingsRate =
    monthIncome > 0
      ? Math.round(((monthIncome - monthExpenses) / monthIncome) * 100)
      : 0;

  // Theme icon
  const getThemeIcon = () => {
    if (settings.theme === "light") return Sun;
    if (settings.theme === "dark") return Moon;
    return Monitor;
  };
  const ThemeIcon = getThemeIcon();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
          <Settings2 className="h-6 w-6 text-emerald-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Configuración</h2>
          <p className="text-sm text-muted-foreground">
            Personaliza la aplicación a tu medida
          </p>
        </div>
      </div>

      {/* Feedback toast */}
      {feedback && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg p-3 text-sm font-medium transition-all",
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
              : "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
          )}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          )}
          {feedback.message}
        </div>
      )}

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />

        <div className="space-y-6">

          {/* ============================================ */}
          {/* PERFIL PERSONAL */}
          {/* ============================================ */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-500" />
                Perfil Personal
              </CardTitle>
              <CardDescription className="text-xs">
                Tus datos personales para cálculos personalizados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Nombre</Label>
                  <Input
                    type="text"
                    placeholder="Tu nombre"
                    value={settings.userName}
                    onChange={(e) =>
                      updateSettings({ userName: e.target.value })
                    }
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Para personalizar la experiencia
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">
                    Ingresos mensuales netos
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      step={100}
                      value={settings.monthlyIncome || ""}
                      onChange={(e) =>
                        updateSettings({
                          monthlyIncome: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="2500"
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      €
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Tus ingresos netos mensuales (después de IRPF)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">
                    Objetivo de tasa de ahorro
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      max={80}
                      step={5}
                      value={settings.savingsRateTarget}
                      onChange={(e) =>
                        clampAndUpdate(
                          "savingsRateTarget",
                          parseFloat(e.target.value) || 0,
                          0,
                          80
                        )
                      }
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      %
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-muted-foreground">
                        Tasa actual: {currentSavingsRate}%
                      </span>
                      <span className={cn(
                        "font-medium",
                        currentSavingsRate >= settings.savingsRateTarget
                          ? "text-emerald-600"
                          : "text-amber-600"
                      )}>
                        Objetivo: {settings.savingsRateTarget}%
                      </span>
                    </div>
                    <Progress
                      value={Math.min(100, (currentSavingsRate / settings.savingsRateTarget) * 100)}
                      className="h-1.5"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">
                    Perfil de riesgo para inversiones
                  </Label>
                  <Select
                    value={settings.riskProfile}
                    onValueChange={(v) =>
                      updateSettings({
                        riskProfile: v as "conservador" | "moderado" | "agresivo",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservador">
                        <div className="flex items-center gap-2">
                          <Shield className="h-3.5 w-3.5 text-blue-500" />
                          <div>
                            <span className="font-medium">Conservador</span>
                            <p className="text-[10px] text-muted-foreground">
                              Depósitos, bonos, renta fija
                            </p>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="moderado">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
                          <div>
                            <span className="font-medium">Moderado</span>
                            <p className="text-[10px] text-muted-foreground">
                              Mix bonos y acciones (ETFs)
                            </p>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="agresivo">
                        <div className="flex items-center gap-2">
                          <Zap className="h-3.5 w-3.5 text-rose-500" />
                          <div>
                            <span className="font-medium">Agresivo</span>
                            <p className="text-[10px] text-muted-foreground">
                              Acciones, mercados emergentes
                            </p>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">
                    Afecta las recomendaciones de inversión
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ============================================ */}
          {/* FISCALIDAD */}
          {/* ============================================ */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Percent className="h-4 w-4 text-rose-500" />
                Fiscalidad
              </CardTitle>
              <CardDescription className="text-xs">
                Configura los tipos de retención aplicables en España
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">
                    Retención sobre rendimientos del capital
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      max={30}
                      step={1}
                      value={settings.withholdingTaxRate}
                      onChange={(e) =>
                        clampAndUpdate(
                          "withholdingTaxRate",
                          parseFloat(e.target.value) || 0,
                          0,
                          30
                        )
                      }
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      %
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Rango: 0% - 30% · Por defecto: 19%
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">
                    Retención sobre plusvalías
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      max={30}
                      step={1}
                      value={settings.capitalGainsTaxRate}
                      onChange={(e) =>
                        clampAndUpdate(
                          "capitalGainsTaxRate",
                          parseFloat(e.target.value) || 0,
                          0,
                          30
                        )
                      }
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      %
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Rango: 0% - 30% · Por defecto: 19%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ============================================ */}
          {/* ECONOMÍA */}
          {/* ============================================ */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Landmark className="h-4 w-4 text-amber-500" />
                Economía
              </CardTitle>
              <CardDescription className="text-xs">
                Parámetros macroeconómicos para cálculos y estimaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">
                    Inflación estimada
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      step={0.1}
                      value={settings.inflationRate}
                      onChange={(e) =>
                        clampAndUpdate(
                          "inflationRate",
                          parseFloat(e.target.value) || 0,
                          0,
                          10
                        )
                      }
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      %
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Rango: 0% - 10%
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">
                    Meses fondo de emergencia
                  </Label>
                  <Select
                    value={String(settings.emergencyFundMonths)}
                    onValueChange={(v) =>
                      updateSettings({ emergencyFundMonths: parseInt(v) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => i + 3).map(
                        (month) => (
                          <SelectItem key={month} value={String(month)}>
                            {month} meses
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">
                    Recomendado: 6 meses
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">
                    Tipo de interés BCE por defecto
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      max={15}
                      step={0.25}
                      value={settings.defaultEcbRate}
                      onChange={(e) =>
                        clampAndUpdate(
                          "defaultEcbRate",
                          parseFloat(e.target.value) || 0,
                          0,
                          15
                        )
                      }
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      %
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Tipos de referencia BCE
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ============================================ */}
          {/* VISUALIZACIÓN */}
          {/* ============================================ */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Eye className="h-4 w-4 text-sky-500" />
                Visualización
              </CardTitle>
              <CardDescription className="text-xs">
                Personaliza cómo se muestran los datos en la app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">
                    Decimales en moneda
                  </Label>
                  <Select
                    value={String(settings.currencyDecimals)}
                    onValueChange={(v) =>
                      updateSettings({
                        currencyDecimals: parseInt(v) as 0 | 1 | 2,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 decimales (1.234 €)</SelectItem>
                      <SelectItem value="1">1 decimal (1.234,5 €)</SelectItem>
                      <SelectItem value="2">2 decimales (1.234,56 €)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">
                    Cantidad de decimales en los importes
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">
                    Formato de fecha
                  </Label>
                  <Select
                    value={settings.dateFormat}
                    onValueChange={(v) =>
                      updateSettings({
                        dateFormat: v as "dd/mm/yyyy" | "yyyy-mm-dd",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dd/mm/yyyy">
                        dd/mm/aaaa (01/03/2026)
                      </SelectItem>
                      <SelectItem value="yyyy-mm-dd">
                        aaaa-mm-dd (2026-03-01)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">
                    Formato de visualización de fechas
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">
                    Tema de la aplicación
                  </Label>
                  <Select
                    value={settings.theme}
                    onValueChange={(v) =>
                      updateSettings({
                        theme: v as "light" | "dark" | "system",
                      })
                    }
                  >
                    <SelectTrigger>
                      <ThemeIcon className="h-3.5 w-3.5 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center gap-2">
                          <Sun className="h-3.5 w-3.5 text-amber-500" />
                          Claro
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center gap-2">
                          <Moon className="h-3.5 w-3.5 text-blue-500" />
                          Oscuro
                        </div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                          Sistema
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">
                    Cambia el aspecto visual de la app
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">Modo compacto</Label>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-xs font-medium">Interfaz compacta</p>
                      <p className="text-[10px] text-muted-foreground">
                        Reduce el espacio entre elementos
                      </p>
                    </div>
                    <Switch
                      checked={settings.compactMode}
                      onCheckedChange={(v) =>
                        updateSettings({ compactMode: v })
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ============================================ */}
          {/* NOTIFICACIONES Y ALERTAS */}
          {/* ============================================ */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Bell className="h-4 w-4 text-orange-500" />
                Notificaciones y Alertas
              </CardTitle>
              <CardDescription className="text-xs">
                Configura cuándo y cómo recibir avisos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Enable notifications toggle */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-xs font-medium">Activar notificaciones</p>
                  <p className="text-[10px] text-muted-foreground">
                    Recibe alertas de gastos, presupuestos y renovaciones
                  </p>
                </div>
                <Switch
                  checked={settings.enableNotifications}
                  onCheckedChange={(v) =>
                    updateSettings({ enableNotifications: v })
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">
                    Alerta de gasto mensual
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={50}
                      max={100}
                      step={5}
                      value={settings.spendingAlertThreshold}
                      onChange={(e) =>
                        clampAndUpdate(
                          "spendingAlertThreshold",
                          parseFloat(e.target.value) || 80,
                          50,
                          100
                        )
                      }
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      %
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Avisar al alcanzar este % de ingresos gastados
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">
                    Aviso renovación suscripción
                  </Label>
                  <Select
                    value={String(settings.subscriptionRenewalDays)}
                    onValueChange={(v) =>
                      updateSettings({ subscriptionRenewalDays: parseInt(v) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 día antes</SelectItem>
                      <SelectItem value="3">3 días antes</SelectItem>
                      <SelectItem value="7">7 días antes</SelectItem>
                      <SelectItem value="14">14 días antes</SelectItem>
                      <SelectItem value="30">30 días antes</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">
                    Días de antelación para avisos de renovación
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">
                    Aviso de presupuesto
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={50}
                      max={95}
                      step={5}
                      value={settings.budgetWarningPercent}
                      onChange={(e) =>
                        clampAndUpdate(
                          "budgetWarningPercent",
                          parseFloat(e.target.value) || 75,
                          50,
                          95
                        )
                      }
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      %
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Avisar al consumir este % del presupuesto
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ============================================ */}
          {/* METAS DE AHORRO */}
          {/* ============================================ */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Meta de Ahorro Activa
              </CardTitle>
              <CardDescription className="text-xs">
                Selecciona la meta de ahorro que quieres priorizar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {savingsGoals.length === 0 ? (
                <div className="rounded-lg bg-muted/50 p-4 text-center">
                  <Target className="mx-auto h-6 w-6 mb-2 text-muted-foreground/50" />
                  <p className="text-xs text-muted-foreground">
                    No tienes metas de ahorro. Crea una desde el apartado &quot;Metas de Ahorro&quot;.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-xs font-medium">
                    Meta de ahorro seleccionada
                  </Label>
                  <Select
                    value={settings.selectedGoalId || "_none"}
                    onValueChange={(v) =>
                      updateSettings({
                        selectedGoalId: v === "_none" ? "" : v,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una meta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">
                        <span className="text-muted-foreground">Ninguna (desactivado)</span>
                      </SelectItem>
                      {savingsGoals.map((goal) => {
                        const progress = Math.min(
                          100,
                          Math.round((goal.currentAmount / goal.targetAmount) * 100)
                        );
                        return (
                          <SelectItem key={goal.id} value={goal.id}>
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-medium truncate">{goal.name}</span>
                              <Badge variant="secondary" className="text-[9px] px-1 py-0 shrink-0">
                                {progress}%
                              </Badge>
                              <span className="text-muted-foreground text-[10px] shrink-0 whitespace-nowrap">
                                {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                              </span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>

                  {/* Show selected goal details */}
                  {settings.selectedGoalId && (() => {
                    const selectedGoal = savingsGoals.find(
                      (g) => g.id === settings.selectedGoalId
                    );
                    if (!selectedGoal) return null;
                    const progress = Math.min(
                      100,
                      Math.round((selectedGoal.currentAmount / selectedGoal.targetAmount) * 100)
                    );
                    const remaining = selectedGoal.targetAmount - selectedGoal.currentAmount;
                    const daysLeft = mounted ? Math.max(
                      0,
                      Math.ceil(
                        (new Date(selectedGoal.deadline).getTime() - Date.now()) /
                          (1000 * 60 * 60 * 24)
                      )
                    ) : 0;
                    const monthlyNeeded =
                      daysLeft > 0
                        ? (remaining / (daysLeft / 30)).toFixed(0)
                        : 0;

                    return (
                      <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm font-semibold truncate">
                            {selectedGoal.name}
                          </span>
                          <Badge className="text-[9px] px-1.5 py-0 bg-primary text-primary-foreground shrink-0">
                            Activa
                          </Badge>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-xs font-bold">
                              {formatCurrency(selectedGoal.currentAmount)}
                            </p>
                            <p className="text-[9px] text-muted-foreground">
                              Ahorrado
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-primary">
                              {formatCurrency(remaining)}
                            </p>
                            <p className="text-[9px] text-muted-foreground">
                              Restante
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-amber-600">
                              {formatCurrency(Number(monthlyNeeded))}/mes
                            </p>
                            <p className="text-[9px] text-muted-foreground">
                              Necesitas ahorrar
                            </p>
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground text-center">
                          {daysLeft} días restantes · {progress}% completado
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}

              <Separator />

              {/* Auto-allocate savings toggle */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-xs font-medium flex items-center gap-1.5">
                    <PiggyBank className="h-3.5 w-3.5 text-emerald-500" />
                    Asignar ahorro automáticamente
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    El superávit mensual se asigna a la meta seleccionada
                  </p>
                </div>
                <Switch
                  checked={settings.autoAllocateSavings}
                  onCheckedChange={(v) =>
                    updateSettings({ autoAllocateSavings: v })
                  }
                  disabled={!settings.selectedGoalId}
                />
              </div>
            </CardContent>
          </Card>

          {/* ============================================ */}
          {/* PRIVACIDAD */}
          {/* ============================================ */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Lock className="h-4 w-4 text-violet-500" />
                Privacidad y Datos
              </CardTitle>
              <CardDescription className="text-xs">
                Controla la retención y el almacenamiento de tus datos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium">
                  Retención de datos históricos
                </Label>
                <Select
                  value={String(settings.dataRetentionDays)}
                  onValueChange={(v) =>
                    updateSettings({ dataRetentionDays: parseInt(v) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sin límite (conservar todo)</SelectItem>
                    <SelectItem value="90">3 meses</SelectItem>
                    <SelectItem value="180">6 meses</SelectItem>
                    <SelectItem value="365">1 año</SelectItem>
                    <SelectItem value="730">2 años</SelectItem>
                    <SelectItem value="1825">5 años</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">
                  Transacciones más antiguas se eliminarán automáticamente
                </p>
              </div>

              <div className="rounded-lg bg-muted/50 p-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="text-xs font-medium">Tus datos son privados</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed pl-6">
                  Todos los datos se almacenan exclusivamente en tu navegador.
                  No se envía información personal a servidores externos.
                  Las búsquedas de mercado son anónimas y no contienen datos financieros personales.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* ============================================ */}
          {/* DATOS */}
          {/* ============================================ */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Database className="h-4 w-4 text-violet-500" />
                Datos
              </CardTitle>
              <CardDescription className="text-xs">
                Gestiona los datos de tu aplicación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Reset all data */}
                <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-auto py-3 flex flex-col items-center gap-1.5 border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                    >
                      <RotateCcw className="h-5 w-5 text-rose-500" />
                      <span className="text-xs font-semibold">
                        Resetear datos
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Volver a valores iniciales
                      </span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-rose-500" />
                        ¿Resetear todos los datos?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción eliminará todas tus transacciones, metas,
                        presupuestos, deudas y suscripciones, y las
                        reemplazará con los datos de ejemplo. La configuración
                        también se restablecerá. Esta acción no se puede
                        deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <Button
                        onClick={handleResetAllData}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        <Trash2 className="h-4 w-4 mr-1.5" />
                        Resetear todo
                      </Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {/* Export data */}
                <Button
                  variant="outline"
                  onClick={handleExport}
                  className="h-auto py-3 flex flex-col items-center gap-1.5 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                >
                  <Download className="h-5 w-5 text-emerald-500" />
                  <span className="text-xs font-semibold">
                    Exportar datos
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Descargar como JSON
                  </span>
                </Button>

                {/* Import data */}
                <Button
                  variant="outline"
                  onClick={handleImport}
                  disabled={isImporting}
                  className="h-auto py-3 flex flex-col items-center gap-1.5 border-sky-200 dark:border-sky-800 hover:bg-sky-50 dark:hover:bg-sky-950/20"
                >
                  {isImporting ? (
                    <Loader2 className="h-5 w-5 text-sky-500 animate-spin" />
                  ) : (
                    <Upload className="h-5 w-5 text-sky-500" />
                  )}
                  <span className="text-xs font-semibold">
                    Importar datos
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Cargar desde archivo JSON
                  </span>
                </Button>
              </div>

              <Separator />

              {/* Reset settings only */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium">
                    Restablecer solo la configuración
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Vuelve a los valores por defecto sin tocar tus datos
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-muted-foreground"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Restablecer
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Restablecer configuración?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Se eliminarán todas las personalizaciones y se volverá a los valores por defecto. Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleResetSettings}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Restablecer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          {/* ============================================ */}
          {/* INFORMACIÓN DE LA APP */}
          {/* ============================================ */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Información de la App
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Versión</span>
                  <Badge variant="secondary" className="text-[10px] px-2">
                    v1.1.0
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Año</span>
                  <span className="text-xs font-medium">2026</span>
                </div>
                <Separator />
                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground">
                    Tecnologías
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                    >
                      Next.js 16
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300"
                    >
                      TypeScript 5
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300"
                    >
                      Tailwind CSS 4
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                    >
                      Zustand
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300"
                    >
                      shadcn/ui
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300"
                    >
                      Recharts
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300"
                    >
                      Lucide Icons
                    </Badge>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    FinTrack es una aplicación de finanzas personales diseñada
                    para el mercado español. Todos los datos se almacenan
                    localmente en tu navegador.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
