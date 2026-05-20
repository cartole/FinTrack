/**
 * ============================================
 * Módulo de IA - Asesor de Gastos Imprevistos
 * ============================================
 *
 * Analiza la situación financiera del usuario cuando se enfrenta
 * a un gasto grande inesperado y genera un plan de acción.
 *
 * Funcionalidades:
 * 1. Evalúa el impacto del gasto en las finanzas actuales
 * 2. Determina la severidad de la emergencia
 * 3. Sugiere de dónde sacar el dinero (priorizando wisely)
 * 4. Genera un plan de recuperación mes a mes
 * 5. Calcula el impacto en las metas de ahorro
 * 6. Proporciona recomendaciones específicas de acción
 */

import {
  Transaction,
  TransactionCategory,
  SavingsGoal,
  CATEGORY_CONFIG,
} from "./types";
import {
  calculateMonthlySummary,
  calculateTotalBalance,
  getMonthFromISO,
} from "./finance-utils";

// ---- Tipos ----

/** Parámetros del gasto imprevisto */
export interface EmergencyExpenseInput {
  amount: number;
  category: TransactionCategory;
  description: string;
  canFinance: boolean; // ¿Se puede pagar a plazos?
  financingMonths?: number; // Meses de financiación disponibles
}

/** Nivel de severidad de la emergencia */
export type EmergencySeverity = "leve" | "moderada" | "grave" | "critica";

/** Fuente de financiación sugerida */
export interface FundingSource {
  name: string;
  availableAmount: number;
  suggestedAmount: number;
  priority: number; // 1 = más prioritario
  impact: "ninguno" | "bajo" | "moderado" | "alto";
  description: string;
}

/** Impacto en una meta de ahorro */
export interface GoalImpact {
  goalId: string;
  goalName: string;
  delayMonths: number;
  originalDeadline: string;
  newDeadline: string;
}

/** Plan de acción para gastos imprevistos */
export interface EmergencyPlan {
  severity: EmergencySeverity;
  severityScore: number; // 0-100
  expenseAmount: number;
  impactOnMonthlyBudget: number; // % del presupuesto mensual
  fundingSources: FundingSource[];
  recoveryPlan: RecoveryStep[];
  goalImpacts: GoalImpact[];
  recommendations: string[];
  immediateActions: string[];
  summary: string;
}

/** Paso del plan de recuperación */
export interface RecoveryStep {
  month: string;
  action: string;
  amountToRecover: number;
  cumulativeRecovered: number;
  strategy: string;
}

// ---- Lógica principal ----

/**
 * Calcula el promedio mensual de ingresos y gastos.
 */
function calculateAverages(transactions: Transaction[]) {
  const incomeByMonth: Record<string, number> = {};
  const expenseByMonth: Record<string, number> = {};

  for (const t of transactions) {
    const month = getMonthFromISO(t.date);
    if (t.type === "ingreso") {
      if (!incomeByMonth[month]) incomeByMonth[month] = 0;
      incomeByMonth[month] += t.amount;
    } else {
      if (!expenseByMonth[month]) expenseByMonth[month] = 0;
      expenseByMonth[month] += t.amount;
    }
  }

  const months = new Set([
    ...Object.keys(incomeByMonth),
    ...Object.keys(expenseByMonth),
  ]);

  const monthCount = Math.max(months.size, 1);
  const totalIncome = Object.values(incomeByMonth).reduce((a, b) => a + b, 0);
  const totalExpenses = Object.values(expenseByMonth).reduce((a, b) => a + b, 0);

  return {
    monthlyIncome: Math.round(totalIncome / monthCount),
    monthlyExpenses: Math.round(totalExpenses / monthCount),
    monthlySurplus: Math.round((totalIncome - totalExpenses) / monthCount),
  };
}

/**
 * Evalúa la severidad del gasto imprevisto.
 * Basado en el ratio entre el gasto y el superávit mensual.
 */
function assessSeverity(
  expenseAmount: number,
  monthlySurplus: number,
  monthlyIncome: number,
  totalBalance: number
): { severity: EmergencySeverity; score: number } {
  // Si el gasto es más del 100% del ingreso mensual -> crítica
  const incomeRatio = expenseAmount / monthlyIncome;
  // Si el gasto es más del X% del superávit mensual acumulado en 6 meses
  const surplusRatio = monthlySurplus > 0 ? expenseAmount / (monthlySurplus * 6) : 10;
  // Si el balance total no cubre el gasto
  const balanceCovers = totalBalance >= expenseAmount;

  let score = 0;

  // Contribución del ratio de ingresos (0-40 puntos)
  if (incomeRatio > 1) score += 40;
  else if (incomeRatio > 0.5) score += 30;
  else if (incomeRatio > 0.3) score += 20;
  else score += 10;

  // Contribución del ratio de superávit (0-30 puntos)
  if (surplusRatio > 2) score += 30;
  else if (surplusRatio > 1) score += 20;
  else if (surplusRatio > 0.5) score += 10;
  else score += 5;

  // Contribución del balance (0-30 puntos)
  if (!balanceCovers) score += 30;
  else if (expenseAmount > totalBalance * 0.5) score += 20;
  else if (expenseAmount > totalBalance * 0.25) score += 10;
  else score += 5;

  let severity: EmergencySeverity;
  if (score >= 70) severity = "critica";
  else if (score >= 50) severity = "grave";
  else if (score >= 30) severity = "moderada";
  else severity = "leve";

  return { severity, score };
}

/**
 * Genera las fuentes de financiación sugeridas, ordenadas por prioridad.
 * La estrategia es: usar primero las fuentes de menor impacto.
 */
function generateFundingSources(
  expenseAmount: number,
  monthlySurplus: number,
  totalBalance: number,
  savingsGoals: SavingsGoal[],
  canFinance: boolean,
  financingMonths?: number
): FundingSource[] {
  const sources: FundingSource[] = [];
  let remaining = expenseAmount;

  // 1. Superávit mensual (prioridad 1 - sin impacto negativo)
  if (monthlySurplus > 0) {
    const surplusContribution = Math.min(remaining, monthlySurplus);
    sources.push({
      name: "Superávit mensual actual",
      availableAmount: monthlySurplus,
      suggestedAmount: surplusContribution,
      priority: 1,
      impact: "ninguno",
      description: `Usa tu superávit mensual de ${monthlySurplus.toLocaleString("es-ES")}€ para cubrir parte del gasto sin afectar tu estilo de vida.`,
    });
    remaining -= surplusContribution;
  }

  // 2. Recortes temporales de gastos discrecionales (prioridad 2)
  const discretionaryCut = Math.round(monthlySurplus > 0 ? monthlySurplus * 0.5 : 200);
  if (remaining > 0 && discretionaryCut > 0) {
    const cutContribution = Math.min(remaining, discretionaryCut * 3); // 3 meses de recortes
    sources.push({
      name: "Recortes temporales (3 meses)",
      availableAmount: discretionaryCut * 3,
      suggestedAmount: cutContribution,
      priority: 2,
      impact: "bajo",
      description: `Reduce gastos de ocio, ropa y suscripciones durante 3 meses. Puedes ahorrar ~${discretionaryCut.toLocaleString("es-ES")}€/mes adicionales.`,
    });
    remaining -= cutContribution;
  }

  // 3. Fondo de emergencia (si existe como meta, prioridad 3)
  const emergencyFund = savingsGoals.find((g) =>
    g.name.toLowerCase().includes("emergencia")
  );
  if (remaining > 0 && emergencyFund && emergencyFund.currentAmount > 0) {
    const fundContribution = Math.min(remaining, emergencyFund.currentAmount);
    sources.push({
      name: `Fondo de emergencia (${emergencyFund.name})`,
      availableAmount: emergencyFund.currentAmount,
      suggestedAmount: fundContribution,
      priority: 3,
      impact: "moderado",
      description: `Usa ${fundContribution.toLocaleString("es-ES")}€ de tu fondo de emergencia. Para eso existe. Deberás reponerlo después.`,
    });
    remaining -= fundContribution;
  }

  // 4. Financiación a plazos sin intereses (prioridad 4)
  if (remaining > 0 && canFinance && financingMonths && financingMonths > 0) {
    const monthlyPayment = Math.round(remaining / financingMonths);
    sources.push({
      name: `Financiación a ${financingMonths} meses`,
      availableAmount: remaining,
      suggestedAmount: remaining,
      priority: 4,
      impact: "bajo",
      description: `Paga en ${financingMonths} cuotas de ~${monthlyPayment.toLocaleString("es-ES")}€/mes. Solo si es SIN intereses. Evita financiar con intereses.`,
    });
    remaining = 0;
  }

  // 5. Suspender temporalmente aportes a metas de ahorro (prioridad 5)
  const otherGoals = savingsGoals.filter(
    (g) => !g.name.toLowerCase().includes("emergencia")
  );
  const monthlyGoalSavings = otherGoals.length > 0
    ? Math.round(otherGoals.reduce((sum, g) => {
        const remaining_goal = g.targetAmount - g.currentAmount;
        const deadline = new Date(g.deadline);
        const monthsLeft = Math.max(1, Math.ceil(
          (deadline.getTime() - Date.now()) / (30.44 * 24 * 60 * 60 * 1000)
        ));
        return sum + (remaining_goal / monthsLeft);
      }, 0) / otherGoals.length)
    : 0;

  if (remaining > 0 && monthlyGoalSavings > 0) {
    const pauseMonths = 3;
    const pauseContribution = Math.min(remaining, monthlyGoalSavings * pauseMonths);
    sources.push({
      name: `Pausar metas de ahorro (${pauseMonths} meses)`,
      availableAmount: monthlyGoalSavings * pauseMonths,
      suggestedAmount: pauseContribution,
      priority: 5,
      impact: "moderado",
      description: `Detén temporalmente tus aportes a metas de ahorro durante ${pauseMonths} meses. Esto libera ~${monthlyGoalSavings.toLocaleString("es-ES")}€/mes.`,
    });
    remaining -= pauseContribution;
  }

  // 6. Ingresos adicionales (prioridad 6)
  if (remaining > 0) {
    sources.push({
      name: "Ingresos adicionales",
      availableAmount: remaining,
      suggestedAmount: remaining,
      priority: 6,
      impact: "alto",
      description: `Necesitas generar ${remaining.toLocaleString("es-ES")}€ extra. Considera: horas extra, proyectos freelance, venta de artículos usados, o trabajos puntuales.`,
    });
  }

  return sources.sort((a, b) => a.priority - b.priority);
}

/**
 * Calcula el impacto en las metas de ahorro.
 */
function calculateGoalImpacts(
  savingsGoals: SavingsGoal[],
  expenseAmount: number,
  monthlySurplus: number
): GoalImpact[] {
  const impacts: GoalImpact[] = [];
  const surplusReduction = Math.min(monthlySurplus, expenseAmount / 3);

  for (const goal of savingsGoals) {
    const remaining = goal.targetAmount - goal.currentAmount;
    const deadline = new Date(goal.deadline);
    const monthsLeft = Math.max(1, Math.ceil(
      (deadline.getTime() - Date.now()) / (30.44 * 24 * 60 * 60 * 1000)
    ));
    const monthlyNeeded = remaining / monthsLeft;

    // Si reducimos el superávit, el ahorro mensual para esta meta se retrasa
    const delayMonths = monthlySurplus > 0
      ? Math.ceil(surplusReduction / monthlyNeeded)
      : Math.ceil(expenseAmount / (monthlyNeeded * 3));

    if (delayMonths > 0) {
      const newDeadline = new Date(deadline);
      newDeadline.setMonth(newDeadline.getMonth() + delayMonths);

      impacts.push({
        goalId: goal.id,
        goalName: goal.name,
        delayMonths,
        originalDeadline: deadline.toISOString(),
        newDeadline: newDeadline.toISOString(),
      });
    }
  }

  return impacts;
}

/**
 * Genera el plan de recuperación mes a mes.
 */
function generateRecoveryPlan(
  expenseAmount: number,
  monthlySurplus: number,
  fundingSources: FundingSource[]
): RecoveryStep[] {
  const steps: RecoveryStep[] = [];
  const now = new Date();
  let cumulative = 0;
  let remaining = expenseAmount;

  // Calcular cuánto podemos recuperar por mes
  const monthlyRecoveryCapacity = fundingSources.reduce((total, source) => {
    if (source.priority <= 3) return total + source.suggestedAmount / 3;
    if (source.priority <= 5) return total + source.suggestedAmount / 6;
    return total;
  }, 0);

  const recoveryMonths = Math.max(
    1,
    Math.ceil(expenseAmount / Math.max(monthlyRecoveryCapacity, 1))
  );

  const strategies = [
    "Recorta gastos discrecionales al mínimo",
    "Mantén los recortes y prioriza la recuperación",
    "Empieza a reponer el fondo de emergencia si lo usaste",
    "Gradualmente retoma tus hábitos de ahorro",
    "Evalúa si puedes retomar las metas pausadas",
    "Vuelve a la normalidad financiera",
  ];

  for (let i = 1; i <= Math.min(recoveryMonths, 6); i++) {
    const futureDate = new Date(now);
    futureDate.setMonth(futureDate.getMonth() + i);
    const monthLabel = futureDate.toLocaleDateString("es-ES", {
      month: "short",
      year: "2-digit",
    });

    const monthlyAmount = Math.min(
      remaining,
      Math.round(expenseAmount / recoveryMonths)
    );

    cumulative += monthlyAmount;
    remaining = Math.max(0, remaining - monthlyAmount);

    steps.push({
      month: monthLabel,
      action: i === 1 ? "Primer mes de recuperación" : `Mes ${i} de recuperación`,
      amountToRecover: monthlyAmount,
      cumulativeRecovered: cumulative,
      strategy: strategies[Math.min(i - 1, strategies.length - 1)],
    });
  }

  return steps;
}

/**
 * Genera las acciones inmediatas a tomar.
 */
function generateImmediateActions(
  severity: EmergencySeverity,
  canFinance: boolean,
  hasEmergencyFund: boolean
): string[] {
  const actions: string[] = [];

  if (severity === "critica" || severity === "grave") {
    actions.push(
      "Detén TODOS los gastos no esenciales inmediatamente. Cancela salidas, compras y suscripciones no vitales."
    );
  }

  if (hasEmergencyFund) {
    actions.push(
      "Usa tu fondo de emergencia. Para eso existe. No sientas culpa, es su propósito."
    );
  }

  if (canFinance) {
    actions.push(
      "Si puedes financiar SIN intereses, hazlo. Pagar a plazos sin coste adicional es mejor que un solo pago que desestabilice tus finanzas."
    );
  } else {
    actions.push(
      "Evita financiación con intereses altos. Un préstamo personal del banco suele ser mejor que una tarjeta de crédito."
    );
  }

  actions.push(
    "Registra el gasto inmediatamente en la app. No lo pospongas, necesitas visibilidad total de tu situación."
  );

  if (severity === "critica") {
    actions.push(
      "Busca fuentes de ingresos extra URGENTES: horas extra, venta de artículos que no uses, trabajos puntuales."
    );
  }

  actions.push(
    "Comunica tu situación si es necesario. Si el gasto es médico, pregunta por planes de pago. Si es de vivienda, habla con tu casero."
  );

  return actions;
}

/**
 * Genera recomendaciones generales.
 */
function generateRecommendations(
  severity: EmergencySeverity,
  expenseAmount: number,
  monthlySurplus: number,
  hasEmergencyFund: boolean,
  goalImpacts: GoalImpact[]
): string[] {
  const recs: string[] = [];

  // Recomendación sobre fondo de emergencia
  if (!hasEmergencyFund) {
    recs.push(
      `No tienes fondo de emergencia. Este gasto imprevisto demuestra por qué necesitas uno. ` +
        `Una vez te recuperes, crea un fondo de 3-6 meses de gastos esenciales ` +
        `(aprox. ${(monthlySurplus > 0 ? monthlySurplus * 6 : 5000).toLocaleString("es-ES")}€).`
    );
  } else {
    recs.push(
      `Tienes fondo de emergencia. Úsalo sin culpa y planifica reponerlo. ` +
        `La regla financiera dice: el fondo de emergencia se usa para emergencias, y esta lo es.`
    );
  }

  // Recomendación sobre seguros
  if (expenseAmount > 500) {
    recs.push(
      `Revisa si este gasto podría estar cubierto por un seguro (hogar, salud, coche). ` +
        `Muchas veces pagamos seguros y no los reclamamos cuando deberíamos.`
    );
  }

  // Recomendación sobre negociación
  recs.push(
    `Negocia el precio. En gastos grandes (médicos, reparaciones,法律服务), ` +
      `siempre puedes pedir un descuento por pago al contado o un plan de pagos sin intereses.`
  );

  // Recomendación sobre impacto en metas
  if (goalImpacts.length > 0) {
    const maxDelay = Math.max(...goalImpacts.map((g) => g.delayMonths));
    recs.push(
      `Tus metas de ahorro se retrasarán hasta ${maxDelay} meses. ` +
        `No es un fracaso, es una adaptación. Lo importante es retomar el plan cuanto antes.`
    );
  }

  // Recomendación de prevención
  recs.push(
    `Tras recuperarte, revisa tu presupuesto para incluir una línea de "imprevistos" ` +
      `del 5-10% de tus ingresos mensuales. Esto actúa como colchón para futuras sorpresas.`
  );

  // Recomendación específica por severidad
  if (severity === "leve") {
    recs.push(
      `Tu situación es manejable. Este gasto no debería afectar significativamente tus finanzas. ` +
        `Simplemente ajusta ligeramente los gastos discrecionales este mes.`
    );
  } else if (severity === "moderada") {
    recs.push(
      `Con disciplina y recortes temporales, deberías recuperarte en 2-3 meses. ` +
        `Evita endeudarte y prioriza la recuperación antes de retomar el ahorro.`
    );
  } else if (severity === "grave") {
    recs.push(
      `La situación es seria pero tiene solución. Necesitas un plan de recuperación ` +
        `de 3-6 meses con recortes significativos. No dudes en buscar asesoramiento financiero.`
    );
  } else {
    recs.push(
      `Esta es una emergencia financiera seria. Considera buscar ayuda profesional: ` +
        `asistente social, asesor financiero gratuito, o recursos de tu comunidad. ` +
        `No estás solo/a en esto.`
    );
  }

  return recs;
}

/**
 * ============================================================
 * FUNCIÓN PRINCIPAL: Generador de Plan de Emergencia
 * ============================================================
 *
 * Recibe:
 * - transactions: Historial de transacciones del usuario
 * - savingsGoals: Metas de ahorro actuales
 * - emergency: Datos del gasto imprevisto
 *
 * Devuelve:
 * - EmergencyPlan: Plan completo de acción y recuperación
 */
export function generateEmergencyPlan(
  transactions: Transaction[],
  savingsGoals: SavingsGoal[],
  emergency: EmergencyExpenseInput
): EmergencyPlan {
  // ---- 1. Análisis de situación actual ----
  const { monthlyIncome, monthlyExpenses, monthlySurplus } = calculateAverages(transactions);
  const totalBalance = calculateTotalBalance(transactions);

  // ---- 2. Evaluación de severidad ----
  const { severity, score } = assessSeverity(
    emergency.amount,
    monthlySurplus,
    monthlyIncome,
    totalBalance
  );

  // ---- 3. Impacto en presupuesto mensual ----
  const impactOnMonthlyBudget = Math.round(
    (emergency.amount / monthlyIncome) * 100
  );

  // ---- 4. Fuentes de financiación ----
  const fundingSources = generateFundingSources(
    emergency.amount,
    monthlySurplus,
    totalBalance,
    savingsGoals,
    emergency.canFinance,
    emergency.financingMonths
  );

  // ---- 5. Impacto en metas de ahorro ----
  const goalImpacts = calculateGoalImpacts(
    savingsGoals,
    emergency.amount,
    monthlySurplus
  );

  // ---- 6. Plan de recuperación ----
  const recoveryPlan = generateRecoveryPlan(
    emergency.amount,
    monthlySurplus,
    fundingSources
  );

  // ---- 7. Acciones inmediatas ----
  const hasEmergencyFund = savingsGoals.some((g) =>
    g.name.toLowerCase().includes("emergencia") && g.currentAmount > 0
  );
  const immediateActions = generateImmediateActions(
    severity,
    emergency.canFinance,
    hasEmergencyFund
  );

  // ---- 8. Recomendaciones ----
  const recommendations = generateRecommendations(
    severity,
    emergency.amount,
    monthlySurplus,
    hasEmergencyFund,
    goalImpacts
  );

  // ---- 9. Resumen ejecutivo ----
  const severityLabels: Record<EmergencySeverity, { emoji: string; label: string }> = {
    leve: { emoji: "🟢", label: "Leve" },
    moderada: { emoji: "🟡", label: "Moderada" },
    grave: { emoji: "🟠", label: "Grave" },
    critica: { emoji: "🔴", label: "Crítica" },
  };
  const { emoji, label } = severityLabels[severity];

  const summary = [
    `${emoji} **Evaluación de Emergencia: ${label}** (Severidad: ${score}/100)`,
    ``,
    `💥 **Gasto imprevisto:** ${emergency.description} — ${emergency.amount.toLocaleString("es-ES")}€`,
    `📊 **Impacto en tu presupuesto:** ${impactOnMonthlyBudget}% de tu ingreso mensual`,
    ``,
    `💰 **Tu situación actual:**`,
    `• Ingreso mensual: ${monthlyIncome.toLocaleString("es-ES")}€`,
    `• Gasto mensual: ${monthlyExpenses.toLocaleString("es-ES")}€`,
    `• Superávit mensual: ${monthlySurplus.toLocaleString("es-ES")}€`,
    `• Balance total: ${totalBalance.toLocaleString("es-ES")}€`,
    ``,
    severity === "leve"
      ? `✅ Puedes absorber este gasto sin cambios significativos.`
      : severity === "moderada"
        ? `⚠️ Necesitarás ajustes temporales, pero es manejable.`
        : severity === "grave"
          ? `🔶 Se requieren recortes significativos y un plan de recuperación.`
          : `🚨 Situación crítica. Actúa ya con el plan de abajo.`,
  ].join("\n");

  return {
    severity,
    severityScore: score,
    expenseAmount: emergency.amount,
    impactOnMonthlyBudget,
    fundingSources,
    recoveryPlan,
    goalImpacts,
    recommendations,
    immediateActions,
    summary,
  };
}
