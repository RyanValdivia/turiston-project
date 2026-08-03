import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { requireSession, useSession } from "@/lib/session";
import { deleteOperacion, listOperaciones, type RegistroOperacion, type Turno } from "@/lib/api";

export const Route = createFileRoute("/history")({
  ssr: false,
  beforeLoad: ({ context }) => requireSession(context.queryClient),
  head: () => ({
    meta: [
      { title: "Restora - History" },
      { name: "description", content: "Review past daily inputs and economic impacts." },
      { property: "og:title", content: "Restora - History" },
      { property: "og:description", content: "Review past daily inputs and economic impacts." },
    ],
  }),
  component: HistoryPage,
});

function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
function totals(op: RegistroOperacion) {
  const sales = op.ventas.reduce((s, v) => s + v.montoTotal, 0);
  const wasteKg = op.residuos.reduce((s, r) => s + r.cantidadKg, 0);
  const impact = op.residuos.reduce((s, r) => s + (r.costoTotal ?? 0), 0);
  const missingCost = op.residuos.some((r) => r.costoTotal == null);
  return { sales, wasteKg, impact, missingCost };
}

function RecordCard({
  op,
  onDelete,
  deleting,
}: {
  op: RegistroOperacion;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  const { sales, wasteKg, impact, missingCost } = totals(op);
  return (
    <div className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant shadow-[0_4px_12px_rgba(31,27,23,0.02)] hover:shadow-[0_4px_12px_rgba(31,27,23,0.05)] transition-all group">
      <div className="flex justify-between items-start mb-sm">
        <div className="flex items-center gap-sm">
          <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant">
            <span className="material-symbols-outlined">calendar_today</span>
          </div>
          <div>
            <h4 className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary transition-colors">
              {fmtDate(op.fecha)}
            </h4>
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              {op.turno.charAt(0) + op.turno.slice(1).toLowerCase()} shift
              {op.observaciones ? ` · ${op.observaciones}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-sm">
          <span
            className={`px-2 py-1 rounded-full font-label-sm text-label-sm ${
              missingCost
                ? "bg-error-container text-on-error-container"
                : "bg-secondary-container text-on-secondary-container"
            }`}
          >
            {missingCost ? "Missing cost" : "Reconciled"}
          </span>
          <button
            className="text-on-surface-variant hover:text-error transition-colors disabled:opacity-40"
            disabled={deleting}
            onClick={() => onDelete(op.id)}
            title="Delete entry"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">delete</span>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-sm pt-sm border-t border-surface-container">
        <div>
          <p className="font-label-sm text-label-sm text-on-surface-variant mb-xs">Total Sales</p>
          <p className="font-headline-sm text-headline-sm text-on-surface">S/ {sales.toFixed(2)}</p>
        </div>
        <div>
          <p className="font-label-sm text-label-sm text-on-surface-variant mb-xs">Total Waste</p>
          <p className="font-headline-sm text-headline-sm text-on-surface">
            {wasteKg.toFixed(1)} kg
          </p>
        </div>
        <div>
          <p className="font-label-sm text-label-sm text-on-surface-variant mb-xs">Econ Impact</p>
          <p className="font-headline-sm text-headline-sm text-error">- S/ {impact.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}

function HistoryPage() {
  const queryClient = useQueryClient();
  const session = useSession();
  const restauranteId = session.data?.restaurante.id ?? "";

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 350);
  const [turno, setTurno] = useState<Turno | "">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const operaciones = useQuery({
    queryKey: ["operaciones", restauranteId, debouncedSearch, turno, from, to],
    queryFn: () =>
      listOperaciones(restauranteId, {
        ...(debouncedSearch ? { q: debouncedSearch } : {}),
        ...(turno ? { turno } : {}),
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
      }),
    enabled: !!restauranteId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteOperacion(restauranteId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operaciones"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  return (
    <AppShell active="/history">
      <div className="max-w-4xl mx-auto space-y-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
          <div>
            <h2 className="font-headline-sm text-headline-sm-mobile md:font-headline-md md:text-headline-md text-on-surface">
              Record History
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
              Review past daily inputs and economic impacts.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-sm w-full md:w-auto flex-wrap">
            <div className="relative flex-1 sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                search
              </span>
              <input
                className="w-full h-12 pl-10 pr-4 rounded-lg bg-surface-container-lowest border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md outline-none transition-all"
                placeholder="Search records..."
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="h-12 px-md rounded-lg bg-surface-container-lowest border border-outline-variant font-label-md text-label-md text-on-surface outline-none"
              value={turno}
              onChange={(e) => setTurno(e.target.value as Turno | "")}
            >
              <option value="">All shifts</option>
              <option value="MANANA">Morning</option>
              <option value="TARDE">Afternoon</option>
              <option value="NOCHE">Night</option>
            </select>
            <input
              className="h-12 px-md rounded-lg bg-surface-container-lowest border border-outline-variant font-label-md text-label-md text-on-surface outline-none"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <input
              className="h-12 px-md rounded-lg bg-surface-container-lowest border border-outline-variant font-label-md text-label-md text-on-surface outline-none"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>

        {operaciones.isError && <p className="text-sm text-red-600">Could not load history.</p>}

        <div className="space-y-sm">
          {operaciones.data?.length === 0 && (
            <p className="text-sm text-on-surface-variant py-lg text-center">
              No records match these filters.
            </p>
          )}
          {operaciones.data?.map((op) => (
            <RecordCard
              deleting={deleteMutation.isPending && deleteMutation.variables === op.id}
              key={op.id}
              onDelete={(id) => {
                if (confirm("Delete this entry? This cannot be undone.")) deleteMutation.mutate(id);
              }}
              op={op}
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
