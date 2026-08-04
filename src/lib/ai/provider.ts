/**
 * Proveedor de LLM con cascada de respaldo, consumido sólo con `fetch` (sin
 * SDKs, para no añadir dependencias al backend):
 *
 *   Gemini  ──falla──►  Groq  ──falla──►  null
 *
 * Si devuelve `null`, la ruta del asistente cae al motor determinista
 * (`dialogo.ts`), de modo que la conversación NUNCA se rompe en una demo.
 * Ambos proveedores se piden en modo JSON para que la salida sea parseable.
 */

export interface MensajeChat {
  rol: "user" | "assistant";
  contenido: string;
}

export interface ResultadoLLM {
  texto: string;
  proveedor: "gemini" | "groq";
}

const TIMEOUT_MS = 20_000;

function conTimeout(signal?: AbortSignal): { signal: AbortSignal; cancelar: () => void } {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  if (signal) signal.addEventListener("abort", () => ctrl.abort(), { once: true });
  return { signal: ctrl.signal, cancelar: () => clearTimeout(timer) };
}

// ---------------------------------------------------------------------------
// Gemini
// ---------------------------------------------------------------------------

async function llamarGemini(
  system: string,
  mensajes: MensajeChat[]
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  const modelo = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

  const contents = mensajes.map((m) => ({
    role: m.rol === "assistant" ? "model" : "user",
    parts: [{ text: m.contenido }],
  }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`;
  const { signal, cancelar } = conTimeout();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      signal,
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents,
        generationConfig: { temperature: 0.3, responseMimeType: "application/json" },
      }),
    });
    if (!res.ok) {
      console.warn(`[ai] Gemini respondió ${res.status}`);
      return null;
    }
    const data = await res.json();
    const texto: string | undefined =
      data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ??
      undefined;
    return texto?.trim() || null;
  } catch (err) {
    console.warn("[ai] Gemini falló:", (err as Error).message);
    return null;
  } finally {
    cancelar();
  }
}

// ---------------------------------------------------------------------------
// Groq (API compatible con OpenAI)
// ---------------------------------------------------------------------------

async function llamarGroq(system: string, mensajes: MensajeChat[]): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) return null;
  const modelo = process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile";

  const messages = [
    { role: "system", content: system },
    ...mensajes.map((m) => ({ role: m.rol, content: m.contenido })),
  ];

  const { signal, cancelar } = conTimeout();
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal,
      body: JSON.stringify({
        model: modelo,
        messages,
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      console.warn(`[ai] Groq respondió ${res.status}`);
      return null;
    }
    const data = await res.json();
    const texto: string | undefined = data?.choices?.[0]?.message?.content;
    return texto?.trim() || null;
  } catch (err) {
    console.warn("[ai] Groq falló:", (err as Error).message);
    return null;
  } finally {
    cancelar();
  }
}

/** Indica si hay al menos un proveedor LLM configurado. */
export function hayProveedorLLM(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim() || process.env.GROQ_API_KEY?.trim());
}

/**
 * Completa una conversación probando Gemini y luego Groq. Devuelve `null` si
 * ninguno está disponible o ambos fallan (para caer al modo guiado).
 */
export async function chatComplete(
  system: string,
  mensajes: MensajeChat[]
): Promise<ResultadoLLM | null> {
  const gemini = await llamarGemini(system, mensajes);
  if (gemini) return { texto: gemini, proveedor: "gemini" };

  const groq = await llamarGroq(system, mensajes);
  if (groq) return { texto: groq, proveedor: "groq" };

  return null;
}

/** Extrae el primer objeto JSON de un texto (tolerante a texto alrededor). */
export function extraerJSON(texto: string): Record<string, unknown> | null {
  const limpio = texto.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(limpio) as Record<string, unknown>;
  } catch {
    // Intento de rescate: primer {...} balanceado.
    const inicio = limpio.indexOf("{");
    const fin = limpio.lastIndexOf("}");
    if (inicio !== -1 && fin > inicio) {
      try {
        return JSON.parse(limpio.slice(inicio, fin + 1)) as Record<string, unknown>;
      } catch {
        return null;
      }
    }
    return null;
  }
}
