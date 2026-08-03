import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { db } from "@/lib/db";
import { runPythonScript } from "@/lib/pythonBridge";
import { EstadoPrediccion } from "@/generated/prisma/enums";

export const MIN_VENTAS_PARA_ENTRENAR = 30;

export class DatosInsuficientesError extends Error {
  count: number;
  constructor(count: number) {
    super(
      `Se necesitan al menos ${MIN_VENTAS_PARA_ENTRENAR} registros de venta para entrenar el modelo, hay ${count}.`
    );
    this.count = count;
  }
}

interface EntrenoResultado {
  metrics: { mae: number; mape: number; r2: number; precisionPct: number };
  entrenadoEn: string;
  filasUsadas: number;
  bestParams?: Record<string, unknown>;
}

interface PrediccionPlato {
  plato: string;
  prediccion: number;
}

const TRAIN_SCRIPT = join(process.cwd(), "predictor", "train.py");
const PREDICT_SCRIPT = join(process.cwd(), "predictor", "predict.py");
const RETRAIN_THRESHOLD = 0.2; // reentrena si el historial cambió más de 20%

function getModelPath(restauranteId: string): string {
  return join(process.cwd(), "predictor", "models", `${restauranteId}.joblib`);
}

function getMetaPath(restauranteId: string): string {
  return join(process.cwd(), "predictor", "models", `${restauranteId}.meta.json`);
}

/** Historial real de ventas (por plato y día) de un restaurante, agregado desde RegistroOperacion. */
export async function obtenerHistorialVentas(
  restauranteId: string
): Promise<{ fecha: string; nombrePlato: string; cantidad: number }[]> {
  const ventas = await db.venta.findMany({
    where: { restauranteId },
    include: { registroOperacion: { select: { fecha: true } } },
  });

  const agrupado = new Map<string, { fecha: string; nombrePlato: string; cantidad: number }>();
  for (const v of ventas) {
    const fecha = v.registroOperacion.fecha.toISOString().slice(0, 10);
    const key = `${fecha}__${v.concepto}`;
    const existente = agrupado.get(key);
    if (existente) {
      existente.cantidad += v.cantidad;
    } else {
      agrupado.set(key, { fecha, nombrePlato: v.concepto, cantidad: v.cantidad });
    }
  }
  return Array.from(agrupado.values());
}

function leerMeta(restauranteId: string): EntrenoResultado | null {
  const metaPath = getMetaPath(restauranteId);
  if (!existsSync(metaPath)) return null;
  try {
    return JSON.parse(readFileSync(metaPath, "utf-8")) as EntrenoResultado;
  } catch {
    return null;
  }
}

function necesitaReentrenar(restauranteId: string, filasActuales: number): boolean {
  const modelPath = getModelPath(restauranteId);
  if (!existsSync(modelPath)) return true;
  const meta = leerMeta(restauranteId);
  if (!meta) return true;
  const cambio = Math.abs(filasActuales - meta.filasUsadas) / Math.max(meta.filasUsadas, 1);
  return cambio > RETRAIN_THRESHOLD;
}

/** Entrena el modelo si hace falta (no existe o el historial cambió lo suficiente) y persiste el resultado. */
export async function entrenarModeloSiNecesario(restauranteId: string): Promise<EntrenoResultado> {
  const historial = await obtenerHistorialVentas(restauranteId);
  if (historial.length < MIN_VENTAS_PARA_ENTRENAR) {
    throw new DatosInsuficientesError(historial.length);
  }

  if (!necesitaReentrenar(restauranteId, historial.length)) {
    const meta = leerMeta(restauranteId);
    if (meta) return meta;
  }

  const modelPath = getModelPath(restauranteId);
  const resultado = await runPythonScript<EntrenoResultado>(TRAIN_SCRIPT, [modelPath], {
    registros: historial,
  });

  writeFileSync(getMetaPath(restauranteId), JSON.stringify(resultado));

  await db.prediccion.create({
    data: {
      restauranteId,
      tipo: "entrenamiento_modelo",
      datosEntradaJson: JSON.stringify({ filas: historial.length }),
      resultadoJson: JSON.stringify(resultado),
      estado: EstadoPrediccion.COMPLETADA,
      completadaEn: new Date(),
    },
  });

  return resultado;
}

/** Asegura el modelo entrenado y predice ventas por plato para la fecha dada. */
export async function predecirVentas(
  restauranteId: string,
  fechaObjetivo: Date
): Promise<{ entreno: EntrenoResultado; predicciones: PrediccionPlato[] }> {
  const entreno = await entrenarModeloSiNecesario(restauranteId);
  const modelPath = getModelPath(restauranteId);
  const predicciones = await runPythonScript<PrediccionPlato[]>(PREDICT_SCRIPT, [modelPath], {
    fechaObjetivo: fechaObjetivo.toISOString().slice(0, 10),
  });
  return { entreno, predicciones };
}
