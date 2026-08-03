import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";

export const SESSION_COOKIE = "session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days
const alg = "HS256";

export interface SessionPayload {
  usuarioId: string;
  restauranteId: string;
}

export class AuthError extends Error {
  status: 401 | 403;
  constructor(status: 401 | 403, message: string) {
    super(message);
    this.status = status;
  }
}

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET no está configurado");
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());
}

export const sessionCookieOptions = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};

async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.restauranteId !== "string" || typeof payload.usuarioId !== "string") {
      return null;
    }
    return { usuarioId: payload.usuarioId, restauranteId: payload.restauranteId };
  } catch {
    return null;
  }
}

export async function getSession(request: NextRequest): Promise<SessionPayload | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Verifies the session cookie and, if restauranteId is passed, that the session
 * belongs to that tenant. Must be called explicitly in every protected route
 * handler — Next 16 docs warn Proxy alone isn't a sufficient auth boundary.
 */
export async function requireSession(
  request: NextRequest,
  restauranteId?: string
): Promise<SessionPayload> {
  const session = await getSession(request);
  if (!session) throw new AuthError(401, "No autenticado");
  if (restauranteId && session.restauranteId !== restauranteId) {
    throw new AuthError(403, "No autorizado para este restaurante");
  }
  return session;
}
