/**
 * ============================================
 * Lista de Transacciones
 * ============================================
 * Muestra las transacciones del mes seleccionado
 * con filtros, búsqueda y acciones de eliminación.
 */

"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { CATEGORY_CONFIG, type TransactionCategory, type TransactionType } from "@/lib/types";
import {
  formatCurrency,
  formatDate,
  getCurrentMonthTransactions,
  getAvailableMonths,
  getMonthFromISO,
  calculateMonthlySummary,
} from "@/lib/finance-utils";
import {
  Search,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Repeat,
  CalendarDays,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function TransactionList() {
  const { transactions, deleteTransaction, selectedMonth, setSelectedMonth } = useFinanceStore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | TransactionType>("all");
  const [filterCategory, setFilterCategory] = useState<"all" | TransactionCategory>("all");

  // Limit months shown in dropdown to last 12 + current (same as Dashboard)
  const allMonths = useMemo(() => getAvailableMonths(transactions), [transactions]);
  const availableMonths = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const months = allMonths.filter(m => m <= currentMonth);
    return months.slice(-12);
  }, [allMonths]);

  const monthTransactions = useMemo(() => {
    return transactions
      .filter((t) => getMonthFromISO(t.date) === selectedMonth)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedMonth]);

  const filteredTransactions = useMemo(() => {
    return monthTransactions.filter((t) => {
      const matchesSearch =
        !searchQuery ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        CATEGORY_CONFIG[t.category]?.label.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === "all" || t.type === filterType;
      const matchesCategory = filterCategory === "all" || t.category === filterCategory;
      return matchesSearch && matchesType && matchesCategory;
    });
  }, [monthTransactions, searchQuery, filterType, filterCategory]);

  const summary = useMemo(
    () => calculateMonthlySummary(transactions, selectedMonth),
    [transactions, selectedMonth]
  );

  const handleDelete = (id: string, desc: string) => {
    deleteTransaction(id);
    toast({
      title: "Transacción eliminada",
      description: desc,
    });
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold">Historial de Transacciones</CardTitle>
            <CardDescription className="text-xs mt-1">
              {filteredTransactions.length} transacciones encontradas
            </CardDescription>
          </div>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <CalendarDays className="h-3.5 w-3.5 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map((month) => (
                <SelectItem key={month} value={month}>
                  {new Date(month + "-01").toLocaleDateString("es-ES", {
                    month: "long",
                    year: "numeric",
                  })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar transacción..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Select value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
            <SelectTrigger className="w-full sm:w-[130px] h-9">
              <Filter className="h-3.5 w-3.5 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ingreso">Ingresos</SelectItem>
              <SelectItem value="gasto">Gastos</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filterCategory}
            onValueChange={(v) => setFilterCategory(v as typeof filterCategory)}
          >
            <SelectTrigger className="w-full sm:w-[150px] h-9">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lista de transacciones */}
        <ScrollArea className="h-[400px] pr-3">
          <div className="space-y-2">
            {filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Search className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No se encontraron transacciones</p>
                <p className="text-xs mt-1">Prueba cambiando los filtros o el mes</p>
              </div>
            ) : (
              filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors group"
                >
                  {/* Icono de categoría */}
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                      tx.type === "ingreso"
                        ? "bg-emerald-100 dark:bg-emerald-950/40"
                        : "bg-rose-100 dark:bg-rose-950/40"
                    )}
                  >
                    {tx.type === "ingreso" ? (
                      <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-rose-600" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{tx.description}</span>
                      {tx.recurrence === "recurrente" && (
                        <Repeat className="h-3 w-3 text-muted-foreground shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 h-4"
                        style={{
                          backgroundColor: `${CATEGORY_CONFIG[tx.category]?.color}20`,
                          color: CATEGORY_CONFIG[tx.category]?.color,
                        }}
                      >
                        {CATEGORY_CONFIG[tx.category]?.label}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDate(tx.date)}
                      </span>
                    </div>
                  </div>

                  {/* Monto */}
                  <div className="text-right shrink-0">
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        tx.type === "ingreso" ? "text-emerald-600" : "text-rose-600"
                      )}
                    >
                      {tx.type === "ingreso" ? "+" : "-"}
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>

                  {/* Eliminar */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 hover:bg-destructive/10"
                        aria-label="Eliminar transacción"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar transacción?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Se eliminará &quot;{tx.description}&quot; ({formatCurrency(tx.amount)}).
                          Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(tx.id, tx.description)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
