// Runs every shared fixture through the JS rule engine. pytest runs the same files through the Python reference.
import * as fs from 'fs';
import * as path from 'path';

import * as rules from '../index';

const ROOT = path.resolve(__dirname, '../../../..');
const FIX = path.join(ROOT, 'shared', 'fixtures');
const read = (p: string) => JSON.parse(fs.readFileSync(p, 'utf8'));
const CONFIG = read(path.join(FIX, 'fixture_config.json'));

function withOverrides(cfg: rules.Config, overrides: Record<string, unknown> = {}) {
  const copy = structuredClone(cfg);
  for (const [dotted, value] of Object.entries(overrides)) {
    let node = copy;
    for (const key of dotted.split('.')) node = node[key];
    node.value = value;
  }
  return copy;
}

function call(fn: string, input: any, cfg: rules.Config): unknown {
  switch (fn) {
    case 'decide_outcome': return rules.decideOutcome(input.trials, input.noise_events, cfg);
    case 'rescreen_plan': return rules.rescreenPlan(input.trials, input.noise_events, cfg);
    case 'reliability_score': return rules.reliabilityScore(input.trials, cfg);
    case 'apply_500hz_policy': return rules.apply500HzPolicy(input.ambient_db_re_baseline, cfg);
    case 'triage_route': return rules.triageRoute(input.answers, cfg);
    case 'noise_verdict': return rules.noiseVerdict(input.samples, input.mic_start_ms, input.device_changes_ms, cfg);
    case 'ambient_level': return rules.ambientLevel(input.samples, input.mic_start_ms, input.device_changes_ms, cfg);
    default: throw new Error(fn);
  }
}

const cases = fs.readdirSync(FIX)
  .filter((f) => f.endsWith('.json') && f !== 'fixture_config.json')
  .sort()
  .flatMap((f) => {
    const data = read(path.join(FIX, f));
    return data.cases.map((c: any) => [`${data.function}: ${c.name}`, data.function, c] as const);
  });

test('at least 30 fixtures', () => {
  expect(cases.length).toBeGreaterThanOrEqual(30);
});

test.each(cases)('%s', (_name, fn, c) => {
  const cfg = withOverrides(CONFIG, c.config_overrides);
  if (c.expected_error) {
    expect(() => call(fn, c.input, cfg)).toThrow();
  } else {
    // toStrictEqual would also flag undefined vs missing keys; JSON round-trip compares exactly what Python sees.
    expect(JSON.parse(JSON.stringify(call(fn, c.input, cfg)))).toStrictEqual(c.expected);
  }
});
