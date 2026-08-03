import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { handleRouteError, parseDateRange } from "@/lib/api-helpers";
import {
  calcularEstadisticas,
  segregacionPct,
  valorizacionPct,
  prevencionPct,
  desperdicioPor100Platos,
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

    const [stats, ultimasOperaciones] = await Promise.all([
      calcularEstadisticas(id, from, to, { platosVendidos }),
      db.registroOperacion.findMany({
        where: { restauranteId: id },
        orderBy: { fecha: "desc" },
        take: 5,
        include: { ventas: true, producciones: true, residuos: true },
      }),
    ]);

    return NextResponse.json({
      periodo: { from: stats.from, to: stats.to },
      resumen: {
        totalKg: stats.totalKg,
        perdidaEstimada: stats.totalCostoConocido,
        segregacionPct: segregacionPct(stats),
        valorizacionPct: valorizacionPct(stats),
        prevencionPct: prevencionPct(stats),
        desperdicioPor100Platos: desperdicioPor100Platos(stats),
        categoriaMasGenerada: stats.categoriaMasGenerada,
        areaCritica: stats.areaCritica,
      },
      ultimasOperaciones: ultimasOperaciones.map((op) => ({
        id: op.id,
        fecha: op.fecha,
        turno: op.turno,
        totalVentas: op.ventas.reduce((sum, v) => sum + v.montoTotal, 0),
        totalProducidoKg: op.producciones.reduce((sum, p) => sum + p.cantidadProducida, 0),
        totalDesperdicioKg: op.residuos.reduce((sum, r) => sum + r.cantidadKg, 0),
      })),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
