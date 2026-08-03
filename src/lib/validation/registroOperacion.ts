import { z } from "zod";
import { Turno } from "@/generated/prisma/enums";
import { createResiduoSchema } from "@/lib/validation/residuo";

export const ventaItemSchema = z.object({
  concepto: z.string().min(1, "Indica el concepto vendido"),
  cantidad: z.number().positive("La cantidad debe ser mayor a 0"),
  montoTotal: z.number().nonnegative("El monto no puede ser negativo"),
});

export const produccionItemSchema = z.object({
  productoAsociado: z.string().min(1, "Indica el producto elaborado"),
  cantidadProducida: z.number().positive("La cantidad debe ser mayor a 0"),
  unidad: z.string().min(1).optional(),
});

export const residuoItemSchema = createResiduoSchema.omit({ colaboradorId: true });

export const createRegistroOperacionSchema = z.object({
  colaboradorId: z.string().optional(),
  fecha: z.coerce.date(),
  turno: z.enum(Turno),
  observaciones: z.string().optional(),
  ventas: z.array(ventaItemSchema).optional(),
  producciones: z.array(produccionItemSchema).optional(),
  desperdicios: z.array(residuoItemSchema).optional(),
});

export const updateRegistroOperacionSchema = z.object({
  colaboradorId: z.string().optional(),
  fecha: z.coerce.date().optional(),
  turno: z.enum(Turno).optional(),
  observaciones: z.string().optional(),
  ventas: z.array(ventaItemSchema).optional(),
  producciones: z.array(produccionItemSchema).optional(),
  desperdicios: z.array(residuoItemSchema).optional(),
});

export const registroOperacionFiltersSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  turno: z.enum(Turno).optional(),
  q: z.string().min(1).optional(),
});
