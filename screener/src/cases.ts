// Referral cases on the phone, all offline: triage, status moves, camp requests, CSV. Every change is a local record
// plus an outbox entry; the server replays the same moves (case_event) with the same transition table.
// Triage, not diagnosis. Statuses and outcomes are screening follow-up, never a diagnosis.
import * as Crypto from 'expo-crypto';

import { get, kvGet, list, put, putLocal, type Db } from '@/db/store';
import { pick } from '@/i18n/strings';
import { checkTransition, triageRoute, v, type Config } from '@/rules';

export type Facility = { id: string; code: string; name: string; type: 'PHC' | 'DEIC'; mandal: string };
export type CaseRec = {
  child: string; school: string; screening_result?: string; status: string;
  triage_answers?: Record<string, boolean>; triage_route?: string; triage_rule?: string; facility?: string | null;
};
export type EventRec = { case: string; from_status: string; to_status: string; treatment?: string; reason?: string; note?: string; at: string };
export type CampRec = { school: string; camp_date: string; cases: string[]; facility?: string | null; note?: string };
export type Reminder = { case: string; text_en: string; text_te: string; to_phone: string; at: string; note: string };

const uuid = () => Crypto.randomUUID();
const nowIso = () => new Date().toISOString();
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** 2026-10-24 -> "24 Oct 2026", like the server's reminder text. */
export const longDate = (iso: string) => `${iso.slice(8, 10)} ${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;

export function saveFacilities(db: Db, facilities: Facility[]) {
  for (const f of facilities) putLocal(db, 'facility', f.id, f);
}

/** Nearest = same mandal as the school (no maps); else the first of that type. Null if none loaded. */
export function facilityFor(db: Db, route: string): Facility | null {
  const all = list<Facility>(db, 'facility').filter((f) => f.type === route).sort((a, b) => a.code.localeCompare(b.code));
  const mandal = kvGet(db, 'school_mandal');
  return all.find((f) => f.mandal && f.mandal === mandal) ?? all[0] ?? null;
}

export function saveTriage(db: Db, cfg: Config, caseId: string, answers: Record<string, boolean>) {
  const c = get<CaseRec>(db, 'case', caseId);
  if (!c) throw new Error(`case ${caseId} not found`);
  const r = triageRoute(answers, cfg);
  const facility = facilityFor(db, r.route);
  put(db, 'case', caseId, { ...c, triage_answers: answers, triage_route: r.route, triage_rule: r.rule, facility: facility?.id ?? null });
  return { ...r, facility };
}

/** Checked with the shared transition table; the server re-checks with the same table on sync. */
export function moveCase(db: Db, cfg: Config, caseId: string, to: string, extra: { treatment?: string; reason?: string; note?: string } = {}) {
  const c = get<CaseRec>(db, 'case', caseId);
  if (!c) throw new Error(`case ${caseId} not found`);
  const verdict = checkTransition(c.status, to, extra.treatment ?? '', extra.reason ?? '');
  if (!verdict.allowed) return verdict;
  const at = nowIso();
  db.tx(() => {
    put(db, 'case_event', uuid(), { case: caseId, from_status: c.status, to_status: to, ...extra, at } satisfies EventRec);
    put(db, 'case', caseId, { ...c, status: to, ...(to === 'treated' ? { treatment: extra.treatment } : {}) });
    if (to === 'missed') logReminder(db, cfg, caseId, c);
  });
  return verdict;
}

/** Stub: what WOULD be sent. Nothing is sent (real SMS is a future cost). The server logs its own copy on sync. */
function logReminder(db: Db, cfg: Config, caseId: string, c: CaseRec) {
  const camp = campsFor(db, caseId)[0];
  const vars = {
    child: get<{ display_name: string }>(db, 'child', c.child)?.display_name ?? '?',
    school: kvGet(db, 'school_name') ?? '',
    date: camp ? ` on ${longDate(camp.camp_date)}` : '',
  };
  const template = v(cfg, 'reminders', 'missed_camp');
  const rem: Reminder = {
    case: caseId, text_en: pick(template, 'en', vars), text_te: pick(template, 'te', vars),
    to_phone: get<{ guardian_phone?: string }>(db, 'child', c.child)?.guardian_phone ?? '', at: nowIso(),
    note: 'would send (stubbed): not sent',
  };
  putLocal(db, 'reminder', uuid(), rem);
}

export const remindersFor = (db: Db, caseId: string) => list<Reminder>(db, 'reminder').filter((r) => r.case === caseId);
export const campsFor = (db: Db, caseId: string) =>
  list<CampRec>(db, 'camp_request').filter((c) => c.cases.includes(caseId)).sort((a, b) => b.camp_date.localeCompare(a.camp_date));

/** History in the order it happened. Events are append-only, so insertion order (rowid) is exact even when two
 *  moves share a millisecond timestamp (ERR-028). */
export function events(db: Db, caseId: string): EventRec[] {
  return db.all<{ data: string }>("SELECT data FROM records WHERE type = 'case_event' ORDER BY rowid")
    .map((r) => JSON.parse(r.data) as EventRec).filter((e) => e.case === caseId);
}

/** Camp request first, then each case's camp_scheduled event, so the outbox syncs them in a valid order. */
export function createCamp(db: Db, cfg: Config, school: string, caseIds: string[], campDate: string, facility: string | null) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(campDate) || Number.isNaN(Date.parse(campDate))) throw new Error('bad date');
  const bad = caseIds.filter((id) => !['referred', 'rescheduled'].includes(get<CaseRec>(db, 'case', id)?.status ?? ''));
  if (!caseIds.length || bad.length) throw new Error(`cases must be referred or rescheduled: ${bad.join(', ')}`);
  const id = uuid();
  db.tx(() => {
    put(db, 'camp_request', id, { school, camp_date: campDate, cases: caseIds, facility } satisfies CampRec);
    for (const c of caseIds) moveCase(db, cfg, c, 'camp_scheduled', { note: `camp request ${id}` });
  });
  return id;
}

export type CaseRow = CaseRec & { id: string; name: string };
export function caseRows(db: Db): CaseRow[] {
  return list<CaseRec>(db, 'case').map((c) => ({ ...c, name: get<{ display_name: string }>(db, 'child', c.child)?.display_name ?? '?' }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

const csvCell = (x: unknown) => `"${String(x ?? '').replace(/"/g, '""')}"`;
/** Pseudonyms and short IDs only. Same banner as the server's exports; headers stay English (read on the laptop). */
export function casesCsv(db: Db, rows: CaseRow[]) {
  const lines = [['SCREENING, NOT DIAGNOSIS'], ['Child (pseudonym)', 'ID', 'Status', 'Triage route', 'Facility', 'Ear(s) REFER']];
  for (const r of rows) {
    const res = r.screening_result ? get<{ ear_outcomes: Record<string, string> }>(db, 'screening_result', r.screening_result) : null;
    const ears = Object.entries(res?.ear_outcomes ?? {}).filter(([, o]) => o === 'REFER').map(([e]) => e).join('+');
    const fac = r.facility ? get<Facility>(db, 'facility', r.facility)?.name : '';
    lines.push([r.name, r.child.slice(0, 8), r.status, r.triage_route ?? '', fac ?? '', ears || '-']);
  }
  return lines.map((l) => l.map(csvCell).join(',')).join('\n') + '\n';
}
