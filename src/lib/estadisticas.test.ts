import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));

import {
  segregacionPct,
  valorizacionPct,
  prevencionPct,
  desperdicioPor100Platos,
  trazabilidadPct,
  personalCapacitadoPct,
  adopcionPct,
  type EstadisticasPeriodo,
} from "@/lib/estadisticas";
import { CategoriaResiduo } from "@/generated/prisma/enums";

function stats(overrides: Partial<EstadisticasPeriodo> = {}): EstadisticasPeriodo {
  return {
    from: new Date("2026-01-01"),
    to: new Date("2026-01-07"),
    totalKg: 0,
    totalCostoConocido: 0,
    kgSinCosto: 0,
    porCategoria: {},
    porArea: {},
    porTurno: {},
    porMotivo: {},
    categoriaMasGenerada: null,
    areaCritica: null,
    turnoCritico: null,
    entregasPorCategoria: {},
    entregasTotalCount: 0,
    entregasConEvidenciaCount: 0,
    accionesAplicadasCount: 0,
    colaboradoresTotal: 0,
    colaboradoresCapacitados: 0,
    diasConRegistro: 0,
    diasEnPeriodo: 7,
    lineaBaseSemanalKg: null,
    platosVendidos: null,
    ...overrides,
  };
}

describe("segregacionPct", () => {
  it("null cuando no hay residuos", () => {
    expect(segregacionPct(stats())).toBeNull();
  });
  it("porcentaje aprovechable = (total - no aprovechable)/total", () => {
    const s = stats({ totalKg: 100, porCategoria: { [CategoriaResiduo.NO_APROVECHABLE]: 40 } });
    expect(segregacionPct(s)).toBeCloseTo(60);
  });
  it("100% cuando todo es aprovechable", () => {
    const s = stats({ totalKg: 50, porCategoria: { [CategoriaResiduo.MERMA_PREPARACION]: 50 } });
    expect(segregacionPct(s)).toBeCloseTo(100);
  });
});

describe("valorizacionPct", () => {
  it("null cuando no hay valorizables generados", () => {
    expect(valorizacionPct(stats({ totalKg: 10, porCategoria: { [CategoriaResiduo.MERMA_PREPARACION]: 10 } }))).toBeNull();
  });
  it("proporción entregada sobre valorizable generado", () => {
    const s = stats({
      porCategoria: { [CategoriaResiduo.CARTON]: 20, [CategoriaResiduo.PLASTICO]: 20 },
      entregasPorCategoria: { [CategoriaResiduo.CARTON]: 10 },
    });
    expect(valorizacionPct(s)).toBeCloseTo(25); // 10 / 40
  });
  it("se satura a 100% aunque se entregue de más", () => {
    const s = stats({
      porCategoria: { [CategoriaResiduo.VIDRIO]: 10 },
      entregasPorCategoria: { [CategoriaResiduo.VIDRIO]: 50 },
    });
    expect(valorizacionPct(s)).toBe(100);
  });
});

describe("prevencionPct", () => {
  it("null sin línea base", () => {
    expect(prevencionPct(stats({ totalKg: 10 }))).toBeNull();
  });
  it("positivo cuando se genera menos que la línea base esperada", () => {
    // 7 días = 1 semana, línea base 100 kg/sem, generó 80 → 20% de prevención
    const s = stats({ totalKg: 80, diasEnPeriodo: 7, lineaBaseSemanalKg: 100 });
    expect(prevencionPct(s)).toBeCloseTo(20);
  });
  it("negativo cuando se supera la línea base", () => {
    const s = stats({ totalKg: 120, diasEnPeriodo: 7, lineaBaseSemanalKg: 100 });
    expect(prevencionPct(s)).toBeCloseTo(-20);
  });
});

describe("desperdicioPor100Platos", () => {
  it("null sin platos vendidos", () => {
    expect(desperdicioPor100Platos(stats({ totalKg: 10 }))).toBeNull();
  });
  it("kg por cada 100 platos", () => {
    const s = stats({ totalKg: 5, platosVendidos: 200 });
    expect(desperdicioPor100Platos(s)).toBeCloseTo(2.5);
  });
});

describe("trazabilidadPct", () => {
  it("null sin entregas", () => {
    expect(trazabilidadPct(stats())).toBeNull();
  });
  it("proporción de entregas con evidencia", () => {
    const s = stats({ entregasTotalCount: 4, entregasConEvidenciaCount: 3 });
    expect(trazabilidadPct(s)).toBeCloseTo(75);
  });
});

describe("personalCapacitadoPct", () => {
  it("null sin colaboradores", () => {
    expect(personalCapacitadoPct(stats())).toBeNull();
  });
  it("proporción de capacitados", () => {
    const s = stats({ colaboradoresTotal: 8, colaboradoresCapacitados: 2 });
    expect(personalCapacitadoPct(s)).toBeCloseTo(25);
  });
});

describe("adopcionPct", () => {
  it("días con registro sobre días del periodo", () => {
    expect(adopcionPct(stats({ diasConRegistro: 3, diasEnPeriodo: 6 }))).toBeCloseTo(50);
  });
  it("se satura a 100%", () => {
    expect(adopcionPct(stats({ diasConRegistro: 10, diasEnPeriodo: 7 }))).toBe(100);
  });
});
