import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("password hashing", () => {
  it("el hash tiene formato salt:hash", async () => {
    const hash = await hashPassword("demo1234");
    expect(hash).toMatch(/^[0-9a-f]{32}:[0-9a-f]{128}$/);
  });

  it("verifica correctamente la contraseña correcta", async () => {
    const hash = await hashPassword("demo1234");
    expect(await verifyPassword("demo1234", hash)).toBe(true);
  });

  it("rechaza una contraseña incorrecta", async () => {
    const hash = await hashPassword("demo1234");
    expect(await verifyPassword("incorrecta", hash)).toBe(false);
  });

  it("produce sales distintas para el mismo texto (no determinista)", async () => {
    const a = await hashPassword("misma");
    const b = await hashPassword("misma");
    expect(a).not.toBe(b);
  });

  it("devuelve false ante un hash almacenado malformado", async () => {
    expect(await verifyPassword("demo1234", "sin-formato")).toBe(false);
    expect(await verifyPassword("demo1234", "")).toBe(false);
  });
});
