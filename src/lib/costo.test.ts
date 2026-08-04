import { describe, it, expect, vi, beforeEach } from "vitest";

const findFirst = vi.fn();
vi.mock("@/lib/db", () => ({ db: { producto: { findFirst: (...a: unknown[]) => findFirst(...a) } } }));

import { calcularCostoTotal } from "@/lib/costo";

beforeEach(() => findFirst.mockReset());

describe("calcularCostoTotal", () => {
  it("usa el costo unitario del producto del catálogo (costo = unitario * kg)", async () => {
    findFirst.mockResolvedValue({ id: "p1", restauranteId: "r1", costoUnitario: 12 });
    const costo = await calcularCostoTotal({ restauranteId: "r1", cantidadKg: 3, productoId: "p1" });
    expect(costo).toBe(36);
  });

  it("cae al costo manual cuando el producto no existe", async () => {
    findFirst.mockResolvedValue(null);
    const costo = await calcularCostoTotal({
      restauranteId: "r1",
      cantidadKg: 3,
      productoId: "inexistente",
      costoManual: 9.5,
    });
    expect(costo).toBe(9.5);
  });

  it("usa el costo manual cuando no se pasa productoId", async () => {
    const costo = await calcularCostoTotal({ restauranteId: "r1", cantidadKg: 2, costoManual: 20 });
    expect(costo).toBe(20);
    expect(findFirst).not.toHaveBeenCalled();
  });

  it("devuelve null cuando no hay producto ni costo manual", async () => {
    const costo = await calcularCostoTotal({ restauranteId: "r1", cantidadKg: 2 });
    expect(costo).toBeNull();
  });

  it("scopea la búsqueda del producto al restaurante (aislamiento multi-tenant)", async () => {
    findFirst.mockResolvedValue({ id: "p1", restauranteId: "r1", costoUnitario: 5 });
    await calcularCostoTotal({ restauranteId: "r1", cantidadKg: 1, productoId: "p1" });
    expect(findFirst).toHaveBeenCalledWith({ where: { id: "p1", restauranteId: "r1" } });
  });
});
