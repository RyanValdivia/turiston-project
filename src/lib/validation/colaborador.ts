import { z } from "zod";
import { RolColaborador } from "@/generated/prisma/enums";

export const createColaboradorSchema = z.object({
  nombre: z.string().min(2),
  rol: z.enum(RolColaborador),
  capacitado: z.boolean().optional(),
});

export const updateColaboradorSchema = createColaboradorSchema.partial();
