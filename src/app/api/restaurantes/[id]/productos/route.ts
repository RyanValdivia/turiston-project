import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { handleRouteError } from "@/lib/api-helpers";
import { createProductoSchema } from "@/lib/validation/producto";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireSession(request, id);
    const productos = await db.producto.findMany({
      where: { restauranteId: id },
      orderBy: { nombre: "asc" },
    });
    return NextResponse.json(productos);
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
    const data = createProductoSchema.parse(body);
    const producto = await db.producto.create({ data: { ...data, restauranteId: id } });
    return NextResponse.json(producto, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
