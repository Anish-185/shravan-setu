// Tone player handling (ERR-026): warm-up, rewind after stop, and play without a seek.
import { playFromStart, rewind, warmUp, type TonePlayer } from '../tones';

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
