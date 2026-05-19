/**
 * ============================================
 * Módulo de Gestión de Deudas
 * ============================================
 *
 * Calcula planes de amortización y compara estrategias
 * de pago (Bola de Nieve vs Avalancha).
 *
 * Funcionalidades:
 * 1. Amortización mes a mes con desglose principal/intereses
 * 2. Estrategia Bola de Nieve (primero la deuda más pequeña)
 * 3. Estrategia Avalancha (primero la deuda con mayor interés)
 * 4. Comparación de estrategias lado a lado
 */

import {
  Debt,
  DebtPayoffPlan,
  DebtPayoffStep,
  DebtStrategy,
  GlobalDebtPlan,
} from "./types";

// ---- Cálculos de Amortización ----

/**
 * Calcula el plan de amortización de una deuda individual.
 * Usa interés compuesto mensual: monthlyRate = annualRate / 12
 * interest = balance * monthlyRate, principal = payment - interest
 *
 * Si el pago mensual es menor que los intereses, la deuda crece
 * (situación de pago insuficiente), se limita a 600 meses.
 */
export function calculateDebtPayoff(
  debt: Debt,
  monthlyPayment: number
): DebtPayoffPlan {
  const monthlyRate = debt.interestRate / 100 / 12;
  let balance = debt.currentBalance;
  const schedule: DebtPayoffStep[] = [];
  let totalInterest = 0;
  let totalPaid = 0;
  let months = 0;
  const maxMonths = 600; // 50 años como límite

  if (balance <= 0) {
    return {
      debt,
      monthsToPayoff: 0,
      totalInterest: 0,
      totalPaid: 0,
      monthlyPayment,
      schedule: [],
    };
  }

  const now = new Date();

  while (balance > 0 && months < maxMonths) {
    months++;
    const interest = balance * monthlyRate;
    let principal = monthlyPayment - interest;

    // Si el pago no cubre ni los intereses
    if (principal <= 0) {
      // Pago insuficiente: la deuda crece
      principal = 0;
      balance += interest - monthlyPayment;
      totalInterest += interest;
      totalPaid += monthlyPayment;

      const stepDate = new Date(now);
      stepDate.setMonth(stepDate.getMonth() + months);
      schedule.push({
        month: stepDate.toLocaleDateString("es-ES", {
          month: "short",
          year: "2-digit",
        }),
        payment: monthlyPayment,
        principal: 0,
        interest: Math.round(interest * 100) / 100,
        remainingBalance: Math.round(balance * 100) / 100,
      });

      // Si la deuda crece sin control, cortamos
      if (balance > debt.currentBalance * 3) break;
      continue;
    }

    // Último pago: no pagar más de lo que queda
    if (principal >= balance) {
      const lastPayment = balance + interest;
      totalInterest += interest;
      totalPaid += lastPayment;

      const stepDate = new Date(now);
      stepDate.setMonth(stepDate.getMonth() + months);
      schedule.push({
        month: stepDate.toLocaleDateString("es-ES", {
          month: "short",
          year: "2-digit",
        }),
        payment: Math.round(lastPayment * 100) / 100,
        principal: Math.round(balance * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        remainingBalance: 0,
      });
      balance = 0;
    } else {
      totalInterest += interest;
      totalPaid += monthlyPayment;
      balance -= principal;

      const stepDate = new Date(now);
      stepDate.setMonth(stepDate.getMonth() + months);
      schedule.push({
        month: stepDate.toLocaleDateString("es-ES", {
          month: "short",
          year: "2-digit",
        }),
        payment: monthlyPayment,
        principal: Math.round(principal * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        remainingBalance: Math.round(balance * 100) / 100,
      });
    }
  }

  return {
    debt,
    monthsToPayoff: months,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
    monthlyPayment,
    schedule,
  };
}

/**
 * Genera un plan global de pago de deudas según la estrategia elegida.
 *
 * "bola_nieve" (snowball): pagar mínimos en todas, extra va a la
 *   deuda MÁS PEQUEÑA primero (motivacional).
 *
 * "avalancha" (avalanche): pagar mínimos en todas, extra va a la
 *   deuda con MAYOR INTERÉS primero (óptimo matemático).
 */
export function generateGlobalDebtPlan(
  debts: Debt[],
  strategy: DebtStrategy,
  extraAmount: number
): GlobalDebtPlan {
  if (debts.length === 0) {
    return {
      strategy,
      totalDebt: 0,
      totalInterest: 0,
      totalMonthsToFreedom: 0,
      debtsOrder: [],
      individualPlans: [],
      monthlyPaymentTotal: 0,
      snowballExtra: extraAmount,
      summary: "No hay deudas que gestionar.",
    };
  }

  // Calcular deuda total y pago mínimo total
  const totalDebt = debts.reduce((sum, d) => sum + d.currentBalance, 0);
  const minimumPaymentTotal = debts.reduce(
    (sum, d) => sum + d.minimumPayment,
    0
  );

  // Ordenar deudas según estrategia
  const sortedDebts = [...debts].sort((a, b) => {
    if (strategy === "bola_nieve") {
      // Menor balance primero
      return a.currentBalance - b.currentBalance;
    } else {
      // Mayor interés primero; si hay empate, menor balance
      if (b.interestRate !== a.interestRate) {
        return b.interestRate - a.interestRate;
      }
      return a.currentBalance - b.currentBalance;
    }
  });

  // Simular mes a mes el plan global
  const balances = new Map<string, number>();
  const paidOffMonths = new Map<string, number>();
  const totalInterestByDebt = new Map<string, number>();

  for (const debt of debts) {
    balances.set(debt.id, debt.currentBalance);
    totalInterestByDebt.set(debt.id, 0);
  }

  let totalInterest = 0;
  let totalMonths = 0;
  const maxMonths = 600;
  const now = new Date();

  while (totalMonths < maxMonths) {
    totalMonths++;

    // Determinar qué deudas siguen vivas y cuál es la prioritaria
    const activeDebts = sortedDebts.filter(
      (d) => (balances.get(d.id) ?? 0) > 0
    );
    if (activeDebts.length === 0) break;

    const targetDebt = activeDebts[0]; // Primera según estrategia

    // Distribuir pagos: mínimos a todas, extra al target
    let remainingExtra = extraAmount;

    for (const debt of activeDebts) {
      const balance = balances.get(debt.id) ?? 0;
      const monthlyRate = debt.interestRate / 100 / 12;
      const interest = balance * monthlyRate;

      totalInterestByDebt.set(
        debt.id,
        (totalInterestByDebt.get(debt.id) ?? 0) + interest
      );
      totalInterest += interest;

      if (debt.id === targetDebt.id) {
        // Pago mínimo + todo el extra disponible
        let payment = debt.minimumPayment + remainingExtra;
        const principal = payment - interest;

        if (principal >= balance) {
          // Se paga completamente
          const lastPayment = balance + interest;
          totalInterest -= interest; // Ajustar
          totalInterestByDebt.set(
            debt.id,
            (totalInterestByDebt.get(debt.id) ?? 0) - interest
          );
          totalInterest += interest; // Volver a sumar correctamente
          paidOffMonths.set(debt.id, totalMonths);
          balances.set(debt.id, 0);
        } else {
          balances.set(debt.id, balance - principal);
        }
        remainingExtra = 0;
      } else {
        // Solo pago mínimo
        const payment = debt.minimumPayment;
        const principal = payment - interest;

        if (principal <= 0) {
          // Pago insuficiente
          balances.set(debt.id, balance + interest - payment);
        } else if (principal >= balance) {
          // Se paga completamente con el mínimo
          paidOffMonths.set(debt.id, totalMonths);
          balances.set(debt.id, 0);
          // El sobrante del mínimo va al extra
          remainingExtra += principal - balance;
        } else {
          balances.set(debt.id, balance - principal);
        }
      }
    }
  }

  // Generar planes individuales con los meses calculados
  const individualPlans: DebtPayoffPlan[] = sortedDebts.map((debt) => {
    const monthsToPayoff = paidOffMonths.get(debt.id) ?? totalMonths;
    const interestPaid = Math.round(
      (totalInterestByDebt.get(debt.id) ?? 0) * 100
    ) / 100;
    const totalPaid = Math.round(
      (debt.currentBalance + interestPaid) * 100
    ) / 100;

    // Generar schedule simplificado para la deuda
    const schedule = generateDebtSchedule(
      debt,
      debt.id === sortedDebts[0]?.id
        ? debt.minimumPayment + extraAmount
        : debt.minimumPayment,
      monthsToPayoff
    );

    return {
      debt,
      monthsToPayoff,
      totalInterest: interestPaid,
      totalPaid,
      monthlyPayment:
        debt.id === sortedDebts[0]?.id
          ? debt.minimumPayment + extraAmount
          : debt.minimumPayment,
      schedule,
    };
  });

  // Resumen
  const strategyLabel =
    strategy === "bola_nieve" ? "Bola de Nieve" : "Avalancha";
  const summary = [
    `📊 **Estrategia: ${strategyLabel}**`,
    ``,
    `💰 Deuda total: ${totalDebt.toLocaleString("es-ES")}€`,
    `📅 Pago mínimo total: ${minimumPaymentTotal.toLocaleString("es-ES")}€/mes`,
    `➕ Pago extra: ${extraAmount.toLocaleString("es-ES")}€/mes`,
    `💳 Pago mensual total: ${(minimumPaymentTotal + extraAmount).toLocaleString("es-ES")}€/mes`,
    ``,
    `🏦 Orden de ataque:`,
    ...sortedDebts.map(
      (d, i) =>
        `  ${i + 1}. ${d.name} — ${d.currentBalance.toLocaleString("es-ES")}€ al ${d.interestRate}% TAE`
    ),
    ``,
    `🎉 Libertad de deudas en **${totalMonths} meses**`,
    `💸 Intereses totales: ${Math.round(totalInterest).toLocaleString("es-ES")}€`,
  ].join("\n");

  return {
    strategy,
    totalDebt,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalMonthsToFreedom: totalMonths,
    debtsOrder: sortedDebts,
    individualPlans,
    monthlyPaymentTotal: minimumPaymentTotal,
    snowballExtra: extraAmount,
    summary,
  };
}

/**
 * Genera un schedule simplificado para una deuda individual.
 */
function generateDebtSchedule(
  debt: Debt,
  monthlyPayment: number,
  maxMonths: number
): DebtPayoffStep[] {
  const monthlyRate = debt.interestRate / 100 / 12;
  let balance = debt.currentBalance;
  const schedule: DebtPayoffStep[] = [];
  const now = new Date();
  let months = 0;

  while (balance > 0 && months < maxMonths) {
    months++;
    const interest = balance * monthlyRate;
    let principal = monthlyPayment - interest;

    const stepDate = new Date(now);
    stepDate.setMonth(stepDate.getMonth() + months);

    if (principal <= 0) {
      balance += interest - monthlyPayment;
      schedule.push({
        month: stepDate.toLocaleDateString("es-ES", {
          month: "short",
          year: "2-digit",
        }),
        payment: monthlyPayment,
        principal: 0,
        interest: Math.round(interest * 100) / 100,
        remainingBalance: Math.round(balance * 100) / 100,
      });
      if (balance > debt.currentBalance * 3) break;
      continue;
    }

    if (principal >= balance) {
      const lastPayment = balance + interest;
      schedule.push({
        month: stepDate.toLocaleDateString("es-ES", {
          month: "short",
          year: "2-digit",
        }),
        payment: Math.round(lastPayment * 100) / 100,
        principal: Math.round(balance * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        remainingBalance: 0,
      });
      balance = 0;
    } else {
      balance -= principal;
      schedule.push({
        month: stepDate.toLocaleDateString("es-ES", {
          month: "short",
          year: "2-digit",
        }),
        payment: monthlyPayment,
        principal: Math.round(principal * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        remainingBalance: Math.round(balance * 100) / 100,
      });
    }
  }

  return schedule;
}

// ---- Comparación de Estrategias ----

/** Resultado de la comparación de estrategias */
export interface StrategyComparison {
  snowball: GlobalDebtPlan;
  avalanche: GlobalDebtPlan;
  interestSavedByAvalanche: number;
  monthsSavedByAvalanche: number;
  recommendation: string;
}

/**
 * Compara las estrategias Bola de Nieve y Avalancha lado a lado.
 *
 * Calcula ambos planes y muestra:
 * - Meses para libertad con cada estrategia
 * - Intereses totales con cada estrategia
 * - Ahorro de la avalancha sobre la bola de nieve
 * - Recomendación basada en la situación
 */
export function compareStrategies(
  debts: Debt[],
  extraAmount: number
): StrategyComparison {
  const snowball = generateGlobalDebtPlan(debts, "bola_nieve", extraAmount);
  const avalanche = generateGlobalDebtPlan(debts, "avalancha", extraAmount);

  const interestSavedByAvalanche = Math.round(
    (snowball.totalInterest - avalanche.totalInterest) * 100
  ) / 100;
  const monthsSavedByAvalanche =
    snowball.totalMonthsToFreedom - avalanche.totalMonthsToFreedom;

  let recommendation: string;

  if (interestSavedByAvalanche <= 0 && monthsSavedByAvalanche <= 0) {
    recommendation =
      "Ambas estrategias son equivalentes en tu caso. Elige la que te motive más.";
  } else if (interestSavedByAvalanche < 100) {
    recommendation =
      "La Bola de Nieve es ideal para ti: la diferencia en intereses es mínima " +
      `(${interestSavedByAvalanche.toLocaleString("es-ES")}€) y tendrás victorias rápidas ` +
      "que mantendrán tu motivación.";
  } else if (monthsSavedByAvalanche >= 6) {
    recommendation =
      "La Avalancha te ahorra significativamente: " +
      `${interestSavedByAvalanche.toLocaleString("es-ES")}€ menos en intereses y ` +
      `${monthsSavedByAvalanche} meses antes de ser libre. Si puedes mantener la disciplina, es la mejor opción.`;
  } else {
    recommendation =
      "La Avalancha te ahorra " +
      `${interestSavedByAvalanche.toLocaleString("es-ES")}€ en intereses. ` +
      "Si necesitas motivación rápida, la Bola de Nieve te da victorias tempranas. " +
      "Si priorizas el ahorro matemático, ve con Avalancha.";
  }

  return {
    snowball,
    avalanche,
    interestSavedByAvalanche,
    monthsSavedByAvalanche,
    recommendation,
  };
}
