"""Transactional installation; local operational records remain authoritative."""
import hashlib
import re

from event_profile import bind_event


def _num(value):
    value = str(value or "").strip().upper()
    return str(int(value)) if value.isdigit() else value


def _cpf(value):
    return re.sub(r"\D", "", str(value or ""))


def _insert(conn, table, data, ignore=False):
    # Table/column names come exclusively from our schema mappings.
    operation = "INSERT OR IGNORE" if ignore else "INSERT"
    columns = ",".join(data)
    placeholders = ",".join("?" for _ in data)
    conn.execute(
        f"{operation} INTO {table} ({columns}) VALUES ({placeholders})",
        list(data.values()),
    )


def _install_users(conn, users, stamp):
    for user in sorted(users, key=lambda item: item["role"] == "OPERATOR"):
        role = "OPERADOR" if user["role"] == "OPERATOR" else user["role"]
        if role not in ("ORGANIZADOR", "OPERADOR"):
            raise ValueError("Perfil de usuário inválido na distribuição.")
        if conn.execute("SELECT id FROM users WHERE id=?", (user["id"],)).fetchone():
            continue
        _insert(conn, "users", {
            "id": user["id"], "name": user["name"],
            "email": user.get("email") or "", "cpf": user.get("cpf"),
            "cnpj": user.get("cnpj"), "phone": user.get("phone") or "",
            "password_hash": user["passwordHash"], "role": role,
            "organizer_id": user.get("organizerId"),
            "created_at": stamp, "updated_at": stamp,
        })
        if user.get("accessCode"):
            conn.execute(
                "INSERT INTO app_config (key,value) VALUES (?,?)",
                (f"org_code_{user['id']}", hashlib.sha256(user["accessCode"].encode()).hexdigest()),
            )


def _index_identity(record, numbers, cpfs):
    if _num(record["num"]):
        numbers.setdefault(_num(record["num"]), set()).add(record["id"])
    if _cpf(record["cpf_atleta"]):
        cpfs.setdefault(_cpf(record["cpf_atleta"]), set()).add(record["id"])


def _existing_identity(data, records, numbers, cpfs):
    if data["id"] in records:
        return data["id"]
    matches = numbers.get(_num(data["num"]), set()) | cpfs.get(_cpf(data["cpf_atleta"]), set())
    if len(matches) > 1:
        raise ValueError("Identificação ambígua de atleta no banco operacional. Nenhum dado foi substituído.")
    identity = next(iter(matches), None)
    if identity:
        stored = records[identity]
        for key, normalize in (("num", _num), ("cpf_atleta", _cpf)):
            before, after = normalize(stored[key]), normalize(data[key])
            if before and after and before != after:
                raise ValueError("NUM ou CPF pertence a outro cadastro no banco operacional. Nenhum dado foi substituído.")
    return identity


def _install_athletes(conn, event_id, athletes, stamp):
    import package_builder

    source_ids = [athlete["id"] for athlete in athletes]
    if len(source_ids) != len(set(source_ids)):
        raise ValueError("Identificadores de atletas duplicados na distribuição.")
    rows = conn.execute(
        "SELECT id,num,cpf_atleta FROM athletes WHERE event_id=?", (event_id,),
    ).fetchall()
    records = {row["id"]: row for row in rows}
    numbers, cpfs = {}, {}
    for row in rows:
        _index_identity(row, numbers, cpfs)
    verified = set()
    for athlete in athletes:
        raw = dict(athlete)
        if raw.get("eventId", event_id) != event_id:
            raise ValueError("Atleta de outro evento na distribuição.")
        raw["modalidade"] = raw.get("distancia") or ""
        if raw.get("nascimento"):
            value = raw["nascimento"][:10]
            raw["nascto"] = f"{value[8:10]}/{value[5:7]}/{value[:4]}"
        data = package_builder.json_to_db_athlete(raw)
        data.update(event_id=event_id, created_at=stamp, updated_at=stamp)
        data["status"] = raw.get("statusEntrega") or "PENDENTE"
        identity = _existing_identity(data, records, numbers, cpfs)
        # Updates add registrations, never replace local deliveries or edits.
        if not identity:
            _insert(conn, "athletes", data)
            identity = data["id"]
            records[identity] = data
            _index_identity(data, numbers, cpfs)
        if identity in verified:
            raise ValueError("Atletas duplicados por NUM ou CPF na distribuição.")
        verified.add(identity)
        if not conn.execute(
            "SELECT id FROM athletes WHERE id=? AND event_id=?", (identity, event_id),
        ).fetchone():
            raise ValueError("Falha na conferência dos atletas da distribuição.")


def install_snapshot(db, payload, digest):
    event_id = payload["event"]["id"] if payload and payload["mode"] == "event" else None
    conn = db.get_conn()
    try:
        conn.execute("BEGIN IMMEDIATE")
        bind_event(conn, event_id)
        marker = conn.execute("SELECT value FROM app_config WHERE key='embedded_snapshot'").fetchone()
        if event_id is None or (marker and marker[0] == digest):
            conn.commit()
            return
        event, stamp = payload["event"], db.now()
        _insert(conn, "events", {
            "id": event_id, "name": event["name"], "date": event.get("date", ""),
            "place": event.get("place") or "", "status": event.get("status", "RASCUNHO"),
            "created_at": stamp, "updated_at": stamp,
        }, ignore=True)
        _install_users(conn, payload.get("users", []), stamp)
        _install_athletes(conn, event_id, payload.get("athletes", []), stamp)
        org_key = "event_orgs_" + event_id
        previous = conn.execute("SELECT value FROM app_config WHERE key=?", (org_key,)).fetchone()
        organizers = set(filter(None, previous[0].split("|"))) if previous else set()
        organizers.update(payload.get("organizerIds", []))
        metadata = (
            (org_key, "|".join(sorted(organizers))),
            ("active_event", event_id), ("embedded_snapshot", digest),
        )
        for key, value in metadata:
            conn.execute("INSERT OR REPLACE INTO app_config (key,value) VALUES (?,?)", (key, value))
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
