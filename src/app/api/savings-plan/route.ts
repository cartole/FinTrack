/**
 * ============================================
 * API Route: Plan de Ahorro (IA)
 * ============================================
 * Endpoint que genera un plan de ahorro basado en
 * el historial de gastos y una meta del usuario.
 *
 * En producción, este endpoint podría:
 * 1. Llamar a OpenAI/Claude API para un análisis más sofisticado
 * 2. Usar modelos de ML entrenados con datos del usuario
 * 3. Conectar con servicios financieros externos
 */

import { NextResponse } from "next/server";
import { generateSavingsPlan } from "@/lib/savings-planner";
import { mockTransactions } from "@/lib/mock-data";
import type { Transaction } from "@/lib/types";

// POST /api/savings-plan - Generar plan de ahorro
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { targetAmount, goalName, currentSaved, deadline } = body;

    // Validación de entrada
    if (!targetAmount || !goalName || !deadline) {
      return NextResponse.json(
        {
          success: false,
          error: "Faltan campos requeridos: targetAmount, goalName, deadline",
        },
        { status: 400 }
      );
    }

    // En producción: obtener transacciones de la base de datos
    const transactions: Transaction[] = mockTransactions;

    // Generar el plan usando el motor de reglas / IA simulada
    const plan = generateSavingsPlan(transactions, {
      name: goalName,
      targetAmount: Number(targetAmount),
      currentSaved: Number(currentSaved || 0),
      deadline,
    });

    return NextResponse.json({
      success: true,
      plan,
    });
  } catch (error) {
    console.error("Error generando plan de ahorro:", error);
    return NextResponse.json(
      { success: false, error: "Error al generar el plan de ahorro" },
      { status: 500 }
    );
  }
}
