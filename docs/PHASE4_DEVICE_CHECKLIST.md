# Phase 4 device checklist (NEEDS YOU)

Equipment: the spike phone (Redmi 2201117TI), the same wired earphones **with an inline mic**, the laptop on the
same Wi-Fi. Results are SCREENING TRIAL DATA at an **uncalibrated** volume: not hearing measurements.

## Setup

0. Let the phone reach the laptop (once per network):
   - `server/.env` must list the laptop's LAN IP in `DJANGO_ALLOWED_HOSTS` (now `192.168.29.165`). If the Wi-Fi
     hands out a new address, check it with `ip -4 addr show scope global` (`hostname -I` is not available on
     this laptop) and update the line.
   - Open the firewall port yourself: `sudo ufw allow 8000/tcp`.
1. `cd server && .venv/bin/python manage.py migrate && .venv/bin/python manage.py seed_demo` (fake schools/children),
   then `.venv/bin/python manage.py runserver 0.0.0.0:8000`. Create a login if you have none:
   `.venv/bin/python manage.py createsuperuser`.
2. `cd screener && npx expo start`, open in Expo Go. Settings: server `http://192.168.29.165:8000`, log in, pick a
   school, enter the earphone model and the media-volume setting (write the exact steps, e.g. "zero, then up 8").

## Earphone detection (ERR-019)

3. Screen a child → consent → device check. With earphones plugged in: does it say "Wired earphones detected"?
4. Unplug: does it switch to "No wired earphones detected" within about a second? Plug back in: detected again?
5. Start a test, and during a beep unplug the earphones. Expected: the beep stops, "Earphones disconnected", no
   further beeps. Did you hear any beep from the phone speaker? (yes / a click / no). Plug in, tap Resume: does it continue?

## Three full tests (send back the exported JSONs)

Pseudonymous children only ("Student A1"). After each test tap **Export session JSON** and save it.

6. Quiet room, child (or team member) taps honestly.
7. Noisy corridor during a break, same person taps honestly.
8. Quiet room, the person taps **deliberately at random**, ignoring the beeps.

For each, write down: outcome shown, room-noise value shown, roughly how long the test took, anything odd.

## Sync

9. Tap Sync with the laptop reachable: all records "synced"? Tap Sync again: nothing new sent?
10. Turn Wi-Fi off, screen one more child, tap Sync (should fail with "Nothing was lost"), turn Wi-Fi on, Sync again.

## Results (2026-10-18)

Phone Redmi 2201117TI (Android 13), Samsung wired earphones with inline mic, media volume "zero, then 6 steps",
Expo Go SDK 57, one team member as the "child". TRIAL DATA at an **uncalibrated** volume, n = 1 session per
condition: these show the app behaves as designed, not screening accuracy. Files in `data/raw/phase4/` (gitignored).

`python scripts/analyze_phase4.py data/raw/phase4/*.json`:

| Step | Session | Outcome | Room noise (re: reference) | Duration (s) | Catch taps | Out of window | Noise replays | Tap ms min / median / max |
|---|---|---|---|---|---|---|---|---|
| 6 | Student A-2, quiet, honest | PASS | −7.7 | 119 | 0/4 | 2/16 | 2 | 1457 / 1764 / 2938 |
| 7 | Student A-3, "noisy", honest | PASS | +1.3 | 104 | 0/4 | 2/16 | 0 | 1551 / 1780 / 3101 |
| 8 | Student A-4, quiet, random taps | RETEST | −8.4 | 139 | 4/5 | 4/20 | 2 | 108 / 1878 / 4975 |

Duration = first to last engine event (the test itself); the tester's 2–4 min also covers consent and set-up.

What this shows:
- **Reliability gating works as designed.** Random tapping hit 4 of 5 silent trials and got RETEST, not REFER
  ("this test cannot refer"). Both honest sessions had 0 catch taps and PASS.
- **Taps are slow relative to the 2500 ms window.** Honest taps were never faster than ~1.45 s after the JS
  `play()` call; 2 of 16 tone trials per honest session fell outside the window (limit 25%, so no effect here).
  The log can't separate audio output latency from reaction time (and the tester may wait for the 1 s beep to end).
  A slower child could exceed the 25% limit and get RETEST. **Phase 6:** measure output latency, then revisit
  `response.response_window_ms` (PLACEHOLDER). No config change now on n = 1.
- **Noise replays come from short sounds, not room level.** The gate is absolute (reference + 10), so the +1.3
  room (only mildly noisy; the spike corridor was about +15) had 0 replays and the quiet rooms had 2 each.
- **500 Hz (owner note, no exported file):** trial run Student A1 got a 500 Hz REFER (left) in a low-to-medium noise
  room, while A-2 heard 500 Hz in a quiet room. Keep in mind when tuning `policy_500hz` in Phase 6.

First sync (owner tapped Sync once, result not noted), checked in `server/db.sqlite3` on 2026-10-18: all 4 phone
children arrived (Student A1, student A-2, A-3, A-4, synced 06:17 UTC) with their consents, one session and one result
each (A1 REFER left ear, A-2 PASS, A-3 PASS, A-4 RETEST) and A1's case in `referred` with its screened → referred
event. A1 has two consent records (one probably from an attempt that stopped after consent; harmless). Note: the
seed data also has a "Student A1", so names are not unique; the server tells them apart by ID.

Not reported yet: steps 3–5 (earphone detection, ERR-019) and step 9's second tap / step 10 (sync retry and offline).

## Remaining checks (send results back)

Same phone and earphones. Install the latest app (`git pull`, `npx expo start`).

A. Device check screen (step 3): earphones in → "Wired earphones detected"? Unplug → "No wired earphones detected"
   within ~1 s? Plug back in → detected again?
B. Mid-test (step 5): unplug during a beep. Beep stops, "Earphones disconnected", no further beeps? Any sound from
   the speaker (yes / a click / no)? Plug in, Resume: does it continue?
C. Leave the screen (ERR-021): (1) finish a test, tap Done; (2) start a test and press Back mid-test;
   (3) finish a test and press Back at once. Any red or yellow error box in any of the three?
D. Titles and Settings (ERR-022/023): every screen has a proper title? Picking a school shows "School set: …"?
E. Sync (steps 9–10): Sync with the laptop reachable → all "synced"; Sync again → nothing new sent. Wi-Fi off,
   screen one child, Sync → fails with "Nothing was lost"; Wi-Fi on, Sync again → synced.
