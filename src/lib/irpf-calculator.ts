/**
 * ============================================
 * Calculadora IRPF 2025 - España
 * ============================================
 * Cálculo completo del Impuesto sobre la Renta
 * de las Personas Físicas según normativa 2025.
 * Incluye: tramos estatales y autonómicos,
 * mínimos personal y familiar, reducción por
 * rendimientos del trabajo, y estimaciones
 * para autónomos (IVA e IRPF trimestral).
 */

import type { IRPFProfile, IRPFResult, IRPFBracket } from "./types";

// ============================================
// TRAMOS IRPF 2025 (Combinado Estatal + Autonómico)
// ============================================

interface BracketDefinition {
  from: number;
  to: number; // null = sin límite
  stateRate: number;
  autonomousRate: number;
  combinedRate: number;
  priorIntegral: number; // Cuota íntegra acumulada hasta el tramo anterior
}

const IRPF_BRACKETS_2025: BracketDefinition[] = [
  {
    from: 0,
    to: 12450,
    stateRate: 9.5,
    autonomousRate: 9.5,
    combinedRate: 19,
    priorIntegral: 0,
  },
  {
    from: 12450,
    to: 20200,
    stateRate: 12,
    autonomousRate: 12,
    combinedRate: 24,
    priorIntegral: 2365.5, // 12450 * 0.19
  },
  {
    from: 20200,
    to: 35200,
    stateRate: 15,
    autonomousRate: 15,
    combinedRate: 30,
    priorIntegral: 4225.5, // 2365.5 + 7750 * 0.24
  },
  {
    from: 35200,
    to: 60000,
    stateRate: 18.5,
    autonomousRate: 18.5,
    combinedRate: 37,
    priorIntegral: 8725.5, // 4225.5 + 15000 * 0.30
  },
  {
    from: 60000,
    to: 300000,
    stateRate: 22.5,
    autonomousRate: 22.5,
    combinedRate: 45,
    priorIntegral: 17901.5, // 8725.5 + 24800 * 0.37
  },
  {
    from: 300000,
    to: null, // Sin límite superior
    stateRate: 24.5,
    autonomousRate: 22.5,
    combinedRate: 47,
    priorIntegral: 125901.5, // 17901.5 + 240000 * 0.45
  },
];

// ============================================
// MÍNIMO PERSONAL
// ============================================

function calculateMinimumPersonal(age: number): number {
  if (age >= 75) return 8100;
  if (age >= 65) return 6700;
  return 5550;
}

// ============================================
// MÍNIMO POR DESCENDIENTES
// ============================================

function calculateMinimumDescendants(
  under3: number,
  from3to25: number
): number {
  const totalChildren = under3 + from3to25;
  if (totalChildren === 0) return 0;

  let minimum = 0;

  // Primer hijo: 2.400€
  // Segundo hijo: 2.700€
  // Tercer hijo: 4.000€
  // Cuarto y siguientes: 4.500€ cada uno
  const perChild = [2400, 2700, 4000];
  for (let i = 0; i < totalChildren; i++) {
    if (i < perChild.length) {
      minimum += perChild[i];
    } else {
      minimum += 4500;
    }
  }

  // Hijos menores de 3 años: +2.800€ por cada uno
  minimum += under3 * 2800;

  return minimum;
}

// ============================================
// MÍNIMO POR ASCENDIENTES
// ============================================

function calculateMinimumAscendants(over65: number, over75: number): number {
  // over75 ya está incluido en over65 conceptualmente,
  // pero en nuestro modelo over65 son los de 65-74 y over75 los de 75+
  let minimum = 0;

  // Cada ascendiente >65: 1.150€
  minimum += over65 * 1150;

  // Cada ascendiente >75: adicional 1.400€ (total 2.550€)
  minimum += over75 * 1400;

  return minimum;
}

// ============================================
// MÍNIMO POR DISCAPACIDAD
// ============================================

function calculateMinimumDisability(
  degree: IRPFProfile["disabilityDegree"],
  hasAssistant: boolean
): number {
  let minimum = 0;

  if (degree === "33_65") {
    minimum = 3000;
  } else if (degree === "65_plus") {
    minimum = 9000;
    if (hasAssistant) {
      minimum += 3000;
    }
  }

  return minimum;
}

// ============================================
// FAMILIA NUMEROSA
// ============================================

function calculateFamilyNumerosa(familyType: IRPFProfile["familyType"]): number {
  if (familyType === "numerosa_general") return 1200;
  if (familyType === "numerosa_especial") return 2400;
  return 0;
}

// ============================================
// REDUCCIÓN POR RENDIMIENTOS DEL TRABAJO (2024-2025)
// ============================================

function calculateWorkReduction(netWorkIncome: number): number {
  if (netWorkIncome <= 0) return 0;

  if (netWorkIncome <= 14047.5) {
    return 7302.6;
  } else if (netWorkIncome <= 19747.5) {
    const reduction = 7302.6 - 1.75 * (netWorkIncome - 14047.5);
    return Math.max(reduction, 0);
  } else {
    // Desde 2024: reducción mínima de 2.000€ para rendimientos > 19.747,50€
    return 2000;
  }
}

// ============================================
// CÁLCULO POR TRAMOS
// ============================================

function calculateBrackets(baseLiquidable: number): {
  brackets: IRPFBracket[];
  stateTax: number;
  autonomousTax: number;
  totalTax: number;
} {
  const brackets: IRPFBracket[] = [];
  let stateTax = 0;
  let autonomousTax = 0;

  if (baseLiquidable <= 0) {
    // Still return the bracket structure with 0 values
    for (const def of IRPF_BRACKETS_2025) {
      brackets.push({
        from: def.from,
        to: def.to ?? Infinity,
        rate: def.combinedRate,
        stateRate: def.stateRate,
        autonomousRate: def.autonomousRate,
        baseInBracket: 0,
        taxInBracket: 0,
      });
    }
    return { brackets, stateTax: 0, autonomousTax: 0, totalTax: 0 };
  }

  for (const def of IRPF_BRACKETS_2025) {
    const upperLimit = def.to ?? Infinity;

    if (baseLiquidable <= def.from) {
      // No alcanza este tramo
      brackets.push({
        from: def.from,
        to: def.to ?? Infinity,
        rate: def.combinedRate,
        stateRate: def.stateRate,
        autonomousRate: def.autonomousRate,
        baseInBracket: 0,
        taxInBracket: 0,
      });
      continue;
    }

    const baseInBracket = Math.min(baseLiquidable, upperLimit) - def.from;
    const stateTaxInBracket = baseInBracket * (def.stateRate / 100);
    const autonomousTaxInBracket = baseInBracket * (def.autonomousRate / 100);
    const taxInBracket = stateTaxInBracket + autonomousTaxInBracket;

    stateTax += stateTaxInBracket;
    autonomousTax += autonomousTaxInBracket;

    brackets.push({
      from: def.from,
      to: def.to ?? Infinity,
      rate: def.combinedRate,
      stateRate: def.stateRate,
      autonomousRate: def.autonomousRate,
      baseInBracket: Math.round(baseInBracket * 100) / 100,
      taxInBracket: Math.round(taxInBracket * 100) / 100,
    });
  }

  return {
    brackets,
    stateTax: Math.round(stateTax * 100) / 100,
    autonomousTax: Math.round(autonomousTax * 100) / 100,
    totalTax: Math.round((stateTax + autonomousTax) * 100) / 100,
  };
}

// ============================================
// DETERMINAR TIPO MARGINAL
// ============================================

function getMarginalRate(baseLiquidable: number): number {
  for (let i = IRPF_BRACKETS_2025.length - 1; i >= 0; i--) {
    const bracket = IRPF_BRACKETS_2025[i];
    if (baseLiquidable > bracket.from) {
      return bracket.combinedRate;
    }
  }
  return 0;
}

// ============================================
// ESTIMACIONES AUTÓNOMO
// ============================================

function calculateAutonomoEstimates(
  annualGrossIncome: number,
  annualExpenses: number,
  ivaRate: number
): { quarterlyVAT: number; quarterlyIRPF: number; annualIRPFWithholding: number } {
  // IVA trimestral estimado: (ingresos * tipo IVA - gastos * tipo IVA) / 4
  const annualVAT = annualGrossIncome * (ivaRate / 100) - annualExpenses * (ivaRate / 100);
  const quarterlyVAT = Math.max(0, Math.round((annualVAT / 4) * 100) / 100);

  // IRPF withholding para autónomos:
  // Primeros 3 años: 15%, después 20-30% según ingresos
  // Simplificación: estimar según tramo de ingresos
  let irpfRate: number;
  const netIncome = annualGrossIncome - annualExpenses;
  if (netIncome <= 12450) {
    irpfRate = 19;
  } else if (netIncome <= 20200) {
    irpfRate = 21;
  } else if (netIncome <= 35200) {
    irpfRate = 24;
  } else if (netIncome <= 60000) {
    irpfRate = 28;
  } else {
    irpfRate = 30;
  }

  const annualIRPFWithholding = Math.round(netIncome * (irpfRate / 100) * 100) / 100;
  const quarterlyIRPF = Math.round((annualIRPFWithholding / 4) * 100) / 100;

  return { quarterlyVAT, quarterlyIRPF, annualIRPFWithholding };
}

// ============================================
// GENERAR RESUMEN
// ============================================

function generateSummary(
  result: IRPFResult,
  profile: IRPFProfile
): string {
  const parts: string[] = [];

  parts.push(
    `Con un ingreso bruto de ${formatSummaryCurrency(result.grossIncome)}, ` +
    `tu IRPF estimado es de ${formatSummaryCurrency(result.totalTax)}, ` +
    `lo que supone un tipo efectivo del ${result.effectiveRate.toFixed(2)}%.`
  );

  parts.push(
    `Tu ingreso neto anual sería de ${formatSummaryCurrency(result.netAnnualIncome)} ` +
    `(${formatSummaryCurrency(result.netMonthlyIncome)}/mes).`
  );

  if (result.workReduction > 0) {
    parts.push(
      `Se aplica una reducción por rendimientos del trabajo de ${formatSummaryCurrency(result.workReduction)}.`
    );
  }

  if (result.minimumFamily > 0) {
    parts.push(
      `El mínimo familiar (descendientes + ascendientes) asciende a ${formatSummaryCurrency(result.minimumFamily)}.`
    );
  }

  if (result.minimumDisability > 0) {
    parts.push(
      `Se aplica un mínimo por discapacidad de ${formatSummaryCurrency(result.minimumDisability)}.`
    );
  }

  if (profile.familyType !== "normal") {
    const familyLabel =
      profile.familyType === "numerosa_especial" ? "especial (5+ hijos)" : "general (3-4 hijos)";
    parts.push(`Familia numerosa ${familyLabel} reconocida.`);
  }

  if (profile.isAutonomo) {
    parts.push(
      `Como autónomo, tu estimación de IVA trimestral es de ${formatSummaryCurrency(result.quarterlyVAT ?? 0)} ` +
      `y tu IRPF trimestral estimado es de ${formatSummaryCurrency(result.quarterlyIRPF ?? 0)}.`
    );
  }

  return parts.join(" ");
}

function formatSummaryCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

export function calculateIRPF(profile: IRPFProfile): IRPFResult {
  const {
    workerType,
    age,
    annualGrossIncome,
    descendantsUnder3,
    descendants3To25,
    ascendantsOver65,
    ascendantsOver75,
    disabilityDegree,
    hasAssistant,
    familyType,
    isAutonomo,
    annualExpenses,
    ivaRate,
  } = profile;

  // 1. Rendimiento neto del trabajo
  // Para asalariados: rendimiento neto = ingreso bruto (sin gastos deducibles)
  // Para autónomos: rendimiento neto = ingreso bruto - gastos deducibles
  let netWorkIncome: number;
  if (isAutonomo && annualExpenses) {
    netWorkIncome = annualGrossIncome - annualExpenses;
  } else {
    netWorkIncome = annualGrossIncome;
  }

  // 2. Reducción por rendimientos del trabajo
  const workReduction = calculateWorkReduction(netWorkIncome);

  // 3. Rendimiento neto reducido
  const reducedNetWorkIncome = Math.max(0, netWorkIncome - workReduction);

  // 4. Otras deducciones (por simplificación, 0)
  const otherDeductions = 0;

  // 5. Base imponible = rendimiento neto reducido + otras rentas
  // Simplificación: solo rendimientos del trabajo
  const taxableBase = Math.max(0, reducedNetWorkIncome + otherDeductions);

  // 6. Mínimo personal y familiar
  const minimumPersonal = calculateMinimumPersonal(age);
  const minimumDescendants = calculateMinimumDescendants(descendantsUnder3, descendants3To25);
  const minimumAscendants = calculateMinimumAscendants(ascendantsOver65, ascendantsOver75);
  const minimumFamily = minimumDescendants + minimumAscendants;
  const minimumDisability = calculateMinimumDisability(disabilityDegree, hasAssistant);
  const familyNumerosaReduction = calculateFamilyNumerosa(familyType);

  const totalMinimum =
    minimumPersonal + minimumFamily + minimumDisability + familyNumerosaReduction;

  // 7. Base liquidable = max(0, base imponible - mínimo personal y familiar)
  // El mínimo personal y familiar reduce la base liquidable
  const baseLiquidable = Math.max(0, taxableBase - totalMinimum);

  // 8. Cuota íntegra (cálculo por tramos)
  const { brackets, stateTax, autonomousTax, totalTax } = calculateBrackets(baseLiquidable);

  // 9. Tipo efectivo y marginal
  const effectiveRate = annualGrossIncome > 0 ? (totalTax / annualGrossIncome) * 100 : 0;
  const marginalRate = getMarginalRate(baseLiquidable);

  // 10. Ingreso neto
  const netAnnualIncome = Math.max(0, annualGrossIncome - totalTax);
  const netMonthlyIncome = Math.round((netAnnualIncome / 12) * 100) / 100;

  // 11. Estimaciones autónomo
  let quarterlyVAT: number | undefined;
  let quarterlyIRPF: number | undefined;
  let annualIRPFWithholding: number | undefined;

  if (isAutonomo && annualExpenses !== undefined && ivaRate !== undefined) {
    const estimates = calculateAutonomoEstimates(annualGrossIncome, annualExpenses, ivaRate);
    quarterlyVAT = estimates.quarterlyVAT;
    quarterlyIRPF = estimates.quarterlyIRPF;
    annualIRPFWithholding = estimates.annualIRPFWithholding;
  }

  const result: IRPFResult = {
    grossIncome: annualGrossIncome,
    workReduction: Math.round(workReduction * 100) / 100,
    netWorkIncome: Math.round(reducedNetWorkIncome * 100) / 100,
    otherDeductions,
    taxableBase: Math.round(taxableBase * 100) / 100,
    minimumPersonal,
    minimumFamily,
    minimumDisability,
    totalMinimum,
    baseLiquidable: Math.round(baseLiquidable * 100) / 100,
    brackets,
    stateTax,
    autonomousTax,
    totalTax,
    effectiveRate: Math.round(effectiveRate * 100) / 100,
    marginalRate,
    netAnnualIncome: Math.round(netAnnualIncome * 100) / 100,
    netMonthlyIncome,
    quarterlyVAT,
    quarterlyIRPF,
    annualIRPFWithholding,
    summary: "", // Se rellena después
  };

  result.summary = generateSummary(result, profile);

  return result;
}
