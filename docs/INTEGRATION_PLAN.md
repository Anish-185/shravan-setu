# Integration plan: the original DhwaniSarathi experience in Shravan Setu

Date: 2026-10-20. Rollback point: git tag `pre-original-ui` (`9ab43607506311a57273b23867f9ab02ff6ddd1f`). The earlier
plan (tag `pre-integration`) rebuilt the original screens in our own design system and dropped grades, charts, images
and the share menu; the owner judged it too far from the original. This plan **copies the original code and assets**
from `audiometer/app/` (Apache-2.0, `LICENSE` in the repo root) and changes only what our app needs: Expo SDK 57,
expo-router, data on the phone, our calibration. `audiometer/` itself is not edited. The originals have no licence
headers; every copied file starts with a notice naming the original file and our changes (Apache-2.0 section 4(b)).

Screening and referral tool, never a diagnosis. Our screening test (fixed level, PASS / RETEST / REFER) stays the
default and is unchanged. The original threshold test comes in as an optional second mode, the **detailed hearing
test**, offered after a REFER and from the teacher view. Its grades are labelled estimates.

## Calibration decision (owner, 2026-10-20)

The original maps volume to dB with `MAX_DB = 75` for every frequency (`utils/CONFIG.js`, `dB2Vol`). That is an
assumption, not a measurement, so it is **not used**. Every dB value in the new screens is **dB re: team baseline**:
a tone at level L plays at `calibration.baseline_dbfs[f] + L` dB re the tone file's full scale (our provisional
calibration: 7 adult volunteers, Redmi + Samsung, per frequency, so 500 Hz is corrected). Each frequency stops at the
loudest level the phone can play (baseline + level <= 0): 30 dB at 500 Hz and 60 dB at 1-4 kHz with today's
baseline. At 1-4 kHz the baseline is an upper bound limited by the playback floor (ERR-044), so values near 0 there
may read too low; the results screen says so when it happens.

## Libraries (Expo Go, SDK 57)

| Original library | Decision |
|---|---|
| react-native-paper 5.11 (all their screens) | **Used**, 5.15.3 (MIT, 3.8 MB). One app-wide `PaperProvider` with their theme (`src/original/paper.tsx`). Paper's icons are drawn with our Lucide set, so no icon font (@expo/vector-icons) is added |
| victory-native 36 (pie, audiogram) | **Used**, 37.3.6 (MIT), the last release of the same SVG line (v42 is a different Skia library). Renders under our React 19 / RN 0.86 in jest (`src/__tests__/victory.smoke.test.tsx`); phone check in the checklist. 35 MB in node_modules (over the ~5 MB guideline; allowed by the owner for a chart library) |
| expo-av (tones, recording) | Not used: our expo-audio player and mic (`useScreeningAudio`) |
| react-native-view-shot + expo-media-library (share as image) | Not used: share is a PDF from **expo-print** (MIT, in Expo Go) through **expo-sharing** |
| firebase, AsyncStorage, react-i18next, react-native-virtualized-view, react-native-floating-action, expo-clipboard | Not used: demo login (no Firebase), SQLite `kv`, our `useT()`, `ScrollView`; their unused help FAB and "Copy Assignment ID" dropped |

## Navigation

The original `_layout.js` is a `Slot` under an empty `Header`: there is **no bottom tab bar** in the original. We add a
simple one (`src/TabBar.tsx`): Home, Children, Cases, Teacher, Settings; hidden while a screening or detailed test runs.

## Screens

### 1. Pre-test checklist: `Screens/BeforeTest1.js` → `src/original/MakeSure.tsx`

- Original: "Make sure.." title, six images in three rows (`images/shh.png`, `headphones.png`, `mute.png`,
  `equalizer.png`, `silence.png`, `noise-pollution.png`), Paper `ProgressBar` (0.3) and a contained Next button
  pushing `/Screens/QuietPlaceDetection`.
- Change: Next calls `onNext`; the progress bar shows only in the detailed test (the screening flow has its stepper);
  title margins reduced. Used in the screening flow after consent and in the detailed test.

### 2. Check your surrounding: `Screens/QuietPlaceDetection.js` → `src/original/Surrounding.tsx`

- Original: title, `images/microphone.png`, a coloured bar with the raw expo-av metering, Start/Stop Recording, and
  Continue → `Alert` "Test Confirmation" (High / Moderate / Low noise from fixed -40 / -80 dB) with Stop / Continue.
- Change: the reading is **our** room-noise measurement (rules `ambientLevel` and `apply500HzPolicy`, config
  `noise.*`), moved unchanged from the screening screen into `measureAmbient`. The dialog keeps its title and buttons
  and shows our relative value and our rule's reason; bar colour follows our gate (red too noisy, amber 500 Hz left
  out, blue fine). One timed measurement replaces Start/Stop.

### 3. Which ear: `Screens/EarTest.js` → `src/original/WhichEar.tsx`

- Original: "Which ear do you hear the sound in?", `images/questionmark.jpeg` (two ears), Play, Left / Right / None?,
  alerts "Correct!", "Please switch your headphones!", "EQUIPMENT MALFUNCTION!"; their `left.wav` / `right.wav` at
  volume 0.1.
- Change: **our** left/right logic (was `LrStep`): random ear per Play, 1000 Hz at our calibrated screening level,
  wired earphones only, `earphone_check.trials` correct in a row, wrong answer restarts the count; the alerts say our
  messages; answers wait for a Play; a counter line under the buttons.

### 4. Detailed hearing test: `AudiometryTest.js` + `utils/Audiometry.js` → `src/original/AudiometryTest.tsx`, `src/original/Audiometry.ts`, `src/app/detailed/[childId].tsx`

- Original: start card (`images/atest_icon.jpeg`), masked/unmasked chip, "Can you hear the sound?", progress bar,
  ear label and head image (`images/left_ear.png` / `right_ear.png`), threshold bar, frequency / Replay / dB chips,
  Yes / No; state machine over ear × masking × frequency (250-8000 Hz) × level (0-140 dB, +10 per No, first Yes =
  threshold); results POSTed to their server.
- Change: frequencies 500, 1000, 2000, 4000 Hz (the ones with a calibration baseline and a tone file; config
  `detailed_test.frequencies_hz`); levels 0, 10, 20 ... dB re: team baseline up to the loudest playable level
  (`detailed_test.levels_db_re_team_baseline`); playback through our calibrated player, only while wired earphones are
  detected (stops at once if unplugged; never the speaker); a frequency never heard is recorded as no response (they
  dropped it, which lowered the average); first tone plays on Start.
- **Masking: dropped.** Their masked files carry near-silent noise (Day 1 audit) and we have no calibrated masking
  level, so a "masked" phase would not be real masking (config `detailed_test.masking`, false). Their results used
  only the unmasked thresholds anyway.
- Flow (`/detailed/[childId]`): our consent → Make sure (0.3) → our device check → Check your surrounding (0.6) →
  Which ear (1.0) → test → saved on the phone as `detailed_test` (points, device, earphone model, volume setting,
  config version, calibration flags; not synced) → Your Results. Offered after a REFER (result screen button) and on
  the teacher's classroom screen. Off on an uncalibrated phone.

### 5. Your Results: `Screens/Results.js` → `src/app/results/[testId].tsx`, `src/original/hearing.ts`

- Original: share icon + modal (Export to PDF, Share on WhatsApp, Share with Doctor), red "Your Results" band,
  category description, category table (Normal -10-19 ... Profound 80+, dB HL), left / right ear cards (`leftear.png`,
  `rightear.png`, "NN dB", category), "Your Audiogram" (Victory line + scatter, both ears, legend) and a second
  audiogram over `audiogram-bg.png` with `legend.jpeg`. Data from the `results` param; sample data if missing.
- Change: data from the stored detailed test; grades from config `hearing_grades` (WHO World report on hearing 2021,
  Table 1; Olusanya et al. 2019, doi:10.2471/BLT.19.230367, their own citation); each grade says "Estimated"; table
  header "Range (WHO, dB HL)" with a source line saying our values are dB re: team baseline; one small line
  "Estimated from a phone test with provisional calibration." (shown while the calibration is provisional); a note
  under the audiogram when a 1-4 kHz value is 0 (ERR-044); no sample data. Ear average = mean of the four frequencies
  (their PTA), "≥" when a frequency was not heard (counted at the loudest level). Charts: same Victory components on
  our four frequencies; never-heard points are down triangles. **The coloured-band audiogram is redrawn** with Victory
  bands at the WHO boundaries in the original colours: their `audiogram-bg.png` bands (0/20/40/70/90 dB) contradict the
  table on the same screen. Share: all three options make a PDF with expo-print (numbers, table, WHO source, the
  screening-only statement) and open the phone's share sheet; no accounts, no paid API. Category descriptions are the
  original's text with typos fixed.

### 6. Teacher view: `Screens/Educator/EducatorHome.js`, `EducatorCreate.js`, `Components/ClassroomList.js` → `src/app/teacher/index.tsx`, `src/app/teacher/create.tsx`, `src/teacher/ClassroomList.tsx`

- Original: red "Teacher Profile Page" strip, header over `background.png` with `profile.png` avatar, "Welcome",
  name, institute, date box, Create Classroom → form (name + strength) → POST; navy "Classrooms" pill; search; cards
  with a red title and "Classroom Strength: N".
- Change: demo login kept (no Firebase); name from it, institute = the school picked in Settings; classrooms saved on
  the phone (`classroom` record: name + typed strength, not synced). Children are put in a classroom through their
  class label (synced with the child, migration 0005): on the classroom screen ("Add children to this classroom",
  "Remove"), or by typing the class when adding a child. Class labels without a created classroom still show up
  (strength = number of children).

### 7. Assignments: `Screens/Educator/AssignmentList.js` → `src/app/teacher/class.tsx`

- Original: Paper cards with a random cover from `AssignmentImages/0-5.jpg`, name, deadline (bell), class strength
  (user), progress `SubmittedCount/Count` with a red bar, Copy Assignment ID; search; Create New Assignment (name +
  an unwired deadline box).
- Change: assignments on the phone; progress = children of the class tested in the round (screening or detailed
  test, from creation to the end of the deadline day) ÷ class strength; deadline box wired (YYYY-MM-DD, default 7
  days, as their server set); cover chosen from the assignment id (stable); covers 3 and 5 not used (watermarked stock
  previews, see Attribution); Copy Assignment ID dropped (children have no app to type it into). Added: the class's
  children with Screen / Detailed hearing test buttons.

### 8. Assignment analytics: `Screens/Educator/AssignmentAnalytics.js` → `src/app/teacher/assignment/[id].tsx`

- Original: red title, `VictoryPie` (outer 100, inner 45, their colours) with tap-to-filter, a `VictoryLabel` per
  category (all drawn at one spot), child cards with the name on the category colour, age, gender, More Details.
- Change: a child with a detailed test is placed by the estimated grade of the worse ear (six WHO grades; theirs had
  five with different edges), a child with only a screening by PASS / RETEST / REFER (our outcome colours). Slice
  labels show percentages; a legend under the chart lists both kinds with counts and also filters. No gender (we record
  none). More Details opens the detailed results or the screening result.

### 9. Navigation and visuals

- Bottom tab bar (ours, see Navigation). Original header-banner pattern (red strip over `background.png`, picture on
  the right) as `src/original/Banner.tsx` on Children (with `images/ears.jpeg`) and Cases. Not changed: Home's own
  band, the screening child mode.
- Images (2026-10-20): every original image named in this plan is **redrawn by Team JL** (`scripts/make_art.py`,
  same file name, pixel size and subject), because none of the originals had a recorded source or licence. Details
  and licences: `ATTRIBUTION.md`.

## Data flow summary

All on the phone (SQLite, offline). New local record types: `classroom`, `detailed_test` (and `assignment`, from the
previous integration). Synced as before: child (with class label), consent, screening session and result, cases.
Nothing new is synced; the detailed test result is not sent to the server (a later item).

## Not changed

Screening engine, rules, timing, sync, audit log, calibration values, `audiometer/`, `server/`.
