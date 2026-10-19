// ERR-032: the result screen saved the session (which stops the mic and sets the parent's state) during render.
// Also: the UNCALIBRATED and provisional-calibration notes follow the config (calibration.*, ERR-044).
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
const PROV = 'Provisional calibration: 1–4 kHz may be louder than intended.';

function shown(c: typeof cfg, text = UNCAL) {
  const p = playback(c);
  let r: ReturnType<typeof create>;
  act(() => {
    r = create(<ResultStep snap={snap} calibrated={p.calibrated} provisional={p.provisional}
      onSave={() => ({ sessionId: 's', caseId: null })} />);
  });
  return r!.root.findAllByType(Text).some((n) => n.props.children === text);
}

const withCal = (level: number | null, base: Record<string, number | null>, provisional = false) => ({
  ...cfg,
  screening_level_db_re_team_baseline: { value: level, source: 'test' },
  calibration: { ...cfg.calibration, baseline_dbfs: { value: base, source: 'test' }, provisional: { value: provisional, source: 'test' } },
});

test('UNCALIBRATED note: shown until calibrated, gone once the team baseline and screening level are in config', () => {
  const none = { 500: null, 1000: null, 2000: null, 4000: null };
  expect(shown(withCal(null, none))).toBe(true);
  expect(shown(withCal(20, { 500: -60, 1000: -70, 2000: -72, 4000: -66 }))).toBe(false);
});

test('provisional note: only while calibrated with a baseline marked provisional; the real config shows it', () => {
  const none = { 500: null, 1000: null, 2000: null, 4000: null };
  const base = { 500: -35, 1000: -60, 2000: -60, 4000: -60 };
  expect([shown(withCal(20, base, true), PROV), shown(withCal(20, base, true))]).toEqual([true, false]);
  expect(shown(withCal(20, base, false), PROV)).toBe(false);
  expect(shown(withCal(null, none, true), PROV)).toBe(false); // uncalibrated: the UNCALIBRATED note instead
  expect(shown(cfg, PROV)).toBe(true);
});
