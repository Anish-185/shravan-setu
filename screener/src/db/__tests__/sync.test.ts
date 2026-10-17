// Outbox + sync tests on a real SQLite (node:sqlite) with a fake server that behaves like /api/sync/.
import { DatabaseSync } from 'node:sqlite';

import { get, kvGet, migrate, outbox, put, type Db } from '../store';
import { syncNow } from '../sync';

function memDb(): Db {
  const d = new DatabaseSync(':memory:');
  const db: Db = {
    all: (sql, ...p) => d.prepare(sql).all(...(p as never[])) as never[],
    run: (sql, ...p) => { d.prepare(sql).run(...(p as never[])); },
    tx: (fn) => {
      d.exec('BEGIN');
      try { fn(); d.exec('COMMIT'); } catch (e) { d.exec('ROLLBACK'); throw e; }
    },
  };
  migrate(db);
  return db;
}

/** Fake backend: idempotent upsert by id, case_event duplicates reported, optional per-type rejection. */
function fakeServer() {
  const rows = new Map<string, unknown>();
  const s = {
    rows,
    reject: new Set<string>(),
    failNextAfterApply: false, // apply the batch, then drop the response (network cut)
    cases: [] as { id: string; status: string; updated_at: string }[],
    pullQueries: [] as string[],
    posts: 0,
    fetch: (async (url: string, init?: RequestInit) => {
      if (url.endsWith('/api/sync/')) {
        s.posts++;
        const { records } = JSON.parse(String(init?.body));
        const results = records.map((r: { type: string; id: string; data: unknown }) => {
          if (s.reject.has(r.type)) return { type: r.type, id: r.id, status: 'error', errors: 'rejected' };
          const key = `${r.type}:${r.id}`;
          const existed = rows.has(key);
          rows.set(key, r.data);
          return { type: r.type, id: r.id, status: existed ? (r.type === 'case_event' ? 'duplicate' : 'updated') : 'created' };
        });
        if (s.failNextAfterApply) { s.failNextAfterApply = false; throw new Error('network down'); }
        return { ok: true, status: 200, json: async () => ({ results }) };
      }
      s.pullQueries.push(url.split('?')[1]);
      return { ok: true, status: 200, json: async () => s.cases };
    }) as unknown as typeof fetch,
  };
  return s;
}

const SERVER = { baseUrl: 'http://laptop:8000/', token: 't', school: 'school-1' };

function seed(db: Db) {
  put(db, 'child', 'c1', { school: 'school-1', display_name: 'Student A1', age_band: '6-8' });
  put(db, 'consent', 'k1', { child: 'c1', given_by: 'parent', method: 'verbal' });
  put(db, 'case', 'case1', { child: 'c1', school: 'school-1', status: 'referred' });
  put(db, 'case_event', 'e1', { case: 'case1', from_status: 'screened', to_status: 'referred' });
  put(db, 'session_log', 's1', { samples: [] }); // local only, never synced
}

test('push marks rows synced; a second sync sends nothing new', async () => {
  const db = memDb();
  const srv = fakeServer();
  seed(db);
  expect(await syncNow(db, SERVER, srv.fetch)).toEqual({ pushed: 4, failed: 0, pulled: 0 });
  expect(outbox(db).every((r) => r.status === 'synced')).toBe(true);
  expect([...srv.rows.keys()]).not.toContain('session_log:s1');
  await syncNow(db, SERVER, srv.fetch);
  expect(srv.posts).toBe(1);
});

test('network cut after the server applied the batch: retry is idempotent', async () => {
  const db = memDb();
  const srv = fakeServer();
  seed(db);
  srv.failNextAfterApply = true;
  await expect(syncNow(db, SERVER, srv.fetch)).rejects.toThrow('network down');
  expect(outbox(db).every((r) => r.status === 'pending')).toBe(true);
  expect(await syncNow(db, SERVER, srv.fetch)).toEqual({ pushed: 4, failed: 0, pulled: 0 });
  expect(srv.rows.size).toBe(4); // nothing duplicated on the server
});

test('a rejected record stays queued with its error and goes through on a later sync', async () => {
  const db = memDb();
  const srv = fakeServer();
  seed(db);
  srv.reject.add('consent');
  expect(await syncNow(db, SERVER, srv.fetch)).toEqual({ pushed: 3, failed: 1, pulled: 0 });
  expect(outbox(db).find((r) => r.type === 'consent')).toMatchObject({ status: 'error', error: '"rejected"' });
  srv.reject.clear();
  expect(await syncNow(db, SERVER, srv.fetch)).toEqual({ pushed: 1, failed: 0, pulled: 0 });
});

test('pull updates status of known cases only and remembers the last update time', async () => {
  const db = memDb();
  const srv = fakeServer();
  seed(db);
  srv.cases = [
    { id: 'case1', status: 'seen', updated_at: '2026-10-18T05:00:00Z' },
    { id: 'other-phone-case', status: 'referred', updated_at: '2026-10-18T06:00:00Z' },
  ];
  expect((await syncNow(db, SERVER, srv.fetch)).pulled).toBe(1);
  expect(get(db, 'case', 'case1')).toMatchObject({ status: 'seen', child: 'c1' });
  expect(get(db, 'case', 'other-phone-case')).toBeNull();
  expect(kvGet(db, 'last_pull')).toBe('2026-10-18T06:00:00Z');
  await syncNow(db, SERVER, srv.fetch);
  expect(srv.pullQueries[1]).toBe('school=school-1&updated_since=2026-10-18T06%3A00%3A00Z');
});
