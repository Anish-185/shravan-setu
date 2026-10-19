# Phone checklist: Phase 6 build (NEEDS YOU)

**Setup:** `git pull`; restart `runserver`; fully close Expo Go (swipe it away), reopen and reload. Same Redmi +
Samsung wired earphones, fixed media volume.

First, if not done yet: **N-T** from `docs/PHASE5_DEVICE_CHECKLIST.md` part 2 (U is dropped: the B-series sessions
are test data, owner 2026-10-19).

## New in Phase 6

- **V. Silent warm-up (ERR-026).** Screen a test child up to "Measure room noise". While it measures: is anything
  audible in the earphones? (Expected: nothing; the players warm up at volume 0.) Room-noise value similar to before?
- **W. Test runs with the new timing.** Finish the test honestly. Any pause, stuck screen or red box? Export session
  JSON → `data/raw/phase6/`, then on the laptop:
  `server/.venv/bin/python scripts/analyze_phase4.py data/raw/phase6/*.json`. Paste the table. Compare "Play latency"
  with P5-01 (144 / 486 / 2243 ms) and "Starts over 1000 ms" with P5-03 (3/16). "Late-start replays" should be 0 or
  close to it.
- **X. Calibration screen (team lead, nobody wearing the earphones first).** Home → "Calibration (team only)". In
  Telugu mode the link shows "[TODO_TE] Calibration (team only)" (expected, team-only tool). Enter V0, run 1, your
  media volume. Start. Listen near the earphone: do the beeps get softer after you tap "I heard a beep" and louder when
  you don't? Unplug the earphones mid-run: "Plug in the earphones" message, then it continues after you plug back in?
  It ends after 10 points (left and right: 1000, 2000, 4000, 500, 1000 Hz)? "Export calibration JSON" opens the share
  sheet? Copy the file to the laptop and run `server/.venv/bin/python scripts/calibrate.py <file>`: does it print a
  table? (Delete V0 afterwards; it is not a volunteer.)
- **Y. Loudness safety.** Protocol step 1 (`docs/TEAM_TEST_PROTOCOL.md`): is the loudest calibration level (player
  volume 1.0) comfortable when worn? If not, lower the media volume one step, repeat, and tell me the final setting.

Then run the team tests (`docs/TEAM_TEST_PROTOCOL.md`) with 5-10 consenting adults and send me: the calibration
exports, the session exports, `data/raw/team_tests.csv`, and anything odd.
