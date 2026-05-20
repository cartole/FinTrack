/**
 * ============================================
 * Metas de Ahorro
 * ============================================
 * Componente para visualizar y gestionar metas
 * de ahorro con barras de progreso y acciones.
 * Incluye selección de meta activa.
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
import { Target, Plus, Trash2, Brain, Rocket, Plane, Laptop, Pencil, Check, Star } from "lucide-react";
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
  const {
    savingsGoals,
    addSavingsGoal,
    editSavingsGoal,
    deleteSavingsGoal,
    generatePlan,
    settings,
    updateSettings,
  } = useFinanceStore();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [newGoal, setNewGoal] = useState({
    name: "",
    targetAmount: "",
    currentAmount: "",
    deadline: "",
  });
  const [editGoal, setEditGoal] = useState({
    name: "",
    targetAmount: "",
    currentAmount: "",
    deadline: "",
  });

  // Selected goal from settings
  const selectedGoalId = settings.selectedGoalId;

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

  const handleSelectGoal = (goalId: string) => {
    // Toggle selection: if already selected, deselect
    updateSettings({
      selectedGoalId: selectedGoalId === goalId ? "" : goalId,
    });
    if (selectedGoalId !== goalId) {
      const goal = savingsGoals.find((g) => g.id === goalId);
      toast({
        title: "Meta seleccionada",
        description: `"${goal?.name}" es ahora tu meta activa`,
      });
    }
  };

  const handleOpenEdit = (goal: typeof savingsGoals[0]) => {
    setEditingGoalId(goal.id);
    setEditGoal({
      name: goal.name,
      targetAmount: String(goal.targetAmount),
      currentAmount: String(goal.currentAmount),
      deadline: goal.deadline.split("T")[0],
    });
  };

  const handleEditGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoalId) return;
    if (!editGoal.name || !editGoal.targetAmount || !editGoal.deadline) {
      toast({
        title: "Campos incompletos",
        description: "Completa nombre, monto objetivo y fecha límite.",
        variant: "destructive",
      });
      return;
    }

    editSavingsGoal(editingGoalId, {
      name: editGoal.name,
      targetAmount: parseFloat(editGoal.targetAmount),
      currentAmount: parseFloat(editGoal.currentAmount) || 0,
      deadline: new Date(editGoal.deadline).toISOString(),
    });

    toast({
      title: "Meta actualizada",
      description: `"${editGoal.name}" - ${formatCurrency(parseFloat(editGoal.targetAmount))}`,
    });

    setEditingGoalId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Metas de Ahorro</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Define objetivos, selecciona tu meta activa y genera planes con IA
          </p>
        </div>
        <Button onClick={() => setIsAdding(true)} size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Nueva Meta
        </Button>
      </div>

      {/* Selected Goal Summary Banner */}
      {selectedGoalId && (() => {
        const selectedGoal = savingsGoals.find((g) => g.id === selectedGoalId);
        if (!selectedGoal) return null;
        const progress = Math.min(
          100,
          Math.round((selectedGoal.currentAmount / selectedGoal.targetAmount) * 100)
        );
        const remaining = selectedGoal.targetAmount - selectedGoal.currentAmount;
        const daysLeft = Math.max(
          0,
          Math.ceil(
            (new Date(selectedGoal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )
        );
        const monthlyNeeded =
          daysLeft > 0 ? (remaining / (daysLeft / 30)) : 0;

        return (
          <Card className="border shadow-sm bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-l-4 border-l-primary">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 text-primary fill-primary" />
                <span className="text-sm font-semibold">Meta Activa:</span>
                <span className="text-sm font-bold text-primary">{selectedGoal.name}</span>
              </div>
              <Progress value={progress} className="h-2.5 mb-2" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div>
                  <p className="text-xs font-bold">{formatCurrency(selectedGoal.currentAmount)}</p>
                  <p className="text-[9px] text-muted-foreground">Ahorrado</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-primary">{formatCurrency(remaining)}</p>
                  <p className="text-[9px] text-muted-foreground">Restante</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-600">{formatCurrency(monthlyNeeded)}/mes</p>
                  <p className="text-[9px] text-muted-foreground">Necesitas ahorrar</p>
                </div>
                <div>
                  <p className="text-xs font-bold">{daysLeft} días</p>
                  <p className="text-[9px] text-muted-foreground">Para la fecha límite</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}

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
          const isSelected = selectedGoalId === goal.id;

          return (
            <Card
              key={goal.id}
              className={cn(
                "border shadow-sm group relative overflow-hidden transition-all",
                isSelected
                  ? "ring-2 ring-primary shadow-md"
                  : "hover:shadow-md"
              )}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
              )}

              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      isSelected
                        ? "bg-primary/20"
                        : "bg-primary/10"
                    )}>
                      <Icon className={cn(
                        "h-5 w-5",
                        isSelected ? "text-primary" : "text-primary"
                      )} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold">{goal.name}</h4>
                      <p className="text-[10px] text-muted-foreground">
                        {daysLeft} días restantes
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleOpenEdit(goal)}
                    >
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
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
                  <div className="flex justify-between items-center">
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

                {/* Action buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSelectGoal(goal.id)}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "flex-1 gap-1.5",
                      isSelected && "gap-1.5"
                    )}
                  >
                    {isSelected ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Seleccionada
                      </>
                    ) : (
                      <>
                        <Star className="h-3.5 w-3.5" />
                        Seleccionar
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleGeneratePlan(goal.id)}
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                  >
                    <Brain className="h-3.5 w-3.5" />
                    Plan IA
                  </Button>
                </div>
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

      {/* Dialog: Editar Meta */}
      <Dialog open={editingGoalId !== null} onOpenChange={(open) => { if (!open) setEditingGoalId(null); }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Editar Meta de Ahorro
            </DialogTitle>
            <DialogDescription>
              Modifica el nombre, monto objetivo, ahorro actual o fecha límite.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditGoal} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Nombre de la meta</Label>
              <Input
                placeholder="Ej: Viaje a Japón"
                value={editGoal.name}
                onChange={(e) => setEditGoal({ ...editGoal, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Monto objetivo (€)</Label>
                <Input
                  type="number"
                  placeholder="3000"
                  value={editGoal.targetAmount}
                  onChange={(e) => setEditGoal({ ...editGoal, targetAmount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Ya ahorrado (€)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={editGoal.currentAmount}
                  onChange={(e) => setEditGoal({ ...editGoal, currentAmount: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Fecha límite</Label>
              <Input
                type="date"
                value={editGoal.deadline}
                onChange={(e) => setEditGoal({ ...editGoal, deadline: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-full">
              <Pencil className="h-4 w-4 mr-2" />
              Guardar Cambios
            </Button>
          </form>
        </DialogContent>
      </Dialog>

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
                <Label>Monto objetivo (€)</Label>
                <Input
                  type="number"
                  placeholder="3000"
                  value={newGoal.targetAmount}
                  onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Ya ahorrado (€)</Label>
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
