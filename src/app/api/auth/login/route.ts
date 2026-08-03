import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { signSession, sessionCookieOptions, SESSION_COOKIE } from "@/lib/auth";
import { loginSchema } from "@/lib/validation/auth";
import { handleRouteError, jsonError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = loginSchema.parse(body);

    const usuario = await db.usuario.findUnique({ where: { email: data.email } });
    if (!usuario) {
      return jsonError(401, "Credenciales inválidas");
    }

    const valid = await verifyPassword(data.password, usuario.passwordHash);
    if (!valid) {
      return jsonError(401, "Credenciales inválidas");
    }

    const token = await signSession({
      usuarioId: usuario.id,
      restauranteId: usuario.restauranteId,
    });
    const response = NextResponse.json({
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email },
      restauranteId: usuario.restauranteId,
    });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
