"""Engine de sincronização online/offline do executável.

Offline: tudo gravado no SQLite local, com audit_log synced=0.
Online: o botão "Sincronizar" envia o delta (audit_log synced=0) para a
nuvem do evento (cloud_url) e recebe o retorno.
"""

import json
import urllib.error
import urllib.request
from datetime import datetime

import config
import database


def device_id() -> str:
    loaded = database.get_config("device_id")
    if loaded:
        return loaded
    value = f"desktop-{database.new_id()}"
    database.set_config("device_id", value)
    return value


def cloud_url() -> str:
    return database.get_config("cloud_url") or config.CLOUD_URL


def set_cloud_url(url: str) -> None:
    database.set_config("cloud_url", url.strip() or config.CLOUD_URL)


def compile_changes() -> list[dict]:
    rows = database.fetch_all(
        "SELECT id, timestamp, usuario, num_atleta, nome_atleta, campo_alterado,"
        " valor_anterior, valor_novo FROM audit_log WHERE synced = 0 ORDER BY timestamp",
    )
    return [dict(row) for row in rows]


def pending_changes() -> int:
    row = database.fetch_one("SELECT COUNT(*) AS c FROM audit_log WHERE synced = 0")
    return row["c"] if row else 0


def _http_json(method: str, url: str, payload: dict | None = None, timeout: int = 6):
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    request = urllib.request.Request(
        url, data=data, method=method,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        raw = response.read()
    return json.loads(raw) if raw else {}


def probe_online() -> bool:
    """Verifica rapidamente se a nuvem configurada está acessível."""
    try:
        _http_json("GET", f"{cloud_url().rstrip('/')}/api/health", timeout=3)
        return True
    except Exception:
        return False


def push() -> dict:
    changes = compile_changes()
    if not changes:
        return {
            "status": "ok", "online": probe_online(), "pushed": 0,
            "message": "Nada pendente para sincronizar.",
        }

    payload = {
        "device_id": device_id(),
        "last_sync": datetime.now().isoformat(timespec="seconds"),
        "changes": [
            {**_c, "table": "audit"}
            for _c in changes
        ],
    }

    try:
        result = _http_json("POST", f"{cloud_url().rstrip('/')}/api/sync/push", payload)
    except Exception as exc:  # rede indisponível / servidor fora do ar
        return {
            "status": "offline", "online": False, "pushed": 0,
            "message": f"Sem acesso à nuvem: {exc}",
        }

    ids = list(tuple(c["id"] for c in changes))
    if ids:
        placeholders = ",".join("?" for _ in ids)
        database.execute(
            f"UPDATE audit_log SET synced = 1 WHERE id IN ({placeholders})", tuple(ids)
        )
    database.execute(
        "UPDATE sync_state SET last_push = ?, pending_changes = 0 WHERE id = 1",
        (datetime.now().strftime("%d/%m/%Y %H:%M:%S"),),
    )
    return {
        "status": "ok", "online": True, "pushed": len(changes),
        "message": f"{len(changes)} alterações enviadas para a nuvem.",
    }


def pull() -> dict:
    """Recebe atualizações da nuvem (protótipo: apenas registra o retorno)."""
    try:
        result = _http_json("GET", f"{cloud_url().rstrip('/')}/api/sync/pull")
        database.execute(
            "UPDATE sync_state SET last_pull = ?, pending_changes = (SELECT COUNT(*) FROM audit_log WHERE synced = 0) WHERE id = 1",
            (datetime.now().strftime("%d/%m/%Y %H:%M:%S"),),
        )
        return {"status": "ok", "online": True, "message": "Dados recebidos da nuvem.", "data": result}
    except Exception as exc:
        return {"status": "offline", "online": False, "message": f"Sem acesso à nuvem: {exc}"}


def status() -> dict:
    online = probe_online()
    last = database.fetch_one("SELECT last_push, last_pull FROM sync_state WHERE id = 1")
    return {
        "mode": "ONLINE" if online else "OFFLINE",
        "online": online,
        "cloud_url": cloud_url(),
        "device_id": device_id(),
        "pending": pending_changes(),
        "last_push": (last["last_push"] if last else None),
        "last_pull": (last["last_pull"] if last else None),
    }