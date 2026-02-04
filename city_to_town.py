#!/usr/bin/env python3
from pathlib import Path

import geopandas as gpd


BASE_DIR = Path(__file__).resolve().parent

TOWN_FILE = BASE_DIR / "townInfo.geojson"
TOWN_COL = "TOWN"

DATASETS = {
    "shelter": {
        "label": "避難施設情報",
        "input": BASE_DIR / "14212_atsugi-shi_city_2023_shelter.geojson",
        "out_dir": BASE_DIR / "data" / "shelter",
    },
    "landmark": {
        "label": "ランドマーク情報",
        "input": BASE_DIR / "14212_atsugi-shi_city_2023_landmark.geojson",
        "out_dir": BASE_DIR / "data" / "landmark",
    },
    "station": {
        "label": "鉄道駅情報",
        "input": BASE_DIR / "14212_atsugi-shi_city_2023_station.geojson",
        "out_dir": BASE_DIR / "data" / "station",
    },
    "emergency_route": {
        "label": "緊急輸送道路情報",
        "input": BASE_DIR / "14212_atsugi-shi_city_2023_emergency_route.geojson",
        "out_dir": BASE_DIR / "data" / "emergency_route",
    },
    "railway": {
        "label": "鉄道情報",
        "input": BASE_DIR / "14212_atsugi-shi_city_2023_railway.geojson",
        "out_dir": BASE_DIR / "data" / "railway",
    },
    "park": {
        "label": "公園情報",
        "input": BASE_DIR / "14212_atsugi-shi_city_2023_park.geojson",
        "out_dir": BASE_DIR / "data" / "park",
    },
    "border": {
        "label": "行政界情報",
        "input": BASE_DIR / "14212_atsugi-shi_city_2023_border.geojson",
        "out_dir": BASE_DIR / "data" / "border",
    },
}


def load_towns() -> gpd.GeoDataFrame:
    towns = gpd.read_file(TOWN_FILE)
    if TOWN_COL not in towns.columns:
        raise ValueError(f"{TOWN_COL} 列が {TOWN_FILE} にありません")
    dissolved = towns.dissolve(by=TOWN_COL).reset_index()
    return dissolved


def split_one_dataset(towns: gpd.GeoDataFrame, cfg: dict) -> None:
    input_path: Path = cfg["input"]
    out_dir: Path = cfg["out_dir"]
    label: str = cfg["label"]

    if not input_path.exists():
        print(f"[SKIP] {label}: {input_path} が見つかりません")
        return

    print(f"[LOAD] {label}: {input_path}")
    gdf = gpd.read_file(input_path)

    if gdf.empty:
        print(f"[WARN] {label}: 入力データが空です")
        return

    if gdf.crs is None:
        raise ValueError(f"{label}: 入力データの CRS が未設定です")

    if towns.crs is None:
        raise ValueError("町ポリゴンの CRS が未設定です")

    if gdf.crs != towns.crs:
        print(f"[INFO] {label}: CRS 変換 {gdf.crs} -> {towns.crs}")
        gdf = gdf.to_crs(towns.crs)

    print(f"[JOIN] {label}: 町ポリゴンと空間結合中")
    joined = gpd.sjoin(
        gdf,
        towns[[TOWN_COL, "geometry"]],
        how="inner",
        predicate="intersects",
    )

    if joined.empty:
        print(f"[WARN] {label}: どの町とも交差しませんでした")
        return

    joined = joined.drop(columns=["index_right"])
    out_dir.mkdir(parents=True, exist_ok=True)

    for town_name, sub in joined.groupby(TOWN_COL):
        safe_name = (
            str(town_name)
            .replace("/", "_")
            .replace("\\", "_")
            .replace(" ", "_")
        )
        out_path = out_dir / f"{safe_name}.geojson"
        sub.to_file(out_path, driver="GeoJSON")
        print(f"[WRITE] {label} / {town_name}: {len(sub)} -> {out_path}")


def main() -> None:
    towns = load_towns()
    print(f"[INFO] 町数: {len(towns)}")

    for key, cfg in DATASETS.items():
        split_one_dataset(towns, cfg)

    print("[DONE] 全データの分割が完了しました")


if __name__ == "__main__":
    main()
