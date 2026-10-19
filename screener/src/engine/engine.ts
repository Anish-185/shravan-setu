// Screening test engine: a timer-driven state machine. Screening only, never a diagnosis.
// All timing, randomness and audio go through `Port`, so tests drive it with fake timers and no real audio.
// Every threshold comes from config/screening.json (`cfg`); outcome logic is the shared rule engine (src/rules).
import {
  decideOutcome, noiseVerdict, rescreenPlan, v,
  type Config, type Ear, type NoiseEvent, type Sample, type Trial,
} from '@/rules';

export type Port = {
  now(): number;
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
  random(): number; // [0, 1)
  play(ear: Ear, freq: number): void; // starts one tone of tone.duration_ms
  playSilence(): void; // starts the silent clip for a catch trial: same player path and start delay as a tone
  stop(): void; // silences any tone now
};

export type Phase = 'ready' | 'running' | 'paused' | 'done' | 'aborted';
export type Snapshot = {
  phase: Phase;
  round: number;
  done: number;
  total: number;
  earphones: boolean;
  result: ReturnType<typeof decideOutcome> | null;
};

type Item = { kind: 'tone' | 'catch'; ear?: Ear; freq?: number; replays: number };
// onset = the play() call; playStart = when the player reported playing; tapAt = absolute tap time.
type Current = { item: Item; onset: number; playStart: number | null; tapAt: number | null };

export type EngineOptions = {
  include500: boolean; // from apply500HzPolicy on the pre-test ambient level
  micStartMs: number; // the mic runs for the whole test; settle time is measured from here
  earphones: boolean; // wired earphones present right now (from the audio device list, never getCurrentInput)
  deviceChangesMs?: number[]; // earlier connect/disconnect times (pre-test), for the plug guard
};

export function createEngine(cfg: Config, port: Port, opts: EngineOptions, onChange: (s: Snapshot) => void) {
  let phase: Phase = 'ready';
  let round = 1;
  let earphones = opts.earphones;
  let queue: Item[] = [];
  let current: Current | null = null;
  let last: Trial | null = null; // a tap after the window, before the next onset, belongs to this trial
  let lastOnset = 0;
  let timer: unknown = null;
  let done = 0;
  let result: Snapshot['result'] = null;
  const trials: Trial[] = [];
  const noise: NoiseEvent[] = [];
  const deviceChanges = [...(opts.deviceChangesMs ?? [])];
  const samples: Sample[] = [];
  const events: { t: number; event: string }[] = [];

  const log = (event: string) => events.push({ t: port.now(), event });
  const snapshot = (): Snapshot => ({ phase, round, done, total: done + queue.length, earphones, result });
  const emit = () => onChange(snapshot());
  const later = (fn: () => void, ms: number) => {
    port.clearTimeout(timer);
    timer = port.setTimeout(fn, ms);
  };

  function insertCatches(items: Item[], n: number) {
    for (let i = 0; i < n; i++) {
      items.splice(Math.floor(port.random() * (items.length + 1)), 0, { kind: 'catch', replays: 0 });
    }
    return items;
  }

  function tonesFor(points: [Ear, number][]): Item[] {
    const reps = v(cfg, 'presentations_per_point');
    return points.flatMap(([ear, freq]) =>
      Array.from({ length: reps }, () => ({ kind: 'tone' as const, ear, freq, replays: 0 })));
  }

  function gapMs() {
    const [lo, hi] = v(cfg, 'response', 'inter_stimulus_interval_ms');
    const gap = lo + port.random() * (hi - lo);
    // never start a tone inside the plug guard window after an earphone change
    const sinceChange = deviceChanges.length ? port.now() - deviceChanges[deviceChanges.length - 1] : Infinity;
    return Math.max(gap, v(cfg, 'noise', 'plug_guard_ms') - sinceChange);
  }

  function pause(reason: string) {
    port.stop();
    port.clearTimeout(timer);
    if (current) log(`discarded ${current.item.kind} (${reason})`);
    current = null;
    last = null;
    phase = 'paused';
    log(`paused: ${reason}`);
    emit();
  }

  function present() {
    const item = queue[0];
    if (!earphones) return pause('no earphones'); // never play a test tone through the loudspeaker
    current = { item, onset: port.now(), playStart: null, tapAt: null };
    last = null;
    if (item.kind === 'tone') {
      log(`tone ${item.ear} ${item.freq} round ${round}`);
      port.play(item.ear as Ear, item.freq as number);
    } else {
      log(`catch round ${round}`);
      port.playSilence();
    }
    later(endWindow, windowMs());
    emit();
  }

  const windowMs = () => Math.max(v(cfg, 'response', 'response_window_ms'), v(cfg, 'tone', 'duration_ms'));
  const fromPlayback = () => v(cfg, 'response', 'timing_origin') === 'playback_start';
  /** Where response time starts for this presentation (config response.timing_origin). */
  const origin = (c: Current) => (fromPlayback() && c.playStart !== null ? c.playStart : c.onset);

  /** Throws away the presentation at the head of the queue: replayed after the next gap, up to
   *  noise.max_replays_per_tone; after that it is dropped without a trial (the point becomes noisy / not tested). */
  function discard(item: Item, reason: string) {
    log(`discarded ${item.kind} (${reason})`);
    if (item.replays < v(cfg, 'noise', 'max_replays_per_tone')) {
      item.replays++;
      return next();
    }
    log(`dropped ${item.kind} after ${item.replays} replays`);
    queue.shift();
    done++;
    next();
  }

  function endWindow() {
    const cur = current as Current;
    current = null;
    const { item } = cur;
    // never confirmed playing: we can't say the tone (or silent clip) was presented, so the trial is invalid
    if (cur.playStart === null) return discard(item, 'no playback report');
    lastOnset = origin(cur);
    const tap = cur.tapAt === null ? null : cur.tapAt - origin(cur);
    const latency = cur.playStart - cur.onset;
    if (item.kind === 'tone') {
      // noise is judged while the tone actually sounded, from the same origin as the response time
      const o = origin(cur);
      const during = samples.filter((sm) => sm.t >= o && sm.t <= o + v(cfg, 'tone', 'duration_ms'));
      const nv = noiseVerdict(during, opts.micStartMs, deviceChanges, cfg);
      log(`noise ${nv.verdict} valid=${nv.valid} max=${nv.max_db}`);
      if (nv.verdict !== 'ok') {
        noise.push({ round, ear: item.ear as Ear, freq: item.freq as number });
        return discard(item, 'noise');
      }
      last = { round, kind: 'tone', ear: item.ear, freq: item.freq, responded: tap !== null, response_ms: tap, play_latency_ms: latency };
    } else {
      last = { round, kind: 'catch', responded: tap !== null, response_ms: tap, play_latency_ms: latency };
    }
    trials.push(last);
    queue.shift();
    done++;
    next();
  }

  function next() {
    if (queue.length === 0) return endRound();
    emit();
    later(present, gapMs());
  }

  function endRound() {
    const plan = round === 1 ? rescreenPlan(trials, noise, cfg) : [];
    if (plan.length === 0) return finish();
    round = 2;
    log(`rescreen ${plan.map(([e, f]) => `${e}-${f}`).join(' ')}`);
    queue = insertCatches(tonesFor(plan), v(cfg, 'rescreen', 'catch_trials'));
    next();
  }

  function finish() {
    // ponytail: a late tap on the very last trial arrives after this and is dropped (counts as no response);
    // add a short tail wait before finishing if field sessions show it matters.
    port.stop();
    result = decideOutcome(trials, noise, cfg);
    phase = 'done';
    log(`done ${result.outcome}`);
    emit();
  }

  return {
    start() {
      const freqs: number[] = [...v(cfg, 'frequencies_hz'), ...(opts.include500 ? [500] : [])];
      const points = (v(cfg, 'ears') as Ear[]).flatMap((ear) => freqs.map((f) => [ear, f] as [Ear, number]));
      queue = insertCatches(tonesFor(points), v(cfg, 'reliability', 'catch_trials'));
      phase = 'running';
      log(`start include500=${opts.include500}`);
      next();
    },
    /** One mic metering reading. `db` null or at the floor is kept and treated as invalid by the noise rule. */
    onSample(db: number | null, t: number) {
      samples.push({ t, db });
    },
    onTap(t: number) {
      if (current && current.tapAt === null) current.tapAt = t;
      else if (!current && last && !last.responded) {
        // late tap in the gap: counts against reliability (out of window / false alarm), never as heard
        last.responded = true;
        last.response_ms = t - lastOnset;
      }
      log('tap');
    },
    /** The player reported that playback started; `t` is our best estimate of that moment (JS clock).
     *  Tones and the silent catch clip alike, so catch trials are timed from the same reference. */
    onPlaybackStart(t: number) {
      const c = current;
      if (!c || c.playStart !== null || t < c.onset) return;
      const latency = Math.round(t - c.onset);
      if (latency > v(cfg, 'response', 'max_play_latency_ms')) {
        // started too late (pipeline stall): stop it and replay, like a noise-gated tone
        port.stop();
        port.clearTimeout(timer);
        current = null;
        return discard(c.item, `late start +${latency}ms`);
      }
      c.playStart = t;
      log(`playing +${latency}ms`);
      // the window runs from playback start too, so a late start doesn't shorten it
      if (fromPlayback()) later(endWindow, Math.max(0, t + windowMs() - port.now()));
    },
    /** Wired earphones appeared or disappeared (audio device list). Any change pauses and invalidates the tone. */
    onEarphones(connected: boolean, t: number) {
      if (connected === earphones) return;
      earphones = connected;
      deviceChanges.push(t);
      log(`earphones ${connected ? 'connected' : 'disconnected'}`);
      if (phase === 'running') pause(connected ? 'earphones changed' : 'earphones disconnected');
      else emit();
    },
    resume() {
      if (phase !== 'paused' || !earphones) return;
      phase = 'running';
      log('resumed');
      next();
    },
    abort() {
      port.stop();
      port.clearTimeout(timer);
      phase = 'aborted';
      log('aborted');
      emit();
    },
    snapshot,
    log: () => ({
      timing_origin: v(cfg, 'response', 'timing_origin') as string,
      trials, noise_events: noise, device_changes_ms: deviceChanges, samples, events,
    }),
  };
}

export type Engine = ReturnType<typeof createEngine>;
