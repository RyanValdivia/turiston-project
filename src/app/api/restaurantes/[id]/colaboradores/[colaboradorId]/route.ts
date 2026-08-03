import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { handleRouteError, NotFoundError } from "@/lib/api-helpers";
import { updateColaboradorSchema } from "@/lib/validation/colaborador";

export const dynamic = "force-dynamic";

async function getOwnedColaborador(restauranteId: string, colaboradorId: string) {
  const colaborador = await db.colaborador.findFirst({
    where: { id: colaboradorId, restauranteId },
  });
  if (!colaborador) throw new NotFoundError("Colaborador no encontrado");
  return colaborador;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; colaboradorId: string }> }
) {
  try {
    const { id, colaboradorId } = await params;
    await requireSession(request, id);
    const colaborador = await getOwnedColaborador(id, colaboradorId);
    return NextResponse.json(colaborador);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; colaboradorId: string }> }
) {
  try {
    const { id, colaboradorId } = await params;
    await requireSession(request, id);
    await getOwnedColaborador(id, colaboradorId);
    const body = await request.json();
    const data = updateColaboradorSchema.parse(body);
    const colaborador = await db.colaborador.update({ where: { id: colaboradorId }, data });
    return NextResponse.json(colaborador);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; colaboradorId: string }> }
) {
  try {
    const { id, colaboradorId } = await params;
    await requireSession(request, id);
    await getOwnedColaborador(id, colaboradorId);
    await db.colaborador.delete({ where: { id: colaboradorId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
