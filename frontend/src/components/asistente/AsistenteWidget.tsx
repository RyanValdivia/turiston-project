import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAsistente } from "@/hooks/useAsistente";
import { FLUJOS_DISPONIBLES, type FlujoId } from "@/lib/asistente";
import { BorradorPanel } from "@/components/asistente/BorradorPanel";
import { ResumenConfirmacion } from "@/components/asistente/ResumenConfirmacion";

/** Renderiza texto con **negritas** y saltos de línea de forma segura. */
function TextoRico({ texto }: { texto: string }) {
  return (
    <>
      {texto.split("\n").map((linea, i) => (
        <span key={i} className="block">
          {linea.split(/(\*\*[^*]+\*\*)/g).map((parte, j) =>
            parte.startsWith("**") && parte.endsWith("**") ? (
              <strong key={j}>{parte.slice(2, -2)}</strong>
            ) : (
              <span key={j}>{parte}</span>
            ),
          )}
        </span>
      ))}
    </>
  );
}

export function AsistenteWidget() {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [editando, setEditando] = useState(false);
  const navigate = useNavigate();
  const a = useAsistente();
  const finRef = useRef<HTMLDivElement>(null);

  const listo = a.ultimaRespuesta?.listoParaGuardar ?? false;
  const mostrarConfirmacion = listo && !editando;

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [a.mensajes, a.ultimaRespuesta]);

  // Al recibir una respuesta que ya no está lista para guardar, se sale del modo edición.
  useEffect(() => {
    if (!listo) setEditando(false);
  }, [listo]);

  if (!a.restauranteId) return null;

  async function onEnviar(e: React.FormEvent) {
    e.preventDefault();
    const t = texto;
    setTexto("");
    await a.enviar(t);
  }

  async function onConfirmar() {
    const res = await a.guardar();
    if (res) {
      const ruta = res.rutaSugerida;
      a.reiniciar();
      setAbierto(false);
      navigate({ to: ruta });
    }
  }

  function elegirFlujo(flujo: FlujoId) {
    void a.iniciarFlujo(flujo);
  }

  return (
    <>
      {/* Burbuja flotante */}
      <button
        type="button"
        aria-label="Abrir asistente"
        onClick={() => setAbierto((v) => !v)}
        className="fixed z-[60] right-4 bottom-[88px] lg:bottom-6 lg:right-6 w-14 h-14 rounded-full bg-primary text-on-primary shadow-lg flex items-center justify-center active:scale-90 transition-transform"
      >
        <span className="material-symbols-outlined" data-weight="fill" style={{ fontSize: 28 }}>
          {abierto ? "close" : "smart_toy"}
        </span>
      </button>

      {abierto && (
        <div className="fixed z-[60] right-2 left-2 bottom-[152px] lg:left-auto lg:right-6 lg:bottom-24 lg:w-[400px] max-h-[70vh] flex flex-col rounded-2xl bg-surface-container-lowest border border-outline-variant shadow-2xl overflow-hidden">
          {/* Cabecera */}
          <header className="flex items-center justify-between px-md py-sm bg-primary text-on-primary shrink-0">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined" data-weight="fill">
                smart_toy
              </span>
              <div>
                <div className="font-label-md text-label-md font-bold leading-tight">
                  Asistente restora
                </div>
                <div className="text-label-sm opacity-80 leading-tight">
                  {a.flujo
                    ? FLUJOS_DISPONIBLES.find((f) => f.id === a.flujo)?.etiqueta
                    : "¿Qué quieres registrar?"}
                </div>
              </div>
            </div>
            {a.flujo && (
              <button
                type="button"
                onClick={() => a.reiniciar()}
                className="text-on-primary/90 hover:text-on-primary flex items-center gap-1 text-label-sm"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  restart_alt
                </span>
                Cambiar
              </button>
            )}
          </header>

          {/* Cuerpo */}
          <div className="flex-1 overflow-y-auto p-md space-y-sm">
            {!a.flujo ? (
              <div className="space-y-sm">
                <p className="text-body-sm text-on-surface-variant">
                  Hola 👋 Cuéntame qué necesitas registrar y lo completo contigo por chat.
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {FLUJOS_DISPONIBLES.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => elegirFlujo(f.id)}
                      className="flex items-start gap-3 rounded-xl border border-outline-variant bg-surface p-sm text-left hover:bg-surface-variant active:scale-[0.98] transition-all"
                    >
                      <span className="material-symbols-outlined text-primary shrink-0">
                        {f.icono}
                      </span>
                      <span>
                        <span className="block font-label-md text-label-md font-bold text-on-surface">
                          {f.etiqueta}
                        </span>
                        <span className="block text-label-sm text-on-surface-variant">
                          {f.descripcion}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {a.mensajes.map((m, i) => (
                  <div
                    key={i}
                    className={m.rol === "user" ? "flex justify-end" : "flex justify-start"}
                  >
                    <div
                      className={
                        m.rol === "user"
                          ? "max-w-[85%] rounded-2xl rounded-br-sm bg-primary text-on-primary px-3 py-2 text-body-sm"
                          : "max-w-[90%] rounded-2xl rounded-bl-sm bg-surface-variant text-on-surface px-3 py-2 text-body-sm"
                      }
                    >
                      <TextoRico texto={m.contenido} />
                    </div>
                  </div>
                ))}

                {a.estado === "escribiendo" && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-bl-sm bg-surface-variant text-on-surface-variant px-3 py-2 text-body-sm">
                      Escribiendo…
                    </div>
                  </div>
                )}

                {a.ultimaRespuesta && !mostrarConfirmacion && (
                  <BorradorPanel respuesta={a.ultimaRespuesta} />
                )}

                {a.ultimaRespuesta && mostrarConfirmacion && (
                  <ResumenConfirmacion
                    respuesta={a.ultimaRespuesta}
                    guardando={a.estado === "guardando"}
                    onConfirmar={onConfirmar}
                    onEditar={() => setEditando(true)}
                  />
                )}

                {a.error && <p className="text-body-sm text-error">{a.error}</p>}
                <div ref={finRef} />
              </>
            )}
          </div>

          {/* Entrada */}
          {a.flujo && (!mostrarConfirmacion || editando) && (
            <form
              onSubmit={onEnviar}
              className="shrink-0 flex items-center gap-2 border-t border-outline-variant p-sm bg-surface"
            >
              <input
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Escribe tu respuesta…"
                className="flex-1 h-11 px-3 rounded-full bg-surface-container border border-outline-variant focus:border-primary outline-none text-body-md text-on-surface"
                disabled={a.estado === "escribiendo" || a.estado === "guardando"}
              />
              <button
                type="submit"
                aria-label="Enviar"
                disabled={!texto.trim() || a.estado === "escribiendo"}
                className="w-11 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50"
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
