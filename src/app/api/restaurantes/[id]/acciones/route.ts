import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { handleRouteError } from "@/lib/api-helpers";
import { createAccionSchema } from "@/lib/validation/accion";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireSession(request, id);
    const acciones = await db.accionAplicada.findMany({
      where: { restauranteId: id },
      orderBy: { fecha: "desc" },
    });
    return NextResponse.json(acciones);
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
    const data = createAccionSchema.parse(body);
    const accion = await db.accionAplicada.create({ data: { ...data, restauranteId: id } });
    return NextResponse.json(accion, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
