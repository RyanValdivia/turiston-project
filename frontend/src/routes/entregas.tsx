import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { requireSession, useSession } from "@/lib/session";
import {
  listEntregas,
  createEntrega,
  deleteEntrega,
  ApiError,
  type CategoriaResiduo,
} from "@/lib/api";
import { ETIQUETA_CATEGORIA, CATEGORIAS_VALORIZABLES, opcionesDe } from "@/lib/etiquetas";

export const Route = createFileRoute("/entregas")({
  ssr: false,
  beforeLoad: ({ context }) => requireSession(context.queryClient),
  head: () => ({
    meta: [
      { title: "restora - Entregas" },
      {
        name: "description",
        content: "Registra entregas a recicladores con evidencia para la trazabilidad.",
      },
    ],
  }),
  component: EntregasPage,
});

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" });
}
function errMsg(err: unknown, fallback: string) {
  return err instanceof ApiError ? err.message : fallback;
}

function EntregasPage() {
  const queryClient = useQueryClient();
  const session = useSession();
  const restauranteId = session.data?.restaurante.id ?? "";

  const [categoria, setCategoria] = useState<CategoriaResiduo>("CARTON");
  const [pesoKg, setPesoKg] = useState("");
  const [fecha, setFecha] = useState(todayISO());
  const [receptor, setReceptor] = useState("");
  const [fotografiaUrl, setFotografiaUrl] = useState("");
  const [constanciaUrl, setConstanciaUrl] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const entregas = useQuery({
    queryKey: ["entregas", restauranteId],
    queryFn: () => listEntregas(restauranteId),
    enabled: !!restauranteId,
  });

  const crear = useMutation({
    mutationFn: () =>
      createEntrega(restauranteId, {
        categoria,
        pesoKg: Number(pesoKg),
        fecha,
        receptor: receptor.trim(),
        ...(fotografiaUrl.trim() ? { fotografiaUrl: fotografiaUrl.trim() } : {}),
        ...(constanciaUrl.trim() ? { constanciaUrl: constanciaUrl.trim() } : {}),
        ...(observaciones.trim() ? { observaciones: observaciones.trim() } : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entregas"] });
      queryClient.invalidateQueries({ queryKey: ["indicadores"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setPesoKg("");
      setReceptor("");
      setFotografiaUrl("");
      setConstanciaUrl("");
      setObservaciones("");
    },
  });

  const eliminar = useMutation({
    mutationFn: (id: string) => deleteEntrega(restauranteId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entregas"] });
      queryClient.invalidateQueries({ queryKey: ["indicadores"] });
    },
  });

  const puedeGuardar = restauranteId && Number(pesoKg) > 0 && receptor.trim().length >= 2;

  return (
    <AppShell active="/entregas">
      <header className="mb-lg">
        <h2 className="font-headline-md text-headline-md text-on-surface mb-xs">
          Entregas a recicladores
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Registra a quién entregas tus residuos valorizables y adjunta evidencia. Esto alimenta los
          indicadores de valorización y trazabilidad.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-lg">
        {/* Formulario */}
        <section className="lg:col-span-2">
          <form
            className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant/40 space-y-md"
            onSubmit={(e) => {
              e.preventDefault();
              if (puedeGuardar) crear.mutate();
            }}
          >
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-secondary">recycling</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Nueva entrega</h3>
            </div>

            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="e-cat">
                Categoría
              </label>
              <select
                id="e-cat"
                className="w-full h-12 px-4 bg-surface rounded-lg border border-outline-variant focus:border-primary outline-none text-body-md text-on-surface"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as CategoriaResiduo)}
              >
                {opcionesDe(ETIQUETA_CATEGORIA).map((o) => (
                  <option key={o.valor} value={o.valor}>
                    {o.etiqueta}
                    {CATEGORIAS_VALORIZABLES.includes(o.valor) ? " ♻️" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-md">
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="e-peso">
                  Peso (kg)
                </label>
                <input
                  id="e-peso"
                  inputMode="decimal"
                  placeholder="0.0"
                  className="w-full h-12 px-4 bg-surface rounded-lg border border-outline-variant focus:border-primary outline-none text-body-md text-on-surface"
                  value={pesoKg}
                  onChange={(e) => setPesoKg(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="e-fecha">
                  Fecha
                </label>
                <input
                  id="e-fecha"
                  type="date"
                  className="w-full h-12 px-4 bg-surface rounded-lg border border-outline-variant focus:border-primary outline-none text-body-md text-on-surface"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="e-receptor">
                Receptor / reciclador
              </label>
              <input
                id="e-receptor"
                placeholder="Ej. Recicladora San Martín"
                className="w-full h-12 px-4 bg-surface rounded-lg border border-outline-variant focus:border-primary outline-none text-body-md text-on-surface"
                value={receptor}
                onChange={(e) => setReceptor(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="e-foto">
                URL de fotografía (opcional)
              </label>
              <input
                id="e-foto"
                placeholder="https://…"
                className="w-full h-12 px-4 bg-surface rounded-lg border border-outline-variant focus:border-primary outline-none text-body-md text-on-surface"
                value={fotografiaUrl}
                onChange={(e) => setFotografiaUrl(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="e-const">
                URL de constancia (opcional)
              </label>
              <input
                id="e-const"
                placeholder="https://…"
                className="w-full h-12 px-4 bg-surface rounded-lg border border-outline-variant focus:border-primary outline-none text-body-md text-on-surface"
                value={constanciaUrl}
                onChange={(e) => setConstanciaUrl(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="e-obs">
                Observaciones (opcional)
              </label>
              <textarea
                id="e-obs"
                rows={2}
                className="w-full px-4 py-2 bg-surface rounded-lg border border-outline-variant focus:border-primary outline-none text-body-md text-on-surface"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
              />
            </div>

            {crear.isError && (
              <p className="text-sm text-error">{errMsg(crear.error, "No se pudo registrar la entrega.")}</p>
            )}

            <button
              type="submit"
              disabled={!puedeGuardar || crear.isPending}
              className="w-full h-12 bg-primary text-on-primary rounded-lg font-label-md text-label-md font-bold flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-60"
            >
              <span className="material-symbols-outlined">save</span>
              {crear.isPending ? "Guardando…" : "Registrar entrega"}
            </button>
          </form>
        </section>

        {/* Listado */}
        <section className="lg:col-span-3">
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-sm">
            Entregas registradas
          </h3>
          {entregas.isLoading && <p className="text-sm text-on-surface-variant">Cargando…</p>}
          {entregas.isError && (
            <p className="text-sm text-error">No se pudo cargar el historial de entregas.</p>
          )}
          {entregas.data?.length === 0 && (
            <div className="rounded-xl border border-dashed border-outline-variant p-lg text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[40px] mb-xs block">recycling</span>
              Aún no registras entregas. La primera entrega hará subir tu % de valorización.
            </div>
          )}
          <div className="space-y-sm">
            {entregas.data?.map((e) => (
              <div
                key={e.id}
                className="rounded-xl bg-surface-container-lowest border border-outline-variant/40 p-md flex items-start justify-between gap-md"
              >
                <div>
                  <div className="flex items-center gap-2 mb-xs">
                    <span className="material-symbols-outlined text-secondary" style={{ fontSize: 20 }}>
                      recycling
                    </span>
                    <span className="font-label-md text-label-md font-bold text-on-surface">
                      {ETIQUETA_CATEGORIA[e.categoria]} · {e.pesoKg} kg
                    </span>
                  </div>
                  <p className="text-body-sm text-on-surface-variant">
                    {fmtFecha(e.fecha)} · {e.receptor}
                  </p>
                  <div className="flex gap-2 mt-xs">
                    {e.fotografiaUrl && (
                      <a
                        href={e.fotografiaUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-label-sm text-primary inline-flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                          photo_camera
                        </span>
                        Foto
                      </a>
                    )}
                    {e.constanciaUrl && (
                      <a
                        href={e.constanciaUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-label-sm text-primary inline-flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                          description
                        </span>
                        Constancia
                      </a>
                    )}
                  </div>
                  {e.observaciones && (
                    <p className="text-body-sm text-on-surface-variant mt-xs italic">
                      {e.observaciones}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="Eliminar entrega"
                  onClick={() => {
                    if (confirm("¿Eliminar esta entrega?")) eliminar.mutate(e.id);
                  }}
                  className="text-on-surface-variant hover:text-error transition-colors shrink-0"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
