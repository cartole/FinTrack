/**
 * ============================================
 * Módulo de IA - Planificador de Ahorro
 * ============================================
 *
 * Función principal que recibe un historial de gastos del usuario
 * y una meta de ahorro, y devuelve un plan de ahorro estructurado.
 *
 * Esta función simula la respuesta que daría un modelo como OpenAI,
 * pero utiliza un motor de reglas lógicas determinista que:
 *
 * 1. Analiza los patrones de gasto por categoría
 * 2. Identifica oportunidades de recorte
 * 3. Calcula la viabilidad de la meta
 * 4. Genera un plan mensual paso a paso
 * 5. Proporciona recomendaciones personalizadas
 *
 * ARQUITECTURA: Diseñado para ser reemplazable por una llamada
 * a una API de IA real (OpenAI, etc.) sin cambiar la interfaz.
 */

import {
  Transaction,
  TransactionCategory,
  SavingsPlan,
  CategoryCut,
  TimelineStep,
  CATEGORY_CONFIG,
} from "./types";

/** Parámetros para generar un plan de ahorro */
export interface SavingsPlanInput {
  name: string;
  targetAmount: number;
  currentSaved: number;
  deadline: string; // ISO date string
}

/** Umbral mínimo de meses para considerar un gasto recurrente en el análisis */
const RECURRENT_THRESHOLD_MONTHS = 2;

/**
 * Calcula el promedio mensual de gastos por categoría.
 * Analiza todos los gastos del historial y los agrupa por categoría,
 * calculando el promedio mensual para identificar patrones.
 */
function calculateMonthlyAverages(
  transactions: Transaction[]
): Record<TransactionCategory, number> {
  const expenseByCategory: Record<TransactionCategory, number> = {} as Record<
    TransactionCategory,
    number
  >;
  const monthsSet = new Set<string>();

  // Solo analizamos gastos
  const expenses = transactions.filter((t) => t.type === "gasto");

  for (const expense of expenses) {
    const month = expense.date.substring(0, 7); // "YYYY-MM"
    monthsSet.add(month);

    if (!expenseByCategory[expense.category]) {
      expenseByCategory[expense.category] = 0;
    }
    expenseByCategory[expense.category] += expense.amount;
  }

  const monthCount = Math.max(monthsSet.size, 1);

  // Calcular promedio mensual por categoría
  const averages = {} as Record<TransactionCategory, number>;
  for (const [category, total] of Object.entries(expenseByCategory)) {
    averages[category as TransactionCategory] = Math.round(total / monthCount);
  }

  return averages;
}

/**
 * Calcula el promedio mensual de ingresos.
 * Considera tanto ingresos recurrentes como puntuales.
 */
function calculateMonthlyIncome(transactions: Transaction[]): number {
  const incomeByMonth: Record<string, number> = {};

  for (const t of transactions) {
    if (t.type === "ingreso") {
      const month = t.date.substring(0, 7);
      if (!incomeByMonth[month]) incomeByMonth[month] = 0;
      incomeByMonth[month] += t.amount;
    }
  }

  const months = Object.values(incomeByMonth);
  if (months.length === 0) return 0;
  return Math.round(months.reduce((a, b) => a + b, 0) / months.length);
}

/**
 * Calcula el promedio mensual de gastos totales.
 */
function calculateMonthlyExpenses(transactions: Transaction[]): number {
  const expenseByMonth: Record<string, number> = {};

  for (const t of transactions) {
    if (t.type === "gasto") {
      const month = t.date.substring(0, 7);
      if (!expenseByMonth[month]) expenseByMonth[month] = 0;
      expenseByMonth[month] += t.amount;
    }
  }

  const months = Object.values(expenseByMonth);
  if (months.length === 0) return 0;
  return Math.round(months.reduce((a, b) => a + b, 0) / months.length);
}

/**
 * Determina la dificultad de recortar una categoría.
 * Basado en si el gasto es esencial (alquiler, comida) vs discrecional (ocio, ropa).
 */
function assessCutDifficulty(
  category: TransactionCategory,
  currentAvg: number,
  cutPercentage: number
): "facil" | "moderado" | "dificil" {
  // Categorías esenciales - más difícil de recortar
  const essential: TransactionCategory[] = [
    "alquiler",
    "comida",
    "transporte",
    "salud",
  ];
  // Categorías discretcionales - más fácil de recortar
  const discretionary: TransactionCategory[] = [
    "ocio",
    "ropa",
    "suscripciones",
    "educacion",
  ];

  if (essential.includes(category)) {
    // Los esenciales con recorte agresivo son difíciles
    return cutPercentage > 0.15 ? "dificil" : "moderado";
  }

  if (discretionary.includes(category)) {
    return cutPercentage > 0.4 ? "moderado" : "facil";
  }

  return "moderado";
}

/**
 * Genera recomendaciones personalizadas basadas en los patrones de gasto.
 * Cada recomendación es específica a la situación del usuario.
 */
function generateRecommendations(
  categoryAverages: Record<TransactionCategory, number>,
  monthlyIncome: number,
  savingsRate: number,
  monthsToGoal: number
): string[] {
  const recommendations: string[] = [];

  // Análisis de ratio de ahorro
  if (savingsRate < 0.1) {
    recommendations.push(
      `Tu tasa de ahorro actual es del ${Math.round(savingsRate * 100)}%, lo cual es baja. ` +
        `Intenta alcanzar al menos el 20% reduciendo gastos discrecionales.`
    );
  } else if (savingsRate < 0.2) {
    recommendations.push(
      `Tu tasa de ahorro del ${Math.round(savingsRate * 100)}% es aceptable, pero hay margen de mejora. ` +
        `Revisa tus suscripciones y gastos de ocio para optimizar.`
    );
  } else {
    recommendations.push(
      `¡Excelente! Tu tasa de ahorro del ${Math.round(savingsRate * 100)}% es saludable. ` +
        `Mantén este ritmo y alcanzarás tu meta cómodamente.`
    );
  }

  // Recomendaciones específicas por categoría
  if (categoryAverages.ocio && categoryAverages.ocio > 150) {
    recommendations.push(
      `Tu gasto mensual en Ocio (${categoryAverages.ocio.toLocaleString("es-ES")}€) es elevado. ` +
        `Considera establecer un presupuesto de entretenimiento de 100€/mes ` +
        `y busca alternativas gratuitas como eventos culturales o actividades al aire libre.`
    );
  }

  if (categoryAverages.comida && categoryAverages.comida > 300) {
    recommendations.push(
      `En Comida gastas ${categoryAverages.comida.toLocaleString("es-ES")}€/mes de media. ` +
        `Planificar un menú semanal y cocinar en batch puede reducir esto un 25-30%. ` +
        `Ahorrarías aproximadamente ${Math.round(categoryAverages.comida * 0.27).toLocaleString("es-ES")}€/mes.`
    );
  }

  if (categoryAverages.suscripciones && categoryAverages.suscripciones > 40) {
    recommendations.push(
      `Tus Suscripciones suman ${categoryAverages.suscripciones.toLocaleString("es-ES")}€/mes. ` +
        `Revisa si usas activamente todos los servicios. Compartir planes familiares ` +
        `o alternar servicios por meses puede ahorrarte hasta el 50%.`
    );
  }

  if (categoryAverages.ropa && categoryAverages.ropa > 200) {
    recommendations.push(
      `Tu gasto en Ropa promedia ${categoryAverages.ropa.toLocaleString("es-ES")}€/mes. ` +
        `Aplica la regla de las 48 horas: espera 2 días antes de cualquier compra ` +
        `no planificada de ropa. Esto reduce las compras impulsivas un 60%.`
    );
  }

  // Recomendación de ingresos adicionales
  if (monthsToGoal > 12) {
    recommendations.push(
      `Con ${monthsToGoal} meses para tu meta, considera aumentar tus ingresos. ` +
        `Proyectos freelance, venta de artículos usados, o monetizar una habilidad ` +
        `pueden acelerar significativamente tu plan de ahorro.`
    );
  }

  // Recomendación de automatización
  recommendations.push(
    `Automatiza tus ahorros: configura una transferencia automática el día de pago ` +
      `hacia una cuenta separada. "Págate a ti mismo primero" es la estrategia ` +
      `más efectiva según estudios financieros.`
  );

  return recommendations;
}

/**
 * ============================================================
 * FUNCIÓN PRINCIPAL: Generador de Plan de Ahorro
 * ============================================================
 *
 * Recibe:
 * - transactions: Array con el historial de gastos del usuario
 * - goal: Objeto con la meta de ahorro (nombre, monto, fecha límite)
 *
 * Devuelve:
 * - SavingsPlan: Plan de ahorro estructurado completo
 *
 * DISEÑO: Esta función está diseñada para ser reemplazable.
 * La interfaz SavingsPlanInput y SavingsPlan pueden conectarse
 * directamente a una API de IA (OpenAI, Claude, etc.) cambiando
 * solo la implementación interna, sin modificar los consumidores.
 */
export function generateSavingsPlan(
  transactions: Transaction[],
  goal: SavingsPlanInput
): SavingsPlan {
  // ---- 1. Análisis de datos históricos ----
  const categoryAverages = calculateMonthlyAverages(transactions);
  const monthlyIncome = calculateMonthlyIncome(transactions);
  const monthlyExpenses = calculateMonthlyExpenses(transactions);
  const currentSurplus = monthlyIncome - monthlyExpenses;

  // ---- 2. Cálculo de la meta ----
  const remainingAmount = goal.targetAmount - goal.currentSaved;
  const deadlineDate = new Date(goal.deadline);
  const now = new Date();
  const monthsRemaining = Math.max(
    1,
    Math.ceil(
      (deadlineDate.getTime() - now.getTime()) / (30.44 * 24 * 60 * 60 * 1000)
    )
  );
  const monthlySavingsRequired = Math.ceil(remainingAmount / monthsRemaining);

  // ---- 3. Evaluación de viabilidad ----
  const maxPossibleSavings = currentSurplus > 0 ? currentSurplus : 0;
  const feasibilityRatio =
    maxPossibleSavings > 0
      ? Math.min(monthlySavingsRequired / maxPossibleSavings, 2)
      : 2;

  let feasibilityScore: number;
  if (feasibilityRatio <= 0.5) feasibilityScore = 95;
  else if (feasibilityRatio <= 0.7) feasibilityScore = 85;
  else if (feasibilityRatio <= 0.85) feasibilityScore = 70;
  else if (feasibilityRatio <= 1.0) feasibilityScore = 55;
  else if (feasibilityRatio <= 1.3) feasibilityScore = 35;
  else feasibilityScore = 15;

  // ---- 4. Identificar oportunidades de recorte ----
  const categoryCuts: CategoryCut[] = [];

  // Estrategia de recorte: priorizar categorías discrecionales
  const cutPriority: TransactionCategory[] = [
    "ocio",
    "ropa",
    "suscripciones",
    "comida",
    "transporte",
    "educacion",
    "salud",
  ];

  // Porcentajes de recorte sugeridos por categoría (progresivos)
  const cutPercentages: Record<string, number> = {
    ocio: 0.4, // 40% - muy discrecional
    ropa: 0.35, // 35% - muy discrecional
    suscripciones: 0.3, // 30% - discrecional
    comida: 0.15, // 15% - necesario pero optimizable
    transporte: 0.1, // 10% - difícil de recortar
    educacion: 0.05, // 5% - inversión
    salud: 0.0, // 0% - no se recorta
  };

  let totalPotentialSavings = 0;

  for (const category of cutPriority) {
    const avg = categoryAverages[category];
    if (!avg || avg <= 0) continue;

    const cutPct = cutPercentages[category] || 0.1;
    const suggestedMax = Math.round(avg * (1 - cutPct));
    const potentialSaving = avg - suggestedMax;

    if (potentialSaving > 0) {
      const difficulty = assessCutDifficulty(category, avg, cutPct);
      categoryCuts.push({
        category,
        currentMonthlyAvg: avg,
        suggestedMax,
        potentialSaving,
        difficulty,
      });
      totalPotentialSavings += potentialSaving;
    }
  }

  // Ordenar por ahorro potencial descendente
  categoryCuts.sort((a, b) => b.potentialSaving - a.potentialSaving);

  // ---- 5. Generar timeline proyectado ----
  const timeline: TimelineStep[] = [];
  const adjustedMonthlySavings = Math.min(
    monthlySavingsRequired,
    currentSurplus + totalPotentialSavings
  );
  let cumulative = goal.currentSaved;

  for (let i = 1; i <= monthsRemaining; i++) {
    const futureDate = new Date(now);
    futureDate.setMonth(futureDate.getMonth() + i);
    const monthLabel = futureDate.toLocaleDateString("es-ES", {
      month: "short",
      year: "2-digit",
    });

    cumulative += adjustedMonthlySavings;

    let milestone = "";
    const progress = cumulative / (goal.targetAmount);
    if (progress >= 1 && cumulative - adjustedMonthlySavings < goal.targetAmount) {
      milestone = "🎉 ¡Meta alcanzada!";
    } else if (progress >= 0.75) {
      milestone = "¡Ya falta poco!";
    } else if (progress >= 0.5) {
      milestone = "Mitadel camino";
    } else if (progress >= 0.25) {
      milestone = "Buen progreso";
    } else if (i === 1) {
      milestone = "Primer paso";
    }

    timeline.push({
      month: monthLabel,
      amountToSave: adjustedMonthlySavings,
      cumulativeSaved: Math.min(cumulative, goal.targetAmount),
      milestone,
    });
  }

  // ---- 6. Generar recomendaciones ----
  const savingsRate = monthlyIncome > 0 ? currentSurplus / monthlyIncome : 0;
  const recommendations = generateRecommendations(
    categoryAverages,
    monthlyIncome,
    savingsRate,
    monthsRemaining
  );

  // ---- 7. Generar resumen ejecutivo ----
  const feasibilityEmoji =
    feasibilityScore >= 70
      ? "✅"
      : feasibilityScore >= 40
        ? "⚠️"
        : "🔴";

  const summary = [
    `${feasibilityEmoji} **Plan de Ahorro: ${goal.name}**`,
    ``,
    `📊 **Análisis Financiero:**`,
    `• Ingreso mensual promedio: ${monthlyIncome.toLocaleString("es-ES")}€`,
    `• Gasto mensual promedio: ${monthlyExpenses.toLocaleString("es-ES")}€`,
    `• Superávit mensual actual: ${currentSurplus.toLocaleString("es-ES")}€`,
    `• Ahorro mensual requerido: ${monthlySavingsRequired.toLocaleString("es-ES")}€`,
    ``,
    `🎯 **Viabilidad: ${feasibilityScore}/100**`,
    feasibilityScore >= 70
      ? `Tu meta es alcanzable con ajustes moderados en tus gastos.`
      : feasibilityScore >= 40
        ? `Necesitarás recortes significativos o ingresos adicionales.`
        : `La meta es muy ambiciosa con tu situación actual. Considera ajustar el plazo o el monto.`,
    ``,
    `💡 **Con los recortes sugeridos podrías ahorrar ${Math.round(adjustedMonthlySavings).toLocaleString("es-ES")}€/mes**`,
    `📅 **Tiempo estimado para alcanzar la meta: ${monthsRemaining} meses**`,
    `💰 **Monto restante: ${remainingAmount.toLocaleString("es-ES")}€**`,
  ].join("\n");

  return {
    goalName: goal.name,
    targetAmount: goal.targetAmount,
    monthlySavingsRequired,
    monthsToGoal: monthsRemaining,
    feasibilityScore,
    categoryCuts,
    projectedTimeline: timeline,
    recommendations,
    summary,
  };
}
