// The app's SQLite database (expo-sqlite, bundled in Expo Go). Kept apart from store.ts so tests can use node:sqlite.
import { openDatabaseSync } from 'expo-sqlite';

import { migrate, type Db } from './store';

const sqlite = openDatabaseSync('screener.db');

export const db: Db = {
  all: (sql, ...params) => sqlite.getAllSync(sql, params as never),
  run: (sql, ...params) => { sqlite.runSync(sql, params as never); },
  tx: (fn) => sqlite.withTransactionSync(fn),
};

migrate(db);
