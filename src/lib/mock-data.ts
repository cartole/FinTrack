/**
 * ============================================
 * Datos Simulados - Finanzas Personales MVP
 * ============================================
 * Dataset realista para desarrollo y demostración.
 * Incluye 6 meses de historial de transacciones.
 */

import { Transaction, SavingsGoal, Budget, Debt, Subscription } from "./types";

/** Genera un ID único simple */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/** Crea una fecha formateada ISO a partir de año, mes y día */
function createDate(year: number, month: number, day: number): string {
  return new Date(year, month - 1, day).toISOString();
}

// ---- Datos de 2025 (histórico) ----

const historicalTransactions2025: Transaction[] = [
  // Diciembre 2025
  { id: generateId(), amount: 3200, category: "salario", type: "ingreso", recurrence: "recurrente", description: "Salario mensual diciembre", date: createDate(2025, 12, 1), createdAt: createDate(2025, 12, 1) },
  { id: generateId(), amount: 850, category: "alquiler", type: "gasto", recurrence: "recurrente", description: "Alquiler piso diciembre", date: createDate(2025, 12, 1), createdAt: createDate(2025, 12, 1) },
  { id: generateId(), amount: 320, category: "comida", type: "gasto", recurrence: "recurrente", description: "Supermercado semanal", date: createDate(2025, 12, 5), createdAt: createDate(2025, 12, 5) },
  { id: generateId(), amount: 65, category: "transporte", type: "gasto", recurrence: "recurrente", description: "Abono transporte", date: createDate(2025, 12, 3), createdAt: createDate(2025, 12, 3) },
  { id: generateId(), amount: 120, category: "ocio", type: "gasto", recurrence: "puntual", description: "Cena con amigos", date: createDate(2025, 12, 14), createdAt: createDate(2025, 12, 14) },
  { id: generateId(), amount: 45, category: "suscripciones", type: "gasto", recurrence: "recurrente", description: "Netflix + Spotify", date: createDate(2025, 12, 10), createdAt: createDate(2025, 12, 10) },
  { id: generateId(), amount: 180, category: "ropa", type: "gasto", recurrence: "puntual", description: "Abrigo de invierno", date: createDate(2025, 12, 20), createdAt: createDate(2025, 12, 20) },
  { id: generateId(), amount: 500, category: "freelance", type: "ingreso", recurrence: "puntual", description: "Proyecto web freelance", date: createDate(2025, 12, 15), createdAt: createDate(2025, 12, 15) },
  { id: generateId(), amount: 90, category: "salud", type: "gasto", recurrence: "puntual", description: "Consulta médica", date: createDate(2025, 12, 8), createdAt: createDate(2025, 12, 8) },

  // Noviembre 2025
  { id: generateId(), amount: 3200, category: "salario", type: "ingreso", recurrence: "recurrente", description: "Salario mensual noviembre", date: createDate(2025, 11, 1), createdAt: createDate(2025, 11, 1) },
  { id: generateId(), amount: 850, category: "alquiler", type: "gasto", recurrence: "recurrente", description: "Alquiler piso noviembre", date: createDate(2025, 11, 1), createdAt: createDate(2025, 11, 1) },
  { id: generateId(), amount: 290, category: "comida", type: "gasto", recurrence: "recurrente", description: "Supermercado semanal", date: createDate(2025, 11, 5), createdAt: createDate(2025, 11, 5) },
  { id: generateId(), amount: 65, category: "transporte", type: "gasto", recurrence: "recurrente", description: "Abono transporte", date: createDate(2025, 11, 3), createdAt: createDate(2025, 11, 3) },
  { id: generateId(), amount: 200, category: "ocio", type: "gasto", recurrence: "puntual", description: "Concierto + cena", date: createDate(2025, 11, 16), createdAt: createDate(2025, 11, 16) },
  { id: generateId(), amount: 45, category: "suscripciones", type: "gasto", recurrence: "recurrente", description: "Netflix + Spotify", date: createDate(2025, 11, 10), createdAt: createDate(2025, 11, 10) },
  { id: generateId(), amount: 150, category: "educacion", type: "gasto", recurrence: "puntual", description: "Curso online React", date: createDate(2025, 11, 12), createdAt: createDate(2025, 11, 12) },
  { id: generateId(), amount: 300, category: "freelance", type: "ingreso", recurrence: "puntual", description: "Diseño logo cliente", date: createDate(2025, 11, 20), createdAt: createDate(2025, 11, 20) },

  // Octubre 2025
  { id: generateId(), amount: 3200, category: "salario", type: "ingreso", recurrence: "recurrente", description: "Salario mensual octubre", date: createDate(2025, 10, 1), createdAt: createDate(2025, 10, 1) },
  { id: generateId(), amount: 850, category: "alquiler", type: "gasto", recurrence: "recurrente", description: "Alquiler piso octubre", date: createDate(2025, 10, 1), createdAt: createDate(2025, 10, 1) },
  { id: generateId(), amount: 310, category: "comida", type: "gasto", recurrence: "recurrente", description: "Supermercado semanal", date: createDate(2025, 10, 5), createdAt: createDate(2025, 10, 5) },
  { id: generateId(), amount: 65, category: "transporte", type: "gasto", recurrence: "recurrente", description: "Abono transporte", date: createDate(2025, 10, 3), createdAt: createDate(2025, 10, 3) },
  { id: generateId(), amount: 75, category: "ocio", type: "gasto", recurrence: "puntual", description: "Cine y palomitas", date: createDate(2025, 10, 18), createdAt: createDate(2025, 10, 18) },
  { id: generateId(), amount: 45, category: "suscripciones", type: "gasto", recurrence: "recurrente", description: "Netflix + Spotify", date: createDate(2025, 10, 10), createdAt: createDate(2025, 10, 10) },
  { id: generateId(), amount: 220, category: "salud", type: "gasto", recurrence: "puntual", description: "Gafas nuevas", date: createDate(2025, 10, 22), createdAt: createDate(2025, 10, 22) },

  // Septiembre 2025
  { id: generateId(), amount: 3200, category: "salario", type: "ingreso", recurrence: "recurrente", description: "Salario mensual septiembre", date: createDate(2025, 9, 1), createdAt: createDate(2025, 9, 1) },
  { id: generateId(), amount: 850, category: "alquiler", type: "gasto", recurrence: "recurrente", description: "Alquiler piso septiembre", date: createDate(2025, 9, 1), createdAt: createDate(2025, 9, 1) },
  { id: generateId(), amount: 340, category: "comida", type: "gasto", recurrence: "recurrente", description: "Supermercado semanal", date: createDate(2025, 9, 5), createdAt: createDate(2025, 9, 5) },
  { id: generateId(), amount: 65, category: "transporte", type: "gasto", recurrence: "recurrente", description: "Abono transporte", date: createDate(2025, 9, 3), createdAt: createDate(2025, 9, 3) },
  { id: generateId(), amount: 350, category: "ropa", type: "gasto", recurrence: "puntual", description: "Ropa temporada otoño", date: createDate(2025, 9, 15), createdAt: createDate(2025, 9, 15) },
  { id: generateId(), amount: 45, category: "suscripciones", type: "gasto", recurrence: "recurrente", description: "Netflix + Spotify", date: createDate(2025, 9, 10), createdAt: createDate(2025, 9, 10) },
  { id: generateId(), amount: 600, category: "freelance", type: "ingreso", recurrence: "puntual", description: "App móvil cliente", date: createDate(2025, 9, 25), createdAt: createDate(2025, 9, 25) },

  // Agosto 2025
  { id: generateId(), amount: 3200, category: "salario", type: "ingreso", recurrence: "recurrente", description: "Salario mensual agosto", date: createDate(2025, 8, 1), createdAt: createDate(2025, 8, 1) },
  { id: generateId(), amount: 850, category: "alquiler", type: "gasto", recurrence: "recurrente", description: "Alquiler piso agosto", date: createDate(2025, 8, 1), createdAt: createDate(2025, 8, 1) },
  { id: generateId(), amount: 280, category: "comida", type: "gasto", recurrence: "recurrente", description: "Supermercado semanal", date: createDate(2025, 8, 5), createdAt: createDate(2025, 8, 5) },
  { id: generateId(), amount: 65, category: "transporte", type: "gasto", recurrence: "recurrente", description: "Abono transporte", date: createDate(2025, 8, 3), createdAt: createDate(2025, 8, 3) },
  { id: generateId(), amount: 450, category: "ocio", type: "gasto", recurrence: "puntual", description: "Vacaciones playa", date: createDate(2025, 8, 12), createdAt: createDate(2025, 8, 12) },
  { id: generateId(), amount: 45, category: "suscripciones", type: "gasto", recurrence: "recurrente", description: "Netflix + Spotify", date: createDate(2025, 8, 10), createdAt: createDate(2025, 8, 10) },
  { id: generateId(), amount: 200, category: "salud", type: "gasto", recurrence: "puntual", description: "Revisión dental", date: createDate(2025, 8, 20), createdAt: createDate(2025, 8, 20) },

  // Julio 2025
  { id: generateId(), amount: 3200, category: "salario", type: "ingreso", recurrence: "recurrente", description: "Salario mensual julio", date: createDate(2025, 7, 1), createdAt: createDate(2025, 7, 1) },
  { id: generateId(), amount: 850, category: "alquiler", type: "gasto", recurrence: "recurrente", description: "Alquiler piso julio", date: createDate(2025, 7, 1), createdAt: createDate(2025, 7, 1) },
  { id: generateId(), amount: 300, category: "comida", type: "gasto", recurrence: "recurrente", description: "Supermercado semanal", date: createDate(2025, 7, 5), createdAt: createDate(2025, 7, 5) },
  { id: generateId(), amount: 65, category: "transporte", type: "gasto", recurrence: "recurrente", description: "Abono transporte", date: createDate(2025, 7, 3), createdAt: createDate(2025, 7, 3) },
  { id: generateId(), amount: 180, category: "ocio", type: "gasto", recurrence: "puntual", description: "Festival música", date: createDate(2025, 7, 14), createdAt: createDate(2025, 7, 14) },
  { id: generateId(), amount: 45, category: "suscripciones", type: "gasto", recurrence: "recurrente", description: "Netflix + Spotify", date: createDate(2025, 7, 10), createdAt: createDate(2025, 7, 10) },
  { id: generateId(), amount: 120, category: "educacion", type: "gasto", recurrence: "puntual", description: "Libros programación", date: createDate(2025, 7, 18), createdAt: createDate(2025, 7, 18) },
];

// ---- Datos de 2026 (mes actual: mayo) ----

const currentYearTransactions: Transaction[] = [
  // Enero 2026
  { id: generateId(), amount: 3300, category: "salario", type: "ingreso", recurrence: "recurrente", description: "Salario mensual enero", date: createDate(2026, 1, 1), createdAt: createDate(2026, 1, 1) },
  { id: generateId(), amount: 850, category: "alquiler", type: "gasto", recurrence: "recurrente", description: "Alquiler piso enero", date: createDate(2026, 1, 1), createdAt: createDate(2026, 1, 1) },
  { id: generateId(), amount: 310, category: "comida", type: "gasto", recurrence: "recurrente", description: "Supermercado semanal", date: createDate(2026, 1, 6), createdAt: createDate(2026, 1, 6) },
  { id: generateId(), amount: 65, category: "transporte", type: "gasto", recurrence: "recurrente", description: "Abono transporte", date: createDate(2026, 1, 3), createdAt: createDate(2026, 1, 3) },
  { id: generateId(), amount: 150, category: "ocio", type: "gasto", recurrence: "puntual", description: "Reyes - cenas festivas", date: createDate(2026, 1, 6), createdAt: createDate(2026, 1, 6) },
  { id: generateId(), amount: 45, category: "suscripciones", type: "gasto", recurrence: "recurrente", description: "Netflix + Spotify", date: createDate(2026, 1, 10), createdAt: createDate(2026, 1, 10) },
  { id: generateId(), amount: 350, category: "ropa", type: "gasto", recurrence: "puntual", description: "Rebajas enero", date: createDate(2026, 1, 15), createdAt: createDate(2026, 1, 15) },
  { id: generateId(), amount: 700, category: "freelance", type: "ingreso", recurrence: "puntual", description: "Proyecto landing page", date: createDate(2026, 1, 20), createdAt: createDate(2026, 1, 20) },

  // Febrero 2026
  { id: generateId(), amount: 3300, category: "salario", type: "ingreso", recurrence: "recurrente", description: "Salario mensual febrero", date: createDate(2026, 2, 1), createdAt: createDate(2026, 2, 1) },
  { id: generateId(), amount: 850, category: "alquiler", type: "gasto", recurrence: "recurrente", description: "Alquiler piso febrero", date: createDate(2026, 2, 1), createdAt: createDate(2026, 2, 1) },
  { id: generateId(), amount: 295, category: "comida", type: "gasto", recurrence: "recurrente", description: "Supermercado semanal", date: createDate(2026, 2, 5), createdAt: createDate(2026, 2, 5) },
  { id: generateId(), amount: 65, category: "transporte", type: "gasto", recurrence: "recurrente", description: "Abono transporte", date: createDate(2026, 2, 3), createdAt: createDate(2026, 2, 3) },
  { id: generateId(), amount: 90, category: "ocio", type: "gasto", recurrence: "puntual", description: "San Valentín cena", date: createDate(2026, 2, 14), createdAt: createDate(2026, 2, 14) },
  { id: generateId(), amount: 45, category: "suscripciones", type: "gasto", recurrence: "recurrente", description: "Netflix + Spotify", date: createDate(2026, 2, 10), createdAt: createDate(2026, 2, 10) },
  { id: generateId(), amount: 80, category: "regalo", type: "gasto", recurrence: "puntual", description: "Regalo cumpleaños", date: createDate(2026, 2, 22), createdAt: createDate(2026, 2, 22) },

  // Marzo 2026
  { id: generateId(), amount: 3300, category: "salario", type: "ingreso", recurrence: "recurrente", description: "Salario mensual marzo", date: createDate(2026, 3, 1), createdAt: createDate(2026, 3, 1) },
  { id: generateId(), amount: 850, category: "alquiler", type: "gasto", recurrence: "recurrente", description: "Alquiler piso marzo", date: createDate(2026, 3, 1), createdAt: createDate(2026, 3, 1) },
  { id: generateId(), amount: 325, category: "comida", type: "gasto", recurrence: "recurrente", description: "Supermercado semanal", date: createDate(2026, 3, 5), createdAt: createDate(2026, 3, 5) },
  { id: generateId(), amount: 65, category: "transporte", type: "gasto", recurrence: "recurrente", description: "Abono transporte", date: createDate(2026, 3, 3), createdAt: createDate(2026, 3, 3) },
  { id: generateId(), amount: 130, category: "ocio", type: "gasto", recurrence: "puntual", description: "Noche de tapas", date: createDate(2026, 3, 15), createdAt: createDate(2026, 3, 15) },
  { id: generateId(), amount: 45, category: "suscripciones", type: "gasto", recurrence: "recurrente", description: "Netflix + Spotify", date: createDate(2026, 3, 10), createdAt: createDate(2026, 3, 10) },
  { id: generateId(), amount: 250, category: "educacion", type: "gasto", recurrence: "puntual", description: "Certificación AWS", date: createDate(2026, 3, 20), createdAt: createDate(2026, 3, 20) },
  { id: generateId(), amount: 150, category: "inversiones", type: "ingreso", recurrence: "puntual", description: "Dividendos ETF", date: createDate(2026, 3, 25), createdAt: createDate(2026, 3, 25) },

  // Abril 2026
  { id: generateId(), amount: 3300, category: "salario", type: "ingreso", recurrence: "recurrente", description: "Salario mensual abril", date: createDate(2026, 4, 1), createdAt: createDate(2026, 4, 1) },
  { id: generateId(), amount: 850, category: "alquiler", type: "gasto", recurrence: "recurrente", description: "Alquiler piso abril", date: createDate(2026, 4, 1), createdAt: createDate(2026, 4, 1) },
  { id: generateId(), amount: 305, category: "comida", type: "gasto", recurrence: "recurrente", description: "Supermercado semanal", date: createDate(2026, 4, 5), createdAt: createDate(2026, 4, 5) },
  { id: generateId(), amount: 65, category: "transporte", type: "gasto", recurrence: "recurrente", description: "Abono transporte", date: createDate(2026, 4, 3), createdAt: createDate(2026, 4, 3) },
  { id: generateId(), amount: 100, category: "ocio", type: "gasto", recurrence: "puntual", description: "Semana Santa actividades", date: createDate(2026, 4, 10), createdAt: createDate(2026, 4, 10) },
  { id: generateId(), amount: 45, category: "suscripciones", type: "gasto", recurrence: "recurrente", description: "Netflix + Spotify", date: createDate(2026, 4, 10), createdAt: createDate(2026, 4, 10) },
  { id: generateId(), amount: 95, category: "salud", type: "gasto", recurrence: "puntual", description: "Fisioterapia", date: createDate(2026, 4, 18), createdAt: createDate(2026, 4, 18) },
  { id: generateId(), amount: 450, category: "freelance", type: "ingreso", recurrence: "puntual", description: "Mantenimiento web cliente", date: createDate(2026, 4, 22), createdAt: createDate(2026, 4, 22) },

  // Mayo 2026 (mes actual - parcial)
  { id: generateId(), amount: 3300, category: "salario", type: "ingreso", recurrence: "recurrente", description: "Salario mensual mayo", date: createDate(2026, 5, 1), createdAt: createDate(2026, 5, 1) },
  { id: generateId(), amount: 850, category: "alquiler", type: "gasto", recurrence: "recurrente", description: "Alquiler piso mayo", date: createDate(2026, 5, 1), createdAt: createDate(2026, 5, 1) },
  { id: generateId(), amount: 185, category: "comida", type: "gasto", recurrence: "recurrente", description: "Supermercado primera quincena", date: createDate(2026, 5, 5), createdAt: createDate(2026, 5, 5) },
  { id: generateId(), amount: 65, category: "transporte", type: "gasto", recurrence: "recurrente", description: "Abono transporte", date: createDate(2026, 5, 3), createdAt: createDate(2026, 5, 3) },
  { id: generateId(), amount: 45, category: "suscripciones", type: "gasto", recurrence: "recurrente", description: "Netflix + Spotify", date: createDate(2026, 5, 10), createdAt: createDate(2026, 5, 10) },
  { id: generateId(), amount: 75, category: "ocio", type: "gasto", recurrence: "puntual", description: "Cena cumpleaños amigo", date: createDate(2026, 5, 8), createdAt: createDate(2026, 5, 8) },
  { id: generateId(), amount: 200, category: "inversiones", type: "ingreso", recurrence: "puntual", description: "Venta acciones beneficio", date: createDate(2026, 5, 12), createdAt: createDate(2026, 5, 12) },
];

/** Todas las transacciones de mock combinadas */
export const mockTransactions: Transaction[] = [
  ...historicalTransactions2025,
  ...currentYearTransactions,
];

/** Metas de ahorro de ejemplo */
export const mockSavingsGoals: SavingsGoal[] = [
  {
    id: generateId(),
    name: "Viaje a Japón",
    targetAmount: 3000,
    currentAmount: 850,
    deadline: createDate(2026, 12, 1),
    createdAt: createDate(2026, 1, 1),
  },
  {
    id: generateId(),
    name: "Fondo de emergencia",
    targetAmount: 5000,
    currentAmount: 2100,
    deadline: createDate(2027, 6, 1),
    createdAt: createDate(2025, 6, 1),
  },
  {
    id: generateId(),
    name: "MacBook Pro",
    targetAmount: 2500,
    currentAmount: 400,
    deadline: createDate(2027, 3, 1),
    createdAt: createDate(2026, 3, 1),
  },
];

/** Presupuestos mensuales de ejemplo */
export const mockBudgets: Budget[] = [
  { id: generateId(), category: "comida", monthlyLimit: 350, createdAt: createDate(2026, 1, 1) },
  { id: generateId(), category: "ocio", monthlyLimit: 150, createdAt: createDate(2026, 1, 1) },
  { id: generateId(), category: "transporte", monthlyLimit: 100, createdAt: createDate(2026, 1, 1) },
  { id: generateId(), category: "ropa", monthlyLimit: 200, createdAt: createDate(2026, 1, 1) },
  { id: generateId(), category: "suscripciones", monthlyLimit: 60, createdAt: createDate(2026, 1, 1) },
  { id: generateId(), category: "salud", monthlyLimit: 150, createdAt: createDate(2026, 1, 1) },
  { id: generateId(), category: "educacion", monthlyLimit: 200, createdAt: createDate(2026, 1, 1) },
];

/** Deudas de ejemplo - con características distintas para que Avalancha vs Bola de Nieve produzcan resultados diferentes */
export const mockDebts: Debt[] = [
  {
    id: generateId(),
    name: "Tarjeta Visa Gold",
    type: "tarjeta_credito",
    totalAmount: 1500,
    currentBalance: 1500,
    interestRate: 24.9,
    minimumPayment: 45,
    dueDay: 5,
    startDate: createDate(2025, 3, 5),
    createdAt: createDate(2025, 3, 5),
  },
  {
    id: generateId(),
    name: "Préstamo personal Banco Santander",
    type: "prestamo_personal",
    totalAmount: 8000,
    currentBalance: 6500,
    interestRate: 8.5,
    minimumPayment: 250,
    dueDay: 15,
    startDate: createDate(2025, 6, 15),
    endDate: createDate(2028, 6, 15),
    createdAt: createDate(2025, 6, 15),
  },
  {
    id: generateId(),
    name: "Préstamo coche",
    type: "prestamo_auto",
    totalAmount: 12000,
    currentBalance: 9800,
    interestRate: 6.5,
    minimumPayment: 320,
    dueDay: 20,
    startDate: createDate(2025, 1, 20),
    endDate: createDate(2029, 1, 20),
    createdAt: createDate(2025, 1, 20),
  },
  {
    id: generateId(),
    name: "Microcrédito rápido",
    type: "prestamo_personal",
    totalAmount: 800,
    currentBalance: 800,
    interestRate: 12.0,
    minimumPayment: 50,
    dueDay: 10,
    startDate: createDate(2025, 9, 10),
    endDate: createDate(2027, 9, 10),
    createdAt: createDate(2025, 9, 10),
  },
];

/** Suscripciones de ejemplo */
export const mockSubscriptions: Subscription[] = [
  {
    id: generateId(),
    name: "Netflix",
    amount: 12.99,
    billingCycle: "mensual",
    nextBillingDate: createDate(2026, 6, 10),
    category: "suscripciones",
    isActive: true,
    startDate: createDate(2024, 3, 10),
    createdAt: createDate(2024, 3, 10),
  },
  {
    id: generateId(),
    name: "Spotify Premium",
    amount: 10.99,
    billingCycle: "mensual",
    nextBillingDate: createDate(2026, 6, 10),
    category: "suscripciones",
    isActive: true,
    startDate: createDate(2024, 1, 10),
    createdAt: createDate(2024, 1, 10),
  },
  {
    id: generateId(),
    name: "Gimnasio FitLife",
    amount: 39.99,
    billingCycle: "mensual",
    nextBillingDate: createDate(2026, 6, 1),
    category: "salud",
    isActive: true,
    startDate: createDate(2025, 9, 1),
    createdAt: createDate(2025, 9, 1),
  },
  {
    id: generateId(),
    name: "iCloud+ 200GB",
    amount: 3.49,
    billingCycle: "mensual",
    nextBillingDate: createDate(2026, 6, 15),
    category: "suscripciones",
    isActive: true,
    startDate: createDate(2024, 6, 15),
    createdAt: createDate(2024, 6, 15),
  },
  {
    id: generateId(),
    name: "Amazon Prime",
    amount: 49.90,
    billingCycle: "anual",
    nextBillingDate: createDate(2026, 11, 5),
    category: "suscripciones",
    isActive: true,
    startDate: createDate(2024, 11, 5),
    createdAt: createDate(2024, 11, 5),
  },
  {
    id: generateId(),
    name: "Disney+",
    amount: 8.99,
    billingCycle: "mensual",
    nextBillingDate: createDate(2026, 6, 22),
    category: "suscripciones",
    isActive: true,
    startDate: createDate(2025, 1, 22),
    createdAt: createDate(2025, 1, 22),
  },
  {
    id: generateId(),
    name: "Adobe Creative Cloud",
    amount: 54.99,
    billingCycle: "mensual",
    nextBillingDate: createDate(2026, 6, 3),
    category: "educacion",
    isActive: true,
    startDate: createDate(2025, 3, 3),
    createdAt: createDate(2025, 3, 3),
  },
];
