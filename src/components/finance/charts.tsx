/**
 * ============================================
 * Gráficas Financieras - Recharts
 * ============================================
 * Componentes de gráficas para visualizar:
 * 1. Tendencia de ingresos vs gastos (líneas)
 * 2. Proyección del próximo mes (barras)
 * 3. Distribución por categoría (donut)
 */

"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import { useFinanceStore } from "@/store/finance-store";
import {
  calculateMonthlySummary,
  formatCurrency,
  formatMonth,
  generateProjections,
  getRecentMonths,
  getMonthFromISO,
} from "@/lib/finance-utils";
import { CATEGORY_CONFIG, type TransactionCategory } from "@/lib/types";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

// ---- Configuraciones de colores para las gráficas ----

const trendChartConfig: ChartConfig = {
  income: { label: "Ingresos", color: "#10b981" },
  expenses: { label: "Gastos", color: "#f43f5e" },
  balance: { label: "Balance", color: "#6366f1" },
};

const projectionChartConfig: ChartConfig = {
  projectedIncome: { label: "Ingresos Proyectados", color: "#10b981" },
  projectedExpenses: { label: "Gastos Proyectados", color: "#f43f5e" },
  projectedBalance: { label: "Balance Proyectado", color: "#6366f1" },
};

/**
 * Gráfica de tendencia: Ingresos vs Gastos de los últimos 6 meses.
 * Usa un AreaChart para mejor visualización del área bajo las curvas.
 */
export function TrendChart() {
  const { transactions } = useFinanceStore();

  const data = useMemo(() => {
    const months = getRecentMonths(transactions, 6);
    return months.map((month) => {
      const summary = calculateMonthlySummary(transactions, month);
      return {
        month: new Date(month + "-01").toLocaleDateString("es-ES", {
          month: "short",
        }),
        income: summary.totalIncome,
        expenses: summary.totalExpenses,
        balance: summary.balance,
      };
    });
  }, [transactions]);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Tendencia Mensual</CardTitle>
        <CardDescription className="text-xs">
          Ingresos y gastos de los últimos 6 meses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={trendChartConfig} className="h-[280px] w-full">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fillExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v) => `${v}€`} />
            <ChartTooltip
              content={<ChartTooltipContent />}
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                trendChartConfig[name as keyof typeof trendChartConfig]?.label || name,
              ]}
            />
            <Area
              type="monotone"
              dataKey="income"
              stroke="#10b981"
              fill="url(#fillIncome)"
              strokeWidth={2}
              dot={{ r: 3, fill: "#10b981" }}
            />
            <Area
              type="monotone"
              dataKey="expenses"
              stroke="#f43f5e"
              fill="url(#fillExpenses)"
              strokeWidth={2}
              dot={{ r: 3, fill: "#f43f5e" }}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

/**
 * Gráfica de proyección: Estimación de ingresos/gastos
 * para los próximos 3 meses.
 */
export function ProjectionChart() {
  const { transactions } = useFinanceStore();

  const data = useMemo(() => {
    return generateProjections(transactions, 3);
  }, [transactions]);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Proyección Próximos 3 Meses</CardTitle>
        <CardDescription className="text-xs">
          Estimación basada en tu historial de gastos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={projectionChartConfig} className="h-[280px] w-full">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v) => `${v}€`} />
            <ChartTooltip
              content={<ChartTooltipContent />}
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                projectionChartConfig[name as keyof typeof projectionChartConfig]?.label || name,
              ]}
            />
            <Bar dataKey="projectedIncome" fill="#10b981" radius={[4, 4, 0, 0]} barSize={28} />
            <Bar dataKey="projectedExpenses" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={28} />
            <ChartLegend content={<ChartLegendContent />} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

/**
 * Gráfica de distribución: Gastos por categoría (Donut).
 */
export function CategoryBreakdownChart() {
  const { transactions, selectedMonth } = useFinanceStore();

  const data = useMemo(() => {
    const summary = calculateMonthlySummary(transactions, selectedMonth);
    const entries = Object.entries(summary.byCategory)
      .filter(([, amount]) => amount > 0)
      .map(([category, amount]) => ({
        category,
        label: CATEGORY_CONFIG[category as TransactionCategory]?.label || category,
        amount,
        color: CATEGORY_CONFIG[category as TransactionCategory]?.color || "#6b7280",
      }))
      .sort((a, b) => b.amount - a.amount);

    return entries;
  }, [transactions, selectedMonth]);

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {};
    for (const item of data) {
      config[item.category] = { label: item.label, color: item.color };
    }
    return config;
  }, [data]);

  const total = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Gastos por Categoría</CardTitle>
        <CardDescription className="text-xs">
          Distribución del mes seleccionado
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row items-center gap-4">
          <ChartContainer config={chartConfig} className="h-[220px] w-[220px] shrink-0">
            <PieChart>
              <Pie
                data={data}
                dataKey="amount"
                nameKey="category"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                strokeWidth={2}
                stroke="var(--background)"
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <ChartTooltip
                formatter={(value: number, name: string) => [
                  `${formatCurrency(value)} (${Math.round((value / total) * 100)}%)`,
                  chartConfig[name as keyof typeof chartConfig]?.label || name,
                ]}
              />
            </PieChart>
          </ChartContainer>
          <div className="flex-1 w-full space-y-2 max-h-[220px] overflow-y-auto">
            {data.map((item) => (
              <div key={item.category} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-muted-foreground truncate">{item.label}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold">{formatCurrency(item.amount)}</span>
                  <span className="text-[10px] text-muted-foreground w-8 text-right">
                    {Math.round((item.amount / total) * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
