import {
  type FlujoDef,
  type CampoDef,
  ETIQUETAS_CATEGORIA,
  ETIQUETAS_TURNO,
} from "@/lib/ai/flujos";
import { CategoriaResiduo, Turno, RolColaborador } from "@/generated/prisma/enums";
import type { MensajeChat } from "@/lib/ai/provider";

/**
 * Motor de diálogo DETERMINISTA. Cumple dos papeles:
 *  1. Fallback cuando no hay ningún proveedor LLM disponible (sin key / sin red).
 *  2. Garantía de que la conversación siempre avanza campo a campo.
 *
 * Es un flujo guiado: pregunta un dato a la vez y parsea la respuesta con
 * palabras clave. Usa un marcador interno `_paso` en el borrador que la ruta
 * elimina antes de validar o guardar.
 */

export interface RespuestaDialogo {
  mensaje: string;
  borrador: Record<string, unknown>;
}

// --- utilidades de parseo -------------------------------------------------

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

const PALABRAS_OMITIR = [
  "no",
  "listo",
  "ninguno",
  "ninguna",
  "nada",
  "ya",
  "siguiente",
  "continuar",
  "fin",
  "terminar",
  "eso es todo",
];

function esOmitir(texto: string): boolean {
  const n = norm(texto);
  return PALABRAS_OMITIR.includes(n);
}

function parseNumero(texto: string): number | null {
  const m = texto.replace(/,(\d)/g, ".$1").match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
}

function parseFecha(texto: string, hoy: Date): string | null {
  const n = norm(texto);
  const dia = 24 * 60 * 60 * 1000;
  if (n.includes("anteayer")) return new Date(hoy.getTime() - 2 * dia).toISOString().slice(0, 10);
  if (n.includes("ayer")) return new Date(hoy.getTime() - dia).toISOString().slice(0, 10);
  if (n.includes("hoy")) return hoy.toISOString().slice(0, 10);
  const iso = texto.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[0];
  const dmy = texto.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
  if (dmy) {
    const d = dmy[1]!.padStart(2, "0");
    const mth = dmy[2]!.padStart(2, "0");
    let y = dmy[3] ?? String(hoy.getFullYear());
    if (y.length === 2) y = `20${y}`;
    return `${y}-${mth}-${d}`;
  }
  return null;
}

function parseTurno(texto: string): string | null {
  const n = norm(texto);
  if (/(man|desayun)/.test(n)) return Turno.MANANA;
  if (/(tarde|almuerz)/.test(n)) return Turno.TARDE;
  if (/(noch|cena)/.test(n)) return Turno.NOCHE;
  return null;
}

function parseCategoria(texto: string): string | null {
  const n = norm(texto);
  if (/sobreproduc/.test(n)) return CategoriaResiduo.SOBREPRODUCCION;
  if (/(deterior|malogr|podr|vencid)/.test(n)) return CategoriaResiduo.PRODUCTO_DETERIORADO;
  if (/(no vendid|sobrante)/.test(n)) return CategoriaResiduo.ALIMENTO_NO_VENDIDO;
  if (/(merma|preparacion|recorte|cascara|pelad)/.test(n)) return CategoriaResiduo.MERMA_PREPARACION;
  if (/(cliente|resto de plato|plato dejado)/.test(n)) return CategoriaResiduo.RESTOS_CLIENTE;
  if (/carton/.test(n)) return CategoriaResiduo.CARTON;
  if (/vidrio/.test(n)) return CategoriaResiduo.VIDRIO;
  if (/plastic/.test(n)) return CategoriaResiduo.PLASTICO;
  if (/aceite/.test(n)) return CategoriaResiduo.ACEITE_USADO;
  if (/no aprovech/.test(n)) return CategoriaResiduo.NO_APROVECHABLE;
  return null;
}

function parseRol(texto: string): string | null {
  const n = norm(texto);
  if (/administr/.test(n)) return RolColaborador.ADMINISTRADOR;
  if (/jefe/.test(n)) return RolColaborador.JEFE_COCINA;
  if (/cocin/.test(n)) return RolColaborador.COCINERO;
  if (/almac/.test(n)) return RolColaborador.ALMACEN;
  if (/limpie/.test(n)) return RolColaborador.LIMPIEZA;
  if (/sosten/.test(n)) return RolColaborador.SOSTENIBILIDAD;
  if (/turno/.test(n)) return RolColaborador.TURNO;
  return null;
}

function parseBooleano(texto: string): boolean {
  return /^(s[ií]|si|claro|afirmativo|capacitad|true|1)/i.test(norm(texto));
}

function partir(texto: string): string[] {
  return texto
    .split(/[\n;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// --- parseo de listas de la operación ------------------------------------

function parseVentas(texto: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (const seg of partir(texto)) {
    if (esOmitir(seg)) continue;
    const partes = seg.split(",").map((p) => p.trim());
    if (partes.length < 2) continue;
    const cantidad = parseNumero(partes[1] ?? "");
    if (!partes[0] || cantidad == null) continue;
    out.push({
      concepto: partes[0],
      cantidad,
      montoTotal: partes[2] ? parseNumero(partes[2]) ?? 0 : 0,
    });
  }
  return out;
}

function parseDesperdicios(texto: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (const seg of partir(texto)) {
    if (esOmitir(seg)) continue;
    const partes = seg.split(",").map((p) => p.trim());
    if (partes.length < 2) continue;
    const kg = parseNumero(partes[1] ?? "");
    if (!partes[0] || kg == null) continue;
    out.push({
      productoAsociado: partes[0],
      cantidadKg: kg,
      categoria: (partes[2] && parseCategoria(partes[2])) || CategoriaResiduo.MERMA_PREPARACION,
    });
  }
  return out;
}

// --- preguntas por campo --------------------------------------------------

function opcionesTexto(campo: CampoDef): string {
  return (campo.opciones ?? []).map((o) => o.etiqueta).join(", ");
}

function preguntar(campo: CampoDef): string {
  switch (campo.tipo) {
    case "fecha":
      return `¿Para qué fecha es el registro? (por ejemplo "hoy", "ayer" o 2026-08-02)`;
    case "enum":
      return `¿${campo.etiqueta}? Opciones: ${opcionesTexto(campo)}.`;
    case "booleano":
      return `¿${campo.etiqueta} (sí/no)?`;
    case "numero":
      return `¿Cuál es ${campo.etiqueta.toLowerCase()}?`;
    default:
      return `¿Cuál es ${campo.etiqueta.toLowerCase()}?`;
  }
}

function valorDeCampo(campo: CampoDef, texto: string, hoy: Date): unknown {
  switch (campo.tipo) {
    case "fecha":
      return parseFecha(texto, hoy);
    case "numero":
      return parseNumero(texto);
    case "booleano":
      return parseBooleano(texto);
    case "enum": {
      if (campo.clave === "turno") return parseTurno(texto);
      if (campo.clave === "categoria") return parseCategoria(texto);
      if (campo.clave === "rol") return parseRol(texto);
      const n = norm(texto);
      const op = (campo.opciones ?? []).find(
        (o) => n.includes(norm(o.etiqueta)) || n.includes(norm(o.valor))
      );
      return op?.valor ?? null;
    }
    default:
      return texto.trim();
  }
}

// --- flujo genérico (entrega, producto, colaborador) ----------------------

function dialogoGenerico(
  flujo: FlujoDef,
  ultimoUsuario: string,
  borrador: Record<string, unknown>,
  hoy: Date
): RespuestaDialogo {
  const b = { ...borrador };
  const pasoAnterior = typeof b._paso === "string" ? b._paso : null;

  if (pasoAnterior && ultimoUsuario) {
    const campo = flujo.campos.find((c) => c.clave === pasoAnterior);
    if (campo) {
      const valor = valorDeCampo(campo, ultimoUsuario, hoy);
      if (valor !== null && valor !== undefined && valor !== "") b[campo.clave] = valor;
    }
  }

  const faltan = flujo.camposFaltantes(flujo.normalizarBorrador(b));
  if (faltan.length > 0) {
    const siguiente = faltan[0]!;
    b._paso = siguiente.clave;
    return { mensaje: preguntar(siguiente), borrador: b };
  }

  delete b._paso;
  return {
    mensaje: "¡Perfecto! Revisa el resumen y confirma para guardar. ✅",
    borrador: b,
  };
}

// --- flujo de operación (máquina de estados) ------------------------------

function dialogoOperacion(
  ultimoUsuario: string,
  borrador: Record<string, unknown>,
  hoy: Date
): RespuestaDialogo {
  const b = { ...borrador };
  const paso = typeof b._paso === "string" ? b._paso : "fecha_turno";

  if (paso === "fecha_turno") {
    if (ultimoUsuario) {
      const f = parseFecha(ultimoUsuario, hoy);
      if (f) b.fecha = f;
      const t = parseTurno(ultimoUsuario);
      if (t) b.turno = t;
    }
    if (!b.fecha) {
      b._paso = "fecha_turno";
      return { mensaje: preguntar({ clave: "fecha", etiqueta: "Fecha", tipo: "fecha", requerido: true }), borrador: b };
    }
    if (!b.turno) {
      b._paso = "fecha_turno";
      return {
        mensaje: `¿En qué turno? Opciones: ${Object.values(ETIQUETAS_TURNO).join(", ")}.`,
        borrador: b,
      };
    }
    b._paso = "ventas";
    return {
      mensaje:
        "Anota las ventas por plato, una por línea con el formato: **nombre, cantidad, monto en S/**.\nEjemplo:\nLomo Saltado, 40, 1200\nCeviche, 25, 750\nCuando termines escribe *listo*.",
      borrador: b,
    };
  }

  if (paso === "ventas") {
    if (ultimoUsuario && !esOmitir(ultimoUsuario)) {
      const nuevas = parseVentas(ultimoUsuario);
      if (nuevas.length) {
        b.ventas = [...(Array.isArray(b.ventas) ? b.ventas : []), ...nuevas];
        return {
          mensaje: `Anotado (${nuevas.length}). ¿Agregas otra venta o escribo *listo* para pasar a los desperdicios?`,
          borrador: b,
        };
      }
    }
    b._paso = "desperdicios";
    return {
      mensaje:
        "Ahora los desperdicios. Uno por línea con el formato: **producto, kilos, categoría**.\nEjemplo:\nArroz, 3, sobreproducción\nSi no botaste nada escribe *no*.",
      borrador: b,
    };
  }

  if (paso === "desperdicios") {
    if (ultimoUsuario && !esOmitir(ultimoUsuario)) {
      const nuevos = parseDesperdicios(ultimoUsuario);
      if (nuevos.length) {
        b.desperdicios = [...(Array.isArray(b.desperdicios) ? b.desperdicios : []), ...nuevos];
        return {
          mensaje: `Anotado (${nuevos.length}). ¿Agregas otro desperdicio o escribo *listo* para terminar?`,
          borrador: b,
        };
      }
    }
    delete b._paso;
    return {
      mensaje: "¡Listo! Revisa el resumen del cierre y confirma para guardar. ✅",
      borrador: b,
    };
  }

  delete b._paso;
  return { mensaje: "Revisa el resumen y confirma para guardar. ✅", borrador: b };
}

// --- entrada principal ----------------------------------------------------

export function responderDeterminista(
  flujo: FlujoDef,
  mensajes: MensajeChat[],
  borrador: Record<string, unknown>,
  hoy: Date = new Date()
): RespuestaDialogo {
  const ultimoUsuario = [...mensajes].reverse().find((m) => m.rol === "user")?.contenido ?? "";
  if (flujo.id === "operacion") return dialogoOperacion(ultimoUsuario, borrador, hoy);
  return dialogoGenerico(flujo, ultimoUsuario, borrador, hoy);
}

export { ETIQUETAS_CATEGORIA };
