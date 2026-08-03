import { CategoriaResiduo, MotivoGeneracion } from "@/generated/prisma/enums";
import { VALORIZABLES, valorizacionPct, type EstadisticasPeriodo } from "@/lib/estadisticas";

export interface Recomendacion {
  codigo: string;
  titulo: string;
  descripcion: string;
  prioridad: number; // 1 = más urgente
}

function share(stats: EstadisticasPeriodo, kg: number): number {
  return stats.totalKg > 0 ? kg / stats.totalKg : 0;
}

function topMotivo(stats: EstadisticasPeriodo): string | null {
  return Object.entries(stats.porMotivo).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

/**
 * Rule-based recommendation engine (Paso 5). No DB access, no ML — pure function
 * over the same aggregated stats object the indicadores endpoint computes.
 */
export function generarRecomendaciones(stats: EstadisticasPeriodo): Recomendacion[] {
  const recomendaciones: Recomendacion[] = [];

  const sobreproduccionShare = share(stats, stats.porCategoria[CategoriaResiduo.SOBREPRODUCCION] ?? 0);
  if (sobreproduccionShare > 0.15) {
    recomendaciones.push({
      codigo: "R1_AJUSTAR_COMPRAS",
      titulo: "Reducir producción inicial / ajustar compras",
      descripcion: `La sobreproducción representa ${(sobreproduccionShare * 100).toFixed(1)}% del desperdicio total. Ajusta las cantidades preparadas y las compras según la demanda real.`,
      prioridad: 1,
    });
  }

  if (topMotivo(stats) === MotivoGeneracion.EXCESO_COMPRA) {
    recomendaciones.push({
      codigo: "R2_AJUSTAR_COMPRAS_DEMANDA",
      titulo: "Ajustar compras según demanda histórica",
      descripcion:
        "El exceso de compra es la causa más frecuente de desperdicio en el periodo. Revisa el historial de consumo antes de comprar.",
      prioridad: 2,
    });
  }

  const deteriorioShare = share(stats, stats.porCategoria[CategoriaResiduo.PRODUCTO_DETERIORADO] ?? 0);
  const productoVencidoShare = share(stats, stats.porMotivo[MotivoGeneracion.PRODUCTO_VENCIDO] ?? 0);
  if (deteriorioShare > 0.15 || productoVencidoShare > 0.15) {
    recomendaciones.push({
      codigo: "R3_MEJORAR_ALMACENAMIENTO",
      titulo: "Mejorar almacenamiento / rotación FIFO",
      descripcion:
        "Alta proporción de producto deteriorado o vencido. Revisa condiciones de almacenamiento y aplica rotación FIFO.",
      prioridad: 2,
    });
  }

  const restosClienteShare = share(stats, stats.porCategoria[CategoriaResiduo.RESTOS_CLIENTE] ?? 0);
  if (restosClienteShare > 0.15) {
    recomendaciones.push({
      codigo: "R4_MODIFICAR_PORCION",
      titulo: "Modificar tamaño de porción",
      descripcion: `Los restos dejados por clientes representan ${(restosClienteShare * 100).toFixed(1)}% del desperdicio. Evalúa reducir el tamaño de las porciones.`,
      prioridad: 3,
    });
  }

  const noVendidoShare = share(stats, stats.porCategoria[CategoriaResiduo.ALIMENTO_NO_VENDIDO] ?? 0);
  if (noVendidoShare > 0.15) {
    recomendaciones.push({
      codigo: "R5_REDUCIR_PRODUCCION",
      titulo: "Reducir producción inicial / promociones de cierre / donación",
      descripcion:
        "Alto volumen de alimento no vendido. Considera reducir la producción inicial, aplicar promociones de cierre o donar el excedente.",
      prioridad: 2,
    });
  }

  const categoriasSinEntrega = VALORIZABLES.filter(
    (cat) => (stats.porCategoria[cat] ?? 0) > 0 && (stats.entregasPorCategoria[cat] ?? 0) === 0
  );
  if (categoriasSinEntrega.length > 0) {
    recomendaciones.push({
      codigo: "R6_COORDINAR_RECOJO",
      titulo: "Coordinar recojo con recicladores",
      descripcion: `Hay residuos generados sin entrega registrada en: ${categoriasSinEntrega.join(", ")}. Coordina la recolección con un reciclador u operador de valorización.`,
      prioridad: 2,
    });
  }

  const malAlmacenamientoShare = share(stats, stats.porMotivo[MotivoGeneracion.MAL_ALMACENAMIENTO] ?? 0);
  if (malAlmacenamientoShare > 0.15) {
    recomendaciones.push({
      codigo: "R7_CAPACITAR_INVENTARIO",
      titulo: "Capacitar personal en manejo de inventario",
      descripcion:
        "El mal almacenamiento es una causa relevante de desperdicio. Capacita al personal de almacén en manejo de inventario.",
      prioridad: 3,
    });
  }

  if (stats.areaCritica && stats.areaCritica.share > 0.4) {
    recomendaciones.push({
      codigo: "R8_CAPACITAR_AREA_CRITICA",
      titulo: `Capacitar personal del área crítica (${stats.areaCritica.area})`,
      descripcion: `El área "${stats.areaCritica.area}" concentra ${(stats.areaCritica.share * 100).toFixed(1)}% del desperdicio total.`,
      prioridad: 2,
    });
  }

  const valorizacion = valorizacionPct(stats);
  if (valorizacion != null && valorizacion < 30) {
    recomendaciones.push({
      codigo: "R9_AUMENTAR_VALORIZACION",
      titulo: "Reutilizar subproducto permitido / aumentar entregas",
      descripcion: `Solo ${valorizacion.toFixed(1)}% de los residuos valorizables se están entregando para aprovechamiento.`,
      prioridad: 3,
    });
  }

  if (recomendaciones.length === 0) {
    recomendaciones.push({
      codigo: "R10_SIN_ALERTAS",
      titulo: "Sin alertas críticas",
      descripcion: "No se detectaron patrones críticos de desperdicio en el periodo. Continúa monitoreando.",
      prioridad: 5,
    });
  }

  return recomendaciones.sort((a, b) => a.prioridad - b.prioridad);
}
