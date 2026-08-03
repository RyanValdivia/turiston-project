import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { handleRouteError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession(request);
    const usuario = await db.usuario.findUnique({
      where: { id: session.usuarioId },
      select: {
        id: true,
        nombre: true,
        email: true,
        createdAt: true,
        restaurante: {
          select: {
            id: true,
            nombre: true,
            ciudad: true,
            lineaBaseSemanalKg: true,
            createdAt: true,
          },
        },
      },
    });
    if (!usuario) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    return NextResponse.json(usuario);
  } catch (error) {
    return handleRouteError(error);
  }
}
