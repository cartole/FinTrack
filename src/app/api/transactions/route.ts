/**
 * ============================================
 * API Route: Transacciones
 * ============================================
 * CRUD de transacciones financieras.
 * En producción se conectaría a PostgreSQL/MongoDB.
 * Actualmente opera sobre el store en memoria.
 */

import { NextResponse } from "next/server";

// GET /api/transactions - Obtener todas las transacciones
export async function GET() {
  try {
    // En producción: SELECT * FROM transactions ORDER BY date DESC
    // Por ahora devolvemos datos de prueba desde el store
    return NextResponse.json({
      success: true,
      message: "Endpoint de transacciones activo. Los datos se gestionan desde el store del cliente.",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Error al obtener transacciones" },
      { status: 500 }
    );
  }
}

// POST /api/transactions - Crear nueva transacción
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // En producción: INSERT INTO transactions VALUES (...)
    return NextResponse.json({
      success: true,
      message: "Transacción registrada correctamente",
      data: body,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Error al crear transacción" },
      { status: 500 }
    );
  }
}

// DELETE /api/transactions - Eliminar transacción
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    // En producción: DELETE FROM transactions WHERE id = ?
    return NextResponse.json({
      success: true,
      message: `Transacción ${id} eliminada correctamente`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Error al eliminar transacción" },
      { status: 500 }
    );
  }
}
