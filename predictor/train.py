"""
Entrena el modelo de prediccion de ventas por plato y lo guarda en disco.

Uso: python train.py <ruta_modelo.joblib>
Entrada (stdin, JSON): {"registros": [{"fecha": "2026-01-01", "nombrePlato": "Ceviche", "cantidad": 42}, ...]}
Salida (stdout, JSON): {"metrics": {...}, "entrenadoEn": "...", "filasUsadas": N}

Grilla de hiperparametros reducida a proposito (vs. el notebook original) para
responder en segundos y poder correr sincronicamente dentro de un request del
backend.
"""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone

import joblib
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score
from sklearn.model_selection import GridSearchCV, train_test_split

from common import FEATURE_COLS, build_plato_map, engineer_training_features, parse_registros_to_df

sys.stdin.reconfigure(encoding="utf-8")
sys.stdout.reconfigure(encoding="utf-8")

PARAM_GRID = {
    "n_estimators": [150, 300],
    "max_depth": [8, None],
}


def safe_mape(y_true, y_pred) -> float:
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)
    denom = np.maximum(y_true, 1.0)  # evita division por cero en dias con 0 ventas
    return float(np.mean(np.abs(y_true - y_pred) / denom))


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit("Uso: python train.py <ruta_modelo.joblib>")
    model_path = sys.argv[1]

    payload = json.loads(sys.stdin.read())
    registros = payload["registros"]

    df = parse_registros_to_df(registros)
    plato_map = build_plato_map(df)
    df_feat, tablas = engineer_training_features(df, plato_map)

    X = df_feat[FEATURE_COLS]
    y = df_feat["cantidad_vendida"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    grid_search = GridSearchCV(
        RandomForestRegressor(random_state=42),
        PARAM_GRID,
        cv=3,
        scoring="neg_mean_absolute_error",
        n_jobs=-1,
    )
    grid_search.fit(X_train, y_train)
    modelo = grid_search.best_estimator_

    predicciones = modelo.predict(X_test)
    mae = float(np.mean(np.abs(y_test - predicciones)))
    mape = safe_mape(y_test, predicciones)
    r2 = float(r2_score(y_test, predicciones))
    precision_pct = 100 - (mape * 100)

    entrenado_en = datetime.now(timezone.utc).isoformat()

    bundle = {
        "model": modelo,
        "plato_map": plato_map,
        "tablas": tablas,
        "feature_cols": FEATURE_COLS,
        "entrenado_en": entrenado_en,
        "filas_usadas": len(df_feat),
        "best_params": grid_search.best_params_,
    }

    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    joblib.dump(bundle, model_path)

    print(json.dumps({
        "metrics": {
            "mae": round(mae, 4),
            "mape": round(mape, 4),
            "r2": round(r2, 4),
            "precisionPct": round(precision_pct, 2),
        },
        "entrenadoEn": entrenado_en,
        "filasUsadas": len(df_feat),
        "bestParams": grid_search.best_params_,
    }))


if __name__ == "__main__":
    main()
