import { db } from "@/lib/db";
import { calcularEstadisticas } from "@/lib/estadisticas";

/**
 * Contexto (solo lectura) del restaurante que se inyecta en el prompt del
 * asistente para que sus preguntas y sugerencias sean pertinentes: catálogo de
 * productos con costos, colaboradores, platos vendidos recientemente y un
 * resumen de indicadores del último mes. Nunca modifica datos.
 */
export interface ContextoRestaurante {
  nombre: string;
  ciudad: string;
  productos: { nombre: string; costoUnitario: number }[];
  colaboradores: { nombre: string; rol: string; capacitado: boolean }[];
  platosFrecuentes: string[];
  resumenPeriodo: {
    totalKg: number;
    categoriaMasGenerada: string | null;
    valorizacionEntregas: number;
  };
}

export async function obtenerContextoRestaurante(
  restauranteId: string
): Promise<ContextoRestaurante> {
  const to = new Date();
  const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [restaurante, productos, colaboradores, ventas, stats] = await Promise.all([
    db.restaurante.findUnique({ where: { id: restauranteId } }),
    db.producto.findMany({
      where: { restauranteId },
      select: { nombre: true, costoUnitario: true },
      orderBy: { nombre: "asc" },
    }),
    db.colaborador.findMany({
      where: { restauranteId },
      select: { nombre: true, rol: true, capacitado: true },
      orderBy: { nombre: "asc" },
    }),
    db.venta.findMany({
      where: { restauranteId },
      select: { concepto: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    calcularEstadisticas(restauranteId, from, to),
  ]);

  // Platos más frecuentes (por número de registros), útil para que el asistente
  // proponga nombres reales en vez de un genérico "Ventas del día".
  const conteo = new Map<string, number>();
  for (const v of ventas) {
    const nombre = v.concepto.trim();
    if (!nombre) continue;
    conteo.set(nombre, (conteo.get(nombre) ?? 0) + 1);
  }
  const platosFrecuentes = Array.from(conteo.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([nombre]) => nombre);

  return {
    nombre: restaurante?.nombre ?? "el restaurante",
    ciudad: restaurante?.ciudad ?? "Arequipa",
    productos,
    colaboradores,
    platosFrecuentes,
    resumenPeriodo: {
      totalKg: Number(stats.totalKg.toFixed(1)),
      categoriaMasGenerada: stats.categoriaMasGenerada,
      valorizacionEntregas: stats.entregasTotalCount,
    },
  };
}
