// Biological calibration: threshold search for one ear and frequency ("down 10, up 5" bracketing).
// Levels are dB re the tone file's full scale at player volume 1.0. Team-only tool, not a screening or a diagnosis.
// Pure state machine; every parameter comes from config calibration.*.
import { v, type Config } from '@/rules';

export type Search = {
  level: number; // next presentation level
  lastHeard: boolean | null; // null before the first presentation
  ascending: Record<string, { n: number; heard: number }>; // by level: presentations reached by stepping up
  floorHeard: number;
  presentations: { level: number; heard: boolean }[];
  done: boolean;
  threshold: number | null; // dB re full scale; null = none found
  result: 'threshold' | 'at_floor' | 'no_response_at_max' | 'too_many_presentations' | null;
};

export function startSearch(cfg: Config): Search {
  return {
    level: v(cfg, 'calibration', 'start_db'), lastHeard: null, ascending: {}, floorHeard: 0,
    presentations: [], done: false, threshold: null, result: null,
  };
}

const finish = (s: Search, result: NonNullable<Search['result']>, threshold: number | null): Search =>
  ({ ...s, done: true, result, threshold });

/** Records whether the presentation at `s.level` was heard and picks the next level. */
export function step(s: Search, heard: boolean, cfg: Config): Search {
  if (s.done) return s;
  const c = (k: string) => v(cfg, 'calibration', k);
  const level = s.level;
  const presentations = [...s.presentations, { level, heard }];
  const ascending = { ...s.ascending };
  if (s.lastHeard === false) { // reached by stepping up after a miss
    const a = ascending[level] ?? { n: 0, heard: 0 };
    ascending[level] = { n: a.n + 1, heard: a.heard + (heard ? 1 : 0) };
  }
  const floorHeard = s.floorHeard + (heard && level <= c('min_db') ? 1 : 0);
  let next: Search = { ...s, presentations, ascending, floorHeard, lastHeard: heard };

  if (heard && (ascending[level]?.heard ?? 0) >= c('heard_needed')) return finish(next, 'threshold', level);
  if (floorHeard >= c('heard_needed')) return finish(next, 'at_floor', c('min_db'));
  const missesAtMax = presentations.filter((p) => p.level >= c('max_db') && !p.heard).length;
  if (missesAtMax >= c('heard_needed')) return finish(next, 'no_response_at_max', null);
  if (presentations.length >= c('max_presentations')) return finish(next, 'too_many_presentations', null);

  const target = heard ? level - c('step_down_db') : level + c('step_up_db');
  next = { ...next, level: Math.min(c('max_db'), Math.max(c('min_db'), target)) };
  return next;
}

/** Player volume (linear gain 0..1) for a level in dB re full scale. */
export const volumeAt = (db: number) => Math.min(1, 10 ** (db / 20));

/** Heard = a tap from the reported playback start to the end of the response window. null = playback never
 *  reported, so the presentation doesn't count and is repeated at the same level. */
export function judge(taps: number[], playStart: number | null, windowMs: number): boolean | null {
  if (playStart === null) return null;
  return taps.some((t) => t >= playStart && t <= playStart + windowMs);
}
