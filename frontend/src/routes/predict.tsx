import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/AppShell";
import { requireSession, useSession } from "@/lib/session";
import { createPrediccion, listPredicciones, ApiError } from "@/lib/api";

export const Route = createFileRoute("/predict")({
  ssr: false,
  beforeLoad: ({ context }) => requireSession(context.queryClient),
  head: () => ({
    meta: [
      { title: "AI Predict — RESTORA Cortex Forecasts" },
      {
        name: "description",
        content:
          "AI-driven forecasts for demand, resource allocation and waste reduction based on historical restaurant data.",
      },
      { property: "og:title", content: "AI Predict — RESTORA Cortex Forecasts" },
      {
        property: "og:description",
        content: "Predictive intelligence for demand, prep targets and expected waste.",
      },
    ],
  }),
  component: PredictPage,
});

function inSevenDays() {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function PredictPage() {
  const queryClient = useQueryClient();
  const session = useSession();
  const restauranteId = session.data?.restaurante.id ?? "";
  const [fecha, setFecha] = useState(inSevenDays());

  const historial = useQuery({
    queryKey: ["predicciones", restauranteId],
    queryFn: () => listPredicciones(restauranteId),
    enabled: !!restauranteId,
  });

  const latest = historial.data?.find((p) => p.estado === "COMPLETADA" && p.resultado);

  const mutation = useMutation({
    mutationFn: () => createPrediccion(restauranteId, { fecha }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["predicciones"] });
    },
  });

  const active = mutation.data?.resultado ?? latest?.resultado ?? null;
  const chartData = (active?.predicciones ?? [])
    .slice()
    .sort((a, b) => b.prediccion - a.prediccion)
    .map((p) => ({ plato: p.plato, unidades: p.prediccion }));
  const top = chartData[0];

  const insufficientData =
    mutation.isError && mutation.error instanceof ApiError && mutation.error.status === 422;

  return (
    <AppShell active="/predict">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-tertiary-fixed-dim">auto_awesome</span>
            <span className="font-label-md text-label-md tracking-wider uppercase text-on-surface-variant">
              Restora Cortex
            </span>
          </div>
          <h2 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface">
            Predictive <span className="ai-gradient-text">Intelligence</span>
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-2 max-w-2xl">
            Demand forecast by dish, trained on your own sales history (RandomForest model).
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <input
            className="h-12 px-4 rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface font-label-md text-label-md"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
          <button
            className="h-12 px-4 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-colors flex items-center gap-2 shadow-md disabled:opacity-60"
            disabled={mutation.isPending || !restauranteId}
            onClick={() => mutation.mutate()}
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            {mutation.isPending ? "Predicting…" : "Predict"}
          </button>
        </div>
      </div>

      {insufficientData && (
        <div className="w-full bg-error-container text-on-error-container rounded-xl p-6">
          {mutation.error instanceof ApiError
            ? mutation.error.message
            : "Not enough sales history yet."}
        </div>
      )}
      {mutation.isError && !insufficientData && (
        <p className="text-sm text-red-600">Could not run the prediction. Try again.</p>
      )}

      {/* AI Insight */}
      {active && top && (
        <div className="w-full bg-inverse-surface text-inverse-on-surface rounded-xl p-6 md:p-8 relative overflow-hidden shadow-lg border border-tertiary/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-tertiary-fixed-dim/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="w-12 h-12 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined">lightbulb</span>
            </div>
            <div className="flex-1">
              <h3 className="font-headline-md text-headline-md text-tertiary-fixed mb-2">
                Cortex Recommendation
              </h3>
              <p className="font-body-md text-body-md text-inverse-on-surface/90 leading-relaxed">
                Highest expected demand:{" "}
                <strong className="text-inverse-on-surface">{top.plato}</strong> (~
                {top.unidades.toFixed(0)} units). Model precision ~
                {active.metrics.precisionPct.toFixed(0)}% on this restaurant's history — prep
                accordingly and log any real waste in Today's Shift.
              </p>
            </div>
            <Link
              className="shrink-0 h-10 px-6 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-md text-label-md hover:bg-tertiary-fixed-dim transition-colors flex items-center"
              to="/register"
            >
              Log Adjustment
            </Link>
          </div>
        </div>
      )}

      {/* Bento grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        <div className="col-span-1 md:col-span-2 bg-surface-container-lowest rounded-xl p-6 shadow-soft border border-outline-variant/30 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Demand Forecast</h3>
              <p className="font-label-md text-label-md text-on-surface-variant mt-1">
                Predicted units per dish for {fecha}
              </p>
            </div>
            <span className="material-symbols-outlined text-primary">monitoring</span>
          </div>
          <div className="flex-1 relative w-full h-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis
                    dataKey="plato"
                    tick={{ fontSize: 11 }}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="unidades" fill="#7a1f3d" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-on-surface-variant">
                Run a prediction to see the demand forecast by dish.
              </p>
            )}
          </div>
        </div>

        <div className="col-span-1 bg-surface-container-lowest rounded-xl p-6 shadow-soft border border-outline-variant/30 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
                <span className="material-symbols-outlined">verified</span>
              </div>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Model Confidence</h3>
            <div className="mt-4">
              <span className="font-display-lg text-display-lg text-on-surface">
                {active ? active.metrics.precisionPct.toFixed(0) : "—"}
              </span>{" "}
              <span className="font-body-md text-body-md text-on-surface-variant">% precision</span>
            </div>
          </div>
          {active && (
            <div className="mt-6 space-y-3 font-label-md text-label-md">
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">MAE (avg. error)</span>
                <span className="text-on-surface font-semibold">
                  {active.metrics.mae.toFixed(1)} units
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">R²</span>
                <span className="text-on-surface font-semibold">
                  {active.metrics.r2.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Trained</span>
                <span className="text-on-surface font-semibold">
                  {new Date(active.entrenadoEn).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="col-span-1 md:col-span-3">
          <div className="mb-2">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">
              Production Targets
            </h3>
            <p className="font-label-md text-label-md text-on-surface-variant mt-1">
              Suggested prep levels based on predicted demand
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            {chartData.slice(0, 6).map((t) => (
              <div
                key={t.plato}
                className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/30 flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined">restaurant</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-headline-sm text-body-lg text-on-surface">{t.plato}</h4>
                  <span className="font-label-md text-label-md font-bold text-primary">
                    {t.unidades.toFixed(0)} units suggested
                  </span>
                </div>
              </div>
            ))}
            {chartData.length === 0 && (
              <p className="text-sm text-on-surface-variant">
                No forecast yet — run a prediction above.
              </p>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
