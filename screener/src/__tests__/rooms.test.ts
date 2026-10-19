import { rankQuietSpots, slotLabel } from '../rooms';

test('quietest room and hour first, by median; spelling variants of a room merge, hours stay apart', () => {
  const spots = rankQuietSpots([
    { room: 'Library', slot: 10, db_re_reference: -4 },
    { room: 'library ', slot: 10, db_re_reference: -8 },
    { room: 'Library', slot: 10, db_re_reference: 20 }, // one loud moment: the median ignores it
    { room: 'Library', slot: 13, db_re_reference: 6 },
    { room: 'Room 4B', slot: 10, db_re_reference: -2 },
  ]);
  expect(spots).toEqual([
    { room: 'Library', slot: 10, median: -4, n: 3 },
    { room: 'Room 4B', slot: 10, median: -2, n: 1 },
    { room: 'Library', slot: 13, median: 6, n: 1 },
  ]);
});

test('ties: more readings first, then by name; nothing measured, nothing ranked', () => {
  const spots = rankQuietSpots([
    { room: 'B', slot: 9, db_re_reference: 0 },
    { room: 'A', slot: 9, db_re_reference: 0 },
    { room: 'C', slot: 9, db_re_reference: -1 }, { room: 'C', slot: 9, db_re_reference: 1 },
  ]);
  expect(spots.map((s) => s.room)).toEqual(['C', 'A', 'B']);
  expect(rankQuietSpots([])).toEqual([]);
});

test('hour labels', () => {
  expect([slotLabel(9), slotLabel(23)]).toEqual(['09:00–10:00', '23:00–00:00']);
});
