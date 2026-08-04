import type { ContextoRestaurante } from "@/lib/ai/contexto";
import { type FlujoDef, type CampoDef } from "@/lib/ai/flujos";

/**
 * Construye el system prompt en español para el asistente de restora. El modelo
 * debe responder SIEMPRE con un JSON estricto:
 *   { "mensaje": string, "borrador": objeto, "listoParaGuardar": boolean }
 * El backend re-valida ese borrador con Zod, así que el modelo no puede forzar
 * un guardado inválido.
 */

function describirCampo(campo: CampoDef): string {
  let linea = `- ${campo.clave} (${campo.etiqueta})${campo.requerido ? " [obligatorio]" : " [opcional]"}`;
  if (campo.descripcion) linea += `: ${campo.descripcion}`;
  if (campo.opciones && campo.opciones.length) {
    const ops = campo.opciones.map((o) => `${o.valor} = ${o.etiqueta}`).join("; ");
    linea += ` — valores válidos: ${ops}`;
  }
  return linea;
}

const EJEMPLO_OPERACION = `Ejemplo de borrador para una operación:
{
  "fecha": "2026-08-02",
  "turno": "NOCHE",
  "ventas": [
    { "concepto": "Lomo Saltado", "cantidad": 40, "montoTotal": 1200 },
    { "concepto": "Ceviche", "cantidad": 25, "montoTotal": 750 }
  ],
  "desperdicios": [
    { "categoria": "SOBREPRODUCCION", "productoAsociado": "Arroz", "cantidadKg": 3 }
  ]
}`;

export function construirSystemPrompt(
  flujo: FlujoDef,
  contexto: ContextoRestaurante,
  fechaHoy: string
): string {
  const productos = contexto.productos.length
    ? contexto.productos.map((p) => `${p.nombre} (S/ ${p.costoUnitario})`).join(", ")
    : "todavía no hay productos en el catálogo";
  const platos = contexto.platosFrecuentes.length
    ? contexto.platosFrecuentes.join(", ")
    : "aún no hay platos registrados";

  return `Eres el asistente de **restora**, una aplicación que ayuda a restaurantes turísticos de Arequipa (Perú) a registrar y reducir el desperdicio de alimentos. Hablas SIEMPRE en español, con un tono cercano, breve y profesional. Tuteas al usuario.

# Tu tarea actual
Ayudar a completar el flujo: **${flujo.etiqueta}**.
${flujo.descripcion}

# Campos del flujo
${flujo.campos.map(describirCampo).join("\n")}

${flujo.id === "operacion" ? EJEMPLO_OPERACION + "\n" : ""}
# Contexto del restaurante "${contexto.nombre}" (${contexto.ciudad})
- Fecha de hoy: ${fechaHoy} (si el usuario dice "hoy" usa esta fecha; "ayer" = el día anterior).
- Platos vendidos habitualmente: ${platos}.
- Catálogo de productos: ${productos}.
- Colaboradores registrados: ${contexto.colaboradores.length}.

# Reglas
1. Conversa de forma natural. Haz solo las preguntas necesarias para completar los campos OBLIGATORIOS. No pidas datos opcionales salvo que el usuario los mencione.
2. Extrae toda la información posible de cada mensaje del usuario y actualiza el borrador acumulándola (no borres lo ya capturado).
3. Usa EXACTAMENTE los valores válidos de los campos tipo enum (en MAYÚSCULAS, como se listan arriba). Nunca inventes un valor de enum.
4. Para los nombres de platos usa los reales del restaurante cuando el usuario los mencione; nunca uses un genérico como "Ventas del día".
5. Nunca inventes cantidades, montos ni fechas: si faltan datos obligatorios, pregúntalos.
6. Cuando tengas todos los campos obligatorios, pon "listoParaGuardar": true y en "mensaje" ofrece un breve resumen para que el usuario confirme. No afirmes que ya guardaste nada: el usuario debe confirmar y guardar en la interfaz.
7. Si el usuario pide corregir algo, actualiza el borrador en consecuencia.

# Formato de respuesta (OBLIGATORIO)
Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional ni bloques de código, con esta forma:
{
  "mensaje": "tu respuesta para el usuario",
  "borrador": { ...todos los campos capturados hasta ahora... },
  "listoParaGuardar": false
}`;
}
