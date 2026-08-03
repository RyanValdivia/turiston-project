import { z } from "zod";

export const createPrediccionSchema = z.object({
  tipo: z.string().min(1).optional(),
  horizonteDias: z.number().int().positive().optional(),
});
