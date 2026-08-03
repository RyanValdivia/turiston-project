import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { handleRouteError, NotFoundError } from "@/lib/api-helpers";
import { updateEntregaSchema } from "@/lib/validation/entrega";

export const dynamic = "force-dynamic";

async function getOwnedEntrega(restauranteId: string, entregaId: string) {
  const entrega = await db.entrega.findFirst({ where: { id: entregaId, restauranteId } });
  if (!entrega) throw new NotFoundError("Entrega no encontrada");
  return entrega;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; entregaId: string }> }
) {
  try {
    const { id, entregaId } = await params;
    await requireSession(request, id);
    const entrega = await getOwnedEntrega(id, entregaId);
    return NextResponse.json(entrega);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; entregaId: string }> }
) {
  try {
    const { id, entregaId } = await params;
    await requireSession(request, id);
    await getOwnedEntrega(id, entregaId);
    const body = await request.json();
    const data = updateEntregaSchema.parse(body);
    const entrega = await db.entrega.update({ where: { id: entregaId }, data });
    return NextResponse.json(entrega);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; entregaId: string }> }
) {
  try {
    const { id, entregaId } = await params;
    await requireSession(request, id);
    await getOwnedEntrega(id, entregaId);
    await db.entrega.delete({ where: { id: entregaId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
