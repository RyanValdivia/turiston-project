"""
Carga un modelo ya entrenado y predice ventas por plato para una fecha.

Uso: python predict.py <ruta_modelo.joblib>
Entrada (stdin, JSON): {"fechaObjetivo": "2026-08-15"}
Salida (stdout, JSON): [{"plato": "Ceviche", "prediccion": 42.3}, ...]
"""

from __future__ import annotations

import json
import sys

import joblib
import pandas as pd

from common import build_prediction_row

sys.stdin.reconfigure(encoding="utf-8")
sys.stdout.reconfigure(encoding="utf-8")


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit("Uso: python predict.py <ruta_modelo.joblib>")
    model_path = sys.argv[1]

    payload = json.loads(sys.stdin.read())
    fecha_objetivo = pd.to_datetime(payload["fechaObjetivo"])

    bundle = joblib.load(model_path)
    plato_map = bundle["plato_map"]
    tablas = bundle["tablas"]
    modelo = bundle["model"]
    feature_cols = bundle["feature_cols"]

    filas = build_prediction_row(fecha_objetivo, plato_map, tablas)
    predicciones = modelo.predict(filas[feature_cols])

    id_a_nombre = {v: k for k, v in plato_map.items()}
    resultado = [
        {"plato": id_a_nombre[plato_id], "prediccion": round(float(max(pred, 0)), 2)}
        for plato_id, pred in zip(filas["plato_id"], predicciones)
    ]

    print(json.dumps(resultado))


if __name__ == "__main__":
    main()
