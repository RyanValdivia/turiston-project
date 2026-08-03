import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { requireSession, useSession } from "@/lib/session";
import {
  createOperacion,
  ApiError,
  type Turno,
  type CategoriaResiduo,
  type MotivoGeneracion,
} from "@/lib/api";

export const Route = createFileRoute("/register")({
  ssr: false,
  beforeLoad: ({ context }) => requireSession(context.queryClient),
  head: () => ({
    meta: [
      { title: "Daily Data Registration - RESTORA" },
      {
        name: "description",
        content: "Log operational and waste data accurately for end-of-day closing.",
      },
      { property: "og:title", content: "Daily Data Registration - RESTORA" },
      {
        property: "og:description",
        content: "Log operational and waste data accurately for end-of-day closing.",
      },
    ],
  }),
  component: RegisterPage,
});

const WASTE_CATEGORIES: Record<
  string,
  { label: string; categoria: CategoriaResiduo; motivo: MotivoGeneracion }
> = {
  prep: { label: "Preparation Error", categoria: "MERMA_PREPARACION", motivo: "ERROR_PREPARACION" },
  spoilage: {
    label: "Spoilage / Expired",
    categoria: "PRODUCTO_DETERIORADO",
    motivo: "PRODUCTO_VENCIDO",
  },
  customer: { label: "Customer Return", categoria: "RESTOS_CLIENTE", motivo: "DEVOLUCION_CLIENTE" },
  overproduction: {
    label: "Overproduction",
    categoria: "SOBREPRODUCCION",
    motivo: "SOBREPRODUCCION",
  },
};

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return "Could not save this entry. Try again.";
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function RegisterPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const session = useSession();
  const restauranteId = session.data?.restaurante.id ?? "";

  const [entryDate, setEntryDate] = useState(todayISO());
  const [turno, setTurno] = useState<Turno>("MANANA");
  const [dailySales, setDailySales] = useState("");
  const [dishesPrepared, setDishesPrepared] = useState("");
  const [dishesSold, setDishesSold] = useState("");
  const [wasteItemName, setWasteItemName] = useState("");
  const [wasteCategory, setWasteCategory] = useState("");
  const [wasteQuantity, setWasteQuantity] = useState("");
  const [wasteLoss, setWasteLoss] = useState("");

  const mutation = useMutation({
    mutationFn: () => {
      const ventas =
        dishesSold && Number(dishesSold) > 0
          ? [
              {
                concepto: "Ventas del día",
                cantidad: Number(dishesSold),
                montoTotal: Number(dailySales) || 0,
              },
            ]
          : [];
      const producciones =
        dishesPrepared && Number(dishesPrepared) > 0
          ? [
              {
                productoAsociado: "Platos preparados",
                cantidadProducida: Number(dishesPrepared),
                unidad: "platos",
              },
            ]
          : [];
      const desperdicios =
        wasteCategory && wasteItemName && wasteQuantity
          ? [
              {
                categoria: WASTE_CATEGORIES[wasteCategory]!.categoria,
                motivo: WASTE_CATEGORIES[wasteCategory]!.motivo,
                cantidadKg: Number(wasteQuantity),
                area: "COCINA" as const,
                productoAsociado: wasteItemName,
                destinoPrevisto: "PENDIENTE_DEFINIR" as const,
                turno,
                fecha: entryDate,
                ...(wasteLoss ? { costoManual: Number(wasteLoss) } : {}),
              },
            ]
          : [];

      return createOperacion(restauranteId, {
        fecha: entryDate,
        turno,
        ventas,
        producciones,
        desperdicios,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["operaciones"] });
      navigate({ to: "/history" });
    },
  });

  return (
    <AppShell active="/register">
      <div className="max-w-2xl mx-auto w-full">
        <div className="mb-lg">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-xs">Today's Shift</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Log operational and waste data accurately for end-of-day closing.
          </p>
        </div>
        <form
          className="space-y-lg"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          {/* Operational Info */}
          <section className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant/30 shadow-[0_4px_12px_rgba(31,27,23,0.02)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-secondary opacity-80" />
            <div className="flex items-center gap-sm mb-md">
              <span className="material-symbols-outlined text-secondary">insights</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">
                Operational Overview
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <div className="input-group flex flex-col gap-xs">
                <label
                  className="font-label-md text-label-md text-on-surface-variant transition-colors"
                  htmlFor="entry-date"
                >
                  Date
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-outline-variant icon-container transition-colors pointer-events-none">
                    calendar_today
                  </span>
                  <input
                    className="w-full h-12 pl-10 pr-4 bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md text-body-md text-on-surface appearance-none"
                    id="entry-date"
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="input-group flex flex-col gap-xs">
                <label
                  className="font-label-md text-label-md text-on-surface-variant transition-colors"
                  htmlFor="entry-turno"
                >
                  Shift
                </label>
                <select
                  className="w-full h-12 px-4 bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md text-body-md text-on-surface"
                  id="entry-turno"
                  value={turno}
                  onChange={(e) => setTurno(e.target.value as Turno)}
                >
                  <option value="MANANA">Morning</option>
                  <option value="TARDE">Afternoon</option>
                  <option value="NOCHE">Night</option>
                </select>
              </div>
              <div className="input-group flex flex-col gap-xs">
                <label
                  className="font-label-md text-label-md text-on-surface-variant transition-colors"
                  htmlFor="daily-sales"
                >
                  Daily Sales (PEN)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 font-body-md text-body-md text-outline-variant icon-container transition-colors pointer-events-none">
                    S/
                  </span>
                  <input
                    className="w-full h-12 pl-10 pr-4 bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md text-body-md text-on-surface"
                    id="daily-sales"
                    inputMode="decimal"
                    placeholder="0.00"
                    type="text"
                    value={dailySales}
                    onChange={(e) => setDailySales(e.target.value)}
                  />
                </div>
              </div>
              <div className="input-group flex flex-col gap-xs">
                <label
                  className="font-label-md text-label-md text-on-surface-variant transition-colors"
                  htmlFor="dishes-prepared"
                >
                  Dishes Prepared
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-outline-variant icon-container transition-colors pointer-events-none">
                    soup_kitchen
                  </span>
                  <input
                    className="w-full h-12 pl-10 pr-4 bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md text-body-md text-on-surface"
                    id="dishes-prepared"
                    inputMode="numeric"
                    placeholder="0"
                    type="text"
                    value={dishesPrepared}
                    onChange={(e) => setDishesPrepared(e.target.value)}
                  />
                </div>
              </div>
              <div className="input-group flex flex-col gap-xs">
                <label
                  className="font-label-md text-label-md text-on-surface-variant transition-colors"
                  htmlFor="dishes-sold"
                >
                  Dishes Sold
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-outline-variant icon-container transition-colors pointer-events-none">
                    receipt_long
                  </span>
                  <input
                    className="w-full h-12 pl-10 pr-4 bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md text-body-md text-on-surface"
                    id="dishes-sold"
                    inputMode="numeric"
                    placeholder="0"
                    type="text"
                    value={dishesSold}
                    onChange={(e) => setDishesSold(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Waste Info */}
          <section className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant/30 shadow-[0_4px_12px_rgba(31,27,23,0.02)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-error opacity-80" />
            <div className="flex items-center justify-between mb-md">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-error">delete_sweep</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Waste Log</h3>
              </div>
            </div>
            <div className="bg-surface-container-low rounded-lg p-sm border border-outline-variant/20 grid grid-cols-1 md:grid-cols-2 gap-md">
              <div className="input-group flex flex-col gap-xs md:col-span-2">
                <label
                  className="font-label-md text-label-md text-on-surface-variant transition-colors"
                  htmlFor="waste-item"
                >
                  Item / Dish
                </label>
                <input
                  className="w-full h-12 px-4 bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md text-body-md text-on-surface"
                  id="waste-item"
                  placeholder="e.g. Lomo Saltado, vegetable trimmings"
                  type="text"
                  value={wasteItemName}
                  onChange={(e) => setWasteItemName(e.target.value)}
                />
              </div>
              <div className="input-group flex flex-col gap-xs md:col-span-2">
                <label
                  className="font-label-md text-label-md text-on-surface-variant transition-colors"
                  htmlFor="waste-category"
                >
                  Category
                </label>
                <div className="relative flex items-center">
                  <select
                    className="w-full h-12 px-4 bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md text-body-md text-on-surface appearance-none cursor-pointer"
                    id="waste-category"
                    value={wasteCategory}
                    onChange={(e) => setWasteCategory(e.target.value)}
                  >
                    <option value="">Select category...</option>
                    {Object.entries(WASTE_CATEGORIES).map(([key, v]) => (
                      <option key={key} value={key}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 text-outline-variant pointer-events-none">
                    arrow_drop_down
                  </span>
                </div>
              </div>
              <div className="input-group flex flex-col gap-xs">
                <label
                  className="font-label-md text-label-md text-on-surface-variant transition-colors"
                  htmlFor="waste-quantity"
                >
                  Quantity (Kg)
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-outline-variant icon-container transition-colors pointer-events-none">
                    scale
                  </span>
                  <input
                    className="w-full h-12 pl-10 pr-4 bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md text-body-md text-on-surface"
                    id="waste-quantity"
                    inputMode="decimal"
                    placeholder="0.0"
                    type="text"
                    value={wasteQuantity}
                    onChange={(e) => setWasteQuantity(e.target.value)}
                  />
                </div>
              </div>
              <div className="input-group flex flex-col gap-xs">
                <label
                  className="font-label-md text-label-md text-on-surface-variant transition-colors"
                  htmlFor="waste-loss"
                >
                  Estimated Loss (PEN)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 font-body-md text-body-md text-outline-variant icon-container transition-colors pointer-events-none">
                    S/
                  </span>
                  <input
                    className="w-full h-12 pl-10 pr-4 bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md text-body-md text-on-surface"
                    id="waste-loss"
                    inputMode="decimal"
                    placeholder="0.00 (optional)"
                    type="text"
                    value={wasteLoss}
                    onChange={(e) => setWasteLoss(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </section>

          {mutation.isError && (
            <p className="text-sm text-red-600">{errorMessage(mutation.error)}</p>
          )}

          <div className="pt-sm pb-xl">
            <button
              className="w-full h-12 bg-primary text-on-primary font-headline-sm text-headline-sm rounded-lg shadow-sm active:scale-95 transition-all duration-150 flex justify-center items-center gap-sm hover:bg-primary/90 disabled:opacity-60"
              disabled={mutation.isPending || !restauranteId}
              type="submit"
            >
              <span className="material-symbols-outlined">save</span>
              {mutation.isPending ? "Saving…" : "Save Entry"}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
