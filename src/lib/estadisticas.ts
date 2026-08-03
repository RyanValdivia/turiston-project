import { db } from "@/lib/db";
import { CategoriaResiduo } from "@/generated/prisma/enums";

export const VALORIZABLES: string[] = [
  CategoriaResiduo.CARTON,
  CategoriaResiduo.VIDRIO,
  CategoriaResiduo.PLASTICO,
  CategoriaResiduo.ACEITE_USADO,
];

export interface EstadisticasPeriodo {
  from: Date;
  to: Date;
  totalKg: number;
  totalCostoConocido: number;
  kgSinCosto: number;
  porCategoria: Record<string, number>;
  porArea: Record<string, number>;
  porTurno: Record<string, number>;
  porMotivo: Record<string, number>;
  categoriaMasGenerada: string | null;
  areaCritica: { area: string; kg: number; share: number } | null;
  turnoCritico: { turno: string; kg: number } | null;
  entregasPorCategoria: Record<string, number>;
  entregasTotalCount: number;
  entregasConEvidenciaCount: number;
  accionesAplicadasCount: number;
  colaboradoresTotal: number;
  colaboradoresCapacitados: number;
  diasConRegistro: number;
  diasEnPeriodo: number;
  lineaBaseSemanalKg: number | null;
  platosVendidos: number | null;
}

export async function calcularEstadisticas(
  restauranteId: string,
  from: Date,
  to: Date,
  opts: { platosVendidos?: number | null } = {}
): Promise<EstadisticasPeriodo> {
  const [residuos, entregas, accionesAplicadasCount, colaboradores, restaurante] = await Promise.all([
    db.residuo.findMany({ where: { restauranteId, fecha: { gte: from, lte: to } } }),
    db.entrega.findMany({ where: { restauranteId, fecha: { gte: from, lte: to } } }),
    db.accionAplicada.count({ where: { restauranteId, fecha: { gte: from, lte: to } } }),
    db.colaborador.findMany({ where: { restauranteId } }),
    db.restaurante.findUnique({ where: { id: restauranteId } }),
  ]);

  const porCategoria: Record<string, number> = {};
  const porArea: Record<string, number> = {};
  const porTurno: Record<string, number> = {};
  const porMotivo: Record<string, number> = {};
  let totalKg = 0;
  let totalCostoConocido = 0;
  let kgSinCosto = 0;
  const diasSet = new Set<string>();

  for (const r of residuos) {
    totalKg += r.cantidadKg;
    porCategoria[r.categoria] = (porCategoria[r.categoria] ?? 0) + r.cantidadKg;
    porArea[r.area] = (porArea[r.area] ?? 0) + r.cantidadKg;
    porTurno[r.turno] = (porTurno[r.turno] ?? 0) + r.cantidadKg;
    porMotivo[r.motivo] = (porMotivo[r.motivo] ?? 0) + r.cantidadKg;
    if (r.costoTotal != null) {
      totalCostoConocido += r.costoTotal;
    } else {
      kgSinCosto += r.cantidadKg;
    }
    diasSet.add(r.fecha.toISOString().slice(0, 10));
  }

  const categoriaMasGenerada =
    Object.entries(porCategoria).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const areaEntries = Object.entries(porArea).sort((a, b) => b[1] - a[1]);
  const areaCritica = areaEntries[0]
    ? {
        area: areaEntries[0][0],
        kg: areaEntries[0][1],
        share: totalKg > 0 ? areaEntries[0][1] / totalKg : 0,
      }
    : null;

  const turnoEntries = Object.entries(porTurno).sort((a, b) => b[1] - a[1]);
  const turnoCritico = turnoEntries[0]
    ? { turno: turnoEntries[0][0], kg: turnoEntries[0][1] }
    : null;

  const entregasPorCategoria: Record<string, number> = {};
  let entregasConEvidenciaCount = 0;
  for (const e of entregas) {
    entregasPorCategoria[e.categoria] = (entregasPorCategoria[e.categoria] ?? 0) + e.pesoKg;
    if (e.receptor && (e.fotografiaUrl || e.constanciaUrl)) entregasConEvidenciaCount += 1;
  }

  const colaboradoresCapacitados = colaboradores.filter((c) => c.capacitado).length;

  const diasEnPeriodo = Math.max(
    1,
    Math.round((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)) + 1
  );

  return {
    from,
    to,
    totalKg,
    totalCostoConocido,
    kgSinCosto,
    porCategoria,
    porArea,
    porTurno,
    porMotivo,
    categoriaMasGenerada,
    areaCritica,
    turnoCritico,
    entregasPorCategoria,
    entregasTotalCount: entregas.length,
    entregasConEvidenciaCount,
    accionesAplicadasCount,
    colaboradoresTotal: colaboradores.length,
    colaboradoresCapacitados,
    diasConRegistro: diasSet.size,
    diasEnPeriodo,
    lineaBaseSemanalKg: restaurante?.lineaBaseSemanalKg ?? null,
    platosVendidos: opts.platosVendidos ?? null,
  };
}

export function segregacionPct(stats: EstadisticasPeriodo): number | null {
  if (stats.totalKg === 0) return null;
  const noAprovechable = stats.porCategoria[CategoriaResiduo.NO_APROVECHABLE] ?? 0;
  return ((stats.totalKg - noAprovechable) / stats.totalKg) * 100;
}

export function valorizacionPct(stats: EstadisticasPeriodo): number | null {
  const kgValorizable = VALORIZABLES.reduce((sum, cat) => sum + (stats.porCategoria[cat] ?? 0), 0);
  if (kgValorizable === 0) return null;
  const kgEntregado = VALORIZABLES.reduce(
    (sum, cat) => sum + (stats.entregasPorCategoria[cat] ?? 0),
    0
  );
  return Math.min(100, (kgEntregado / kgValorizable) * 100);
}

export function prevencionPct(stats: EstadisticasPeriodo): number | null {
  if (!stats.lineaBaseSemanalKg) return null;
  const semanas = stats.diasEnPeriodo / 7;
  const kgEsperados = stats.lineaBaseSemanalKg * semanas;
  if (kgEsperados <= 0) return null;
  return ((kgEsperados - stats.totalKg) / kgEsperados) * 100;
}

export function desperdicioPor100Platos(stats: EstadisticasPeriodo): number | null {
  if (!stats.platosVendidos) return null;
  return (stats.totalKg / stats.platosVendidos) * 100;
}

export function trazabilidadPct(stats: EstadisticasPeriodo): number | null {
  if (stats.entregasTotalCount === 0) return null;
  return (stats.entregasConEvidenciaCount / stats.entregasTotalCount) * 100;
}

export function personalCapacitadoPct(stats: EstadisticasPeriodo): number | null {
  if (stats.colaboradoresTotal === 0) return null;
  return (stats.colaboradoresCapacitados / stats.colaboradoresTotal) * 100;
}

export function adopcionPct(stats: EstadisticasPeriodo): number {
  return Math.min(100, (stats.diasConRegistro / stats.diasEnPeriodo) * 100);
}

export interface TendenciaBucket {
  periodoInicio: string;
  periodoFin: string;
  totalKg: number;
  perdidaEstimada: number;
}

/**
 * Bucketiza los residuos del periodo en semanas (lunes a domingo) para graficar
 * tendencia de desperdicio. Usado por /tendencias y como entrada para /predicciones.
 */
export async function calcularTendencia(
  restauranteId: string,
  from: Date,
  to: Date
): Promise<TendenciaBucket[]> {
  const residuos = await db.residuo.findMany({
    where: { restauranteId, fecha: { gte: from, lte: to } },
    orderBy: { fecha: "asc" },
  });

  function startOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day; // semana empieza en lunes
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  const buckets = new Map<string, { inicio: Date; totalKg: number; perdidaEstimada: number }>();

  for (const r of residuos) {
    const inicio = startOfWeek(r.fecha);
    const key = inicio.toISOString().slice(0, 10);
    const bucket = buckets.get(key) ?? { inicio, totalKg: 0, perdidaEstimada: 0 };
    bucket.totalKg += r.cantidadKg;
    bucket.perdidaEstimada += r.costoTotal ?? 0;
    buckets.set(key, bucket);
  }

  return Array.from(buckets.values())
    .sort((a, b) => a.inicio.getTime() - b.inicio.getTime())
    .map((b) => {
      const fin = new Date(b.inicio);
      fin.setDate(fin.getDate() + 6);
      return {
        periodoInicio: b.inicio.toISOString().slice(0, 10),
        periodoFin: fin.toISOString().slice(0, 10),
        totalKg: b.totalKg,
        perdidaEstimada: b.perdidaEstimada,
      };
    });
}
