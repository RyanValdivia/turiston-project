import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { requireSession, useSession } from "@/lib/session";
import {
  listProductos,
  createProducto,
  deleteProducto,
  listColaboradores,
  createColaborador,
  updateColaborador,
  deleteColaborador,
  ApiError,
  type RolColaborador,
} from "@/lib/api";
import { ETIQUETA_ROL, opcionesDe } from "@/lib/etiquetas";

export const Route = createFileRoute("/catalogo")({
  ssr: false,
  beforeLoad: ({ context }) => requireSession(context.queryClient),
  head: () => ({
    meta: [
      { title: "restora - Catálogo" },
      {
        name: "description",
        content: "Gestiona productos con su costo y el personal del restaurante.",
      },
    ],
  }),
  component: CatalogoPage,
});

function errMsg(err: unknown, fallback: string) {
  return err instanceof ApiError ? err.message : fallback;
}

function CatalogoPage() {
  const queryClient = useQueryClient();
  const session = useSession();
  const restauranteId = session.data?.restaurante.id ?? "";

  return (
    <AppShell active="/catalogo">
      <header className="mb-lg">
        <h2 className="font-headline-md text-headline-md text-on-surface mb-xs">Catálogo y equipo</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Registra tus productos con su costo para calcular automáticamente la pérdida económica del
          desperdicio, y a tu personal con su nivel de capacitación.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        <ProductosPanel restauranteId={restauranteId} queryClient={queryClient} />
        <ColaboradoresPanel restauranteId={restauranteId} queryClient={queryClient} />
      </div>
    </AppShell>
  );
}

type QC = ReturnType<typeof useQueryClient>;

function ProductosPanel({ restauranteId, queryClient }: { restauranteId: string; queryClient: QC }) {
  const [nombre, setNombre] = useState("");
  const [costo, setCosto] = useState("");

  const productos = useQuery({
    queryKey: ["productos", restauranteId],
    queryFn: () => listProductos(restauranteId),
    enabled: !!restauranteId,
  });

  const crear = useMutation({
    mutationFn: () => createProducto(restauranteId, { nombre: nombre.trim(), costoUnitario: Number(costo) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos"] });
      setNombre("");
      setCosto("");
    },
  });
  const eliminar = useMutation({
    mutationFn: (id: string) => deleteProducto(restauranteId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["productos"] }),
  });

  const puede = restauranteId && nombre.trim().length >= 2 && Number(costo) > 0;

  return (
    <section className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant/40">
      <div className="flex items-center gap-sm mb-md">
        <span className="material-symbols-outlined text-primary">inventory_2</span>
        <h3 className="font-headline-sm text-headline-sm text-on-surface">Productos</h3>
      </div>

      <form
        className="flex flex-col sm:flex-row gap-sm mb-md"
        onSubmit={(e) => {
          e.preventDefault();
          if (puede) crear.mutate();
        }}
      >
        <input
          placeholder="Nombre del producto"
          className="flex-1 h-11 px-3 bg-surface rounded-lg border border-outline-variant focus:border-primary outline-none text-body-md text-on-surface"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <input
          placeholder="Costo S/"
          inputMode="decimal"
          className="sm:w-28 h-11 px-3 bg-surface rounded-lg border border-outline-variant focus:border-primary outline-none text-body-md text-on-surface"
          value={costo}
          onChange={(e) => setCosto(e.target.value)}
        />
        <button
          type="submit"
          disabled={!puede || crear.isPending}
          className="h-11 px-4 bg-primary text-on-primary rounded-lg font-label-md text-label-md font-bold active:scale-95 transition-all disabled:opacity-60"
        >
          Agregar
        </button>
      </form>
      {crear.isError && (
        <p className="text-sm text-error mb-sm">{errMsg(crear.error, "No se pudo crear el producto.")}</p>
      )}

      {productos.data?.length === 0 && (
        <p className="text-sm text-on-surface-variant">Aún no hay productos en el catálogo.</p>
      )}
      <ul className="divide-y divide-outline-variant/30">
        {productos.data?.map((p) => (
          <li key={p.id} className="flex items-center justify-between py-2">
            <div>
              <span className="font-label-md text-label-md text-on-surface">{p.nombre}</span>
              <span className="text-body-sm text-on-surface-variant ml-2">S/ {p.costoUnitario}</span>
            </div>
            <button
              type="button"
              aria-label="Eliminar producto"
              onClick={() => {
                if (confirm(`¿Eliminar "${p.nombre}"?`)) eliminar.mutate(p.id);
              }}
              className="text-on-surface-variant hover:text-error transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                delete
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ColaboradoresPanel({
  restauranteId,
  queryClient,
}: {
  restauranteId: string;
  queryClient: QC;
}) {
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState<RolColaborador>("COCINERO");
  const [capacitado, setCapacitado] = useState(false);

  const colaboradores = useQuery({
    queryKey: ["colaboradores", restauranteId],
    queryFn: () => listColaboradores(restauranteId),
    enabled: !!restauranteId,
  });

  const crear = useMutation({
    mutationFn: () => createColaborador(restauranteId, { nombre: nombre.trim(), rol, capacitado }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      queryClient.invalidateQueries({ queryKey: ["indicadores"] });
      setNombre("");
      setCapacitado(false);
    },
  });
  const alternarCapacitado = useMutation({
    mutationFn: (v: { id: string; capacitado: boolean }) =>
      updateColaborador(restauranteId, v.id, { capacitado: v.capacitado }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      queryClient.invalidateQueries({ queryKey: ["indicadores"] });
    },
  });
  const eliminar = useMutation({
    mutationFn: (id: string) => deleteColaborador(restauranteId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      queryClient.invalidateQueries({ queryKey: ["indicadores"] });
    },
  });

  const puede = restauranteId && nombre.trim().length >= 2;

  return (
    <section className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant/40">
      <div className="flex items-center gap-sm mb-md">
        <span className="material-symbols-outlined text-secondary">group</span>
        <h3 className="font-headline-sm text-headline-sm text-on-surface">Colaboradores</h3>
      </div>

      <form
        className="space-y-sm mb-md"
        onSubmit={(e) => {
          e.preventDefault();
          if (puede) crear.mutate();
        }}
      >
        <div className="flex flex-col sm:flex-row gap-sm">
          <input
            placeholder="Nombre"
            className="flex-1 h-11 px-3 bg-surface rounded-lg border border-outline-variant focus:border-primary outline-none text-body-md text-on-surface"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <select
            className="sm:w-40 h-11 px-3 bg-surface rounded-lg border border-outline-variant focus:border-primary outline-none text-body-md text-on-surface"
            value={rol}
            onChange={(e) => setRol(e.target.value as RolColaborador)}
          >
            {opcionesDe(ETIQUETA_ROL).map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.etiqueta}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-body-md text-on-surface">
            <input
              type="checkbox"
              className="w-4 h-4 accent-primary"
              checked={capacitado}
              onChange={(e) => setCapacitado(e.target.checked)}
            />
            Capacitado en manejo de residuos
          </label>
          <button
            type="submit"
            disabled={!puede || crear.isPending}
            className="h-11 px-4 bg-primary text-on-primary rounded-lg font-label-md text-label-md font-bold active:scale-95 transition-all disabled:opacity-60"
          >
            Agregar
          </button>
        </div>
      </form>
      {crear.isError && (
        <p className="text-sm text-error mb-sm">{errMsg(crear.error, "No se pudo crear el colaborador.")}</p>
      )}

      {colaboradores.data?.length === 0 && (
        <p className="text-sm text-on-surface-variant">Aún no hay colaboradores registrados.</p>
      )}
      <ul className="divide-y divide-outline-variant/30">
        {colaboradores.data?.map((c) => (
          <li key={c.id} className="flex items-center justify-between py-2">
            <div>
              <span className="font-label-md text-label-md text-on-surface">{c.nombre}</span>
              <span className="text-body-sm text-on-surface-variant ml-2">{ETIQUETA_ROL[c.rol]}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => alternarCapacitado.mutate({ id: c.id, capacitado: !c.capacitado })}
                className={
                  c.capacitado
                    ? "inline-flex items-center gap-1 text-label-sm text-secondary"
                    : "inline-flex items-center gap-1 text-label-sm text-on-surface-variant"
                }
                title="Alternar capacitación"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }} data-weight={c.capacitado ? "fill" : undefined}>
                  {c.capacitado ? "verified" : "school"}
                </span>
                {c.capacitado ? "Capacitado" : "Sin capacitar"}
              </button>
              <button
                type="button"
                aria-label="Eliminar colaborador"
                onClick={() => {
                  if (confirm(`¿Eliminar a "${c.nombre}"?`)) eliminar.mutate(c.id);
                }}
                className="text-on-surface-variant hover:text-error transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  delete
                </span>
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
