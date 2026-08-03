import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { handleRouteError, NotFoundError } from "@/lib/api-helpers";
import { updateResiduoSchema } from "@/lib/validation/residuo";
import { calcularCostoTotal } from "@/lib/costo";

export const dynamic = "force-dynamic";

async function getOwnedResiduo(restauranteId: string, residuoId: string) {
  const residuo = await db.residuo.findFirst({ where: { id: residuoId, restauranteId } });
  if (!residuo) throw new NotFoundError("Residuo no encontrado");
  return residuo;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; residuoId: string }> }
) {
  try {
    const { id, residuoId } = await params;
    await requireSession(request, id);
    const residuo = await getOwnedResiduo(id, residuoId);
    return NextResponse.json(residuo);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; residuoId: string }> }
) {
  try {
    const { id, residuoId } = await params;
    await requireSession(request, id);
    const existing = await getOwnedResiduo(id, residuoId);
    const body = await request.json();
    const data = updateResiduoSchema.parse(body);

    const cantidadKg = data.cantidadKg ?? existing.cantidadKg;
    const productoId = data.productoId !== undefined ? data.productoId : existing.productoId;
    const costoManual = data.costoManual !== undefined ? data.costoManual : existing.costoManual;

    const costoTotal = await calcularCostoTotal({
      restauranteId: id,
      cantidadKg,
      productoId,
      costoManual,
    });

    const residuo = await db.residuo.update({
      where: { id: residuoId },
      data: { ...data, costoTotal },
    });
    return NextResponse.json(residuo);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; residuoId: string }> }
) {
  try {
    const { id, residuoId } = await params;
    await requireSession(request, id);
    await getOwnedResiduo(id, residuoId);
    await db.residuo.delete({ where: { id: residuoId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
