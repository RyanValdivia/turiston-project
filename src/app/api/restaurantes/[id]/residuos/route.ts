import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { handleRouteError } from "@/lib/api-helpers";
import { createResiduoSchema, residuoFiltersSchema } from "@/lib/validation/residuo";
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
    const filters = residuoFiltersSchema.parse({
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      categoria: searchParams.get("categoria") ?? undefined,
      area: searchParams.get("area") ?? undefined,
      turno: searchParams.get("turno") ?? undefined,
    });

    const residuos = await db.residuo.findMany({
      where: {
        restauranteId: id,
        ...(filters.categoria ? { categoria: filters.categoria } : {}),
        ...(filters.area ? { area: filters.area } : {}),
        ...(filters.turno ? { turno: filters.turno } : {}),
        ...(filters.from || filters.to
          ? {
              fecha: {
                ...(filters.from ? { gte: filters.from } : {}),
                ...(filters.to ? { lte: filters.to } : {}),
              },
            }
          : {}),
      },
      orderBy: { fecha: "desc" },
    });
    return NextResponse.json(residuos);
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
    const data = createResiduoSchema.parse(body);

    const costoTotal = await calcularCostoTotal({
      restauranteId: id,
      cantidadKg: data.cantidadKg,
      productoId: data.productoId,
      costoManual: data.costoManual,
    });

    const residuo = await db.residuo.create({
      data: { ...data, restauranteId: id, costoTotal },
    });
    return NextResponse.json(residuo, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
