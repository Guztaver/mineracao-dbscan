"""DBSCAN didático, validação holdout e persistência sem dependências externas."""
import csv
import json
import math
import random
from pathlib import Path

from src.generate_data import DATA_PATH, generate_dataset, save_dataset

ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH = ROOT / "artifacts" / "dbscan_consumo.json"
EPS = 0.42
MIN_SAMPLES = 12
SEED = 42


def distance(a: tuple[float, float], b: tuple[float, float]) -> float:
    return math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2)


def dbscan(points: list[tuple[float, float]], eps: float = EPS, min_samples: int = MIN_SAMPLES) -> tuple[list[int], list[int]]:
    """DBSCAN clássico: devolve rótulos e índices dos pontos centrais."""
    labels = [None] * len(points)
    core_indices: set[int] = set()
    visited: set[int] = set()
    cluster_id = 0
    neighborhoods = [[j for j, other in enumerate(points) if distance(point, other) <= eps] for point in points]
    for point_index in range(len(points)):
        if point_index in visited:
            continue
        visited.add(point_index)
        neighbors = neighborhoods[point_index]
        if len(neighbors) < min_samples:
            labels[point_index] = -1
            continue
        core_indices.add(point_index)
        labels[point_index] = cluster_id
        queue = list(neighbors)
        queued = set(queue)
        cursor = 0
        while cursor < len(queue):
            neighbor_index = queue[cursor]
            cursor += 1
            if neighbor_index not in visited:
                visited.add(neighbor_index)
                nearby = neighborhoods[neighbor_index]
                if len(nearby) >= min_samples:
                    core_indices.add(neighbor_index)
                    for candidate in nearby:
                        if candidate not in queued:
                            queued.add(candidate)
                            queue.append(candidate)
            if labels[neighbor_index] is None or labels[neighbor_index] == -1:
                labels[neighbor_index] = cluster_id
        cluster_id += 1
    return [int(label if label is not None else -1) for label in labels], sorted(core_indices)


def scale_params(points: list[tuple[float, float]]) -> tuple[list[float], list[float]]:
    means = [sum(p[d] for p in points) / len(points) for d in range(2)]
    stds = []
    for dimension in range(2):
        variance = sum((p[dimension] - means[dimension]) ** 2 for p in points) / len(points)
        stds.append(math.sqrt(variance) or 1.0)
    return means, stds


def scale(points: list[tuple[float, float]], means: list[float], stds: list[float]) -> list[tuple[float, float]]:
    return [tuple((point[d] - means[d]) / stds[d] for d in range(2)) for point in points]


def predict_point(point: tuple[float, float], core_points: list[tuple[float, float]], core_labels: list[int], eps: float = EPS) -> tuple[int, float]:
    if not core_points:
        return -1, float("inf")
    nearest_index = min(range(len(core_points)), key=lambda i: distance(point, core_points[i]))
    nearest_distance = distance(point, core_points[nearest_index])
    return (core_labels[nearest_index] if nearest_distance <= eps else -1), nearest_distance


def train_and_save(rows: list[dict] | None = None) -> dict:
    if rows is None:
        if not DATA_PATH.exists():
            rows = generate_dataset()
            save_dataset(rows)
        else:
            with DATA_PATH.open(encoding="utf-8", newline="") as file:
                rows = list(csv.DictReader(file))
    rows = [{
        "hora": float(row["hora"]),
        "consumo_kwh": float(row["consumo_kwh"]),
        "anomalia_simulada": int(row["anomalia_simulada"]),
    } for row in rows]
    points = [(float(row["hora"]), float(row["consumo_kwh"])) for row in rows]
    labels_true = [int(row["anomalia_simulada"]) for row in rows]
    indices = list(range(len(rows)))
    random.Random(SEED).shuffle(indices)
    split_at = int(len(indices) * 0.8)
    train_indices, test_indices = indices[:split_at], indices[split_at:]
    train_points = [points[i] for i in train_indices]
    means, stds = scale_params(train_points)
    train_scaled = scale(train_points, means, stds)
    train_labels, core_indices = dbscan(train_scaled)
    core_points = [train_scaled[i] for i in core_indices]
    core_labels = [train_labels[i] for i in core_indices]
    predictions = []
    for index in test_indices:
        test_scaled = scale([points[index]], means, stds)[0]
        predicted_cluster, _ = predict_point(test_scaled, core_points, core_labels)
        predictions.append(int(predicted_cluster == -1))
    actual = [labels_true[i] for i in test_indices]
    tp = sum(a == 1 and p == 1 for a, p in zip(actual, predictions))
    fp = sum(a == 0 and p == 1 for a, p in zip(actual, predictions))
    fn = sum(a == 1 and p == 0 for a, p in zip(actual, predictions))
    tn = sum(a == 0 and p == 0 for a, p in zip(actual, predictions))
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    model = {
        "algorithm": "DBSCAN", "eps": EPS, "min_samples": MIN_SAMPLES,
        "means": means, "stds": stds,
        "core_points_scaled": [list(point) for point in core_points], "core_labels": core_labels,
        "metrics": {
            "rows": len(rows), "train_rows": len(train_indices), "test_rows": len(test_indices),
            "simulated_anomaly_rate": sum(labels_true) / len(labels_true),
            "test_precision": precision, "test_recall": recall, "test_f1": f1,
            "test_true_positives": tp, "test_false_positives": fp,
            "test_false_negatives": fn, "test_true_negatives": tn,
            "train_noise_rate": sum(label == -1 for label in train_labels) / len(train_labels),
            "core_points": len(core_points), "inference_rule": "nearest_core_point_within_eps",
        },
    }
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    MODEL_PATH.write_text(json.dumps(model, ensure_ascii=False, indent=2), encoding="utf-8")
    web_data = {"data": rows, "model": model}
    web_path = ROOT / "app-data.js"
    web_path.write_text("window.PULSO_DATA = " + json.dumps(web_data, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    return model


def main() -> None:
    model = train_and_save()
    print(f"Modelo DBSCAN salvo em {MODEL_PATH}")
    for key, value in model["metrics"].items():
        print(f"{key}: {value}")


if __name__ == "__main__":
    main()
