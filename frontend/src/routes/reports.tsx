import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { requireSession, useSession } from "@/lib/session";
import { createReporte, listReportes, reporteExportUrl, ApiError } from "@/lib/api";

export const Route = createFileRoute("/reports")({
  ssr: false,
  beforeLoad: ({ context }) => requireSession(context.queryClient),
  head: () => ({
    meta: [
      { title: "restora - Reportes" },
      { name: "description", content: "Genera y exporta reportes de tu restaurante." },
    ],
  }),
  component: ReportsPage,
});

function monthOptions() {
  const opts: { label: string; value: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    opts.push({
      label: d.toLocaleDateString("es-PE", { month: "long", year: "numeric" }),
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    });
  }
  return opts;
}
function monthToRange(value: string) {
  const [y, m] = value.split("-").map(Number) as [number, number];
  const from = new Date(y, m - 1, 1);
  const to = new Date(y, m, 0);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-PE", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ReportsPage() {
  const queryClient = useQueryClient();
  const session = useSession();
  const restauranteId = session.data?.restaurante.id ?? "";
  const options = useMemo(monthOptions, []);
  const [month, setMonth] = useState(options[0]!.value);

  const reportes = useQuery({
    queryKey: ["reportes", restauranteId],
    queryFn: () => listReportes(restauranteId),
    enabled: !!restauranteId,
  });

  const generateMutation = useMutation({
    mutationFn: () => createReporte(restauranteId, monthToRange(month)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reportes"] });
    },
  });

  return (
    <AppShell active="/reports">
      <header className="mb-lg md:mb-xl flex flex-col md:flex-row md:items-end justify-between gap-md">
        <div>
          <h2 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-xs">
            Reportes
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Genera y exporta reportes de {session.data?.restaurante.nombre ?? "tu restaurante"}.
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-md md:gap-lg mb-xl">
        <div className="rounded-xl p-lg flex flex-col justify-between min-h-[200px] bg-surface-container-lowest/80 backdrop-blur-md border border-surface-dim shadow-soft">
          <div className="flex justify-between items-start mb-md">
            <div>
              <div className="flex items-center gap-sm text-primary mb-xs">
                <span className="material-symbols-outlined">calendar_month</span>
                <span className="font-label-md text-label-md uppercase tracking-wider">
                  Reporte mensual
                </span>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface">
                Generar un nuevo reporte
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant mt-sm max-w-md">
                Totales de desperdicio, pérdida económica e indicadores de segregación y valorización
                del mes seleccionado.
              </p>
            </div>
          </div>
          <form
            className="flex flex-col sm:flex-row gap-sm mt-auto"
            onSubmit={(e) => {
              e.preventDefault();
              generateMutation.mutate();
            }}
          >
            <div className="relative flex-1">
              <select
                className="w-full h-12 pl-md pr-xl rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary appearance-none font-body-md text-body-md"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              >
                {options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-md top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                expand_more
              </span>
            </div>
            <button
              className="bg-primary text-on-primary h-12 px-lg rounded-lg font-headline-sm text-headline-sm flex items-center justify-center gap-sm hover:bg-primary-container transition-colors sm:w-auto w-full disabled:opacity-60"
              disabled={generateMutation.isPending || !restauranteId}
              type="submit"
            >
              <span className="material-symbols-outlined">magic_button</span>
              {generateMutation.isPending ? "Generating…" : "Generate"}
            </button>
          </form>
          {generateMutation.isError && (
            <p className="text-sm text-red-600 mt-sm">
              {generateMutation.error instanceof ApiError
                ? generateMutation.error.message
                : "Could not generate report."}
            </p>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-md">
          <h2 className="font-headline-md text-headline-md text-on-surface">Recent Reports</h2>
        </div>
        {reportes.isError && <p className="text-sm text-red-600">Could not load report history.</p>}
        {reportes.data?.length === 0 && (
          <p className="text-sm text-on-surface-variant">No reports generated yet.</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {reportes.data?.map((r) => (
            <div
              key={r.id}
              className="rounded-xl p-md flex flex-col bg-surface-container-lowest/80 backdrop-blur-md border border-surface-dim shadow-soft"
            >
              <div className="w-full h-24 bg-surface-container rounded-lg mb-md overflow-hidden relative border border-outline-variant/30 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[48px]">description</span>
              </div>
              <div className="flex justify-between items-start mb-sm">
                <h4 className="font-headline-sm text-headline-sm text-on-surface line-clamp-1">
                  {fmtDate(r.periodoFrom)} – {fmtDate(r.periodoTo)}
                </h4>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant mb-md flex-1">
                Generated {fmtDate(r.createdAt)}
              </p>
              <a
                className="w-full bg-surface-container-lowest text-primary border border-outline-variant h-10 rounded-lg font-label-md text-label-md flex items-center justify-center gap-xs hover:border-primary hover:bg-surface transition-colors"
                href={reporteExportUrl(restauranteId, r.id)}
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                Download CSV
              </a>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
