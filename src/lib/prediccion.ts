import type { TendenciaBucket } from "@/lib/estadisticas";

export interface PrediccionInput {
  tendencia: TendenciaBucket[];
  horizonteDias: number;
}

export interface PrediccionResultado {
  proyeccionKgSemanal: number;
  proyeccionPerdidaSemanal: number;
  tendencia: "subiendo" | "bajando" | "estable";
  notaMetodo: string;
}

function regresionLineal(ys: number[]): { pendiente: number; intercepto: number } {
  const n = ys.length;
  const xs = ys.map((_, i) => i);
  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - xMean) * (ys[i] - yMean);
    den += (xs[i] - xMean) ** 2;
  }
  const pendiente = den === 0 ? 0 : num / den;
  const intercepto = yMean - pendiente * xMean;
  return { pendiente, intercepto };
}

/**
 * Punto de integración del modelo predictivo (Premium Predict). Implementación
 * naive (regresión lineal simple sobre la tendencia semanal) para que los
 * endpoints sean funcionales hoy — reemplazable por el modelo real sin tocar
 * las rutas: basta con cambiar esta función.
 */
export async function ejecutarModeloPredictivo(
  input: PrediccionInput
): Promise<PrediccionResultado> {
  const { tendencia } = input;

  if (tendencia.length === 0) {
    return {
      proyeccionKgSemanal: 0,
      proyeccionPerdidaSemanal: 0,
      tendencia: "estable",
      notaMetodo: "Sin datos históricos suficientes para proyectar.",
    };
  }

  if (tendencia.length === 1) {
    const [unico] = tendencia;
    return {
      proyeccionKgSemanal: unico.totalKg,
      proyeccionPerdidaSemanal: unico.perdidaEstimada,
      tendencia: "estable",
      notaMetodo:
        "Solo hay una semana de datos; se proyecta el mismo valor (modelo naive, reemplazable).",
    };
  }

  const regKg = regresionLineal(tendencia.map((b) => b.totalKg));
  const regPerdida = regresionLineal(tendencia.map((b) => b.perdidaEstimada));
  const proximoIndice = tendencia.length;

  const proyeccionKgSemanal = Math.max(0, regKg.pendiente * proximoIndice + regKg.intercepto);
  const proyeccionPerdidaSemanal = Math.max(
    0,
    regPerdida.pendiente * proximoIndice + regPerdida.intercepto
  );

  const direccion: PrediccionResultado["tendencia"] =
    Math.abs(regKg.pendiente) < 0.01 ? "estable" : regKg.pendiente > 0 ? "subiendo" : "bajando";

  return {
    proyeccionKgSemanal,
    proyeccionPerdidaSemanal,
    tendencia: direccion,
    notaMetodo:
      "Regresión lineal simple sobre la tendencia semanal (modelo naive de referencia, reemplazable por el modelo real).",
  };
}
