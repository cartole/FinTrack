/**
 * ============================================
 * Formulario de Transacciones
 * ============================================
 * Formulario completo para agregar ingresos/gastos
 * con validación y selección de categoría, tipo y recurrencia.
 */

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useFinanceStore } from "@/store/finance-store";
import {
  CATEGORY_CONFIG,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  type TransactionType,
  type TransactionCategory,
  type RecurrenceType,
} from "@/lib/types";
import { Plus, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function TransactionForm() {
  const { isFormOpen, setFormOpen, addTransaction } = useFinanceStore();
  const { toast } = useToast();

  const [type, setType] = useState<TransactionType>("gasto");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<TransactionCategory | "">("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isRecurrent, setIsRecurrent] = useState(false);

  const categories = type === "ingreso" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const resetForm = () => {
    setType("gasto");
    setAmount("");
    setCategory("");
    setDescription("");
    setDate(new Date().toISOString().split("T")[0]);
    setIsRecurrent(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !category || !date) {
      toast({
        title: "Campos incompletos",
        description: "Por favor completa monto, categoría y fecha.",
        variant: "destructive",
      });
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({
        title: "Monto inválido",
        description: "El monto debe ser un número positivo.",
        variant: "destructive",
      });
      return;
    }

    addTransaction({
      amount: numAmount,
      category: category as TransactionCategory,
      type,
      recurrence: isRecurrent ? "recurrente" : "puntual",
      description:
        description ||
        `${type === "ingreso" ? "Ingreso" : "Gasto"} - ${CATEGORY_CONFIG[category as TransactionCategory]?.label || category}`,
      date: new Date(date).toISOString(),
    });

    toast({
      title: type === "ingreso" ? "Ingreso registrado" : "Gasto registrado",
      description: `${CATEGORY_CONFIG[category as TransactionCategory]?.label}: ${numAmount.toLocaleString("es-ES")}€`,
    });

    resetForm();
    setFormOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) resetForm();
    setFormOpen(open);
  };

  return (
    <Dialog open={isFormOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Nueva Transacción
          </DialogTitle>
          <DialogDescription>
            Registra un ingreso o gasto para llevar control de tus finanzas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Tipo: Ingreso / Gasto */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tipo de transacción</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setType("gasto");
                  setCategory("");
                }}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-all",
                  type === "gasto"
                    ? "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
                    : "border-muted bg-background text-muted-foreground hover:border-muted-foreground/30"
                )}
              >
                <ArrowDownRight className="h-4 w-4" />
                Gasto
              </button>
              <button
                type="button"
                onClick={() => {
                  setType("ingreso");
                  setCategory("");
                }}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-all",
                  type === "ingreso"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                    : "border-muted bg-background text-muted-foreground hover:border-muted-foreground/30"
                )}
              >
                <ArrowUpRight className="h-4 w-4" />
                Ingreso
              </button>
            </div>
          </div>

          {/* Monto */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium">
              Monto (€)
            </Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg font-semibold"
            />
          </div>

          {/* Categoría */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Categoría</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as TransactionCategory)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: CATEGORY_CONFIG[cat].color }}
                      />
                      {CATEGORY_CONFIG[cat].label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Descripción (opcional)
            </Label>
            <Textarea
              id="description"
              placeholder="Describe la transacción..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Fecha */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-medium">
              Fecha
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Recurrencia */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Gasto recurrente</Label>
              <p className="text-xs text-muted-foreground">
                Se repetirá cada mes
              </p>
            </div>
            <Switch
              checked={isRecurrent}
              onCheckedChange={setIsRecurrent}
            />
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full" size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Registrar {type === "ingreso" ? "Ingreso" : "Gasto"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Botón flotante para abrir el formulario de transacción.
 */
export function AddTransactionButton() {
  const { setFormOpen } = useFinanceStore();

  return (
    <Button
      onClick={() => setFormOpen(true)}
      size="lg"
      className="gap-2 shadow-lg hover:shadow-xl transition-shadow"
    >
      <Plus className="h-5 w-5" />
      Añadir Transacción
    </Button>
  );
}
