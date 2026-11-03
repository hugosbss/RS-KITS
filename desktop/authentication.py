"""Resolve desktop credentials with the same identifier formats as the web."""
import hashlib
import re

import database as db


def canonical_identifier(value):
    text = str(value or "").strip()
    if "@" in text:
        return text.lower()
    if re.fullmatch(r"[\d.\-/\s]+", text):
        return re.sub(r"\D", "", text)
    return text.upper()


def authenticate(identifier, password):
    canonical = canonical_identifier(identifier)
    matches = {}
    if not canonical:
        return None
    conn = db.get_conn()
    try:
        codes = dict(conn.execute("SELECT key,value FROM app_config WHERE key LIKE 'org_code_%'"))
        code_variants = {str(identifier).strip(), str(identifier).strip().upper(), canonical}
        hashes = {hashlib.sha256(value.encode('utf-8')).hexdigest() for value in code_variants}
        for user in conn.execute("SELECT * FROM users"):
            identifiers = [user['email'], user['cpf'], user['cnpj']]
            found = any(value and canonical_identifier(value) == canonical for value in identifiers)
            if canonical == 'ADMIN' and user['id'] == 'admin' and user['role'] == 'ADMIN':
                found = True
            code = codes.get(f"org_code_{user['id']}")
            if user['role'] == 'ORGANIZADOR' and code:
                found |= code.lower() in hashes if re.fullmatch(r'[a-fA-F0-9]{64}', code) else canonical_identifier(code) == canonical
            if found:
                matches[user['id']] = user
        # Never select an arbitrary account when identifiers overlap.
        if len(matches) != 1:
            return None
        user = next(iter(matches.values()))
        return user if db.verify_password(password, user['password_hash']) else None
    finally:
        conn.close()
