import { db } from "@/lib/db";
import {
  calcularEstadisticas,
  segregacionPct,
  valorizacionPct,
  prevencionPct,
  trazabilidadPct,
  personalCapacitadoPct,
  adopcionPct,
} from "@/lib/estadisticas";
import { toCsv } from "@/lib/csv";

export interface ReporteGenerado {
  resumen: Record<string, unknown>;
  csv: string;
}

export async function generarReporte(
  restauranteId: string,
  from: Date,
  to: Date
): Promise<ReporteGenerado> {
  const stats = await calcularEstadisticas(restauranteId, from, to);

  const resumen = {
    periodo: { from: stats.from, to: stats.to },
    totalKg: stats.totalKg,
    perdidaEstimada: stats.totalCostoConocido,
    kgSinCostoAsignado: stats.kgSinCosto,
    segregacionPct: segregacionPct(stats),
    valorizacionPct: valorizacionPct(stats),
    prevencionPct: prevencionPct(stats),
    trazabilidadPct: trazabilidadPct(stats),
    personalCapacitadoPct: personalCapacitadoPct(stats),
    adopcionPct: adopcionPct(stats),
    categoriaMasGenerada: stats.categoriaMasGenerada,
    areaCritica: stats.areaCritica,
    turnoCritico: stats.turnoCritico,
    accionesAplicadas: stats.accionesAplicadasCount,
  };

  const [residuos, entregas] = await Promise.all([
    db.residuo.findMany({
      where: { restauranteId, fecha: { gte: from, lte: to } },
      orderBy: { fecha: "asc" },
    }),
    db.entrega.findMany({
      where: { restauranteId, fecha: { gte: from, lte: to } },
      orderBy: { fecha: "asc" },
    }),
  ]);

  const residuoRows = residuos.map((r) => ({
    tipo: "residuo",
    id: r.id,
    fecha: r.fecha.toISOString().slice(0, 10),
    categoria: r.categoria,
    area: r.area,
    turno: r.turno,
    motivo: r.motivo,
    productoAsociado: r.productoAsociado,
    cantidadKg: r.cantidadKg,
    costoTotal: r.costoTotal ?? "",
    destinoOReceptor: r.destinoPrevisto,
    observaciones: r.observaciones ?? "",
  }));

  const entregaRows = entregas.map((e) => ({
    tipo: "entrega",
    id: e.id,
    fecha: e.fecha.toISOString().slice(0, 10),
    categoria: e.categoria,
    area: "",
    turno: "",
    motivo: "",
    productoAsociado: "",
    cantidadKg: e.pesoKg,
    costoTotal: "",
    destinoOReceptor: e.receptor,
    observaciones: [
      e.observaciones,
      e.fotografiaUrl ? `foto:${e.fotografiaUrl}` : null,
      e.constanciaUrl ? `constancia:${e.constanciaUrl}` : null,
    ]
      .filter(Boolean)
      .join(" | "),
  }));

  const csv = toCsv([...residuoRows, ...entregaRows]);

  return { resumen, csv };
}
