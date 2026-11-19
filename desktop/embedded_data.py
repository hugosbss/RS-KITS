"""Read a checked event snapshot from the executable and seed an isolated profile."""
import hashlib
import json
import os
import struct
import sys
from event_profile import profiles_root, select_profile

MAGIC = b"RSKITS_EMBED_V1"
FOOTER_SIZE = len(MAGIC) + 8 + 32
MAX_PAYLOAD = 256 * 1024 * 1024
_payload = None
_digest = None


def read_embedded(path):
    with open(path, "rb") as source:
        source.seek(0, 2)
        total = source.tell()
        if total < FOOTER_SIZE:
            return None
        source.seek(-FOOTER_SIZE, 2)
        footer = source.read(FOOTER_SIZE)
        if footer[-len(MAGIC):] != MAGIC:
            return None
        length = struct.unpack("<Q", footer[32:40])[0]
        if not 0 < length <= min(MAX_PAYLOAD, total - FOOTER_SIZE):
            raise ValueError("Tamanho inválido dos dados incorporados.")
        source.seek(-(FOOTER_SIZE + length), 2)
        data = source.read(length)
        if hashlib.sha256(data).digest() != footer[:32]:
            raise ValueError("Os dados incorporados estão corrompidos.")
        payload = json.loads(data.decode("utf-8"))
        if payload.get("format") != "RSKITS_EMBEDDED" or payload.get("version") != 1 or payload.get("mode") not in ("clean", "event"):
            raise ValueError("Formato de distribuição não suportado.")
        if payload["mode"] == "event" and not payload.get("event", {}).get("id"):
            raise ValueError("Evento ausente na distribuição.")
        return payload, hashlib.sha256(data).hexdigest()


def prepare_profile():
    global _payload, _digest
    if not getattr(sys, "frozen", False):
        return
    result = read_embedded(sys.executable)
    if not result:
        return
    _payload, _digest = result
    if os.environ.get("RSKITS_HOME") or os.environ.get("RSKITS_DATA_DIR"):
        return
    os.environ["RSKITS_HOME"] = str(select_profile(profiles_root(), event_id()))


def is_distribution():
    return _payload is not None


def event_id():
    return _payload["event"]["id"] if _payload and _payload["mode"] == "event" else None


def install(db):
    from snapshot_store import install_snapshot
    install_snapshot(db, _payload, _digest)
