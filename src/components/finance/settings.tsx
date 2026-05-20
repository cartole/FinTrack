/**
 * ============================================
 * Configuración - Componente UI
 * ============================================
 *
 * "use client" component with:
 * - Fiscalidad (tax settings)
 * - Economía (economy settings)
 * - Visualización (display settings)
 * - Datos (data management: reset, export, import)
 * - Información de la app
 *
 * All text in Spanish, professional emerald/dark theme.
 */

"use client";

import { useState, useRef } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { cn } from "@/lib/utils";
import {
  Settings2,
  Save,
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
  FileJson,
  Trash2,
} from "lucide-react";

export function Settings() {
  const {
    settings,
    updateSettings,
    resetSettings,
    resetAllData,
    exportData,
    importData,
  } = useFinanceStore();

  // Toast-like feedback state
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Import state
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      // Reset file input
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
    resetAllData();
    showFeedback("success", "Todos los datos han sido restablecidos");
  };

  // Clamped update helpers
  const clampAndUpdate = (key: keyof typeof settings, value: number, min: number, max: number) => {
    const clamped = Math.min(Math.max(value, min), max);
    updateSettings({ [key]: clamped });
  };

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

      <ScrollArea className="max-h-[calc(100vh-12rem)]">
        <div className="space-y-6 pr-2">
          {/* ============================================ */}
          {/* FISCALIDAD */}
          {/* ============================================ */}
          <Card className="border-0 shadow-sm">
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
          <Card className="border-0 shadow-sm">
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
          <Card className="border-0 shadow-sm">
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
            </CardContent>
          </Card>

          {/* ============================================ */}
          {/* DATOS */}
          {/* ============================================ */}
          <Card className="border-0 shadow-sm">
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
                <AlertDialog>
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
                      <AlertDialogAction
                        onClick={handleResetAllData}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        <Trash2 className="h-4 w-4 mr-1.5" />
                        Resetear todo
                      </AlertDialogAction>
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetSettings}
                  className="gap-1.5 text-muted-foreground"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restablecer
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ============================================ */}
          {/* INFORMACIÓN DE LA APP */}
          {/* ============================================ */}
          <Card className="border-0 shadow-sm">
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
                    v1.0.0
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
      </ScrollArea>
    </div>
  );
}
