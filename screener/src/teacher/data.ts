// Teacher view data, read from this phone's SQLite (works offline). Stands in for the DhwaniSarathi backend endpoints
// the original screens fetched (server/apigateway/views.py: educator_classrooms, classroom_assignments with
// SubmittedCount, assignment_userassignmentresults). Classrooms and assignments are local records (not synced); a
// child belongs to a classroom through its class label (synced with the child).
import * as Crypto from 'expo-crypto';

import { cfg } from '@/config';
import { db } from '@/db';
import { get, kvGet, list, put } from '@/db/store';
import { worseEarGrade, type Point } from '@/original/hearing';

export type Child = { display_name: string; age_band: string; school: string; class_label?: string };
/** The original Classroom {ClassroomName, Count}: name and the strength the teacher typed. */
export type Classroom = { school: string; name: string; strength: number; created_at: string };
/** One screening round for a class (the original "assignment"). */
export type Assignment = { school: string; class_label: string; name: string; created_at: string; deadline: string };
export type Result = {
  session: string; outcome: string | null; ear_outcomes: Record<string, string>; frequency_results: Record<string, string>;
};
type Session = { child: string; started_at: string };
type Detailed = { child: string; started_at: string; points: Point[] };

const school = () => kvGet(db, 'school_id');
const schoolChildren = () => list<Child>(db, 'child').filter((c) => c.school === school());

/** Classrooms of the selected school: the ones created here, plus any class label children have without one
 *  (strength = number of those children), so no child drops out of the teacher view. */
export function classrooms() {
  const made = list<Classroom>(db, 'classroom').filter((c) => c.school === school())
    .map((c) => ({ label: c.name, count: c.strength }));
  const labels = new Map<string, number>();
  for (const c of schoolChildren()) labels.set(c.class_label ?? '', (labels.get(c.class_label ?? '') ?? 0) + 1);
  const extra = [...labels].filter(([l]) => !made.some((m) => m.label === l)).map(([label, count]) => ({ label, count }));
  return [...made, ...extra].sort((a, b) => a.label.localeCompare(b.label));
}

export function addClassroom(name: string, strength: number) {
  put(db, 'classroom', Crypto.randomUUID(), { school: school(), name, strength, created_at: new Date().toISOString() });
}

/** Class strength: the typed strength of a created classroom, else the number of children with that label. */
export const strength = (label: string) => classrooms().find((c) => c.label === label)?.count ?? classChildren(label).length;

export const classChildren = (label: string) => schoolChildren().filter((c) => (c.class_label ?? '') === label);
export const allChildren = schoolChildren;

/** Put a child in a classroom (or take it out with ''): the child record is saved and synced as before. */
export function assignChild(child: Child & { id: string }, label: string) {
  const { id, ...data } = child;
  put(db, 'child', id, { ...data, class_label: label });
}

/** Local calendar date, YYYY-MM-DD. */
export const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Deadline default of 7 days, as the original server set it (apigateway assignment_list POST). */
export const defaultDeadline = () => ymd(new Date(Date.now() + 7 * 86400000));

export function addAssignment(label: string, name: string, deadline = defaultDeadline()) {
  put(db, 'assignment', Crypto.randomUUID(), {
    school: school(), class_label: label, name, created_at: new Date().toISOString(), deadline,
  });
}

export const assignments = (label: string) =>
  list<Assignment>(db, 'assignment').filter((a) => a.school === school() && a.class_label === label);

/** Every assignment of the selected school, soonest deadline first (the Assignments tab). */
export const allAssignments = () => list<Assignment>(db, 'assignment').filter((a) => a.school === school())
  .sort((a, b) => a.deadline.localeCompare(b.deadline) || a.name.localeCompare(b.name));

/** A test belongs to a round from the round's creation to the end of its deadline day (local time). */
const inWindow = (a: Assignment, startedAt: string) => {
  const at = new Date(startedAt);
  return at >= new Date(a.created_at) && at <= new Date(`${a.deadline}T23:59:59.999`);
};

export type HistoryItem = {
  kind: 'screening' | 'detailed'; id: string; at: string; outcome: string | null; grade: string | null; round: string | null;
};

/** One child's tests over time, newest first: every screening with a result and every detailed test, each with the
 *  round (assignment) of the child's class it fell in, if any. Like the original /results/<UID>/ list, which merged
 *  UserOnlyResults (self tests) and UserAssignmentResults (classroom tests) into one row of cards. */
export function childHistory(childId: string): HistoryItem[] {
  const child = get<Child>(db, 'child', childId);
  if (!child) return [];
  const rounds = list<Assignment>(db, 'assignment')
    .filter((a) => a.school === child.school && a.class_label === (child.class_label ?? ''));
  const round = (at: string) => rounds.find((a) => inWindow(a, at))?.name ?? null;
  const results = new Map(list<Result>(db, 'screening_result').map((r) => [r.session, r]));
  const screenings = list<Session>(db, 'screening_session').filter((x) => x.child === childId && results.has(x.id))
    .map((x): HistoryItem => ({
      kind: 'screening', id: x.id, at: x.started_at, outcome: results.get(x.id)!.outcome, grade: null, round: round(x.started_at),
    }));
  const detailed = list<Detailed>(db, 'detailed_test').filter((d) => d.child === childId)
    .map((d): HistoryItem => ({
      kind: 'detailed', id: d.id, at: d.started_at, outcome: null, grade: worseEarGrade(d.points, cfg), round: round(d.started_at),
    }));
  return [...screenings, ...detailed].sort((a, b) => b.at.localeCompare(a.at));
}

/** Each child of the class tested in the round (from creation to the end of the deadline day): their latest
 *  screening result and their latest detailed test in it, if any. Like the original SubmittedCount + results join. */
export function roundResults(a: Assignment) {
  const kids = new Map(classChildren(a.class_label).map((c) => [c.id, c]));
  const inRound = (x: { child: string; started_at: string }) => kids.has(x.child) && inWindow(a, x.started_at);
  const latest = <T extends { child: string; started_at: string }>(rows: T[]) => {
    const m = new Map<string, T>();
    for (const r of rows.filter(inRound)) if (!m.has(r.child) || r.started_at > m.get(r.child)!.started_at) m.set(r.child, r);
    return m;
  };
  const results = new Map(list<Result>(db, 'screening_result').map((r) => [r.session, r]));
  const sessions = latest(list<Session>(db, 'screening_session').filter((s) => results.has(s.id)));
  const detailed = latest(list<Detailed>(db, 'detailed_test'));
  return [...kids.keys()].filter((id) => sessions.has(id) || detailed.has(id)).map((id) => {
    const s = sessions.get(id);
    const d = detailed.get(id);
    return {
      child: kids.get(id)!,
      sessionId: s?.id ?? null,
      result: s ? results.get(s.id)! : null,
      detailed: d ? { id: d.id, grade: worseEarGrade(d.points, cfg) } : null,
    };
  }).sort((x, y) => x.child.display_name.localeCompare(y.child.display_name));
}

type Outcome = 'PASS' | 'RETEST' | 'REFER';
/** Each child's latest screening outcome, in one pass over the records (child id -> outcome; never screened = absent). */
export function latestOutcomes() {
  const results = new Map(list<Result>(db, 'screening_result').map((r) => [r.session, r.outcome]));
  const latest = new Map<string, { at: string; o: Outcome }>();
  for (const x of list<Session>(db, 'screening_session')) {
    const o = results.get(x.id);
    if (o !== 'PASS' && o !== 'RETEST' && o !== 'REFER') continue;
    const cur = latest.get(x.child);
    if (!cur || x.started_at > cur.at) latest.set(x.child, { at: x.started_at, o });
  }
  return new Map([...latest].map(([k, v]) => [k, v.o]));
}
