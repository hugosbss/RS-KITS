import hashlib
import sqlite3
import uuid
from datetime import datetime

from config import DB_PATH, ensure_dirs

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    cpf TEXT,
    cnpj TEXT,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'OPERADOR',
    phone TEXT,
    organizer_id TEXT REFERENCES users(id),
    created_at TEXT,
    updated_at TEXT
);

CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    date TEXT,
    place TEXT,
    status TEXT DEFAULT 'EM_ANDAMENTO',
    created_at TEXT,
    updated_at TEXT
);

CREATE TABLE IF NOT EXISTS athletes (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES events(id),
    num TEXT,
    nome_atleta TEXT,
    kit TEXT,
    distancia TEXT,
    fx_etaria TEXT,
    categ_especial TEXT,
    nascto TEXT,
    sexo TEXT,
    equipe TEXT,
    cidade_uf TEXT,
    camiseta TEXT,
    cpf_atleta TEXT,
    cel TEXT,
    email TEXT,
    quem_vai_retirar TEXT,
    notas TEXT,
    obs1 TEXT,
    obs2 TEXT,
    alerta TEXT,
    nome_evento TEXT,
    pin TEXT,
    status TEXT DEFAULT 'PENDENTE',
    data_entrega TEXT,
    usuario_entrega TEXT,
    nome_entrega TEXT,
    cpf_entrega TEXT,
    fone_entrega TEXT,
    email_entrega TEXT,
    terceiro INTEGER DEFAULT 0,
    data_estorno TEXT,
    usuario_estorno TEXT,
    contato_emergencia TEXT,
    relacao_atleta TEXT,
    telefone_emergencia TEXT,
    created_at TEXT,
    updated_at TEXT
);

CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    usuario TEXT,
    num_atleta TEXT,
    nome_atleta TEXT,
    campo_alterado TEXT,
    valor_anterior TEXT,
    valor_novo TEXT,
    dispositivo TEXT DEFAULT 'Desktop',
    synced INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sync_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    last_push TEXT,
    last_pull TEXT,
    pending_changes INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS app_config (
    key TEXT PRIMARY KEY,
    value TEXT
);
"""

ATHLETE_COLUMNS = [
    "id", "event_id", "num", "nome_atleta", "kit", "distancia", "fx_etaria",
    "categ_especial", "nascto", "sexo", "equipe", "cidade_uf", "camiseta",
    "cpf_atleta", "cel", "email", "quem_vai_retirar", "notas", "obs1", "obs2",
    "alerta", "nome_evento", "pin", "status", "data_entrega", "usuario_entrega",
    "nome_entrega", "cpf_entrega", "fone_entrega", "email_entrega", "terceiro",
    "data_estorno", "usuario_estorno", "contato_emergencia", "relacao_atleta",
    "telefone_emergencia", "created_at", "updated_at",
]

USER_COLUMNS = [
    "id", "name", "email", "cpf", "cnpj", "password_hash", "role", "phone",
    "organizer_id", "created_at", "updated_at",
]


def now() -> str:
    return datetime.now().strftime("%d/%m/%Y %H:%M:%S")


def new_id() -> str:
    return uuid.uuid4().hex[:16]


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def verify_password(password: str, password_hash: str) -> bool:
    return hash_password(password) == password_hash


def get_conn() -> sqlite3.Connection:
    ensure_dirs()
    conn = sqlite3.connect(DB_PATH, timeout=5)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA busy_timeout = 5000")
    return conn


def init_db() -> None:
    conn = get_conn()
    try:
        conn.executescript(SCHEMA)
        conn.execute(
            "INSERT OR IGNORE INTO sync_state (id, last_push, last_pull, pending_changes) VALUES (1, NULL, NULL, 0)"
        )
        conn.commit()
        seed()
    finally:
        conn.close()


def seed() -> None:
    """Garante a conta de administrador padrão (admin@rksits.com / admin123).

    Idempotente: banco novo cria somente o ADMIN. Banco existente apenas
    garante que o usuário 'admin' exista com a role ADMIN, sem duplicar,
    sem apagar e sem resetar a senha de usuários existentes.
    """
    conn = get_conn()
    try:
        row = conn.execute("SELECT id, email, role FROM users WHERE id = 'admin'").fetchone()
        if row is None:
            conn.execute(
                "INSERT INTO users (id, name, email, cpf, password_hash, role, created_at, updated_at)"
                " VALUES ('admin', 'Administrador', 'admin@rksits.com', '000.000.000-00', ?, 'ADMIN', ?, ?)",
                (hash_password("admin123"), now(), now()),
            )
        else:
            changes = []
            params = []
            if row["role"] != "ADMIN":
                changes.append("role = 'ADMIN'")
            if not row["email"]:
                changes.append("email = 'admin@rksits.com'")
            if changes:
                changes.append("updated_at = ?")
                params.append(now())
                params.append("admin")
                conn.execute(
                    f"UPDATE users SET {', '.join(changes)} WHERE id = 'admin'", params
                )
        conn.commit()
    finally:
        conn.close()


# ---------- helpers genéricos ----------

def fetch_all(sql: str, params: tuple = ()) -> list[sqlite3.Row]:
    conn = get_conn()
    try:
        return conn.execute(sql, params).fetchall()
    finally:
        conn.close()


def fetch_one(sql: str, params: tuple = ()) -> sqlite3.Row | None:
    conn = get_conn()
    try:
        return conn.execute(sql, params).fetchone()
    finally:
        conn.close()


def execute(sql: str, params: tuple = ()) -> int:
    conn = get_conn()
    try:
        cur = conn.execute(sql, params)
        conn.commit()
        return cur.lastrowid or 0
    finally:
        conn.close()


def log_audit(usuario: str | None, num_atleta: str | None, nome_atleta: str | None,
              campo: str, anterior: str | None, novo: str | None) -> None:
    execute(
        "INSERT INTO audit_log (id, timestamp, usuario, num_atleta, nome_atleta, campo_alterado, valor_anterior, valor_novo, dispositivo, synced)"
        " VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Desktop', 0)",
        (new_id(), now(), usuario, num_atleta, nome_atleta, campo, anterior, novo),
    )


def set_config(key: str, value: str) -> None:
    execute(
        "INSERT INTO app_config (key, value) VALUES (?, ?) "
        "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        (key, value),
    )


def get_config(key: str, default: str | None = None) -> str | None:
    row = fetch_one("SELECT value FROM app_config WHERE key = ?", (key,))
    return row["value"] if row else default


def set_access_code(organizer_id: str, code: str) -> None:
    """Armazena o código de acesso do organizador como hash (sha256)."""
    hashed = hashlib.sha256(code.encode("utf-8")).hexdigest()
    set_config(f"org_code_{organizer_id}", hashed)


def find_user_by_access_code(code: str):
    """Resolve um ORGANIZADOR pelo código de acesso (chave `org_code_<id>`).

    Aceita códigos armazenados como hash (novos) ou em texto puro (legado);
    neste último caso, reescreve o valor como hash na migração. Nunca trata o
    código como `name`.
    """
    code = code.strip()
    if not code:
        return None
    hashed = hashlib.sha256(code.encode("utf-8")).hexdigest()
    conn = get_conn()
    try:
        for row in conn.execute(
            "SELECT key, value FROM app_config WHERE key LIKE 'org_code_%'"
        ).fetchall():
            stored = row["value"]
            stored_is_hash = bool(stored) and len(stored) == 64
            if (
                stored == hashed
                or (stored_is_hash and stored.lower() == hashed)
                or (not stored_is_hash and stored == code)
            ):
                org_id = row["key"][len("org_code_"):]
                user = conn.execute(
                    "SELECT * FROM users WHERE id = ? AND role = 'ORGANIZADOR'",
                    (org_id,),
                ).fetchone()
                if user:
                    if not stored_is_hash:
                        conn.execute(
                            "UPDATE app_config SET value = ? WHERE key = ?",
                            (hashed, row["key"]),
                        )
                        conn.commit()
                    return user
    finally:
        conn.close()
    return None


def row_to_dict(row: sqlite3.Row | None) -> dict | None:
    if row is None:
        return None
    return {key: row[key] for key in row.keys()}