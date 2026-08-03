import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { handleRouteError, NotFoundError } from "@/lib/api-helpers";
import { updateRegistroOperacionSchema } from "@/lib/validation/registroOperacion";
import { calcularCostoTotal } from "@/lib/costo";

export const dynamic = "force-dynamic";

async function getOwnedRegistro(restauranteId: string, operacionId: string) {
  const registro = await db.registroOperacion.findFirst({
    where: { id: operacionId, restauranteId },
    include: { ventas: true, producciones: true, residuos: true },
  });
  if (!registro) throw new NotFoundError("Registro de operación no encontrado");
  return registro;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; operacionId: string }> }
) {
  try {
    const { id, operacionId } = await params;
    await requireSession(request, id);
    const registro = await getOwnedRegistro(id, operacionId);
    return NextResponse.json(registro);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; operacionId: string }> }
) {
  try {
    const { id, operacionId } = await params;
    await requireSession(request, id);
    await getOwnedRegistro(id, operacionId);
    const body = await request.json();
    const data = updateRegistroOperacionSchema.parse(body);

    const residuosConCosto = data.desperdicios
      ? await Promise.all(
          data.desperdicios.map(async (item) => {
            const costoTotal = await calcularCostoTotal({
              restauranteId: id,
              cantidadKg: item.cantidadKg,
              productoId: item.productoId,
              costoManual: item.costoManual,
            });
            return { ...item, restauranteId: id, costoTotal };
          })
        )
      : undefined;

    const registro = await db.$transaction(async (tx) => {
      if (data.ventas) {
        await tx.venta.deleteMany({ where: { registroOperacionId: operacionId } });
      }
      if (data.producciones) {
        await tx.produccion.deleteMany({ where: { registroOperacionId: operacionId } });
      }
      if (residuosConCosto) {
        await tx.residuo.deleteMany({ where: { registroOperacionId: operacionId } });
      }

      return tx.registroOperacion.update({
        where: { id: operacionId },
        data: {
          colaboradorId: data.colaboradorId,
          fecha: data.fecha,
          turno: data.turno,
          observaciones: data.observaciones,
          ventas: data.ventas
            ? { create: data.ventas.map((v) => ({ ...v, restauranteId: id })) }
            : undefined,
          producciones: data.producciones
            ? { create: data.producciones.map((p) => ({ ...p, restauranteId: id })) }
            : undefined,
          residuos: residuosConCosto ? { create: residuosConCosto } : undefined,
        },
        include: { ventas: true, producciones: true, residuos: true },
      });
    });

    return NextResponse.json(registro);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; operacionId: string }> }
) {
  try {
    const { id, operacionId } = await params;
    await requireSession(request, id);
    await getOwnedRegistro(id, operacionId);
    await db.registroOperacion.delete({ where: { id: operacionId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
