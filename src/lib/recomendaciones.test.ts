import { describe, it, expect, vi } from "vitest";

// estadisticas.ts (importado transitivamente) carga @/lib/db en tiempo de módulo.
// Las funciones bajo prueba son puras, así que aislamos la capa de datos.
vi.mock("@/lib/db", () => ({ db: {} }));

import { generarRecomendaciones } from "@/lib/recomendaciones";
import type { EstadisticasPeriodo } from "@/lib/estadisticas";
import { CategoriaResiduo, MotivoGeneracion } from "@/generated/prisma/enums";

/**
 * Base neutra: no dispara ninguna regla R1–R9.
 * - Categoría sin regla (MERMA_PREPARACION) concentra el peso.
 * - Áreas repartidas para que ninguna supere el 40%.
 * - Motivo dominante OTRO, sin valorizables generados.
 */
function baseStats(overrides: Partial<EstadisticasPeriodo> = {}): EstadisticasPeriodo {
  return {
    from: new Date("2026-01-01"),
    to: new Date("2026-01-07"),
    totalKg: 100,
    totalCostoConocido: 0,
    kgSinCosto: 0,
    porCategoria: { [CategoriaResiduo.MERMA_PREPARACION]: 100 },
    porArea: { COCINA: 34, ALMACEN: 33, SALON: 33 },
    porTurno: { MANANA: 100 },
    porMotivo: { [MotivoGeneracion.OTRO]: 100 },
    categoriaMasGenerada: CategoriaResiduo.MERMA_PREPARACION,
    areaCritica: { area: "COCINA", kg: 34, share: 0.34 },
    turnoCritico: { turno: "MANANA", kg: 100 },
    entregasPorCategoria: {},
    entregasTotalCount: 0,
    entregasConEvidenciaCount: 0,
    accionesAplicadasCount: 0,
    colaboradoresTotal: 0,
    colaboradoresCapacitados: 0,
    diasConRegistro: 5,
    diasEnPeriodo: 7,
    lineaBaseSemanalKg: null,
    platosVendidos: null,
    ...overrides,
  };
}

const codigos = (stats: EstadisticasPeriodo) => generarRecomendaciones(stats).map((r) => r.codigo);

describe("generarRecomendaciones", () => {
  it("sin patrones críticos devuelve solo R10", () => {
    expect(codigos(baseStats())).toEqual(["R10_SIN_ALERTAS"]);
  });

  it("R1 cuando la sobreproducción supera el 15%", () => {
    const stats = baseStats({
      porCategoria: { [CategoriaResiduo.MERMA_PREPARACION]: 80, [CategoriaResiduo.SOBREPRODUCCION]: 20 },
    });
    expect(codigos(stats)).toContain("R1_AJUSTAR_COMPRAS");
  });

  it("R1 NO se dispara justo en el umbral (15% exacto)", () => {
    const stats = baseStats({
      porCategoria: { [CategoriaResiduo.MERMA_PREPARACION]: 85, [CategoriaResiduo.SOBREPRODUCCION]: 15 },
    });
    expect(codigos(stats)).not.toContain("R1_AJUSTAR_COMPRAS");
  });

  it("R2 cuando el motivo dominante es EXCESO_COMPRA", () => {
    const stats = baseStats({
      porMotivo: { [MotivoGeneracion.EXCESO_COMPRA]: 60, [MotivoGeneracion.OTRO]: 40 },
    });
    expect(codigos(stats)).toContain("R2_AJUSTAR_COMPRAS_DEMANDA");
  });

  it("R3 por producto deteriorado o vencido", () => {
    const stats = baseStats({
      porCategoria: { [CategoriaResiduo.MERMA_PREPARACION]: 70, [CategoriaResiduo.PRODUCTO_DETERIORADO]: 30 },
    });
    expect(codigos(stats)).toContain("R3_MEJORAR_ALMACENAMIENTO");
  });

  it("R4 por restos de cliente elevados", () => {
    const stats = baseStats({
      porCategoria: { [CategoriaResiduo.MERMA_PREPARACION]: 70, [CategoriaResiduo.RESTOS_CLIENTE]: 30 },
    });
    expect(codigos(stats)).toContain("R4_MODIFICAR_PORCION");
  });

  it("R5 por alimento no vendido", () => {
    const stats = baseStats({
      porCategoria: { [CategoriaResiduo.MERMA_PREPARACION]: 70, [CategoriaResiduo.ALIMENTO_NO_VENDIDO]: 30 },
    });
    expect(codigos(stats)).toContain("R5_REDUCIR_PRODUCCION");
  });

  it("R6 cuando hay valorizable generado sin entrega registrada", () => {
    const stats = baseStats({
      porCategoria: { [CategoriaResiduo.MERMA_PREPARACION]: 90, [CategoriaResiduo.PLASTICO]: 10 },
      entregasPorCategoria: {},
    });
    expect(codigos(stats)).toContain("R6_COORDINAR_RECOJO");
  });

  it("R6 NO se dispara si el valorizable ya fue entregado", () => {
    const stats = baseStats({
      porCategoria: { [CategoriaResiduo.MERMA_PREPARACION]: 90, [CategoriaResiduo.PLASTICO]: 10 },
      entregasPorCategoria: { [CategoriaResiduo.PLASTICO]: 10 },
    });
    expect(codigos(stats)).not.toContain("R6_COORDINAR_RECOJO");
  });

  it("R7 por mal almacenamiento", () => {
    const stats = baseStats({
      porMotivo: { [MotivoGeneracion.MAL_ALMACENAMIENTO]: 30, [MotivoGeneracion.OTRO]: 70 },
    });
    expect(codigos(stats)).toContain("R7_CAPACITAR_INVENTARIO");
  });

  it("R8 cuando un área concentra más del 40%", () => {
    const stats = baseStats({
      areaCritica: { area: "COCINA", kg: 45, share: 0.45 },
    });
    const recs = generarRecomendaciones(stats);
    const r8 = recs.find((r) => r.codigo === "R8_CAPACITAR_AREA_CRITICA");
    expect(r8).toBeDefined();
    expect(r8!.titulo).toContain("COCINA");
  });

  it("R9 cuando la valorización es baja (<30%)", () => {
    const stats = baseStats({
      porCategoria: { [CategoriaResiduo.MERMA_PREPARACION]: 90, [CategoriaResiduo.CARTON]: 10 },
      entregasPorCategoria: { [CategoriaResiduo.CARTON]: 1 }, // 10% valorizado
    });
    expect(codigos(stats)).toContain("R9_AUMENTAR_VALORIZACION");
  });

  it("ordena las recomendaciones por prioridad ascendente", () => {
    const stats = baseStats({
      porCategoria: {
        [CategoriaResiduo.SOBREPRODUCCION]: 40, // R1 prioridad 1
        [CategoriaResiduo.RESTOS_CLIENTE]: 60, // R4 prioridad 3
      },
    });
    const prioridades = generarRecomendaciones(stats).map((r) => r.prioridad);
    const ordenado = [...prioridades].sort((a, b) => a - b);
    expect(prioridades).toEqual(ordenado);
  });

  it("nunca devuelve una lista vacía", () => {
    expect(generarRecomendaciones(baseStats()).length).toBeGreaterThan(0);
  });
});
