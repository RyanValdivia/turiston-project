import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/dashboard")({
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

function DashboardPage() {
  return (
    <AppShell active="/dashboard">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md">
        <div>
          <h2 className="font-headline-sm text-headline-sm-mobile md:font-headline-md md:text-headline-md text-on-surface">
            Overview
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Today's operational metrics for Arequipa Central.
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
              S/ 420.50
            </div>
            <div className="font-label-sm text-label-sm text-error flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
              +5.2% vs last week
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
              45 kg
            </div>
            <div className="font-label-sm text-label-sm text-secondary flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
              -2.1% vs last week
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant shadow-soft flex flex-col justify-between col-span-1">
          <div className="flex items-center gap-2 mb-sm text-on-surface-variant">
            <span className="material-symbols-outlined">eco</span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider">Reduction</span>
          </div>
          <div>
            <div className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-on-surface font-bold">
              12%
            </div>
            <div className="w-full bg-surface-variant h-1.5 rounded-full mt-2">
              <div className="bg-secondary h-1.5 rounded-full" style={{ width: "12%" }} />
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
              18
            </div>
            <div className="font-label-sm text-label-sm text-on-surface-variant mt-1">
              Logged today
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-soft md:col-span-2 overflow-hidden flex flex-col">
          <div className="p-md border-b border-surface-variant flex justify-between items-center bg-surface-bright">
            <h3 className="font-headline-sm text-headline-sm-mobile md:font-headline-md md:text-headline-md text-on-surface">
              Weekly Performance
            </h3>
            <button className="text-on-surface-variant p-1 rounded-full hover:bg-surface-variant transition-colors">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </div>
          <div className="p-md flex-1 min-h-[200px] flex items-end gap-2 relative">
            <div className="absolute inset-0 p-md pointer-events-none">
              <div className="border-b border-dashed border-surface-variant w-full h-[25%]" />
              <div className="border-b border-dashed border-surface-variant w-full h-[25%]" />
              <div className="border-b border-dashed border-surface-variant w-full h-[25%]" />
              <div className="border-b border-solid border-surface-variant w-full h-[25%]" />
            </div>
            <div className="w-full h-full flex items-end justify-around relative z-10 pt-4">
              <div className="w-1/12 bg-surface-variant rounded-t-sm h-[40%] hover:bg-primary-container transition-colors group relative cursor-pointer">
                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface font-label-sm text-label-sm px-2 py-1 rounded shadow-lg transition-opacity whitespace-nowrap">
                  Mon: 45kg
                </div>
              </div>
              <div className="w-1/12 bg-surface-variant rounded-t-sm h-[60%] hover:bg-primary-container transition-colors cursor-pointer" />
              <div className="w-1/12 bg-surface-variant rounded-t-sm h-[30%] hover:bg-primary-container transition-colors cursor-pointer" />
              <div className="w-1/12 bg-surface-variant rounded-t-sm h-[80%] hover:bg-primary-container transition-colors cursor-pointer" />
              <div className="w-1/12 bg-surface-variant rounded-t-sm h-[50%] hover:bg-primary-container transition-colors cursor-pointer" />
              <div className="w-1/12 bg-primary-container rounded-t-sm h-[70%] relative cursor-pointer">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface font-label-sm text-label-sm px-2 py-1 rounded shadow-lg whitespace-nowrap">
                  Sat: 62kg
                </div>
              </div>
              <div className="w-1/12 bg-surface-variant rounded-t-sm h-[20%] hover:bg-primary-container transition-colors cursor-pointer" />
            </div>
          </div>
          <div className="flex justify-around px-md pb-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
            <span>M</span>
            <span>T</span>
            <span>W</span>
            <span>T</span>
            <span>F</span>
            <span className="text-primary font-bold">S</span>
            <span>S</span>
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
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary-container shrink-0 mt-1">
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
              </div>
              <div>
                <div className="font-label-md text-label-md font-bold text-on-surface">
                  Prep Waste Logged
                </div>
                <div className="font-body-md text-body-md text-on-surface-variant line-clamp-1">
                  12kg - Vegetable trimmings
                </div>
                <div className="font-label-sm text-label-sm text-outline mt-0.5">10:45 AM</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-secondary shrink-0 mt-1">
                <span className="material-symbols-outlined text-[16px]">inventory_2</span>
              </div>
              <div>
                <div className="font-label-md text-label-md font-bold text-on-surface">
                  Inventory Adjusted
                </div>
                <div className="font-body-md text-body-md text-on-surface-variant line-clamp-1">
                  Spoilage recorded
                </div>
                <div className="font-label-sm text-label-sm text-outline mt-0.5">09:12 AM</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-error-container flex items-center justify-center text-on-error-container shrink-0 mt-1">
                <span className="material-symbols-outlined text-[16px]">warning</span>
              </div>
              <div>
                <div className="font-label-md text-label-md font-bold text-on-surface">
                  High Loss Alert
                </div>
                <div className="font-body-md text-body-md text-on-surface-variant line-clamp-1">
                  Meat section exceeded 5% loss
                </div>
                <div className="font-label-sm text-label-sm text-outline mt-0.5">
                  Yesterday, 4:20 PM
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}