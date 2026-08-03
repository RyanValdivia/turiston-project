import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { handleRouteError } from "@/lib/api-helpers";
import {
  createRegistroOperacionSchema,
  registroOperacionFiltersSchema,
} from "@/lib/validation/registroOperacion";
import { calcularCostoTotal } from "@/lib/costo";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireSession(request, id);
    const searchParams = request.nextUrl.searchParams;
    const filters = registroOperacionFiltersSchema.parse({
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      turno: searchParams.get("turno") ?? undefined,
      q: searchParams.get("q") ?? undefined,
    });

    const registros = await db.registroOperacion.findMany({
      where: {
        restauranteId: id,
        ...(filters.turno ? { turno: filters.turno } : {}),
        ...(filters.from || filters.to
          ? {
              fecha: {
                ...(filters.from ? { gte: filters.from } : {}),
                ...(filters.to ? { lte: filters.to } : {}),
              },
            }
          : {}),
        ...(filters.q
          ? {
              OR: [
                { observaciones: { contains: filters.q } },
                { ventas: { some: { concepto: { contains: filters.q } } } },
                { producciones: { some: { productoAsociado: { contains: filters.q } } } },
                { residuos: { some: { productoAsociado: { contains: filters.q } } } },
              ],
            }
          : {}),
      },
      include: { ventas: true, producciones: true, residuos: true },
      orderBy: { fecha: "desc" },
    });

    return NextResponse.json(registros);
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
    const body = await request.json();
    const data = createRegistroOperacionSchema.parse(body);

    const residuosConCosto = await Promise.all(
      (data.desperdicios ?? []).map(async (item) => {
        const costoTotal = await calcularCostoTotal({
          restauranteId: id,
          cantidadKg: item.cantidadKg,
          productoId: item.productoId,
          costoManual: item.costoManual,
        });
        return { ...item, restauranteId: id, costoTotal };
      })
    );

    const registro = await db.registroOperacion.create({
      data: {
        restauranteId: id,
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
        residuos: residuosConCosto.length > 0 ? { create: residuosConCosto } : undefined,
      },
      include: { ventas: true, producciones: true, residuos: true },
    });

    return NextResponse.json(registro, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
