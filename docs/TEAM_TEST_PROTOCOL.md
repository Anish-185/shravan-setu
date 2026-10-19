# Team test protocol (adult volunteers)

Purpose: tune and check the app on the standard device before any school pilot. **Consenting adult volunteers only,
never children.** This is not a hearing test of the volunteers and gives no diagnosis. Numbers from these sessions are
"team test" data (n = 5-10 adults, one phone, one earphone model) and are recorded in `docs/CLAIMS.md` with that
condition.

## Who can take part

- 5 to 10 adults, **18 or older**, who say they have **no known hearing problem** and **no cold, blocked nose, ear
  pain or ear discharge today**.
- Each signs the one-page consent form (`docs/TEAM_TEST_CONSENT.md`) before anything is played. Signed forms stay on
  paper with the team lead; they are never scanned into the repo.
- Each volunteer gets a code: V1, V2, ... Only the code goes on the phone, the CSV and any file. No names.

## Equipment and setting

- Standard device: Redmi 2201117TI + Samsung wired earphones with inline mic (the model in
  `config/screening.json` `calibration.device`). The same phone and the same earphones for every session.
- Fixed media volume: choose it once (step 1), write it down, and never change it. Every session records it.
- A quiet room for all sessions except the optional corridor session.
- Latest app (`git pull`, restart the dev server, fully close and reopen Expo Go), laptop server running.
- A stopwatch (phone clock is fine) for minutes per test.
- `data/team_tests_template.csv` copied to `data/raw/team_tests.csv` (gitignored) for the results.

## Time per volunteer: about 15 minutes, in two visits

| Visit | Step | Minutes |
|---|---|---|
| 1 | Consent and eligibility questions | 3 |
| 1 | Biological calibration, run 1 (Calibration screen, both ears, 1/2/4/0.5 kHz + 1 kHz repeat) | ~5 |
| 2 (after the baseline is set) | Screening session 1 (honest), timed | ~3 |
| 2 | Screening session 2 (honest retest), earphones taken off and put back on in between, timed | ~3 |
| 2 | Only V-random and V-guess: one extra session in their role | ~3 |

Two visits because the screening sessions must run at the calibrated level, which exists only after everyone's
calibration run 1 is in. If there is time, 2-3 volunteers also do **calibration run 2** (test-retest of the
calibration itself) on a different day or after a 10-minute break.

## Step 1 (team lead, once, before any volunteer): media volume and loudness safety

1. Settings: set the earphone model and the media volume you will use for everything.
2. Without anyone wearing the earphones, open Calibration, start a dummy run with code V0, and listen near the
   earphone: the loudest level (player volume 1.0) must not be uncomfortably loud when worn. If it might be, lower the
   media volume by one step and repeat. Write the final setting in the CSV `media_volume_steps` column and in
   `config/screening.json` `calibration.media_volume_steps` (source: this procedure, date).
3. Delete the V0 export.

## Step 2: biological calibration (every volunteer, visit 1)

1. Volunteer seated in the quiet room, earphones on properly (left in left), phone face-down so they can't see the
   screen; the tester holds the phone.
2. Calibration screen: code, run 1, media volume. Start.
3. Instruction to the volunteer: "You will hear short beeps, some very faint. Tap the button (or raise your hand and I
   tap) every time you hear one, however faint. If anything is uncomfortable, take the earphones off."
4. When it ends: Export calibration JSON → copy to `data/raw/calibration/` on the laptop. Note the stopwatch time.
5. After all volunteers: `python scripts/calibrate.py data/raw/calibration/*.json`. Paste the printed baseline into
   `config/screening.json` `calibration.baseline_dbfs` with its source (date, volunteers, script, excluded volunteers).
6. Set `screening_level_db_re_team_baseline` to **20** (owner decision, 2026-10-19). Source: American Academy of
   Audiology (2011), *Childhood Hearing Screening Guidelines*, 20 dB HL. **Assumption**, written next to the value: the
   team baseline (median threshold of a small adult sample on one phone+earphone pair) approximates audiometric zero.
   It is not an ISO reference, so levels stay "dB re: team baseline", never dB HL. The app then plays calibrated tones
   and sessions are no longer marked UNCALIBRATED.

### Outlier rule: a volunteer whose thresholds are clearly higher than the group's

`scripts/calibrate.py` applies it automatically (parameters in `config/screening.json` `calibration.outlier_*`):

- For each volunteer, each run-1 threshold (2 ears x 4 frequencies) is compared with the **median of the other
  volunteers** at that frequency (both ears pooled), so the volunteer can't pull the median towards themselves.
- A threshold more than **15 dB above** that median is "clearly higher" (three 5 dB steps, beyond the usual
  test-retest spread).
- A volunteer with **2 or more** clearly-higher thresholds is **excluded from the baseline**. One stray answer alone
  never excludes anyone.
- The rule needs at least 3 volunteers with run 1; with fewer, it is not applied (the script says so).
- Much *lower* than the group is only flagged for review (often a fitting or tapping issue), never excluded.

When someone is excluded:

1. Record it in `data/raw/team_tests.csv` (`notes`: "excluded from baseline: outlier rule, <points>") and in the
   `baseline_dbfs` source text (code only, never a name).
2. The tester tells them **privately and kindly**, in their own words, along these lines:

   > "Thank you for helping us. Some of your answers were a little different from the rest of the group, so we
   > won't use them to set the app's levels. Please don't read anything into it: this was a rough check on a phone
   > that isn't calibrated yet, not a hearing test, and it can't diagnose anything. Lots of things change the result,
   > like how the earphones sat or a noisy moment. If you've ever wondered about your hearing, a proper hearing test
   > with an audiologist or at a hospital ENT clinic may be worthwhile."

3. Don't show them numbers or compare them with others, and don't tell anyone else.

## Step 3: screening sessions (visit 2)

For every volunteer, using a fake child record (Children list → "Student T1", "Student T2", ...; age band 15-18 is
fine, it only labels the record):

1. **Session 1, honest**: full flow (consent as "verbal, witnessed", earphone check, room noise, test). Start the
   stopwatch when the volunteer sits down, stop when the result shows. Record outcome, minutes, and the session
   export (Case/Result screen → Export session JSON) into `data/raw/team_tests/`.
2. Take the earphones off, put them back on.
3. **Session 2, honest retest**: same as session 1. Same room.

Roles (one volunteer each, an extra session after their two honest ones):

- **V-random (random tapper)**: taps in a steady rhythm about once a second for the whole test, ignoring the beeps.
  Expected: RETEST (catch trials). This is the Phase 4 P4-01 check, now at the calibrated level.
- **V-guess (partial guesser)**: answers honestly, and also taps on roughly every fourth silent gap when they are
  "not sure". Expected: unknown; this measures what `scripts/eval_nhanes.py` simulates (light guessing can pass the
  catch check).

Optional, if time: **corridor session** for 2 volunteers (honest, in a corridor with normal noise) to check noise
gating and the 500 Hz policy against the quiet room.

## Step 4: phone checks during the sessions (ERR-026 follow-up)

- **L1**: after the first two volunteers' honest sessions, run
  `python scripts/analyze_phase4.py data/raw/team_tests/*.json`. Compare "Play latency" with CLAIMS P5-01
  (144 / 486 / 2243 ms, before preloading) and "Starts over 1000 ms" with P5-03 (3/16).
- **L2**: "Late-start replays" should be 0 or rare. If more than about 1 in 10 presentations is replayed, stop and
  report: the 1000 ms limit or the warm-up needs another look.

## What we compute afterwards

- Team baseline and calibration test-retest: `scripts/calibrate.py`.
- Screening test-retest: share of volunteers with the same outcome in sessions 1 and 2.
- Minutes per test (median, range): replaces the "test ~2-2.5 min" part of the cost model's 5 min per child.
- Random tapper and partial guesser outcomes.
- Play latency and late-start replays (L1, L2).

These go into `docs/CLAIMS.md` as "team test, n = ..., adults, one device", never as accuracy in children.

## Recording sheet

`data/team_tests_template.csv`, one row per session. Columns:
`volunteer, visit, session, date, room, media_volume_steps, minutes, outcome, reliability_score, catch_taps,
late_start_replays, export_file, notes`. `session` is one of `calibration_run1`, `calibration_run2`, `honest_1`,
`honest_2`, `random_tapper`, `partial_guesser`, `corridor`.
