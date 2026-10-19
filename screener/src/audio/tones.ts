// Tone player handling that cuts the start delay (ERR-026): every player is warmed up once before the test and
// rewound as soon as it stops, so play() starts the sound with no seek in the way.
// Plain functions over a minimal player shape, so jest can drive them without native audio.

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
