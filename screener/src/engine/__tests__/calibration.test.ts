// Threshold search for the biological calibration (down 10 / up 5, threshold on ascending presentations).
import * as fs from 'fs';
import * as path from 'path';

import { judge, startSearch, step, volumeAt, type Search } from '../calibration';

const cfg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../../config/screening.json'), 'utf8'));
const C = (k: string) => cfg.calibration[k].value;

/** A listener who hears every tone at or above `threshold` (deterministic). */
function listen(threshold: number, s: Search = startSearch(cfg)) {
  for (let i = 0; i < 100 && !s.done; i++) s = step(s, s.level >= threshold, cfg);
  return s;
}

test('finds the threshold of a deterministic listener on the 5 dB grid', () => {
  for (const t of [-75, -60, -45, -42, -30, -10]) {
    const s = listen(t);
    expect(s.result).toBe('threshold');
    // lowest grid level at or above the true threshold (levels move from start_db in 5 dB steps)
    const grid = C('start_db') + Math.ceil((t - C('start_db')) / 5) * 5;
    expect(s.threshold).toBe(grid);
  }
});

test('starts at start_db, goes down 10 after a hit and up 5 after a miss', () => {
  let s = startSearch(cfg);
  expect(s.level).toBe(C('start_db'));
  s = step(s, true, cfg);
  expect(s.level).toBe(C('start_db') - C('step_down_db'));
  s = step(s, false, cfg);
  expect(s.level).toBe(C('start_db') - C('step_down_db') + C('step_up_db'));
});

test('only ascending presentations count towards the threshold', () => {
  // heard at -40 on the first (not ascending) presentation, then never again: no threshold at -40
  let s = startSearch(cfg);
  s = step(s, true, cfg); // -40, first presentation
  expect(s.ascending).toEqual({});
  s = step(s, false, cfg); // -50
  s = step(s, true, cfg); // -45 ascending, heard
  expect(s.ascending['-45']).toEqual({ n: 1, heard: 1 });
  expect(s.done).toBe(false);
});

test('a listener who hears everything ends at the floor, reported as at_floor', () => {
  const s = listen(-1000);
  expect(s.result).toBe('at_floor');
  expect(s.threshold).toBe(C('min_db'));
});

test('no response at the loudest level stops the search without a threshold', () => {
  const s = listen(1000);
  expect(s.result).toBe('no_response_at_max');
  expect(s.threshold).toBeNull();
  expect(Math.max(...s.presentations.map((p) => p.level))).toBe(C('max_db'));
});

test('an erratic listener stops after max_presentations', () => {
  let s = startSearch(cfg);
  let k = 0;
  // alternates hit/miss in a pattern that never gives two ascending hits at one level
  for (let i = 0; i < 100 && !s.done; i++) s = step(s, (k++ % 3) === 0, cfg);
  expect(s.done).toBe(true);
  expect(s.presentations.length).toBeLessThanOrEqual(C('max_presentations'));
});

test('volume conversion', () => {
  expect(volumeAt(0)).toBe(1);
  expect(volumeAt(-20)).toBeCloseTo(0.1);
  expect(volumeAt(-40)).toBeCloseTo(0.01);
  expect(volumeAt(6)).toBe(1); // never above full scale
});

test('judge: a tap counts only from the playback start to the end of the window', () => {
  expect(judge([1100], 1000, 2500)).toBe(true);
  expect(judge([900], 1000, 2500)).toBe(false); // before the sound started
  expect(judge([3600], 1000, 2500)).toBe(false); // after the window
  expect(judge([3500], 1000, 2500)).toBe(true); // window edge
  expect(judge([1100], null, 2500)).toBeNull(); // never reported playing: repeat
});
