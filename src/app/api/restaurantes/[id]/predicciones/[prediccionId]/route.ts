import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { handleRouteError, NotFoundError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; prediccionId: string }> }
) {
  try {
    const { id, prediccionId } = await params;
    await requireSession(request, id);
    const prediccion = await db.prediccion.findFirst({
      where: { id: prediccionId, restauranteId: id },
    });
    if (!prediccion) throw new NotFoundError("Predicción no encontrada");
    return NextResponse.json({
      ...prediccion,
      datosEntrada: JSON.parse(prediccion.datosEntradaJson),
      resultado: prediccion.resultadoJson ? JSON.parse(prediccion.resultadoJson) : null,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
