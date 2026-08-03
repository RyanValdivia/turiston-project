"""
Ingenieria de caracteristicas compartida entre train.py y predict.py.

Misma logica del modelo original (RandomForest sobre historial de ventas por
plato y fecha): promedio historico del plato en dia de semana/finde, venta del
dia anterior, medias moviles de 7/14 dias. Vive aca para que train y predict
apliquen exactamente el mismo feature engineering.
"""

from __future__ import annotations

import pandas as pd

FEATURE_COLS = [
    "plato_id",
    "mes",
    "dia_semana",
    "dia_mes",
    "es_fin_de_semana",
    "promedio_historico_plato",
    "venta_dia_anterior",
    "media_movil_7d",
    "media_movil_14d",
]


def parse_registros_to_df(registros: list[dict]) -> pd.DataFrame:
    """registros: [{fecha, nombrePlato, cantidad}, ...] -> DataFrame ordenado."""
    df = pd.DataFrame(registros)
    df["fecha"] = pd.to_datetime(df["fecha"])
    df = df.rename(columns={"nombrePlato": "nombre_plato", "cantidad": "cantidad_vendida"})
    return df.sort_values(["nombre_plato", "fecha"]).reset_index(drop=True)


def build_plato_map(df: pd.DataFrame) -> dict[str, int]:
    """Nombre de plato -> id estable (orden alfabetico), persistido en el bundle."""
    nombres = sorted(df["nombre_plato"].unique().tolist())
    return {nombre: i for i, nombre in enumerate(nombres)}


def engineer_training_features(df: pd.DataFrame, plato_map: dict[str, int]):
    """
    Arma las features de entrenamiento y devuelve, ademas del DataFrame,
    las tablas que hacen falta para predecir una fecha futura sin tener que
    volver a mandar todo el historial:
      - promedio_plato: promedio por (plato_id, es_fin_de_semana)
      - ultimo_dia: ultima venta real conocida por plato_id
      - media_7d / media_14d: medias moviles mas recientes por plato_id
    """
    df = df.copy()
    df["plato_id"] = df["nombre_plato"].map(plato_map)
    df["mes"] = df["fecha"].dt.month
    df["dia_semana"] = df["fecha"].dt.weekday
    df["dia_mes"] = df["fecha"].dt.day
    df["es_fin_de_semana"] = df["dia_semana"].apply(lambda x: 1 if x >= 5 else 0)

    promedio_plato = (
        df.groupby(["plato_id", "es_fin_de_semana"])["cantidad_vendida"]
        .mean()
        .reset_index()
        .rename(columns={"cantidad_vendida": "promedio_historico_plato"})
    )
    df = df.merge(promedio_plato, on=["plato_id", "es_fin_de_semana"], how="left")

    df = df.sort_values(["plato_id", "fecha"]).reset_index(drop=True)
    df["venta_dia_anterior"] = df.groupby("plato_id")["cantidad_vendida"].shift(1)
    df["media_movil_7d"] = df.groupby("plato_id")["cantidad_vendida"].transform(
        lambda s: s.shift(1).rolling(window=7, min_periods=1).mean()
    )
    df["media_movil_14d"] = df.groupby("plato_id")["cantidad_vendida"].transform(
        lambda s: s.shift(1).rolling(window=14, min_periods=1).mean()
    )
    for col in ["venta_dia_anterior", "media_movil_7d", "media_movil_14d"]:
        df[col] = df[col].fillna(df.groupby("plato_id")["cantidad_vendida"].transform("mean"))

    df = df.sort_values(["fecha", "plato_id"]).reset_index(drop=True)

    ultimo_dia = (
        df[df["fecha"] == df["fecha"].max()][["plato_id", "cantidad_vendida"]]
        .rename(columns={"cantidad_vendida": "venta_dia_anterior"})
    )
    media_7d = (
        df.sort_values("fecha").groupby("plato_id").tail(7)
        .groupby("plato_id")["cantidad_vendida"].mean()
        .reset_index().rename(columns={"cantidad_vendida": "media_movil_7d"})
    )
    media_14d = (
        df.sort_values("fecha").groupby("plato_id").tail(14)
        .groupby("plato_id")["cantidad_vendida"].mean()
        .reset_index().rename(columns={"cantidad_vendida": "media_movil_14d"})
    )

    tablas = {
        "promedio_plato": promedio_plato,
        "ultimo_dia": ultimo_dia,
        "media_7d": media_7d,
        "media_14d": media_14d,
    }
    return df, tablas


def build_prediction_row(fecha_objetivo: pd.Timestamp, plato_map: dict[str, int], tablas: dict) -> pd.DataFrame:
    """Arma una fila de features por plato para una fecha futura, usando las
    tablas guardadas en el bundle de entrenamiento (sin necesitar el historial crudo)."""
    dia_semana = fecha_objetivo.weekday()
    es_fin_de_semana = 1 if dia_semana >= 5 else 0

    filas = pd.DataFrame({
        "plato_id": list(plato_map.values()),
        "mes": fecha_objetivo.month,
        "dia_semana": dia_semana,
        "dia_mes": fecha_objetivo.day,
        "es_fin_de_semana": es_fin_de_semana,
    })

    filas = filas.merge(
        tablas["promedio_plato"][tablas["promedio_plato"]["es_fin_de_semana"] == es_fin_de_semana],
        on=["plato_id", "es_fin_de_semana"],
        how="left",
    )
    filas = filas.merge(tablas["ultimo_dia"], on="plato_id", how="left")
    filas = filas.merge(tablas["media_7d"], on="plato_id", how="left")
    filas = filas.merge(tablas["media_14d"], on="plato_id", how="left")

    # Si a un plato le falta algun dato (ej. nunca vendio en finde), usar 0 en vez de romper.
    for col in ["promedio_historico_plato", "venta_dia_anterior", "media_movil_7d", "media_movil_14d"]:
        filas[col] = filas[col].fillna(0)

    return filas
