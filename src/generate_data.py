"""Gera, sem bibliotecas externas, leituras sintéticas de consumo elétrico."""
import csv
import math
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "leituras_consumo.csv"


def typical_consumption(hour: float) -> float:
    morning = 0.75 * math.exp(-0.5 * ((hour - 7.5) / 1.7) ** 2)
    evening = 1.65 * math.exp(-0.5 * ((hour - 20.0) / 2.4) ** 2)
    daytime = 0.18 * math.exp(-0.5 * ((hour - 13.0) / 4.0) ** 2)
    return 0.28 + morning + evening + daytime


def generate_dataset(n_rows: int = 1600, seed: int = 42) -> list[dict]:
    if n_rows < 300:
        raise ValueError("O conjunto deve ter pelo menos 300 linhas.")
    rng = random.Random(seed)
    rows = []
    for _ in range(n_rows):
        hour = rng.uniform(0, 24)
        normal = max(0.04, typical_consumption(hour) + rng.gauss(0, 0.16))
        is_anomaly = rng.random() < 0.06
        if is_anomaly:
            consumption = rng.uniform(0.02, 0.08) if rng.random() < 0.2 else normal + rng.uniform(2.2, 5.0)
        else:
            consumption = normal
        rows.append({"hora": round(hour, 2), "consumo_kwh": round(consumption, 3), "anomalia_simulada": int(is_anomaly)})
    return rows


def save_dataset(rows: list[dict], path: Path = DATA_PATH) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=["hora", "consumo_kwh", "anomalia_simulada"])
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    rows = generate_dataset()
    save_dataset(rows)
    count = sum(row["anomalia_simulada"] for row in rows)
    print(f"Dataset salvo em {DATA_PATH} ({len(rows)} linhas; {count} anomalias simuladas).")


if __name__ == "__main__":
    main()
