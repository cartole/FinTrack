/**
 * ============================================
 * Asesor IA - Panel Principal
 * ============================================
 * Interfaz para interactuar con el motor de IA
 * que genera planes de ahorro personalizados.
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { useFinanceStore } from "@/store/finance-store";
import { formatCurrency } from "@/lib/finance-utils";
import { Brain, Sparkles, Target, Loader2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { SavingsPlanDisplay } from "./savings-plan-display";

const quickGoals = [
  { name: "Viaje a Japón", amount: 3000 },
  { name: "Fondo de emergencia", amount: 5000 },
  { name: "MacBook Pro", amount: 2500 },
  { name: "Boda", amount: 10000 },
  { name: "Coche", amount: 15000 },
];

export function AIAdvisor() {
  const { savingsGoals, generatePlan } = useFinanceStore();
  const [customGoal, setCustomGoal] = useState({
    name: "",
    amount: "",
    deadline: "",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedExistingGoal, setSelectedExistingGoal] = useState("");

  const handleQuickGoal = (goal: (typeof quickGoals)[0]) => {
    setCustomGoal({
      name: goal.name,
      amount: String(goal.amount),
      deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    });
  };

  const handleGenerateFromExisting = () => {
    if (!selectedExistingGoal) return;
    setIsGenerating(true);
    setTimeout(() => {
      generatePlan(selectedExistingGoal);
      setIsGenerating(false);
    }, 1500);
  };

  const handleGenerateCustom = () => {
    if (!customGoal.name || !customGoal.amount || !customGoal.deadline) return;
    // Add a temporary goal and generate plan
    setIsGenerating(true);
    const { addSavingsGoal } = useFinanceStore.getState();

    addSavingsGoal({
      name: customGoal.name,
      targetAmount: parseFloat(customGoal.amount),
      currentAmount: 0,
      deadline: new Date(customGoal.deadline).toISOString(),
    });

    // Get the newly added goal
    setTimeout(() => {
      const goals = useFinanceStore.getState().savingsGoals;
      const newGoal = goals.find((g) => g.name === customGoal.name);
      if (newGoal) {
        generatePlan(newGoal.id);
      }
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <SavingsPlanDisplay />

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Brain className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Asesor de Ahorro IA</h2>
          <p className="text-sm text-muted-foreground">
            Obtén un plan personalizado basado en tus hábitos de gasto
          </p>
        </div>
      </div>

      {/* Desde meta existente */}
      {savingsGoals.length > 0 && (
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Target className="h-4 w-4" />
              Desde una Meta Existente
            </CardTitle>
            <CardDescription className="text-xs">
              Selecciona una de tus metas para generar un plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={selectedExistingGoal} onValueChange={setSelectedExistingGoal}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecciona una meta" />
                </SelectTrigger>
                <SelectContent>
                  {savingsGoals.map((goal) => (
                    <SelectItem key={goal.id} value={goal.id}>
                      {goal.name} - {formatCurrency(goal.targetAmount)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleGenerateFromExisting}
                disabled={!selectedExistingGoal || isGenerating}
                className="gap-1.5"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Generar Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metas rápidas */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            Metas Rápidas
          </CardTitle>
          <CardDescription className="text-xs">
            Selecciona una meta común para empezar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {quickGoals.map((goal) => (
              <Button
                key={goal.name}
                variant="outline"
                size="sm"
                onClick={() => handleQuickGoal(goal)}
                className={cn(
                  "gap-1.5",
                  customGoal.name === goal.name && "border-primary bg-primary/5"
                )}
              >
                {goal.name} ({formatCurrency(goal.amount)})
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Meta personalizada */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Meta Personalizada
          </CardTitle>
          <CardDescription className="text-xs">
            Define tu propia meta de ahorro y obtén un plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs">¿Para qué quieres ahorrar?</Label>
              <Input
                placeholder="Ej: Ahorrar 500€ para un viaje"
                value={customGoal.name}
                onChange={(e) => setCustomGoal({ ...customGoal, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Monto objetivo (€)</Label>
                <Input
                  type="number"
                  placeholder="3000"
                  value={customGoal.amount}
                  onChange={(e) => setCustomGoal({ ...customGoal, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Fecha límite</Label>
                <Input
                  type="date"
                  value={customGoal.deadline}
                  onChange={(e) => setCustomGoal({ ...customGoal, deadline: e.target.value })}
                />
              </div>
            </div>
            <Button
              onClick={handleGenerateCustom}
              disabled={!customGoal.name || !customGoal.amount || !customGoal.deadline || isGenerating}
              className="w-full gap-2"
              size="lg"
            >
              {isGenerating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Brain className="h-5 w-5" />
              )}
              {isGenerating ? "Analizando tus finanzas..." : "Generar Plan de Ahorro"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

