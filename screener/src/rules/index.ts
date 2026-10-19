// Screening rule engine: JS port of server/referrals/rules/__init__.py (the Python reference).
// Pure functions, no I/O. Every threshold comes from config/screening.json, passed in as `cfg`.
// Must give identical output for every fixture in shared/fixtures/. Screening and triage, never a diagnosis.

export type Ear = 'left' | 'right';
export type Trial = {
  round: number;
  kind: 'tone' | 'catch';
  ear?: Ear;
  freq?: number;
  responded: boolean;
  response_ms: number | null;
  /** Player-reported playback start minus the play() call (tone, or the silent clip of a catch trial). Log only. */
  play_latency_ms?: number | null;
};
export type NoiseEvent = { round: number; ear: Ear; freq: number };
/** One mic metering reading (relative, uncalibrated). */
export type Sample = { t: number; db: number | null };
export type Outcome = 'PASS' | 'RETEST' | 'REFER';
export type Config = Record<string, any>;

type PointStatus = 'heard' | 'not_heard' | 'noisy' | 'not_tested';

const POINT_TEXT: Record<string, (ear: string, freq: number, n: number) => string> = {
  not_heard_confirmed: (e, f) => `${e} ear ${f} Hz: not heard, confirmed on rescreen.`,
  not_heard: (e, f) => `${e} ear ${f} Hz: not heard.`,
  heard_on_rescreen: (e, f) => `${e} ear ${f} Hz: missed at first, heard on rescreen.`,
  noisy: (e, f, n) => `${e} ear ${f} Hz: too noisy to test (${n} tones discarded for noise).`,
  not_tested: (e, f) => `${e} ear ${f} Hz: not tested.`,
  rescreen_missing: (e, f) => `${e} ear ${f} Hz: missed in the first round and not rescreened yet.`,
};

export function v(cfg: Config, ...path: string[]): any {
  let node = cfg;
  for (const key of path) node = node[key];
  return node.value;
}

function inWindow(t: Trial, cfg: Config): boolean {
  const ms = t.response_ms;
  return ms !== null && v(cfg, 'response', 'min_response_ms') <= ms && ms <= v(cfg, 'response', 'response_window_ms');
}

export function reliabilityScore(trials: Trial[], cfg: Config) {
  const katch = trials.filter((t) => t.kind === 'catch');
  const tones = trials.filter((t) => t.kind === 'tone');
  const falseAlarms = katch.filter((t) => t.responded).length;
  const outOfWindow = tones.filter((t) => t.responded && !inWindow(t, cfg)).length;
  const total = katch.length + tones.length;
  return {
    score: total === 0 ? 1.0 : 1 - (falseAlarms + outOfWindow) / total,
    catch_trials: katch.length,
    false_alarms: falseAlarms,
    tone_trials: tones.length,
    out_of_window: outOfWindow,
  };
}

function pointStatus(
  trials: Trial[], noise: NoiseEvent[], rnd: number, ear: Ear, freq: number, cfg: Config,
): [PointStatus, number] {
  const tones = trials.filter((t) => t.kind === 'tone' && t.round === rnd && t.ear === ear && t.freq === freq);
  if (tones.length === 0) {
    const noisy = noise.filter((n) => n.round === rnd && n.ear === ear && n.freq === freq).length;
    return noisy ? ['noisy', noisy] : ['not_tested', 0];
  }
  const hits = tones.filter((t) => t.responded && inWindow(t, cfg)).length;
  return hits >= v(cfg, 'min_hits_per_point') ? ['heard', 0] : ['not_heard', 0];
}

/** Configured ears x frequencies, plus any extra frequency that was actually tested (e.g. 500 Hz). */
function points(trials: Trial[], cfg: Config): [Ear, number][] {
  const freqs = new Set<number>(v(cfg, 'frequencies_hz'));
  for (const t of trials) if (t.kind === 'tone') freqs.add(t.freq as number);
  const sorted = [...freqs].sort((a, b) => a - b);
  return (v(cfg, 'ears') as Ear[]).flatMap((ear) => sorted.map((f) => [ear, f] as [Ear, number]));
}

const rescreenOn = (cfg: Config) => v(cfg, 'rescreen', 'enabled') && v(cfg, 'rescreen', 'max_rounds') >= 1;

/** Points to retest right away: those not heard in round 1. Empty if rescreen is off. */
export function rescreenPlan(trials: Trial[], noise: NoiseEvent[], cfg: Config): [Ear, number][] {
  if (!rescreenOn(cfg)) return [];
  return points(trials, cfg).filter(([ear, f]) => pointStatus(trials, noise, 1, ear, f, cfg)[0] === 'not_heard');
}

/** Trusted metering values: not missing or at the floor (-160 = no data, never 'quiet'), not in the mic settle
 * time, not within plug_guard_ms of an earphone connect/disconnect. */
function validDb(samples: Sample[], micStartMs: number, deviceChangesMs: number[], cfg: Config): number[] {
  const settle = v(cfg, 'noise', 'mic_settle_ms');
  const guard = v(cfg, 'noise', 'plug_guard_ms');
  const floor = v(cfg, 'noise', 'invalid_at_or_below_db');
  return samples
    .filter((s) => s.db !== null && s.db > floor && s.t - micStartMs >= settle
      && deviceChangesMs.every((d) => Math.abs(s.t - d) >= guard))
    .map((s) => s.db as number);
}

/** During-tone noise gate for one presentation: ok | noisy (discard, replay) | unknown (too few valid samples). */
export function noiseVerdict(samples: Sample[], micStartMs: number, deviceChangesMs: number[], cfg: Config) {
  const db = validDb(samples, micStartMs, deviceChangesMs, cfg);
  const peak = db.length ? Math.max(...db) : null;
  let verdict: 'ok' | 'noisy' | 'unknown';
  if (db.length < v(cfg, 'noise', 'min_valid_samples_per_tone')) verdict = 'unknown';
  else if ((peak as number) >= v(cfg, 'noise', 'saturated_at_or_above_db')
    || (peak as number) > v(cfg, 'noise', 'reference_quiet_db') + v(cfg, 'noise', 'gate_db_above_baseline')) {
    verdict = 'noisy';
  } else verdict = 'ok';
  return { verdict, valid: db.length, max_db: peak };
}

/** Pre-test room noise: median valid metering minus the reference quiet level. null if too few valid samples. */
export function ambientLevel(samples: Sample[], micStartMs: number, deviceChangesMs: number[], cfg: Config) {
  const db = validDb(samples, micStartMs, deviceChangesMs, cfg).sort((a, b) => a - b);
  if (db.length < v(cfg, 'noise', 'min_valid_samples_per_tone')) return { db_re_reference: null, valid: db.length };
  const mid = db.length >> 1;
  const median = db.length % 2 ? db[mid] : (db[mid - 1] + db[mid]) / 2;
  return { db_re_reference: median - v(cfg, 'noise', 'reference_quiet_db'), valid: db.length };
}

export function apply500HzPolicy(ambientDbReBaseline: number | null, cfg: Config) {
  const mode = v(cfg, 'policy_500hz', 'mode');
  if (mode === 'always') return { include: true, reason: '500 Hz policy: always tested.' };
  if (mode === 'never') return { include: false, reason: '500 Hz policy: never tested.' };
  if (mode !== 'only_if_ambient_below') throw new Error(`unknown policy_500hz mode '${mode}'`);
  if (ambientDbReBaseline === null) return { include: false, reason: '500 Hz skipped: no room noise measurement.' };
  if (ambientDbReBaseline < v(cfg, 'policy_500hz', 'ambient_threshold_db_re_baseline')) {
    return { include: true, reason: '500 Hz tested: room noise below the limit.' };
  }
  return { include: false, reason: '500 Hz skipped: room too noisy for low tones.' };
}

/** PASS / RETEST / REFER with reasons. Unreliable responses give RETEST, never REFER. */
export function decideOutcome(trials: Trial[], noise: NoiseEvent[], cfg: Config) {
  const ears: Ear[] = v(cfg, 'ears');
  const rel = reliabilityScore(trials, cfg);
  const result = {
    outcome: null as Outcome | null,
    ear_outcomes: {} as Record<string, Outcome>,
    point_status: {} as Record<string, string>,
    reliability: rel,
    reasons: [] as string[],
  };
  const everything = (outcome: Outcome, reasons: string[]) => {
    result.outcome = outcome;
    result.ear_outcomes = Object.fromEntries(ears.map((e) => [e, outcome]));
    result.reasons = reasons;
    return result;
  };

  const minCatch = v(cfg, 'reliability', 'min_catch_trials');
  if (rel.catch_trials < minCatch) {
    return everything('RETEST', [
      `Retest: only ${rel.catch_trials} silent check trials were done (${minCatch} needed).`]);
  }

  const faBad = rel.false_alarms > v(cfg, 'reliability', 'max_false_alarm_rate') * rel.catch_trials;
  const oowBad = rel.out_of_window > v(cfg, 'reliability', 'max_out_of_window_rate') * rel.tone_trials;
  if (faBad || oowBad) {
    const reasons = ['Retest: responses were not reliable, so this test cannot refer.'];
    if (faBad) reasons.push(`${rel.false_alarms} of ${rel.catch_trials} silent check trials got a tap.`);
    if (oowBad) {
      reasons.push(`${rel.out_of_window} of ${rel.tone_trials} tone trials got a tap outside the response window.`);
    }
    return everything('RETEST', reasons);
  }

  const earFlags: Record<string, Set<string>> = Object.fromEntries(ears.map((e) => [e, new Set<string>()]));
  for (const [ear, freq] of points(trials, cfg)) {
    let [status, n]: [string, number] = pointStatus(trials, noise, 1, ear, freq, cfg);
    if (status === 'not_heard' && rescreenOn(cfg)) {
      let status2: string;
      [status2, n] = pointStatus(trials, noise, 2, ear, freq, cfg);
      const map: Record<string, string> = {
        heard: 'heard_on_rescreen', not_heard: 'not_heard_confirmed', not_tested: 'rescreen_missing',
      };
      status = map[status2] ?? status2;
    }
    result.point_status[`${ear}-${freq}`] = status;
    if (status !== 'heard') {
      result.reasons.push(POINT_TEXT[status](ear[0].toUpperCase() + ear.slice(1), freq, n));
    }
    earFlags[ear].add(status);
  }

  for (const [ear, flags] of Object.entries(earFlags)) {
    const has = (...s: string[]) => s.some((x) => flags.has(x));
    result.ear_outcomes[ear] = has('not_heard', 'not_heard_confirmed')
      ? 'REFER'
      : has('noisy', 'not_tested', 'rescreen_missing') ? 'RETEST' : 'PASS';
  }

  const outcomes = new Set(Object.values(result.ear_outcomes));
  result.outcome = outcomes.has('REFER') ? 'REFER' : outcomes.has('RETEST') ? 'RETEST' : 'PASS';
  if (result.outcome === 'PASS' && result.reasons.length === 0) result.reasons.push('All tones were heard in both ears.');
  return result;
}

/** Yes/no checklist -> PHC or DEIC with the rule that fired. Triage, not diagnosis. */
export function triageRoute(answers: Record<string, unknown>, cfg: Config) {
  for (const rule of v(cfg, 'triage', 'rules')) {
    if (rule.if_any_yes.some((q: string) => answers[q] === true)) {
      return { route: rule.route, rule: rule.id, reason: rule.reason };
    }
  }
  return { route: v(cfg, 'triage', 'default_route'), rule: 'default', reason: v(cfg, 'triage', 'default_reason') };
}

// Referral case state machine: the follow-up protocol (port of the table in referrals/rules), not a threshold.
export const LOST = 'closed_lost_to_followup';
export const TRANSITIONS: Record<string, string[]> = {
  screened: ['referred'],
  referred: ['camp_scheduled', LOST],
  camp_scheduled: ['seen', 'missed', LOST],
  missed: ['rescheduled', LOST],
  rescheduled: ['camp_scheduled', LOST],
  seen: ['treated', LOST],
  treated: ['closed'],
  closed: [],
  [LOST]: [],
};
export const TREATMENTS = ['wax_removed', 'infection_treated', 'hearing_aid', 'further_audiology'] as const;

/** Legal next statuses, sorted like Python's sorted() (code-point order). */
export function nextStatuses(fromStatus: string): string[] {
  return [...(TRANSITIONS[fromStatus] ?? [])].sort();
}

export function checkTransition(fromStatus: string, toStatus: string, treatment = '', reason = '') {
  if (!(TRANSITIONS[fromStatus] ?? []).includes(toStatus)) return { allowed: false, why: 'illegal' };
  if (toStatus === 'treated' && !(TREATMENTS as readonly string[]).includes(treatment)) {
    return { allowed: false, why: 'needs_treatment' };
  }
  if (toStatus === LOST && !reason.trim()) return { allowed: false, why: 'needs_reason' };
  return { allowed: true };
}

