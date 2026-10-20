// Every route in src/app opens with sample data (a teacher, a classroom, an assignment, children with screening and
// detailed results) and logs no console error or warning. Routes come from the files, so a new screen is covered
// without editing this test. expo-router/testing-library renders the real app directory and its layouts.
/* eslint-disable @typescript-eslint/no-require-imports -- jest.mock factories must require */
import * as fs from 'fs';
import * as path from 'path';
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';

jest.mock('@/db', () => ({ db: require('@/db/memDb').memDb() }));
jest.mock('@/audio/useScreeningAudio', () => {
  const port = { play: jest.fn(), stop: jest.fn() };
  const audio = {
    port, earphones: true, micOn: false, error: '', calibrated: true, provisional: true, deviceChanges: () => [],
    playAt: jest.fn(), setListeners: jest.fn(), warmUp: jest.fn(async () => {}), startMic: jest.fn(async () => {}),
    stopMic: jest.fn(async () => {}),
  };
  return { useScreeningAudio: () => audio };
});

// Native audio and Reanimated have no jest build; the screens only need them to exist.
jest.mock('expo-audio', () => {
  const player = { play: jest.fn(), pause: jest.fn(), seekTo: jest.fn(async () => {}), remove: jest.fn(), volume: 1,
    addListener: () => ({ remove: jest.fn() }) };
  const recorder = { prepareToRecordAsync: jest.fn(async () => {}), record: jest.fn(), stop: jest.fn(async () => {}), getStatus: () => ({}) };
  return {
    createAudioPlayer: () => player, useAudioPlayer: () => player, useAudioPlayerStatus: () => ({ playing: false }),
    useAudioRecorder: () => recorder, AudioModule: { AudioRecorder: function AudioRecorder() { return recorder; } },
    RecordingPresets: { HIGH_QUALITY: {} }, requestRecordingPermissionsAsync: async () => ({ granted: true }),
    setAudioModeAsync: async () => {},
  };
});
// expo-router/testing-library mocks Reanimated itself when it loads (imports load lazily, so touch it first); its mock
// has no useReducedMotion, used by child mode.
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
void renderRouter;
Object.assign(jest.requireMock('react-native-reanimated'), { useReducedMotion: () => false });

const { db } = jest.requireMock('@/db');
const { kvSet, put } = jest.requireActual('@/db/store');

const ID = {
  child: '00000000-0000-4000-8000-000000000001', child2: '00000000-0000-4000-8000-000000000002',
  session: '00000000-0000-4000-8000-000000000003', result: '00000000-0000-4000-8000-000000000004',
  detailed: '00000000-0000-4000-8000-000000000005', classroom: '00000000-0000-4000-8000-000000000006',
  assignment: '00000000-0000-4000-8000-000000000007', case: '00000000-0000-4000-8000-000000000008',
  consent: '00000000-0000-4000-8000-000000000009',
};

beforeAll(() => {
  const now = new Date().toISOString();
  kvSet(db, 'school_id', 'school-1');
  kvSet(db, 'school_name', 'Demo School');
  kvSet(db, 'teacher_name', 'Teacher A');
  kvSet(db, 'teacher_pin', '1234');
  kvSet(db, 'teacher_session', 'Teacher A');
  put(db, 'classroom', ID.classroom, { school: 'school-1', name: '5A', strength: 30, created_at: now });
  put(db, 'assignment', ID.assignment, { school: 'school-1', class_label: '5A', name: 'Term 1 check', created_at: '2026-01-01T00:00:00Z', deadline: '2099-12-31' });
  put(db, 'child', ID.child, { school: 'school-1', display_name: 'Student A1', age_band: '9-11', class_label: '5A' });
  put(db, 'child', ID.child2, { school: 'school-1', display_name: 'Student A2', age_band: '9-11', class_label: '5A' });
  put(db, 'consent', ID.consent, { child: ID.child, given_by: 'parent', at: now });
  put(db, 'screening_session', ID.session, { child: ID.child, consent: ID.consent, started_at: now, calibrated: true });
  put(db, 'screening_result', ID.result, {
    session: ID.session, outcome: 'REFER', ear_outcomes: { left: 'REFER', right: 'PASS' },
    frequency_results: { 'left-1000': 'not_heard_confirmed', 'right-1000': 'heard' }, reasons: [],
  });
  put(db, 'case', ID.case, { child: ID.child, school: 'school-1', screening_result: ID.result, status: 'referred' });
  put(db, 'detailed_test', ID.detailed, {
    child: ID.child2, started_at: now, finished_at: now, calibration_provisional: true,
    points: [500, 1000, 2000, 4000].flatMap((f) => [
      { ear: 'left', frequency: f, threshold: 20, max: 80 }, { ear: 'right', frequency: f, threshold: f === 4000 ? null : 35, max: 80 },
    ]),
  });
});

// src/app/a/[x].tsx -> /a/<seeded id>; layouts and +files are not routes.
const PARAMS: Record<string, string> = {
  childId: ID.child, caseId: ID.case, testId: ID.detailed, id: ID.assignment, sessionId: ID.session,
};
const appDir = path.join(__dirname, '..', 'app');
const files = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? files(path.join(dir, e.name)) : [path.join(dir, e.name)]));
const routes = files(appDir).map((f) => path.relative(appDir, f).replace(/\.tsx$/, ''))
  .filter((r) => !/(^|\/)(_layout|\+)/.test(r) && !r.endsWith('.web'))
  .map((r) => '/' + r.replace(/(^|\/)index$/, '').replace(/\[(\w+)\]/g, (_, k) => PARAMS[k] ?? 'x'))
  .map((r) => (r === '/teacher/class' ? `${r}?label=5A` : r));

let logged: string[] = [];
beforeEach(() => {
  logged = [];
  for (const k of ['error', 'warn'] as const) {
    jest.spyOn(console, k).mockImplementation((...a: unknown[]) => { logged.push(`${k}: ${a.map(String).join(' ')}`); });
  }
});
afterEach(() => jest.restoreAllMocks());

test('the route list is not empty', () => expect(routes.length).toBeGreaterThan(15));

test.each(routes)('%s renders with no console error', async (url) => {
  const r = renderRouter('./src/app', { initialUrl: url });
  await act(async () => {}); // let focus effects and font loading settle
  // Logged in, /login is not a route any more (Stack.Protected) and lands on Home; every other URL stays put.
  expect(r.getPathname()).toBe(url === '/login' ? '/' : url.split('?')[0]);
  expect(screen.queryByText(/not found|Unmatched Route/i)).toBeNull();
  expect(logged).toEqual([]);
});

test('login comes first, logging in lands on Home, logout goes back to login', async () => {
  kvSet(db, 'teacher_session', '');
  const r = renderRouter('./src/app', { initialUrl: '/children' });
  await act(async () => {});
  expect(r.getPathname()).toBe('/login'); // logged out: every route leads to the login
  expect(screen.queryByRole('tab')).toBeNull(); // no tab bar before login
  fireEvent.changeText(screen.getByLabelText('PIN'), '9999'); // the seeded PIN is 1234
  fireEvent.press(screen.getByText('Log in'));
  expect(screen.getByText('Wrong PIN for this phone.')).toBeTruthy();
  fireEvent.changeText(screen.getByLabelText('PIN'), '1234');
  await act(async () => { fireEvent.press(screen.getByText('Log in')); });
  expect(r.getPathname()).toBe('/');
  expect(screen.getByText('Welcome,\nTeacher A')).toBeTruthy();
  expect(screen.getAllByRole('tab').length).toBe(5);
  await act(async () => { fireEvent.press(screen.getAllByRole('tab')[4]); }); // Settings
  await act(async () => { fireEvent.press(screen.getByText('Log out')); });
  expect(r.getPathname()).toBe('/login');
  expect(logged).toEqual([]);
});
