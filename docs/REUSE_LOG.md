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

## Phase 2

Searches (2026-10-17): GitHub `gh search repos` for `"django fsm"`, `"state machine" --language=python`,
`"django offline sync"`, `"drf bulk upsert"`, `"python pdf generation"`; PyPI JSON API for each candidate below.

### Case state machine

| Candidate | Licence | Latest release | Notes |
|---|---|---|---|
| django-fsm (kmmbvnr) | MIT | 3.0.1, 2025-10 | Original project; development moved to django-fsm-2 |
| django-fsm-2 (django-commons) | MIT | 4.2.4, 2026-03 | Maintained. Decorator-based transitions on model fields |
| django-fsm-log (jazzband) | MIT | 2026-10 push | Adds transition logging on top of django-fsm |
| python-statemachine | MIT | 3.2.2, 2026-10 | General FSM, 163 KB |
| transitions (pytransitions) | MIT | 0.9.3, 2025-07 | General FSM, 110 KB |

- Decision: (c) build. `referrals/state.py`: a 9-entry transition dict plus one `transition()` function (~60 lines),
  which also writes the append-only CaseEvent and the stubbed reminder.
- Reason: under 100 lines, the whole table is visible in one place (easy to show judges and to port to JS), and
  offline events from the phone must be replayed through the same check, which is simpler without decorators.

### Camp-request PDF export

| Candidate | Licence | Size | Notes |
|---|---|---|---|
| reportlab 5.0.1 | BSD | 1.9 MB wheel, but requires Pillow (MIT-CMU, 6–7 MB wheel, 26 MB installed together) | Over our ~5 MB ask-first limit |
| fpdf2 2.8.9 | LGPL-3.0 | 333 KB | Rejected: LGPL is outside the allowlist |
| weasyprint 70.0 | BSD | 321 KB + native Pango/Cairo | Needs system libraries; heavy for a laptop install |
| xhtml2pdf 0.2.26 | Apache-2.0 | 299 KB | Depends on reportlab, same size problem |

- Decision: (c) build. `referrals/pdf.py`: ~70-line writer using the PDF base-14 fonts (nothing embedded), one banner
  per page, monospaced table, pagination. Validated with `qpdf --check` and `pdftotext`.
- Limitation: Latin-1 text only. Telugu printouts will be produced on the phone with expo-print (Phase 5).

### Offline sync / idempotent upsert for DRF

- Candidates: djangorestframework-bulk (MIT, last release 2015-04, unmaintained). Searches for Django offline sync
  and DRF bulk upsert returned nothing usable.
- Decision: (c) build. `SyncView` in `referrals/views.py`: per-record `update_or_create`-style upsert by client UUID
  inside a savepoint, events replayed through the state machine, per-record status (`created`/`updated`/`duplicate`/`error`).

### Test tools

- pytest 9.1.1 (MIT) and pytest-django 4.14.0 (BSD-3) as dev-only dependencies (`server/requirements-dev.txt`).
  Requested by `CLAUDE.md`; well-known; small.

## Phase 3

### Screening decision rules, catch trials, false-alarm scoring

- Queries (GitHub, 2026-10-17): `"catch trials" audiometry`, `"false alarm rate" hearing`, `"play audiometry"`,
  `"hearing screening" decision`, `"pure tone screening" --sort=stars`, `audiogram classification --language=python`,
  `audiometry --language=typescript`, `"hughson westlake"`, `audiogram --language=javascript`. The first four returned nothing.

| Repo | Licence | Last push | Notes | Verdict |
|---|---|---|---|---|
| Nikolai-hearme/open-audiogram | MIT | 2026-07-27 | `src/screening.js`: Web Audio tone player with raised-cosine ramps and a threshold-seeking (Hughson-Westlake style) session | Different method (threshold search, not fixed-level screening with catch trials), Web Audio only. No code copied; the raised-cosine ramp is a textbook formula we wrote ourselves |
| nishnarudkar/Aurohear-v2 | MIT | 2026-10-15 | Catch-trial distribution, response-window scoring, Python/TS golden-trace parity (noted in Phase 1) | Same idea as our shared fixtures; no code copied. Web + cloud dependency |
| cnspica/hearing-self-diagnosis | MIT | 2026-10-14 | Browser threshold audiometry, self-diagnosis framing | Diagnostic framing conflicts with our rules; not used |
| nikooo777/audiometry | MIT | 2026-06-17 | Small browser hearing test | Nothing reusable for rules |
| gjenaro/SNRLab | other | 2026-08-30 | iPhone relative pure-tone screening | Licence not on allowlist |
| several others | none | | No licence file | Rejected |

- Decision: (c) build. `server/referrals/rules/__init__.py` (Python reference, ~150 lines) and
  `screener/src/rules/index.ts` (JS port). Rules are simple, explainable, and every threshold is in `config/screening.json`.
- Reason: no candidate implements fixed-level screening with catch trials, per-tone noise discard, a rescreen of
  failed points and triage routing; all are threshold-seeking web tools. Our logic is the originality claim, so it stays ours.

### Tone generation with ramps (ERR-005)

- Decision: (c) build. `scripts/make_tones.py`, stdlib `wave` + `math`, ~60 lines. No dependency (numpy/scipy not needed).

### JS test runner

- jest 29.7.0 (MIT) with jest-expo 57.0.6 (MIT), the versions SDK 57 pins (was jest 30.5.2 / jest-expo 58.0.11 before
  the ERR-014 downgrade), plus @types/jest 29.5.14 and
  @types/node 26.6.5 (MIT). Dev only. Required by `CLAUDE.md` (jest-expo preset).

## Phase 4

### Earphone connect/disconnect detection

- Queries (2026-10-17): GitHub `headphone detection react-native`, `expo audio device change`, `AudioDeviceCallback wired headset`
  (and `expo audio route change`, `react-native wired headset`, `expo headphones module`: no results); npm
  `headphone detection`, `audio route expo`, `headset plug react-native`.

| Candidate | Licence | Last release / push | Verdict |
|---|---|---|---|
| react-native-headphone-detection (Tintef) | MIT | npm 1.3.0, 2020 | Old bridge module, not in Expo Go, unmaintained |
| react-native-headphone-detect-v2 | ? | 0.2.6-beta-1, 2025 | Pre-release only; banned |
| zukethenuke/expo-audio-output-detector | MIT | 2025-10 | Repo holds only a LICENSE file; not on npm |
| react-native-incall-manager | ISC | 2026-09 | WebRTC call manager; takes over the audio mode; heavy; not in Expo Go |
| expo-audio 57 (already installed) | MIT | SDK 57 | No route/device-change events. `getAvailableInputs()` re-queries `AudioManager.getDevices(INPUTS)` on every call; `getCurrentInput()` falls back to a cached preferred device (why the spike saw "H2W" after unplugging) |

- Decision: (c) build on the installed expo-audio: poll `getAvailableInputs()` every `noise.meter_poll_ms` for a
  `MicrophoneWired` device and no Bluetooth device. Runs in Expo Go.
- Limits: needs earphones with an inline mic (TRRS headset); 3-pole earphones are never detected, so the test refuses
  to start (fails safe). Up to one poll interval of a tone can reach the loudspeaker after an unplug, before the stop.
  True route events (`AudioDeviceCallback` / `ACTION_AUDIO_BECOMING_NOISY`) need a small native module and a dev
  build (no Expo Go); proposed for the APK build, not done.

### Tone presentation scheduling / test engine

- Queries: GitHub `expo audio tone scheduling`, `react native audiometry test engine` (no results),
  `pure tone audiometry javascript`.
- Candidates: AHSLab-UW/UWAHSLAB_Hearing_Screener (MIT, 2026-10): browser, Bayesian threshold fitting, Web Audio.
  cnspica/hearing-self-diagnosis (MIT): browser Hughson-Westlake, diagnostic framing. Neither is fixed-level
  screening with catch trials, during-tone noise gating and a rescreen round; both are Web Audio.
- Decision: (c) build. `screener/src/engine/engine.ts` (~230 lines), timers through an injected `Port` so jest drives it.

### Offline-first sync on expo-sqlite

- Queries: GitHub `expo-sqlite sync outbox`, `offline first sync react native sqlite`, `watermelondb sync`.

| Candidate | Licence | Last release | Verdict |
|---|---|---|---|
| @nozbe/watermelondb | MIT | 0.28.0, 2025-07 | JSI native module: not in Expo Go; heavy; own sync protocol would need a new backend endpoint |
| @powersync/react-native | Apache-2.0 | 2.3.1, 2026-10 | Needs the PowerSync service (hosted or self-run server); rejected (service in runtime path) |
| Felix-au/SyncZen-Local and similar | MIT | 2026 | App-specific, not a library |

- Decision: (c) build a hand-written outbox: `src/db/store.ts` + `src/db/sync.ts` (~120 lines) on expo-sqlite
  57.0.4 (MIT, in Expo Go). Matches the existing idempotent `/api/sync/` endpoint exactly.

### UUID generation

- Candidates: expo-crypto 57.0.4 `randomUUID()` (MIT, in Expo Go, native CSPRNG); `uuid` 14 (MIT) + 
  `react-native-get-random-values` polyfill (MIT).
- Decision: (a) expo-crypto. One call, no polyfill.

### Token storage

- expo-secure-store 57.0.4 (MIT), included in Expo Go, so no limitation to document.
