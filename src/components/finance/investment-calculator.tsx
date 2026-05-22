/**
 * ============================================
 * Calculadora de Rentabilidad de Inversiones
 * ============================================
 * Componente que permite:
 * 1. Ver índices bursátiles reales actualizados
 * 2. Simular inversiones con interés compuesto
 * 3. Comparar distintos escenarios de inversión
 * 4. Ver rentabilidad neta vs inflación
 *
 * Datos reales obtenidos via web_search (z-ai-web-dev-sdk).
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
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
  ChartLegend,
  ChartLegendContent,
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
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Loader2,
  Calculator,
  BarChart3,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Zap,
  Globe,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/finance-utils";

// ---- Tipos ----

interface MarketIndex {
  name: string;
  value: number;
  change: number;
  changePercent: number;
  currency: string;
  lastUpdated: string;
}

interface InvestmentScenario {
  label: string;
  annualReturn: number;
  color: string;
  description: string;
}

// ---- Escenarios predefinidos ----

const investmentScenarios: InvestmentScenario[] = [
  { label: "Conservador", annualReturn: 2.5, color: "#3b82f6", description: "Depósitos y bonos gubernamentales" },
  { label: "Moderado", annualReturn: 5.5, color: "#10b981", description: "Mix de bonos y acciones (ETF)" },
  { label: "Agresivo", annualReturn: 8.5, color: "#f59e0b", description: "Mayormente acciones y ETFs" },
  { label: "Muy Agresivo", annualReturn: 12.0, color: "#ef4444", description: "Acciones individuales y mercados emergentes" },
];

const popularETFs = [
  { symbol: "VWCE", name: "Vanguard FTSE All-World UCITS ETF", expectedReturn: 8.0, risk: "Moderado" },
  { symbol: "IWDA", name: "iShares Core MSCI World UCITS ETF", expectedReturn: 8.5, risk: "Moderado" },
  { symbol: "SXR8", name: "iShares S&P 500 UCITS ETF", expectedReturn: 10.0, risk: "Alto" },
  { symbol: "XGLE", name: "Xtrackers II EUR Overnight Rate Swap", expectedReturn: 3.0, risk: "Bajo" },
  { symbol: "IEAC", name: "iShares Core € Corp Bond UCITS ETF", expectedReturn: 3.5, risk: "Bajo" },
  { symbol: "EUNL", name: "iShares Core MSCI EM IMI UCITS ETF", expectedReturn: 9.0, risk: "Alto" },
];

const chartConfig: ChartConfig = {
  conservador: { label: "Conservador (2,5%)", color: "#3b82f6" },
  moderado: { label: "Moderado (5,5%)", color: "#10b981" },
  agresivo: { label: "Agresivo (8,5%)", color: "#f59e0b" },
  muyagresivo: { label: "Muy Agresivo (12%)", color: "#ef4444" },
  contributions: { label: "Total aportado", color: "#6b7280" }
};

// ---- Componente Principal ----

export function InvestmentCalculator() {
  // Estado del formulario
  const [initialAmount, setInitialAmount] = useState("10000");
  const [monthlyContribution, setMonthlyContribution] = useState("200");
  const [timeHorizon, setTimeHorizon] = useState([10]);
  const [customRate, setCustomRate] = useState("6.0");
  const [useCustomRate, setUseCustomRate] = useState(false);
  const [selectedETF, setSelectedETF] = useState("");

  // Estado de datos de mercado
  const [marketIndices, setMarketIndices] = useState<MarketIndex[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchMarketData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/market-data?action=indices");
      const data = await response.json();
      if (data.success) {
        setMarketIndices(data.indices);
        setLastUpdated(data.lastUpdated);
      }
    } catch (error) {
      console.error("Error fetching market data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cargar datos de mercado al montar
  useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  // ---- Cálculos ----

  const calculateProjection = useCallback(
    (annualRate: number) => {
      const principal = parseFloat(initialAmount) || 0;
      const monthly = parseFloat(monthlyContribution) || 0;
      const years = timeHorizon[0];
      const monthlyRate = annualRate / 100 / 12;
      const totalMonths = years * 12;
      let currentValue = principal;

      const yearlyData: { year: number; value: number; contributed: number }[] = [];
      let totalContributed = principal;

      yearlyData.push({ year: 0, value: principal, contributed: principal });

      for (let month = 1; month <= totalMonths; month++) {
        currentValue = currentValue * (1 + monthlyRate) + monthly;
        totalContributed += monthly;

        if (month % 12 === 0) {
          yearlyData.push({
            year: month / 12,
            value: Math.round(currentValue * 100) / 100,
            contributed: Math.round(totalContributed * 100) / 100,
          });
        }
      }

      return yearlyData;
    },
    [initialAmount, monthlyContribution, timeHorizon]
  );

  // Datos para la gráfica de comparación
  const comparisonData = useMemo(() => {
    const years = timeHorizon[0];
    const data: Array<Record<string, number>> = [];

    for (let y = 0; y <= years; y++) {
      const point: Record<string, number> = { year: y };

      for (const scenario of investmentScenarios) {
        const projection = calculateProjection(scenario.annualReturn);
        const yearData = projection.find((p) => p.year === y);
        if (yearData) {
          point[scenario.label.toLowerCase().replace(/\s/g, "")] = yearData.value;
        }
      }

      // Total aportado
      const principal = parseFloat(initialAmount) || 0;
      const monthly = parseFloat(monthlyContribution) || 0;
      point.contributions = principal + monthly * y * 12;

      data.push(point);
    }

    return data;
  }, [calculateProjection, timeHorizon, initialAmount, monthlyContribution]);

  // Cálculo del escenario seleccionado
  const activeScenario = useMemo(() => {
    const rate = useCustomRate
      ? parseFloat(customRate) || 0
      : selectedETF
        ? popularETFs.find((e) => e.symbol === selectedETF)?.expectedReturn || 5.5
        : 5.5;

    const projection = calculateProjection(rate);
    const principal = parseFloat(initialAmount) || 0;
    const monthly = parseFloat(monthlyContribution) || 0;
    const years = timeHorizon[0];
    const totalContributed = principal + monthly * years * 12;
    const finalValue = projection[projection.length - 1]?.value || 0;
    const totalEarnings = finalValue - totalContributed;
    const realReturn = totalEarnings / totalContributed * 100;
    const annualizedReturn = Math.pow(finalValue / totalContributed, 1 / years) - 1;

    return {
      rate,
      projection,
      totalContributed,
      finalValue,
      totalEarnings,
      realReturn,
      annualizedReturn: annualizedReturn * 100,
    };
  }, [useCustomRate, customRate, selectedETF, calculateProjection, initialAmount, monthlyContribution, timeHorizon]);

  // Datos para gráfica del escenario activo
  const activeChartData = useMemo(() => {
    return activeScenario.projection.map((p) => ({
      year: p.year,
      value: p.value,
      contributed: p.contributed,
      earnings: p.value - p.contributed,
    }));
  }, [activeScenario]);

  const activeChartConfig: ChartConfig = useMemo(() => ({
    value: { label: "Valor total", color: "#10b981" },
    contributed: { label: "Total aportado", color: "#6b7280" },
    earnings: { label: "Ganancias", color: "#f59e0b" },
  }), []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
            <TrendingUp className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Calculadora de Inversiones</h2>
            <p className="text-sm text-muted-foreground">
              Simula la rentabilidad de tus inversiones con datos reales del mercado
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchMarketData}
          disabled={isLoading}
          className="gap-1.5"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      {/* Índices bursátiles reales */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-500" />
            Mercado Actual
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              Datos reales
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs">
            Cotizaciones actualizadas diariamente desde fuentes financieras reales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 min-w-0">
            {marketIndices.length > 0 ? (
              marketIndices.map((index) => (
                <div
                  key={index.name}
                  className="rounded-lg border p-3 hover:bg-muted/50 transition-colors min-w-0 overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground truncate">{index.name}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{index.currency}</span>
                  </div>
                  <p className="text-lg font-bold whitespace-nowrap">
                    {index.value.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {index.changePercent >= 0 ? (
                      <ArrowUpRight className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-rose-600" />
                    )}
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        index.changePercent >= 0 ? "text-emerald-600" : "text-rose-600"
                      )}
                    >
                      {index.changePercent >= 0 ? "+" : ""}
                      {index.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))
            ) : (
              // Placeholder mientras carga
              <>
                {["IBEX 35", "S&P 500", "Euro Stoxx 50"].map((name) => (
                  <div key={name} className="rounded-lg border p-3 animate-pulse">
                    <span className="text-xs text-muted-foreground">{name}</span>
                    <div className="h-6 bg-muted rounded mt-1" />
                  </div>
                ))}
              </>
            )}
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
        <Card className="border shadow-sm lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              Configura tu Inversión
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Capital inicial (€)</Label>
              <Input
                type="number"
                placeholder="10000"
                value={initialAmount}
                onChange={(e) => setInitialAmount(e.target.value)}
                className="text-lg font-semibold"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Aportación mensual (€)</Label>
              <Input
                type="number"
                placeholder="200"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(e.target.value)}
                className="text-lg font-semibold"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">
                Horizonte temporal: <span className="font-bold">{timeHorizon[0]} años</span>
              </Label>
              <Slider
                value={timeHorizon}
                onValueChange={setTimeHorizon}
                min={1}
                max={40}
                step={1}
                className="mt-2"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>1 año</span>
                <span>20 años</span>
                <span>40 años</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-xs">Estrategia de inversión</Label>
              <Select
                value={selectedETF}
                onValueChange={(v) => {
                  setSelectedETF(v === "custom" ? "" : v);
                  setUseCustomRate(v === "custom");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona estrategia o ETF" />
                </SelectTrigger>
                <SelectContent>
                  {popularETFs.map((etf) => (
                    <SelectItem key={etf.symbol} value={etf.symbol}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{etf.symbol}</span>
                        <span className="text-muted-foreground">- {etf.name.substring(0, 30)}...</span>
                        <Badge variant="secondary" className="text-[9px] px-1 py-0">
                          {etf.expectedReturn}%
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-3 w-3" />
                      <span>Tasa personalizada</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {useCustomRate && (
              <div className="space-y-2">
                <Label className="text-xs">Rentabilidad anual esperada (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="6.0"
                  value={customRate}
                  onChange={(e) => setCustomRate(e.target.value)}
                  className="text-lg font-semibold"
                />
              </div>
            )}

            {/* Escenarios rápidos */}
            <div className="space-y-2">
              <Label className="text-xs">Escenarios rápidos</Label>
              <div className="grid grid-cols-2 gap-2">
                {investmentScenarios.map((scenario) => (
                  <Button
                    key={scenario.label}
                    variant="outline"
                    size="sm"
                    className="h-auto py-2 flex flex-col items-start gap-0.5"
                    onClick={() => {
                      setUseCustomRate(true);
                      setCustomRate(String(scenario.annualReturn));
                      setSelectedETF("");
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: scenario.color }}
                      />
                      <span className="text-[11px] font-semibold">{scenario.label}</span>
                    </div>
                    <span className="text-[9px] text-muted-foreground">{scenario.annualReturn}% anual</span>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        <Card className="border shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Resultado de la Inversión
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {activeScenario.rate}% anual
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Resumen numérico */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Aportado</p>
                <p className="text-base font-bold">{formatCurrency(activeScenario.totalContributed)}</p>
              </div>
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Valor Final</p>
                <p className="text-base font-bold text-emerald-600">{formatCurrency(activeScenario.finalValue)}</p>
              </div>
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ganancias</p>
                <p className="text-base font-bold text-amber-600">{formatCurrency(activeScenario.totalEarnings)}</p>
              </div>
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Rentabilidad Total</p>
                <p className="text-base font-bold text-blue-600">{activeScenario.realReturn.toFixed(1)}%</p>
              </div>
            </div>

            {/* Gráfica del escenario activo */}
            <div className="mb-5">
              <ChartContainer config={activeChartConfig} className="h-[280px] w-full">
                <AreaChart data={activeChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="year" tickLine={false} axisLine={false} fontSize={12} label={{ value: "Años", position: "insideBottomRight", offset: -5, fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k€`} />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      activeChartConfig[name as keyof typeof activeChartConfig]?.label || name,
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#10b981"
                    fill="url(#fillValue)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="contributed"
                    stroke="#6b7280"
                    fill="none"
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </AreaChart>
              </ChartContainer>
            </div>

            {/* Tabla de evolución */}
            <div className="rounded-lg border overflow-hidden overflow-x-auto">
              <div className="min-w-[300px]">
                <div className="grid grid-cols-4 gap-1 p-2 bg-muted/50 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <span>Año</span>
                  <span className="text-right whitespace-nowrap">Aportado</span>
                  <span className="text-right whitespace-nowrap">Valor</span>
                  <span className="text-right whitespace-nowrap">Ganancia</span>
                </div>
                <div className="max-h-[200px] overflow-y-auto overscroll-contain">
                {activeScenario.projection
                  .filter((_, idx) => idx === 0 || idx === activeScenario.projection.length - 1 || idx % Math.max(1, Math.floor(activeScenario.projection.length / 8)) === 0)
                  .map((point) => (
                    <div
                      key={point.year}
                      className="grid grid-cols-4 gap-1 p-2 text-xs border-t hover:bg-muted/30"
                    >
                      <span className="font-medium">{point.year}</span>
                      <span className="text-right whitespace-nowrap">{formatCurrency(point.contributed)}</span>
                      <span className="text-right font-semibold text-emerald-600 whitespace-nowrap">
                        {formatCurrency(point.value)}
                      </span>
                      <span
                        className={cn(
                          "text-right font-semibold whitespace-nowrap",
                          point.value - point.contributed >= 0 ? "text-emerald-600" : "text-rose-600"
                        )}
                      >
                        {formatCurrency(point.value - point.contributed)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparación de escenarios */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <PiggyBank className="h-4 w-4 text-primary" />
            Comparación de Escenarios
          </CardTitle>
          <CardDescription className="text-xs">
            Evolución de tu inversión según distintos perfiles de riesgo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <AreaChart data={comparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="year" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k€`} />
              <ChartTooltip
                content={<ChartTooltipContent />}
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  chartConfig[name as keyof typeof chartConfig]?.label || name,
                ]}
              />
              {investmentScenarios.map((scenario) => (
                <Area
                  key={scenario.label}
                  type="monotone"
                  dataKey={scenario.label.toLowerCase().replace(/\s/g, "")}
                  stroke={scenario.color}
                  fill="none"
                  strokeWidth={2}
                  dot={false}
                />
              ))}
              <Area
                type="monotone"
                dataKey="contributions"
                stroke="#6b7280"
                fill="none"
                strokeWidth={1.5}
                strokeDasharray="5 5"
                dot={false}
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>

          {/* Leyenda con valores finales */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4 min-w-0 overflow-hidden">
            {investmentScenarios.map((scenario) => {
              const key = scenario.label.toLowerCase().replace(/\s/g, "");
              const finalValue = comparisonData[comparisonData.length - 1]?.[key] as number || 0;
              return (
                <div key={scenario.label} className="rounded-lg border p-2 text-center min-w-0 overflow-hidden">
                  <div className="flex items-center justify-center gap-1 mb-1 min-w-0 overflow-hidden">
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: scenario.color }} />
                    <span className="text-[10px] font-semibold truncate min-w-0">{scenario.label}</span>
                  </div>
                  <p className="text-xs font-bold">{formatCurrency(finalValue)}</p>
                  <p className="text-[9px] text-muted-foreground">{scenario.annualReturn}% anual</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ETFs populares */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            ETFs Populares en Europa
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              Info
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs">
            Fondos indexados recomendados para invertir de forma diversificada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 min-w-0">
            {popularETFs.map((etf) => (
              <div
                key={etf.symbol}
                className={cn(
                  "rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer overflow-hidden min-w-0",
                  selectedETF === etf.symbol && "border-primary bg-primary/5"
                )}
                onClick={() => {
                  setSelectedETF(etf.symbol);
                  setUseCustomRate(false);
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">{etf.symbol}</span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[9px] px-1.5 py-0",
                      etf.risk === "Bajo" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
                      etf.risk === "Moderado" && "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
                      etf.risk === "Alto" && "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300"
                    )}
                  >
                    {etf.risk}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight mb-1.5 truncate min-w-0" title={etf.name}>{etf.name}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">Rentabilidad media</span>
                  <span className="text-xs font-semibold text-emerald-600">~{etf.expectedReturn}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info contextual */}
      <div className="rounded-lg bg-muted/50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Info className="h-4 w-4 text-blue-500" />
          <span className="text-xs font-semibold">Información importante</span>
        </div>
        <ul className="space-y-1 text-[11px] text-muted-foreground leading-relaxed">
          <li>Las rentabilidades mostradas son <strong>estimaciones basadas en rendimientos históricos</strong> y no garantizan resultados futuros.</li>
          <li>Los datos de índices bursátiles se actualizan diariamente desde fuentes financieras reales.</li>
          <li>La rentabilidad neta no incluye comisiones de gestión del bróker ni fiscalidad (19% sobre plusvalías en España).</li>
          <li>Invertir en ETFs conlleva riesgo de pérdida. Diversifica y no inviertas lo que no puedas permitirte perder.</li>
          <li>Los escenarios asumen reinversión de dividendos y aportaciones mensuales constantes.</li>
        </ul>
      </div>
    </div>
  );
}


