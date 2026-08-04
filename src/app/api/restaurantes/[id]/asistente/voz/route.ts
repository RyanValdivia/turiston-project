import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/api-helpers";
import { transcribirAudio } from "@/lib/ai/transcripcion";

export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await requireSession(request, id);

    if (process.env.ASISTENTE_HABILITADO === "false") {
      return jsonError(503, "El asistente está deshabilitado.");
    }

    const form = await request.formData().catch(() => null);
    const audio = form?.get("audio");
    if (!(audio instanceof Blob)) {
      return jsonError(400, "Falta el archivo de audio.");
    }
    if (audio.size === 0) {
      return jsonError(400, "El audio está vacío.");
    }
    if (audio.size > MAX_BYTES) {
      return jsonError(400, "El audio es demasiado largo. Graba un mensaje más corto.");
    }
    if (audio.type && !audio.type.startsWith("audio/")) {
      return jsonError(400, "El archivo no es de audio.");
    }

    const resultado = await transcribirAudio(audio, audio.type || "audio/webm");
    if (!resultado) {
      return jsonError(503, "La transcripción por voz no está disponible.");
    }
    if (!resultado.texto.trim()) {
      return jsonError(422, "No se detectó voz en el audio. Inténtalo de nuevo.");
    }

    return NextResponse.json({ texto: resultado.texto, proveedor: resultado.proveedor });
  } catch (error) {
    return handleRouteError(error);
  }
}
