import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { AppShell } from "@/components/AppShell";
import { requireSession, useSession } from "@/lib/session";
import { getDashboard, getTendencias } from "@/lib/api";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  beforeLoad: ({ context }) => requireSession(context.queryClient),
  head: () => ({
    meta: [
      { title: "Dashboard — RESTORA Daily Operations" },
      {
        name: "description",
        content:
          "Today's operational metrics for Arequipa Central: economic loss, waste generated, reduction rate and logged operations.",
      },
      { property: "og:title", content: "Dashboard — RESTORA Daily Operations" },
      {
        property: "og:description",
        content: "Live restaurant waste and loss metrics in one operational overview.",
      },
    ],
  }),
  component: DashboardPage,
});

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
function pct(n: number | null): string {
  return n == null ? "—" : `${n.toFixed(1)}%`;
}
function money(n: number): string {
  return `S/ ${n.toFixed(2)}`;
}

function DashboardPage() {
  const session = useSession();
  const restauranteId = session.data?.restaurante.id ?? "";

  const dashboard = useQuery({
    queryKey: ["dashboard", restauranteId],
    queryFn: () => getDashboard(restauranteId),
    enabled: !!restauranteId,
  });

  const tendencias = useQuery({
    queryKey: ["tendencias", restauranteId, "dashboard"],
    queryFn: () => getTendencias(restauranteId),
    enabled: !!restauranteId,
  });

  const chartData =
    tendencias.data?.tendencia.map((b) => ({
      semana: fmtDate(b.periodoInicio),
      kg: Number(b.totalKg.toFixed(1)),
    })) ?? [];

  return (
    <AppShell active="/dashboard">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md">
        <div>
          <h2 className="font-headline-sm text-headline-sm-mobile md:font-headline-md md:text-headline-md text-on-surface">
            Overview
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Operational metrics for {session.data?.restaurante.nombre ?? "your restaurant"}.
          </p>
        </div>
        <Link
          to="/register"
          className="bg-primary-container text-on-primary h-[48px] px-lg rounded-lg font-label-md text-label-md font-bold flex items-center justify-center gap-2 shadow-soft hover:opacity-90 transition-opacity active:scale-95"
        >
          <span className="material-symbols-outlined">add</span>
          Register today's data
        </Link>
      </div>

      {dashboard.isError && (
        <p className="text-sm text-red-600">Could not load dashboard data. Try refreshing.</p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
        <div className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant shadow-soft flex flex-col justify-between col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-sm text-primary-container">
            <span className="material-symbols-outlined" data-weight="fill">
              trending_down
            </span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider">
              Est. Econ. Loss
            </span>
          </div>
          <div>
            <div className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-primary-container font-bold">
              {dashboard.data ? money(dashboard.data.resumen.perdidaEstimada) : "—"}
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant shadow-soft flex flex-col justify-between col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-sm text-secondary">
            <span className="material-symbols-outlined" data-weight="fill">
              delete_sweep
            </span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider">
              Waste Generated
            </span>
          </div>
          <div>
            <div className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-on-surface font-bold">
              {dashboard.data ? `${dashboard.data.resumen.totalKg.toFixed(1)} kg` : "—"}
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant shadow-soft flex flex-col justify-between col-span-1">
          <div className="flex items-center gap-2 mb-sm text-on-surface-variant">
            <span className="material-symbols-outlined">eco</span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider">Prevention</span>
          </div>
          <div>
            <div className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-on-surface font-bold">
              {dashboard.data ? pct(dashboard.data.resumen.prevencionPct) : "—"}
            </div>
            <div className="w-full bg-surface-variant h-1.5 rounded-full mt-2">
              <div
                className="bg-secondary h-1.5 rounded-full"
                style={{
                  width: `${Math.max(0, Math.min(100, dashboard.data?.resumen.prevencionPct ?? 0))}%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant shadow-soft flex flex-col justify-between col-span-1">
          <div className="flex items-center gap-2 mb-sm text-on-surface-variant">
            <span className="material-symbols-outlined">receipt_long</span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider">Operations</span>
          </div>
          <div>
            <div className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-on-surface font-bold">
              {dashboard.data?.ultimasOperaciones.length ?? "—"}
            </div>
            <div className="font-label-sm text-label-sm text-on-surface-variant mt-1">
              Recently logged
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-soft md:col-span-2 overflow-hidden flex flex-col">
          <div className="p-md border-b border-surface-variant flex justify-between items-center bg-surface-bright">
            <h3 className="font-headline-sm text-headline-sm-mobile md:font-headline-md md:text-headline-md text-on-surface">
              Weekly Performance (kg waste)
            </h3>
          </div>
          <div className="p-md flex-1 min-h-[220px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <XAxis dataKey="semana" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="kg" fill="#8b6f47" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-on-surface-variant">No trend data for this period yet.</p>
            )}
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-soft flex flex-col h-full">
          <div className="p-md border-b border-surface-variant flex justify-between items-center bg-surface-bright">
            <h3 className="font-headline-sm text-headline-sm-mobile md:font-headline-md md:text-headline-md text-on-surface">
              Recent Activity
            </h3>
            <Link
              to="/history"
              className="font-label-sm text-label-sm text-primary hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="p-md flex-1 space-y-4 overflow-y-auto">
            {dashboard.data?.ultimasOperaciones.length === 0 && (
              <p className="text-sm text-on-surface-variant">No operations logged yet.</p>
            )}
            {dashboard.data?.ultimasOperaciones.map((op) => (
              <div className="flex items-start gap-3" key={op.id}>
                <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary-container shrink-0 mt-1">
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>
                </div>
                <div>
                  <div className="font-label-md text-label-md font-bold text-on-surface">
                    {op.turno.charAt(0) + op.turno.slice(1).toLowerCase()} operation
                  </div>
                  <div className="font-body-md text-body-md text-on-surface-variant line-clamp-1">
                    {op.totalDesperdicioKg.toFixed(1)} kg waste · S/ {op.totalVentas.toFixed(0)}{" "}
                    sales
                  </div>
                  <div className="font-label-sm text-label-sm text-outline mt-0.5">
                    {fmtDate(op.fecha)}, {fmtTime(op.fecha)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
