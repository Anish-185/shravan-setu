// Tamper-evident audit log: hash chain over append-only entries. Pure functions, no I/O. JS port of
// server/referrals/rules/audit.py; both must pass shared/fixtures/verify_audit_chain.json.
// hash = SHA-256 hex of the JSON array [seq, at, kind, record_id, data, prev]; `data` is the stored JSON text, never
// re-serialized. Detects any edited, inserted, deleted or reordered entry; deleting the newest entries shows only
// against a head hash written down earlier.
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';

export const GENESIS = '0'.repeat(64);

export type AuditEntry = {
  seq: number; at: string; kind: string; record_id: string; data: string; prev: string; hash: string;
};

export function entryHash(e: Omit<AuditEntry, 'hash'>): string {
  return bytesToHex(sha256(utf8ToBytes(JSON.stringify([e.seq, e.at, e.kind, e.record_id, e.data, e.prev]))));
}

/** The entry that follows `last` (null for an empty log). */
export function nextEntry(last: AuditEntry | null, at: string, kind: string, recordId: string, data: string): AuditEntry {
  const e = { seq: last ? last.seq + 1 : 1, at, kind, record_id: recordId, data, prev: last ? last.hash : GENESIS };
  return { ...e, hash: entryHash(e) };
}

export type Verdict = {
  ok: boolean; entries: number; head: string | null; broken_at: number | null; why: 'seq' | 'prev' | 'hash' | null;
};

export function verifyChain(entries: AuditEntry[]): Verdict {
  let prev = GENESIS;
  for (let i = 1; i <= entries.length; i++) {
    const e = entries[i - 1];
    const why = e.seq !== i ? 'seq' : e.prev !== prev ? 'prev' : entryHash(e) !== e.hash ? 'hash' : null;
    if (why) return { ok: false, entries: entries.length, head: null, broken_at: i, why };
    prev = e.hash;
  }
  return { ok: true, entries: entries.length, head: entries.at(-1)?.hash ?? null, broken_at: null, why: null };
}
