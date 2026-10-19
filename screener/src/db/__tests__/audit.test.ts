// Audit log on the phone: every audited write appends a chained entry in the same transaction; tampering with any
// stored entry is detected by verify.
import { memDb } from '../memDb';
import { auditLog, put, verifyAuditLog } from '../store';

function seeded() {
  const db = memDb();
  put(db, 'child', 'k-1', { display_name: 'Student A1' }); // not audited
  put(db, 'consent', 'c-1', { child: 'k-1', given_by: 'parent', method: 'written' });
  put(db, 'screening_result', 'r-1', { outcome: 'REFER', reliability_score: 0.75 });
  put(db, 'case', 'case-1', { child: 'k-1', status: 'referred' });
  put(db, 'case_event', 'e-1', { case: 'case-1', from_status: 'screened', to_status: 'referred' });
  return db;
}

test('consent, results, cases and status changes are logged in order; other records are not', () => {
  const db = seeded();
  expect(auditLog(db).map((e) => [e.seq, e.kind, e.record_id])).toEqual([
    [1, 'consent', 'c-1'], [2, 'screening_result', 'r-1'], [3, 'case', 'case-1'], [4, 'case_event', 'e-1'],
  ]);
  const v = verifyAuditLog(db);
  expect([v.ok, v.entries, v.head]).toEqual([true, 4, auditLog(db)[3].hash]);
});

test.each([
  ['data', "UPDATE audit SET data = replace(data, 'REFER', 'PASS') WHERE seq = 2", 2, 'hash'],
  ['time', "UPDATE audit SET at = '2020-01-01T00:00:00.000Z' WHERE seq = 3", 3, 'hash'],
  ['kind', "UPDATE audit SET kind = 'consent' WHERE seq = 4", 4, 'hash'],
  ['deleted entry', 'DELETE FROM audit WHERE seq = 2', 2, 'seq'],
  ['renumbered after a delete', 'DELETE FROM audit WHERE seq = 2; UPDATE audit SET seq = seq - 1 WHERE seq > 2', 2, 'prev'],
])('tampering detected: %s', (_, sql, at, why) => {
  const db = seeded();
  sql.split('; ').forEach((s) => db.run(s));
  expect(verifyAuditLog(db)).toMatchObject({ ok: false, broken_at: at, why });
});

test('a failed write leaves no audit entry (same transaction)', () => {
  const db = seeded();
  expect(() => db.tx(() => {
    put(db, 'case_event', 'e-2', { case: 'case-1', to_status: 'camp_scheduled' });
    throw new Error('boom');
  })).toThrow('boom');
  expect(verifyAuditLog(db)).toMatchObject({ ok: true, entries: 4 });
});
