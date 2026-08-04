/**
 * Transcripción de voz a texto (registro por voz del asistente restora).
 *
 * Cascada de respaldo, igual filosofía que `provider.ts`, consumida sólo con
 * `fetch` (sin SDKs):
 *
 *   Groq Whisper  ──falla──►  Gemini (audio inline)  ──falla──►  null
 *
 * A diferencia del chat de texto, la transcripción NO tiene un modo determinista
 * offline: convertir voz en texto requiere un modelo. Si no hay proveedor o todos
 * fallan devuelve `null`, y la ruta responde 503 para que el frontend avise.
 */

export interface ResultadoTranscripcion {
  texto: string;
  proveedor: "groq" | "gemini";
}

const TIMEOUT_MS = 30_000;

function conTimeout(): { signal: AbortSignal; cancelar: () => void } {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  return { signal: ctrl.signal, cancelar: () => clearTimeout(timer) };
}

/** Indica si hay al menos un proveedor de transcripción configurado. */
export function hayProveedorTranscripcion(): boolean {
  return Boolean(process.env.GROQ_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim());
}

// ---------------------------------------------------------------------------
// Groq Whisper (API compatible con OpenAI: /audio/transcriptions)
// ---------------------------------------------------------------------------

async function transcribirConGroq(audio: Blob, mimeType: string): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) return null;
  const modelo = process.env.GROQ_TRANSCRIBE_MODEL?.trim() || "whisper-large-v3-turbo";

  const form = new FormData();
  const ext = mimeType.includes("ogg") ? "ogg" : mimeType.includes("wav") ? "wav" : "webm";
  form.append("file", audio, `audio.${ext}`);
  form.append("model", modelo);
  form.append("language", "es");
  form.append("response_format", "json");
  // Sesgo de dominio: ayuda a Whisper con vocabulario del negocio.
  form.append(
    "prompt",
    "Registro de restaurante en español: ventas, platos, desperdicios, kilos, turno, sobreproducción, merma.",
  );

  const { signal, cancelar } = conTimeout();
  try {
    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      signal,
      body: form,
    });
    if (!res.ok) {
      console.warn(`[voz] Groq Whisper respondió ${res.status}`);
      return null;
    }
    const data = await res.json();
    const texto: string | undefined = typeof data?.text === "string" ? data.text : undefined;
    return texto?.trim() || null;
  } catch (err) {
    console.warn("[voz] Groq Whisper falló:", (err as Error).message);
    return null;
  } finally {
    cancelar();
  }
}

// ---------------------------------------------------------------------------
// Gemini (respaldo: audio inline en generateContent)
// ---------------------------------------------------------------------------

async function transcribirConGemini(audio: Blob, mimeType: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  const modelo = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

  const base64 = Buffer.from(await audio.arrayBuffer()).toString("base64");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`;

  const { signal, cancelar } = conTimeout();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      signal,
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { inline_data: { mime_type: mimeType || "audio/webm", data: base64 } },
              {
                text: "Transcribe este audio en español. Devuelve únicamente el texto dicho, sin comentarios ni comillas.",
              },
            ],
          },
        ],
        generationConfig: { temperature: 0 },
      }),
    });
    if (!res.ok) {
      console.warn(`[voz] Gemini respondió ${res.status}`);
      return null;
    }
    const data = await res.json();
    const texto: string | undefined = data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? "")
      .join("");
    return texto?.trim() || null;
  } catch (err) {
    console.warn("[voz] Gemini falló:", (err as Error).message);
    return null;
  } finally {
    cancelar();
  }
}

/**
 * Transcribe un audio probando Groq Whisper y luego Gemini. Devuelve `null` si
 * ninguno está disponible o ambos fallan.
 */
export async function transcribirAudio(
  audio: Blob,
  mimeType: string,
): Promise<ResultadoTranscripcion | null> {
  const groq = await transcribirConGroq(audio, mimeType);
  if (groq) return { texto: groq, proveedor: "groq" };

  const gemini = await transcribirConGemini(audio, mimeType);
  if (gemini) return { texto: gemini, proveedor: "gemini" };

  return null;
}
