/**
 * ============================================
 * Calendario de Pagos
 * ============================================
 * Componente visual de calendario que muestra
 * ingresos, gastos recurrentes, suscripciones,
 * pagos de deudas e impuestos.
 */

"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/finance-utils";
import { useFinanceStore } from "@/store/finance-store";
import {
  generateCalendarEvents,
  getEventsForMonth,
  getEventsForDate,
  getUpcomingEvents,
  EVENT_TYPE_CONFIG,
} from "@/lib/payment-calendar";
import type { CalendarEvent, CalendarEventType } from "@/lib/types";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  TrendingUp,
  Repeat,
  CreditCard,
  Landmark,
  FileText,
  BarChart3,
  Clock,
  Filter,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// CONSTANTS
// ============================================

const DAYS_OF_WEEK = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const DAYS_OF_WEEK_SHORT = ["L", "M", "X", "J", "V", "S", "D"];
const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// ============================================
// EVENT ICON MAP
// ============================================

const EVENT_ICONS: Record<CalendarEventType, typeof TrendingUp> = {
  income: TrendingUp,
  expense_recurring: Repeat,
  subscription: CreditCard,
  debt_payment: Landmark,
  tax_payment: FileText,
  budget_check: BarChart3,
};

// ============================================
// HELPERS
// ============================================

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  // 0=domingo, convertimos a 0=lunes
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function formatDateFull(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function isToday(dateStr: string): boolean {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return dateStr === todayStr;
}

// ============================================
// EVENT CARD
// ============================================

function EventCard({ event }: { event: CalendarEvent }) {
  const config = EVENT_TYPE_CONFIG[event.type];
  const Icon = EVENT_ICONS[event.type];

  return (
    <div
      className={cn(
        "flex items-center gap-2 sm:gap-3 rounded-lg border p-3 transition-all hover:shadow-sm overflow-hidden min-w-0",
        config.bgColor
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          config.bgColor
        )}
      >
        <Icon className={cn("h-4 w-4", config.color)} />
      </div>
      <div className="flex-1 min-w-0 overflow-hidden">
        <p className="text-xs font-medium truncate min-w-0 overflow-hidden">{event.title}</p>
        <p className="text-[10px] text-muted-foreground truncate min-w-0 overflow-hidden">
          {formatDateShort(event.date)}
          {event.isRecurring && event.recurrencePattern && (
            <span className="ml-1">
              · {event.recurrencePattern === "monthly" ? "Mensual" : event.recurrencePattern === "quarterly" ? "Trimestral" : "Anual"}
            </span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge
          variant="secondary"
          className={cn("text-[10px] px-1.5 py-0 shrink-0", config.color, config.bgColor, "border-0")}
        >
          {config.label}
        </Badge>
        {event.amount > 0 && (
          <span
            className={cn(
              "text-xs font-semibold whitespace-nowrap",
              event.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            )}
          >
            {event.type === "income" ? "+" : "−"}
            {formatCurrency(event.amount)}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================
// CALENDAR GRID
// ============================================

function CalendarGrid({
  year,
  month,
  events,
  selectedDate,
  onSelectDate,
  mounted,
}: {
  year: number;
  month: number;
  events: CalendarEvent[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  mounted: boolean;
}) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Agrupar eventos por día
  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const event of events) {
      const day = event.date.split("-")[2];
      if (!map[day]) map[day] = [];
      map[day].push(event);
    }
    return map;
  }, [events]);

  // Construir celdas del calendario
  const cells: (number | null)[] = [];
  // Celdas vacías al inicio
  for (let i = 0; i < firstDay; i++) {
    cells.push(null);
  }
  // Días del mes
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  return (
    <div className="space-y-1 min-w-0">
      {/* Header días de la semana */}
      <div className="grid grid-cols-7 gap-1">
        {DAYS_OF_WEEK.map((day, idx) => (
          <div
            key={day}
            className="text-center text-[10px] font-semibold text-muted-foreground py-1"
          >
            <span className="sm:hidden">{DAYS_OF_WEEK_SHORT[idx]}</span>
            <span className="hidden sm:inline">{day}</span>
          </div>
        ))}
      </div>

      {/* Grid de días */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="h-10 sm:h-14 lg:h-16" />;
          }

          const dayStr = String(day).padStart(2, "0");
          const monthStr = String(month + 1).padStart(2, "0");
          const dateStr = `${year}-${monthStr}-${dayStr}`;
          const dayEvents = eventsByDay[dayStr] || [];
          const today = mounted && isToday(dateStr);
          const selected = selectedDate === dateStr;

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={cn(
                "h-10 sm:h-14 lg:h-16 rounded-lg p-1 text-left transition-all relative group",
                today && "ring-2 ring-primary ring-offset-1",
                selected
                  ? "bg-primary/10 border border-primary"
                  : "hover:bg-muted/50 border border-transparent"
              )}
            >
              <span
                className={cn(
                  "text-[11px] font-medium",
                  today ? "text-primary font-bold" : "text-foreground"
                )}
              >
                {day}
              </span>
              {dayEvents.length > 0 && (
                <div className="flex flex-wrap gap-0.5 mt-0.5 overflow-hidden">
                  {dayEvents.slice(0, 3).map((ev, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-1.5 w-1.5 sm:h-1.5 sm:w-1.5 rounded-full shrink-0",
                        ev.type === "income" && "bg-emerald-500",
                        ev.type === "expense_recurring" && "bg-rose-500",
                        ev.type === "subscription" && "bg-pink-500",
                        ev.type === "debt_payment" && "bg-orange-500",
                        ev.type === "budget_check" && "bg-sky-500",
                        ev.type === "tax_payment" && "bg-purple-500"
                      )}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[8px] text-muted-foreground leading-none">
                      +{dayEvents.length - 3}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// TYPE FILTER
// ============================================

function TypeFilter({
  selectedTypes,
  onToggleType,
}: {
  selectedTypes: Set<CalendarEventType>;
  onToggleType: (type: CalendarEventType) => void;
}) {
  const allTypes: CalendarEventType[] = [
    "income",
    "expense_recurring",
    "subscription",
    "debt_payment",
    "budget_check",
    "tax_payment",
  ];

  return (
    <div className="flex flex-wrap gap-1.5">
      {allTypes.map((type) => {
        const config = EVENT_TYPE_CONFIG[type];
        const isSelected = selectedTypes.has(type);
        return (
          <Button
            key={type}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={() => onToggleType(type)}
            className={cn("text-[10px] h-7 gap-1", isSelected && config.bgColor, isSelected && config.color)}
          >
            {config.label}
            {isSelected && <X className="h-3 w-3" />}
          </Button>
        );
      })}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function PaymentCalendar() {
  const { transactions, subscriptions, debts, budgets } = useFinanceStore();

  // Hydration-safe mount check
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Navegación de mes (safe default, updated on mount)
  const [viewYear, setViewYear] = useState(2025);
  const [viewMonth, setViewMonth] = useState(0);
  useEffect(() => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  }, []);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<Set<CalendarEventType>>(
    new Set(["income", "expense_recurring", "subscription", "debt_payment", "tax_payment"])
  );
  const [showAllEvents, setShowAllEvents] = useState(false);

  // Generar todos los eventos
  const allEvents = useMemo(
    () => generateCalendarEvents(transactions, subscriptions, debts, budgets),
    [transactions, subscriptions, debts, budgets]
  );

  // Eventos del mes actual
  const monthEvents = useMemo(
    () => getEventsForMonth(allEvents, viewYear, viewMonth),
    [allEvents, viewYear, viewMonth]
  );

  // Filtrar por tipos seleccionados
  const filteredMonthEvents = useMemo(
    () => monthEvents.filter((e) => selectedTypes.has(e.type)),
    [monthEvents, selectedTypes]
  );

  // Eventos del día seleccionado
  const dayEvents = useMemo(() => {
    if (!selectedDate) return [];
    return getEventsForDate(allEvents, selectedDate).filter((e) => selectedTypes.has(e.type));
  }, [allEvents, selectedDate, selectedTypes]);

  // Próximos 7 días
  const upcomingEvents = useMemo(
    () => getUpcomingEvents(allEvents, 7).filter((e) => selectedTypes.has(e.type)),
    [allEvents, selectedTypes]
  );

  // Navegación
  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
    setSelectedDate(null);
  };

  const goToToday = () => {
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setSelectedDate(null);
  };

  const toggleType = (type: CalendarEventType) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  // Calcular totales del mes
  const monthTotals = useMemo(() => {
    const income = filteredMonthEvents
      .filter((e) => e.type === "income")
      .reduce((s, e) => s + e.amount, 0);
    const expenses = filteredMonthEvents
      .filter((e) => e.type !== "income" && e.type !== "budget_check")
      .reduce((s, e) => s + e.amount, 0);
    return { income, expenses };
  }, [filteredMonthEvents]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
          <CalendarDays className="h-6 w-6 text-purple-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Calendario de Pagos</h2>
          <p className="text-sm text-muted-foreground">
            Todos tus pagos y cobros en un vistazo
          </p>
        </div>
      </div>

      {/* Navegación del mes */}
      <Card className="border shadow-sm">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" size="sm" onClick={goToPrevMonth} className="gap-1">
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Anterior</span>
            </Button>

            <div className="flex items-center gap-3">
              <h3 className="text-sm font-bold">
                {MONTHS_ES[viewMonth]} {viewYear}
              </h3>
              <Button variant="ghost" size="sm" onClick={goToToday} className="text-xs">
                Hoy
              </Button>
            </div>

            <Button variant="outline" size="sm" onClick={goToNextMonth} className="gap-1">
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <CalendarGrid
            year={viewYear}
            month={viewMonth}
            events={filteredMonthEvents}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            mounted={mounted}
          />

          {/* Leyenda */}
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-muted-foreground">Ingresos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-rose-500" />
              <span className="text-[10px] text-muted-foreground">Gastos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-pink-500" />
              <span className="text-[10px] text-muted-foreground">Suscripciones</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-orange-500" />
              <span className="text-[10px] text-muted-foreground">Deudas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-purple-500" />
              <span className="text-[10px] text-muted-foreground">Impuestos</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen del mes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="border shadow-sm bg-emerald-50 dark:bg-emerald-950/20">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground mb-1">Ingresos del mes</p>
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(monthTotals.income)}
            </p>
          </CardContent>
        </Card>
        <Card className="border shadow-sm bg-rose-50 dark:bg-rose-950/20">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground mb-1">Gastos del mes</p>
            <p className="text-base font-bold text-rose-600 dark:text-rose-400">
              {formatCurrency(monthTotals.expenses)}
            </p>
          </CardContent>
        </Card>
        <Card className="border shadow-sm bg-muted/50 col-span-2 sm:col-span-1">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground mb-1">Eventos del mes</p>
            <p className="text-base font-bold">{filteredMonthEvents.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Día seleccionado */}
      {selectedDate && dayEvents.length > 0 && (
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold capitalize">
              {formatDateFull(selectedDate)}
            </CardTitle>
            <CardDescription className="text-xs">
              {dayEvents.length} evento{dayEvents.length !== 1 ? "s" : ""} programado
              {dayEvents.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dayEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedDate && dayEvents.length === 0 && (
        <Card className="border shadow-sm">
          <CardContent className="p-6 text-center">
            <CalendarDays className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No hay eventos el {formatDateShort(selectedDate)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Próximos 7 días */}
      {upcomingEvents.length > 0 && (
        <Card className="border shadow-sm overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Próximos 7 días
            </CardTitle>
            <CardDescription className="text-xs">
              {upcomingEvents.length} evento{upcomingEvents.length !== 1 ? "s" : ""} próximo
              {upcomingEvents.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto overscroll-contain">
              <div className="space-y-2">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Todos los eventos del mes con filtros */}
      <Card className="border shadow-sm overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                Todos los eventos del mes
              </CardTitle>
              <CardDescription className="text-xs">
                {filteredMonthEvents.length} evento{filteredMonthEvents.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllEvents(!showAllEvents)}
              className="text-xs"
            >
              {showAllEvents ? "Ver menos" : "Ver todos"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros por tipo */}
          <div className="mb-3">
            <TypeFilter selectedTypes={selectedTypes} onToggleType={toggleType} />
          </div>

          <div className={showAllEvents ? "max-h-96 overflow-y-auto overscroll-contain" : "max-h-48 overflow-y-auto overscroll-contain"}>
            <div className="space-y-2">
              {(showAllEvents
                ? filteredMonthEvents
                : filteredMonthEvents.slice(0, 5)
              ).map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
              {!showAllEvents && filteredMonthEvents.length > 5 && (
                <div className="text-center py-2">
                  <p className="text-xs text-muted-foreground">
                    Y {filteredMonthEvents.length - 5} eventos más...
                  </p>
                </div>
              )}
              {filteredMonthEvents.length === 0 && (
                <div className="text-center py-6">
                  <CalendarDays className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No hay eventos para los filtros seleccionados
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
