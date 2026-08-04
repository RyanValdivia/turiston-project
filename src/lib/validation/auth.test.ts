import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema, resetPasswordSchema } from "@/lib/validation/auth";

describe("registerSchema", () => {
  it("acepta un registro válido", () => {
    const r = registerSchema.safeParse({
      nombreUsuario: "Ana",
      email: "ana@resto.pe",
      password: "clave1234",
      nombreRestaurante: "El Buen Sabor",
    });
    expect(r.success).toBe(true);
  });

  it("rechaza email inválido", () => {
    const r = registerSchema.safeParse({
      nombreUsuario: "Ana",
      email: "no-es-email",
      password: "clave1234",
      nombreRestaurante: "El Buen Sabor",
    });
    expect(r.success).toBe(false);
  });

  it("rechaza contraseña de menos de 8 caracteres", () => {
    const r = registerSchema.safeParse({
      nombreUsuario: "Ana",
      email: "ana@resto.pe",
      password: "corta",
      nombreRestaurante: "El Buen Sabor",
    });
    expect(r.success).toBe(false);
  });

  it("ciudad es opcional", () => {
    const r = registerSchema.safeParse({
      nombreUsuario: "Ana",
      email: "ana@resto.pe",
      password: "clave1234",
      nombreRestaurante: "El Buen Sabor",
    });
    expect(r.success).toBe(true);
  });
});

describe("loginSchema", () => {
  it("acepta credenciales con cualquier contraseña no vacía", () => {
    expect(loginSchema.safeParse({ email: "demo@circularaqp.pe", password: "x" }).success).toBe(true);
  });
  it("rechaza contraseña vacía", () => {
    expect(loginSchema.safeParse({ email: "demo@circularaqp.pe", password: "" }).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("exige token y contraseña de 8+ caracteres", () => {
    expect(resetPasswordSchema.safeParse({ token: "t", newPassword: "clave1234" }).success).toBe(true);
    expect(resetPasswordSchema.safeParse({ token: "", newPassword: "clave1234" }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ token: "t", newPassword: "corta" }).success).toBe(false);
  });
});
