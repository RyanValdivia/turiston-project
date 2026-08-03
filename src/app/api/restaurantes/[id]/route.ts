import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { handleRouteError } from "@/lib/api-helpers";
import { updateRestauranteSchema } from "@/lib/validation/restaurante";

export const dynamic = "force-dynamic";

const SELECT = {
  id: true,
  nombre: true,
  ciudad: true,
  lineaBaseSemanalKg: true,
  createdAt: true,
} as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireSession(request, id);
    const restaurante = await db.restaurante.findUnique({ where: { id }, select: SELECT });
    if (!restaurante) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    return NextResponse.json(restaurante);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireSession(request, id);
    const body = await request.json();
    const data = updateRestauranteSchema.parse(body);
    const restaurante = await db.restaurante.update({ where: { id }, data, select: SELECT });
    return NextResponse.json(restaurante);
  } catch (error) {
    return handleRouteError(error);
  }
}
