import { pick, reasonMatch, reasonText, STRINGS, tr } from '../strings';

test('English text with placeholders filled', () => {
  expect(pick({ en: 'Hi {name}, {n} left', te: 'TODO_TE' }, 'en', { name: 'A1', n: 3 })).toBe('Hi A1, 3 left');
});

test('missing Telugu falls back to English, visibly', () => {
  expect(pick({ en: 'Sync now', te: 'TODO_TE' }, 'te')).toBe('[TODO_TE] Sync now');
});

test('written Telugu is used as is, placeholders filled', () => {
  expect(pick({ en: 'School: {name}', te: 'X {name}' }, 'te', { name: 'S' })).toBe('X S');
});

test('an unknown placeholder is left visible, not blanked', () => {
  expect(pick({ en: 'Room {value}', te: 'TODO_TE' }, 'en')).toBe('Room {value}');
});

test('every string has English, a Telugu slot and a "where" note for the translator', () => {
  for (const [key, v] of Object.entries(STRINGS)) {
    expect([key, v.en.trim().length > 0, v.te.trim().length > 0, v.where.trim().length > 0]).toEqual([key, true, true, true]);
  }
  expect(tr('en', 'banner')).toBe('Screening only, not a diagnosis');
});

test('every rule reason in the shared fixtures and the triage config has a reason.* template', () => {
  /* eslint-disable @typescript-eslint/no-require-imports */
  const fs = require('fs') as typeof import('fs');
  const path = require('path') as typeof import('path');
  const root = path.resolve(__dirname, '../../../..');
  const read = (p: string) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
  const reasons = [
    ...read('shared/fixtures/decide_outcome.json').cases.flatMap((c: any) => c.expected?.reasons ?? []),
    ...read('shared/fixtures/apply_500hz_policy.json').cases.map((c: any) => c.expected?.reason).filter(Boolean),
  ];
  const triage = read('config/screening.json').triage;
  reasons.push(...triage.rules.value.map((r: any) => r.reason), triage.default_reason.value);
  expect(reasons.length).toBeGreaterThan(10);
  for (const r of new Set(reasons)) {
    expect([r, reasonMatch(r)?.key.startsWith('reason.')]).toEqual([r, true]);
    expect(reasonText('en', r)).toBe(r); // the template fills back to the exact English
  }
});

test('reason Telugu: ear name translated, numbers kept, unknown reason falls back visibly', () => {
  expect(reasonText('te', 'Left ear 4000 Hz: not heard.')).toBe(pick(STRINGS['reason.notHeard'], 'te', { ear: 'ఎడమ', freq: '4000' }));
  expect(reasonText('te', 'Something new.')).toBe('[TODO_TE] Something new.');
});
