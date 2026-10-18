// ERR-032: the result screen saved the session (which stops the mic and sets the parent's state) during render.
import { useState } from 'react';
import { Text } from 'react-native';
import { act, create } from 'react-test-renderer';

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
