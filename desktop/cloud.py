"""Servidor de nuvem de DEMONSTRAÇÃO para validar a sincronização.

Simula o backend web (o que no futuro expõe /api/sync/push e /api/sync/pull).
Ele AINDA NÃO faz parte do backend real — é apenas o alvo onde o executável
desktop envia o delta de alterações durante os testes.

Executar em outro terminal:
    python cloud.py            # porta 19100
    python cloud.py --port 19600
"""

import argparse
import json
import os
import time

from fastapi import FastAPI, Request
import uvicorn

from config import CLOUD_DATA_DIR, ensure_dirs

ensure_dirs()
INBOX = os.path.join(CLOUD_DATA_DIR, "inbox.jsonl")
STATS = os.path.join(CLOUD_DATA_DIR, "stats.json")

app = FastAPI(title="RS KITS Cloud (Demo)")


def record(entry: dict) -> None:
    with open(INBOX, "a", encoding="utf-8") as fh:
        fh.write(json.dumps(entry, ensure_ascii=False) + "\n")
    stats = {"count": 0, "last": None}
    if os.path.exists(STATS):
        try:
            with open(STATS, "r", encoding="utf-8") as fh:
                stats = json.load(fh)
        except Exception:
            stats = {"count": 0, "last": None}
    stats["count"] = stats.get("count", 0) + 1
    stats["last"] = entry
    with open(STATS, "w", encoding="utf-8") as fh:
        json.dump(stats, fh, ensure_ascii=False, indent=2)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "rskits-cloud-demo"}


@app.post("/api/sync/push")
async def sync_push(request: Request):
    try:
        payload = json.loads(await request.body())
    except Exception:
        payload = {"error": "corpo não decodificado"}
    record({"received_at": time.time(), "payload": payload})
    return {"status": "ok", "received": 1}


@app.get("/api/sync/pull")
def sync_pull():
    return {"status": "ok", "athletes": [], "message": "nada a entregar por ora"}


@app.get("/api/cloud/stats")
def cloud_stats():
    stats = {"count": 0, "last": None}
    if os.path.exists(STATS):
        with open(STATS, "r", encoding="utf-8") as fh:
            stats = json.load(fh)
    return stats


def main() -> None:
    parser = argparse.ArgumentParser(description="RS KITS Cloud (demo)")
    parser.add_argument("--port", type=int, default=19100)
    args = parser.parse_args()
    print(f"RS KITS Cloud (demo) aguardando sincronização em http://127.0.0.1:{args.port}")
    print(f"  Dados recebidos: {INBOX}")
    uvicorn.run(app, host="127.0.0.1", port=args.port, log_level="warning")


if __name__ == "__main__":
    main()