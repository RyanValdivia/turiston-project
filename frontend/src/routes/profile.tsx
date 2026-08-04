import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { requireSession, useSession } from "@/lib/session";
import { logout, updateRestaurante, ApiError } from "@/lib/api";

export const Route = createFileRoute("/profile")({
  ssr: false,
  beforeLoad: ({ context }) => requireSession(context.queryClient),
  head: () => ({
    meta: [
      { title: "Perfil y ajustes - restora" },
      { name: "description", content: "Gestiona los datos de tu restaurante, preferencias y cuenta." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const session = useSession();
  const restaurante = session.data?.restaurante;

  const [pushNotifications, setPushNotifications] = useState(true);
  const [editing, setEditing] = useState(false);
  const [nombre, setNombre] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [lineaBase, setLineaBase] = useState("");

  useEffect(() => {
    if (restaurante) {
      setNombre(restaurante.nombre);
      setCiudad(restaurante.ciudad);
      setLineaBase(restaurante.lineaBaseSemanalKg?.toString() ?? "");
    }
  }, [restaurante]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateRestaurante(restaurante!.id, {
        nombre,
        ciudad,
        lineaBaseSemanalKg: lineaBase ? Number(lineaBase) : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session"] });
      setEditing(false);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["session"] });
      navigate({ to: "/auth" });
    },
  });

  return (
    <AppShell active="/profile">
      <div className="mb-lg">
        <h2 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-on-surface mb-xs">
          Perfil y ajustes
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Gestiona los datos de tu restaurante, preferencias y cuenta.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-md">
        {/* Restaurant Profile */}
        <div className="md:col-span-8 bg-surface-container-lowest rounded-xl p-lg border border-outline-variant sillar-shadow">
          <div className="flex items-center justify-between mb-lg">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">
              Perfil del restaurante
            </h3>
            {editing ? (
              <div className="flex gap-sm">
                <button
                  className="text-on-surface-variant hover:bg-surface-container px-3 py-1 rounded-full transition-colors font-label-md text-label-md"
                  onClick={() => setEditing(false)}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="text-primary hover:bg-surface-container px-3 py-1 rounded-full transition-colors font-label-md text-label-md disabled:opacity-60"
                  disabled={saveMutation.isPending}
                  onClick={() => saveMutation.mutate()}
                  type="button"
                >
                  {saveMutation.isPending ? "Guardando…" : "Guardar"}
                </button>
              </div>
            ) : (
              <button
                className="text-primary hover:bg-surface-container px-3 py-1 rounded-full transition-colors font-label-md text-label-md"
                onClick={() => setEditing(true)}
                type="button"
              >
                Editar
              </button>
            )}
          </div>
          {saveMutation.isError && (
            <p className="text-sm text-red-600 mb-md">
              {saveMutation.error instanceof ApiError
                ? saveMutation.error.message
                : "No se pudieron guardar los cambios."}
            </p>
          )}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-lg mb-lg">
            <div className="flex-1 w-full space-y-sm">
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
                  Nombre del restaurante
                </label>
                <input
                  className="w-full h-[48px] px-sm rounded-lg border border-outline focus:border-primary focus:ring-1 focus:ring-primary bg-surface-container-lowest font-body-md text-body-md text-on-surface disabled:opacity-70"
                  disabled={!editing}
                  onChange={(e) => setNombre(e.target.value)}
                  type="text"
                  value={nombre}
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
                Ciudad
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                  location_on
                </span>
                <input
                  className="w-full h-[48px] pl-10 pr-sm rounded-lg border border-outline focus:border-primary focus:ring-1 focus:ring-primary bg-surface-container-lowest font-body-md text-body-md text-on-surface disabled:opacity-70"
                  disabled={!editing}
                  onChange={(e) => setCiudad(e.target.value)}
                  type="text"
                  value={ciudad}
                />
              </div>
            </div>
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
                Correo de contacto
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                  mail
                </span>
                <input
                  className="w-full h-[48px] pl-10 pr-sm rounded-lg border border-outline bg-surface-container-lowest font-body-md text-body-md text-on-surface opacity-70"
                  readOnly
                  type="email"
                  value={session.data?.email ?? ""}
                />
              </div>
            </div>
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
                Línea base semanal (kg)
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                  scale
                </span>
                <input
                  className="w-full h-[48px] pl-10 pr-sm rounded-lg border border-outline focus:border-primary focus:ring-1 focus:ring-primary bg-surface-container-lowest font-body-md text-body-md text-on-surface disabled:opacity-70"
                  disabled={!editing}
                  inputMode="decimal"
                  onChange={(e) => setLineaBase(e.target.value)}
                  placeholder="Se usa para el indicador de Prevención"
                  type="text"
                  value={lineaBase}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Card */}
        <div className="md:col-span-4 bg-primary-container text-on-primary-container rounded-xl p-lg flex flex-col justify-between relative overflow-hidden sillar-shadow">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-sm relative z-10">
              <span className="font-label-md text-label-md uppercase tracking-wider bg-white/20 px-2 py-1 rounded-full">
                Plan activo
              </span>
              <span className="material-symbols-outlined" data-weight="fill">
                verified
              </span>
            </div>
            <h3 className="font-display-lg-mobile text-display-lg-mobile font-bold mb-xs relative z-10">
              IA Premium
            </h3>
            <p className="font-body-md text-body-md opacity-90 relative z-10">
              Acceso completo a análisis avanzado, registro automatizado con IA y soporte
              prioritario.
            </p>
          </div>
        </div>

        {/* Preferences */}
        <div className="md:col-span-12 bg-surface-container-lowest rounded-xl p-0 border border-outline-variant overflow-hidden sillar-shadow">
          <div className="p-lg border-b border-outline-variant bg-surface-container-low">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">
              Preferencias de la app
            </h3>
          </div>
          <ul className="divide-y divide-outline-variant">
            <li className="flex items-center justify-between p-md hover:bg-surface-container transition-colors">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center mr-md text-on-surface-variant">
                  <span className="material-symbols-outlined">notifications_active</span>
                </div>
                <div>
                  <h4 className="font-body-lg text-body-lg text-on-surface font-medium">
                    Notificaciones push
                  </h4>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    Alertas de nuevos registros y reportes.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  checked={pushNotifications}
                  onChange={() => setPushNotifications((v) => !v)}
                  className="sr-only peer"
                  type="checkbox"
                />
                <div className="w-11 h-6 bg-surface-dim peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
              </label>
            </li>
          </ul>
        </div>

        {/* Danger Zone */}
        <div className="md:col-span-12 mt-md">
          <button
            className="w-full md:w-auto h-[48px] px-lg rounded-lg border border-error text-error hover:bg-error-container hover:text-on-error-container transition-colors font-label-md text-label-md font-bold flex items-center justify-center disabled:opacity-60"
            disabled={logoutMutation.isPending}
            onClick={() => logoutMutation.mutate()}
            type="button"
          >
            <span className="material-symbols-outlined mr-2 text-[20px]">logout</span>
            {logoutMutation.isPending ? "Cerrando sesión…" : "Cerrar sesión"}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
