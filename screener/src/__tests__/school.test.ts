// A school typed on the phone (offline) syncs before the records that use it; picking a server school later moves
// this phone's unsent records onto it.
import { randomUUID as mockRandomUUID } from 'crypto'; // first: jest.mock below is hoisted above the imports
import * as fs from 'fs';
import * as path from 'path';

import { memDb } from '../db/memDb';
import { get, kvGet, list, put, verifyAuditLog } from '../db/store';
import { syncNow } from '../db/sync';
import { DEMO_SCHOOL, pickSchool, typeSchool } from '../school';

jest.mock('expo-crypto', () => ({ randomUUID: () => mockRandomUUID() }));
jest.mock('@/db', () => ({ db: jest.requireActual('../db/memDb').memDb() })); // i18n loads it; these tests use their own

// Server stand-in: accepts every record, remembers the push order, has no cases to pull.
function fakeServer() {
  const pushed: { type: string; id: string; data: Record<string, unknown> }[] = [];
  const fetchFn = (async (url: string, init?: { body?: string }) => {
    if (url.endsWith('/api/sync/')) {
      const { records } = JSON.parse(init!.body!);
      pushed.push(...records);
      return { ok: true, json: async () => ({ results: records.map((r: object) => ({ ...r, status: 'created' })) }) };
    }
    return { ok: true, json: async () => [] };
  }) as unknown as typeof fetch;
  return { pushed, fetchFn };
}

test('the demo name is the one seed_demo makes on the server', () => {
  const seed = fs.readFileSync(path.join(__dirname, '../../../server/referrals/management/commands/seed_demo.py'), 'utf8');
  expect(seed).toContain(`SCHOOL_NAME = "${DEMO_SCHOOL}"`);
});

test('a typed school works offline and is pushed before the records that use it', async () => {
  const db = memDb();
  typeSchool(db, 'Demo School X');
  const id = kvGet(db, 'school_id')!;
  expect([kvGet(db, 'school_name'), kvGet(db, 'school_local')]).toEqual(['Demo School X', '1']);
  put(db, 'child', 'c1', { school: id, display_name: 'Student A1', age_band: '9-11' });
  typeSchool(db, 'Demo School Y'); // renamed: same record, not a second school
  expect(kvGet(db, 'school_id')).toBe(id);
  expect(list(db, 'school')).toEqual([{ id, name: 'Demo School Y' }]);

  const srv = fakeServer();
  await syncNow(db, { baseUrl: 'http://x', token: 't', school: id }, srv.fetchFn);
  expect(srv.pushed.map((r) => [r.type, r.data.name ?? r.data.school])).toEqual([
    ['school', 'Demo School X'], ['child', id], ['school', 'Demo School Y']]);
});

test('picking a server school takes over the unsent records of the typed one', () => {
  const db = memDb();
  typeSchool(db, DEMO_SCHOOL);
  const local = kvGet(db, 'school_id')!;
  put(db, 'child', 'c1', { school: local, display_name: 'Student A1', age_band: '9-11' });
  put(db, 'case', 'k1', { child: 'c1', school: local, status: 'referred' });
  put(db, 'case_event', 'e1', { case: 'k1', from_status: 'screened', to_status: 'referred' });
  put(db, 'classroom', 'r1', { school: local, name: '5A', strength: 30, created_at: '2026-10-22T00:00:00Z' });
  put(db, 'child', 'other', { school: 'elsewhere', display_name: 'Student Z1', age_band: '9-11' });

  pickSchool(db, { id: 'srv-1', name: DEMO_SCHOOL, mandal: 'SAMPLE-MANDAL-1' });
  expect([kvGet(db, 'school_id'), kvGet(db, 'school_mandal'), kvGet(db, 'school_local')]).toEqual(['srv-1', 'SAMPLE-MANDAL-1', '']);
  expect([get(db, 'child', 'c1').school, get(db, 'case', 'k1').school, get(db, 'classroom', 'r1').school]).toEqual(['srv-1', 'srv-1', 'srv-1']);
  expect(get(db, 'child', 'other').school).toBe('elsewhere');
  expect(list(db, 'school')).toEqual([]); // the typed school is gone, and so is its outbox row
  const box = db.all<{ type: string; data: string }>("SELECT type, data FROM outbox ORDER BY seq");
  expect(box.map((r) => [r.type, JSON.parse(r.data).school ?? null])).toEqual([
    ['child', 'srv-1'], ['case', 'srv-1'], ['case_event', null], ['child', 'elsewhere']]); // order kept
  expect(verifyAuditLog(db).ok).toBe(true); // the moved case got a new audit entry; the chain still holds
});

test('a typed school that already reached the server keeps its records', async () => {
  const db = memDb();
  typeSchool(db, 'Demo School X');
  const local = kvGet(db, 'school_id')!;
  put(db, 'child', 'c1', { school: local, display_name: 'Student A1', age_band: '9-11' });
  await syncNow(db, { baseUrl: 'http://x', token: 't', school: local }, fakeServer().fetchFn);
  pickSchool(db, { id: 'srv-1', name: 'Another School', mandal: '' });
  expect(get(db, 'child', 'c1').school).toBe(local);
  expect(list(db, 'school').map((s) => s.id)).toEqual([local]);
});
