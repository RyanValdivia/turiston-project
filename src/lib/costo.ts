import { db } from "@/lib/db";

export async function calcularCostoTotal(params: {
  restauranteId: string;
  cantidadKg: number;
  productoId?: string | null;
  costoManual?: number | null;
}): Promise<number | null> {
  const { restauranteId, cantidadKg, productoId, costoManual } = params;

  if (productoId) {
    const producto = await db.producto.findFirst({
      where: { id: productoId, restauranteId },
    });
    if (producto) {
      return producto.costoUnitario * cantidadKg;
    }
  }

  if (costoManual != null) {
    return costoManual;
  }

  return null;
}
