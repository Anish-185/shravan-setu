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
| Room-noise readings (quiet-spot finder) | Pick the quietest room and hour for screening | Room name, hour and one relative number; no child data, no audio, stays on the phone |
| Audit log (phone and server) | Shows if a consent, result, case or status record was changed later | A copy of those records' fields as written, chained by SHA-256. No names: children appear only by record id. Entries are never edited or deleted |

The full session log (trials, metering numbers) stays on the phone; only the result summary syncs to the laptop server.

## What we deliberately do not collect

- **Class / section, beyond an optional label.** Since 2026-10-20 (owner decision, teacher view integration) a child
  can have an optional class label such as "5A" (`class_label`, phone and server), used only to group children into
  classrooms in the teacher view. Nothing else about the class is recorded. The camp PDF/CSV still has no Class column
  (dropped 2026-10-19, ERR-033). The server model also has an optional, always-empty `classroom` field from Phase 2.
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
