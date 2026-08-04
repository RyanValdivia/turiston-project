import type { RespuestaAsistente } from "@/lib/asistente";

/**
 * Paso final: muestra el resumen y pide confirmación explícita antes de
 * guardar. "Editar" devuelve el control al chat para corregir por conversación.
 */
export function ResumenConfirmacion({
  respuesta,
  guardando,
  onConfirmar,
  onEditar,
}: {
  respuesta: RespuestaAsistente;
  guardando: boolean;
  onConfirmar: () => void;
  onEditar: () => void;
}) {
  return (
    <div className="rounded-xl border-2 border-primary/40 bg-primary-container/20 p-md">
      <div className="flex items-center gap-2 mb-sm">
        <span className="material-symbols-outlined text-primary" data-weight="fill">
          task_alt
        </span>
        <span className="font-headline-sm text-headline-sm text-on-surface">
          Confirma para guardar
        </span>
      </div>

      <ul className="space-y-0.5 text-body-md text-on-surface mb-md">
        {respuesta.resumen.lineas.map((linea, i) => (
          <li key={i} className="whitespace-pre-wrap leading-snug">
            {linea}
          </li>
        ))}
      </ul>

      <div className="flex gap-sm">
        <button
          type="button"
          onClick={onConfirmar}
          disabled={guardando}
          className="flex-1 h-11 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-bold flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-60"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            save
          </span>
          {guardando ? "Guardando…" : "Confirmar y guardar"}
        </button>
        <button
          type="button"
          onClick={onEditar}
          disabled={guardando}
          className="h-11 px-4 rounded-lg border border-outline-variant text-on-surface-variant font-label-md text-label-md active:scale-95 transition-all disabled:opacity-60"
        >
          Editar
        </button>
      </div>
    </div>
  );
}
