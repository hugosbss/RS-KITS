"""Regression tests use disposable databases, never the Windows user profile."""
import io
import json
from pathlib import Path
import shutil
import unittest
import uuid
from unittest.mock import patch

import event_profile
import runtime
from snapshot_store import install_snapshot


class ProfilePolicyTests(unittest.TestCase):
    def setUp(self):
        self.root = Path(__file__).resolve().parent / ('.test-isolation-' + uuid.uuid4().hex)
        self.root.mkdir()

    def tearDown(self):
        assert self.root.parent == Path(__file__).resolve().parent
        shutil.rmtree(self.root)

    def test_stable_identity_and_distinct_events(self):
        a = event_profile.select_profile(self.root, 'A')
        self.assertEqual(a, event_profile.select_profile(self.root, 'A'))
        self.assertNotEqual(a, event_profile.select_profile(self.root, 'B'))

    def test_reuses_single_legacy_database_but_refuses_ambiguous_selection(self):
        stable = event_profile.select_profile(self.root, 'A')
        legacy = stable.with_name(stable.name + '-old')
        (legacy / 'database').mkdir(parents=True)
        (legacy / 'database/rskits.sqlite').touch()
        self.assertEqual(event_profile.select_profile(self.root, 'A'), legacy)
        other = stable.with_name(stable.name + '-other')
        (other / 'database').mkdir(parents=True)
        (other / 'database/rskits.sqlite').touch()
        with self.assertRaisesRegex(ValueError, 'vários bancos'):
            event_profile.select_profile(self.root, 'A')

    def test_listener_never_reuses_another_instance(self):
        first = runtime.reserve_listener(0)
        try:
            port = first.getsockname()[1]
            second = runtime.reserve_listener(port)
            try:
                self.assertNotEqual(port, second.getsockname()[1])
                with self.assertRaises(RuntimeError): runtime.reserve_listener(port, strict=True)
            finally: second.close()
        finally: first.close()

    def test_same_database_has_only_one_owner_and_lock_releases(self):
        lease = runtime.ProfileLease(self.root)
        try:
            with self.assertRaises(RuntimeError): runtime.ProfileLease(self.root)
        finally: lease.close()
        runtime.ProfileLease(self.root).close()

    def test_health_requires_instance_and_event_identity(self):
        def response(instance=runtime.INSTANCE_ID, event='A'):
            return io.StringIO(json.dumps({'service':'rskits-desktop','instanceId':instance,'eventId':event}))
        self.assertTrue(runtime.health_matches(response(), 'A'))
        self.assertFalse(runtime.health_matches(response('foreign'), 'A'))
        self.assertFalse(runtime.health_matches(response(event='B'), 'A'))
        self.assertFalse(runtime.health_matches(io.StringIO('not JSON'), 'A'))


class SnapshotIsolationTests(unittest.TestCase):
    def setUp(self):
        ProfilePolicyTests.setUp(self)
        import database
        self.db = database
        self.path = self.root / 'rskits.sqlite'
        self.patches = [patch.object(database, 'DB_PATH', str(self.path)), patch.object(database, 'ensure_dirs', lambda: None)]
        for p in self.patches: p.start()
        database.init_db()

    def tearDown(self):
        for p in reversed(self.patches): p.stop()
        ProfilePolicyTests.tearDown(self)

    def snapshot(self, event='A', athletes=None):
        return {'mode':'event','event':{'id':event,'name':'Evento '+event},'organizerIds':[],'users':[], 'athletes': athletes if athletes is not None else [{'id':'a','num':'1','nomeAtleta':'Ana','cpfAtleta':'123','statusEntrega':'PENDENTE','eventId':event}]}

    def test_redownload_preserves_deliveries_edits_and_local_additions(self):
        install_snapshot(self.db, self.snapshot(), 'first')
        self.db.execute("UPDATE athletes SET status='ENTREGUE',nome_atleta='Nome Local',nome_entrega='Responsável',data_entrega='hoje' WHERE id='a'")
        install_snapshot(self.db, self.snapshot(athletes=[{'id':'a','num':'1','nomeAtleta':'Ana','cpfAtleta':'123'},{'id':'b','num':'2','nomeAtleta':'Bruno','cpfAtleta':'456'}]), 'second')
        install_snapshot(self.db, self.snapshot(), 'third')
        row = self.db.fetch_one("SELECT * FROM athletes WHERE id='a'")
        self.assertEqual((row['status'], row['nome_atleta'], row['nome_entrega'], row['data_entrega']), ('ENTREGUE','Nome Local','Responsável','hoje'))
        self.assertEqual(len(self.db.fetch_all('SELECT id FROM athletes')), 2)

    def test_existing_identity_with_new_server_id_is_not_duplicated(self):
        install_snapshot(self.db, self.snapshot(), 'first')
        updated = self.snapshot(athletes=[{'id':'new-id','num':'001','nomeAtleta':'Nome remoto','cpfAtleta':'123'}])
        install_snapshot(self.db, updated, 'second')
        self.assertEqual([r['id'] for r in self.db.fetch_all('SELECT id FROM athletes')], ['a'])

    def test_new_snapshot_preserves_local_credentials_and_organizer_links(self):
        payload = self.snapshot()
        payload['users'] = [{'id':'org','name':'Organizador','role':'ORGANIZADOR','passwordHash':self.db.hash_password('initial'),'accessCode':'initial-code'}]
        payload['organizerIds'] = ['org']
        install_snapshot(self.db, payload, 'first')
        self.db.execute("UPDATE users SET password_hash=? WHERE id='org'", (self.db.hash_password('local-secret'),))
        self.db.set_config('event_orgs_A','org|local-org')
        self.db.set_access_code('org','local-code')
        stored_code = self.db.get_config('org_code_org')
        install_snapshot(self.db, payload, 'second')
        self.assertTrue(self.db.verify_password('local-secret',self.db.fetch_one("SELECT password_hash FROM users WHERE id='org'")[0]))
        self.assertEqual(self.db.get_config('event_orgs_A'),'local-org|org')
        self.assertEqual(self.db.get_config('org_code_org'),stored_code)

    def test_foreign_database_rejected_without_changes(self):
        install_snapshot(self.db, self.snapshot(), 'first')
        before = self.path.read_bytes()
        with self.assertRaises(ValueError): install_snapshot(self.db, self.snapshot('B'), 'other')
        self.assertEqual(self.db.get_config('active_event'), 'A')
        self.assertEqual(self.db.get_config('embedded_snapshot'), 'first')
        self.assertEqual(before, self.path.read_bytes())
        with self.assertRaises(ValueError): event_profile.validate_database(self.path, 'B')
        with self.assertRaises(ValueError): event_profile.validate_database(self.path, None)

    def test_foreign_athlete_rolls_back_the_whole_snapshot(self):
        bad = self.snapshot(athletes=[{'id':'x','num':'1','nomeAtleta':'Ana','eventId':'B'}])
        with self.assertRaises(ValueError): install_snapshot(self.db, bad, 'bad')
        self.assertEqual(self.db.fetch_all('SELECT id FROM events'), [])
        self.assertEqual(self.db.fetch_all('SELECT id FROM athletes'), [])
        self.assertIsNone(self.db.get_config(event_profile.BOUND_EVENT_KEY))

    def test_foreign_packages_are_rejected(self):
        with self.assertRaises(ValueError): event_profile.assert_event('A', 'B')
        event_profile.assert_event('A', 'A')

    def test_duplicate_snapshot_rolls_back(self):
        row = {'id':'x','num':'1','nomeAtleta':'Ana','cpfAtleta':'123'}
        for duplicate in (dict(row), {**row,'id':'y'}):
            with self.assertRaises(ValueError): install_snapshot(self.db, self.snapshot(athletes=[row,duplicate]), 'bad')
            self.assertEqual(self.db.fetch_all('SELECT id FROM athletes'), [])

    def test_sync_does_not_acknowledge_or_overwrite_local_changes(self):
        import embedded_data, sync
        with patch.object(embedded_data, '_payload', self.snapshot()), patch.object(sync, '_http_json') as http:
            self.assertEqual(sync.push()['status'], 'unsupported')
            self.assertEqual(sync.pull()['status'], 'unsupported')
            http.assert_not_called()


if __name__ == '__main__': unittest.main()
