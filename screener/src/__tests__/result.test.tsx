// ERR-032: the result screen saved the session (which stops the mic and sets the parent's state) during render.
// Also: the UNCALIBRATED note follows the config, so it goes away by itself once the team baseline is filled in.
import * as fs from 'fs';
import * as path from 'path';
import { useState } from 'react';
import { Text } from 'react-native';
import { act, create } from 'react-test-renderer';

import { playback } from '../audio/tones';
import type { Snapshot } from '../engine/engine';
import { ResultStep } from '../result';

jest.mock('@/db', () => ({ db: {} }));
jest.mock('@/triage', () => ({ TriageForm: () => null }));
jest.mock('expo-file-system', () => ({}));
jest.mock('expo-sharing', () => ({}));
jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));

const snap = {
  phase: 'done',
  result: { outcome: 'REFER', ear_outcomes: { left: 'REFER', right: 'PASS' }, reasons: [] },
} as unknown as Snapshot;

test('saving on REFER updates the parent after render, not during it', () => {
  const errors = jest.spyOn(console, 'error').mockImplementation(() => {});
  const save = jest.fn();
  function Parent() {
    const [micOn, setMicOn] = useState(true);
    const [saved] = useState(() => ({ sessionId: 's1', caseId: 'c1' }));
    return (
      <>
        <Text>{micOn ? 'mic on' : 'mic off'}</Text>
        <ResultStep snap={snap} calibrated onSave={() => { save(); setMicOn(false); return saved; }} />
      </>
    );
  }
  let r: ReturnType<typeof create>;
  act(() => { r = create(<Parent />); });
  expect(errors.mock.calls.flat().join(' ')).not.toMatch(/Cannot update a component/);
  expect(r!.root.findAllByType(Text).some((n) => n.props.children === 'mic off')).toBe(true);
  expect(save).toHaveBeenCalled();
  errors.mockRestore();
});

const cfg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../config/screening.json'), 'utf8'));
const UNCAL = 'UNCALIBRATED test level (development volume). Not valid for real screening yet.';

function shown(c: typeof cfg) {
  let r: ReturnType<typeof create>;
  act(() => { r = create(<ResultStep snap={snap} calibrated={playback(c).calibrated} onSave={() => ({ sessionId: 's', caseId: null })} />); });
  return r!.root.findAllByType(Text).some((n) => n.props.children === UNCAL);
}

const withCal = (level: number | null, base: Record<string, number | null>) => ({
  ...cfg,
  screening_level_db_re_team_baseline: { value: level, source: 'test' },
  calibration: { ...cfg.calibration, baseline_dbfs: { value: base, source: 'test' } },
});

test('UNCALIBRATED note: shown until calibrated, gone once the team baseline and screening level are in config', () => {
  const none = { 500: null, 1000: null, 2000: null, 4000: null };
  expect(shown(withCal(null, none))).toBe(true);
  expect(shown(withCal(20, { 500: -60, 1000: -70, 2000: -72, 4000: -66 }))).toBe(false);
});
