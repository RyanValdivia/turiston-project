import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Restora - Reports" },
      { name: "description", content: "Generate and export insights for Arequipa Central." },
      { property: "og:title", content: "Restora - Reports" },
      { property: "og:description", content: "Generate and export insights for Arequipa Central." },
    ],
  }),
  component: ReportsPage,
});

const reportCards = [
  {
    title: "Q3 Financial Summary",
    date: "Oct 15",
    description: "Detailed breakdown of Q3 performance against projected KPI targets.",
    icon: "bar_chart",
    iconColor: "text-primary",
    gradient: "bg-gradient-to-br from-primary-container/20 to-surface-variant",
    hiddenOnMobile: false,
  },
  {
    title: "Sep Waste Reduction",
    date: "Oct 02",
    description: "Analysis of organic waste output from prep stations.",
    icon: "pie_chart",
    iconColor: "text-secondary",
    gradient: "bg-gradient-to-bl from-secondary-container/30 to-surface-variant",
    hiddenOnMobile: false,
  },
  {
    title: "Energy Audit 2023",
    date: "Sep 28",
    description: "Annual review of sustainability indicators and utility usage.",
    icon: "show_chart",
    iconColor: "text-tertiary",
    gradient: "bg-gradient-to-tr from-tertiary-container/20 to-surface-variant",
    hiddenOnMobile: true,
  },
];

function ReportsPage() {
  const [month, setMonth] = useState("November 2023");

  return (
    <AppShell active="/reports">
      <header className="mb-lg md:mb-xl flex flex-col md:flex-row md:items-end justify-between gap-md">
        <div>
          <h2 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-xs">Business Reports</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Generate and export insights for Arequipa Central.</p>
        </div>
        <button className="bg-primary text-on-primary h-12 px-lg rounded-lg font-headline-sm text-headline-sm flex items-center justify-center gap-sm hover:bg-primary-container transition-colors shadow-sm active:scale-95 w-full md:w-auto">
          <span className="material-symbols-outlined">add</span>
          New Report
        </button>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-12 gap-md md:gap-lg mb-xl">
        <div className="md:col-span-8 rounded-xl p-lg flex flex-col justify-between min-h-[240px] bg-surface-container-lowest/80 backdrop-blur-md border border-surface-dim shadow-soft">
          <div className="flex justify-between items-start mb-md">
            <div>
              <div className="flex items-center gap-sm text-primary mb-xs">
                <span className="material-symbols-outlined">calendar_month</span>
                <span className="font-label-md text-label-md uppercase tracking-wider">Financials</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Monthly Summaries</h3>
              <p className="font-body-md text-body-md text-on-surface-variant mt-sm max-w-md">
                Comprehensive financial breakdown including revenue streams, operational costs, and profit margins.
              </p>
            </div>
          </div>
          <form className="flex flex-col sm:flex-row gap-sm mt-auto" onSubmit={(e) => e.preventDefault()}>
            <div className="relative flex-1">
              <select
                className="w-full h-12 pl-md pr-xl rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary appearance-none font-body-md text-body-md"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              >
                <option>November 2023</option>
                <option>October 2023</option>
                <option>September 2023</option>
              </select>
              <span className="material-symbols-outlined absolute right-md top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
            </div>
            <button
              className="bg-surface-container-lowest text-primary border border-primary h-12 px-lg rounded-lg font-headline-sm text-headline-sm flex items-center justify-center gap-sm hover:bg-surface-container transition-colors sm:w-auto w-full"
              type="button"
            >
              <span className="material-symbols-outlined">magic_button</span>
              Generate
            </button>
          </form>
        </div>

        <div className="md:col-span-4 bg-secondary-container rounded-xl p-lg flex flex-col justify-between min-h-[240px] relative overflow-hidden group cursor-pointer hover:shadow-md transition-shadow">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-on-secondary-container via-transparent to-transparent"></div>
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center text-secondary mb-md shadow-sm group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">eco</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-secondary-container mb-xs">Sustainability Indicators</h3>
            <p className="font-body-md text-body-md text-on-secondary-container/80">Energy usage, water consumption, and carbon footprint metrics.</p>
          </div>
          <div className="relative z-10 mt-md flex items-center text-on-secondary-container font-headline-sm text-headline-sm">
            Configure Report
            <span className="material-symbols-outlined ml-xs group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </div>
        </div>

        <div className="md:col-span-12 rounded-xl p-lg flex flex-col md:flex-row gap-lg items-center justify-between bg-surface-container-lowest/80 backdrop-blur-md border border-surface-dim shadow-soft">
          <div className="flex-1">
            <div className="flex items-center gap-sm text-tertiary mb-xs">
              <span className="material-symbols-outlined">recycling</span>
              <span className="font-label-md text-label-md uppercase tracking-wider">Operations</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface">Waste Reduction Analysis</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mt-sm max-w-2xl">
              Track ingredient utilization, identify spoilage trends, and measure compliance with zero-waste initiatives across all kitchen stations.
            </p>
          </div>
          <div className="flex gap-sm w-full md:w-auto">
            <button className="flex-1 md:flex-none bg-surface-container-lowest text-on-surface border border-outline-variant h-12 px-md rounded-lg font-headline-sm text-headline-sm flex items-center justify-center gap-sm hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined">tune</span>
              Filters
            </button>
            <button className="flex-1 md:flex-none bg-primary text-on-primary h-12 px-lg rounded-lg font-headline-sm text-headline-sm flex items-center justify-center gap-sm hover:bg-primary-container transition-colors shadow-sm">
              <span className="material-symbols-outlined">play_arrow</span>
              Run
            </button>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-md">
          <h2 className="font-headline-md text-headline-md text-on-surface">Recent Reports</h2>
          <button className="text-primary font-headline-sm text-headline-sm hover:underline">View All</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {reportCards.map((card) => (
            <div
              key={card.title}
              className={`rounded-xl p-md flex flex-col bg-surface-container-lowest/80 backdrop-blur-md border border-surface-dim shadow-soft ${card.hiddenOnMobile ? "hidden md:flex" : ""}`}
            >
              <div className="w-full h-32 bg-surface-container rounded-lg mb-md overflow-hidden relative border border-outline-variant/30">
                <div className={`absolute inset-0 ${card.gradient} opacity-50`}></div>
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-surface-container to-transparent"></div>
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${card.iconColor}`}>
                  <span className="material-symbols-outlined text-[48px]">{card.icon}</span>
                </div>
              </div>
              <div className="flex justify-between items-start mb-sm">
                <h4 className="font-headline-sm text-headline-sm text-on-surface line-clamp-1">{card.title}</h4>
                <span className="shrink-0 ml-sm px-2 py-0.5 rounded-full bg-surface-variant text-on-surface-variant font-label-sm text-label-sm">{card.date}</span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant mb-md flex-1 line-clamp-2">{card.description}</p>
              <button className="w-full bg-surface-container-lowest text-primary border border-outline-variant h-10 rounded-lg font-label-md text-label-md flex items-center justify-center gap-xs hover:border-primary hover:bg-surface transition-colors">
                <span className="material-symbols-outlined text-[18px]">download</span>
                Download PDF
              </button>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
