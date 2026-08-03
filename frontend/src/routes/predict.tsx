import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/predict")({
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

const TARGETS = [
  {
    name: "Ceviche Clásico",
    value: "45 portions",
    suffix: "suggested",
    valueClass: "text-primary",
    trend: false,
    alt: "Top-down view of plated modern Peruvian ceviche in a white ceramic bowl",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDOMs3O6AoP3DzFcQmwa9RhX8LW8de1nvTx_OC6oUiO9ffOkChPDB6nnDUJY13aSjgf3B8t7Tx7WDU1qqqYbtG8jHTVF2xWM-WEF_oQsl2noZT6APXRV8RUcuDmsrgh3f9T-lbnCpYoSXzfkXg_uRZZVwbAUWCkH9eBgq-3eOsB1O3S2xb3OftD7GXUXA2HTNvDU5FBXOr9Uj8OTA3HvT9mexHhNcnUBf9mwGUhzfwxuLNP7Ibni4DoXw",
  },
  {
    name: "Lomo Saltado",
    value: "60 portions",
    suffix: "",
    valueClass: "text-tertiary-fixed-dim",
    trend: true,
    alt: "Close up of a sizzling plate of lomo saltado with tomatoes and red onions",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuB-JuYxD3nM47to4OR8OyfH9OR0mLCBc0nOMBuY7aUGyXYTC_Z2b05C8MSTvq5I0dq_QJZkQhFTQK4by_9QULG9qpj0woPpbO8NSag7c07EqztN3On672TdZBRsc0RIzhud24HwvA1SN_MqUSO4bC_JhIu25VyWtuwYYzHGWaCliFL-r2a56Wy6rcYMWQ1D0K_tRQf5xQn1QhF3eZkFHmZX2y12teiT99IdXkYuDGl7jlxzyLnw7xEF7g",
  },
  {
    name: "Chicha Morada",
    value: "20 Liters",
    suffix: "suggested",
    valueClass: "text-on-surface",
    trend: false,
    alt: "Pitcher of deep purple chicha morada with lime and pineapple on a light wood counter",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDKyYEsY09w5SIFuulLKQUpsZ3wIfpIFQiipjg-ZoYyfXD8x-n0QtFROYvcnL7seAFQwlnaCMskHKqtpl-hNz0GS1447A-1E3BvYR0GBwh-82zIFgqwHxnXFKeHXQcr7fUYZBVDmY3lOC6wTe4TxkHeWDHSt4Fj48HdqIjwbQMdeN8XRdFIVQ-Fi1DPqQFM3d6faQhHz2FcU9EG0PwhEBjsqN5kAnaosa7fxs9aA1EIS6z56zVQxIUTXQ",
  },
];

function PredictPage() {
  return (
    <AppShell active="/predict">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-tertiary-fixed-dim">
              auto_awesome
            </span>
            <span className="font-label-md text-label-md tracking-wider uppercase text-on-surface-variant">
              Restora Cortex
            </span>
          </div>
          <h2 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface">
            Predictive <span className="ai-gradient-text">Intelligence</span>
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-2 max-w-2xl">
            AI-driven forecasts for demand, resource allocation, and waste reduction based on
            historical data and market trends.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="h-12 px-4 rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface font-label-md text-label-md hover:bg-surface-container transition-colors flex items-center gap-2 shadow-sm">
            <span className="material-symbols-outlined text-sm">calendar_today</span>
            Next 7 Days
          </button>
          <button className="h-12 px-4 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-colors flex items-center gap-2 shadow-md">
            <span className="material-symbols-outlined text-sm">refresh</span>
            Regenerate
          </button>
        </div>
      </div>

      {/* AI Insight */}
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
              Expect a <strong className="text-inverse-on-surface">24% surge in demand</strong> for
              Lomo Saltado this upcoming Friday due to a local festival. Recommend increasing beef
              tenderloin prep by 15kg and scheduling one additional line cook for the evening shift.
            </p>
          </div>
          <button className="shrink-0 h-10 px-6 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-md text-label-md hover:bg-tertiary-fixed-dim transition-colors">
            Apply Adjustments
          </button>
        </div>
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        <div className="col-span-1 md:col-span-2 bg-surface-container-lowest rounded-xl p-6 shadow-soft border border-outline-variant/30 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Demand Forecast</h3>
              <p className="font-label-md text-label-md text-on-surface-variant mt-1">
                Expected vs Actual Volume
              </p>
            </div>
            <span className="material-symbols-outlined text-primary">monitoring</span>
          </div>
          <div className="flex-1 relative w-full h-full bg-surface-container/30 rounded-lg flex items-end p-4 gap-2">
            <div className="w-full flex justify-between items-end h-full opacity-70">
              <div className="w-1/12 bg-primary/20 h-[40%] rounded-t-sm" />
              <div className="w-1/12 bg-primary/40 h-[55%] rounded-t-sm" />
              <div className="w-1/12 bg-primary/60 h-[45%] rounded-t-sm" />
              <div className="w-1/12 bg-primary/80 h-[70%] rounded-t-sm relative">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 font-label-sm text-label-sm text-primary">
                  Today
                </div>
              </div>
              <div className="w-1/12 bg-tertiary-fixed-dim/60 h-[85%] rounded-t-sm border border-tertiary-fixed border-dashed" />
              <div className="w-1/12 bg-tertiary-fixed-dim/40 h-[60%] rounded-t-sm border border-tertiary-fixed border-dashed" />
              <div className="w-1/12 bg-tertiary-fixed-dim/30 h-[50%] rounded-t-sm border border-tertiary-fixed border-dashed" />
            </div>
          </div>
        </div>

        <div className="col-span-1 bg-surface-container-lowest rounded-xl p-6 shadow-soft border border-outline-variant/30 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-full bg-error-container text-on-error-container flex items-center justify-center">
                <span className="material-symbols-outlined">delete_sweep</span>
              </div>
              <span className="px-2 py-1 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">
                -12% vs last week
              </span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Expected Waste</h3>
            <div className="mt-4">
              <span className="font-display-lg text-display-lg text-on-surface">4.2</span>{" "}
              <span className="font-body-md text-body-md text-on-surface-variant">kg projected</span>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            <div className="flex justify-between items-center font-label-md text-label-md">
              <span className="text-on-surface-variant">Produce (Tomatoes)</span>
              <span className="text-on-surface font-semibold">2.1 kg</span>
            </div>
            <div className="w-full bg-surface-variant rounded-full h-1.5">
              <div className="bg-error h-1.5 rounded-full" style={{ width: "50%" }} />
            </div>
            <div className="flex justify-between items-center font-label-md text-label-md pt-2">
              <span className="text-on-surface-variant">Dairy (Cheese)</span>
              <span className="text-on-surface font-semibold">1.5 kg</span>
            </div>
            <div className="w-full bg-surface-variant rounded-full h-1.5">
              <div className="bg-primary h-1.5 rounded-full" style={{ width: "35%" }} />
            </div>
          </div>
        </div>

        <div className="col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-md">
          <div className="col-span-1 md:col-span-3 mb-2">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Production Targets</h3>
            <p className="font-label-md text-label-md text-on-surface-variant mt-1">
              Suggested prep levels based on predicted footfall
            </p>
          </div>
          {TARGETS.map((t) => (
            <div
              key={t.name}
              className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/30 flex items-center gap-4 hover:bg-surface-container-lowest/80 transition-colors cursor-pointer"
            >
              <img className="w-16 h-16 rounded-lg object-cover" alt={t.alt} src={t.src} />
              <div className="flex-1">
                <h4 className="font-headline-sm text-body-lg text-on-surface">{t.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`font-label-md text-label-md font-bold flex items-center ${t.valueClass}`}
                  >
                    {t.trend ? (
                      <span className="material-symbols-outlined text-[14px] mr-1">trending_up</span>
                    ) : null}
                    {t.value}
                  </span>
                  {t.suffix ? (
                    <span className="text-xs text-on-surface-variant">{t.suffix}</span>
                  ) : null}
                </div>
              </div>
              <span className="material-symbols-outlined text-outline">chevron_right</span>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}