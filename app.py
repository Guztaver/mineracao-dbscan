"""Servidor local para o site estático; treinamento separado via src.model."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os

ROOT = Path(__file__).resolve().parent
PORT = int(os.environ.get("PORT", "8501"))


class SiteHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)


if __name__ == "__main__":
    if not (ROOT / "artifacts" / "dbscan_consumo.json").exists():
        raise SystemExit("Modelo não encontrado. Rode primeiro: python -m src.model")
    print(f"Pulso disponível em http://127.0.0.1:{PORT} (Ctrl+C para encerrar)")
    ThreadingHTTPServer(("127.0.0.1", PORT), SiteHandler).serve_forever()
