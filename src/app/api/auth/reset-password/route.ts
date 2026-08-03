import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { handleRouteError, jsonError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword } = resetPasswordSchema.parse(body);

    const usuario = await db.usuario.findUnique({ where: { resetToken: token } });
    if (!usuario || !usuario.resetTokenExpiresAt || usuario.resetTokenExpiresAt < new Date()) {
      return jsonError(400, "Token inválido o expirado");
    }

    const passwordHash = await hashPassword(newPassword);
    await db.usuario.update({
      where: { id: usuario.id },
      data: { passwordHash, resetToken: null, resetTokenExpiresAt: null },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
