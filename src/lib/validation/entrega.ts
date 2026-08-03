import { z } from "zod";
import { CategoriaResiduo } from "@/generated/prisma/enums";

export const createEntregaSchema = z.object({
  colaboradorId: z.string().optional(),
  categoria: z.enum(CategoriaResiduo),
  pesoKg: z.number().positive("El peso debe ser mayor a 0"),
  fecha: z.coerce.date(),
  receptor: z.string().min(2, "Indica el receptor/reciclador"),
  fotografiaUrl: z.url().optional(),
  constanciaUrl: z.url().optional(),
  observaciones: z.string().optional(),
});

export const updateEntregaSchema = createEntregaSchema.partial();

export const entregaFiltersSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  categoria: z.enum(CategoriaResiduo).optional(),
});
