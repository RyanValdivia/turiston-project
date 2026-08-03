import { z } from "zod";

export const createProductoSchema = z.object({
  nombre: z.string().min(2),
  costoUnitario: z.number().positive("El costo unitario debe ser mayor a 0"),
});

export const updateProductoSchema = createProductoSchema.partial();
