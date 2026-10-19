// Tone player handling that cuts the start delay (ERR-026): every player is warmed up once before the test and
// rewound as soon as it stops, so play() starts the sound with no seek in the way.
// Plain functions over a minimal player shape, so jest can drive them without native audio.
import { volumeAt } from '@/engine/calibration';
import { v, type Config } from '@/rules';

export type TonePlayer = {
  volume: number;
  currentTime: number;
  play(): void;
  pause(): void;
  seekTo(seconds: number): Promise<void>;
};

/** Pause and go back to the start now, so the next play() needs no seek. */
export function rewind(p: TonePlayer) {
  p.pause();
  if (p.currentTime > 0) void p.seekTo(0);
}

export function playFromStart(p: TonePlayer, volume: number) {
  p.volume = volume;
  if (p.currentTime > 0) void p.seekTo(0); // not rewound yet (should not happen): seek, as before ERR-026
  p.play();
}

/** Plays every player once at volume 0 and waits until each reports playing (or `timeoutMs`). Prepares each
 *  player's audio output before the first real tone. Silent: nothing is heard. The caller rewinds them after. */
export async function warmUp(
  players: TonePlayer[],
  onPlaying: (p: TonePlayer, fn: () => void) => () => void, // subscribe to "this player is playing"; returns unsubscribe
  timeoutMs: number,
  setTimer: (fn: () => void, ms: number) => unknown = setTimeout,
) {
  await Promise.all(players.map((p) => new Promise<void>((resolve) => {
    let off = () => {};
    const done = () => { off(); resolve(); };
    off = onPlaying(p, done);
    setTimer(done, timeoutMs);
    p.volume = 0;
    p.play();
  })));
}

/** Player volume per frequency. Uncalibrated (no screening level yet): the placeholder volume, sessions marked
 *  UNCALIBRATED. Calibrated: team baseline (dB re full scale) + screening level (dB re: team baseline). Checked for
 *  every frequency the test can play before any test starts, so a gap fails at screen load, never mid-test. */
export function playback(cfg: Config): { volumeFor: (freq: number) => number; calibrated: boolean } {
  const level = v(cfg, 'screening_level_db_re_team_baseline') as number | null;
  if (level === null) {
    const vol = v(cfg, 'tone', 'uncalibrated_player_volume') as number;
    return { volumeFor: () => vol, calibrated: false };
  }
  const base = v(cfg, 'calibration', 'baseline_dbfs') as Record<string, number | null>;
  const vols: Record<string, number> = {};
  for (const f of [...v(cfg, 'frequencies_hz'), 500]) {
    const b = base[String(f)];
    if (b === null || b === undefined) throw new Error(`No calibration baseline for ${f} Hz (config calibration.baseline_dbfs).`);
    if (b + level > 0) throw new Error(`${f} Hz: baseline ${b} + level ${level} dB is above full scale; cannot play it.`);
    vols[String(f)] = volumeAt(b + level);
  }
  return { volumeFor: (freq) => vols[String(freq)], calibrated: true };
}
