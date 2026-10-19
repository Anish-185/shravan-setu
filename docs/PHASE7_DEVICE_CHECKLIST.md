# Phase 7 phone checklist (Redmi 2201117TI, Samsung wired earphones, Expo Go)

After `git pull` and a reload of the app. Report pass / fail and anything odd for each letter.

## A. Provisional calibration note
1. Screen a fake child (Student T1) to the result.
2. Under the ear results: a small amber ⚠ line "Provisional calibration: 1–4 kHz may be louder than intended." In
   Telugu mode: the reviewed Telugu line. No "UNCALIBRATED" line.
3. Tones at the calibrated level are audible and not uncomfortable (500 Hz is now -15 dB re full scale, 1-4 kHz -40).

## B. Audit log
1. Settings → Audit log → Verify audit log: "Audit log OK: N entries. Last code …". N counts consents, results,
   cases and status changes made since this version was installed (older records aren't in the log).
2. Screen one more child to REFER, verify again: N goes up by at least 3 (consent, result, case, case event).
3. Laptop: `cd server && .venv/bin/python manage.py migrate && .venv/bin/python manage.py verify_audit_log` after a
   sync: "Audit log OK: …".

## C. Quiet-spot finder
1. Home → Find a quiet room. With earphones plugged in, type a room name, tap "Measure this room now", stay quiet.
2. After about 6 seconds a row appears: room, hour, a relative number, (1 readings). Measure a second room and a noisy
   place (corridor): the quietest comes first and the corridor shows "too noisy for screening".
3. Unplug the earphones: the measure button is disabled and the "No wired earphones detected" line shows.
4. Telugu mode: the new lines show English with a `[TODO_TE]` marker until the Telugu is added.
