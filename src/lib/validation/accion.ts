import { z } from "zod";

export const createAccionSchema = z.object({
  recomendacionCodigo: z.string().min(1),
  descripcion: z.string().min(2),
  notas: z.string().optional(),
});
