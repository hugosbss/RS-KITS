import ast
import gc
from contextlib import closing
import hashlib
import json
import os
import shutil
import struct
import tempfile
import unittest
from pathlib import Path

import uuid
from types import SimpleNamespace
PROFILE = SimpleNamespace(name=str(Path(__file__).parent / (".test-embedded-" + uuid.uuid4().hex)))
os.makedirs(PROFILE.name)
import atexit
atexit.register(shutil.rmtree, PROFILE.name)
os.environ["RSKITS_HOME"] = PROFILE.name
import embedded_data
import database as db
import package_builder
from fastapi import HTTPException

class EmbeddedDataTests(unittest.TestCase):
    def setUp(self):
        if Path(db.DB_PATH).exists(): Path(db.DB_PATH).unlink()
        db.init_db()
        embedded_data._payload = None
        embedded_data._digest = None

    def test_login_identifiers_and_ambiguity(self):
        from authentication import authenticate
        with closing(db.get_conn()) as conn, conn:
            conn.execute("INSERT INTO users (id,name,email,cpf,cnpj,password_hash,role) VALUES (?,?,?,?,?,?,?)", ("org", "Organizer", "Org@Example.com", "12345678901", "12345678000199", db.hash_password("secret"), "ORGANIZADOR"))
        db.set_access_code("org", "race-code")
        for identifier in ("org@example.com", " ORG@EXAMPLE.COM ", "123.456.789-01", "12345678901", "12.345.678/0001-99", "race-code"):
            self.assertEqual(authenticate(identifier, "secret")["id"], "org")
        self.assertIsNone(authenticate("12345678901", "wrong"))
        with closing(db.get_conn()) as conn, conn:
            conn.execute("INSERT INTO users (id,name,cpf,password_hash,role) VALUES (?,?,?,?,?)", ("op", "Operator", "123.456.789-01", db.hash_password("secret"), "OPERADOR"))
        self.assertIsNone(authenticate("12345678901", "secret"))
        self.assertEqual(authenticate("admin", "admin123")["id"], "admin")

    def test_archive_overlay_and_corruption(self):
        from PyInstaller.archive.readers import CArchiveReader
        base = Path(__file__).parent / "release/windows/RS-KITS-1.0.0.exe"
        if not base.exists(): self.skipTest("No existing executable")
        data = json.dumps({"format":"RSKITS_EMBEDDED","version":1,"mode":"clean"}).encode()
        path = Path(PROFILE.name) / "distribution.exe"
        shutil.copyfile(base, path)
        with path.open("ab") as target:
            target.write(data + hashlib.sha256(data).digest() + struct.pack("<Q",len(data)) + embedded_data.MAGIC)
        self.assertEqual(embedded_data.read_embedded(path)[0]["mode"], "clean")
        self.assertEqual(set(CArchiveReader(str(base)).toc), set(CArchiveReader(str(path)).toc))
        with path.open("r+b") as target:
            target.seek(-(embedded_data.FOOTER_SIZE + len(data)), 2)
            target.write(b"!")
        with self.assertRaises(ValueError): embedded_data.read_embedded(path)

    def test_install_and_reopen_preserve_deliveries(self):
        import bcrypt
        hashed = bcrypt.hashpw(b"operator123",bcrypt.gensalt()).decode()
        embedded_data._payload = {"mode":"event","event":{"id":"event1","name":"Race"},"organizerIds":["org"],"users":[{"id":"org","name":"Organizer","email":"org@example.com","role":"ORGANIZADOR","passwordHash":hashed},{"id":"op","name":"Operator","role":"OPERATOR","organizerId":"org","passwordHash":hashed}],"athletes":[{"id":"athlete1","num":"1","nomeAtleta":"Athlete","cpfAtleta":"12345678901","distancia":"5 KM","statusEntrega":"PENDENTE","convenioMedico":"Plan","itensAdicionais":"Cap"}]}
        embedded_data._digest = "snapshot"
        embedded_data.install(db)
        with closing(db.get_conn()) as conn, conn:
            row = conn.execute("SELECT * FROM athletes").fetchone()
            self.assertEqual(row["distancia"],"5 KM")
            self.assertEqual(row["convenio_medico"],"Plan")
            self.assertEqual(row["itens_adicionais"],"Cap")
            conn.execute("UPDATE athletes SET status='ENTREGUE'")
            self.assertEqual(conn.execute("SELECT role FROM users WHERE id='op'").fetchone()[0],"OPERADOR")
        self.assertTrue(db.verify_password("operator123",hashed))
        self.assertFalse(db.verify_password("wrong",hashed))
        embedded_data.install(db)
        with closing(db.get_conn()) as conn, conn: self.assertEqual(conn.execute("SELECT status FROM athletes").fetchone()[0],"ENTREGUE")

    def test_import_duplicates_rollback_and_identity(self):
        tree = ast.parse((Path(__file__).parent / "server.py").read_text(encoding="utf-8"))
        functions = [node for node in tree.body if isinstance(node,ast.FunctionDef) and node.name in ("normalize_frontend_row","upsert_athletes")]
        namespace = {"db":db,"package_builder":package_builder,"now":db.now,"HTTPException":HTTPException}
        exec(compile(ast.Module(body=functions,type_ignores=[]),"server.py","exec"),namespace)
        upsert = namespace["upsert_athletes"]
        with closing(db.get_conn()) as conn, conn: conn.execute("INSERT INTO events (id,name) VALUES ('e','Race')")
        row = {"id":"a","num":"001","nomeAtleta":"Athlete","cpfAtleta":"12345678901"}
        with self.assertRaises(HTTPException): upsert("e",[row,{**row,"num":"1"}])
        with closing(db.get_conn()) as conn, conn: self.assertEqual(conn.execute("SELECT count(*) FROM athletes").fetchone()[0],0)
        upsert("e",[row])
        upsert("e",[{**row,"id":"new-id","num":"1","nomeAtleta":"Updated"}])
        with closing(db.get_conn()) as conn, conn:
            result = conn.execute("SELECT * FROM athletes").fetchall()
            self.assertEqual(len(result),1)
            self.assertEqual(result[0]["id"],"a")
            self.assertEqual(result[0]["nome_atleta"],"Updated")

if __name__ == "__main__": unittest.main()

