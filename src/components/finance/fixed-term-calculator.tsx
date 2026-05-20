/**
 * ============================================
 * Calculadora de Depósitos a Plazo Fijo
 * ============================================
 * Componente que permite:
 * 1. Ver tipos de interés reales (Euribor, BCE)
 * 2. Calcular rentabilidad de depósitos a plazo fijo
 * 3. Comparar tasas de distintos bancos españoles
 * 4. Ver desglose de intereses brutos, retención y netos
 *
 * Datos reales de Euribor y tasas bancarias actualizadas diariamente.
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  Building2,
  RefreshCw,
  Loader2,
  Calculator,
  Landmark,
  TrendingUp,
  Shield,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Clock,
  Banknote,
  Scale,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/finance-utils";
import { ScrollArea } from "@/components/ui/scroll-area";

// ---- Tipos ----

interface EuriborRate {
  term: string;
  rate: number;
  lastUpdated: string;
  source: string;
}

interface DepositRate {
  bank: string;
  term: string;
  tae: number;
  tin: number;
  minAmount: number;
  source: string;
}

interface FixedTermResult {
  grossInterest: number;
  withholdingAmount: number;
  netInterest: number;
  totalReturn: number;
  effectiveAnnualRate: number;
  monthlyBreakdown: { month: number; interest: number; cumulative: number; netCumulative: number }[];
}

// ---- Constantes ----

const SPANISH_WITHHOLDING_TAX = 19; // Retención sobre rendimientos del capital en España
const INFLATION_RATE = 2.0; // Inflación estimada zona euro

const chartConfig: ChartConfig = {
  grossInterest: { label: "Interés bruto", color: "#3b82f6" },
  withholding: { label: "Retención (19%)", color: "#ef4444" },
  netInterest: { label: "Interés neto", color: "#10b981" },
};

const termOptions = [
  { value: "3", label: "3 meses" },
  { value: "6", label: "6 meses" },
  { value: "12", label: "12 meses" },
  { value: "18", label: "18 meses" },
  { value: "24", label: "24 meses" },
  { value: "36", label: "36 meses" },
  { value: "48", label: "48 meses" },
];

// ---- Componente Principal ----

export function FixedTermCalculator() {
  // Estado del formulario
  const [amount, setAmount] = useState("20000");
  const [termMonths, setTermMonths] = useState("12");
  const [customTAE, setCustomTAE] = useState("");
  const [useCustomRate, setUseCustomRate] = useState(false);
  const [selectedBank, setSelectedBank] = useState("");

  // Estado de datos reales
  const [euriborRates, setEuriborRates] = useState<EuriborRate[]>([]);
  const [depositRates, setDepositRates] = useState<DepositRate[]>([]);
  const [ecbRate, setEcbRate] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchInterestRates = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/market-data?action=rates");
      const data = await response.json();
      if (data.success) {
        setEuriborRates(data.euriborRates);
        setDepositRates(data.depositRates);
        setEcbRate(data.ecbRate);
        setLastUpdated(data.lastUpdated);
      }
    } catch (error) {
      console.error("Error fetching interest rates:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cargar tipos de interés al montar
  useEffect(() => {
    fetchInterestRates();
  }, [fetchInterestRates]);

  // ---- Cálculos ----

  const selectedDeposit = useMemo(() => {
    return depositRates.find((d) => d.bank === selectedBank) || null;
  }, [depositRates, selectedBank]);

  const activeTAE = useMemo(() => {
    if (useCustomRate && customTAE) return parseFloat(customTAE) || 0;
    if (selectedDeposit) return selectedDeposit.tae;
    // Buscar el mejor TAE para el plazo seleccionado
    const matchingDeposits = depositRates.filter((d) => {
      const depositTerm = parseInt(d.term);
      return depositTerm === parseInt(termMonths);
    });
    if (matchingDeposits.length > 0) {
      return Math.max(...matchingDeposits.map((d) => d.tae));
    }
    return 2.5; // Fallback
  }, [useCustomRate, customTAE, selectedDeposit, depositRates, termMonths]);

  const calculation = useMemo((): FixedTermResult => {
    const principal = parseFloat(amount) || 0;
    const tae = activeTAE;
    const months = parseInt(termMonths);
    const monthlyRate = tae / 100 / 12;

    const totalInterest = principal * monthlyRate * months;
    const withholding = totalInterest * (SPANISH_WITHHOLDING_TAX / 100);
    const netInterest = totalInterest - withholding;
    const effectiveAnnualRate = Math.pow(1 + monthlyRate, 12) - 1;

    const monthlyBreakdown: { month: number; interest: number; cumulative: number; netCumulative: number }[] = [];
    let cumulative = 0;
    let netCumulative = 0;

    for (let month = 1; month <= months; month++) {
      const monthInterest = principal * monthlyRate;
      cumulative += monthInterest;
      netCumulative += monthInterest * (1 - SPANISH_WITHHOLDING_TAX / 100);

      monthlyBreakdown.push({
        month,
        interest: Math.round(monthInterest * 100) / 100,
        cumulative: Math.round(cumulative * 100) / 100,
        netCumulative: Math.round(netCumulative * 100) / 100,
      });
    }

    return {
      grossInterest: Math.round(totalInterest * 100) / 100,
      withholdingAmount: Math.round(withholding * 100) / 100,
      netInterest: Math.round(netInterest * 100) / 100,
      totalReturn: Math.round((principal + netInterest) * 100) / 100,
      effectiveAnnualRate: Math.round(effectiveAnnualRate * 10000) / 100,
      monthlyBreakdown,
    };
  }, [amount, activeTAE, termMonths]);

  // Datos para gráfica de evolución mensual
  const chartData = useMemo(() => {
    return calculation.monthlyBreakdown.map((m) => ({
      month: m.month,
      interesNeto: m.netCumulative,
      interesBruto: m.cumulative,
    }));
  }, [calculation]);

  const depositChartConfig: ChartConfig = useMemo(() => ({
    interesNeto: { label: "Interés neto acumulado", color: "#10b981" },
    interesBruto: { label: "Interés bruto acumulado", color: "#3b82f6" },
  }), []);

  // Comparación entre bancos
  const bankComparison = useMemo(() => {
    const principal = parseFloat(amount) || 0;
    const months = parseInt(termMonths);

    return depositRates.map((deposit) => {
      const monthlyRate = deposit.tae / 100 / 12;
      const grossInterest = principal * monthlyRate * months;
      const netInterest = grossInterest * (1 - SPANISH_WITHHOLDING_TAX / 100);

      return {
        bank: deposit.bank,
        tae: deposit.tae,
        term: deposit.term,
        grossInterest: Math.round(grossInterest * 100) / 100,
        netInterest: Math.round(netInterest * 100) / 100,
        totalReturn: Math.round((principal + netInterest) * 100) / 100,
        minAmount: deposit.minAmount,
      };
    }).sort((a, b) => b.netInterest - a.netInterest);
  }, [depositRates, amount, termMonths]);

  // Encontrar el mejor depósito
  const bestDeposit = useMemo(() => {
    return bankComparison.length > 0 ? bankComparison[0] : null;
  }, [bankComparison]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
            <Landmark className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Depósitos a Plazo Fijo</h2>
            <p className="text-sm text-muted-foreground">
              Calcula la rentabilidad con tipos reales actualizados diariamente
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchInterestRates}
          disabled={isLoading}
          className="gap-1.5"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      {/* Tipos de interés reales */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Percent className="h-4 w-4 text-blue-500" />
            Tipos de Interés Actuales
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              Datos reales
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs">
            Euribor y tipos del BCE, actualizados diariamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* BCE */}
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 mb-1">
                <Landmark className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-[10px] font-medium text-muted-foreground uppercase">BCE Facilidad Depósito</span>
              </div>
              <p className="text-xl font-bold text-blue-600">{ecbRate > 0 ? `${ecbRate.toFixed(2)}%` : "—"}</p>
              <p className="text-[10px] text-muted-foreground">Tipo de referencia zona euro</p>
            </div>

            {/* Euribor rates */}
            {euriborRates.map((rate) => (
              <div key={rate.term} className="rounded-lg border p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-[10px] font-medium text-muted-foreground uppercase">Euribor {rate.term}</span>
                </div>
                <p className="text-xl font-bold text-amber-600">{rate.rate > 0 ? `${rate.rate.toFixed(3)}%` : "—"}</p>
                <p className="text-[10px] text-muted-foreground">{rate.source}</p>
              </div>
            ))}
          </div>

          {lastUpdated && (
            <p className="text-[10px] text-muted-foreground mt-2 text-right">
              Última actualización: {new Date(lastUpdated).toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Calculadora principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Panel de entrada */}
        <Card className="border-0 shadow-sm lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              Configura tu Depósito
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Capital a invertir (€)</Label>
              <Input
                type="number"
                placeholder="20000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-lg font-semibold"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Plazo del depósito</Label>
              <Select value={termMonths} onValueChange={setTermMonths}>
                <SelectTrigger>
                  <Clock className="h-3.5 w-3.5 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {termOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-xs">Selecciona un banco</Label>
              <Select
                value={selectedBank}
                onValueChange={(v) => {
                  if (v === "custom") {
                    setUseCustomRate(true);
                    setSelectedBank("");
                  } else {
                    setUseCustomRate(false);
                    setSelectedBank(v);
                  }
                }}
              >
                <SelectTrigger>
                  <Building2 className="h-3.5 w-3.5 mr-2" />
                  <SelectValue placeholder="Elige banco o TAE personalizado" />
                </SelectTrigger>
                <SelectContent>
                  {depositRates.map((deposit) => (
                    <SelectItem key={deposit.bank} value={deposit.bank}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{deposit.bank}</span>
                        <span className="text-muted-foreground">— {deposit.term}</span>
                        <Badge variant="secondary" className="text-[9px] px-1 py-0">
                          {deposit.tae}% TAE
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-3 w-3" />
                      <span>TAE personalizado</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {useCustomRate && (
              <div className="space-y-2">
                <Label className="text-xs">TAE personalizado (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="2.85"
                  value={customTAE}
                  onChange={(e) => setCustomTAE(e.target.value)}
                  className="text-lg font-semibold"
                />
              </div>
            )}

            {/* Info del banco seleccionado */}
            {selectedDeposit && (
              <div className="rounded-lg bg-muted/50 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">{selectedDeposit.bank}</span>
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                    {selectedDeposit.term}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-muted-foreground">TAE: </span>
                    <span className="font-semibold text-emerald-600">{selectedDeposit.tae}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">TIN: </span>
                    <span className="font-semibold">{selectedDeposit.tin}%</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Mínimo: </span>
                    <span className="font-semibold">{formatCurrency(selectedDeposit.minAmount)}</span>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">Fuente: {selectedDeposit.source}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resultados */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Banknote className="h-4 w-4 text-primary" />
              Resultado del Depósito
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                TAE {activeTAE.toFixed(2)}%
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Resumen numérico */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Interés Bruto</p>
                <p className="text-base font-bold text-blue-600">{formatCurrency(calculation.grossInterest)}</p>
              </div>
              <div className="rounded-lg bg-rose-50 dark:bg-rose-950/30 p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Retención (19%)</p>
                <p className="text-base font-bold text-rose-600">-{formatCurrency(calculation.withholdingAmount)}</p>
              </div>
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Interés Neto</p>
                <p className="text-base font-bold text-emerald-600">{formatCurrency(calculation.netInterest)}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total a Recibir</p>
                <p className="text-base font-bold">{formatCurrency(calculation.totalReturn)}</p>
              </div>
            </div>

            {/* Visualización del desglose */}
            <div className="rounded-lg border p-4 space-y-3">
              <h4 className="text-xs font-semibold">Desglose de la rentabilidad</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Capital invertido</span>
                  <span className="font-semibold">{formatCurrency(parseFloat(amount) || 0)}</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Interés bruto acumulado</span>
                  <span className="font-semibold text-blue-600">+{formatCurrency(calculation.grossInterest)}</span>
                </div>
                <Progress
                  value={Math.min(100, (calculation.grossInterest / (parseFloat(amount) || 1)) * 100 * 5)}
                  className="h-2"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Retención Hacienda (19%)</span>
                  <span className="font-semibold text-rose-600">-{formatCurrency(calculation.withholdingAmount)}</span>
                </div>
                <Progress
                  value={Math.min(100, (calculation.withholdingAmount / (parseFloat(amount) || 1)) * 100 * 10)}
                  className="h-2"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>Interés neto real</span>
                <span className="text-emerald-600">{formatCurrency(calculation.netInterest)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">TAE real neta (después de retención)</span>
                <span className="font-semibold">
                  {activeTAE > 0 ? (activeTAE * (1 - SPANISH_WITHHOLDING_TAX / 100)).toFixed(2) : "0.00"}%
                </span>
              </div>
            </div>

            {/* Gráfica de evolución */}
            <div>
              <h4 className="text-xs font-semibold mb-2">Evolución del interés acumulado</h4>
              <ChartContainer config={depositChartConfig} className="h-[200px] w-full">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fillGross" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} label={{ value: "Mes", position: "insideBottomRight", offset: -5, fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v: number) => `${v}€`} />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      depositChartConfig[name as keyof typeof depositChartConfig]?.label || name,
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="interesBruto"
                    stroke="#3b82f6"
                    fill="url(#fillGross)"
                    strokeWidth={1.5}
                    dot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="interesNeto"
                    stroke="#10b981"
                    fill="url(#fillNet)"
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ChartContainer>
            </div>

            {/* Tabla de desglose mensual */}
            <div className="rounded-lg border overflow-hidden overflow-x-auto">
              <div className="min-w-[300px]">
                <div className="grid grid-cols-4 gap-1 p-2 bg-muted/50 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <span>Mes</span>
                  <span className="text-right whitespace-nowrap">Interés/mes</span>
                  <span className="text-right whitespace-nowrap">Bruto acum.</span>
                  <span className="text-right whitespace-nowrap">Neto acum.</span>
                </div>
                <div className="max-h-[150px] overflow-y-auto">
                  {calculation.monthlyBreakdown.map((m) => (
                    <div
                      key={m.month}
                      className="grid grid-cols-4 gap-1 p-2 text-xs border-t hover:bg-muted/30"
                    >
                    <span className="font-medium">{m.month}</span>
                    <span className="text-right whitespace-nowrap">{formatCurrency(m.interest)}</span>
                    <span className="text-right text-blue-600 whitespace-nowrap">{formatCurrency(m.cumulative)}</span>
                    <span className="text-right text-emerald-600 font-semibold whitespace-nowrap">
                      {formatCurrency(m.netCumulative)}
                    </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparativa de bancos */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Scale className="h-4 w-4 text-primary" />
            Comparativa de Bancos
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              Tasas reales
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs">
            Comparación de rentabilidad para {formatCurrency(parseFloat(amount) || 0)} a {termMonths} meses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[500px]">
          <div className="space-y-2 pr-1">
            {bankComparison.map((bank, idx) => (
              <div
                key={bank.bank}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer",
                  idx === 0 && "border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20",
                  selectedBank === bank.bank && "border-primary bg-primary/5"
                )}
                onClick={() => {
                  setSelectedBank(bank.bank);
                  setUseCustomRate(false);
                }}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    idx === 0
                      ? "bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-200"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{bank.bank}</span>
                    {idx === 0 && (
                      <Badge className="text-[9px] px-1.5 py-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                        Mejor opción
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-[9px] px-1 py-0">
                      {bank.term}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground">
                    <span>TAE: <span className="font-semibold text-foreground">{bank.tae}%</span></span>
                    <span>Mín: {formatCurrency(bank.minAmount)}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-emerald-600">+{formatCurrency(bank.netInterest)}</p>
                  <p className="text-[10px] text-muted-foreground">neto a recibir</p>
                </div>
              </div>
            ))}
          </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Info contextual */}
      <div className="rounded-lg bg-muted/50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Info className="h-4 w-4 text-blue-500" />
          <span className="text-xs font-semibold">Información sobre depósitos a plazo fijo</span>
        </div>
        <ul className="space-y-1 text-[11px] text-muted-foreground leading-relaxed">
          <li>Los depósitos a plazo fijo están <strong>garantizados por el Fondo de Garantía de Depósitos</strong> hasta 100.000€ por entidad y titular.</li>
          <li>La <strong>retención del 19%</strong> se aplica sobre los rendimientos del capital mobiliario en España (IRPF).</li>
          <li>TAE (Tasa Anual Equivalente) incluye el efecto de la capitalización, mientras que TIN (Tipo de Interés Nominal) no.</li>
          <li>Los tipos de Euribor se actualizan diariamente. Las tasas de depósitos pueden variar según la entidad.</li>
          <li>Retirar el dinero antes del vencimiento puede conllevar penalizaciones que reduzcan el rendimiento.</li>
          <li>Para cantidades superiores a 100.000€ en una misma entidad, considera diversificar entre bancos para maximizar la cobertura del FGD.</li>
        </ul>
      </div>
    </div>
  );
}

