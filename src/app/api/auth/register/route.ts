import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { registerSchema } from "@/lib/validation/auth";
import { handleRouteError, jsonError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    const existing = await db.usuario.findUnique({ where: { email: data.email } });
    if (existing) {
      return jsonError(409, "Ya existe una cuenta con ese email");
    }

    const passwordHash = await hashPassword(data.password);

    const { restaurante, usuario } = await db.$transaction(async (tx) => {
      const restaurante = await tx.restaurante.create({
        data: { nombre: data.nombreRestaurante, ciudad: data.ciudad ?? "Arequipa" },
      });
      const usuario = await tx.usuario.create({
        data: {
          restauranteId: restaurante.id,
          nombre: data.nombreUsuario,
          email: data.email,
          passwordHash,
        },
      });
      return { restaurante, usuario };
    });

    return NextResponse.json(
      {
        usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email },
        restaurante: {
          id: restaurante.id,
          nombre: restaurante.nombre,
          ciudad: restaurante.ciudad,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
