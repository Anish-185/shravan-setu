import { pick, STRINGS, tr } from '../strings';

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
