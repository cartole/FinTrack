/**
 * ============================================
 * Estimador IRPF 2025
 * ============================================
 * Componente wizard paso a paso para calcular
 * el IRPF español. Incluye formulario completo,
 * desglose por tramos y estimaciones autónomo.
 */

"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency } from "@/lib/finance-utils";
import { calculateIRPF } from "@/lib/irpf-calculator";
import type {
  IRPFProfile,
  IRPFResult,
  WorkerType,
  FamilySituation,
  DisabilityDegree,
  FamilyType,
} from "@/lib/types";
import {
  Calculator,
  ChevronLeft,
  ChevronRight,
  Loader2,
  TrendingDown,
  Users,
  Baby,
  Heart,
  ShieldCheck,
  Briefcase,
  Building2,
  Receipt,
  PiggyBank,
  ArrowDown,
  Info,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// CONSTANTES
// ============================================

const AUTONOMOUS_COMMUNITIES = [
  { value: "andalucia", label: "Andalucía" },
  { value: "aragon", label: "Aragón" },
  { value: "asturias", label: "Asturias" },
  { value: "baleares", label: "Illes Balears" },
  { value: "canarias", label: "Canarias" },
  { value: "cantabria", label: "Cantabria" },
  { value: "castilla_la_mancha", label: "Castilla-La Mancha" },
  { value: "castilla_y_leon", label: "Castilla y León" },
  { value: "cataluna", label: "Cataluña" },
  { value: "ceuta", label: "Ceuta" },
  { value: "comunidad_valenciana", label: "Comunidad Valenciana" },
  { value: "extremadura", label: "Extremadura" },
  { value: "galicia", label: "Galicia" },
  { value: "la_rioja", label: "La Rioja" },
  { value: "madrid", label: "Comunidad de Madrid" },
  { value: "melilla", label: "Melilla" },
  { value: "murcia", label: "Región de Murcia" },
  { value: "navarra", label: "Navarra" },
  { value: "pais_vasco", label: "País Vasco" },
];

const TOTAL_STEPS = 10;

const STEP_INFO = [
  { title: "Tipo de trabajador", icon: Briefcase },
  { title: "Edad", icon: Users },
  { title: "Situación familiar", icon: Heart },
  { title: "Ingresos anuales", icon: Receipt },
  { title: "Descendientes", icon: Baby },
  { title: "Ascendientes", icon: Users },
  { title: "Discapacidad", icon: ShieldCheck },
  { title: "Familia numerosa", icon: Users },
  { title: "Comunidad autónoma", icon: Building2 },
  { title: "Datos autónomo", icon: Calculator },
];

// ============================================
// DEFAULT PROFILE
// ============================================

const defaultProfile: IRPFProfile = {
  workerType: "asalariado",
  age: 30,
  familySituation: "soltero",
  annualGrossIncome: 30000,
  descendantsUnder3: 0,
  descendants3To25: 0,
  ascendantsOver65: 0,
  ascendantsOver75: 0,
  disabilityDegree: "ninguna",
  hasAssistant: false,
  familyType: "normal",
  autonomousCommunity: "madrid",
  isAutonomo: false,
  annualExpenses: 0,
  ivaRate: 21,
};

// ============================================
// STEP COMPONENTS
// ============================================

function StepWorkerType({
  value,
  onChange,
}: {
  value: WorkerType;
  onChange: (v: WorkerType) => void;
}) {
  const options: { value: WorkerType; label: string; desc: string; icon: typeof Briefcase }[] = [
    { value: "asalariado", label: "Asalariado", desc: "Trabajas por cuenta ajena", icon: Briefcase },
    { value: "autonomo", label: "Autónomo", desc: "Trabajas por cuenta propia", icon: Receipt },
    { value: "pensionista", label: "Pensionista", desc: "Recibes una pensión", icon: PiggyBank },
  ];

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold">¿Cómo trabajas?</Label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all hover:border-primary/50",
              value === opt.value
                ? "border-primary bg-primary/5 dark:bg-primary/10"
                : "border-muted bg-background"
            )}
          >
            <opt.icon
              className={cn(
                "h-6 w-6",
                value === opt.value ? "text-primary" : "text-muted-foreground"
              )}
            />
            <span
              className={cn(
                "text-sm font-medium",
                value === opt.value ? "text-primary" : "text-foreground"
              )}
            >
              {opt.label}
            </span>
            <span className="text-[11px] text-muted-foreground text-center">{opt.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepAge({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const ranges = [
    { value: 25, label: "< 30 años" },
    { value: 35, label: "30-44 años" },
    { value: 50, label: "45-64 años" },
    { value: 67, label: "65-74 años" },
    { value: 78, label: "75+ años" },
  ];

  return (
    <div className="space-y-4">
      <Label className="text-sm font-semibold">¿Cuántos años tienes?</Label>
      <div className="flex flex-wrap gap-2">
        {ranges.map((r) => (
          <Button
            key={r.value}
            variant={value === r.value ? "default" : "outline"}
            size="sm"
            onClick={() => onChange(r.value)}
          >
            {r.label}
          </Button>
        ))}
      </div>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">O introduce tu edad exacta</Label>
        <Input
          type="number"
          min={18}
          max={99}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || 30)}
          className="w-24"
        />
      </div>
      {value >= 65 && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-3 text-xs text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>
            {value >= 75
              ? "Se aplica mínimo personal de 8.100€ (≥75 años)"
              : "Se aplica mínimo personal de 6.700€ (≥65 años)"}
          </span>
        </div>
      )}
    </div>
  );
}

function StepFamilySituation({
  value,
  onChange,
}: {
  value: FamilySituation;
  onChange: (v: FamilySituation) => void;
}) {
  const options: { value: FamilySituation; label: string }[] = [
    { value: "soltero", label: "Soltero/a" },
    { value: "casado_monotributacion", label: "Casado/a (monotributación)" },
    { value: "casado_conjunta", label: "Casado/a (declaración conjunta)" },
    { value: "separado", label: "Separado/a legalmente" },
    { value: "viudo", label: "Viudo/a" },
  ];

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold">Situación familiar</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-lg border-2 p-3 text-left text-sm transition-all hover:border-primary/50",
              value === opt.value
                ? "border-primary bg-primary/5 font-medium"
                : "border-muted"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function StepIncome({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const quickAmounts = [15000, 20000, 25000, 30000, 40000, 50000, 60000, 80000];

  return (
    <div className="space-y-4">
      <Label className="text-sm font-semibold">Ingresos brutos anuales</Label>
      <div className="space-y-2">
        <div className="relative">
          <Input
            type="number"
            min={0}
            step={1000}
            value={value || ""}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            className="text-2xl font-bold pr-8"
            placeholder="30000"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
            €
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {quickAmounts.map((amt) => (
          <Button
            key={amt}
            variant={value === amt ? "default" : "outline"}
            size="sm"
            onClick={() => onChange(amt)}
            className="text-xs"
          >
            {formatCurrency(amt)}
          </Button>
        ))}
      </div>
      <div className="rounded-lg bg-muted/50 p-3 text-[11px] text-muted-foreground leading-relaxed">
        <div className="flex items-center gap-2 mb-1">
          <Info className="h-3.5 w-3.5" />
          <span className="font-semibold">Incluye todos los ingresos</span>
        </div>
        Salario, pagas extras, bonus, ingresos freelance, pensiones, etc.
      </div>
    </div>
  );
}

function StepDescendants({
  under3,
  from3to25,
  onChangeUnder3,
  onChangeFrom3To25,
}: {
  under3: number;
  from3to25: number;
  onChangeUnder3: (v: number) => void;
  onChangeFrom3To25: (v: number) => void;
}) {
  const totalChildren = under3 + from3to25;

  return (
    <div className="space-y-4">
      <Label className="text-sm font-semibold">Hijos a cargo</Label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Hijos menores de 3 años</Label>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChangeUnder3(Math.max(0, under3 - 1))}
              disabled={under3 === 0}
            >
              −
            </Button>
            <span className="text-2xl font-bold w-8 text-center">{under3}</span>
            <Button variant="outline" size="sm" onClick={() => onChangeUnder3(under3 + 1)}>
              +
            </Button>
          </div>
          {under3 > 0 && (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
              +2.800€ por cada hijo &lt;3 años
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Hijos de 3 a 25 años</Label>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChangeFrom3To25(Math.max(0, from3to25 - 1))}
              disabled={from3to25 === 0}
            >
              −
            </Button>
            <span className="text-2xl font-bold w-8 text-center">{from3to25}</span>
            <Button variant="outline" size="sm" onClick={() => onChangeFrom3To25(from3to25 + 1)}>
              +
            </Button>
          </div>
        </div>
      </div>

      {totalChildren > 0 && (
        <div className="rounded-lg bg-muted/50 p-3 space-y-1.5">
          <p className="text-xs font-semibold">Mínimo por descendientes:</p>
          {totalChildren >= 1 && (
            <p className="text-[11px] text-muted-foreground">1º hijo: 2.400€</p>
          )}
          {totalChildren >= 2 && (
            <p className="text-[11px] text-muted-foreground">2º hijo: 2.700€</p>
          )}
          {totalChildren >= 3 && (
            <p className="text-[11px] text-muted-foreground">3º hijo: 4.000€</p>
          )}
          {totalChildren >= 4 && (
            <p className="text-[11px] text-muted-foreground">
              4º y sig.: 4.500€ c/u ({totalChildren - 3} adicionales)
            </p>
          )}
          {under3 > 0 && (
            <p className="text-[11px] text-emerald-600">
              +2.800€ × {under3} hijos &lt;3 años
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function StepAscendants({
  over65,
  over75,
  onChangeOver65,
  onChangeOver75,
}: {
  over65: number;
  over75: number;
  onChangeOver65: (v: number) => void;
  onChangeOver75: (v: number) => void;
}) {
  return (
    <div className="space-y-4">
      <Label className="text-sm font-semibold">Ascendientes a cargo</Label>
      <p className="text-xs text-muted-foreground">
        Padres o abuelos que conviven contigo y no superan los 8.000€ de ingresos anuales
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Ascendientes de 65-74 años</Label>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChangeOver65(Math.max(0, over65 - 1))}
              disabled={over65 === 0}
            >
              −
            </Button>
            <span className="text-2xl font-bold w-8 text-center">{over65}</span>
            <Button variant="outline" size="sm" onClick={() => onChangeOver65(over65 + 1)}>
              +
            </Button>
          </div>
          {over65 > 0 && (
            <p className="text-[11px] text-muted-foreground">1.150€ por cada uno</p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Ascendientes de 75+ años</Label>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChangeOver75(Math.max(0, over75 - 1))}
              disabled={over75 === 0}
            >
              −
            </Button>
            <span className="text-2xl font-bold w-8 text-center">{over75}</span>
            <Button variant="outline" size="sm" onClick={() => onChangeOver75(over75 + 1)}>
              +
            </Button>
          </div>
          {over75 > 0 && (
            <p className="text-[11px] text-muted-foreground">2.550€ por cada uno (1.150 + 1.400)</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StepDisability({
  degree,
  hasAssistant,
  onChangeDegree,
  onChangeHasAssistant,
}: {
  degree: DisabilityDegree;
  hasAssistant: boolean;
  onChangeDegree: (v: DisabilityDegree) => void;
  onChangeHasAssistant: (v: boolean) => void;
}) {
  const options: { value: DisabilityDegree; label: string; desc: string }[] = [
    { value: "ninguna", label: "Sin discapacidad", desc: "No aplica" },
    { value: "33_65", label: "33% - 64%", desc: "Mínimo: 3.000€" },
    { value: "65_plus", label: "65% o más", desc: "Mínimo: 9.000€" },
  ];

  return (
    <div className="space-y-4">
      <Label className="text-sm font-semibold">Grado de discapacidad</Label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChangeDegree(opt.value)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border-2 p-4 transition-all hover:border-primary/50",
              degree === opt.value
                ? "border-primary bg-primary/5"
                : "border-muted"
            )}
          >
            <span
              className={cn(
                "text-sm font-medium",
                degree === opt.value ? "text-primary" : ""
              )}
            >
              {opt.label}
            </span>
            <span className="text-[11px] text-muted-foreground">{opt.desc}</span>
          </button>
        ))}
      </div>

      {degree === "65_plus" && (
        <div
          className={cn(
            "flex items-center justify-between rounded-lg border-2 p-4 cursor-pointer transition-all",
            hasAssistant
              ? "border-primary bg-primary/5"
              : "border-muted hover:border-primary/50"
          )}
          onClick={() => onChangeHasAssistant(!hasAssistant)}
        >
          <div>
            <p className="text-sm font-medium">Gastos de asistente personal</p>
            <p className="text-[11px] text-muted-foreground">
              +3.000€ adicionales si necesitas asistencia
            </p>
          </div>
          <div
            className={cn(
              "h-6 w-10 rounded-full transition-colors flex items-center",
              hasAssistant ? "bg-primary justify-end" : "bg-muted justify-start"
            )}
          >
            <div className="h-5 w-5 rounded-full bg-white shadow mx-0.5" />
          </div>
        </div>
      )}
    </div>
  );
}

function StepFamilyType({
  value,
  onChange,
}: {
  value: FamilyType;
  onChange: (v: FamilyType) => void;
}) {
  const options: { value: FamilyType; label: string; desc: string; reduction: string }[] = [
    { value: "normal", label: "No", desc: "Familia estándar", reduction: "0€" },
    {
      value: "numerosa_general",
      label: "General",
      desc: "3-4 hijos",
      reduction: "1.200€",
    },
    {
      value: "numerosa_especial",
      label: "Especial",
      desc: "5+ hijos",
      reduction: "2.400€",
    },
  ];

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold">¿Familia numerosa?</Label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all hover:border-primary/50",
              value === opt.value
                ? "border-primary bg-primary/5"
                : "border-muted"
            )}
          >
            <span
              className={cn(
                "text-sm font-medium",
                value === opt.value ? "text-primary" : ""
              )}
            >
              {opt.label}
            </span>
            <span className="text-[11px] text-muted-foreground">{opt.desc}</span>
            <Badge variant="secondary" className="text-[10px]">
              {opt.reduction}
            </Badge>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepCommunity({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold">Comunidad autónoma</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Selecciona tu comunidad" />
        </SelectTrigger>
        <SelectContent>
          {AUTONOMOUS_COMMUNITIES.map((cc) => (
            <SelectItem key={cc.value} value={cc.value}>
              {cc.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3 text-xs text-amber-700 dark:text-amber-300">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>
          Las bonificaciones autonómicas varían según comunidad. Este cálculo usa los tramos
          generales estatales + autonómicos.
        </span>
      </div>
    </div>
  );
}

function StepAutonomo({
  expenses,
  ivaRate,
  onChangeExpenses,
  onChangeIvaRate,
}: {
  expenses: number;
  ivaRate: number;
  onChangeExpenses: (v: number) => void;
  onChangeIvaRate: (v: number) => void;
}) {
  return (
    <div className="space-y-4">
      <Label className="text-sm font-semibold">Datos para autónomos</Label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Gastos deducibles anuales (€)</Label>
          <Input
            type="number"
            min={0}
            step={500}
            value={expenses || ""}
            onChange={(e) => onChangeExpenses(parseFloat(e.target.value) || 0)}
            placeholder="5000"
          />
          <p className="text-[11px] text-muted-foreground">
            Alquiler oficina, suministros, materiales, etc.
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Tipo de IVA aplicado (%)</Label>
          <Select value={String(ivaRate)} onValueChange={(v) => onChangeIvaRate(parseFloat(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="21">21% - General</SelectItem>
              <SelectItem value="10">10% - Reducido</SelectItem>
              <SelectItem value="4">4% - Superreducido</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg bg-muted/50 p-3 text-[11px] text-muted-foreground leading-relaxed">
        <div className="flex items-center gap-2 mb-1">
          <Info className="h-3.5 w-3.5" />
          <span className="font-semibold">Estimaciones trimestrales</span>
        </div>
        Se calculará tu IVA trimestral estimado y la retención de IRPF trimestral basada en tus
        ingresos y gastos deducibles.
      </div>
    </div>
  );
}

// ============================================
// RESULTS DISPLAY
// ============================================

function ResultsDisplay({ result, profile }: { result: IRPFResult; profile: IRPFProfile }) {
  return (
    <div className="space-y-5">
      {/* Header resumen */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        </div>
        <div>
          <h3 className="text-sm font-bold">Cálculo completado</h3>
          <p className="text-xs text-muted-foreground">IRPF 2025 estimado</p>
        </div>
      </div>

      {/* Tarjetas principales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm bg-muted/50">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground mb-1">Ingreso Bruto</p>
            <p className="text-base font-bold whitespace-nowrap">{formatCurrency(result.grossIncome)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-rose-50 dark:bg-rose-950/20">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground mb-1">IRPF Total</p>
            <p className="text-base font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
              {formatCurrency(result.totalTax)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-muted/50">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground mb-1">Tipo Efectivo</p>
            <p className="text-base font-bold whitespace-nowrap">{result.effectiveRate.toFixed(2)}%</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-emerald-50 dark:bg-emerald-950/20">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground mb-1">Neto Anual</p>
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
              {formatCurrency(result.netAnnualIncome)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ingreso neto mensual */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-emerald-500/5 to-teal-500/5">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Ingreso neto mensual</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(result.netMonthlyIncome)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Tipo marginal</p>
            <p className="text-lg font-semibold">{result.marginalRate}%</p>
          </div>
        </CardContent>
      </Card>

      {/* Desglose por tramos */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Desglose por Tramos
          </CardTitle>
          <CardDescription className="text-xs">
            Base liquidable: {formatCurrency(result.baseLiquidable)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 overflow-x-auto">
            {/* Header */}
            <div className="grid grid-cols-4 gap-1 text-[10px] text-muted-foreground font-semibold pb-1 border-b min-w-[300px]">
              <span>Tramo</span>
              <span className="text-right whitespace-nowrap">Base</span>
              <span className="text-right whitespace-nowrap">Tipo</span>
              <span className="text-right whitespace-nowrap">Cuota</span>
            </div>
            {result.brackets
              .filter((b) => b.baseInBracket > 0)
              .map((bracket, idx) => (
                <div key={idx} className="grid grid-cols-4 gap-1 text-xs py-1.5 min-w-[300px]">
                  <span className="text-muted-foreground whitespace-nowrap">
                    {bracket.to === Infinity
                      ? `> ${formatCurrency(bracket.from)}`
                      : `${formatCurrency(bracket.from)} - ${formatCurrency(bracket.to)}`}
                  </span>
                  <span className="text-right font-medium whitespace-nowrap">
                    {formatCurrency(bracket.baseInBracket)}
                  </span>
                  <span className="text-right whitespace-nowrap">{bracket.rate}%</span>
                  <span className="text-right font-semibold whitespace-nowrap">
                    {formatCurrency(bracket.taxInBracket)}
                  </span>
                </div>
              ))}
            {/* Totales */}
            <div className="grid grid-cols-4 gap-1 text-xs py-1.5 border-t font-bold min-w-[300px]">
              <span>Total</span>
              <span className="text-right whitespace-nowrap">{formatCurrency(result.baseLiquidable)}</span>
              <span />
              <span className="text-right whitespace-nowrap">{formatCurrency(result.totalTax)}</span>
            </div>
            {/* Desglose estatal/autonómico */}
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="rounded-lg bg-muted/50 p-2 text-center">
                <p className="text-[10px] text-muted-foreground">Cuota estatal</p>
                <p className="text-sm font-semibold whitespace-nowrap">{formatCurrency(result.stateTax)}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2 text-center">
                <p className="text-[10px] text-muted-foreground">Cuota autonómica</p>
                <p className="text-sm font-semibold whitespace-nowrap">{formatCurrency(result.autonomousTax)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deducciones aplicadas */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ArrowDown className="h-4 w-4 text-emerald-500" />
            Deducciones Aplicadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <DeductionRow
              label="Mínimo personal"
              value={result.minimumPersonal}
              total={result.totalMinimum}
            />
            {result.minimumFamily > 0 && (
              <DeductionRow
                label="Mínimo familiar (descendientes + ascendientes)"
                value={result.minimumFamily}
                total={result.totalMinimum}
              />
            )}
            {result.minimumDisability > 0 && (
              <DeductionRow
                label="Mínimo por discapacidad"
                value={result.minimumDisability}
                total={result.totalMinimum}
              />
            )}
            {profile.familyType !== "normal" && (
              <DeductionRow
                label={`Familia numerosa ${
                  profile.familyType === "numerosa_especial" ? "especial" : "general"
                }`}
                value={
                  profile.familyType === "numerosa_especial" ? 2400 : 1200
                }
                total={result.totalMinimum}
              />
            )}
            <Separator className="my-1" />
            <div className="flex items-center justify-between text-sm font-bold">
              <span>Total mínimo personal y familiar</span>
              <span className="text-emerald-600 dark:text-emerald-400">
                {formatCurrency(result.totalMinimum)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reducción por trabajo */}
      {result.workReduction > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-teal-500" />
              Reducción por Rendimientos del Trabajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm">
              <span>Reducción aplicada</span>
              <span className="font-bold text-teal-600 dark:text-teal-400">
                −{formatCurrency(result.workReduction)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
              <span>Rendimiento neto del trabajo</span>
              <span>{formatCurrency(result.grossIncome)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Rendimiento neto reducido</span>
              <span>{formatCurrency(result.netWorkIncome)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estimaciones autónomo */}
      {profile.isAutonomo && result.quarterlyVAT !== undefined && result.quarterlyIRPF !== undefined && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Receipt className="h-4 w-4 text-purple-500" />
              Estimaciones Autónomo
            </CardTitle>
            <CardDescription className="text-xs">
              Pagos trimestrales estimados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="rounded-lg bg-purple-50 dark:bg-purple-950/20 p-3 text-center">
                <p className="text-[10px] text-muted-foreground mb-1">IVA Trimestral</p>
                <p className="text-base font-bold text-purple-600 dark:text-purple-400">
                  {formatCurrency(result.quarterlyVAT)}
                </p>
              </div>
              <div className="rounded-lg bg-rose-50 dark:bg-rose-950/20 p-3 text-center">
                <p className="text-[10px] text-muted-foreground mb-1">IRPF Trimestral</p>
                <p className="text-base font-bold text-rose-600 dark:text-rose-400">
                  {formatCurrency(result.quarterlyIRPF)}
                </p>
              </div>
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3 text-center sm:col-span-1 col-span-2">
                <p className="text-[10px] text-muted-foreground mb-1">IRPF Anual Retención</p>
                <p className="text-base font-bold text-amber-600 dark:text-amber-400">
                  {formatCurrency(result.annualIRPFWithholding ?? 0)}
                </p>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <p className="text-[11px] text-muted-foreground">
                <span className="font-semibold">Fechas de pago IRPF trimestral:</span> 20 Abr,
                20 Jul, 20 Oct, 30 Ene
              </p>
              <p className="text-[11px] text-muted-foreground">
                <span className="font-semibold">Fechas de pago IVA trimestral:</span> 20 Abr,
                20 Jul, 20 Oct, 30 Ene (modelo 303)
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumen textual */}
      <Card className="border-0 shadow-sm bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Resumen</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{result.summary}</p>
        </CardContent>
      </Card>

      {/* Aviso legal */}
      <div className="flex items-start gap-2 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 p-3 text-[11px] text-amber-700 dark:text-amber-300">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
        <span>
          Este cálculo es orientativo y no sustituye el cálculo oficial de la AEAT. Las
          bonificaciones autonómicas específicas no están incluidas. Consulta siempre con un
          asesor fiscal para tu caso particular.
        </span>
      </div>
    </div>
  );
}

function DeductionRow({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{formatCurrency(value)}</span>
      </div>
      <Progress value={pct} className="h-1" />
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function IRPFCalculator() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<IRPFResult | null>(null);
  const [profile, setProfile] = useState<IRPFProfile>(defaultProfile);

  const updateProfile = <K extends keyof IRPFProfile>(key: K, value: IRPFProfile[K]) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  // Step 10 only shows if autonomo
  const effectiveSteps = useMemo(() => {
    const steps = [...STEP_INFO];
    if (profile.workerType !== "autonomo") {
      // Remove step 10 (autonomo data)
      return steps.slice(0, 9);
    }
    return steps;
  }, [profile.workerType]);

  const totalSteps = effectiveSteps.length;

  const canGoNext = useMemo(() => {
    if (currentStep === 3 && profile.annualGrossIncome <= 0) return false;
    return true;
  }, [currentStep, profile.annualGrossIncome]);

  const handleCalculate = () => {
    setIsCalculating(true);
    // Simulate a small delay for UX
    setTimeout(() => {
      const calcResult = calculateIRPF(profile);
      setResult(calcResult);
      setIsCalculating(false);
    }, 800);
  };

  const handleReset = () => {
    setResult(null);
    setCurrentStep(0);
    setProfile(defaultProfile);
  };

  const progress = result ? 100 : ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10">
          <Calculator className="h-6 w-6 text-rose-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Estimador IRPF</h2>
          <p className="text-sm text-muted-foreground">
            Calcula tu IRPF 2025 paso a paso
          </p>
        </div>
      </div>

      {/* Progress bar */}
      {!result && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Paso {currentStep + 1} de {totalSteps}
            </span>
            <span>{effectiveSteps[currentStep]?.title}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Step navigation dots */}
      {!result && (
        <div className="flex items-center justify-center gap-0.5 overflow-x-auto flex-nowrap">
          {effectiveSteps.map((step, idx) => (
            <button
              key={idx}
              onClick={() => idx <= currentStep && setCurrentStep(idx)}
              className={cn(
                "h-1.5 rounded-full transition-all shrink-0",
                idx === currentStep
                  ? "w-5 bg-primary"
                  : idx < currentStep
                  ? "w-1.5 bg-primary/50 cursor-pointer"
                  : "w-1.5 bg-muted"
              )}
              title={step.title}
            />
          ))}
        </div>
      )}

      {/* Form or Results */}
      {result ? (
        <ResultsDisplay result={result} profile={profile} />
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            {/* Step content */}
            <div className="min-h-[200px]">
              {currentStep === 0 && (
                <StepWorkerType
                  value={profile.workerType}
                  onChange={(v) => updateProfile("workerType", v)}
                />
              )}
              {currentStep === 1 && (
                <StepAge value={profile.age} onChange={(v) => updateProfile("age", v)} />
              )}
              {currentStep === 2 && (
                <StepFamilySituation
                  value={profile.familySituation}
                  onChange={(v) => updateProfile("familySituation", v)}
                />
              )}
              {currentStep === 3 && (
                <StepIncome
                  value={profile.annualGrossIncome}
                  onChange={(v) => updateProfile("annualGrossIncome", v)}
                />
              )}
              {currentStep === 4 && (
                <StepDescendants
                  under3={profile.descendantsUnder3}
                  from3to25={profile.descendants3To25}
                  onChangeUnder3={(v) => updateProfile("descendantsUnder3", v)}
                  onChangeFrom3To25={(v) => updateProfile("descendants3To25", v)}
                />
              )}
              {currentStep === 5 && (
                <StepAscendants
                  over65={profile.ascendantsOver65}
                  over75={profile.ascendantsOver75}
                  onChangeOver65={(v) => updateProfile("ascendantsOver65", v)}
                  onChangeOver75={(v) => updateProfile("ascendantsOver75", v)}
                />
              )}
              {currentStep === 6 && (
                <StepDisability
                  degree={profile.disabilityDegree}
                  hasAssistant={profile.hasAssistant}
                  onChangeDegree={(v) => updateProfile("disabilityDegree", v)}
                  onChangeHasAssistant={(v) => updateProfile("hasAssistant", v)}
                />
              )}
              {currentStep === 7 && (
                <StepFamilyType
                  value={profile.familyType}
                  onChange={(v) => updateProfile("familyType", v)}
                />
              )}
              {currentStep === 8 && (
                <StepCommunity
                  value={profile.autonomousCommunity}
                  onChange={(v) => updateProfile("autonomousCommunity", v)}
                />
              )}
              {currentStep === 9 && profile.workerType === "autonomo" && (
                <StepAutonomo
                  expenses={profile.annualExpenses ?? 0}
                  ivaRate={profile.ivaRate ?? 21}
                  onChangeExpenses={(v) => updateProfile("annualExpenses", v)}
                  onChangeIvaRate={(v) => updateProfile("ivaRate", v)}
                />
              )}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>

              {currentStep < totalSteps - 1 ? (
                <Button
                  size="sm"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={!canGoNext}
                  className="gap-1"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleCalculate}
                  disabled={isCalculating}
                  className="gap-2"
                >
                  {isCalculating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Calculator className="h-4 w-4" />
                  )}
                  {isCalculating ? "Calculando..." : "Calcular IRPF"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reset button */}
      {result && (
        <Button variant="outline" onClick={handleReset} className="w-full gap-2">
          <ChevronLeft className="h-4 w-4" />
          Nuevo cálculo
        </Button>
      )}
    </div>
  );
}
