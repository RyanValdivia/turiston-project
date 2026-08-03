import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { handleRouteError, parseDateRange } from "@/lib/api-helpers";
import {
  calcularEstadisticas,
  segregacionPct,
  valorizacionPct,
  prevencionPct,
  desperdicioPor100Platos,
  trazabilidadPct,
  personalCapacitadoPct,
  adopcionPct,
} from "@/lib/estadisticas";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireSession(request, id);
    const searchParams = request.nextUrl.searchParams;
    const { from, to } = parseDateRange(searchParams);
    const platosVendidosRaw = searchParams.get("platosVendidos");
    const platosVendidos = platosVendidosRaw ? Number(platosVendidosRaw) : null;

    const stats = await calcularEstadisticas(id, from, to, { platosVendidos });

    return NextResponse.json({
      periodo: { from: stats.from, to: stats.to },
      generacion: { totalKg: stats.totalKg, porCategoria: stats.porCategoria },
      desperdicioPor100Platos: desperdicioPor100Platos(stats),
      economia: {
        perdidaEstimada: stats.totalCostoConocido,
        kgSinCostoAsignado: stats.kgSinCosto,
      },
      prevencionPct: prevencionPct(stats),
      segregacionPct: segregacionPct(stats),
      valorizacionPct: valorizacionPct(stats),
      operacion: { accionesAplicadas: stats.accionesAplicadasCount },
      personal: {
        capacitadosPct: personalCapacitadoPct(stats),
        total: stats.colaboradoresTotal,
        capacitados: stats.colaboradoresCapacitados,
      },
      trazabilidadPct: trazabilidadPct(stats),
      adopcionPct: adopcionPct(stats),
      satisfaccion: null,
      analisis: {
        categoriaMasGenerada: stats.categoriaMasGenerada,
        areaCritica: stats.areaCritica,
        turnoCritico: stats.turnoCritico,
        porArea: stats.porArea,
        porTurno: stats.porTurno,
        porMotivo: stats.porMotivo,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
