"""
Entrena el modelo de prediccion de ventas por plato y lo guarda en disco.

Uso: python train.py <ruta_modelo.joblib>
Entrada (stdin, JSON): {"registros": [{"fecha": "2026-01-01", "nombrePlato": "Ceviche", "cantidad": 42}, ...]}
Salida (stdout, JSON): {"metrics": {...}, "entrenadoEn": "...", "filasUsadas": N}

Modelo: XGBoost (antes RandomForest). Grilla de hiperparametros reducida a
proposito (vs. el notebook original) para responder en segundos y poder
correr sincronicamente dentro de un request del backend.

Split cronologico (no aleatorio): al tratarse de una serie de tiempo, el
modelo solo puede "ver" el pasado para predecir el futuro, asi que los
ultimos dias del historial se separan como test en vez de mezclarse al azar.
Lo mismo aplica al cross-validation durante la busqueda de hiperparametros
(TimeSeriesSplit en vez de un cv comun).
"""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import r2_score
from sklearn.model_selection import GridSearchCV, TimeSeriesSplit
from xgboost import XGBRegressor

from common import FEATURE_COLS, build_plato_map, engineer_training_features, parse_registros_to_df

sys.stdin.reconfigure(encoding="utf-8")
sys.stdout.reconfigure(encoding="utf-8")

PARAM_GRID = {
    "n_estimators": [200, 400],
    "max_depth": [3, 6],
    "learning_rate": [0.05, 0.1],
}

DIAS_TEST = 14  # ultimos N dias del historial usados como test


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

    # Split cronologico: los ultimos DIAS_TEST dias del historial son el test.
    fecha_corte = df_feat["fecha"].max() - pd.Timedelta(days=DIAS_TEST - 1)
    train_mask = df_feat["fecha"] < fecha_corte
    test_mask = df_feat["fecha"] >= fecha_corte

    X_train, y_train = X[train_mask], y[train_mask]
    X_test, y_test = X[test_mask], y[test_mask]

    n_splits = min(3, max(2, len(X_train) // 50))
    tscv = TimeSeriesSplit(n_splits=n_splits)

    grid_search = GridSearchCV(
        XGBRegressor(random_state=42, objective="reg:squarederror"),
        PARAM_GRID,
        cv=tscv,
        scoring="neg_mean_absolute_error",
        n_jobs=-1,
    )
    grid_search.fit(X_train, y_train)
    modelo_busqueda = grid_search.best_estimator_

    predicciones = np.maximum(modelo_busqueda.predict(X_test), 0)
    mae = float(np.mean(np.abs(y_test - predicciones)))
    mape = safe_mape(y_test, predicciones)
    r2 = float(r2_score(y_test, predicciones))
    precision_pct = 100 - (mape * 100)

    # Reentrenamos con TODOS los datos (incluido el periodo de test) para la
    # prediccion real a futuro, ya que no necesitamos guardar nada para validar.
    modelo_final = XGBRegressor(**grid_search.best_params_, random_state=42, objective="reg:squarederror")
    modelo_final.fit(X, y)

    entrenado_en = datetime.now(timezone.utc).isoformat()

    bundle = {
        "model": modelo_final,
        "plato_map": plato_map,
        "tablas": tablas,
        "feature_cols": FEATURE_COLS,
        "entrenado_en": entrenado_en,
        "filas_usadas": len(df_feat),
        "best_params": grid_search.best_params_,
    }

    model_dir = os.path.dirname(model_path)
    if model_dir:
        os.makedirs(model_dir, exist_ok=True)
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
