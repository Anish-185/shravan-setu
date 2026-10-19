"""Tamper-evident audit log: hash chain over append-only entries. Pure functions, no I/O.

The JS port in screener/src/rules/audit.ts must give identical output (shared/fixtures/verify_audit_chain.json).
Entry: {"seq": 1.., "at": ISO text, "kind": record type, "record_id": text, "data": JSON text as stored, "prev": hash
of the entry before (GENESIS for the first), "hash": SHA-256 hex of the JSON array [seq, at, kind, record_id, data,
prev]}. `data` is hashed as the stored text, never re-serialized, so Python and JS agree on floats.
Detects any edited, inserted, deleted or reordered entry. Deleting the newest entries is only visible against a head
hash written down earlier (the verify result gives it).
"""
import hashlib
import json

GENESIS = "0" * 64


def entry_hash(e):
    body = json.dumps([e["seq"], e["at"], e["kind"], e["record_id"], e["data"], e["prev"]],
                      ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256(body.encode("utf-8")).hexdigest()


def next_entry(last, at, kind, record_id, data):
    """The entry that follows `last` (None for an empty log)."""
    e = {"seq": last["seq"] + 1 if last else 1, "at": at, "kind": kind, "record_id": record_id, "data": data,
         "prev": last["hash"] if last else GENESIS}
    return {**e, "hash": entry_hash(e)}


def verify_chain(entries):
    """{"ok", "entries", "head", "broken_at" (1-based position), "why": "seq" | "prev" | "hash"}."""
    prev = GENESIS
    for i, e in enumerate(entries, 1):
        why = ("seq" if e["seq"] != i else "prev" if e["prev"] != prev
               else "hash" if entry_hash(e) != e["hash"] else None)
        if why:
            return {"ok": False, "entries": len(entries), "head": None, "broken_at": i, "why": why}
        prev = e["hash"]
    return {"ok": True, "entries": len(entries), "head": entries[-1]["hash"] if entries else None,
            "broken_at": None, "why": None}
