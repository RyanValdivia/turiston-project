import { useQuery, type QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import { me } from "./api";

export const sessionQueryOptions = {
  queryKey: ["session"] as const,
  queryFn: me,
  retry: false,
  staleTime: 60_000,
};

/** Sesión actual (usuario + restaurante). Redirige el propio caller a /auth si no hay sesión (usar dentro de una ruta protegida). */
export function useSession() {
  return useQuery(sessionQueryOptions);
}

/**
 * Guard para `beforeLoad` de rutas protegidas: asegura que haya sesión antes
 * de renderizar, redirige a /auth si no. Comparte cache con `useSession()`
 * (misma queryKey), así el componente no vuelve a pedir /auth/me.
 */
export async function requireSession(queryClient: QueryClient) {
  try {
    return await queryClient.ensureQueryData(sessionQueryOptions);
  } catch {
    throw redirect({ to: "/auth" });
  }
}
