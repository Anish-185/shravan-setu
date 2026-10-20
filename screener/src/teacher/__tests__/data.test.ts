// Teacher view data: classrooms by class label, and a round's progress from screening sessions in its window.
import { randomUUID as mockRandomUUID } from 'crypto'; // first: jest.mock below is hoisted above the imports

import { kvSet, list, put } from '../../db/store';
import { addAssignment, assignments, classrooms, roundResults } from '../data';

jest.mock('expo-crypto', () => ({ randomUUID: () => mockRandomUUID() }));
jest.mock('@/db', () => ({ db: jest.requireActual('../../db/memDb').memDb() }));
const { db } = jest.requireMock('@/db');

test('classrooms group the school\'s children by label; a round counts the latest session in its window', () => {
  kvSet(db, 'school_id', 's1');
  const kid = (id: string, school: string, class_label?: string) =>
    put(db, 'child', id, { school, display_name: `Student ${id}`, age_band: '9-11', class_label });
  kid('a', 's1', '5A'); kid('b', 's1', '5A'); kid('c', 's1'); kid('d', 's2', '5A');
  expect(classrooms()).toEqual([{ label: '', count: 1 }, { label: '5A', count: 2 }]);

  const test = (session: string, child: string, started_at: string, outcome: string) => {
    put(db, 'screening_session', session, { child, started_at });
    put(db, 'screening_result', `r-${session}`, { session, outcome, ear_outcomes: {}, frequency_results: {} });
  };
  test('old', 'b', '2000-01-01T00:00:00Z', 'PASS'); // before the round: not counted
  addAssignment('5A', 'Term 1');
  const now = Date.now();
  test('s1', 'a', new Date(now + 1000).toISOString(), 'RETEST');
  test('s2', 'a', new Date(now + 2000).toISOString(), 'REFER'); // retested: latest wins
  test('s3', 'd', new Date(now + 1000).toISOString(), 'PASS'); // other school
  const [round] = assignments('5A');
  expect(roundResults(round).map((r) => [r.child.id, r.result.outcome])).toEqual([['a', 'REFER']]);
  expect(list(db, 'assignment')).toHaveLength(1);
});
