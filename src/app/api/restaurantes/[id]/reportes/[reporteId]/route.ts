import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { handleRouteError, NotFoundError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

async function getOwnedReporte(restauranteId: string, reporteId: string) {
  const reporte = await db.reporte.findFirst({ where: { id: reporteId, restauranteId } });
  if (!reporte) throw new NotFoundError("Reporte no encontrado");
  return reporte;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reporteId: string }> }
) {
  try {
    const { id, reporteId } = await params;
    await requireSession(request, id);
    const reporte = await getOwnedReporte(id, reporteId);
    return NextResponse.json({
      id: reporte.id,
      periodoFrom: reporte.periodoFrom,
      periodoTo: reporte.periodoTo,
      createdAt: reporte.createdAt,
      resumen: JSON.parse(reporte.resumenJson),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reporteId: string }> }
) {
  try {
    const { id, reporteId } = await params;
    await requireSession(request, id);
    await getOwnedReporte(id, reporteId);
    await db.reporte.delete({ where: { id: reporteId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
