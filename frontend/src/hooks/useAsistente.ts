import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/session";
import { ApiError } from "@/lib/api";
import {
  enviarMensajeAsistente,
  guardarBorrador,
  type FlujoId,
  type MensajeChat,
  type RespuestaAsistente,
} from "@/lib/asistente";

export type EstadoAsistente = "inactivo" | "escribiendo" | "guardando" | "error";

export interface UseAsistente {
  flujo: FlujoId | null;
  mensajes: MensajeChat[];
  estado: EstadoAsistente;
  error: string | null;
  ultimaRespuesta: RespuestaAsistente | null;
  restauranteId: string;
  iniciarFlujo: (flujo: FlujoId) => Promise<void>;
  enviar: (texto: string) => Promise<void>;
  guardar: () => Promise<{ rutaSugerida: string } | null>;
  reiniciar: () => void;
}

function mensajeDeError(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return "Ocurrió un problema. Inténtalo de nuevo.";
}

export function useAsistente(): UseAsistente {
  const session = useSession();
  const queryClient = useQueryClient();
  const restauranteId = session.data?.restaurante.id ?? "";

  const [flujo, setFlujo] = useState<FlujoId | null>(null);
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [borrador, setBorrador] = useState<Record<string, unknown>>({});
  const [ultimaRespuesta, setUltimaRespuesta] = useState<RespuestaAsistente | null>(null);
  const [estado, setEstado] = useState<EstadoAsistente>("inactivo");
  const [error, setError] = useState<string | null>(null);

  const reiniciar = useCallback(() => {
    setFlujo(null);
    setMensajes([]);
    setBorrador({});
    setUltimaRespuesta(null);
    setEstado("inactivo");
    setError(null);
  }, []);

  const llamar = useCallback(
    async (flujoActivo: FlujoId, historial: MensajeChat[], borradorActual: Record<string, unknown>) => {
      if (!restauranteId) return;
      setEstado("escribiendo");
      setError(null);
      try {
        const resp = await enviarMensajeAsistente(restauranteId, {
          flujo: flujoActivo,
          mensajes: historial,
          borrador: borradorActual,
        });
        setBorrador(resp.borrador);
        setUltimaRespuesta(resp);
        setMensajes([...historial, { rol: "assistant", contenido: resp.mensaje }]);
        setEstado("inactivo");
      } catch (err) {
        setError(mensajeDeError(err));
        setEstado("error");
      }
    },
    [restauranteId],
  );

  const iniciarFlujo = useCallback(
    async (nuevoFlujo: FlujoId) => {
      setFlujo(nuevoFlujo);
      setMensajes([]);
      setBorrador({});
      setUltimaRespuesta(null);
      await llamar(nuevoFlujo, [], {});
    },
    [llamar],
  );

  const enviar = useCallback(
    async (texto: string) => {
      const limpio = texto.trim();
      if (!limpio || !flujo || estado === "escribiendo") return;
      const historial: MensajeChat[] = [...mensajes, { rol: "user", contenido: limpio }];
      setMensajes(historial);
      await llamar(flujo, historial, borrador);
    },
    [flujo, estado, mensajes, borrador, llamar],
  );

  const guardar = useCallback(async () => {
    if (!flujo || !ultimaRespuesta?.listoParaGuardar || !restauranteId) return null;
    setEstado("guardando");
    setError(null);
    try {
      const { rutaSugerida } = await guardarBorrador(
        restauranteId,
        flujo,
        ultimaRespuesta.borradorParaGuardar,
      );
      // Refresca las vistas afectadas por el nuevo registro.
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["operaciones"] });
      queryClient.invalidateQueries({ queryKey: ["entregas"] });
      queryClient.invalidateQueries({ queryKey: ["productos"] });
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      queryClient.invalidateQueries({ queryKey: ["indicadores"] });
      queryClient.invalidateQueries({ queryKey: ["recomendaciones"] });
      setEstado("inactivo");
      return { rutaSugerida };
    } catch (err) {
      setError(mensajeDeError(err));
      setEstado("error");
      return null;
    }
  }, [flujo, ultimaRespuesta, restauranteId, queryClient]);

  return {
    flujo,
    mensajes,
    estado,
    error,
    ultimaRespuesta,
    restauranteId,
    iniciarFlujo,
    enviar,
    guardar,
    reiniciar,
  };
}
