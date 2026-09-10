"""API local do executável (FastAPI) + servir o frontend estático.

Porta padrão: 19090 (evita conflito com Next 3000 e NestJS 3001).
Tudo roda na mesma máquina, sem depender da rede.
"""

import csv
import io
import os
import random
import re
import unicodedata

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

import config
import database as db
import package_builder
import sync
from models import (
    AuditCreate,
    DeliverRequest,
    EventCreate,
    EventUpdate,
    InstallRequest,
    LoginRequest,
    OperatorCreate,
    OrganizerCreate,
    ReverseRequest,
    SyncSettings,
    UserUpdate,
)

config.ensure_dirs()
db.init_db()


def auto_install_packages() -> None:
    """Instala pacotes .rksits ainda não instalados (cada acesso já traz o evento)."""
    installed = set(p.strip() for p in (db.get_config("installed_packages") or "").split("|") if p.strip())
    for name in package_builder.list_packages():
        if name in installed:
            continue
        try:
            pkg = package_builder.read_package(os.path.join(config.PACKAGES_DIR, name))
            event = pkg.get("event", {})
            event_id = event.get("id") or db.new_id()
            existing = db.fetch_one("SELECT id FROM events WHERE id = ?", (event_id,))
            if existing:
                db.execute(
                    "UPDATE events SET name = ?, date = ?, place = ?, status = ?, updated_at = ? WHERE id = ?",
                    (event.get("name", ""), event.get("date", ""), event.get("place", ""),
                     event.get("status", "EM_ANDAMENTO"), now(), event_id),
                )
            else:
                db.execute(
                    "INSERT INTO events (id, name, date, place, status, created_at, updated_at)"
                    " VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (event_id, event.get("name", ""), event.get("date", ""), event.get("place", ""),
                     event.get("status", "EM_ANDAMENTO"), now(), now()),
                )
            org = pkg.get("organizer")
            if org and org.get("name"):
                email = org.get("email") or ""
                row = db.fetch_one("SELECT id FROM users WHERE TRIM(email) = ? OR TRIM(name) = ?",
                                   (email, org["name"]))
                if row:
                    db.execute("UPDATE users SET password_hash = ?, email = ?, updated_at = ? WHERE id = ?",
                               (db.hash_password(org.get("offlinePassword", "123456")), email, now(), row["id"]))
                    db.set_config(f"pkg_org_{event_id}", row["id"])
                else:
                    org_id = db.new_id()
                    db.execute(
                        "INSERT INTO users (id, name, email, cpf, password_hash, role, created_at, updated_at)"
                        " VALUES (?, ?, ?, ?, ?, 'ORGANIZADOR', ?, ?)",
                        (org_id, org["name"], email, org.get("cpf", ""),
                         db.hash_password(org.get("offlinePassword", "123456")), now(), now()),
                    )
                    db.set_config(f"pkg_org_{event_id}", org_id)
            upsert_athletes(event_id, pkg.get("athletes", []), "Pacote")
            cloud = pkg.get("config", {}).get("cloudUrl")
            if cloud:
                sync.set_cloud_url(cloud)
            installed.add(name)
            db.set_config("installed_packages", "|".join(sorted(installed)))
            db.log_audit("Pacote", None, event.get("name"), "pacote_instalado", None, name)
        except Exception as exc:  # nunca impede a inicialização
            print(f"[auto-install] falha ao instalar {name}: {exc}")


auto_install_packages()

app = FastAPI(title="RS KITS Desktop")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------------------------------- #
# helpers
# --------------------------------------------------------------------------- #
def now():
    return db.now()


def require_role(request: Request, roles: set[str]) -> dict:
    user_id = request.headers.get("X-Userid", "")
    if not user_id:
        # Aceita Authorization: Bearer <token> (token local = id do usuário).
        auth = request.headers.get("Authorization", "")
        if auth.lower().startswith("bearer "):
            user_id = auth[7:].strip()
    row = db.fetch_one("SELECT * FROM users WHERE id = ?", (user_id,))
    if not row:
        raise HTTPException(401, "Usuário não autenticado no executável.")
    user = dict(row)
    if user["role"] not in roles:
        raise HTTPException(403, "Permissão necessária.")
    return user


def serialize_user(row) -> dict:
    data = dict(row)
    data.pop("password_hash", None)
    # Aliases camelCase esperados pelo frontend (NestJS).
    data["organizerId"] = data.get("organizer_id")
    data["createdAt"] = data.get("created_at")
    data["updatedAt"] = data.get("updated_at")
    return data


def serialize_event(row) -> dict:
    data = dict(row)
    data["createdAt"] = data.get("created_at")
    data["updatedAt"] = data.get("updated_at")
    data["organizers"] = []
    org_id = db.get_config(f"pkg_org_{row['id']}")
    if org_id:
        org = db.fetch_one(
            "SELECT id, name, email, phone, created_at FROM users WHERE id = ?", (org_id,))
        if org:
            data["organizers"] = [{
                "id": org["id"],
                "name": org["name"],
                "email": org["email"] or None,
                "phone": org["phone"] or None,
                "assignedAt": org["created_at"] or data.get("created_at") or "",
            }]
    return data


HEADER_MAP = {
    "num": "num",
    "nome atleta": "nomeAtleta",
    "kit": "kit",
    "distancia": "modalidade",
    "distância": "modalidade",
    "fx etaria": "fxEtaria",
    "fx etária": "fxEtaria",
    "categ especial": "categEspecial",
    "nascto": "nascto",
    "sexo": "sexo",
    "equipe": "equipe",
    "cidade/uf": "cidadeUf",
    "camiseta": "camiseta",
    "cpf atleta": "cpfAtleta",
    "cel": "cel",
    "e-mail": "email",
    "email": "email",
    "quem vai retirar o kit": "quemVaiRetirar",
    "notas": "notas",
    "obs1": "obs1",
    "obs2": "obs2",
    "alerta": "alerta",
    "nome evento": "nomeEvento",
}


def norm_header(value: str) -> str:
    value = unicodedata.normalize("NFKD", value)
    value = "".join(c for c in value if not unicodedata.combining(c))
    return " ".join(value.lower().strip().rstrip(".").split())


def parse_csv(content: bytes) -> list[dict]:
    text = content.decode("utf-8-sig", errors="ignore")
    reader = csv.DictReader(io.StringIO(text), delimiter=";")
    if not reader.fieldnames or not reader.fieldnames[0]:
        reader = csv.DictReader(io.StringIO(text), delimiter=",")
    rows = []
    for raw in reader:
        row = {}
        for header, value in raw.items():
            key = HEADER_MAP.get(norm_header(header or ""))
            if key:
                row[key] = (value or "").strip()
        if any(row.values()):
            rows.append(row)
    return rows


def br_date(value) -> str:
    """Converte ISO (AAAA-MM-DD...) em DD/MM/AAAA; mantém o valor se não for ISO."""
    if isinstance(value, str):
        text = value.strip()
        if re.match(r"^\d{4}-\d{2}-\d{2}", text):
            return f"{text[8:10]}/{text[5:7]}/{text[0:4]}"
    return value


def normalize_frontend_row(row: dict) -> dict:
    """Aceita o contraste do frontend (distancia/nascimento) na importação."""
    data = dict(row)
    if data.get("distancia") is not None and "modalidade" not in data:
        data["modalidade"] = data["distancia"]
    if data.get("nascimento") is not None and "nascto" not in data:
        data["nascto"] = br_date(data["nascimento"])
    data.pop("distancia", None)
    data.pop("nascimento", None)
    return data


def upsert_athletes(event_id: str, rows: list[dict], usuario: str | None = None) -> dict:
    conn = db.get_conn()
    imported = updated = 0
    audits = []
    try:
        for row in rows:
            data = package_builder.json_to_db_athlete(normalize_frontend_row(row))
            data["event_id"] = event_id
            data["updated_at"] = now()
            data["created_at"] = now()
            if not data.get("status"):
                data["status"] = "PENDENTE"
            existing = None
            if data.get("cpf_atleta"):
                existing = conn.execute(
                    "SELECT id FROM athletes WHERE event_id = ? AND cpf_atleta = ?",
                    (event_id, data["cpf_atleta"]),
                ).fetchone()
            if existing:
                preserve = [
                    "status", "data_entrega", "usuario_entrega", "nome_entrega",
                    "cpf_entrega", "fone_entrega", "email_entrega", "terceiro",
                    "data_estorno", "usuario_estorno", "created_at",
                ]
                sql_cols = []
                params = []
                for col in data:
                    if col in preserve:
                        continue
                    sql_cols.append(f"{col} = ?")
                    params.append(data[col])
                sql_cols.append("updated_at = ?")
                params.append(data["updated_at"])
                params.append(existing["id"])
                conn.execute(
                    f"UPDATE athletes SET {', '.join(sql_cols)} WHERE id = ?", params
                )
                updated += 1
            else:
                cols = ", ".join(data.keys())
                marks = ", ".join("?" for _ in data)
                conn.execute(
                    f"INSERT INTO athletes ({cols}) VALUES ({marks})", list(data.values())
                )
                imported += 1
                if usuario:
                    audits.append((usuario, data.get("num"), data.get("nome_atleta")))
        for usuario_audit, num_atleta, nome_atleta in audits:
            conn.execute(
                "INSERT INTO audit_log (id, timestamp, usuario, num_atleta, nome_atleta,"
                " campo_alterado, valor_anterior, valor_novo, dispositivo, synced)"
                " VALUES (?, ?, ?, ?, ?, 'importacao', NULL, 'novo atleta', 'Desktop', 0)",
                (db.new_id(), now(), usuario_audit, num_atleta, nome_atleta),
            )
        conn.commit()
    finally:
        conn.close()
    return {"imported": imported, "updated": updated, "total": imported + updated}


# --------------------------------------------------------------------------- #
# Auth
# --------------------------------------------------------------------------- #
@app.post("/api/auth/login")
def login(payload: LoginRequest):
    identifier = payload.identifier.strip()
    row = db.fetch_one(
        "SELECT * FROM users WHERE TRIM(email) = ? OR TRIM(cpf) = ? OR TRIM(name) = ?",
        (identifier, identifier, identifier),
    )
    if not row or not db.verify_password(payload.password, row["password_hash"]):
        raise HTTPException(401, "Identificador ou senha inválidos.")
    return {"user": serialize_user(row), "access_token": row["id"]}


@app.post("/api/auth/register")
def register(request: Request, body: dict):
    require_role(request, {"ADMIN", "ORGANIZADOR"})
    name = (body.get("name") or "").strip()
    if not name:
        raise HTTPException(400, "Nome é obrigatório.")
    role_raw = body.get("role") or "OPERADOR"
    # Frontend envia "OPERATOR" (NestJS); internamente usamos "OPERADOR".
    role = "OPERADOR" if role_raw == "OPERATOR" else role_raw
    if role not in {"ADMIN", "ORGANIZADOR", "OPERADOR"}:
        raise HTTPException(400, "Perfil inválido.")
    cpf = body.get("cpf") or None
    if cpf and db.fetch_one("SELECT id FROM users WHERE TRIM(cpf) = ?", (cpf,)):
        raise HTTPException(409, "CPF já cadastrado.")
    if not (body.get("password") or ""):
        raise HTTPException(400, "Senha é obrigatória.")
    user = require_role(request, {"ADMIN", "ORGANIZADOR"})
    user_id = db.new_id()
    organizer_id = body.get("organizerId") or None
    if user["role"] == "ORGANIZADOR":
        role = "OPERADOR"
        organizer_id = user["id"]
    db.execute(
        "INSERT INTO users (id, name, email, cpf, cnpj, password_hash, role, phone,"
        " organizer_id, created_at, updated_at)"
        " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (user_id, name, body.get("email") or "", cpf, body.get("cnpj") or None,
         db.hash_password(body["password"]), role, body.get("phone") or "",
         organizer_id, now(), now()),
    )
    db.log_audit(user["name"], None, name, "usuario_criado", None, role)
    return {"user": serialize_user(
        db.fetch_one("SELECT * FROM users WHERE id = ?", (user_id,)))}


@app.get("/api/auth/me")
def me(request: Request):
    return require_role(request, {"ADMIN", "ORGANIZADOR", "OPERADOR"})


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "rskits-desktop", "port": config.PORT}


# --------------------------------------------------------------------------- #
# Config gerais
# --------------------------------------------------------------------------- #
@app.get("/api/config")
def app_config():
    online = sync.probe_online()
    return {
        "cloud_url": sync.cloud_url(),
        "pending": sync.pending_changes(),
        "online": online,
        "mode": "ONLINE" if online else "OFFLINE",
        "packages_dir": config.PACKAGES_DIR,
    }


@app.post("/api/config/sync")
def set_sync_config(payload: SyncSettings):
    sync.set_cloud_url(payload.cloud_url)
    return sync.status()


# --------------------------------------------------------------------------- #
# Eventos
# --------------------------------------------------------------------------- #
@app.get("/api/events")
def list_events():
    return [serialize_event(r) for r in db.fetch_all("SELECT * FROM events ORDER BY name")]


@app.post("/api/events")
def create_event(request: Request, payload: EventCreate):
    require_role(request, {"ADMIN", "ORGANIZADOR"})
    event_id = db.new_id()
    db.execute(
        "INSERT INTO events (id, name, date, place, status, created_at, updated_at)"
        " VALUES (?, ?, ?, ?, ?, ?, ?)",
        (event_id, payload.name, payload.date or "", payload.place or "",
         payload.status or "EM_ANDAMENTO", now(), now()),
    )
    return serialize_event(db.fetch_one("SELECT * FROM events WHERE id = ?", (event_id,)))


@app.get("/api/events/{event_id}")
def get_event(event_id: str):
    row = db.fetch_one("SELECT * FROM events WHERE id = ?", (event_id,))
    if not row:
        raise HTTPException(404, "Evento não encontrado.")
    return serialize_event(row)


@app.patch("/api/events/{event_id}")
def update_event(request: Request, event_id: str, payload: EventUpdate):
    user = require_role(request, {"ADMIN", "ORGANIZADOR"})
    row = db.fetch_one("SELECT * FROM events WHERE id = ?", (event_id,))
    if not row:
        raise HTTPException(404, "Evento não encontrado.")

    changes: list[str] = []
    params: list = []
    for col in ("name", "date", "place", "status"):
        value = getattr(payload, col, None)
        if value is not None:
            changes.append(f"{col} = ?")
            params.append(value)
    if not changes:
        return dict(row)
    changes.append("updated_at = ?")
    params.append(now())
    params.append(event_id)
    db.execute(f"UPDATE events SET {', '.join(changes)} WHERE id = ?", params)
    db.log_audit(user["name"], None, row["name"], "evento_atualizado", None,
                 "; ".join(c.split(" =")[0] for c in changes))
    return serialize_event(db.fetch_one("SELECT * FROM events WHERE id = ?", (event_id,)))


@app.delete("/api/events/{event_id}")
def delete_event(request: Request, event_id: str):
    user = require_role(request, {"ADMIN"})
    if not db.fetch_one("SELECT id FROM events WHERE id = ?", (event_id,)):
        raise HTTPException(404, "Evento não encontrado.")
    db.execute("DELETE FROM athletes WHERE event_id = ?", (event_id,))
    db.execute("DELETE FROM events WHERE id = ?", (event_id,))
    db.log_audit(user["name"], None, event_id, "evento_excluido", None, "Evento e atletas removidos")
    db.set_config(f"event_orgs_{event_id}", "")
    return {"ok": True}


def _event_organizer_ids(event_id: str) -> list[str]:
    raw = db.get_config(f"event_orgs_{event_id}") or ""
    return [oid for oid in (raw.split("|") if raw else []) if oid]


def _event_organizers(event_id: str) -> list[dict]:
    out = []
    for oid in _event_organizer_ids(event_id):
        row = db.fetch_one("SELECT * FROM users WHERE id = ?", (oid,))
        if row:
            out.append({
                "id": row["id"],
                "name": row["name"],
                "email": row["email"] or None,
                "phone": row["phone"] or None,
                "assignedAt": row["created_at"] or "",
            })
    return out


@app.get("/api/events/{event_id}/organizers")
def list_event_organizers(event_id: str):
    if not db.fetch_one("SELECT id FROM events WHERE id = ?", (event_id,)):
        raise HTTPException(404, "Evento não encontrado.")
    return _event_organizers(event_id)


@app.post("/api/events/{event_id}/organizers")
def add_event_organizer(request: Request, event_id: str, body: dict):
    require_role(request, {"ADMIN", "ORGANIZADOR"})
    if not db.fetch_one("SELECT id FROM events WHERE id = ?", (event_id,)):
        raise HTTPException(404, "Evento não encontrado.")
    user_id = body.get("userId") or ""
    if user_id and not db.fetch_one("SELECT id FROM users WHERE id = ?", (user_id,)):
        raise HTTPException(404, "Usuário não encontrado.")
    ids = _event_organizer_ids(event_id)
    if user_id and user_id not in ids:
        ids.append(user_id)
    db.set_config(f"event_orgs_{event_id}", "|".join(ids))
    return _event_organizers(event_id)


@app.delete("/api/events/{event_id}/organizers/{user_id}")
def remove_event_organizer(request: Request, event_id: str, user_id: str):
    require_role(request, {"ADMIN", "ORGANIZADOR"})
    if not db.fetch_one("SELECT id FROM events WHERE id = ?", (event_id,)):
        raise HTTPException(404, "Evento não encontrado.")
    ids = [oid for oid in _event_organizer_ids(event_id) if oid != user_id]
    db.set_config(f"event_orgs_{event_id}", "|".join(ids))
    return _event_organizers(event_id)


@app.post("/api/events/{event_id}/import")
async def import_event_data(event_id: str, request: Request, file: UploadFile | None = File(default=None)):
    require_role(request, {"ADMIN", "ORGANIZADOR"})
    if not db.fetch_one("SELECT id FROM events WHERE id = ?", (event_id,)):
        raise HTTPException(404, "Evento não encontrado.")

    content = await file.read() if file else b""
    if not content:
        raise HTTPException(400, "Arquivo vazio.")

    user = require_role(request, {"ADMIN", "ORGANIZADOR"})
    rows = parse_csv(content)
    if not rows:
        raise HTTPException(400, "Não foi possível ler colunas esperadas do arquivo.")
    return upsert_athletes(event_id, rows, user.get("name"))


@app.post("/api/events/{event_id}/athletes")
def import_athletes_json(request: Request, event_id: str, body: dict):
    require_role(request, {"ADMIN", "ORGANIZADOR"})
    user = require_role(request, {"ADMIN", "ORGANIZADOR"})
    rows = body.get("athletes", [])
    if not rows:
        raise HTTPException(400, "Lista de atletas vazia.")
    return upsert_athletes(event_id, rows, user.get("name"))


# --------------------------------------------------------------------------- #
# Atletas / entrega
# --------------------------------------------------------------------------- #
def athlete_out(row) -> dict:
    out = package_builder.athlete_to_json(row)
    out["distancia"] = row["distancia"]
    out["nascimento"] = out.get("nascto")
    return out


@app.get("/api/events/{event_id}/athletes")
def list_athletes(event_id: str, search: str = "", limit: int = 200000, offset: int = 0):
    where = "event_id = ?"
    params: list = [event_id]
    if search:
        where += " AND (num LIKE ? OR nome_atleta LIKE ? OR cpf_atleta LIKE ? OR cidade_uf LIKE ?)"
        like = f"%{search}%"
        params += [like, like, like, like]
    total = db.fetch_one(f"SELECT COUNT(*) AS c FROM athletes WHERE {where}", tuple(params))["c"]
    rows = db.fetch_all(
        f"SELECT * FROM athletes WHERE {where} ORDER BY CAST(num AS INTEGER), num LIMIT ? OFFSET ?",
        tuple(params + [limit, offset]),
    )
    return {"total": total, "athletes": [athlete_out(r) for r in rows]}


@app.patch("/api/events/{event_id}/athletes/{athlete_id}")
def update_athlete(request: Request, event_id: str, athlete_id: str, body: dict):
    user = require_role(request, {"ADMIN", "ORGANIZADOR", "OPERADOR"})
    allowed = (set(package_builder.DB_FIELD) - {"id", "itensAdicionais"}) | {"distancia", "nascimento"}
    changes = {k: v for k, v in body.items() if k in allowed}
    if not changes:
        raise HTTPException(400, "Nenhum campo permitido para edição.")

    db_row = db.fetch_one("SELECT * FROM athletes WHERE id = ? AND event_id = ?", (athlete_id, event_id))
    if not db_row:
        raise HTTPException(404, "Atleta não encontrado.")

    # Aliases usados pelo frontend (distancia/nascimento no PATCH/import).
    if "distancia" in changes and "modalidade" not in changes:
        changes["modalidade"] = changes.pop("distancia")
    if "nascimento" in changes and "nascto" not in changes:
        changes["nascto"] = br_date(changes.pop("nascimento"))

    data = package_builder.json_to_db_athlete(changes)
    sets = []
    params = []
    for key in changes:
        db_key = package_builder.DB_FIELD[key]
        sets.append(f"{db_key} = ?")
        params.append(data[db_key])
    sets.append("updated_at = ?")
    params.append(now())
    params.append(athlete_id)
    db.execute(f"UPDATE athletes SET {', '.join(sets)} WHERE id = ?", params)
    db.log_audit(user["name"], db_row["num"], db_row["nome_atleta"],
                 "edicao", None, "; ".join(changes.keys()))
    return athlete_out(db.fetch_one("SELECT * FROM athletes WHERE id = ?", (athlete_id,)))


@app.post("/api/events/{event_id}/deliver")
def deliver(request: Request, event_id: str, payload: DeliverRequest):
    user = require_role(request, {"ADMIN", "ORGANIZADOR", "OPERADOR"})
    row = db.fetch_one("SELECT * FROM athletes WHERE id = ? AND event_id = ?",
                       (payload.athlete_id, event_id))
    if not row:
        raise HTTPException(404, "Atleta não encontrado.")
    if row["status"] == "ENTREGUE":
        raise HTTPException(400, "Kit já entregue para este atleta.")

    nome_entrega = (payload.nome_entrega or "").strip() or row["nome_atleta"]
    terceiro = 1 if payload.terceiro or (payload.nome_entrega or "").strip() else 0
    db.execute(
        "UPDATE athletes SET status = 'ENTREGUE', data_entrega = ?, usuario_entrega = ?,"
        " nome_entrega = ?, cpf_entrega = ?, fone_entrega = ?, email_entrega = ?,"
        " terceiro = ?, updated_at = ? WHERE id = ?",
        (now(), user["name"], nome_entrega, payload.cpf_entrega or "", payload.fone_entrega or "",
         payload.email_entrega or "", terceiro, now(), payload.athlete_id),
    )
    db.log_audit(user["name"], row["num"], row["nome_atleta"], "status", row["status"], "ENTREGUE")
    return {"ok": True, "athlete": athlete_out(
        db.fetch_one("SELECT * FROM athletes WHERE id = ?", (payload.athlete_id,)))}


@app.post("/api/events/{event_id}/reverse")
def reverse(request: Request, event_id: str, payload: ReverseRequest):
    user = require_role(request, {"ADMIN", "ORGANIZADOR", "OPERADOR"})
    row = db.fetch_one("SELECT * FROM athletes WHERE id = ? AND event_id = ?",
                       (payload.athlete_id, event_id))
    if not row:
        raise HTTPException(404, "Atleta não encontrado.")
    if row["status"] != "ENTREGUE":
        raise HTTPException(400, "Kit ainda não estava entregue.")

    db.execute(
        "UPDATE athletes SET status = 'ESTORNADO', data_estorno = ?, usuario_estorno = ?,"
        " data_entrega = NULL, usuario_entrega = NULL, nome_entrega = NULL, cpf_entrega = NULL,"
        " fone_entrega = NULL, email_entrega = NULL, terceiro = 0, updated_at = ? WHERE id = ?",
        (now(), user["name"], now(), payload.athlete_id),
    )
    db.log_audit(user["name"], row["num"], row["nome_atleta"], "status", "ENTREGUE", "ESTORNADO")
    return {"ok": True, "athlete": athlete_out(
        db.fetch_one("SELECT * FROM athletes WHERE id = ?", (payload.athlete_id,)))}


@app.post("/api/events/{event_id}/reset")
def reset_deliveries(request: Request, event_id: str):
    user = require_role(request, {"ADMIN", "ORGANIZADOR"})
    db.execute(
        "UPDATE athletes SET status = 'PENDENTE', data_entrega = NULL, usuario_entrega = NULL,"
        " nome_entrega = NULL, cpf_entrega = NULL, fone_entrega = NULL, email_entrega = NULL,"
        " terceiro = 0, data_estorno = NULL, usuario_estorno = NULL, updated_at = ? WHERE event_id = ?",
        (now(), event_id),
    )
    count = db.fetch_one("SELECT COUNT(*) AS c FROM athletes WHERE event_id = ?", (event_id,))["c"]
    db.log_audit(user["name"], None, None, "reset_deliveries", None, str(count))
    return {"ok": True, "reset": count}


# --------------------------------------------------------------------------- #
# Operadores
# --------------------------------------------------------------------------- #
@app.get("/api/operators")
def list_operators():
    rows = db.fetch_all("SELECT * FROM users WHERE role = 'OPERADOR' ORDER BY name")
    return [serialize_user(r) for r in rows]


@app.post("/api/operators")
def create_operator(request: Request, payload: OperatorCreate):
    user = require_role(request, {"ADMIN", "ORGANIZADOR"})
    if db.fetch_one("SELECT id FROM users WHERE TRIM(cpf) = ?", (payload.cpf or "",)):
        raise HTTPException(409, "CPF já cadastrado.")
    op_id = db.new_id()
    org_link = (payload.organizer_id or user["id"]) if user["role"] == "ORGANIZADOR" else payload.organizer_id
    db.execute(
        "INSERT INTO users (id, name, email, cpf, password_hash, role, organizer_id, created_at, updated_at)"
        " VALUES (?, ?, ?, ?, ?, 'OPERADOR', ?, ?, ?)",
        (op_id, payload.name, payload.email or "", payload.cpf or "",
         db.hash_password(payload.password), org_link, now(), now()),
    )
    db.log_audit(user["name"], None, payload.name, "operador_criado", None, "OPERADOR")
    return {"id": op_id, "name": payload.name}


@app.get("/api/users")
def list_users():
    return [serialize_user(r) for r in db.fetch_all("SELECT * FROM users ORDER BY role, name")]


@app.post("/api/organizers")
def create_organizer(request: Request, payload: OrganizerCreate):
    user = require_role(request, {"ADMIN"})
    if db.fetch_one("SELECT id FROM users WHERE TRIM(cpf) = ?", (payload.cpf or "",)):
        raise HTTPException(409, "CPF já cadastrado.")
    org_id = db.new_id()
    db.execute(
        "INSERT INTO users (id, name, email, cpf, cnpj, phone, password_hash, role, created_at, updated_at)"
        " VALUES (?, ?, ?, ?, ?, ?, ?, 'ORGANIZADOR', ?, ?)",
        (org_id, payload.name, payload.email or "", payload.cpf or "", payload.cnpj or "",
         payload.phone or "", db.hash_password(payload.password), now(), now()),
    )
    if payload.accessCode:
        db.set_config(f"org_code_{org_id}", payload.accessCode)
    db.log_audit(user["name"], None, payload.name, "organizador_criado", None, "ORGANIZADOR")
    return {"id": org_id, "name": payload.name}


@app.patch("/api/users/{user_id}")
def update_user(request: Request, user_id: str, payload: UserUpdate):
    user = require_role(request, {"ADMIN", "ORGANIZADOR"})
    row = db.fetch_one("SELECT * FROM users WHERE id = ?", (user_id,))
    if not row:
        raise HTTPException(404, "Usuário não encontrado.")
    if user["role"] == "ORGANIZADOR" and row["role"] != "OPERADOR":
        raise HTTPException(403, "Organizador só edita operadores.")
    if user["role"] == "ORGANIZADOR" and row["organizer_id"] != user["id"]:
        raise HTTPException(403, "Operador não pertence ao seu organizador.")

    changes: list[str] = []
    params: list = []
    for col in ("name", "cpf", "cnpj", "email", "phone"):
        value = getattr(payload, col, None)
        if value is not None:
            changes.append(f"{col} = ?")
            params.append(value)
    if payload.password:
        changes.append("password_hash = ?")
        params.append(db.hash_password(payload.password))
    if not changes:
        return serialize_user(row)
    changes.append("updated_at = ?")
    params.append(now())
    params.append(user_id)
    db.execute(f"UPDATE users SET {', '.join(changes)} WHERE id = ?", params)
    db.log_audit(user["name"], None, row["name"], "usuario_atualizado", None, row["role"])
    return serialize_user(db.fetch_one("SELECT * FROM users WHERE id = ?", (user_id,)))


@app.delete("/api/users/{user_id}")
def delete_user(request: Request, user_id: str):
    user = require_role(request, {"ADMIN", "ORGANIZADOR"})
    row = db.fetch_one("SELECT * FROM users WHERE id = ?", (user_id,))
    if not row:
        raise HTTPException(404, "Usuário não encontrado.")
    if row["id"] == "admin":
        raise HTTPException(400, "Não é possível excluir o administrador.")
    if user["role"] == "ORGANIZADOR" and (row["role"] != "OPERADOR" or row["organizer_id"] != user["id"]):
        raise HTTPException(403, "Organizador só exclui seus operadores.")
    db.execute("DELETE FROM users WHERE id = ?", (user_id,))
    db.log_audit(user["name"], None, row["name"], "usuario_excluido", None, row["role"])
    return {"ok": True}


# --------------------------------------------------------------------------- #
# Relatórios / auditoria
# --------------------------------------------------------------------------- #
@app.get("/api/reports/athletes")
def report_athletes(event_id: str):
    rows = db.fetch_all(
        "SELECT * FROM athletes WHERE event_id = ? ORDER BY CAST(num AS INTEGER), num", (event_id,))
    return {"athletes": [athlete_out(r) for r in rows]}


@app.get("/api/audit")
def audit_log(limit: int = 500):
    rows = db.fetch_all("SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT ?", (limit,))
    return [dict(r) for r in rows]


@app.post("/api/audit")
def create_audit(request: Request, payload: AuditCreate):
    user = require_role(request, {"ADMIN", "ORGANIZADOR", "OPERADOR"})
    db.execute(
        "INSERT INTO audit_log (id, timestamp, usuario, num_atleta, nome_atleta,"
        " campo_alterado, valor_anterior, valor_novo, dispositivo, synced)"
        " VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Desktop', 0)",
        (db.new_id(), now(), user["name"], payload.entidadeId,
         payload.detalhe or "", payload.acao, None, payload.detalhe or ""),
    )
    return {"ok": True}


# --------------------------------------------------------------------------- #
# Sincronização
# --------------------------------------------------------------------------- #
@app.get("/api/sync/status")
def sync_status():
    return sync.status()


@app.post("/api/sync/push")
def sync_push(request: Request):
    require_role(request, {"ADMIN", "ORGANIZADOR"})
    return sync.push()


@app.post("/api/sync/pull")
def sync_pull(request: Request):
    require_role(request, {"ADMIN", "ORGANIZADOR"})
    return sync.pull()


# --------------------------------------------------------------------------- #
# Configurador: gerar executável / pacote do evento
# --------------------------------------------------------------------------- #
@app.get("/api/events/{event_id}/package-config")
def package_config(event_id: str):
    organizers = []
    for row in db.fetch_all("SELECT * FROM users WHERE role = 'ORGANIZADOR' ORDER BY name"):
        organizers.append(serialize_user(row))
    current = db.get_config(f"pkg_org_{event_id}")
    return {"organizers": organizers, "organizer_id": current or None}


@app.post("/api/events/{event_id}/package-config")
def set_package_config(request: Request, event_id: str, body: dict):
    require_role(request, {"ADMIN", "ORGANIZADOR"})
    organizer_id = body.get("organizer_id")
    db.set_config(f"pkg_org_{event_id}", str(organizer_id or ""))
    return {"ok": True}


@app.post("/api/events/{event_id}/package")
def generate_package(request: Request, event_id: str):
    user = require_role(request, {"ADMIN", "ORGANIZADOR"})
    event = db.fetch_one("SELECT * FROM events WHERE id = ?", (event_id,))
    if not event:
        raise HTTPException(404, "Evento não encontrado.")
    athletes = db.fetch_all("SELECT * FROM athletes WHERE event_id = ? ORDER BY CAST(num AS INTEGER), num",
                            (event_id,))
    if not athletes:
        raise HTTPException(400, "Evento sem atletas — importe a planilha antes.")

    org_id = db.get_config(f"pkg_org_{event_id}")
    organizer = None
    offline_password = ""
    if org_id:
        row = db.fetch_one("SELECT * FROM users WHERE id = ?", (org_id,))
        if row:
            offline_password = f"{random.randint(0, 999999):06d}"
            db.execute("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?",
                       (db.hash_password(offline_password), now(), row["id"]))
            organizer = {"id": row["id"], "name": row["name"], "email": row["email"] or "",
                         "offlinePassword": offline_password}

    event_data = dict(event)
    event_data["organizer"] = user["name"]
    athletes_json = [athlete_out(a) for a in athletes]
    path = package_builder.build_and_write(event_data, athletes_json, organizer, sync.cloud_url())
    db.log_audit(user["name"], None, event["name"], "pacote_gerado", None, os.path.basename(path))
    return {
        "filename": os.path.basename(path),
        "path": path,
        "athletes": len(athletes_json),
        "organizer": organizer,
        "cloud_url": sync.cloud_url(),
    }


# --------------------------------------------------------------------------- #
# Instalar pacote (.rksits)
# --------------------------------------------------------------------------- #
@app.get("/api/packages")
def list_packages():
    items = []
    installed = db.get_config("installed_packages") or ""
    installed_set = set(p.strip() for p in installed.split("|") if p.strip())
    for name in package_builder.list_packages():
        items.append({"filename": name, "installed": name in installed_set})
    return {"packages": items}


@app.post("/api/packages/install")
def install_package(request: Request, payload: InstallRequest):
    require_role(request, {"ADMIN", "ORGANIZADOR"})
    path = os.path.join(config.PACKAGES_DIR, os.path.basename(payload.filename))
    if not os.path.exists(path):
        raise HTTPException(404, "Pacote não encontrado na pasta packages/.")
    pkg = package_builder.read_package(path)

    event = pkg.get("event", {})
    event_id = event.get("id") or db.new_id()
    existing = db.fetch_one("SELECT id FROM events WHERE id = ?", (event_id,))
    if existing:
        db.execute(
            "UPDATE events SET name = ?, date = ?, place = ?, status = ?, updated_at = ? WHERE id = ?",
            (event.get("name", ""), event.get("date", ""), event.get("place", ""),
             event.get("status", "EM_ANDAMENTO"), now(), event_id),
        )
    else:
        db.execute(
            "INSERT INTO events (id, name, date, place, status, created_at, updated_at)"
            " VALUES (?, ?, ?, ?, ?, ?, ?)",
            (event_id, event.get("name", ""), event.get("date", ""), event.get("place", ""),
             event.get("status", "EM_ANDAMENTO"), now(), now()),
        )

    org = pkg.get("organizer")
    if org and org.get("name"):
        email = org.get("email") or ""
        cpf = org.get("cpf", "")
        row = db.fetch_one("SELECT id FROM users WHERE TRIM(email) = ? OR TRIM(name) = ?",
                           (email, org["name"]))
        if row:
            db.execute("UPDATE users SET password_hash = ?, email = ?, updated_at = ? WHERE id = ?",
                       (db.hash_password(org.get("offlinePassword", "123456")), email, now(), row["id"]))
            org_id = row["id"]
        else:
            org_id = db.new_id()
            db.execute(
                "INSERT INTO users (id, name, email, cpf, password_hash, role, created_at, updated_at)"
                " VALUES (?, ?, ?, ?, ?, 'ORGANIZADOR', ?, ?)",
                (org_id, org["name"], email, cpf,
                 db.hash_password(org.get("offlinePassword", "123456")), now(), now()),
            )
        db.set_config(f"pkg_org_{event_id}", org_id)

    result = upsert_athletes(event_id, pkg.get("athletes", []), "Pacote")

    cloud = pkg.get("config", {}).get("cloudUrl")
    if cloud:
        sync.set_cloud_url(cloud)

    installed = set(p.strip() for p in (db.get_config("installed_packages") or "").split("|") if p.strip())
    installed.add(payload.filename)
    db.set_config("installed_packages", "|".join(sorted(installed)))
    db.log_audit("Pacote", None, event.get("name"), "pacote_instalado", None, payload.filename)
    return {"ok": True, "event_id": event_id, "event": event.get("name"),
            "imported": result["imported"], "updated": result["updated"]}


# --------------------------------------------------------------------------- #
# Downloads (instaladores) — mesmo contrato do backend web
# --------------------------------------------------------------------------- #
RELEASE_PLATFORM = re.compile(r"\.(exe)$|win\.zip$|\.msi$", re.I)
LINUX_PLATFORM = re.compile(r"\.(AppImage)$|\.(deb)$|\.(rpm)$", re.I)


def _release_platform(filename: str) -> str:
    if RELEASE_PLATFORM.search(filename):
        return "windows"
    if LINUX_PLATFORM.search(filename):
        return "linux"
    if filename.lower().endswith(".dmg"):
        return "mac"
    return "outro"


def _iter_releases() -> list[dict]:
    """Lista apenas arquivos que existem fisicamente em release/windows|linux."""
    items: list[dict] = []
    base = config.RELEASE_DIR
    for subfolder in ("windows", "linux"):
        folder = os.path.join(base, subfolder)
        if not os.path.isdir(folder):
            continue
        for entry in sorted(os.listdir(folder)):
            full = os.path.join(folder, entry)
            if not os.path.isfile(full):
                continue
            platform = _release_platform(entry)
            # Não confundir pacote de evento (.rksits) com instalador.
            if platform not in ("windows", "linux"):
                continue
            items.append({
                "platform": platform,
                "file": entry,
                "size": os.path.getsize(full),
                "url": f"/api/downloads/{entry}",
            })
    return items


@app.get("/api/downloads")
def list_downloads():
    return _iter_releases()


@app.get("/api/downloads/{filename}")
def download_file(filename: str):
    safe = os.path.basename(filename)
    if safe != filename:
        raise HTTPException(404, "Arquivo inválido.")
    base = config.RELEASE_DIR
    platform = _release_platform(safe)
    subfolder = {"windows": "windows", "linux": "linux"}.get(platform)
    if not subfolder:
        raise HTTPException(404, "Arquivo inválido.")
    full = os.path.join(base, subfolder, safe)
    if not os.path.isfile(full):
        raise HTTPException(404, "Arquivo não encontrado.")
    return FileResponse(
        full,
        media_type="application/octet-stream",
        filename=safe,
        headers={"Content-Disposition": f'attachment; filename="{safe}"'},
    )


# --------------------------------------------------------------------------- #
# Frontend + static
# --------------------------------------------------------------------------- #
@app.get("/")
def index():
    return FileResponse(os.path.join(config.STATIC_DIR, "index.html"))


app.mount("/", StaticFiles(directory=config.STATIC_DIR, html=True), name="static")