import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/history")({
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

interface Record {
  date: string;
  closedBy: string;
  status: "Reconciled" | "Flagged";
  sales: string;
  waste: string;
  waColor: string;
  impact: string;
  iconBg: string;
  iconText: string;
}

const thisWeek: Record[] = [
  {
    date: "Oct 24, 2023",
    closedBy: "Closed by Maria G.",
    status: "Reconciled",
    sales: "S/ 4,250",
    waste: "12.5 kg",
    waColor: "text-on-surface",
    impact: "- S/ 145",
    iconBg: "bg-primary-fixed",
    iconText: "text-on-primary-fixed",
  },
  {
    date: "Oct 23, 2023",
    closedBy: "Closed by Carlos R.",
    status: "Reconciled",
    sales: "S/ 3,890",
    waste: "8.2 kg",
    waColor: "text-on-surface",
    impact: "- S/ 89",
    iconBg: "bg-surface-container",
    iconText: "text-on-surface-variant",
  },
];

const lastWeek: Record[] = [
  {
    date: "Oct 16, 2023",
    closedBy: "Closed by Maria G.",
    status: "Flagged",
    sales: "S/ 5,100",
    waste: "22.4 kg",
    waColor: "text-error",
    impact: "- S/ 320",
    iconBg: "bg-surface-container",
    iconText: "text-on-surface-variant",
  },
];

function RecordCard({ record }: { record: Record }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant shadow-[0_4px_12px_rgba(31,27,23,0.02)] hover:shadow-[0_4px_12px_rgba(31,27,23,0.05)] transition-all cursor-pointer group">
      <div className="flex justify-between items-start mb-sm">
        <div className="flex items-center gap-sm">
          <div className={`w-10 h-10 rounded-lg ${record.iconBg} flex items-center justify-center ${record.iconText}`}>
            <span className="material-symbols-outlined">calendar_today</span>
          </div>
          <div>
            <h4 className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary transition-colors">{record.date}</h4>
            <p className="font-label-sm text-label-sm text-on-surface-variant">{record.closedBy}</p>
          </div>
        </div>
        <span
          className={`px-2 py-1 rounded-full font-label-sm text-label-sm ${
            record.status === "Reconciled"
              ? "bg-secondary-container text-on-secondary-container"
              : "bg-error-container text-on-error-container"
          }`}
        >
          {record.status}
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-sm pt-sm border-t border-surface-container">
        <div>
          <p className="font-label-sm text-label-sm text-on-surface-variant mb-xs">Total Sales</p>
          <p className="font-headline-sm text-headline-sm text-on-surface">{record.sales}</p>
        </div>
        <div>
          <p className="font-label-sm text-label-sm text-on-surface-variant mb-xs">Total Waste</p>
          <p className={`font-headline-sm text-headline-sm ${record.waColor}`}>{record.waste}</p>
        </div>
        <div>
          <p className="font-label-sm text-label-sm text-on-surface-variant mb-xs">Econ Impact</p>
          <p className="font-headline-sm text-headline-sm text-error">{record.impact}</p>
        </div>
        <div className="hidden md:flex justify-end items-center">
          <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">chevron_right</span>
        </div>
      </div>
    </div>
  );
}

function HistoryPage() {
  const [search, setSearch] = useState("");

  return (
    <AppShell active="/history">
      <div className="max-w-4xl mx-auto space-y-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
          <div>
            <h2 className="font-headline-sm text-headline-sm-mobile md:font-headline-md md:text-headline-md text-on-surface">Record History</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-xs">Review past daily inputs and economic impacts.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-sm w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input
                className="w-full h-12 pl-10 pr-4 rounded-lg bg-surface-container-lowest border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md outline-none transition-all"
                placeholder="Search records..."
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="h-12 px-md flex items-center justify-center gap-sm rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface hover:bg-surface-container transition-colors whitespace-nowrap">
              <span className="material-symbols-outlined">filter_list</span>
              <span className="font-label-md text-label-md">Filter by Date</span>
            </button>
          </div>
        </div>

        <div className="space-y-sm">
          <h3 className="font-label-md text-label-md text-on-surface-variant pt-sm">This Week</h3>
          {thisWeek.map((r) => (
            <RecordCard key={r.date} record={r} />
          ))}
          <h3 className="font-label-md text-label-md text-on-surface-variant pt-md">Last Week</h3>
          {lastWeek.map((r) => (
            <RecordCard key={r.date} record={r} />
          ))}
        </div>
        <div className="flex justify-center pt-md pb-xl">
          <button className="px-lg py-sm rounded-lg bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-variant transition-colors">
            Load More Records
          </button>
        </div>
      </div>
    </AppShell>
  );
}
