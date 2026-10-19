# Privacy notes: children's data

Screening and referral tool, not a diagnosis. We collect the minimum needed to screen a child and follow up a
referral. No real child data is ever committed to this repository; seed and test data use fake names ("Student A1").

## What the phone records per child

| Data | Why | Notes |
|---|---|---|
| Display name | Teacher must recognise the child on the list and on a camp list | Pseudonymous is fine ("Student A1", roll number, initials) |
| School | Which school's list and camp the child belongs to | Chosen once in Settings |
| Age band (6-8, 9-11, 12-14, 15-18) | School screening covers 6-18 | A band, never a date of birth |
| Consent record | Recorded before any test | Who gave it as a role ("parent", "guardian") and the method; no names needed |
| Screening result and session log | PASS / RETEST / REFER with reasons; device, earphone model, volume setting, config version | Mic **metering numbers only**; audio is never kept (the recording file is deleted) |
| Case, status moves, triage answers | The referral loop: who still needs treatment | Triage is yes/no answers, routed to PHC or DEIC; not a diagnosis |
| Audit log (phone and server) | Shows if a consent, result, case or status record was changed later | A copy of those records' fields as written, chained by SHA-256. No names: children appear only by record id. Entries are never edited or deleted |

The full session log (trials, metering numbers) stays on the phone; only the result summary syncs to the laptop server.

## What we deliberately do not collect

- **Class / section.** The phone never asks for it, and the camp PDF/CSV has no Class column (dropped 2026-10-19,
  ERR-033, owner decision: data minimisation). Camp lists group children by school only. The server model still has an
  optional, always-empty `classroom` field from Phase 2; it can be removed or used later if a school asks for it.
- **Date of birth, address, photo, Aadhaar or any ID number.**
- **Audio recordings.**
- **Sex.** The server model has an optional field; the phone never fills it.
- **Parent phone** is optional (server field `guardian_phone`, blank by default). Reminders are stubbed: we only log
  what would be sent; nothing is sent.

## Where the data lives

- On the phone (local SQLite) until synced, then on the school's own laptop server (SQLite). No cloud service.
- `db.sqlite3` and `.env` are never committed.
- Proposed for a pilot (not done): use a school-owned phone rather than a teacher's personal phone, so child data
  does not sit on a personal device (see `docs/COST_MODEL.md`, scenario B).
