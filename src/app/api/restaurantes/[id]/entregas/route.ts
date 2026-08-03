import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { handleRouteError } from "@/lib/api-helpers";
import { createEntregaSchema, entregaFiltersSchema } from "@/lib/validation/entrega";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireSession(request, id);
    const searchParams = request.nextUrl.searchParams;
    const filters = entregaFiltersSchema.parse({
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      categoria: searchParams.get("categoria") ?? undefined,
    });

    const entregas = await db.entrega.findMany({
      where: {
        restauranteId: id,
        ...(filters.categoria ? { categoria: filters.categoria } : {}),
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
    return NextResponse.json(entregas);
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
    const data = createEntregaSchema.parse(body);
    const entrega = await db.entrega.create({ data: { ...data, restauranteId: id } });
    return NextResponse.json(entrega, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
