/**
 * ============================================
 * Módulo de IA - Asesor de Ingreso Extra
 * ============================================
 *
 * Analiza la situación financiera del usuario y determina
 * si necesita generar ingresos adicionales, cuánto necesita
 * y cómo puede conseguirlo.
 *
 * Solo se activa cuando la situación financiera es mala:
 * - Déficit mensual continuo
 * - Tasa de ahorro negativa o muy baja
 * - Gastos superan ingresos de forma sostenida
 * - Balance total decreciente
 *
 * Funcionalidades:
 * 1. Diagnóstico automático de la situación financiera
 * 2. Cálculo del ingreso extra mensual necesario
 * 3. Sugerencias personalizadas de cómo generar ese ingreso
 * 4. Plan de acción paso a paso
 * 5. Estimación de tiempo para estabilizar finanzas
 */

import { Transaction, TransactionCategory, CATEGORY_CONFIG } from "./types";
import { calculateTotalBalance, getMonthFromISO } from "./finance-utils";

// ---- Tipos ----

/** Nivel de urgencia financiera */
export type FinancialUrgency = "estable" | "preocupante" | "urgente" | "critica";

/** Categoría de fuente de ingreso extra */
export type IncomeCategory =
  | "freelance"
  | "venta_articulos"
  | "clases_particulares"
  | "horas_extra"
  | "micro_trabajos"
  | "alquiler_espacio"
  | "monetizacion_habilidad"
  | "reventa"
  | "encuestas_online"
  | "delivery_transport";

/** Sugerencia de ingreso extra */
export interface IncomeSuggestion {
  category: IncomeCategory;
  title: string;
  description: string;
  estimatedMonthly: number;
  estimatedRange: { min: number; max: number };
  difficulty: "facil" | "moderado" | "avanzado";
  timeToStart: string;
  requirements: string[];
  steps: string[];
  platforms?: string[];
  pros: string[];
  cons: string[];
}

/** Diagnóstico financiero */
export interface FinancialDiagnosis {
  urgency: FinancialUrgency;
  urgencyScore: number; // 0-100
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyDeficit: number;
  savingsRate: number;
  balanceTrend: "creciente" | "estable" | "decreciente" | "critico";
  deficitMonths: number; // meses consecutivos con déficit
  needsExtraIncome: boolean;
  extraIncomeNeeded: number;
  extraIncomeWithSafety: number; // con margen de seguridad del 20%
}

/** Plan de ingreso extra generado por IA */
export interface ExtraIncomePlan {
  diagnosis: FinancialDiagnosis;
  topSuggestions: IncomeSuggestion[];
  actionPlan: ActionStep[];
  stabilizationTimeline: number; // meses para estabilizar
  totalPotentialIncome: number;
  summary: string;
}

/** Paso del plan de acción */
export interface ActionStep {
  week: number;
  action: string;
  expectedIncome: number;
  cumulativeIncome: number;
  milestone: string;
}

// ---- Lógica principal ----

/**
 * Calcula promedios mensuales de ingresos y gastos.
 */
function calculateMonthlyAverages(transactions: Transaction[]) {
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

  // Contar meses consecutivos con déficit
  const sortedMonths = Array.from(months).sort();
  let consecutiveDeficit = 0;
  let maxConsecutiveDeficit = 0;

  for (const month of sortedMonths) {
    const income = incomeByMonth[month] || 0;
    const expense = expenseByMonth[month] || 0;
    if (expense > income) {
      consecutiveDeficit++;
      maxConsecutiveDeficit = Math.max(maxConsecutiveDeficit, consecutiveDeficit);
    } else {
      consecutiveDeficit = 0;
    }
  }

  // Tendencia del balance (comparar últimos 3 meses vs anteriores)
  const recentMonths = sortedMonths.slice(-3);
  const olderMonths = sortedMonths.slice(-6, -3);

  let recentAvgBalance = 0;
  let olderAvgBalance = 0;

  for (const m of recentMonths) {
    recentAvgBalance += (incomeByMonth[m] || 0) - (expenseByMonth[m] || 0);
  }
  recentAvgBalance /= Math.max(recentMonths.length, 1);

  for (const m of olderMonths) {
    olderAvgBalance += (incomeByMonth[m] || 0) - (expenseByMonth[m] || 0);
  }
  olderAvgBalance /= Math.max(olderMonths.length, 1);

  let balanceTrend: FinancialDiagnosis["balanceTrend"];
  if (recentAvgBalance > 50) balanceTrend = "creciente";
  else if (recentAvgBalance > -50) balanceTrend = "estable";
  else if (recentAvgBalance > -300) balanceTrend = "decreciente";
  else balanceTrend = "critico";

  return {
    monthlyIncome: Math.round(totalIncome / monthCount),
    monthlyExpenses: Math.round(totalExpenses / monthCount),
    monthlyDeficit: Math.round((totalExpenses - totalIncome) / monthCount),
    savingsRate: totalIncome > 0 ? (totalIncome - totalExpenses) / totalIncome : -1,
    deficitMonths: maxConsecutiveDeficit,
    balanceTrend,
  };
}

/**
 * Realiza el diagnóstico financiero completo.
 */
function diagnoseFinancials(transactions: Transaction[]): FinancialDiagnosis {
  const avg = calculateMonthlyAverages(transactions);
  const totalBalance = calculateTotalBalance(transactions);

  // Calcular score de urgencia (0-100)
  let urgencyScore = 0;

  // Factor 1: Tasa de ahorro (0-35 puntos)
  if (avg.savingsRate < -0.2) urgencyScore += 35;
  else if (avg.savingsRate < -0.05) urgencyScore += 25;
  else if (avg.savingsRate < 0.05) urgencyScore += 15;
  else if (avg.savingsRate < 0.15) urgencyScore += 5;

  // Factor 2: Déficit mensual (0-25 puntos)
  if (avg.monthlyDeficit > 500) urgencyScore += 25;
  else if (avg.monthlyDeficit > 200) urgencyScore += 18;
  else if (avg.monthlyDeficit > 0) urgencyScore += 10;

  // Factor 3: Meses consecutivos con déficit (0-20 puntos)
  if (avg.deficitMonths >= 4) urgencyScore += 20;
  else if (avg.deficitMonths >= 3) urgencyScore += 15;
  else if (avg.deficitMonths >= 2) urgencyScore += 10;

  // Factor 4: Tendencia del balance (0-20 puntos)
  if (avg.balanceTrend === "critico") urgencyScore += 20;
  else if (avg.balanceTrend === "decreciente") urgencyScore += 15;
  else if (avg.balanceTrend === "estable") urgencyScore += 5;

  // Factor 5: Balance total negativo (bonus)
  if (totalBalance < 0) urgencyScore += 10;
  urgencyScore = Math.min(urgencyScore, 100);

  // Determinar nivel de urgencia
  let urgency: FinancialUrgency;
  if (urgencyScore >= 70) urgency = "critica";
  else if (urgencyScore >= 45) urgency = "urgente";
  else if (urgencyScore >= 25) urgency = "preocupante";
  else urgency = "estable";

  // Calcular ingreso extra necesario
  const extraIncomeNeeded = avg.monthlyDeficit > 0 ? avg.monthlyDeficit : 0;
  const extraIncomeWithSafety = Math.round(extraIncomeNeeded * 1.2);

  const needsExtraIncome = urgency !== "estable" && avg.savingsRate < 0.1;

  return {
    urgency,
    urgencyScore,
    monthlyIncome: avg.monthlyIncome,
    monthlyExpenses: avg.monthlyExpenses,
    monthlyDeficit: avg.monthlyDeficit,
    savingsRate: avg.savingsRate,
    balanceTrend: avg.balanceTrend,
    deficitMonths: avg.deficitMonths,
    needsExtraIncome,
    extraIncomeNeeded,
    extraIncomeWithSafety,
  };
}

/**
 * Genera sugerencias de ingreso extra personalizadas.
 * Basado en el monto necesario y la situación del usuario.
 */
function generateIncomeSuggestions(
  diagnosis: FinancialDiagnosis,
  transactions: Transaction[]
): IncomeSuggestion[] {
  const needed = diagnosis.extraIncomeWithSafety;
  const suggestions: IncomeSuggestion[] = [];

  // Analizar categorías de gasto para entender el perfil del usuario
  const expenseCategories: Record<string, number> = {};
  for (const t of transactions) {
    if (t.type === "gasto") {
      if (!expenseCategories[t.category]) expenseCategories[t.category] = 0;
      expenseCategories[t.category] += t.amount;
    }
  }

  // 1. Freelance - Siempre relevante
  suggestions.push({
    category: "freelance",
    title: "Trabajo Freelance",
    description:
      "Ofrece tus habilidades profesionales de forma independiente. Diseño, programación, redacción, traducción, contabilidad, consultoría... El mercado freelance en España crece un 20% anual y hay demanda en casi todos los sectores.",
    estimatedMonthly: Math.min(Math.max(needed, 300), 1500),
    estimatedRange: { min: 200, max: 2000 },
    difficulty: "moderado",
    timeToStart: "1-2 semanas",
    requirements: [
      "Habilidad profesional demostrable",
      "Perfil en al menos una plataforma freelance",
      "Disponibilidad de 10-20h/semana",
    ],
    steps: [
      "Identifica tus 2-3 habilidades más fuertes y comercializables",
      "Crea perfiles en Upwork, Fiverr y/o Workana",
      "Prepara un portfolio con 3-5 ejemplos de tu trabajo",
      "Empieza con proyectos pequeños para ganar reputación",
      "Aumenta tus tarifas progresivamente con buenas reseñas",
    ],
    platforms: ["Upwork.com", "Fiverr.com", "Workana.com", "Freelancer.es", "Nubelo.com"],
    pros: ["Ingresos ilimitados según habilidad", "Flexibilidad horaria", "Puedes trabajar desde casa"],
    cons: ["Ingresos variables al principio", "Competencia alta", "Necesitas construir reputación"],
  });

  // 2. Venta de artículos usados - Rápido y fácil
  suggestions.push({
    category: "venta_articulos",
    title: "Venta de Artículos Usados",
    description:
      "Vende cosas que ya no necesitas. Ropa, electrónica, muebles, libros, videojuegos... La mayoría de la gente tiene en casa artículos por valor de 500-2.000€ que no usa. Es la forma más rápida de generar liquidez inmediata.",
    estimatedMonthly: Math.min(Math.max(Math.round(needed * 0.5), 100), 800),
    estimatedRange: { min: 50, max: 1000 },
    difficulty: "facil",
    timeToStart: "1-3 días",
    requirements: [
      "Artículos en buen estado que no uses",
      "Cámara del móvil para fotos",
      "Cuenta bancaria para recibir pagos",
    ],
    steps: [
      "Haz un inventario de cosas que no hayas usado en los últimos 6 meses",
      "Limpia y prepara los artículos, haz buenas fotos con luz natural",
      "Publica en Wallapop y Vinted con descripciones honestas y precio competitivo",
      "Responde rápido a los mensajes y negocia con margen",
      "Reinvierte el tiempo en buscar más artículos por tu casa",
    ],
    platforms: ["Wallapop.es", "Vinted.es", "Milanuncios.com", "Facebook Marketplace"],
    pros: ["Dinero rápido", "Sin inversión", "Liberas espacio en casa"],
    cons: ["Fuente de ingreso temporal", "Necesitas artículos que vender", "Precios bajos en algunos artículos"],
  });

  // 3. Clases particulares - Si tiene formación
  const hasEducationExpense = (expenseCategories["educacion"] || 0) > 0;
  suggestions.push({
    category: "clases_particulares",
    title: "Clases Particulares y Tutoría",
    description:
      "Enseña lo que sabes. Matemáticas, inglés, programación, música, idiomas... El mercado de clases particulares en España mueve más de 1.000M€ al año. Las tarifas oscilan entre 15-40€/hora dependiendo de la materia y el nivel.",
    estimatedMonthly: Math.min(Math.max(Math.round(needed * 0.7), 200), 900),
    estimatedRange: { min: 150, max: 1200 },
    difficulty: "moderado",
    timeToStart: "1 semana",
    requirements: [
      "Conocimiento sólido en una materia",
      "Paciencia y capacidad de explicación",
      "Disponibilidad de 6-12h/semana",
    ],
    steps: [
      "Decide qué materia(s) puedes enseñar y a qué nivel",
      "Crea un perfil en TusClasesParticulares y Superprof",
      "Define tu tarifa (investiga el mercado: 15-25€/hora es normal)",
      "Prepara material didáctico básico para la primera clase",
      "Ofrece una clase de prueba gratuita para captar alumnos",
    ],
    platforms: ["Superprof.es", "TusClasesParticulares.es", "GoStudent.com", "Classgap.com"],
    pros: ["Tarifa horaria alta", "Horarios flexibles", "Trabajo gratificante"],
    cons: ["Requiere preparación de material", "Dependencia de alumnos", "Competencia en materias comunes"],
  });

  // 4. Horas extra - Si es asalariado
  const hasSalaryIncome = transactions.some((t) => t.category === "salario" && t.type === "ingreso");
  if (hasSalaryIncome) {
    suggestions.push({
      category: "horas_extra",
      title: "Horas Extra y Turnos Adicionales",
      description:
        "Si eres asalariado, las horas extra son la forma más directa de aumentar ingresos. En España, las horas extra se pagan con un recargo del 75% sobre la hora ordinaria (o más según convenio). Habla con tu empresa sobre disponibilidad.",
      estimatedMonthly: Math.min(Math.max(Math.round(needed * 0.6), 150), 600),
      estimatedRange: { min: 100, max: 800 },
      difficulty: "facil",
      timeToStart: "Inmediato (si tu empresa lo permite)",
      requirements: [
        "Trabajo asalariado con posibilidad de horas extra",
        "Acuerdo del empleador",
        "Disponibilidad física y mental",
      ],
      steps: [
        "Consulta tu convenio colectivo sobre horas extra y su compensación",
        "Habla con tu responsable sobre la posibilidad de hacer horas extra",
        "Negocia turnos adicionales o fines de semana si es posible",
        "Lleva un registro exacto de las horas para cobrarlas correctamente",
        "Establece un límite para no quemarte (máximo 10h extra/semana)",
      ],
      pros: ["No necesitas buscar clientes", "Cobro garantizado", "Recargo legal sobre hora normal"],
      cons: ["Agotamiento físico y mental", "No todas las empresas lo permiten", "Límite legal de 80h/año"],
    });
  }

  // 5. Micro-trabajos y tareas puntuales
  suggestions.push({
    category: "micro_trabajos",
    title: "Micro-Trabajos y Tareas Puntuales",
    description:
      "Realiza pequeñas tareas por dinero: montar muebles, hacer recados, limpiezas puntuales, ayuda con mudanzas, cuidado de mascotas... No requieren formación especial y la demanda es constante, especialmente en ciudades grandes.",
    estimatedMonthly: Math.min(Math.max(Math.round(needed * 0.4), 100), 500),
    estimatedRange: { min: 80, max: 600 },
    difficulty: "facil",
    timeToStart: "1-2 días",
    requirements: [
      "Disponibilidad flexible",
      "Movilidad (vehículo propio o transporte público)",
      "Ganas de trabajar",
    ],
    steps: [
      "Regístrate en TaskRabbit y/o Zolver con tu perfil completo",
      "Destaca tus habilidades prácticas (montaje, limpieza, repairs)",
      "Acepta los primeros trabajos rápidamente para ganar valoración",
      "Sé puntual, amable y eficiente en cada tarea",
      "Pide reseñas positivas para subir en el ranking de la plataforma",
    ],
    platforms: ["TaskRabbit.es", "Zolver.com", "ClicIdeas", "Wallapop (sección servicios)"],
    pros: ["Entrada rápida", "Sin formación requerida", "Flexibilidad total"],
    cons: ["Ingresos bajos por hora", "Competencia por precio", "Ingresos irregulares"],
  });

  // 6. Monetización de habilidad - Creativo
  suggestions.push({
    category: "monetizacion_habilidad",
    title: "Monetiza tu Habilidad o Pasión",
    description:
      "Convierte lo que te apasiona en ingresos. Fotografía, repostería, manualidades, diseño gráfico, escritura, música... Si eres bueno en algo, hay alguien dispuesto a pagarlo. Las redes sociales y los marketplaces hacen más fácil que nunca llegar a clientes.",
    estimatedMonthly: Math.min(Math.max(Math.round(needed * 0.5), 100), 800),
    estimatedRange: { min: 50, max: 1500 },
    difficulty: "avanzado",
    timeToStart: "2-4 semanas",
    requirements: [
      "Habilidad o pasión comercializable",
      "Redes sociales o portfolio online",
      "Paciencia para construir audiencia",
    ],
    steps: [
      "Identifica qué haces bien y que la gente pediría: fotos, tartas, dibujos, etc.",
      "Crea una cuenta de Instagram o TikTok mostrando tu trabajo",
      "Vende a través de Etsy (manualidades) o tu propia web",
      "Empieza con encargos de amigos y conocidos",
      "Escala con contenido en redes y boca a boca",
    ],
    platforms: ["Etsy.com", "Instagram", "TikTok Shop", "Patreon.com"],
    pros: ["Haces lo que te gusta", "Potencial de crecimiento ilimitado", "Flexibilidad creativa"],
    cons: ["Lento al principio", "Requiere inversión de tiempo", "Competencia alta en marketplaces"],
  });

  // 7. Reventa (compra-venta) - Si necesita ingresos más altos
  if (needed >= 300) {
    suggestions.push({
      category: "reventa",
      title: "Compra y Reventa (Flipping)",
      description:
        "Compra artículos infravalorados y véndelos a precio de mercado. Ropa vintage, electrónica, muebles restaurados, libros... Mucha gente hace 300-800€/mes con esta técnica. La clave es saber identificar gangas y tener ojo para el valor.",
      estimatedMonthly: Math.min(Math.max(Math.round(needed * 0.6), 200), 800),
      estimatedRange: { min: 100, max: 1200 },
      difficulty: "avanzado",
      timeToStart: "1-2 semanas",
      requirements: [
        "Pequeño capital inicial (50-200€)",
        "Ojo para detectar oportunidades",
        "Conocimiento de algún mercado (ropa, electrónica, muebles)",
      ],
      steps: [
        "Elige un nicho que conozcas (ropa vintage, electrónica, vinilos, muebles...)",
        "Busca gangas en mercadillos, tiendas de segunda mano y Wallapop",
        "Compra barato y restaura/limpia/mejora si es necesario",
        "Vende con buenas fotos y descripciones profesionales",
        "Reinvierte los beneficios gradualmente",
      ],
      platforms: ["Wallapop.es", "Vinted.es", "Mercadillos locales", "Tiendas de segunda mano"],
      pros: ["Margen de beneficio alto", "Escalable con experiencia", "Puede ser divertido"],
      cons: ["Requiere capital inicial", "Riesgo de quedarte con stock", "Necesita conocimiento del mercado"],
    });
  }

  // 8. Delivery y transporte - Rápido y flexible
  suggestions.push({
    category: "delivery_transport",
    title: "Reparto y Transporte",
    description:
      "Trabaja repartiendo comida, paquetes o haciendo viajes como conductor. Glovo, UberEats, Deliveroo, Amazon Flex... Puedes empezar en un día y elegir tus horarios. En ciudades grandes es fácil hacer 300-600€/mes trabajando fines de semana.",
    estimatedMonthly: Math.min(Math.max(Math.round(needed * 0.5), 200), 700),
    estimatedRange: { min: 150, max: 900 },
    difficulty: "facil",
    timeToStart: "1-3 días",
    requirements: [
      "Vehículo (bicicleta, moto o coche)",
      "Smartphone con datos",
      "Permiso de conducir (si usas moto/coche)",
    ],
    steps: [
      "Elige la plataforma que mejor encaje: Glovo (flexible), UberEats (mejor pago), Amazon Flex (paquetes)",
      "Regístrate y completa el proceso de verificación (1-3 días)",
      "Empieza con turnos de 3-4 horas en horas punta (comidas y cenas)",
      "Aprende las zonas con más pedidos y optimiza tus rutas",
      "Trabaja fines de semana y días de lluvia (más demanda = más ganancias)",
    ],
    platforms: ["Glovo.com", "UberEats.com", "Deliveroo.es", "Amazon Flex"],
    pros: ["Inicio inmediato", "Horario 100% flexible", "Sin jefe directo"],
    cons: ["Desgaste físico", "Dependencia del clima y demanda", "Gastos de vehículo"],
  });

  // 9. Encuestas online y micro-tareas - Complemento
  suggestions.push({
    category: "encuestas_online",
    title: "Encuestas Online y Micro-Tareas Digitales",
    description:
      "Completa encuestas, prueba apps, realiza micro-tareas... No te harás rico, pero puedes sumar 50-150€/mes sin salir de casa. Ideal como complemento a otras fuentes de ingreso. Se hace desde el móvil en ratos muertos.",
    estimatedMonthly: Math.min(Math.max(50, Math.round(needed * 0.15)), 200),
    estimatedRange: { min: 30, max: 200 },
    difficulty: "facil",
    timeToStart: "Inmediato",
    requirements: [
      "Smartphone o PC con conexión a internet",
      "Cuenta de PayPal o transferencia bancaria",
      "15-30 minutos diarios",
    ],
    steps: [
      "Regístrate en 3-4 plataformas de encuestas (las que mejor pagan)",
      "Completa tu perfil en cada una para recibir más encuestas",
      "Dedica 15-20 minutos diarios a completar las disponibles",
      "Aprovecha ratos muertos: transporte, espera, antes de dormir",
      "Combina con micro-tareas en Amazon Mechanical Turk",
    ],
    platforms: ["Swagbucks.com", "ySense.com", "Toluna.com", "Amazon Mechanical Turk"],
    pros: ["Cero inversión", "Sin horarios", "Se hace desde el sofá"],
    cons: ["Ingresos muy bajos", "Puede ser tedioso", "No suficiente como única fuente"],
  });

  // 10. Alquiler de espacio - Si tiene algo que alquilar
  suggestions.push({
    category: "alquiler_espacio",
    title: "Alquila tu Espacio o Tus Cosas",
    description:
      "Alquila una habitación, plaza de garaje, trastero, o incluso tus herramientas y equipamiento. Si tienes algo que otros necesitan y tú no usas siempre, es dinero pasivo. Una habitación en Airbnb puede generar 300-600€/mes en ciudades turísticas.",
    estimatedMonthly: Math.min(Math.max(Math.round(needed * 0.5), 100), 700),
    estimatedRange: { min: 50, max: 800 },
    difficulty: "moderado",
    timeToStart: "1-2 semanas",
    requirements: [
      "Espacio o artículos disponibles para alquilar",
      "Disposición a compartir o ceder temporalmente",
      "Seguro adecuado (especialmente para alojamiento)",
    ],
    steps: [
      "Inventa lo que puedes alquilar: habitación, garaje, trastero, herramientas, bicicleta...",
      "Si es habitación: publica en Airbnb y/o Badi (compañeros de piso)",
      "Si es garaje/trastero: publica en Wallapop y Parclick",
      "Si son cosas: usa plataformas como Fluid Market o Swimxy",
      "Toma fotos profesionales y sé un buen anfitrión para conseguir buenas reseñas",
    ],
    platforms: ["Airbnb.es", "Badi.com", "Parclick.com", "Wallapop.es"],
    pros: ["Ingreso semi-pasivo", "Alta demanda en ciudades", "Aprovecha recursos que ya tienes"],
    cons: ["Comparte tu espacio personal", "Requiere mantenimiento", "Posibles problemas con vecinos/seguros"],
  });

  // Filtrar y ordenar: priorizar las que mejor cubren la necesidad
  return suggestions
    .sort((a, b) => {
      // Priorizar por combinación de: estimación cercana a lo necesario + facilidad
      const aScore = a.estimatedMonthly * (a.difficulty === "facil" ? 1.5 : a.difficulty === "moderado" ? 1 : 0.7);
      const bScore = b.estimatedMonthly * (b.difficulty === "facil" ? 1.5 : b.difficulty === "moderado" ? 1 : 0.7);
      return bScore - aScore;
    });
}

/**
 * Genera el plan de acción paso a paso.
 */
function generateActionPlan(
  diagnosis: FinancialDiagnosis,
  suggestions: IncomeSuggestion[]
): ActionStep[] {
  const steps: ActionStep[] = [];
  const weeklyTarget = Math.round(diagnosis.extraIncomeWithSafety / 4.33);
  let cumulative = 0;

  // Semana 1: Acciones inmediatas y fáciles
  const week1Income = Math.round(weeklyTarget * 0.3);
  cumulative += week1Income;
  steps.push({
    week: 1,
    action:
      "Empieza con lo más rápido: venta de artículos usados + registro en plataformas de encuestas y micro-trabajos. Publica al menos 10 artículos en Wallapop/Vinted.",
    expectedIncome: week1Income,
    cumulativeIncome: cumulative,
    milestone: "Primeros ingresos generados",
  });

  // Semana 2: Freelance y clases
  const week2Income = Math.round(weeklyTarget * 0.5);
  cumulative += week2Income;
  steps.push({
    week: 2,
    action:
      "Crea perfiles freelance y de clases particulares. Prepara portfolio y ofrécte en 5-10 proyectos. Si tienes trabajo asalariado, negocia horas extra.",
    expectedIncome: week2Income,
    cumulativeIncome: cumulative,
    milestone: "Fuentes de ingreso activas",
  });

  // Semana 3: Escalar
  const week3Income = Math.round(weeklyTarget * 0.8);
  cumulative += week3Income;
  steps.push({
    week: 3,
    action:
      "Aumenta tu actividad en las fuentes que funcionen mejor. Acepta más trabajos freelance, más horas de clases. Explora reventa si necesitas más ingresos.",
    expectedIncome: week3Income,
    cumulativeIncome: cumulative,
    milestone: "Ingresos creciendo",
  });

  // Semana 4: Consolidar
  const week4Income = Math.round(weeklyTarget * 1.0);
  cumulative += week4Income;
  steps.push({
    week: 4,
    action:
      "Consolida tus mejores fuentes de ingreso. Deja las que no funcionen y enfócate en las más rentables. Empieza a pagar deudas o a ahorrar el exceso.",
    expectedIncome: week4Income,
    cumulativeIncome: cumulative,
    milestone: "Ingreso extra consolidado",
  });

  return steps;
}

/**
 * ============================================================
 * FUNCIÓN PRINCIPAL: Generador de Plan de Ingreso Extra
 * ============================================================
 *
 * Analiza las finanzas del usuario y, si la situación es mala,
 * genera un plan completo con sugerencias de ingreso extra.
 */
export function generateExtraIncomePlan(
  transactions: Transaction[]
): ExtraIncomePlan {
  // ---- 1. Diagnóstico ----
  const diagnosis = diagnoseFinancials(transactions);

  // ---- 2. Sugerencias de ingreso ----
  const allSuggestions = generateIncomeSuggestions(diagnosis, transactions);

  // Seleccionar las mejores sugerencias (las que suman el ingreso necesario)
  const topSuggestions: IncomeSuggestion[] = [];
  let coveredAmount = 0;
  const target = diagnosis.extraIncomeWithSafety;

  for (const suggestion of allSuggestions) {
    topSuggestions.push(suggestion);
    coveredAmount += suggestion.estimatedMonthly;
    if (coveredAmount >= target && topSuggestions.length >= 3) break;
  }

  // ---- 3. Plan de acción ----
  const actionPlan = generateActionPlan(diagnosis, topSuggestions);

  // ---- 4. Timeline de estabilización ----
  const monthlyRecovery = diagnosis.extraIncomeNeeded > 0
    ? diagnosis.extraIncomeWithSafety
    : 100;
  const totalDebt = Math.abs(Math.min(calculateTotalBalance(transactions), 0));
  const stabilizationTimeline = totalDebt > 0
    ? Math.ceil(totalDebt / monthlyRecovery)
    : 1;

  // ---- 5. Ingreso total potencial ----
  const totalPotentialIncome = topSuggestions.reduce(
    (sum, s) => sum + s.estimatedMonthly,
    0
  );

  // ---- 6. Resumen ----
  const urgencyLabels: Record<FinancialUrgency, { emoji: string; label: string }> = {
    estable: { emoji: "🟢", label: "Estable" },
    preocupante: { emoji: "🟡", label: "Preocupante" },
    urgente: { emoji: "🟠", label: "Urgente" },
    critica: { emoji: "🔴", label: "Crítica" },
  };

  const { emoji, label } = urgencyLabels[diagnosis.urgency];

  const summaryLines = [
    `${emoji} **Situación Financiera: ${label}** (Score: ${diagnosis.urgencyScore}/100)`,
    ``,
    `📊 **Análisis:**`,
    `• Ingreso mensual promedio: ${diagnosis.monthlyIncome.toLocaleString("es-ES")}€`,
    `• Gasto mensual promedio: ${diagnosis.monthlyExpenses.toLocaleString("es-ES")}€`,
    `• Déficit mensual: ${diagnosis.monthlyDeficit > 0 ? diagnosis.monthlyDeficit.toLocaleString("es-ES") : "0"}€`,
    `• Tasa de ahorro: ${Math.round(diagnosis.savingsRate * 100)}%`,
    `• Tendencia: ${diagnosis.balanceTrend}`,
    diagnosis.deficitMonths > 0
      ? `• Meses consecutivos con déficit: ${diagnosis.deficitMonths}`
      : "",
    ``,
  ];

  if (diagnosis.needsExtraIncome) {
    summaryLines.push(
      `💰 **Necesitas generar al menos ${diagnosis.extraIncomeNeeded.toLocaleString("es-ES")}€ extra/mes**`,
      `📌 Con margen de seguridad: **${diagnosis.extraIncomeWithSafety.toLocaleString("es-ES")}€/mes**`,
      ``,
      `💡 Con las sugerencias propuestas podrías generar hasta **${totalPotentialIncome.toLocaleString("es-ES")}€/mes**`,
      `📅 Tiempo estimado para estabilizar: **${stabilizationTimeline} meses**`,
    );
  } else {
    summaryLines.push(
      `✅ Tu situación financiera es estable. No necesitas ingresos extra en este momento.`,
      `Sigue ahorrando y mantén el control de tus gastos.`,
    );
  }

  const summary = summaryLines.filter(Boolean).join("\n");

  return {
    diagnosis,
    topSuggestions,
    actionPlan,
    stabilizationTimeline,
    totalPotentialIncome,
    summary,
  };
}
