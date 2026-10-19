// Tone player handling (ERR-026): warm-up, rewind after stop, and play without a seek.
import * as fs from 'fs';
import * as path from 'path';

import { playback, playFromStart, rewind, warmUp, type TonePlayer } from '../tones';

const cfg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../../config/screening.json'), 'utf8'));
const withCal = (level: number | null, base: Record<string, number | null>, provisional = false) => ({
  ...cfg,
  screening_level_db_re_team_baseline: { value: level, source: 'test' },
  calibration: { ...cfg.calibration, baseline_dbfs: { value: base, source: 'test' }, provisional: { value: provisional, source: 'test' } },
});
const NONE = { 500: null, 1000: null, 2000: null, 4000: null };

function fakePlayer() {
  const calls: string[] = [];
  const p: TonePlayer & { calls: string[] } = {
    calls,
    volume: 1,
    currentTime: 0,
    play: () => { calls.push(`play@${p.volume}`); },
    pause: () => { calls.push('pause'); },
    seekTo: async (s) => { calls.push(`seek ${s}`); p.currentTime = s; },
  };
  return p;
}

test('play from the start: no seek when the player was already rewound', () => {
  const p = fakePlayer();
  playFromStart(p, 0.1);
  expect(p.calls).toEqual(['play@0.1']);
});

test('play from the start: seeks first if the player was not rewound', () => {
  const p = fakePlayer();
  p.currentTime = 1;
  playFromStart(p, 0.1);
  expect(p.calls).toEqual(['seek 0', 'play@0.1']);
});

test('rewind pauses and seeks only when needed', () => {
  const p = fakePlayer();
  rewind(p);
  p.currentTime = 0.4;
  rewind(p);
  expect(p.calls).toEqual(['pause', 'pause', 'seek 0']);
});

test('warm-up plays every player silently and waits for each to report playing', async () => {
  const ps = [fakePlayer(), fakePlayer()];
  const subs = new Map<TonePlayer, () => void>();
  const timers: (() => void)[] = [];
  const warm = warmUp(ps, (p, fn) => { subs.set(p, fn); return () => subs.delete(p); }, 1500, (fn) => timers.push(fn));
  expect(ps.map((p) => p.calls)).toEqual([['play@0'], ['play@0']]); // volume 0: nothing is heard
  ps.forEach((p) => { p.currentTime = 0.2; subs.get(p)?.(); });
  await warm;
  expect(subs.size).toBe(0); // unsubscribed
  for (const p of ps) expect(p.calls).toEqual(['play@0']);
});

test('warm-up does not hang when a player never reports playing', async () => {
  const p = fakePlayer();
  const timers: (() => void)[] = [];
  const warm = warmUp([p], () => () => {}, 1500, (fn) => timers.push(fn));
  timers.forEach((fn) => fn()); // the timeout fires
  await warm;
  expect(p.calls).toEqual(['play@0']);
});

test('uncalibrated: placeholder volume for every frequency', () => {
  const p = playback(withCal(null, NONE, true));
  expect([p.calibrated, p.provisional]).toEqual([false, false]);
  expect(p.volumeFor(4000)).toBe(cfg.tone.uncalibrated_player_volume.value);
});

test('calibrated: volume = baseline + screening level, per frequency', () => {
  const p = playback(withCal(20, { 500: -60, 1000: -70, 2000: -72, 4000: -66 }));
  expect([p.calibrated, p.provisional]).toEqual([true, false]);
  expect(p.volumeFor(1000)).toBeCloseTo(10 ** (-50 / 20));
  expect(p.volumeFor(4000)).toBeCloseTo(10 ** (-46 / 20));
});

test('calibrated but a baseline is missing or too loud: fails before any test starts', () => {
  expect(() => playback(withCal(20, { 500: -60, 1000: null, 2000: -72, 4000: -66 }))).toThrow(/1000 Hz/);
  expect(() => playback(withCal(20, { 500: -10, 1000: -70, 2000: -72, 4000: -66 }))).toThrow(/above full scale/);
});

test('the real config: provisional team baseline (ERR-044), every frequency playable', () => {
  const p = playback(cfg);
  expect([p.calibrated, p.provisional]).toEqual([true, true]);
  expect(p.volumeFor(1000)).toBeCloseTo(10 ** ((cfg.calibration.baseline_dbfs.value['1000'] + 20) / 20));
});
