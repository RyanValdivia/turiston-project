import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { transcribirAudio, hayProveedorTranscripcion } from "@/lib/ai/transcripcion";

const audio = new Blob([new Uint8Array([1, 2, 3, 4])], { type: "audio/webm" });

function mockFetchOnce(handler: (url: string) => Response | Promise<Response>) {
  return vi.fn((input: unknown) => Promise.resolve(handler(String(input))));
}

const OLD_ENV = { ...process.env };

beforeEach(() => {
  process.env.GROQ_API_KEY = "groq-key";
  process.env.GEMINI_API_KEY = "gemini-key";
});

afterEach(() => {
  process.env = { ...OLD_ENV };
  vi.restoreAllMocks();
});

describe("hayProveedorTranscripcion", () => {
  it("true si hay Groq o Gemini", () => {
    expect(hayProveedorTranscripcion()).toBe(true);
  });
  it("false si no hay ninguna key", () => {
    delete process.env.GROQ_API_KEY;
    delete process.env.GEMINI_API_KEY;
    expect(hayProveedorTranscripcion()).toBe(false);
  });
});

describe("transcribirAudio", () => {
  it("usa Groq Whisper cuando responde OK", async () => {
    const fetchMock = mockFetchOnce((url) => {
      expect(url).toContain("groq.com");
      return new Response(JSON.stringify({ text: "vendimos 40 lomo saltado" }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const r = await transcribirAudio(audio, "audio/webm");
    expect(r).toEqual({ texto: "vendimos 40 lomo saltado", proveedor: "groq" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("cae a Gemini cuando Groq falla", async () => {
    const fetchMock = vi.fn((input: unknown) => {
      const url = String(input);
      if (url.includes("groq.com")) return Promise.resolve(new Response("err", { status: 500 }));
      return Promise.resolve(
        new Response(
          JSON.stringify({ candidates: [{ content: { parts: [{ text: "botamos 3 kg de arroz" }] } }] }),
          { status: 200 },
        ),
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const r = await transcribirAudio(audio, "audio/webm");
    expect(r).toEqual({ texto: "botamos 3 kg de arroz", proveedor: "gemini" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("devuelve null cuando ambos proveedores fallan", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response("err", { status: 500 }))));
    const r = await transcribirAudio(audio, "audio/webm");
    expect(r).toBeNull();
  });

  it("devuelve null cuando no hay keys configuradas (no llama a la red)", async () => {
    delete process.env.GROQ_API_KEY;
    delete process.env.GEMINI_API_KEY;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const r = await transcribirAudio(audio, "audio/webm");
    expect(r).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("ignora respuesta de Groq con texto vacío y cae a Gemini", async () => {
    const fetchMock = vi.fn((input: unknown) => {
      const url = String(input);
      if (url.includes("groq.com"))
        return Promise.resolve(new Response(JSON.stringify({ text: "   " }), { status: 200 }));
      return Promise.resolve(
        new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "hola" }] } }] }), {
          status: 200,
        }),
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const r = await transcribirAudio(audio, "audio/webm");
    expect(r).toEqual({ texto: "hola", proveedor: "gemini" });
  });
});
