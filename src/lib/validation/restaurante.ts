import { z } from "zod";

export const updateRestauranteSchema = z.object({
  nombre: z.string().min(2).optional(),
  ciudad: z.string().min(2).optional(),
  lineaBaseSemanalKg: z.number().positive().nullable().optional(),
});
