import { z } from "zod";
import {
  CategoriaResiduo,
  AreaProceso,
  MotivoGeneracion,
  Turno,
  DestinoPrevisto,
  RolColaborador,
} from "@/generated/prisma/enums";
import { createRegistroOperacionSchema } from "@/lib/validation/registroOperacion";
import { createEntregaSchema } from "@/lib/validation/entrega";
import { createProductoSchema } from "@/lib/validation/producto";
import { createColaboradorSchema } from "@/lib/validation/colaborador";

/**
 * Definición declarativa de los flujos que el asistente sabe completar.
 *
 * Principio de diseño: el LLM sólo produce un *borrador* en JSON. Aquí se
 * normaliza (defaults sensatos), se calcula qué falta y se construye el
 * resumen. La validación final reutiliza los MISMOS schemas Zod que usan las
 * rutas de escritura (`src/lib/validation/*`), de modo que nunca se guarda un
 * dato que el backend rechazaría. El asistente no escribe en la base de datos:
 * el guardado lo hace el frontend contra los endpoints existentes.
 */

export type FlujoId = "operacion" | "entrega" | "producto" | "colaborador";

export interface OpcionEnum {
  valor: string;
  etiqueta: string;
}

export interface CampoDef {
  clave: string;
  etiqueta: string;
  tipo: "texto" | "numero" | "fecha" | "enum" | "booleano" | "lista";
  requerido: boolean;
  opciones?: OpcionEnum[];
  descripcion?: string;
}

export interface ResumenFlujo {
  titulo: string;
  lineas: string[];
}

export interface FlujoDef {
  id: FlujoId;
  etiqueta: string;
  icono: string;
  descripcion: string;
  campos: CampoDef[];
  schema: z.ZodType;
  normalizarBorrador(borrador: Record<string, unknown>): Record<string, unknown>;
  camposFaltantes(borrador: Record<string, unknown>): CampoDef[];
  resumen(borrador: Record<string, unknown>): ResumenFlujo;
}

// ---------------------------------------------------------------------------
// Etiquetas legibles en español de cada enum del dominio.
// ---------------------------------------------------------------------------

function aOpciones(map: Record<string, string>): OpcionEnum[] {
  return Object.entries(map).map(([valor, etiqueta]) => ({ valor, etiqueta }));
}

export const ETIQUETAS_CATEGORIA: Record<string, string> = {
  [CategoriaResiduo.MERMA_PREPARACION]: "Merma de preparación",
  [CategoriaResiduo.PRODUCTO_DETERIORADO]: "Producto deteriorado",
  [CategoriaResiduo.SOBREPRODUCCION]: "Sobreproducción",
  [CategoriaResiduo.ALIMENTO_NO_VENDIDO]: "Alimento no vendido",
  [CategoriaResiduo.RESTOS_CLIENTE]: "Restos del cliente",
  [CategoriaResiduo.CARTON]: "Cartón",
  [CategoriaResiduo.VIDRIO]: "Vidrio",
  [CategoriaResiduo.PLASTICO]: "Plástico",
  [CategoriaResiduo.ACEITE_USADO]: "Aceite usado",
  [CategoriaResiduo.NO_APROVECHABLE]: "No aprovechable",
};

export const ETIQUETAS_AREA: Record<string, string> = {
  [AreaProceso.COCINA]: "Cocina",
  [AreaProceso.ALMACEN]: "Almacén",
  [AreaProceso.SALON]: "Salón",
  [AreaProceso.BARRA]: "Barra",
  [AreaProceso.LIMPIEZA]: "Limpieza",
  [AreaProceso.OTRO]: "Otro",
};

export const ETIQUETAS_MOTIVO: Record<string, string> = {
  [MotivoGeneracion.SOBREPRODUCCION]: "Sobreproducción",
  [MotivoGeneracion.ERROR_PREPARACION]: "Error de preparación",
  [MotivoGeneracion.PRODUCTO_VENCIDO]: "Producto vencido",
  [MotivoGeneracion.EXCESO_COMPRA]: "Exceso de compra",
  [MotivoGeneracion.DEVOLUCION_CLIENTE]: "Devolución del cliente",
  [MotivoGeneracion.MAL_ALMACENAMIENTO]: "Mal almacenamiento",
  [MotivoGeneracion.ERROR_PORCION]: "Error de porción",
  [MotivoGeneracion.OTRO]: "Otro",
};

export const ETIQUETAS_TURNO: Record<string, string> = {
  [Turno.MANANA]: "Mañana",
  [Turno.TARDE]: "Tarde",
  [Turno.NOCHE]: "Noche",
};

export const ETIQUETAS_DESTINO: Record<string, string> = {
  [DestinoPrevisto.RELLENO_SANITARIO]: "Relleno sanitario",
  [DestinoPrevisto.COMPOSTAJE]: "Compostaje",
  [DestinoPrevisto.DONACION]: "Donación",
  [DestinoPrevisto.VALORIZACION_RECICLADOR]: "Valorización con reciclador",
  [DestinoPrevisto.REUTILIZACION_INTERNA]: "Reutilización interna",
  [DestinoPrevisto.VENTA_SUBPRODUCTO]: "Venta de subproducto",
  [DestinoPrevisto.PENDIENTE_DEFINIR]: "Pendiente de definir",
};

export const ETIQUETAS_ROL: Record<string, string> = {
  [RolColaborador.ADMINISTRADOR]: "Administrador",
  [RolColaborador.JEFE_COCINA]: "Jefe de cocina",
  [RolColaborador.COCINERO]: "Cocinero",
  [RolColaborador.ALMACEN]: "Almacén",
  [RolColaborador.LIMPIEZA]: "Limpieza",
  [RolColaborador.SOSTENIBILIDAD]: "Sostenibilidad",
  [RolColaborador.TURNO]: "Turno",
};

/** Motivo por defecto sugerido a partir de la categoría de residuo. */
const MOTIVO_POR_CATEGORIA: Record<string, string> = {
  [CategoriaResiduo.MERMA_PREPARACION]: MotivoGeneracion.ERROR_PREPARACION,
  [CategoriaResiduo.PRODUCTO_DETERIORADO]: MotivoGeneracion.PRODUCTO_VENCIDO,
  [CategoriaResiduo.SOBREPRODUCCION]: MotivoGeneracion.SOBREPRODUCCION,
  [CategoriaResiduo.ALIMENTO_NO_VENDIDO]: MotivoGeneracion.SOBREPRODUCCION,
  [CategoriaResiduo.RESTOS_CLIENTE]: MotivoGeneracion.DEVOLUCION_CLIENTE,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function esVacio(v: unknown): boolean {
  return v === undefined || v === null || (typeof v === "string" && v.trim() === "");
}

function comoArray(v: unknown): Record<string, unknown>[] {
  return Array.isArray(v) ? (v as Record<string, unknown>[]) : [];
}

function fmtMoneda(n: unknown): string {
  const num = Number(n);
  return Number.isFinite(num) ? `S/ ${num.toFixed(2)}` : "S/ 0.00";
}

function etiquetaFecha(v: unknown): string {
  if (esVacio(v)) return "sin fecha";
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Flujo: operación diaria (ventas + producción + desperdicios)
// ---------------------------------------------------------------------------

const operacionSchema = createRegistroOperacionSchema.refine(
  (d) =>
    (d.ventas?.length ?? 0) > 0 ||
    (d.producciones?.length ?? 0) > 0 ||
    (d.desperdicios?.length ?? 0) > 0,
  { message: "Registra al menos una venta, producción o desperdicio." }
);

const flujoOperacion: FlujoDef = {
  id: "operacion",
  etiqueta: "Registrar operación del día",
  icono: "edit_note",
  descripcion:
    "Cierre diario de un turno: ventas por plato, platos preparados y desperdicios generados.",
  campos: [
    { clave: "fecha", etiqueta: "Fecha", tipo: "fecha", requerido: true },
    {
      clave: "turno",
      etiqueta: "Turno",
      tipo: "enum",
      requerido: true,
      opciones: aOpciones(ETIQUETAS_TURNO),
    },
    {
      clave: "ventas",
      etiqueta: "Ventas por plato",
      tipo: "lista",
      requerido: false,
      descripcion: "Cada venta: concepto (nombre del plato), cantidad y montoTotal en soles.",
    },
    {
      clave: "producciones",
      etiqueta: "Producción",
      tipo: "lista",
      requerido: false,
      descripcion: "Cada producción: productoAsociado, cantidadProducida y unidad.",
    },
    {
      clave: "desperdicios",
      etiqueta: "Desperdicios",
      tipo: "lista",
      requerido: false,
      descripcion:
        "Cada desperdicio: categoria, productoAsociado, cantidadKg y (opcional) motivo, area, costoManual.",
    },
    { clave: "observaciones", etiqueta: "Observaciones", tipo: "texto", requerido: false },
  ],
  schema: operacionSchema,
  normalizarBorrador(borrador) {
    const b = { ...borrador };
    const turno = typeof b.turno === "string" ? b.turno : undefined;
    const fecha = b.fecha;

    b.ventas = comoArray(b.ventas)
      .filter((v) => !esVacio(v.concepto) && !esVacio(v.cantidad))
      .map((v) => ({
        concepto: String(v.concepto).trim(),
        cantidad: Number(v.cantidad),
        montoTotal: esVacio(v.montoTotal) ? 0 : Number(v.montoTotal),
      }));

    b.producciones = comoArray(b.producciones)
      .filter((p) => !esVacio(p.productoAsociado) && !esVacio(p.cantidadProducida))
      .map((p) => ({
        productoAsociado: String(p.productoAsociado).trim(),
        cantidadProducida: Number(p.cantidadProducida),
        unidad: esVacio(p.unidad) ? "platos" : String(p.unidad).trim(),
      }));

    b.desperdicios = comoArray(b.desperdicios)
      .filter((d) => !esVacio(d.categoria) && !esVacio(d.cantidadKg))
      .map((d) => {
        const categoria = String(d.categoria);
        return {
          categoria,
          productoAsociado: esVacio(d.productoAsociado)
            ? "Sin especificar"
            : String(d.productoAsociado).trim(),
          cantidadKg: Number(d.cantidadKg),
          motivo: esVacio(d.motivo)
            ? MOTIVO_POR_CATEGORIA[categoria] ?? MotivoGeneracion.OTRO
            : String(d.motivo),
          area: esVacio(d.area) ? AreaProceso.COCINA : String(d.area),
          destinoPrevisto: esVacio(d.destinoPrevisto)
            ? DestinoPrevisto.PENDIENTE_DEFINIR
            : String(d.destinoPrevisto),
          turno: esVacio(d.turno) ? turno : String(d.turno),
          fecha: esVacio(d.fecha) ? fecha : d.fecha,
          ...(esVacio(d.costoManual) ? {} : { costoManual: Number(d.costoManual) }),
          ...(esVacio(d.observaciones) ? {} : { observaciones: String(d.observaciones) }),
        };
      });

    return b;
  },
  camposFaltantes(borrador) {
    const faltan: CampoDef[] = [];
    if (esVacio(borrador.fecha)) faltan.push(this.campos[0]!);
    if (esVacio(borrador.turno)) faltan.push(this.campos[1]!);
    const sinRegistros =
      comoArray(borrador.ventas).length === 0 &&
      comoArray(borrador.producciones).length === 0 &&
      comoArray(borrador.desperdicios).length === 0;
    if (sinRegistros) {
      faltan.push({
        clave: "registros",
        etiqueta: "Al menos una venta, producción o desperdicio",
        tipo: "lista",
        requerido: true,
      });
    }
    return faltan;
  },
  resumen(borrador) {
    const lineas: string[] = [
      `📅 Fecha: ${etiquetaFecha(borrador.fecha)}`,
      `🕑 Turno: ${ETIQUETAS_TURNO[String(borrador.turno)] ?? "—"}`,
    ];
    const ventas = comoArray(borrador.ventas);
    if (ventas.length) {
      lineas.push("🍽️ Ventas:");
      for (const v of ventas) {
        lineas.push(`   • ${v.concepto} ×${v.cantidad} — ${fmtMoneda(v.montoTotal)}`);
      }
    }
    const prod = comoArray(borrador.producciones);
    if (prod.length) {
      lineas.push("👨‍🍳 Producción:");
      for (const p of prod) {
        lineas.push(`   • ${p.productoAsociado}: ${p.cantidadProducida} ${p.unidad ?? ""}`.trim());
      }
    }
    const desp = comoArray(borrador.desperdicios);
    if (desp.length) {
      lineas.push("🗑️ Desperdicios:");
      for (const d of desp) {
        const cat = ETIQUETAS_CATEGORIA[String(d.categoria)] ?? d.categoria;
        lineas.push(`   • ${d.productoAsociado}: ${d.cantidadKg} kg — ${cat}`);
      }
    }
    if (!esVacio(borrador.observaciones)) {
      lineas.push(`📝 Observaciones: ${borrador.observaciones}`);
    }
    return { titulo: "Operación del día", lineas };
  },
};

// ---------------------------------------------------------------------------
// Flujo: entrega a reciclador / valorizador (trazabilidad)
// ---------------------------------------------------------------------------

const flujoEntrega: FlujoDef = {
  id: "entrega",
  etiqueta: "Registrar entrega a reciclador",
  icono: "recycling",
  descripcion:
    "Entrega de residuos valorizables a un reciclador o valorizador, con evidencia para la trazabilidad.",
  campos: [
    {
      clave: "categoria",
      etiqueta: "Categoría del residuo",
      tipo: "enum",
      requerido: true,
      opciones: aOpciones(ETIQUETAS_CATEGORIA),
    },
    { clave: "pesoKg", etiqueta: "Peso entregado (kg)", tipo: "numero", requerido: true },
    { clave: "fecha", etiqueta: "Fecha de entrega", tipo: "fecha", requerido: true },
    {
      clave: "receptor",
      etiqueta: "Receptor / reciclador",
      tipo: "texto",
      requerido: true,
      descripcion: "Nombre de la persona u organización que recibe.",
    },
    { clave: "fotografiaUrl", etiqueta: "URL de fotografía", tipo: "texto", requerido: false },
    { clave: "constanciaUrl", etiqueta: "URL de constancia", tipo: "texto", requerido: false },
    { clave: "observaciones", etiqueta: "Observaciones", tipo: "texto", requerido: false },
  ],
  schema: createEntregaSchema,
  normalizarBorrador(borrador) {
    const b = { ...borrador };
    if (!esVacio(b.pesoKg)) b.pesoKg = Number(b.pesoKg);
    for (const k of ["categoria", "receptor", "observaciones", "fotografiaUrl", "constanciaUrl"]) {
      if (typeof b[k] === "string") b[k] = (b[k] as string).trim();
      if (esVacio(b[k])) delete b[k];
    }
    return b;
  },
  camposFaltantes(borrador) {
    return this.campos.filter((c) => c.requerido && esVacio(borrador[c.clave]));
  },
  resumen(borrador) {
    return {
      titulo: "Entrega a reciclador",
      lineas: [
        `♻️ Categoría: ${ETIQUETAS_CATEGORIA[String(borrador.categoria)] ?? "—"}`,
        `⚖️ Peso: ${borrador.pesoKg ?? "—"} kg`,
        `📅 Fecha: ${etiquetaFecha(borrador.fecha)}`,
        `🚚 Receptor: ${borrador.receptor ?? "—"}`,
        ...(esVacio(borrador.fotografiaUrl) ? [] : [`📷 Foto: ${borrador.fotografiaUrl}`]),
        ...(esVacio(borrador.constanciaUrl) ? [] : [`📄 Constancia: ${borrador.constanciaUrl}`]),
        ...(esVacio(borrador.observaciones) ? [] : [`📝 ${borrador.observaciones}`]),
      ],
    };
  },
};

// ---------------------------------------------------------------------------
// Flujo: producto del catálogo (habilita el cálculo de pérdida económica)
// ---------------------------------------------------------------------------

const flujoProducto: FlujoDef = {
  id: "producto",
  etiqueta: "Agregar producto al catálogo",
  icono: "inventory_2",
  descripcion:
    "Producto o plato con su costo unitario, para calcular automáticamente la pérdida económica de los desperdicios.",
  campos: [
    { clave: "nombre", etiqueta: "Nombre del producto", tipo: "texto", requerido: true },
    { clave: "costoUnitario", etiqueta: "Costo unitario (S/)", tipo: "numero", requerido: true },
  ],
  schema: createProductoSchema,
  normalizarBorrador(borrador) {
    const b = { ...borrador };
    if (typeof b.nombre === "string") b.nombre = b.nombre.trim();
    if (!esVacio(b.costoUnitario)) b.costoUnitario = Number(b.costoUnitario);
    return b;
  },
  camposFaltantes(borrador) {
    return this.campos.filter((c) => c.requerido && esVacio(borrador[c.clave]));
  },
  resumen(borrador) {
    return {
      titulo: "Producto del catálogo",
      lineas: [
        `📦 Nombre: ${borrador.nombre ?? "—"}`,
        `💲 Costo unitario: ${fmtMoneda(borrador.costoUnitario)}`,
      ],
    };
  },
};

// ---------------------------------------------------------------------------
// Flujo: colaborador (personal, capacitación)
// ---------------------------------------------------------------------------

const flujoColaborador: FlujoDef = {
  id: "colaborador",
  etiqueta: "Agregar colaborador",
  icono: "group",
  descripcion: "Personal operativo del restaurante y si está capacitado en manejo de residuos.",
  campos: [
    { clave: "nombre", etiqueta: "Nombre", tipo: "texto", requerido: true },
    {
      clave: "rol",
      etiqueta: "Rol",
      tipo: "enum",
      requerido: true,
      opciones: aOpciones(ETIQUETAS_ROL),
    },
    { clave: "capacitado", etiqueta: "¿Capacitado?", tipo: "booleano", requerido: false },
  ],
  schema: createColaboradorSchema,
  normalizarBorrador(borrador) {
    const b = { ...borrador };
    if (typeof b.nombre === "string") b.nombre = b.nombre.trim();
    if (typeof b.capacitado === "string") {
      b.capacitado = /^(s[ií]|true|1|capacitad)/i.test(b.capacitado.trim());
    }
    return b;
  },
  camposFaltantes(borrador) {
    return this.campos.filter((c) => c.requerido && esVacio(borrador[c.clave]));
  },
  resumen(borrador) {
    return {
      titulo: "Colaborador",
      lineas: [
        `👤 Nombre: ${borrador.nombre ?? "—"}`,
        `🎓 Rol: ${ETIQUETAS_ROL[String(borrador.rol)] ?? "—"}`,
        `✅ Capacitado: ${borrador.capacitado ? "Sí" : "No"}`,
      ],
    };
  },
};

export const FLUJOS: Record<FlujoId, FlujoDef> = {
  operacion: flujoOperacion,
  entrega: flujoEntrega,
  producto: flujoProducto,
  colaborador: flujoColaborador,
};

export function obtenerFlujo(id: string): FlujoDef | null {
  return (FLUJOS as Record<string, FlujoDef>)[id] ?? null;
}

export function listaFlujos(): { id: FlujoId; etiqueta: string; icono: string; descripcion: string }[] {
  return Object.values(FLUJOS).map((f) => ({
    id: f.id,
    etiqueta: f.etiqueta,
    icono: f.icono,
    descripcion: f.descripcion,
  }));
}
