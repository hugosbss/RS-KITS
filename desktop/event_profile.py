"""Event identity and profile selection, independent of the HTTP/UI layers."""
import hashlib
import os
import sys
import sqlite3
from pathlib import Path

BOUND_EVENT_KEY = "profile_event_id"


def profiles_root():
    if sys.platform.startswith("win"):
        base = Path(os.environ.get("APPDATA") or Path.home() / "AppData" / "Roaming") / "RS-KITS"
    elif sys.platform == "darwin":
        base = Path.home() / "Library" / "Application Support" / "RS-KITS"
    else:
        base = Path(os.environ.get("XDG_CONFIG_HOME") or Path.home() / ".config") / "RS-KITS"
    return base / "profiles"


def select_profile(root, event_id=None):
    """Reuse one legacy database; never guess between divergent snapshots."""
    root = Path(root)
    if event_id is None:
        return root / "clean"
    name = "event-" + hashlib.sha256(event_id.encode()).hexdigest()[:16]
    stable = root / name
    candidates = [p for p in root.glob(name + "-*") if (p / "database" / "rskits.sqlite").is_file()]
    if (stable / "database" / "rskits.sqlite").is_file():
        return stable
    if len(candidates) > 1:
        raise ValueError("Há vários bancos anteriores deste evento. Selecione explicitamente o banco operacional com --data-dir; nenhum banco foi sobrescrito.")
    return candidates[0] if candidates else stable


def validate_event(conn, event_id):
    """Reject a foreign/shared database before importing or serving data."""
    bound = conn.execute("SELECT value FROM app_config WHERE key=?", (BOUND_EVENT_KEY,)).fetchone()
    if bound and bound[0] != event_id:
        raise ValueError("Este banco pertence a outro evento. Abra o executável com seu próprio perfil.")
    if event_id is None:
        return
    if conn.execute("SELECT id FROM events WHERE id<>? LIMIT 1", (event_id,)).fetchone():
        raise ValueError("O banco contém outro evento e não pode ser usado por esta distribuição.")
    if conn.execute("SELECT id FROM athletes WHERE event_id<>? LIMIT 1", (event_id,)).fetchone():
        raise ValueError("O banco contém atletas de outro evento e não pode ser usado por esta distribuição.")


def bind_event(conn, event_id):
    validate_event(conn, event_id)
    if event_id is not None:
        conn.execute("INSERT OR IGNORE INTO app_config (key,value) VALUES (?,?)", (BOUND_EVENT_KEY, event_id))


def validate_database(path, event_id):
    """Read-only validation before schema migrations or administrator seeding."""
    path = Path(path)
    if not path.is_file():
        return
    conn = sqlite3.connect(path.resolve().as_uri() + "?mode=ro", uri=True)
    try:
        tables = {row[0] for row in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        if {"events", "app_config"}.issubset(tables):
            validate_event(conn, event_id)
    finally:
        conn.close()


def assert_event(expected, received):
    if expected and received != expected:
        raise ValueError("O evento solicitado não pertence a este executável.")
