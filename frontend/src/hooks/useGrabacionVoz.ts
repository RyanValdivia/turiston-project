import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Grabación de voz con VAD (Voice Activity Detection) para el registro por voz.
 *
 * Filtrado en dos capas, tal como pide el flujo de registro rápido:
 *  1. Ruido/audio: getUserMedia con noiseSuppression + echoCancellation + autoGainControl.
 *  2. Silencio: se monitorea el volumen (RMS) con un AnalyserNode. La grabación
 *     se auto-detiene tras un tramo de silencio y se descarta si nunca hubo voz
 *     o el habla fue demasiado corta, para no gastar una llamada de transcripción
 *     con silencio. Sólo se entrega audio con habla real.
 */

export type EstadoGrabacion = "inactivo" | "grabando" | "procesando";

export interface UseGrabacionVoz {
  soportado: boolean;
  estado: EstadoGrabacion;
  nivel: number; // 0..1, para el indicador visual
  error: string | null;
  iniciar: () => Promise<void>;
  detener: () => void;
  setProcesando: (v: boolean) => void;
}

// Umbrales del VAD.
const UMBRAL_VOZ = 0.02; // RMS mínimo para considerar que hay habla
const SILENCIO_FIN_MS = 1500; // silencio continuo que cierra la grabación
const DURACION_MAX_MS = 30_000; // corte duro de seguridad
const MIN_HABLA_MS = 400; // descarta clips más cortos que esto

function mediaRecorderSoportado(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof window.MediaRecorder !== "undefined"
  );
}

function elegirMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidatos = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];
  return candidatos.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
}

export function useGrabacionVoz(
  onAudioListo: (audio: Blob, mimeType: string) => void,
): UseGrabacionVoz {
  const [soportado] = useState(mediaRecorderSoportado);
  const [estado, setEstado] = useState<EstadoGrabacion>("inactivo");
  const [nivel, setNivel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Estado del VAD (en refs para no re-renderizar en cada frame).
  const inicioSilencioRef = useRef<number | null>(null);
  const msConVozRef = useRef(0);
  const ultimoFrameRef = useRef(0);
  const inicioGrabRef = useRef(0);
  const descartarRef = useRef(false);

  const limpiar = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      void audioCtxRef.current.close();
    }
    audioCtxRef.current = null;
    setNivel(0);
  }, []);

  const detener = useCallback(() => {
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
  }, []);

  const iniciar = useCallback(async () => {
    if (!soportado || estado !== "inactivo") return;
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;

      const mimeType = elegirMimeType();
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = rec;
      chunksRef.current = [];
      descartarRef.current = false;
      msConVozRef.current = 0;
      inicioSilencioRef.current = null;
      inicioGrabRef.current = performance.now();
      ultimoFrameRef.current = performance.now();

      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const tipo = rec.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: tipo });
        limpiar();
        recorderRef.current = null;
        const huboVoz = msConVozRef.current >= MIN_HABLA_MS;
        if (descartarRef.current || !huboVoz || blob.size === 0) {
          setEstado("inactivo");
          setError("No detecté voz. Acércate al micrófono e inténtalo de nuevo.");
          return;
        }
        setEstado("procesando");
        onAudioListo(blob, tipo);
      };

      // --- Análisis de volumen (VAD) ---
      const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const fuente = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      fuente.connect(analyser);
      const datos = new Float32Array(analyser.fftSize);

      const tick = () => {
        analyser.getFloatTimeDomainData(datos);
        let suma = 0;
        for (let i = 0; i < datos.length; i++) {
          const v = datos[i] ?? 0;
          suma += v * v;
        }
        const rms = Math.sqrt(suma / datos.length);
        setNivel(Math.min(1, rms * 8));

        const ahora = performance.now();
        const dt = ahora - ultimoFrameRef.current;
        ultimoFrameRef.current = ahora;

        if (rms >= UMBRAL_VOZ) {
          msConVozRef.current += dt;
          inicioSilencioRef.current = null;
        } else if (msConVozRef.current > 0) {
          // Sólo contamos silencio de cierre después de que ya hubo algo de voz.
          if (inicioSilencioRef.current == null) inicioSilencioRef.current = ahora;
          else if (ahora - inicioSilencioRef.current >= SILENCIO_FIN_MS) {
            detener();
            return;
          }
        }

        if (ahora - inicioGrabRef.current >= DURACION_MAX_MS) {
          detener();
          return;
        }
        rafRef.current = requestAnimationFrame(tick);
      };

      rec.start();
      setEstado("grabando");
      rafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      limpiar();
      recorderRef.current = null;
      setEstado("inactivo");
      const nombre = (err as Error).name;
      setError(
        nombre === "NotAllowedError"
          ? "Permiso de micrófono denegado. Actívalo para registrar por voz."
          : "No se pudo acceder al micrófono.",
      );
    }
  }, [soportado, estado, detener, limpiar, onAudioListo]);

  const setProcesando = useCallback((v: boolean) => {
    setEstado(v ? "procesando" : "inactivo");
  }, []);

  // Limpieza al desmontar.
  useEffect(() => {
    return () => {
      const rec = recorderRef.current;
      if (rec && rec.state !== "inactive") {
        descartarRef.current = true;
        rec.stop();
      }
      limpiar();
    };
  }, [limpiar]);

  return { soportado, estado, nivel, error, iniciar, detener, setProcesando };
}
