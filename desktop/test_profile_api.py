"""Exercise HTTP boundaries with isolated SQLite and static directories."""
import importlib
from pathlib import Path
import shutil
import unittest
import uuid
from unittest.mock import patch

from fastapi.testclient import TestClient


class EventApiTests(unittest.TestCase):
    def setUp(self):
        import database as db, config, embedded_data, runtime
        self.db = db
        self.root = Path(__file__).resolve().parent / ('.test-api-' + uuid.uuid4().hex)
        self.root.mkdir()
        (self.root / 'index.html').write_text('RS KITS', encoding='utf-8')
        payload = {'mode':'event','event':{'id':'A','name':'Evento A'},'users':[],'organizerIds':[], 'athletes':[{'id':'a','num':'1','nomeAtleta':'Ana','cpfAtleta':'123'}]}
        self.patches = [patch.object(db,'DB_PATH',str(self.root/'rskits.sqlite')), patch.object(db,'ensure_dirs',lambda:None), patch.object(config,'ensure_dirs',lambda:None), patch.object(config,'STATIC_DIR',str(self.root)), patch.object(config,'PACKAGES_DIR',str(self.root)), patch.object(embedded_data,'_payload',payload),patch.object(embedded_data,'_digest','api')]
        for item in self.patches: item.start()
        identity_patch = patch.object(runtime, 'ENFORCE_IDENTITY', True)
        identity_patch.start()
        self.patches.append(identity_patch)
        db.init_db();embedded_data.install(db)
        self.server = importlib.import_module('server')
        self.client = TestClient(self.server.app)
        self.client.headers.update({'X-RSKITS-Instance': runtime.INSTANCE_ID})

    def test_old_window_cannot_use_new_instance(self):
        self.client.headers.pop('X-RSKITS-Instance')
        self.assertEqual(self.client.get('/api/events/A/athletes').status_code, 403)
        response = self.client.patch('/api/events/A/athletes/a', json={'statusEntrega':'ENTREGUE'}, headers={'Authorization':'Bearer admin', 'X-RSKITS-Instance':'another-instance'})
        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.db.fetch_one("SELECT status FROM athletes WHERE id='a'")[0], 'PENDENTE')

    def seed_users(self):
        for identity, role, owner in [('org', 'ORGANIZADOR', None), ('op', 'OPERADOR', 'org'), ('foreign', 'ORGANIZADOR', None), ('other-op', 'OPERADOR', 'foreign')]:
            self.db.execute("INSERT INTO users (id,name,email,password_hash,role,organizer_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)", (identity,identity,identity+'@test.local','unused',role,owner,self.db.now(),self.db.now()))
        self.db.set_config('event_orgs_A','org')

    def test_organizer_users_are_scoped_and_downloads_denied(self):
        self.seed_users()
        headers = {'Authorization':'Bearer org'}
        response = self.client.get('/api/users?eventId=A', headers=headers)
        self.assertEqual(response.status_code,200)
        self.assertEqual({row['id'] for row in response.json()},{'org','op'})
        self.assertEqual(self.client.get('/api/downloads', headers=headers).status_code,403)
        self.assertEqual(self.client.get('/api/downloads/anything.exe', headers=headers).status_code,403)
        self.assertEqual(self.client.get('/api/users?eventId=A', headers={'Authorization':'Bearer foreign'}).status_code,403)
        self.assertEqual(self.client.get('/api/users').status_code,401)

    def test_admin_event_users_exclude_other_events(self):
        self.seed_users()
        response = self.client.get('/api/users?eventId=A', headers={'Authorization':'Bearer admin'})
        self.assertEqual({row['id'] for row in response.json()},{'org','op'})
        self.assertEqual(self.client.get('/api/downloads', headers={'Authorization':'Bearer admin'}).status_code,200)

    def tearDown(self):
        self.client.close()
        for item in reversed(self.patches): item.stop()
        assert self.root.parent == Path(__file__).resolve().parent
        shutil.rmtree(self.root)

    def test_health_exposes_owned_instance_and_bound_event(self):
        import runtime
        self.assertEqual(self.client.get('/api/health').json()['instanceId'],runtime.INSTANCE_ID)
        self.assertEqual(self.client.get('/api/health').json()['eventId'],'A')

    def test_foreign_event_queries_mutations_creation_and_deletion_are_blocked(self):
        for method,path in [('GET','/api/events/B/athletes'),('PATCH','/api/events/B/athletes/a'),('POST','/api/events'),('DELETE','/api/events/A')]:
            response = self.client.request(method,path,json={},headers={'Authorization':'Bearer admin'})
            self.assertEqual(response.status_code,403,(method,path,response.text))
        self.assertEqual([r['id'] for r in self.db.fetch_all('SELECT id FROM events')],['A'])

    def test_foreign_package_is_rejected_without_activation(self):
        import package_builder
        package = package_builder.make_package({'id':'B','name':'Evento B'},[])
        (self.root/'foreign.rksits').write_bytes(package_builder.serialize_package(package))
        response = self.client.post('/api/packages/install',json={'filename':'foreign.rksits'},headers={'Authorization':'Bearer admin'})
        self.assertEqual(response.status_code,403,response.text)
        self.assertEqual(self.db.get_config('active_event'),'A')

    def test_bound_event_delivery_still_persists(self):
        response = self.client.patch('/api/events/A/athletes/a',json={'statusEntrega':'ENTREGUE','nomeEntrega':'Ana'},headers={'Authorization':'Bearer admin'})
        self.assertEqual(response.status_code,200,response.text)
        self.assertEqual(self.db.fetch_one("SELECT status FROM athletes WHERE id='a'")[0],'ENTREGUE')
        self.assertEqual(self.client.get('/api/events/A/athletes').json()['total'],1)


if __name__ == '__main__': unittest.main()
