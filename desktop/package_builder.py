"""Geração e leitura do "pacote de evento" (.rksits).

O pacote é um JSON único com os dados de um evento (evento + organizador +
atletas + configuração) que o executável importa para funcionar offline.
É o mesmo formato gerado pela tela Settings do sistema web.
"""

import json
import os
import uuid
from datetime import datetime

import config
import database

FORMAT = "RSKITS_PACKAGE"
VERSION = 1

# campos camelCase (ImportedRow do frontend web) -> snake_case (SQLite local)
DB_FIELD = {
    "id": "id",
    "num": "num",
    "nomeAtleta": "nome_atleta",
    "kit": "kit",
    "modalidade": "distancia",
    "fxEtaria": "fx_etaria",
    "categEspecial": "categ_especial",
    "nascto": "nascto",
    "sexo": "sexo",
    "equipe": "equipe",
    "cidadeUf": "cidade_uf",
    "camiseta": "camiseta",
    "cpfAtleta": "cpf_atleta",
    "cel": "cel",
    "email": "email",
    "quemVaiRetirar": "quem_vai_retirar",
    "notas": "notas",
    "obs1": "obs1",
    "obs2": "obs2",
    "alerta": "alerta",
    "nomeEvento": "nome_evento",
    "pin": "pin",
    "contato": "contato_emergencia",
    "grauParentesco": "relacao_atleta",
    "celularContato": "telefone_emergencia",
    "itensAdicionais": None,
    "statusEntrega": "status",
    "dataEntrega": "data_entrega",
    "usuarioEntrega": "usuario_entrega",
    "obsEntrega": "obs_entrega",
    "dataEstorno": "data_estorno",
    "usuarioEstorno": "usuario_estorno",
    "nomeEntrega": "nome_entrega",
    "cpfEntrega": "cpf_entrega",
    "foneEntrega": "fone_entrega",
    "emailEntrega": "email_entrega",
    "terceiro": "terceiro",
}

DB_ATHLETE_KEYS = [k for k in DB_FIELD.values() if k]


def new_id() -> str:
    return uuid.uuid4().hex[:16]


def json_to_db_athlete(row: dict) -> dict:
    """Converte um atleta em formato ImportedRow (camelCase) para dict de banco."""
    out = {}
    for camel, snake in DB_FIELD.items():
        if snake is None:
            continue
        value = row.get(camel)
        if camel == "terceiro":
            value = 1 if value else 0
        out[snake] = value if value is not None else ""
    if row.get("obsEntrega"):
        out["notas"] = (out.get("notas") or "") + (f" | Obs entrega: {row['obsEntrega']}" if out.get("notas") else row["obsEntrega"])
    out["id"] = row.get("id") or new_id()
    return {k: v for k, v in out.items() if k in database.ATHLETE_COLUMNS}


def athlete_to_json(row) -> dict:
    """Converte um atleta do banco (sqlite3.Row) para ImportedRow (camelCase)."""
    inverse = {v: k for k, v in DB_FIELD.items() if v}
    out = {}
    for key in row.keys():
        camel = inverse.get(key, key)
        out[camel] = row[key]
    out["modalidade"] = row["distancia"]
    out["terceiro"] = bool(row["terceiro"] or 0)
    return out


def make_package(event: dict, athletes: list, organizer: dict | None = None,
                 cloud_url: str | None = None, created_by: str = "RS KITS") -> dict:
    """Constrói o dict do pacote .rksits."""
    return {
        "format": FORMAT,
        "version": VERSION,
        "createdBy": created_by,
        "createdAt": datetime.now().isoformat(),
        "event": {
            "id": event.get("id"),
            "name": event.get("name"),
            "date": event.get("date") or "",
            "place": event.get("place") or "",
            "status": event.get("status") or "EM_ANDAMENTO",
        },
        "organizer": organizer
        or ({"id": "", "name": "", "email": "", "offlinePassword": ""} if organizer is None else None),
        "config": {
            "cloudUrl": cloud_url or config.CLOUD_URL,
            "eventOwner": event.get("organizer") or "",
        },
        "athletes": athletes,  # lista em formato ImportedRow (camelCase)
    }


def serialize_package(pkg: dict) -> bytes:
    return json.dumps(pkg, ensure_ascii=False, indent=2).encode("utf-8")


def packages_dir() -> str:
    config.ensure_dirs()
    return config.PACKAGES_DIR


def build_and_write(event: dict, athletes: list, organizer: dict | None = None,
                    cloud_url: str | None = None) -> str:
    """Gera o arquivo .rksits na pasta packages/ e devolve o caminho."""
    pkg = make_package(event, athletes, organizer, cloud_url)
    filename = sanitize_filename(f"{event.get('name') or 'evento'}.rksits")
    path = os.path.join(packages_dir(), filename)
    with open(path, "wb") as fh:
        fh.write(serialize_package(pkg))
    return path


def sanitize_filename(name: str) -> str:
    safe = "".join(c if c.isalnum() or c in "._- " else "_" for c in name).strip()
    return safe or "evento.rksits"


def read_package(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as fh:
        return json.load(fh)


def list_packages() -> list[str]:
    config.ensure_dirs()
    files = sorted(os.listdir(config.PACKAGES_DIR))
    return [f for f in files if f.lower().endswith((".rksits", ".json"))]


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Gera um pacote .rksits de evento")
    parser.add_argument("--event", required=True, help="JSON com o dump do evento (event/athletes/organizer)")
    parser.add_argument("--out", default=None, help="Caminho opcional de saída do .rksits")
    parser.add_argument("--cloud-url", default=None, help="URL de sincronização embutida no pacote")
    args = parser.parse_args()

    with open(args.event, "r", encoding="utf-8") as fh:
        dump = json.load(fh)

    event = dump.get("event", dump)
    athletes = dump.get("athletes", [])
    organizer = dump.get("organizer")

    if args.out:
        pkg = make_package(event, athletes, organizer, args.cloud_url)
        with open(args.out, "wb") as fh:
            fh.write(serialize_package(pkg))
        print(f"Pacote gerado: {args.out} ({len(athletes)} atletas)")
    else:
        path = build_and_write(event, athletes, organizer, args.cloud_url)
        print(f"Pacote gerado: {path} ({len(athletes)} atletas)")