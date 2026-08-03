import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/api-helpers";
import { createPrediccionSchema } from "@/lib/validation/prediccion";
import { predecirVentas, DatosInsuficientesError } from "@/lib/prediccion";
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

    const fechaObjetivo = data.fecha ?? new Date(Date.now() + 24 * 60 * 60 * 1000);

    try {
      const { entreno, predicciones } = await predecirVentas(id, fechaObjetivo);
      const datosEntrada = { fechaObjetivo: fechaObjetivo.toISOString().slice(0, 10) };
      const resultado = { predicciones, metrics: entreno.metrics, entrenadoEn: entreno.entrenadoEn };

      const prediccion = await db.prediccion.create({
        data: {
          restauranteId: id,
          tipo: "ventas_por_plato",
          datosEntradaJson: JSON.stringify(datosEntrada),
          resultadoJson: JSON.stringify(resultado),
          estado: EstadoPrediccion.COMPLETADA,
          completadaEn: new Date(),
        },
      });

      return NextResponse.json({ ...prediccion, datosEntrada, resultado }, { status: 201 });
    } catch (error) {
      if (error instanceof DatosInsuficientesError) {
        return jsonError(422, error.message, { filasDisponibles: error.count });
      }

      console.error("Error prediciendo ventas:", error);
      const datosEntrada = { fechaObjetivo: fechaObjetivo.toISOString().slice(0, 10) };
      const prediccion = await db.prediccion.create({
        data: {
          restauranteId: id,
          tipo: "ventas_por_plato",
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
