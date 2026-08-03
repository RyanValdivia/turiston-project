import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { handleRouteError } from "@/lib/api-helpers";
import { createPrediccionSchema } from "@/lib/validation/prediccion";
import { calcularTendencia } from "@/lib/estadisticas";
import { ejecutarModeloPredictivo } from "@/lib/prediccion";
import { EstadoPrediccion } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireSession(request, id);
    const predicciones = await db.prediccion.findMany({
      where: { restauranteId: id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(
      predicciones.map((p) => ({
        ...p,
        datosEntrada: JSON.parse(p.datosEntradaJson),
        resultado: p.resultadoJson ? JSON.parse(p.resultadoJson) : null,
      }))
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireSession(request, id);
    const body = await request.json().catch(() => ({}));
    const data = createPrediccionSchema.parse(body);
    const tipo = data.tipo ?? "desperdicio_semanal";
    const horizonteDias = data.horizonteDias ?? 7;

    const to = new Date();
    const from = new Date(to.getTime() - 90 * 24 * 60 * 60 * 1000); // últimos ~90 días de historial
    const tendencia = await calcularTendencia(id, from, to);
    const datosEntrada = { tendencia, horizonteDias };

    try {
      const resultado = await ejecutarModeloPredictivo({ tendencia, horizonteDias });
      const prediccion = await db.prediccion.create({
        data: {
          restauranteId: id,
          tipo,
          horizonteDias,
          datosEntradaJson: JSON.stringify(datosEntrada),
          resultadoJson: JSON.stringify(resultado),
          estado: EstadoPrediccion.COMPLETADA,
          completadaEn: new Date(),
        },
      });
      return NextResponse.json({ ...prediccion, datosEntrada, resultado }, { status: 201 });
    } catch (modeloError) {
      console.error("Error ejecutando el modelo predictivo:", modeloError);
      const prediccion = await db.prediccion.create({
        data: {
          restauranteId: id,
          tipo,
          horizonteDias,
          datosEntradaJson: JSON.stringify(datosEntrada),
          estado: EstadoPrediccion.ERROR,
        },
      });
      return NextResponse.json({ ...prediccion, datosEntrada, resultado: null }, { status: 201 });
    }
  } catch (error) {
    return handleRouteError(error);
  }
}
