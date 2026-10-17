# Phase 4 device checklist (NEEDS YOU)

Equipment: the spike phone (Redmi 2201117TI), the same wired earphones **with an inline mic**, the laptop on the
same Wi-Fi. Results are SCREENING TRIAL DATA at an **uncalibrated** volume: not hearing measurements.

## Setup

1. `cd server && .venv/bin/python manage.py migrate && .venv/bin/python manage.py seed_demo` (fake schools/children),
   then `.venv/bin/python manage.py runserver 0.0.0.0:8000`. Create a login if you have none:
   `.venv/bin/python manage.py createsuperuser`.
2. `cd screener && npx expo start`, open in Expo Go. Settings: server `http://<laptop-ip>:8000`, log in, pick a
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

## Also please answer

- Spike clip `quiet-on-1kL-1.00`: you said it actually played 4k R, but the app's log says 1k L vol=1.00. Which is right?
- Phone name from Settings → About phone, earphone model, and the media-volume steps used in the spike.

Put the JSONs in `data/raw/phase4/` (gitignored), or tell me where they are.
