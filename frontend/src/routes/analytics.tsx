import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
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

const wasteData = [
  { week: "Week 1", waste: 45 },
  { week: "Week 2", waste: 38 },
  { week: "Week 3", waste: 42 },
  { week: "Week 4", waste: 35 },
];

const lossData = [
  { category: "Proteins", loss: 650 },
  { category: "Produce", loss: 320 },
  { category: "Dairy", loss: 180 },
  { category: "Dry Goods", loss: 90 },
];

const causesData = [
  { name: "Spoilage", value: 45, color: "#7a1f3d" },
  { name: "Prep Error", value: 25, color: "#f6be39" },
  { name: "Overproduction", value: 20, color: "#dac0c4" },
  { name: "Plate Waste", value: 10, color: "#a3d2a7" },
];

function AnalyticsPage() {
  const [period, setPeriod] = useState("This Month");

  return (
    <AppShell active="/analytics">
      <div className="mb-lg flex justify-between items-end">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-xs">Performance Analytics</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Track your waste reduction goals.</p>
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
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Waste Evolution (kg)</h3>
            <span className="bg-secondary-container text-on-secondary-container px-2 py-1 rounded-full font-label-sm text-label-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">trending_down</span> -12%
            </span>
          </div>
          <div className="h-[250px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={wasteData}>
                <CartesianGrid stroke="#ebe1da" vertical={false} />
                <XAxis dataKey="week" tick={{ fill: "#887275", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#887275", fontSize: 12 }} axisLine={false} tickLine={false} />
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
          </div>
        </section>

        <section className="col-span-1 md:col-span-4 flex flex-col gap-md">
          <div className="bg-surface-container-lowest rounded-xl p-md border border-surface-dim shadow-[0_4px_12px_rgba(31,27,23,0.05)] flex-1 flex flex-col justify-center">
            <h4 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">Total Economic Loss</h4>
            <div className="flex items-baseline gap-2">
              <span className="font-display-lg text-display-lg text-primary-container">S/ 1,240</span>
              <span className="font-body-md text-body-md text-on-surface-variant">this month</span>
            </div>
          </div>
          <div className="bg-tertiary-fixed rounded-xl p-md shadow-[0_4px_12px_rgba(31,27,23,0.05)] flex-1 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute right-[-20px] top-[-20px] opacity-20">
              <span className="material-symbols-outlined text-[100px]">tips_and_updates</span>
            </div>
            <h4 className="font-label-sm text-label-sm text-on-tertiary-fixed-variant uppercase tracking-wider mb-2 z-10">Improvement Opportunity</h4>
            <p className="font-body-md text-body-md text-on-tertiary-fixed-variant z-10">
              Optimizing prep times could save approx. <strong>S/ 350</strong> weekly.
            </p>
          </div>
        </section>

        <section className="col-span-1 md:col-span-6 bg-surface-container-lowest rounded-xl p-md border border-surface-dim shadow-[0_4px_12px_rgba(31,27,23,0.05)]">
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-md">Economic Loss by Category</h3>
          <div className="h-[200px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lossData}>
                <CartesianGrid stroke="#ebe1da" vertical={false} />
                <XAxis dataKey="category" tick={{ fill: "#887275", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#887275", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="loss" fill="#9f3c59" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="col-span-1 md:col-span-6 bg-surface-container-lowest rounded-xl p-md border border-surface-dim shadow-[0_4px_12px_rgba(31,27,23,0.05)]">
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-md">Main Waste Causes</h3>
          <div className="h-[200px] w-full relative flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={causesData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={0}>
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
          </div>
        </section>
      </div>
    </AppShell>
  );
}
