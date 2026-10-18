// Engine state machine tests with a fake audio/clock layer (jest fake timers). No real audio.
import * as fs from 'fs';
import * as path from 'path';

import type { Ear } from '@/rules';
import { createEngine, type Port, type Snapshot } from '../engine';

const cfg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../../config/screening.json'), 'utf8'));
const DURATION = cfg.tone.duration_ms.value;
const PER_POINT = cfg.presentations_per_point.value;
const CATCH = cfg.reliability.catch_trials.value;
const POINTS = cfg.ears.value.length * cfg.frequencies_hz.value.length;

type Child = {
  hears?: (ear: Ear, freq: number, round: number) => boolean;
  responseMs?: number;
  noisy?: (ear: Ear, freq: number, attempt: number) => boolean; // loud room noise during this presentation
  tapEveryMs?: number; // taps at random-ish moments regardless of tones
  earphones?: boolean;
  playLatencyMs?: number; // the player reports playback start this long after play(); undefined = never reports
  config?: typeof cfg;
};

function run(child: Child = {}, during?: (h: Harness) => void) {
  const h = harness(child);
  h.engine.start();
  during?.(h);
  for (let i = 0; i < 1200 && !['done', 'aborted'].includes(h.snap.phase); i++) jest.advanceTimersByTime(1000);
  return h;
}

type Harness = ReturnType<typeof harness>;

function harness({
  hears = () => true, responseMs = 600, noisy = () => false, tapEveryMs, earphones = true, playLatencyMs, config = cfg,
}: Child) {
  let seed = 1;
  const attempts = new Map<string, number>();
  const plays: { ear: Ear; freq: number; round: number; t: number }[] = [];
  let loud = false;
  let stops = 0;
  const h = {
    plays,
    get stops() { return stops; },
    snap: { phase: 'ready' } as Snapshot,
    engine: null as unknown as ReturnType<typeof createEngine>,
  };
  const port: Port = {
    now: () => Date.now(),
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    clearTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
    random: () => (seed = (seed * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32,
    play(ear, freq) {
      const key = `${ear}-${freq}-${h.snap.round}`;
      const attempt = (attempts.get(key) ?? 0) + 1;
      attempts.set(key, attempt);
      plays.push({ ear, freq, round: h.snap.round, t: Date.now() });
      loud = noisy(ear, freq, attempt);
      setTimeout(() => { loud = false; }, DURATION);
      if (playLatencyMs !== undefined) {
        h.engine.onPlaybackStart(Date.now() - 5000); // a stale report from before this tone: must be ignored
        setTimeout(() => h.engine.onPlaybackStart(Date.now()), playLatencyMs);
      }
      if (!tapEveryMs && hears(ear, freq, h.snap.round)) setTimeout(() => h.engine.onTap(Date.now()), responseMs);
    },
    stop() { stops++; loud = false; },
  };
  h.engine = createEngine(config, port, { include500: false, micStartMs: -10_000, earphones }, (s) => { h.snap = s; });
  setInterval(() => h.engine.onSample(loud ? -10 : -33, Date.now()), cfg.noise.meter_poll_ms.value);
  if (tapEveryMs) setInterval(() => h.engine.onTap(Date.now()), tapEveryMs);
  return h;
}

beforeEach(() => jest.useFakeTimers({ now: 1_000_000 }));
afterEach(() => jest.useRealTimers());

test('child hears everything -> PASS, no rescreen, every point presented', () => {
  const h = run();
  expect(h.snap.result?.outcome).toBe('PASS');
  expect(h.plays).toHaveLength(POINTS * PER_POINT);
  expect(h.plays.every((p) => p.round === 1)).toBe(true);
  expect(h.engine.log().trials.filter((t) => t.kind === 'catch')).toHaveLength(CATCH);
});

test('rescreen retests ONLY the failed point; confirmed miss -> REFER', () => {
  const h = run({ hears: (ear, f) => !(ear === 'left' && f === 4000) });
  const round2 = h.plays.filter((p) => p.round === 2);
  expect(round2).toHaveLength(PER_POINT);
  expect(round2.every((p) => p.ear === 'left' && p.freq === 4000)).toBe(true);
  expect(h.snap.result?.outcome).toBe('REFER');
  expect(h.snap.result?.ear_outcomes).toEqual({ left: 'REFER', right: 'PASS' });
});

test('missed in round 1 but heard on rescreen -> PASS', () => {
  const h = run({ hears: (ear, f, round) => round === 2 || !(ear === 'right' && f === 1000) });
  expect(h.snap.result?.outcome).toBe('PASS');
  expect(h.snap.result?.point_status['right-1000']).toBe('heard_on_rescreen');
});

test('noise during a tone discards and replays it, up to the limit, then the point is too noisy -> RETEST', () => {
  const maxReplays = cfg.noise.max_replays_per_tone.value;
  const once = run({ noisy: (ear, f, attempt) => ear === 'right' && f === 2000 && attempt === 1 });
  expect(once.snap.result?.outcome).toBe('PASS'); // replayed once, then heard
  expect(once.engine.log().noise_events).toHaveLength(1);

  const always = run({ noisy: (ear, f) => ear === 'right' && f === 2000 });
  const r2000 = always.plays.filter((p) => p.ear === 'right' && p.freq === 2000);
  expect(r2000).toHaveLength(PER_POINT * (1 + maxReplays));
  expect(always.snap.result?.point_status['right-2000']).toBe('noisy');
  expect(always.snap.result?.outcome).toBe('RETEST');
});

test('random tapping -> unreliable -> RETEST, never REFER', () => {
  const h = run({ tapEveryMs: 700 });
  expect(h.snap.result?.outcome).toBe('RETEST');
  expect(h.snap.result?.reliability.false_alarms).toBeGreaterThan(0);
});

test('late taps (after the response window) count against reliability, never as heard', () => {
  const h = run({ responseMs: cfg.response.response_window_ms.value + 200 });
  expect(h.snap.result?.outcome).toBe('RETEST');
  // every round-1 tone is out of window (so all points are rescreened, and those are late too)
  expect(h.engine.log().trials.filter((t) => t.round === 1 && t.kind === 'tone')
    .every((t) => t.responded && (t.response_ms as number) > cfg.response.response_window_ms.value)).toBe(true);
  expect(h.snap.result?.reliability.out_of_window).toBeGreaterThanOrEqual(POINTS * PER_POINT);
});

test('earphones unplugged mid-tone: tone stopped, test paused, no tone while unplugged, resumes cleanly', () => {
  let unpluggedAt = 0;
  const h = run({}, (hh) => {
    jest.advanceTimersByTime(cfg.response.inter_stimulus_interval_ms.value[1] + 100); // first tone is playing
    expect(hh.plays).toHaveLength(1);
    const stopsBefore = hh.stops;
    unpluggedAt = Date.now();
    hh.engine.onEarphones(false, unpluggedAt);
    expect(hh.stops).toBe(stopsBefore + 1);
    expect(hh.snap.phase).toBe('paused');
    hh.engine.resume(); // ignored: no earphones
    jest.advanceTimersByTime(60_000);
    expect(hh.plays).toHaveLength(1);
    hh.engine.onEarphones(true, Date.now());
    expect(hh.snap.phase).toBe('paused'); // a reconnect also needs the tester to resume
    hh.engine.resume();
  });
  expect(h.snap.result?.outcome).toBe('PASS');
  expect(h.plays).toHaveLength(POINTS * PER_POINT + 1); // the interrupted tone was replayed, nothing else changed
  expect(h.engine.log().trials).toHaveLength(POINTS * PER_POINT + CATCH);
  const reconnect = h.engine.log().device_changes_ms[1];
  expect(h.plays[1].t - reconnect).toBeGreaterThanOrEqual(cfg.noise.plug_guard_ms.value);
});

test('no earphones at start -> no tone is ever played (never through the loudspeaker)', () => {
  const h = harness({ earphones: false });
  h.engine.start();
  jest.advanceTimersByTime(60_000);
  expect(h.plays).toHaveLength(0);
  expect(h.snap.phase).toBe('paused');
});

test('floor (-160) metering during a tone is not quiet: the tone is replayed', () => {
  const h = harness({});
  let floor = true;
  h.engine.start();
  // replace the harness meter with -160 for the first presentation only
  const realOnSample = h.engine.onSample;
  h.engine.onSample = (db, t) => realOnSample(floor && h.plays.length === 1 ? -160 : db, t);
  for (let i = 0; i < 1200 && h.snap.phase !== 'done'; i++) {
    jest.advanceTimersByTime(1000);
    if (h.plays.length > 1) floor = false;
  }
  expect(h.engine.log().noise_events[0]).toMatchObject({ round: 1 });
  expect(h.plays[0]).toMatchObject({ ear: h.plays[1].ear, freq: h.plays[1].freq });
});

// Playback-start timing (ERR-026)
const tones = (h: Harness) => h.engine.log().trials.filter((t) => t.kind === 'tone');
const withOrigin = (o: string) => ({ ...cfg, response: { ...cfg.response, timing_origin: { value: o, source: 'test' } } });

test('player-reported start is logged per tone; by default response time still runs from play()', () => {
  const h = run({ playLatencyMs: 300, responseMs: 600 });
  expect(h.snap.result?.outcome).toBe('PASS');
  expect(tones(h).every((t) => t.play_latency_ms === 300 && t.response_ms === 600)).toBe(true);
});

test('timing_origin playback_start: response and window run from playback start', () => {
  const late = cfg.response.response_window_ms.value + 500; // after play(): too late from the play() call...
  const h = run({ playLatencyMs: 800, responseMs: late, config: withOrigin('playback_start') });
  expect(h.snap.result?.outcome).toBe('PASS'); // ...but in the window from actual playback start
  expect(tones(h).every((t) => t.response_ms === late - 800 && t.play_latency_ms === 800)).toBe(true);
});

test('no playback report: latency is null and response time falls back to play()', () => {
  const h = run({ responseMs: 600, config: withOrigin('playback_start') });
  expect(h.snap.result?.outcome).toBe('PASS');
  expect(tones(h).every((t) => t.play_latency_ms === null && t.response_ms === 600)).toBe(true);
});
