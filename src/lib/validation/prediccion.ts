import { z } from "zod";

export const createPrediccionSchema = z.object({
  fecha: z.coerce.date().optional(),
});
