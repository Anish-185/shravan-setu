// Teacher-triggered sync: push the outbox to /api/sync/ in order, then pull case status updates. Safe to retry:
// the server upserts by client UUID and reports duplicates, and only rows it accepted are marked synced.
import { get, kvGet, kvSet, putLocal, type Db } from './store';

export type Server = { baseUrl: string; token: string; school: string };
type SyncResult = { type: string; id: string; status: 'created' | 'updated' | 'duplicate' | 'error'; errors?: unknown };

export async function syncNow(db: Db, server: Server, fetchFn: typeof fetch = fetch) {
  const headers = { Authorization: `Token ${server.token}`, 'Content-Type': 'application/json' };
  const base = server.baseUrl.replace(/\/+$/, '');

  const pending = db.all<{ seq: number; type: string; id: string; data: string }>(
    "SELECT seq, type, id, data FROM outbox WHERE status != 'synced' ORDER BY seq");
  let pushed = 0;
  let failed = 0;
  if (pending.length) {
    const res = await fetchFn(`${base}/api/sync/`, {
      method: 'POST', headers,
      body: JSON.stringify({ records: pending.map((r) => ({ type: r.type, id: r.id, data: JSON.parse(r.data) })) }),
    });
    if (!res.ok) throw new Error(`Sync failed: HTTP ${res.status}`);
    const { results } = (await res.json()) as { results: SyncResult[] };
    if (results.length !== pending.length) throw new Error('Sync failed: server answered a different number of records');
    const at = new Date().toISOString();
    db.tx(() => results.forEach((r, i) => {
      const ok = r.status !== 'error';
      if (ok) pushed++;
      else failed++;
      db.run('UPDATE outbox SET status = ?, error = ?, synced_at = ? WHERE seq = ?',
        ok ? 'synced' : 'error', ok ? null : JSON.stringify(r.errors), ok ? at : null, pending[i].seq);
    }));
  }

  // Pull: status changes made elsewhere (e.g. a PHC marking a case seen) for cases this phone knows.
  const since = kvGet(db, 'last_pull');
  const q = `school=${encodeURIComponent(server.school)}${since ? `&updated_since=${encodeURIComponent(since)}` : ''}`;
  const res = await fetchFn(`${base}/api/cases/?${q}`, { headers });
  if (!res.ok) throw new Error(`Pull failed: HTTP ${res.status}`);
  const cases = (await res.json()) as { id: string; status: string; updated_at: string }[];
  let pulled = 0;
  let latest = since;
  for (const c of cases) {
    const local = get(db, 'case', c.id);
    if (local) {
      putLocal(db, 'case', c.id, { ...local, status: c.status });
      pulled++;
    }
    if (!latest || c.updated_at > latest) latest = c.updated_at;
  }
  if (latest) kvSet(db, 'last_pull', latest);
  return { pushed, failed, pulled };
}
