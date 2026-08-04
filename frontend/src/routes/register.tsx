import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { requireSession, useSession } from "@/lib/session";
import {
  createOperacion,
  ApiError,
  type Turno,
  type CategoriaResiduo,
  type AreaProceso,
  type MotivoGeneracion,
  type DestinoPrevisto,
  type VentaItem,
  type ResiduoItem,
} from "@/lib/api";
import {
  ETIQUETA_CATEGORIA,
  ETIQUETA_AREA,
  ETIQUETA_MOTIVO,
  ETIQUETA_DESTINO,
  ETIQUETA_TURNO,
  opcionesDe,
} from "@/lib/etiquetas";

export const Route = createFileRoute("/register")({
  ssr: false,
  beforeLoad: ({ context }) => requireSession(context.queryClient),
  head: () => ({
    meta: [
      { title: "Registro diario - restora" },
      {
        name: "description",
        content: "Registra ventas, producción y desperdicios del turno para el cierre del día.",
      },
    ],
  }),
  component: RegisterPage,
});

/** Motivo por defecto sugerido a partir de la categoría (coincide con el backend). */
const MOTIVO_POR_CATEGORIA: Record<CategoriaResiduo, MotivoGeneracion> = {
  MERMA_PREPARACION: "ERROR_PREPARACION",
  PRODUCTO_DETERIORADO: "PRODUCTO_VENCIDO",
  SOBREPRODUCCION: "SOBREPRODUCCION",
  ALIMENTO_NO_VENDIDO: "SOBREPRODUCCION",
  RESTOS_CLIENTE: "DEVOLUCION_CLIENTE",
  CARTON: "OTRO",
  VIDRIO: "OTRO",
  PLASTICO: "OTRO",
  ACEITE_USADO: "OTRO",
  NO_APROVECHABLE: "OTRO",
};

interface VentaRow {
  concepto: string;
  cantidad: string;
  montoTotal: string;
}
interface DesperdicioRow {
  productoAsociado: string;
  categoria: CategoriaResiduo;
  cantidadKg: string;
  motivo: MotivoGeneracion;
  area: AreaProceso;
  destinoPrevisto: DestinoPrevisto;
  costoManual: string;
}

function ventaVacia(): VentaRow {
  return { concepto: "", cantidad: "", montoTotal: "" };
}
function desperdicioVacio(): DesperdicioRow {
  return {
    productoAsociado: "",
    categoria: "MERMA_PREPARACION",
    cantidadKg: "",
    motivo: "ERROR_PREPARACION",
    area: "COCINA",
    destinoPrevisto: "PENDIENTE_DEFINIR",
    costoManual: "",
  };
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return "No se pudo guardar el registro. Inténtalo de nuevo.";
}

const inputCls =
  "w-full h-11 px-3 bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-md text-on-surface";
const labelCls = "font-label-sm text-label-sm text-on-surface-variant";

function RegisterPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const session = useSession();
  const restauranteId = session.data?.restaurante.id ?? "";

  const [fecha, setFecha] = useState(todayISO());
  const [turno, setTurno] = useState<Turno>("MANANA");
  const [observaciones, setObservaciones] = useState("");
  const [ventas, setVentas] = useState<VentaRow[]>([ventaVacia()]);
  const [desperdicios, setDesperdicios] = useState<DesperdicioRow[]>([desperdicioVacio()]);

  function actualizarVenta(i: number, patch: Partial<VentaRow>) {
    setVentas((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function actualizarDesperdicio(i: number, patch: Partial<DesperdicioRow>) {
    setDesperdicios((rows) =>
      rows.map((r, idx) => {
        if (idx !== i) return r;
        const next = { ...r, ...patch };
        // Si cambia la categoría, sugiere el motivo por defecto (el usuario puede cambiarlo).
        if (patch.categoria && !("motivo" in patch)) {
          next.motivo = MOTIVO_POR_CATEGORIA[patch.categoria];
        }
        return next;
      }),
    );
  }

  const mutation = useMutation({
    mutationFn: () => {
      const ventasPayload: VentaItem[] = ventas
        .filter((v) => v.concepto.trim() && Number(v.cantidad) > 0)
        .map((v) => ({
          // El concepto ES el nombre real del plato → alimenta correctamente al predictor.
          concepto: v.concepto.trim(),
          cantidad: Number(v.cantidad),
          montoTotal: Number(v.montoTotal) || 0,
        }));

      const desperdiciosPayload: ResiduoItem[] = desperdicios
        .filter((d) => d.productoAsociado.trim() && Number(d.cantidadKg) > 0)
        .map((d) => ({
          categoria: d.categoria,
          cantidadKg: Number(d.cantidadKg),
          area: d.area,
          productoAsociado: d.productoAsociado.trim(),
          motivo: d.motivo,
          fecha,
          turno,
          destinoPrevisto: d.destinoPrevisto,
          ...(d.costoManual ? { costoManual: Number(d.costoManual) } : {}),
        }));

      return createOperacion(restauranteId, {
        fecha,
        turno,
        ...(observaciones.trim() ? { observaciones: observaciones.trim() } : {}),
        ...(ventasPayload.length ? { ventas: ventasPayload } : {}),
        ...(desperdiciosPayload.length ? { desperdicios: desperdiciosPayload } : {}),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["operaciones"] });
      queryClient.invalidateQueries({ queryKey: ["indicadores"] });
      navigate({ to: "/history" });
    },
  });

  const hayAlgo =
    ventas.some((v) => v.concepto.trim() && Number(v.cantidad) > 0) ||
    desperdicios.some((d) => d.productoAsociado.trim() && Number(d.cantidadKg) > 0);

  return (
    <AppShell active="/register">
      <div className="max-w-3xl mx-auto w-full">
        <div className="mb-lg">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-xs">Registro del turno</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Registra las ventas por plato y los desperdicios del turno. ¿Prefieres dictarlo? Usa el
            <span className="text-primary font-bold"> asistente 🤖</span> abajo a la derecha.
          </p>
        </div>

        <form
          className="space-y-lg"
          onSubmit={(e) => {
            e.preventDefault();
            if (hayAlgo) mutation.mutate();
          }}
        >
          {/* Datos del turno */}
          <section className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant/30 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-secondary opacity-80" />
            <div className="flex items-center gap-sm mb-md">
              <span className="material-symbols-outlined text-secondary">insights</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Datos del turno</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <div className="flex flex-col gap-xs">
                <label className={labelCls} htmlFor="entry-date">
                  Fecha
                </label>
                <input
                  className={inputCls}
                  id="entry-date"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-xs">
                <label className={labelCls} htmlFor="entry-turno">
                  Turno
                </label>
                <select
                  className={inputCls}
                  id="entry-turno"
                  value={turno}
                  onChange={(e) => setTurno(e.target.value as Turno)}
                >
                  {opcionesDe(ETIQUETA_TURNO).map((o) => (
                    <option key={o.valor} value={o.valor}>
                      {o.etiqueta}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Ventas por plato */}
          <section className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant/30 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary opacity-80" />
            <div className="flex items-center justify-between mb-md">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary">restaurant_menu</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Ventas por plato</h3>
              </div>
              <button
                type="button"
                onClick={() => setVentas((r) => [...r, ventaVacia()])}
                className="text-primary text-label-md font-label-md inline-flex items-center gap-1"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  add
                </span>
                Añadir plato
              </button>
            </div>
            <div className="space-y-sm">
              {ventas.map((v, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-6 flex flex-col gap-xs">
                    {i === 0 && <label className={labelCls}>Plato</label>}
                    <input
                      className={inputCls}
                      placeholder="Ej. Lomo Saltado"
                      value={v.concepto}
                      onChange={(e) => actualizarVenta(i, { concepto: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2 flex flex-col gap-xs">
                    {i === 0 && <label className={labelCls}>Cant.</label>}
                    <input
                      className={inputCls}
                      inputMode="numeric"
                      placeholder="0"
                      value={v.cantidad}
                      onChange={(e) => actualizarVenta(i, { cantidad: e.target.value })}
                    />
                  </div>
                  <div className="col-span-3 flex flex-col gap-xs">
                    {i === 0 && <label className={labelCls}>Monto S/</label>}
                    <input
                      className={inputCls}
                      inputMode="decimal"
                      placeholder="0.00"
                      value={v.montoTotal}
                      onChange={(e) => actualizarVenta(i, { montoTotal: e.target.value })}
                    />
                  </div>
                  <div className="col-span-1 flex justify-center pb-1">
                    {ventas.length > 1 && (
                      <button
                        type="button"
                        aria-label="Quitar plato"
                        onClick={() => setVentas((r) => r.filter((_, idx) => idx !== i))}
                        className="text-on-surface-variant hover:text-error"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                          close
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Desperdicios */}
          <section className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant/30 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-error opacity-80" />
            <div className="flex items-center justify-between mb-md">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-error">delete_sweep</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Desperdicios</h3>
              </div>
              <button
                type="button"
                onClick={() => setDesperdicios((r) => [...r, desperdicioVacio()])}
                className="text-primary text-label-md font-label-md inline-flex items-center gap-1"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  add
                </span>
                Añadir desperdicio
              </button>
            </div>
            <div className="space-y-md">
              {desperdicios.map((d, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-outline-variant/40 bg-surface-container-low p-sm space-y-sm"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
                    <div className="flex flex-col gap-xs">
                      <label className={labelCls}>Producto / plato</label>
                      <input
                        className={inputCls}
                        placeholder="Ej. Arroz, recortes de verdura"
                        value={d.productoAsociado}
                        onChange={(e) => actualizarDesperdicio(i, { productoAsociado: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-xs">
                      <label className={labelCls}>Categoría</label>
                      <select
                        className={inputCls}
                        value={d.categoria}
                        onChange={(e) =>
                          actualizarDesperdicio(i, { categoria: e.target.value as CategoriaResiduo })
                        }
                      >
                        {opcionesDe(ETIQUETA_CATEGORIA).map((o) => (
                          <option key={o.valor} value={o.valor}>
                            {o.etiqueta}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-sm">
                    <div className="flex flex-col gap-xs">
                      <label className={labelCls}>Kilos</label>
                      <input
                        className={inputCls}
                        inputMode="decimal"
                        placeholder="0.0"
                        value={d.cantidadKg}
                        onChange={(e) => actualizarDesperdicio(i, { cantidadKg: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-xs">
                      <label className={labelCls}>Motivo</label>
                      <select
                        className={inputCls}
                        value={d.motivo}
                        onChange={(e) =>
                          actualizarDesperdicio(i, { motivo: e.target.value as MotivoGeneracion })
                        }
                      >
                        {opcionesDe(ETIQUETA_MOTIVO).map((o) => (
                          <option key={o.valor} value={o.valor}>
                            {o.etiqueta}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-xs">
                      <label className={labelCls}>Área</label>
                      <select
                        className={inputCls}
                        value={d.area}
                        onChange={(e) =>
                          actualizarDesperdicio(i, { area: e.target.value as AreaProceso })
                        }
                      >
                        {opcionesDe(ETIQUETA_AREA).map((o) => (
                          <option key={o.valor} value={o.valor}>
                            {o.etiqueta}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-xs">
                      <label className={labelCls}>Costo S/ (opc.)</label>
                      <input
                        className={inputCls}
                        inputMode="decimal"
                        placeholder="auto"
                        value={d.costoManual}
                        onChange={(e) => actualizarDesperdicio(i, { costoManual: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-sm items-end">
                    <div className="flex flex-col gap-xs">
                      <label className={labelCls}>Destino previsto</label>
                      <select
                        className={inputCls}
                        value={d.destinoPrevisto}
                        onChange={(e) =>
                          actualizarDesperdicio(i, {
                            destinoPrevisto: e.target.value as DestinoPrevisto,
                          })
                        }
                      >
                        {opcionesDe(ETIQUETA_DESTINO).map((o) => (
                          <option key={o.valor} value={o.valor}>
                            {o.etiqueta}
                          </option>
                        ))}
                      </select>
                    </div>
                    {desperdicios.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setDesperdicios((r) => r.filter((_, idx) => idx !== i))}
                        className="text-on-surface-variant hover:text-error text-label-md font-label-md inline-flex items-center gap-1 justify-self-start md:justify-self-end"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                          delete
                        </span>
                        Quitar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Observaciones */}
          <section className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant/30">
            <label className={labelCls} htmlFor="obs">
              Observaciones (opcional)
            </label>
            <textarea
              id="obs"
              rows={2}
              className="w-full mt-xs px-3 py-2 bg-surface rounded-lg border border-outline-variant focus:border-primary outline-none text-body-md text-on-surface"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </section>

          {mutation.isError && <p className="text-sm text-error">{errorMessage(mutation.error)}</p>}

          <div className="pt-sm pb-xl">
            <button
              className="w-full h-12 bg-primary text-on-primary font-headline-sm text-headline-sm rounded-lg shadow-sm active:scale-95 transition-all flex justify-center items-center gap-sm hover:bg-primary/90 disabled:opacity-60"
              disabled={mutation.isPending || !restauranteId || !hayAlgo}
              type="submit"
            >
              <span className="material-symbols-outlined">save</span>
              {mutation.isPending ? "Guardando…" : "Guardar registro"}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
