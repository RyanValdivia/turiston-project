import type { RespuestaAsistente } from "@/lib/asistente";

/**
 * Vista viva del borrador que el asistente va completando: resumen de lo
 * capturado y los campos que todavía faltan. Da transparencia al usuario antes
 * de confirmar.
 */
export function BorradorPanel({ respuesta }: { respuesta: RespuestaAsistente }) {
  const tieneContenido = respuesta.resumen.lineas.length > 0;
  if (!tieneContenido && respuesta.camposFaltantes.length === 0) return null;

  return (
    <div className="rounded-xl border border-outline-variant/50 bg-surface-container-low p-sm text-body-sm">
      <div className="flex items-center gap-2 mb-xs">
        <span className="material-symbols-outlined text-secondary" style={{ fontSize: 18 }}>
          fact_check
        </span>
        <span className="font-label-md text-label-md font-bold text-on-surface">
          {respuesta.resumen.titulo}
        </span>
      </div>

      {tieneContenido && (
        <ul className="space-y-0.5 text-on-surface-variant">
          {respuesta.resumen.lineas.map((linea, i) => (
            <li key={i} className="whitespace-pre-wrap leading-snug">
              {linea}
            </li>
          ))}
        </ul>
      )}

      {respuesta.camposFaltantes.length > 0 && (
        <div className="mt-xs flex flex-wrap gap-1">
          {respuesta.camposFaltantes.map((c) => (
            <span
              key={c.clave}
              className="inline-flex items-center gap-1 rounded-full bg-error/10 px-2 py-0.5 text-label-sm font-label-sm text-error"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                pending
              </span>
              Falta: {c.etiqueta}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
