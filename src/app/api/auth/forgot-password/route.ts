import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { forgotPasswordSchema } from "@/lib/validation/auth";
import { handleRouteError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    const usuario = await db.usuario.findUnique({ where: { email } });
    if (!usuario) {
      return NextResponse.json({ ok: true });
    }

    const resetToken = randomBytes(24).toString("hex");
    const resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await db.usuario.update({
      where: { id: usuario.id },
      data: { resetToken, resetTokenExpiresAt },
    });

    // Sin servicio de email configurado: el token se devuelve directo en la
    // respuesta (comportamiento de dev/demo). Conectar un proveedor de email
    // antes de producción y dejar de exponer el token aquí.
    return NextResponse.json({ ok: true, resetToken, expiresAt: resetTokenExpiresAt });
  } catch (error) {
    return handleRouteError(error);
  }
}
