# Reuse log

Every reuse search and decision (protocol in `CLAUDE.md`). Newest phase at the bottom.

Format per entry: feature, queries run, candidates (licence, last commit/release), decision, reason.

## Phase 0

### Loading Django settings from a `.env` file

- Queries: none run. Plumbing choice between well-known packages (no feature search needed).
- Candidates:
  - `python-dotenv` 1.2.4: BSD-3-Clause, no network calls, pure Python.
  - `django-environ`: MIT; adds typed parsing we don't need.
  - Plain `os.environ`: no dependency, but then `.env.example` only helps if the user exports variables by hand.
- Decision: (a) dependency on `python-dotenv`.
- Reason: one call (`load_dotenv`) makes `server/.env` work on Linux, macOS and Windows without shell tricks.
  Real environment variables still take precedence.

## Phase 1

### Pure-tone audiometer / hearing-screening apps (tone generation, response windows, catch trials, mic metering during playback)

- Queries (GitHub, `gh search repos`, 2026-10-17): `audiometer react-native`, `hearing test expo`, `pure tone audiometry app`,
  `hearing screening react native`, `audiometry android hearing screening` (almost no hits as multi-word queries), then
  `audiometer --language=typescript`, `audiometer --language=javascript`, `audiometry --sort=stars`, `audiometer --sort=stars`,
  `"hearing test" --language=typescript`, `"hearing screening" --sort=stars`, `"hearing test" --language=kotlin`.
- No React Native / Expo hearing-screening app with an allowlisted licence turned up, apart from DhwaniSarathi itself.
- Candidates:

| Repo | Licence | Last push | Notes | Verdict |
|---|---|---|---|---|
| S1ddh4rthaG/DhwaniSarathi | Apache-2.0 | 2026-10 | Our base. Pre-generated stereo WAV tones per ear | **Reuse tones** (spike) |
| nishnarudkar/Aurohear-v2 | MIT | 2026-10-15 | Browser (Web Audio) + Python backend. Has catch-trial distribution, timed response-window scoring, QC probes, Python/TS parity via golden traces. Also uses Supabase for an NLP module | Reference for Phase 3/4 design ideas only. Web Audio code doesn't run in Expo, the project is new (0 stars), and it has a cloud dependency |
| mcartwright/hearing-screening.js | BSD-2-Clause | 2018-02 | Browser screening, Python stimulus generator | Unmaintained; reference only |
| JamieGeddes/hearingtestapp | MIT | 2025-06 | Small Vite/React web hearing test | Web only; nothing needed |
| ReeceStevens/ut_ewh_audiometer_2014 | MIT | 2017-11 | Native Android (Java) audiometer with a calibration screen | Unmaintained; calibration flow is a reference for Phase 6 |
| woheller69/audiometry | GPL-3.0 | 2026-09 | Android hearing test | Rejected: GPL |
| nzilbb/digit-triplets-test | AGPL-3.0 | 2026-08 | Digits-in-noise | Rejected: AGPL |
| Many `*/audiometer`, `*/hearing-test` repos | none | various | No licence file = all rights reserved | Rejected |

- Decision: (b) copy the four original WAV tones for the spike. Build the spike ourselves (one screen, under 250 lines)
  on expo-audio. Revisit catch-trial and response-window scoring designs (Aurohear-v2 as a reading reference, no code copied) in Phase 3.
- Note for Phase 3/4: in Expo Go there is no oscillator API (expo-audio has no synthesis and no pan), so tones stay as
  pre-generated per-ear WAV files. Our own generator script (with onset/offset ramps, see ERR-005) is likely needed.

### Volume control in the spike

- Decision: no slider package (`@react-native-community/slider`). −/+ buttons showing the exact value, so checklist
  settings are reproducible. Zero dependencies.
