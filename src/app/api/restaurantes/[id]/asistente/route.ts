import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/api-helpers";
import { obtenerFlujo, type FlujoDef } from "@/lib/ai/flujos";
import { obtenerContextoRestaurante } from "@/lib/ai/contexto";
import { construirSystemPrompt } from "@/lib/ai/prompt";
import { chatComplete, extraerJSON, hayProveedorLLM, type MensajeChat } from "@/lib/ai/provider";
import { responderDeterminista } from "@/lib/ai/dialogo";

export const dynamic = "force-dynamic";

const MAX_MENSAJES = 40;
const MAX_LONGITUD = 2000;

const cuerpoSchema = z.object({
  flujo: z.string(),
  mensajes: z
    .array(
      z.object({
        rol: z.enum(["user", "assistant"]),
        contenido: z.string().min(1).max(MAX_LONGITUD),
      })
    )
    .max(MAX_MENSAJES),
  borrador: z.record(z.string(), z.unknown()).optional(),
});

/** Elimina claves internas (marcador `_paso`, etc.) antes de validar/guardar. */
function limpiarBorrador(borrador: Record<string, unknown>): Record<string, unknown> {
  const salida: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(borrador)) {
    if (k.startsWith("_")) continue;
    salida[k] = v;
  }
  return salida;
}

function construirRespuesta(
  flujo: FlujoDef,
  mensaje: string,
  borradorCrudo: Record<string, unknown>,
  proveedor: string
) {
  const normalizado = flujo.normalizarBorrador(borradorCrudo);
  const faltan = flujo.camposFaltantes(normalizado);
  const listoParaGuardar = faltan.length === 0 && flujo.schema.safeParse(limpiarBorrador(normalizado)).success;

  return NextResponse.json({
    mensaje,
    // El borrador crudo conserva `_paso` para que el motor guiado mantenga estado;
    // el borrador para guardar va limpio.
    borrador: borradorCrudo,
    borradorParaGuardar: limpiarBorrador(normalizado),
    camposFaltantes: faltan.map((c) => ({ clave: c.clave, etiqueta: c.etiqueta })),
    listoParaGuardar,
    resumen: flujo.resumen(normalizado),
    proveedor,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireSession(request, id);

    if (process.env.ASISTENTE_HABILITADO === "false") {
      return jsonError(503, "El asistente está deshabilitado.");
    }

    const body = await request.json();
    const { flujo: flujoId, mensajes, borrador } = cuerpoSchema.parse(body);

    const flujo = obtenerFlujo(flujoId);
    if (!flujo) return jsonError(400, `Flujo desconocido: ${flujoId}`);

    const borradorActual: Record<string, unknown> = borrador ? { ...borrador } : {};
    const historial: MensajeChat[] = mensajes;
    const hoy = new Date();

    // 1) Intento con LLM (Gemini → Groq). Si no hay proveedor, no hay mensajes
    //    todavía (apertura del flujo) o falla, cae al modo guiado.
    if (hayProveedorLLM() && historial.length > 0) {
      const contexto = await obtenerContextoRestaurante(id);
      const system = construirSystemPrompt(flujo, contexto, hoy.toISOString().slice(0, 10));

      // Se inyecta el borrador acumulado como pista para que el modelo no lo pierda.
      const historialConEstado: MensajeChat[] =
        Object.keys(limpiarBorrador(borradorActual)).length > 0
          ? [
              ...historial,
              {
                rol: "user",
                contenido: `(borrador acumulado hasta ahora, en JSON, para que lo completes sin perder datos: ${JSON.stringify(
                  limpiarBorrador(borradorActual)
                )})`,
              },
            ]
          : historial;

      const resultado = await chatComplete(system, historialConEstado);
      if (resultado) {
        const parsed = extraerJSON(resultado.texto);
        if (parsed && typeof parsed.mensaje === "string") {
          const nuevoBorrador =
            parsed.borrador && typeof parsed.borrador === "object"
              ? { ...limpiarBorrador(borradorActual), ...(parsed.borrador as Record<string, unknown>) }
              : borradorActual;
          return construirRespuesta(flujo, parsed.mensaje, nuevoBorrador, resultado.proveedor);
        }
      }
    }

    // 2) Fallback determinista: siempre responde.
    const { mensaje, borrador: borradorGuiado } = responderDeterminista(
      flujo,
      historial,
      borradorActual,
      hoy
    );
    return construirRespuesta(flujo, mensaje, borradorGuiado, "guiado");
  } catch (error) {
    return handleRouteError(error);
  }
}
