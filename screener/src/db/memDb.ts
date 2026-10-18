// Test-only: an in-memory SQLite (node:sqlite) with the app's schema. Never imported by app code.
import { DatabaseSync } from 'node:sqlite';

import { migrate, type Db } from './store';

export function memDb(): Db {
  const d = new DatabaseSync(':memory:');
  let depth = 0; // re-entrant, like src/db/index.ts
  const db: Db = {
    all: (sql, ...p) => d.prepare(sql).all(...(p as never[])) as never[],
    run: (sql, ...p) => { d.prepare(sql).run(...(p as never[])); },
    tx: (fn) => {
      if (depth) return fn();
      depth++;
      d.exec('BEGIN');
      try { fn(); d.exec('COMMIT'); } catch (e) { d.exec('ROLLBACK'); throw e; } finally { depth--; }
    },
  };
  migrate(db);
  return db;
}
