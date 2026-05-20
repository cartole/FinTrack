/**
 * ============================================
 * API Route: Datos de Mercado Reales
 * ============================================
 * Endpoint que obtiene datos de mercado en tiempo real
 * usando web_search del z-ai-web-dev-sdk.
 *
 * GET /api/market-data?action=indices     - Índices bursátiles
 * GET /api/market-data?action=rates       - Tipos de interés
 * GET /api/market-data?action=all          - Todos los datos
 * GET /api/market-data?action=search&q=... - Buscar acción
 * GET /api/market-data?action=refresh      - Forzar actualización
 */

import { NextResponse } from "next/server";
import { getMarketData, searchStock, getInterestRates } from "@/lib/market-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "all";
    const forceRefresh = action === "refresh";

    switch (action) {
      case "indices": {
        const data = await getMarketData(forceRefresh);
        return NextResponse.json({
          success: true,
          indices: data.indices,
          lastUpdated: data.lastUpdated,
        });
      }

      case "rates": {
        const data = await getInterestRates(forceRefresh);
        return NextResponse.json({
          success: true,
          euriborRates: data.euriborRates,
          depositRates: data.depositRates,
          ecbRate: data.ecbRate,
          lastUpdated: data.lastUpdated,
        });
      }

      case "search": {
        const query = searchParams.get("q");
        if (!query) {
          return NextResponse.json(
            { success: false, error: "Parámetro 'q' requerido para búsqueda" },
            { status: 400 }
          );
        }
        const results = await searchStock(query);
        return NextResponse.json({
          success: true,
          results,
          lastUpdated: new Date().toISOString(),
        });
      }

      case "refresh": {
        const data = await getMarketData(true);
        return NextResponse.json({
          success: true,
          data,
          message: "Datos actualizados correctamente",
        });
      }

      case "all":
      default: {
        const data = await getMarketData(forceRefresh);
        return NextResponse.json({
          success: true,
          data,
        });
      }
    }
  } catch (error) {
    console.error("Error en /api/market-data:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener datos de mercado" },
      { status: 500 }
    );
  }
}
