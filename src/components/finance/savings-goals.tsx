/**
 * ============================================
 * Metas de Ahorro
 * ============================================
 * Componente para visualizar y gestionar metas
 * de ahorro con barras de progreso y acciones.
 */

"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { formatCurrency, formatDate } from "@/lib/finance-utils";
import { Target, Plus, Trash2, Brain, Rocket, Plane, Laptop } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

/** Icono según nombre de la meta */
function getGoalIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("viaje") || lower.includes("japón") || lower.includes("vacaciones")) return Plane;
  if (lower.includes("macbook") || lower.includes("laptop") || lower.includes("ordenador")) return Laptop;
  return Rocket;
}

export function SavingsGoals() {
  const { savingsGoals, addSavingsGoal, deleteSavingsGoal, generatePlan } = useFinanceStore();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: "",
    targetAmount: "",
    currentAmount: "",
    deadline: "",
  });

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.name || !newGoal.targetAmount || !newGoal.deadline) {
      toast({
        title: "Campos incompletos",
        description: "Completa nombre, monto objetivo y fecha límite.",
        variant: "destructive",
      });
      return;
    }

    addSavingsGoal({
      name: newGoal.name,
      targetAmount: parseFloat(newGoal.targetAmount),
      currentAmount: parseFloat(newGoal.currentAmount) || 0,
      deadline: new Date(newGoal.deadline).toISOString(),
    });

    toast({
      title: "Meta de ahorro creada",
      description: `"${newGoal.name}" - ${formatCurrency(parseFloat(newGoal.targetAmount))}`,
    });

    setNewGoal({ name: "", targetAmount: "", currentAmount: "", deadline: "" });
    setIsAdding(false);
  };

  const handleGeneratePlan = (goalId: string) => {
    generatePlan(goalId);
    toast({
      title: "Plan generado",
      description: "Tu asesor IA ha generado un plan de ahorro personalizado.",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Metas de Ahorro</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Define objetivos y genera planes con IA
          </p>
        </div>
        <Button onClick={() => setIsAdding(true)} size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Nueva Meta
        </Button>
      </div>

      {/* Lista de metas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {savingsGoals.map((goal) => {
          const progress = Math.min(
            100,
            Math.round((goal.currentAmount / goal.targetAmount) * 100)
          );
          const Icon = getGoalIcon(goal.name);
          const daysLeft = Math.max(
            0,
            Math.ceil(
              (new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            )
          );

          return (
            <Card key={goal.id} className="border-0 shadow-sm group relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold">{goal.name}</h4>
                      <p className="text-[10px] text-muted-foreground">
                        {daysLeft} días restantes
                      </p>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar meta?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Se eliminará la meta &quot;{goal.name}&quot;. Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteSavingsGoal(goal.id)}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                {/* Progreso */}
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      {formatCurrency(goal.currentAmount)}
                    </span>
                    <span className="font-semibold">{formatCurrency(goal.targetAmount)}</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex justify-between">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[10px]",
                        progress >= 75
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50"
                          : progress >= 40
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-900/50"
                      )}
                    >
                      {progress}% completado
                    </Badge>
                  </div>
                </div>

                {/* Fecha límite */}
                <div className="text-[10px] text-muted-foreground mb-3">
                  Fecha límite: {formatDate(goal.deadline)}
                </div>

                {/* Botón IA */}
                <Button
                  onClick={() => handleGeneratePlan(goal.id)}
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5"
                >
                  <Brain className="h-3.5 w-3.5" />
                  Generar Plan con IA
                </Button>
              </CardContent>
            </Card>
          );
        })}

        {savingsGoals.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Target className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No hay metas de ahorro</p>
            <p className="text-xs mt-1">Crea una meta para empezar a ahorrar</p>
          </div>
        )}
      </div>

      {/* Dialog: Nueva Meta */}
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Nueva Meta de Ahorro
            </DialogTitle>
            <DialogDescription>
              Define tu objetivo y tu asesor IA te ayudará a alcanzarlo.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddGoal} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Nombre de la meta</Label>
              <Input
                placeholder="Ej: Viaje a Japón"
                value={newGoal.name}
                onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Monto objetivo ($)</Label>
                <Input
                  type="number"
                  placeholder="3000"
                  value={newGoal.targetAmount}
                  onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Ya ahorrado ($)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newGoal.currentAmount}
                  onChange={(e) => setNewGoal({ ...newGoal, currentAmount: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Fecha límite</Label>
              <Input
                type="date"
                value={newGoal.deadline}
                onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Crear Meta
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
