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

### Mic recorder lifecycle (bug fix ERR-021, 2026-10-18)

- Candidates: expo-audio 57 `useAudioRecorder` (MIT, in use), which caused the bug: it releases the recorder in its
  own cleanup, with no hook for "stop and delete the file first". No library adds ordered teardown for an
  expo-audio recorder; it's a few lines of promise chaining.
- Decision: (c) build `screener/src/audio/mic.ts` (~85 lines, a start/stop/dispose queue) on expo-audio's own
  `AudioModule.AudioRecorder` class. No new dependency.

## Phase 5

### i18n (English + Telugu, language toggle)

- Queries: GitHub `expo i18n`, `react-native i18n lightweight`, `react native localization`; npm i18next, react-i18next,
  i18n-js, expo-localization (2026-10-18).

| Candidate | Licence | Last release | Size (unpacked) | Verdict |
|---|---|---|---|---|
| i18next 26.5.2 + react-i18next 17.1.0 | MIT | 2026-10-17 | 540 KB + 969 KB | Works offline, but plurals, namespaces and lazy loading aren't needed for two languages with flat strings |
| i18n-js 4.5.4 | MIT | 2026-10-07 | 1.7 MB | Same, larger |
| stefalda/ReactNativeLocalization | MIT | 2026-10-09 | — | Native module setup, not needed |
| expo-localization 58.0.4 | MIT | 2026-10-15 | 145 KB | Only reads the device locale; the teacher picks the language explicitly, so not needed |

- Decision: (c) build `screener/src/i18n.tsx` (~40 lines): flat English dictionary, Telugu dictionary whose missing
  entries are `TODO_TE` and fall back to English visibly, language kept in the local kv table, a React context to re-render.

### Telugu font

- Candidate: `@expo-google-fonts/noto-sans-telugu` 0.4.2 (MIT code + OFL-1.1 font), 2.6 MB unpacked (all weights).
- Decision: not added yet. Android ships a Telugu system font (Noto Sans Telugu on stock Android) as the fallback for
  Telugu script, so text renders without bundling one. Device check G verifies this once [TELUGU_SPEAKER]'s strings are in;
  add the package (Regular + Bold only, loaded with the already-installed expo-font) if rendering is broken.

### Child-mode balloon tap target

- Queries: GitHub `react native balloon pop`, `react native tap game animation`, `balloon pop children game react native`:
  no results.
- Decision: (c) build: a big round Pressable with React Native's built-in `Animated` (scale bounce on tap). No dependency.

### Voice placeholders

- Silent `.m4a` placeholders were generated locally with ffmpeg until the real recordings arrived.
- Recordings (Anish, 18-10-2026) arrived as MP3. Decision: play the MP3 directly (Metro bundles `.mp3` by default and
  `expo-audio` plays it on Android, Expo Go included) rather than convert to `.m4a`: no re-encode, no new tool step.
  Placeholders and `scripts/make_voice_placeholders.py` deleted.

## Phase 6

### SAS XPT reader + NHANES audiometry evaluation (`scripts/eval_nhanes.py`)

- Queries (2026-10-19): GitHub `nhanes audiometry`, `nhanes hearing`, `nhanes xpt python`, `nhanes download`,
  `xport reader`, `sas xpt`, `nhanes python package`, `audiogram hearing loss grade`, `school hearing screening
  simulation`, `pure tone audiometry sensitivity specificity`; PyPI `xport`, `pyreadstat`, `nhanes`, `pandas`.

| Candidate | Licence | Last activity | Size | Verdict |
|---|---|---|---|---|
| pandas 3.0.6 (`read_sas(format="xport")`) | BSD-3-Clause | release 2026-09-17 | ~110 MB with numpy | **Use**, laptop-only (`requirements-eval.txt`), owner-approved 2026-10-19 (over the 5 MB rule). Correct XPT reader; not in the app or server runtime |
| pyreadstat 1.3.6 | Apache-2.0 | 2026-08-12 | C extension + numpy + narwhals | Works, but a second big stack for one file format |
| xport 3.6.1 | MIT | 2022-02-16 | small, but pins `pandas<1.4` | Reject: incompatible with current pandas / Python 3.12 |
| nhanes 0.5.1 (PyPI) | MIT | 2020-07-16 | — | Reject: unmaintained, downloads whole datasets; we need 8 files |
| thepyottlab/NHANES-Hearing-and-Biological-Age-Analysis | MIT | pushed 2026-10-16 | 82 MB repo | Different question (ageing); adults. Nothing to reuse beyond variable names, which come from the CDC docs anyway |
| mrwyattii/NHANES-Downloader | no clear licence (NOASSERTION) | 2017-10-20 | 20 KB | Reject: licence |
| lanzhi4/nhanes-hearing-phenotypes | no clear licence (NOASSERTION) | 2026-09-24 | 12 MB | Reject: licence |

- No open-source code was found that applies a school screening protocol to NHANES youth audiograms.
- Decision: (c) build `scripts/eval_nhanes.py` (~250 lines, stdlib + pandas for reading XPT). It reuses OUR rule
  engine (`server/referrals/rules`) so the evaluation runs the same code as the server. Download with pinned SHA-256.
- matplotlib skipped as planned (large); results are Markdown tables.

### District funnel simulator (`scripts/simulate_district.py`)

- Queries (2026-10-19): GitHub `screening referral funnel simulation`, `screening program monte carlo follow-up`,
  `loss to follow-up simulation referral`: no results.
- Decision: (c) build, ~180 lines of stdlib (`random.binomialvariate`, `statistics.quantiles`). A funnel of binomial
  stages is well under the size where a simulation library (SimPy, Mesa) earns its place. Inputs in
  `config/district_model.json`, each with a source.

## Design pass: Direction B v2 (2026-10-19)

Candidates and the icon inspection are in `docs/DESIGN.md` (section 0 and "Not used, and why").

### Drawing icons and artwork

- Candidates: `react-native-svg` 15.15.4 (MIT, in Expo Go, no network), `lucide-react-native` (ISC, needs
  react-native-svg anyway and ships every icon), an icon font (blurry at small sizes, no stroke control).
- Decision: (a) depend on `react-native-svg`; (b) copy the 33 Lucide shapes we use into `screener/src/icons.tsx`
  untouched, with the licence in `screener/licenses/`. The muggu lattice, setu line, stepper arch, sky, kites,
  balloon and app icon are original artwork drawn in code.

### Fonts

- Hind Guntur, Tiro Telugu and Baloo Tammudu 2 from google/fonts (OFL 1.1), loaded with the already-installed
  `expo-font`. This replaces the Phase 5 plan to rely on Android's system Telugu font: the design needs one family
  that is equally good in Telugu and English. Baloo's variable font is instanced to one static weight with fontTools
  (laptop only), because variable axes are unreliable in React Native on Android.

### Animation

- Child-mode float, tap echo and the celebration use `react-native-reanimated` (already installed with the Expo
  template), which runs them on the UI thread. Lottie skipped (licences of free files, see `docs/DESIGN.md`).


## Phase 7: quick wins (2026-10-20)

### 1. Tamper-evident audit log

- Queries (`gh search repos`): "hash chain audit log django", "tamper evident audit log sqlite", "hash-chained
  append-only log javascript", "django tamper evident log" (no results); "audit log hash chain", "tamper-evident log",
  "hash chain log verify", "merkle audit log python". PyPI: django-auditlog, django-simple-history, immudb-py. npm
  search: "hash chain audit log", "tamper evident log".
- Candidates:
  - django-auditlog 3.4.1 (MIT): change history per model, **no hash chain**, so it doesn't make the log
    tamper-evident; we would still write the chain.
  - django-simple-history 3.13.0: same (history tables, no chain).
  - BBVA/qed (Apache-2.0, updated 2026-09-22): a separate Go server for verifiable logs. Far too heavy for a laptop
    SQLite demo, and nothing for the phone.
  - immudb-py 1.5.0 (Apache-2.0): client for the immudb database server; needs that server running.
  - fatihsoysalcom/secure-audit-logs-hash-chain-python (MIT, 0 stars, 2026-08-30), Achalnawal2745/tamper-evident-logs
    (no licence), ARS4EVER/tamper_evident_log_system (no licence), danielspencer/secure_log_lib (ISC, last commit
    2020): unmaintained, unlicensed or toy projects.
  - npm: @tmx-group/audit-verifier, @cendor/acttrace, decern: unrelated or tied to their own services.
- Decision: (c) build. The chain is about 30 lines per language (`server/referrals/rules/audit.py`,
  `screener/src/rules/audit.ts`), checked by the shared fixture `verify_audit_chain.json`. SHA-256: Python `hashlib`
  (stdlib); on the phone (a) depend on **@noble/hashes 2.4.0** (MIT, audited, no dependencies, no install scripts,
  no network). Needed because `put()` writes inside a synchronous SQLite transaction and `expo-crypto` only offers an
  async digest; copying a hand-written SHA-256 would be unaudited crypto. Only `sha2.js` and `utils.js` are bundled.

### 3. Quiet-spot finder

- Queries (`gh search repos`): "noise level meter react native expo", "sound level meter expo-audio", "quiet room
  finder noise", "ambient noise logger android" (no results). npm search "sound level meter react native":
  react-native-sound-level 1.4.0 (MIT, 2026-07-07), react-native-sound 0.13.0 (MIT), react-native-nitro-sound 0.2.20
  (MIT), use-sound (web only).
- Evaluation: the react-native-* packages are native modules that Expo Go cannot load (we ship in Expo Go, ERR-019),
  and they would add a second metering path next to expo-audio's, which our noise reference was measured with.
- Decision: (c) build, reusing what we have: the mic meter in `useScreeningAudio`, the shared `ambientLevel()` rule
  and the `noise.*` config. New code is a ~25-line ranking function (`screener/src/rooms.ts`, jest) and one screen.

## Teacher-view integration (2026-10-20)

Owner instruction: reuse the original DhwaniSarathi teacher, classroom, assignment, analytics and results screens
(`audiometer/app/`, Apache-2.0, our upstream) instead of building them. Per-file plan: `docs/INTEGRATION_PLAN.md`.

### 1. The screens themselves

- Decision: (b) copy and adapt. Login.js, EducatorHome.js, ClassroomList.js, AssignmentList.js, AssignmentAnalytics.js
  and Results.js are copied into `screener/` with our data source, demo login, outcomes instead of hearing-loss grades
  and our design system. Licence: Apache-2.0 (repo `LICENSE`); the files have no headers to keep; each adapted file
  carries a notice of the original file and our changes. Credited in `ATTRIBUTION.md`.

### 2. Pie chart (their `VictoryPie`)

- Queries: `gh search repos` "react native pie chart svg" (no results), "react native donut chart"; npm:
  victory-native, react-native-pie-chart, react-native-svg-charts, react-native-gifted-charts.
- Candidates:
  - victory-native 36.9.2 (their version) / 37.3.6 `legacy` tag (MIT, SVG): installs 40 MB in 51 packages (measured with
    `npm install --ignore-scripts`), over the ~5 MB ask-first limit; React 19 / RN 0.86 support not verified.
  - victory-native 42.0.1 (MIT, 2026-08-31): a different library (Victory Native XL) on Skia; would not keep their
    component structure.
  - react-native-pie-chart 4.0.2 (MIT, 2025-12-25, 337 kB, depends on d3-shape): viable.
  - react-native-svg-charts 5.4.0 (MIT): last release 2022-05-14, unmaintained.
  - react-native-gifted-charts 1.4.81 (MIT, 2026-10-05): full chart kit, more than one pie needs.
  - GitHub donut repos: ppoliani/rn-donut-chart and alexfigliolia/react-native-donut-chart (no licence),
    aliaksandr-andreyeu/react-native-donut-chart and hoahoang311/react-native-donut-chart (MIT, small, little use).
- Decision: (c) build: `screener/src/teacher/Pie.tsx`, about 30 lines on `react-native-svg` (already a dependency),
  same inputs as their `VictoryPie` call (`data` of `{x, y}`, `colorScale`, radii, slice tap). Under the 100-line
  build threshold, and no new dependency.

### 3. Other original libraries

- react-native-paper, react-native-vector-icons, react-native-virtualized-view, AsyncStorage, react-i18next: replaced by
  what we already have (our `ui.tsx` components, `icons.tsx`, React Native `ScrollView`, SQLite `kv`, `useT()`).
- firebase: banned (CLAUDE.md); demo login instead.
- react-native-view-shot, expo-media-library, expo-clipboard: their features (share results as an image, copy
  assignment ID) are dropped, so not needed.


## Original UI, second pass (2026-10-20)

Owner instruction: reuse the original DhwaniSarathi code and assets as they are (the first pass rebuilt them in our
design system and was too far from the original). Per-file plan: `docs/INTEGRATION_PLAN.md`; credits:
`ATTRIBUTION.md`.

### 1. Screens, state machine, images

- Decision: (b) copy and adapt: BeforeTest1, QuietPlaceDetection, EarTest, AudiometryTest + utils/Audiometry,
  Results, EducatorHome, EducatorCreate, ClassroomList, AssignmentList, AssignmentAnalytics, and 21 of their images.
  Licence: Apache-2.0 (repo `LICENSE`). Image provenance is unclear for all of them and flagged in `ATTRIBUTION.md`
  (Bing Image Creator C2PA tags, Freepik XMP, watermarked thumbnails not used).

### 2. UI kit (their react-native-paper)

- Candidates: react-native-paper 5.15.3 (MIT, 3.8 MB, maintained, last publish 2026-06-15; deps color, use-latest-callback,
  @callstack/react-theme-provider; peer react-native-safe-area-context, already installed); rebuilding Button / Card /
  ProgressBar in our `ui.tsx` (first pass).
- Decision: (a) dependency. Keeps the copied JSX almost line for line. Its icon lookup would need
  @expo/vector-icons (7 MB of icon fonts, and it failed to render under jest); instead `PaperProvider settings.icon`
  draws the three icons the screens use with our Lucide set.

### 3. Charts (their victory-native 36)

- Candidates (searches in the first-pass entry above): victory-native 37.3.6 (MIT, 2025-01-14, the last of their SVG line,
  peer react >= 16.6, depends only on victory-* / d3 / lodash, all MIT / ISC / BSD-3); victory-native 42 (Skia, a
  different API); our 30-line react-native-svg pie from the first pass (no line charts).
- Decision: (a) dependency, victory-native 37.3.6. Same components as their code (VictoryPie, VictoryChart, VictoryLine,
  VictoryScatter, VictoryAxis, VictoryLegend, plus VictoryArea for the WHO bands). Measured +35 MB in node_modules
  (over the 5 MB guideline; owner allowed it for a chart library). Renders under React 19 / RN 0.86 in jest
  (`src/__tests__/victory.smoke.test.tsx`); jest needed it added to `transformIgnorePatterns` (ERR-047). The first-pass
  `src/teacher/Pie.tsx` is removed.

### 4. Share as PDF (their react-native-view-shot JPEG)

- Candidates: expo-print 57.0.2 (MIT, Expo SDK module, in Expo Go, offline HTML → PDF); react-native-view-shot 6.1.1
  (MIT, image only, needs html2canvas-pro peer on web); react-native-html-to-pdf (needs a dev build).
- Decision: (a) expo-print + expo-sharing (already a dependency). All three share options open the phone's share sheet.

### 5. Masking noise

- Their masked WAVs carry near-silent noise; a proper narrow-band masking noise would need its own calibration.
- Decision: drop the masked phase (config `detailed_test.masking`, false). Nothing to reuse or build.

## Images on the original screens: replacement (2026-10-20)

Owner instruction: replace every image flagged in `ATTRIBUTION.md` (2 Freepik covers, 3 Bing AI images, all with no
recorded source) with a free image with a clear licence, or with our own SVG art; same names, sizes and subjects.

- Queries (`gh search repos`): "hearing ear illustration svg" (no results), "open peeps illustration", "openmoji",
  "cc0 icons svg headphones" (no results); npm `lucide-static`.
- Candidates:
  - OpenMoji (hfg-gmuend/openmoji, last update 2026-10-17): **CC BY-SA 4.0**, share-alike, not on the allowlist. Rejected.
  - Open Peeps (Pablo Stanley, CC0 per openpeeps.com): the assets are not in a repo with a licence file; the GitHub
    generators found (openpeeps-generator MIT 2026-05-16, Peepify MIT 2026-06-01, peeps-generator and peeps-builder
    with no licence) license their code, not clearly the artwork. Rejected (unclear terms for the art).
  - unDraw: its own licence, not CC0 or on the allowlist. Not used.
  - lucide-static 1.59.0 (ISC, already our icon set, `screener/src/icons.tsx`): has ear, mic, headphones, school items.
- Decision: (c) build ourselves, `scripts/make_art.py`: flat SVG in our palette and setu motif, with Lucide glyphs
  (ISC, copied untouched) for the ear, microphone and school items; rendered with rsvg-convert + ImageMagick on the dev
  laptop. 20 files, 504 KB in total (the originals were 1.9 MB). No new app dependency. Check:
  `scripts/test_make_art.py` (every file present at its original size and format).

## Original UI fix-and-finish (2026-10-20, after the Redmi test)

### 1. Rendering every route in jest
- Need: open every expo-router screen in a test with sample data and fail on any console error (the Teacher-tab
  crash, ERR-054, was only visible on the phone).
- Searched: Expo docs "Testing configuration for Expo Router" (expo-router/testing-library, `renderRouter`); npm
  `@testing-library/react-native`, `expo-router` (bundled helper).
- Candidates: `expo-router/testing-library` (already installed with expo-router 57, MIT) needs the peer
  `@testing-library/react-native` >= 13.2: 14.1.0 (MIT, 2026-10-08, needs the new `test-renderer` package) or
  13.3.3 (MIT, 2025-08-26, uses `react-test-renderer`, already present via jest-expo).
- Decision: (a) dependency, `@testing-library/react-native` 13.3.3, dev only, with `react-test-renderer` pinned to
  19.2.3 (ERR-055). The route list is read from `src/app`, so new screens are covered without editing the test.

### 2. Charts on the phone (replacing victory-native)
- Need: donut with tappable slices, audiogram (lines, markers, grade bands), left/right bars, rendering on the Redmi.
- Candidates: keep victory-native 37.3.6 (checked only in jest, 35 MB); react-native-gifted-charts (MIT, needs
  react-native-linear-gradient, a native module not in Expo Go); victory-native 42 (Skia, needs
  @shopify/react-native-skia, large); draw with react-native-svg (already a dependency and already proven on the
  phone by the muggu, setu and child-mode art).
- Decision: (c) build ourselves, `screener/src/charts.tsx` (~170 lines): three charts, no new dependency, victory-native
  removed. Dataviz checks: outcome palette CVD separation passes; RETEST yellow < 3:1 so every slice also has a
  labelled legend chip with its count; ear pair (indigo / coral) passes all checks; grades on one warm ramp.

### 3. UI kit (removing react-native-paper)
- Decision: removed. The original screens are rebuilt with our own components (`src/ui.tsx`: `PostRow`, `SectionH`,
  `LinkBtn`, `Bar`; `src/art.tsx`: `Band`) so they match the rest of the app.

### 4. Illustrations (replacing the make_art.py images)
- Need: pictures for Make sure (6), surroundings, which ear, test start, the ear under test, ear cards, covers, in the
  same line style as our Lucide icons and Open Peeps figures.
- Candidates: Lucide (ISC, already used): icons only, no scenes; Open Peeps (CC0, already used for people); unDraw
  (own licence, flat filled style that clashes with our line style, not needed); the make_art.py images (flat, filled,
  the owner found them off-theme).
- Decision: (c) build ourselves in react-native-svg (`src/illustrations.tsx`): Lucide glyphs inside our arch scene,
  plus our own head, earbud, equalizer and switch drawings. No image files, scales on any screen. `scripts/make_art.py`
  and its test removed.
