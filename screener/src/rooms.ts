// Quiet-spot finder: room-noise readings (same measurement as the pre-test room-noise step, relative to config
// noise.reference_quiet_db, never decibels) ranked by room and hour of day, quietest first.
export type RoomReading = { room: string; slot: number; db_re_reference: number }; // slot = hour of day, 0-23

export type Spot = { room: string; slot: number; median: number; n: number };

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** One spot per room (case and spaces ignored) and hour, by median reading; ties: more readings first, then name. */
export function rankQuietSpots(readings: RoomReading[]): Spot[] {
  const groups = new Map<string, { room: string; slot: number; dbs: number[] }>();
  for (const r of readings) {
    const key = `${r.room.trim().toLowerCase()}|${r.slot}`;
    const g = groups.get(key) ?? { room: r.room.trim(), slot: r.slot, dbs: [] };
    g.dbs.push(r.db_re_reference);
    groups.set(key, g);
  }
  return [...groups.values()]
    .map((g) => ({ room: g.room, slot: g.slot, median: median(g.dbs), n: g.dbs.length }))
    .sort((a, b) => a.median - b.median || b.n - a.n || a.room.localeCompare(b.room));
}

export const slotLabel = (h: number) => `${String(h).padStart(2, '0')}:00–${String((h + 1) % 24).padStart(2, '0')}:00`;
