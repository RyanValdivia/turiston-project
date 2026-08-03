import { z } from "zod";
import {
  CategoriaResiduo,
  AreaProceso,
  MotivoGeneracion,
  Turno,
  DestinoPrevisto,
} from "@/generated/prisma/enums";

export const createResiduoSchema = z.object({
  colaboradorId: z.string().optional(),
  categoria: z.enum(CategoriaResiduo),
  cantidadKg: z.number().positive("La cantidad debe ser mayor a 0"),
  area: z.enum(AreaProceso),
  areaDetalle: z.string().optional(),
  productoAsociado: z.string().min(1, "Indica el plato o producto asociado"),
  productoId: z.string().optional(),
  motivo: z.enum(MotivoGeneracion),
  fecha: z.coerce.date(),
  turno: z.enum(Turno),
  destinoPrevisto: z.enum(DestinoPrevisto),
  costoManual: z.number().nonnegative().optional(),
  observaciones: z.string().optional(),
});

export const updateResiduoSchema = createResiduoSchema.partial();

export const residuoFiltersSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  categoria: z.enum(CategoriaResiduo).optional(),
  area: z.enum(AreaProceso).optional(),
  turno: z.enum(Turno).optional(),
});
