// Teacher view data, read from this phone's SQLite (works offline). Stands in for the DhwaniSarathi backend endpoints
// the original screens fetched (server/apigateway/views.py: educator_classrooms, classroom_assignments with
// SubmittedCount, assignment_userassignmentresults). Screening outcomes only, never a diagnosis.
import * as Crypto from 'expo-crypto';

import { db } from '@/db';
import { kvGet, list, put } from '@/db/store';

export type Child = { display_name: string; age_band: string; school: string; class_label?: string };
/** One screening round for a class (the original "assignment"). Local only, not synced. */
export type Assignment = { school: string; class_label: string; name: string; created_at: string; deadline: string };
export type Result = {
  session: string; outcome: string | null; ear_outcomes: Record<string, string>; frequency_results: Record<string, string>;
};
type Session = { child: string; started_at: string };

const schoolChildren = () => {
  const school = kvGet(db, 'school_id');
  return list<Child>(db, 'child').filter((c) => c.school === school);
};

/** Classrooms of the selected school: children grouped by class label, strength = number of children. */
export function classrooms() {
  const m = new Map<string, number>();
  for (const c of schoolChildren()) m.set(c.class_label ?? '', (m.get(c.class_label ?? '') ?? 0) + 1);
  return [...m].map(([label, count]) => ({ label, count })).sort((a, b) => a.label.localeCompare(b.label));
}

export const classChildren = (label: string) => schoolChildren().filter((c) => (c.class_label ?? '') === label);

/** Local calendar date, YYYY-MM-DD. */
export const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function addAssignment(label: string, name: string) {
  const now = new Date();
  // Deadline default of 7 days, as the original server set it (apigateway assignment_list POST).
  put(db, 'assignment', Crypto.randomUUID(), {
    school: kvGet(db, 'school_id'), class_label: label, name,
    created_at: now.toISOString(), deadline: ymd(new Date(now.getTime() + 7 * 86400000)),
  });
}

export const assignments = (label: string) => {
  const school = kvGet(db, 'school_id');
  return list<Assignment>(db, 'assignment').filter((a) => a.school === school && a.class_label === label);
};

/** Each child of the class screened in the round (session started between creation and the end of the deadline
 *  day), with the result of their latest session in it. Like the original SubmittedCount + results join. */
export function roundResults(a: Assignment) {
  const kids = new Map(classChildren(a.class_label).map((c) => [c.id, c]));
  const results = new Map(list<Result>(db, 'screening_result').map((r) => [r.session, r]));
  const end = new Date(`${a.deadline}T23:59:59.999`); // local time
  const latest = new Map<string, Session & { id: string }>();
  for (const s of list<Session>(db, 'screening_session')) {
    const at = new Date(s.started_at);
    if (!kids.has(s.child) || at < new Date(a.created_at) || at > end) continue;
    const prev = latest.get(s.child);
    if (!prev || s.started_at > prev.started_at) latest.set(s.child, s);
  }
  return [...latest.values()].filter((s) => results.has(s.id))
    .map((s) => ({ child: kids.get(s.child)!, sessionId: s.id, result: results.get(s.id)! }));
}
