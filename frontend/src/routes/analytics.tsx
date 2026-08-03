import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { requireSession, useSession } from "@/lib/session";
import { getIndicadores, getRecomendaciones, getTendencias } from "@/lib/api";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

export const Route = createFileRoute("/analytics")({
  ssr: false,
  beforeLoad: ({ context }) => requireSession(context.queryClient),
  head: () => ({
    meta: [
      { title: "Restora - Analytics" },
      { name: "description", content: "Track your waste reduction goals." },
      { property: "og:title", content: "Restora - Analytics" },
      { property: "og:description", content: "Track your waste reduction goals." },
    ],
  }),
  component: AnalyticsPage,
});

const PALETTE = ["#7a1f3d", "#f6be39", "#dac0c4", "#a3d2a7", "#9f3c59", "#887275"];

function humanize(label: string): string {
  return label.charAt(0) + label.slice(1).toLowerCase().replace(/_/g, " ");
}
function fmtWeek(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function monthRange(offsetMonths: number) {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() + offsetMonths, 1);
  const to =
    offsetMonths === 0 ? now : new Date(now.getFullYear(), now.getMonth() + offsetMonths + 1, 0);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

function AnalyticsPage() {
  const session = useSession();
  const restauranteId = session.data?.restaurante.id ?? "";
  const [period, setPeriod] = useState<"This Month" | "Last Month">("This Month");
  const range = monthRange(period === "This Month" ? 0 : -1);

  const indicadores = useQuery({
    queryKey: ["indicadores", restauranteId, range.from, range.to],
    queryFn: () => getIndicadores(restauranteId, range),
    enabled: !!restauranteId,
  });
  const tendencias = useQuery({
    queryKey: ["tendencias", restauranteId, range.from, range.to],
    queryFn: () => getTendencias(restauranteId, range),
    enabled: !!restauranteId,
  });
  const recomendaciones = useQuery({
    queryKey: ["recomendaciones", restauranteId, range.from, range.to],
    queryFn: () => getRecomendaciones(restauranteId, range),
    enabled: !!restauranteId,
  });

  const wasteData = useMemo(
    () =>
      (tendencias.data?.tendencia ?? []).map((b) => ({
        week: fmtWeek(b.periodoInicio),
        waste: Number(b.totalKg.toFixed(1)),
      })),
    [tendencias.data],
  );
  const lossData = useMemo(
    () =>
      Object.entries(indicadores.data?.generacion.porCategoria ?? {}).map(([categoria, kg]) => ({
        category: humanize(categoria),
        kg: Number(kg.toFixed(1)),
      })),
    [indicadores.data],
  );
  const causesData = useMemo(
    () =>
      Object.entries(indicadores.data?.analisis.porMotivo ?? {}).map(([motivo, kg], i) => ({
        name: humanize(motivo),
        value: Number(kg.toFixed(1)),
        color: PALETTE[i % PALETTE.length]!,
      })),
    [indicadores.data],
  );
  const topRecomendacion = recomendaciones.data?.recomendaciones[0];

  return (
    <AppShell active="/analytics">
      <div className="mb-lg flex justify-between items-end">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-xs">
            Performance Analytics
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Track your waste reduction goals.
          </p>
        </div>
        <button
          className="bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-2 font-label-md text-label-md text-on-surface-variant flex items-center gap-2 hover:bg-surface-variant transition-colors"
          onClick={() => setPeriod(period === "This Month" ? "Last Month" : "This Month")}
        >
          {period} <span className="material-symbols-outlined text-[18px]">expand_more</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-md md:gap-lg">
        <section className="col-span-1 md:col-span-8 bg-surface-container-lowest rounded-xl p-md border border-surface-dim shadow-[0_4px_12px_rgba(31,27,23,0.05)]">
          <div className="flex justify-between items-center mb-md">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">
              Waste Evolution (kg)
            </h3>
            {indicadores.data?.prevencionPct != null && (
              <span className="bg-secondary-container text-on-secondary-container px-2 py-1 rounded-full font-label-sm text-label-sm flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">trending_down</span>
                {indicadores.data.prevencionPct.toFixed(1)}%
              </span>
            )}
          </div>
          <div className="h-[250px] w-full relative">
            {wasteData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={wasteData}>
                  <CartesianGrid stroke="#ebe1da" vertical={false} />
                  <XAxis
                    dataKey="week"
                    tick={{ fill: "#887275", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#887275", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="waste"
                    stroke="#7a1f3d"
                    strokeWidth={2}
                    dot={{ fill: "#fff", stroke: "#7a1f3d", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-on-surface-variant">No trend data for this period.</p>
            )}
          </div>
        </section>

        <section className="col-span-1 md:col-span-4 flex flex-col gap-md">
          <div className="bg-surface-container-lowest rounded-xl p-md border border-surface-dim shadow-[0_4px_12px_rgba(31,27,23,0.05)] flex-1 flex flex-col justify-center">
            <h4 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">
              Total Economic Loss
            </h4>
            <div className="flex items-baseline gap-2">
              <span className="font-display-lg text-display-lg text-primary-container">
                {indicadores.data
                  ? `S/ ${indicadores.data.economia.perdidaEstimada.toFixed(0)}`
                  : "—"}
              </span>
              <span className="font-body-md text-body-md text-on-surface-variant">
                {period.toLowerCase()}
              </span>
            </div>
          </div>
          <div className="bg-tertiary-fixed rounded-xl p-md shadow-[0_4px_12px_rgba(31,27,23,0.05)] flex-1 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute right-[-20px] top-[-20px] opacity-20">
              <span className="material-symbols-outlined text-[100px]">tips_and_updates</span>
            </div>
            <h4 className="font-label-sm text-label-sm text-on-tertiary-fixed-variant uppercase tracking-wider mb-2 z-10">
              {topRecomendacion ? topRecomendacion.titulo : "Improvement Opportunity"}
            </h4>
            <p className="font-body-md text-body-md text-on-tertiary-fixed-variant z-10">
              {topRecomendacion
                ? topRecomendacion.descripcion
                : "No critical patterns detected for this period — keep monitoring."}
            </p>
          </div>
        </section>

        <section className="col-span-1 md:col-span-6 bg-surface-container-lowest rounded-xl p-md border border-surface-dim shadow-[0_4px_12px_rgba(31,27,23,0.05)]">
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-md">
            Waste by Category (kg)
          </h3>
          <div className="h-[200px] w-full relative">
            {lossData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lossData}>
                  <CartesianGrid stroke="#ebe1da" vertical={false} />
                  <XAxis
                    dataKey="category"
                    tick={{ fill: "#887275", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    tick={{ fill: "#887275", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip />
                  <Bar dataKey="kg" fill="#9f3c59" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-on-surface-variant">No data for this period.</p>
            )}
          </div>
        </section>

        <section className="col-span-1 md:col-span-6 bg-surface-container-lowest rounded-xl p-md border border-surface-dim shadow-[0_4px_12px_rgba(31,27,23,0.05)]">
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-md">
            Main Waste Causes
          </h3>
          <div className="h-[200px] w-full relative flex justify-center">
            {causesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={causesData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={0}
                  >
                    {causesData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ fontFamily: "Inter", fontSize: 12, color: "#554245" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-on-surface-variant">No data for this period.</p>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
