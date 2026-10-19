// Full demo path on the phone side (docs/DEMO_PATH.md), with the real engine, rules, store and case logic and a
// fake audio layer: setup -> screen 3 children -> 1 REFER -> triage -> camp request -> seen -> treated -> closed,
// then sync to a fake server that replays every case move with the same transition table.
import { randomUUID as mockRandomUUID } from 'crypto'; // first: jest.mock below is hoisted above the imports
import * as fs from 'fs';
import * as path from 'path';

import { campsFor, caseRows, createCamp, events, moveCase, remindersFor, saveFacilities, saveTriage, type CaseRec } from '../cases';
import { memDb } from '../db/memDb';
import { get, kvSet, list, put, type Db } from '../db/store';
import { syncNow } from '../db/sync';
import { createEngine, type Port, type Snapshot } from '../engine/engine';
import { checkTransition, type Ear } from '../rules';
import { saveSession } from '../session';

jest.mock('expo-crypto', () => ({ randomUUID: () => mockRandomUUID() }));

const cfg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../config/screening.json'), 'utf8'));
const FACILITIES = [
  { id: 'f-phc-1', code: 'SAMPLE-PHC-1', name: 'SAMPLE-PHC-1 (fake demo facility)', type: 'PHC' as const, mandal: 'SAMPLE-MANDAL-1' },
  { id: 'f-phc-2', code: 'SAMPLE-PHC-2', name: 'SAMPLE-PHC-2 (fake demo facility)', type: 'PHC' as const, mandal: 'SAMPLE-MANDAL-2' },
  { id: 'f-deic-1', code: 'SAMPLE-DEIC-1', name: 'SAMPLE-DEIC-1 (fake demo facility)', type: 'DEIC' as const, mandal: 'SAMPLE-MANDAL-1' },
];

/** One test with the fake audio layer: a child who hears every tone except those in `misses`. */
function screen(hears: (ear: Ear, freq: number) => boolean) {
  let snap = { phase: 'ready' } as Snapshot;
  let seed = 7;
  const port: Port = {
    now: () => Date.now(),
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    clearTimeout: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
    random: () => (seed = (seed * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32,
    play: (ear, freq) => {
      setTimeout(() => engine.onPlaybackStart(Date.now()), 120);
      if (hears(ear, freq)) setTimeout(() => engine.onTap(Date.now()), 700);
    },
    playSilence: () => { setTimeout(() => engine.onPlaybackStart(Date.now()), 120); },
    stop: () => {},
  };
  const engine = createEngine(cfg, port, { include500: false, micStartMs: -10_000, earphones: true }, (s) => { snap = s; });
  const meter = setInterval(() => engine.onSample(-33, Date.now()), cfg.noise.meter_poll_ms.value);
  engine.start();
  for (let i = 0; i < 1200 && snap.phase !== 'done'; i++) jest.advanceTimersByTime(1000);
  clearInterval(meter);
  return { result: snap.result!, log: engine.log() };
}

function setupPhone(db: Db) {
  kvSet(db, 'school_id', 'school-1');
  kvSet(db, 'school_name', 'Demo School (FAKE)');
  kvSet(db, 'school_mandal', 'SAMPLE-MANDAL-1');
  saveFacilities(db, FACILITIES);
  const kids = ['Student D1', 'Student D2', 'Student D3'].map((name, i) => {
    const id = `child-${i + 1}`;
    put(db, 'child', id, { school: 'school-1', display_name: name, age_band: '9-11' });
    return id;
  });
  return kids;
}

function screenChild(db: Db, childId: string, hears: (ear: Ear, freq: number) => boolean) {
  const consentId = `consent-${childId}`;
  put(db, 'consent', consentId, { child: childId, given_by: 'parent', method: 'written' });
  const { result, log } = screen(hears);
  return saveSession(db, {
    childId, school: 'school-1', consentId, startedAt: new Date().toISOString(), lrPassed: true, ambientDb: -8,
    ambientReason: 'test', calibrated: false, provisional: false, result, log, device: { brand: 'Fake', model: 'Fake', os: 'test' },
    appVersion: 'test', configVersion: cfg.config_version,
  });
}

/** Fake /api/sync/ + /api/cases/: upserts by id and replays case_events through the shared transition table. */
function fakeServer() {
  const rows = new Map<string, Record<string, unknown>>();
  const status = new Map<string, string>();
  const fetchFn = (async (url: string, init?: RequestInit) => {
    if (!url.endsWith('/api/sync/')) return { ok: true, status: 200, json: async () => [] };
    const { records } = JSON.parse(String(init?.body));
    const results = records.map((r: { type: string; id: string; data: Record<string, unknown> }) => {
      const key = `${r.type}:${r.id}`;
      if (rows.has(key) && (r.type === 'case_event' || r.type === 'camp_request')) return { ...r, status: 'duplicate' };
      if (r.type === 'case') status.set(r.id, status.get(r.id) ?? 'screened');
      if (r.type === 'case_event') {
        const cur = status.get(r.data.case as string);
        const v = checkTransition(cur ?? '', r.data.to_status as string, (r.data.treatment as string) ?? '', (r.data.reason as string) ?? '');
        if (cur !== r.data.from_status || !v.allowed) return { ...r, status: 'error', errors: `${cur} -> ${r.data.to_status}` };
        status.set(r.data.case as string, r.data.to_status as string);
      }
      const existed = rows.has(key);
      rows.set(key, r.data);
      return { type: r.type, id: r.id, status: existed ? 'updated' : 'created' };
    });
    return { ok: true, status: 200, json: async () => ({ results }) };
  }) as unknown as typeof fetch;
  return { rows, status, fetchFn };
}

beforeEach(() => jest.useFakeTimers({ now: 1_800_000_000_000 }));
afterEach(() => jest.useRealTimers());

test('demo path: 3 children -> 1 REFER -> triage -> camp -> seen -> treated -> closed, then sync', async () => {
  const db = memDb();
  const [d1, d2, d3] = setupPhone(db);

  // 1. Three screenings: D1 and D3 hear everything, D2 misses left 4 kHz (confirmed on rescreen).
  const s1 = screenChild(db, d1, () => true);
  const s2 = screenChild(db, d2, (ear, f) => !(ear === 'left' && f === 4000));
  const s3 = screenChild(db, d3, () => true);
  expect([s1.caseId, s3.caseId]).toEqual([null, null]);
  expect(s2.caseId).not.toBeNull();
  const caseId = s2.caseId!;
  expect(get<{ outcome: string }>(db, 'screening_result', list<{ session: string; outcome: string }>(db, 'screening_result')
    .find((r) => r.session === s2.sessionId)!.id)?.outcome).toBe('REFER');
  expect(caseRows(db).map((r) => [r.name, r.status])).toEqual([['Student D2', 'referred']]);

  // 2. Triage: ear pain -> likely treatable cause -> PHC in the school's mandal.
  const tri = saveTriage(db, cfg, caseId, { ear_discharge: false, ear_pain: true, recent_cold: false, blocked_feeling: false, asks_for_repetition: true });
  expect([tri.route, tri.facility?.code]).toEqual(['PHC', 'SAMPLE-PHC-1']);

  // 3. Camp request -> camp_scheduled; then seen -> treated (needs a treatment) -> closed.
  const campId = createCamp(db, cfg, 'school-1', [caseId], '2026-10-24', tri.facility!.id);
  expect(get<CaseRec>(db, 'case', caseId)?.status).toBe('camp_scheduled');
  expect(campsFor(db, caseId).map((c) => c.camp_date)).toEqual(['2026-10-24']);
  expect(moveCase(db, cfg, caseId, 'seen')).toEqual({ allowed: true });
  expect(moveCase(db, cfg, caseId, 'treated')).toEqual({ allowed: false, why: 'needs_treatment' });
  expect(moveCase(db, cfg, caseId, 'treated', { treatment: 'wax_removed' })).toEqual({ allowed: true });
  expect(moveCase(db, cfg, caseId, 'referred')).toEqual({ allowed: false, why: 'illegal' });
  expect(moveCase(db, cfg, caseId, 'closed')).toEqual({ allowed: true });
  expect(events(db, caseId).map((e) => e.to_status)).toEqual(['referred', 'camp_scheduled', 'seen', 'treated', 'closed']);

  // 4. Sync: every record accepted, the server replays the moves to "closed"; a second sync sends nothing new.
  const server = fakeServer();
  const r = await syncNow(db, { baseUrl: 'http://laptop:8000', token: 't', school: 'school-1' }, server.fetchFn);
  expect(r.failed).toBe(0);
  expect(server.status.get(caseId)).toBe('closed');
  expect(server.rows.has(`camp_request:${campId}`)).toBe(true);
  const again = await syncNow(db, { baseUrl: 'http://laptop:8000', token: 't', school: 'school-1' }, server.fetchFn);
  expect([again.pushed, again.failed]).toEqual([0, 0]);
});

test('missed camp: reminder logged as "would send (stubbed)" with a Telugu-style date in Telugu; rescheduled again', () => {
  const db = memDb();
  const [, d2] = setupPhone(db);
  const { caseId } = screenChild(db, d2, (ear, f) => !(ear === 'right' && f === 2000));
  createCamp(db, cfg, 'school-1', [caseId!], '2026-10-24', null);
  expect(moveCase(db, cfg, caseId!, 'missed')).toEqual({ allowed: true });
  const [rem] = remindersFor(db, caseId!);
  expect(rem.note).toContain('would send (stubbed)');
  expect(rem.text_en).toContain('Student D2 (Demo School (FAKE)) missed the ear-check camp on 24 Oct 2026');
  expect(rem.text_te).toContain('Student D2 (Demo School (FAKE)) 24-10-2026 న చెవి పరీక్ష క్యాంప్‌కు');
  expect(moveCase(db, cfg, caseId!, 'rescheduled')).toEqual({ allowed: true });
  expect(createCamp(db, cfg, 'school-1', [caseId!], '2026-11-07', null)).toBeTruthy();
  expect(get<CaseRec>(db, 'case', caseId!)?.status).toBe('camp_scheduled');
  // reminders are local only: never queued for sync (the server logs its own on the synced 'missed' event)
  expect(db.all("SELECT 1 FROM outbox WHERE type = 'reminder'")).toHaveLength(0);
});
