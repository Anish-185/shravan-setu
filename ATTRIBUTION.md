# Attribution

This project builds on **DhwaniSarathi** by **the DhwaniSarathi team (SIH 2023)**:
https://github.com/S1ddh4rthaG/DhwaniSarathi. It was built by team gps4 for Smart India Hackathon 2023,
problem statement SIH1403 ("App-Based Audiometer"), where it was a winning entry.

**Original team** (from the original README):

- Sachin Kumar Sahu
- Palivela Ganesh Priyatham
- Preethi Varsha Marivina
- Siddhartha G
- Swami Ramchandra Kedari
- Sirish Sekhar

The original work is licensed under the **Apache License 2.0**. The `LICENSE` file in the repo root is theirs
and is kept unchanged. The original repo has no `NOTICE` file, so there is none to carry.

**How their code is included.** The first commit of this repo imports the original repository as it was at
commit `80e990f` (2024-01-11), the latest upstream commit when we started. The original team's 227-commit history is
not copied here; it remains in full at the link above. In that import we made only these changes, so that this public
repo does not republish them:

- the original team's Firebase configuration values (`audiometer/FirebaseConfig.js`), Clarifai API token
  (`audiometer/app/Screens/JewelleryDetection.js`) and hardcoded Django `SECRET_KEY` (`server/backend/settings.py`)
  are replaced with `REDACTED`;
- the committed test database `server/db.sqlite3` is removed.

Everything else in `audiometer/`, `server/apigateway/`, `Screenshots/` and the two PDFs is exactly as in `80e990f`.

The original mobile app lives in `audiometer/` and is **not modified** by us apart from the redaction above. It is kept for attribution.
The original Django backend lives in `server/apigateway/`; our changes to `server/` are listed in
`docs/ERROR_LOG.md` and the commit history (Phase 0: env-based settings, Django 5.2 upgrade, removal of the committed database).

## Original features (theirs)

| Feature | Where in the original code | Notes |
|---|---|---|
| Pure-tone test | `audiometer/app/AudiometryTest.js`, `audiometer/app/utils/Audiometry.js`, `utils/CONFIG.js`, `assets/puretones/` | Ascending 10-step sweep, pre-generated 10 s stereo WAV tones |
| Results / audiogram view | `audiometer/app/Screens/Results.js` | Pure-tone average and category per ear |
| Classroom / teacher / assignment management with analytics | `audiometer/app/Screens/Educator/*`, `server/apigateway/` | Educator creates classrooms and test assignments |
| Nearest-doctor map | `audiometer/app/Screens/Maps.js` | Placeholder marker data |
| Document digitisation | `audiometer/app/Screens/ML.js` | Embeds a third-party Hugging Face Space in a WebView |
| Jewellery detection | `audiometer/app/Screens/JewelleryDetection.js` | Calls the Clarifai API |
| Preliminary checks: noise detection | `audiometer/app/Screens/QuietPlaceDetection.js` | expo-av recording metering before the test |
| Preliminary checks: headphone orientation | `audiometer/app/Screens/EarTest.js`, `assets/eartest/` | Left/right channel check |
| Noise-standards info | `audiometer/app/Screens/LegalComplianceInformation.js` | Links to pollution control board websites |
| English / Hindi UI | `audiometer/app/locales/` | i18next |

### Integrated into `screener/` (2026-10-20, second pass: original code and assets)

Copied from `audiometer/app/` and changed only where our app needs it (plan and details: `docs/INTEGRATION_PLAN.md`).
`audiometer/` itself is unchanged. The originals carry no licence headers; each copied file starts with a notice
naming the original file and what we changed (Apache-2.0 section 4(b)).

| Original (theirs) | In `screener/` | What we changed |
|---|---|---|
| `Screens/BeforeTest1.js` | `src/original/MakeSure.tsx` | Next calls back instead of routing; progress bar optional; margins |
| `Screens/QuietPlaceDetection.js` | `src/original/Surrounding.tsx` | Reading = our relative room-noise rule; dialog shows our value and reason; bar colour = our gate; one timed measurement |
| `Screens/EarTest.js` | `src/original/WhichEar.tsx` | Our left/right logic (random ear, calibrated 1000 Hz tone, N correct in a row); our messages |
| `AudiometryTest.js` | `src/original/AudiometryTest.tsx` | Our calibrated playback, wired earphones only; masked chip removed; first tone on Start; results to the phone, not their server |
| `utils/Audiometry.js` | `src/original/Audiometry.ts` | Levels in dB re: team baseline from config, capped at the loudest playable level; no-response recorded; masking dropped; no expo-av |
| `Screens/Results.js` (+ its category logic) | `src/app/results/[testId].tsx`, `src/original/hearing.ts` | Stored detailed test; WHO grades from config, labelled estimates; provisional-calibration line; band audiogram redrawn at WHO edges; share = expo-print PDF via share sheet |
| `Screens/Educator/EducatorHome.js` | `src/app/teacher/index.tsx` | Demo login name, school from Settings; no network |
| `Screens/Educator/EducatorCreate.js` | `src/app/teacher/create.tsx` | Classroom saved on the phone; whole-number strength |
| `Components/ClassroomList.js` | `src/teacher/ClassroomList.tsx` | Classrooms from the phone (created + class labels); full-width cards |
| `Screens/Educator/AssignmentList.js` | `src/app/teacher/class.tsx` | Local assignments; progress = children tested ÷ strength; deadline wired; stable cover; Copy ID dropped; class children added |
| `Screens/Educator/AssignmentAnalytics.js` | `src/app/teacher/assignment/[id].tsx` | Estimated grade or PASS / RETEST / REFER per child; legend with both; no gender |
| `Screens/Login.js` (teacher branch, first pass) | `src/app/teacher/login.tsx` | Demo login instead of Firebase (unchanged from the first pass) |
| Paper theme from each screen | `src/original/paper.tsx` | One provider; Paper icons drawn with our Lucide set |
| EducatorHome header pattern | `src/original/Banner.tsx` | Ours, built from their header for the Children and Cases screens |

Moved, not copied: our own consent and device steps went from the screening screen to `src/steps.tsx` unchanged.
Not copied: `notRequired/*`, `Maps.js`, `ML.js`, `JewelleryDetection.js`, signup/student screens, their tone WAVs
(we play our own generated tones), `audiogram-bg.png` and `legend.jpeg` (redrawn, see the plan).

#### Original images used (`screener/assets/images/original/`)

Copied from `audiometer/app/assets/`, some resized and stripped of metadata to keep the app small (sizes in brackets).
The original repo records **no source or licence for any image**; the repo's Apache-2.0 licence covers them only if
the original team made them. What the files themselves show:

| File (theirs) | Used on | Provenance found in the file | Flag |
|---|---|---|---|
| `images/shh.png`, `headphones.png`, `mute.png`, `equalizer.png`, `silence.png`, `noise-pollution.png` (128 px) | Make sure | None. Flat-icon style typical of icon sites (e.g. Flaticon, which needs attribution under its own licence) | **Unclear source** |
| `images/microphone.png` (→ 400 px), `left_ear.png`, `right_ear.png` (→ 500 px) | Surrounding, detailed test | None in the PNGs; same style as the next row | **Probably AI-generated, unclear** |
| `images/questionmark.jpeg`, `atest_icon.jpeg` (→ 500 px), `ears.jpeg` (→ 600 px) | Which ear, detailed test, Children banner | C2PA tag: "AI Generated Image", Bing Image Creator, 2023-12-15 | **AI-generated (Bing); copyright status unclear** |
| `leftear.png`, `rightear.png` (320 px) | Results ear cards | None | **Unclear source** |
| `background.png` (→ 1200 px), `profile.png` (→ 300 px) | Teacher page, Create Classroom, banners | None | **Unclear source** |
| `AssignmentImages/0.jpg`, `2.jpg` (→ 800 px) | Assignment covers | XMP: "Freepik Company S.L. - www.freepik.com" | **Freepik: free use needs attribution; not on our allowlist** |
| `AssignmentImages/1.jpg` (→ 800 px), `4.jpg` (WebP, → JPEG 800 px) | Assignment covers | 1: Adobe Illustrator export; 4: none | **Unclear source** |
| `AssignmentImages/3.jpg`, `5.jpg` | **Not used** | 225 px thumbnails with a faint stock watermark | Watermarked previews |

Until the owner decides, these images are used as the original team shipped them, credited here to the
DhwaniSarathi team. Replacing any of them is a file swap in `screener/assets/images/original/` (same name).

## Our features

Filled in per phase.

- (Phase 0) No features yet: cleanup, attribution, architecture.
- (Phase 7) Tamper-evident audit log on the phone and the server: hash-chained entries for consent, results,
  referrals, status changes and camp requests; `manage.py verify_audit_log` and a Verify button in Settings. Shared
  test vectors for both languages. SHA-256 from Python's hashlib and @noble/hashes (MIT, dependency).
- (Phase 7) Quiet-spot finder: room-noise readings per room and hour (same relative measurement as the pre-test
  step), quietest room and hour first, kept on the phone.
- (Phase 5) Closing the loop on the phone, all offline: ear-health triage checklist after a REFER (shared triage rule,
  "nearest" PHC/DEIC = same mandal from the local facility list, "Triage, not diagnosis"); referral case list filtered
  by status, case detail with full history and buttons only for legal moves (the case state machine now lives in both
  rule engines with shared fixtures); camp requests made on the phone and shared as CSV, PDF generated by the laptop
  server after sync; stubbed reminder log on "missed" (template shared with the server in `config/screening.json`);
  child mode (balloon tap target, recorded Telugu voice lines); English/Telugu UI with a toggle on every
  screen (Telugu reviewed and approved by a native speaker, see below; `TODO_TE` fallback shown visibly), with `scripts/telugu_strings.py` generating
  `docs/TELUGU_STRINGS.md` and `docs/VOICE_SCRIPT.md`; per-tone playback-start logging (ERR-026); end-to-end demo
  path tests on phone and server.
- (Phase 4) Offline screening flow in `screener/`: consent, device check with live wired-earphone detection,
  left/right check (idea ported from the original `EarTest.js`, re-implemented, no code copied), room-noise
  measurement, timer-driven test engine with during-tone noise gating, catch trials and rescreen of failed points,
  result screen with a permanent screening-only banner, local REFER case. Local SQLite outbox with manual idempotent
  sync. Noise rules (`noise_verdict`, `ambient_level`) added to both rule engines. Spike analysis script.
- (Phase 3) Screening rule engine, written twice (Python reference `server/referrals/rules/`, JS port
  `screener/src/rules/`) and checked against the same 45 shared fixtures: PASS/RETEST/REFER with reasons, catch-trial
  reliability gating, per-tone noise discard, rescreen of failed points only, 500 Hz policy, triage routing (PHC/DEIC).
  All thresholds in `config/screening.json`. Click-free tone generator `scripts/make_tones.py`.
- (Phase 2) Referral tracker backend (`server/referrals/`): referral case state machine with append-only history,
  offline sync endpoint (idempotent by client UUID), camp requests with CSV/PDF export, stubbed reminder log,
  facility list from a local CSV, token auth on every endpoint, demo seed command.
- (Phase 1) Throwaway audio spike only (`screener/src/app/spike.tsx`): tone playback with live mic metering and a JSON log.

## Telugu text and voice

Telugu text drafted and machine-checked with Claude (Anthropic); reviewed and approved by Anish, native Telugu
speaker. Voice lines recorded by Anish. Review record: `docs/TELUGU_REVIEW.md`.

## Third-party code and assets we reuse

Every entry here must also appear in `docs/REUSE_LOG.md`.

| What | From | Licence | Where in our repo |
|---|---|---|---|
| Pure-tone WAVs: 1000 Hz and 4000 Hz, left-only and right-only, 10 s (`tone_*Hz_*_um.wav`), copied unmodified | DhwaniSarathi `audiometer/app/assets/puretones/` (original team, see above) | Apache-2.0 | `screener/assets/tones/` |
| Telugu voice recordings `screener/assets/voice/te/*.mp3` (no third-party audio) | ours: recorded by Anish | Apache-2.0 | `screener/assets/voice/te/` |
| App scaffold (`create-expo-app` default template, reset to blank) | Expo (650 Industries) | MIT (`screener/LICENSE`) | `screener/` config files, `src/app/_layout.tsx` |
| Hind Guntur Regular, Medium, SemiBold (fonts, unmodified) | Indian Type Foundry | SIL OFL 1.1 (`screener/licenses/OFL-hindguntur.txt`) | `screener/assets/fonts/` |
| Tiro Telugu Regular and Italic (fonts, unmodified) | Tiro Typeworks | SIL OFL 1.1 (`screener/licenses/OFL-tirotelugu.txt`) | `screener/assets/fonts/` |
| Baloo Tammudu 2 SemiBold (instanced at weight 600 from the variable font with fontTools; no Reserved Font Name) | Ek Type | SIL OFL 1.1 (`screener/licenses/OFL-balootammudu2.txt`) | `screener/assets/fonts/` |
| Lucide 1.59.0 icon shapes, copied untouched from `lucide-static` (33 icons, listed in the file) | Lucide contributors (a few derive from Feather, Cole Bemis) | ISC + MIT (`screener/licenses/lucide-LICENSE.txt`) | `screener/src/icons.tsx` |
| Open Peeps figures (peep-13, peep-standing-16, peep-sitting-14, peep-sitting-1), recoloured to Night ink and rendered to small PNGs | Pablo Stanley | CC0 1.0 | `screener/assets/images/peeps/` |

## Design mock-ups (`docs/design/*.png`)

The two mock-up images in `docs/design/` (made for choosing a design direction, `docs/DESIGN.md`) are rendered with
these free assets. None is bundled in the app yet; when one is, it is also listed in `docs/COST_AND_LICENSES.md`.

| Asset | Author | Licence | Source |
|---|---|---|---|
| Anek Telugu (font) | Ek Type | SIL OFL 1.1 | https://github.com/google/fonts/tree/main/ofl/anektelugu |
| Baloo Tammudu 2 (font) | Ek Type | SIL OFL 1.1 | https://github.com/google/fonts/tree/main/ofl/balootammudu2 |
| Tiro Telugu (font) | Tiro Typeworks (John Hudson, Fiona Ross, Kaja Słojewska) | SIL OFL 1.1 | https://github.com/google/fonts/tree/main/ofl/tirotelugu |
| Hind Guntur (font) | Indian Type Foundry | SIL OFL 1.1 | https://github.com/google/fonts/tree/main/ofl/hindguntur |
| Phosphor Icons 2.1.1 (ear, folder, cloud-arrow-up, gear-six, info, warning, check-circle, arrow-square-out) | Phosphor Icons (Helena Zhang, Tobias Fried) | MIT | https://github.com/phosphor-icons/core |
| Lucide 1.59.0 (ear, folder, cloud-upload, settings, info) | Lucide contributors | ISC | https://github.com/lucide-icons/lucide |

Balloon, clouds, ripples and the setu line are original artwork drawn for this project.

Added for the Direction B v2 mock-ups (`docs/design/direction-b-v2-*.png`):

| Asset | Author | Licence | Source |
|---|---|---|---|
| Open Peeps figures: peep-13, peep-standing-16, peep-sitting-14, peep-sitting-1 (recoloured) | Pablo Stanley | CC0 1.0 | https://www.openpeeps.com/ |
| Tiro Telugu Italic (font) | Tiro Typeworks | SIL OFL 1.1 | https://github.com/google/fonts/tree/main/ofl/tirotelugu |
| Lucide 1.59.0, more icons (folder-heart, tent, send, hospital, signature, headphones, mic, languages, flask-conical, sliders-horizontal, share-2, volume-2, heart-pulse, calendar-x, refresh-cw, server, chevron-right, play, check, user-round, circle-check, triangle-alert) | Lucide contributors | ISC | https://github.com/lucide-icons/lucide |

The muggu lattice, kites, birds, hills, balloon, setu line and app icon are original artwork drawn for this project.
