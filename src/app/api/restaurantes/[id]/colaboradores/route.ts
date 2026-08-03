import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { handleRouteError } from "@/lib/api-helpers";
import { createColaboradorSchema } from "@/lib/validation/colaborador";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireSession(request, id);
    const colaboradores = await db.colaborador.findMany({
      where: { restauranteId: id },
      orderBy: { nombre: "asc" },
    });
    return NextResponse.json(colaboradores);
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
    const data = createColaboradorSchema.parse(body);
    const colaborador = await db.colaborador.create({ data: { ...data, restauranteId: id } });
    return NextResponse.json(colaborador, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
