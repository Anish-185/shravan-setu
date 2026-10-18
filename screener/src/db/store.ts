// Local-first storage: every write lands in SQLite first, and synced types also go into an outbox (sync.ts).
// One generic `records` table: `data` holds exactly the backend serializer fields for that type, so the outbox
// payload is the stored row. Client-generated UUIDv4 ids make every push idempotent.
export type Db = {
  all<T = any>(sql: string, ...params: unknown[]): T[];
  run(sql: string, ...params: unknown[]): void;
  tx(fn: () => void): void; // re-entrant: nested calls join the outer transaction
};

// Order of first sync matters only within one batch, and the outbox keeps insertion order (camp_request is queued
// before its cases' camp_scheduled events).
export const SYNCED_TYPES = [
  'child', 'consent', 'screening_session', 'screening_result', 'case', 'case_event', 'camp_request',
] as const;
// Local only: session_log (full engine log), facility (pulled at login), reminder (stub log; the server logs its own).
export type RecordType = (typeof SYNCED_TYPES)[number] | 'session_log' | 'facility' | 'reminder';

export function migrate(db: Db) {
  db.run(`CREATE TABLE IF NOT EXISTS records (
    type TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY (type, id))`);
  db.run(`CREATE TABLE IF NOT EXISTS outbox (
    seq INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', error TEXT, created_at TEXT NOT NULL, synced_at TEXT)`);
  db.run('CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
}

const nowIso = () => new Date().toISOString();

/** Upsert a record locally; synced types are also queued for the next sync. Atomic. */
export function put(db: Db, type: RecordType, id: string, data: object) {
  const json = JSON.stringify(data);
  db.tx(() => {
    db.run(
      `INSERT INTO records (type, id, data, updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT (type, id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
      type, id, json, nowIso(),
    );
    if ((SYNCED_TYPES as readonly string[]).includes(type)) {
      db.run('INSERT INTO outbox (type, id, data, created_at) VALUES (?, ?, ?, ?)', type, id, json, nowIso());
    }
  });
}

/** Overwrite local data without queueing (used for server pulls). */
export function putLocal(db: Db, type: RecordType, id: string, data: object) {
  db.run(
    `INSERT INTO records (type, id, data, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT (type, id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
    type, id, JSON.stringify(data), nowIso(),
  );
}

export function get<T = any>(db: Db, type: RecordType, id: string): T | null {
  const row = db.all<{ data: string }>('SELECT data FROM records WHERE type = ? AND id = ?', type, id)[0];
  return row ? JSON.parse(row.data) : null;
}

export function list<T = any>(db: Db, type: RecordType): (T & { id: string })[] {
  return db.all<{ id: string; data: string }>('SELECT id, data FROM records WHERE type = ? ORDER BY updated_at DESC', type)
    .map((r) => ({ ...JSON.parse(r.data), id: r.id }));
}

export function kvGet(db: Db, key: string): string | null {
  return db.all<{ value: string }>('SELECT value FROM kv WHERE key = ?', key)[0]?.value ?? null;
}

export function kvSet(db: Db, key: string, value: string) {
  db.run('INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value', key, value);
}

export type OutboxRow = { seq: number; type: string; id: string; status: string; error: string | null };
export const outbox = (db: Db) =>
  db.all<OutboxRow>('SELECT seq, type, id, status, error FROM outbox ORDER BY seq DESC LIMIT 200');
