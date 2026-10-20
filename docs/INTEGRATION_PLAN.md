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

## Fix and finish (2026-10-20, after the Redmi test): our design, the original's features

The owner tested the copied screens on the Redmi: the Teacher tab crashed (ERR-054) and the copied look (their red,
navy, Paper buttons and pictures) did not fit our app. Decision: keep every original **feature and screen idea**, build
it in **our** Direction B v2 design (Setu palette, Tiro / Hind / Baloo, cards, chips, muggu, setu line, arch), with our
own drawings. The copied code below stays the source of the logic; the look is ours. Paper and victory-native are
removed; charts are drawn with react-native-svg (`src/charts.tsx`), illustrations in `src/illustrations.tsx`.

App structure, like the original (login first, then the teacher's page):

- **Login first** (`src/app/login.tsx`, `src/auth.tsx`): demo teacher name + PIN on the phone, no accounts, no
  Firebase; remembered until **Log out** in Settings. Until then only the login route exists (`Stack.Protected`).
- **Tabs**: Home (the teacher's page, where login lands: welcome, school, date, "Screen a child", classrooms),
  Children, **Assignments**, Cases, Settings.
- **Child's tests** (`src/app/child/[childId].tsx`): every screening and detailed test of a child over time, from
  Children, a classroom, analytics or a case; "Screen again" and "Detailed test". Like the original `/results/<UID>/`
  list, which merged `UserOnlyResults` (self tests) and `UserAssignmentResults` (classroom tests) into result cards
  with "View Results" (`HomeNew.js`, `UDCard.js`).

### Parity table

| Original feature (file) | Ours (file) | Status |
|---|---|---|
| Login, then the teacher's profile page (`Login.js` → `EducatorHome.js`) | Demo login first, lands on Home = teacher's page (`login.tsx`, `index.tsx`) | Done, Firebase replaced by name + PIN on the phone |
| Sign out (`Signout.js`) | Log out in Settings (`settings.tsx`) | Done |
| Teacher profile: avatar, "Welcome", name, institute, date (`EducatorHome.js`) | Home band: teacher figure in the arch, "Welcome, name", school, date chip | Done |
| Create Classroom: name + strength (`EducatorCreate.js`) | `teacher/create.tsx`, with a live preview of the classroom card | Done |
| Classroom list with search and strength (`ClassroomList.js`) | Classroom tickets on Home with strength, children on the phone, latest assignment progress; search from 4 classrooms (`teacher/ClassroomList.tsx`) | Done |
| Add children to a classroom (their children joined by room code) | Classroom page: add children from this phone (`teacher/class.tsx`) | Done (no child app; the teacher adds them) |
| Assignments with cover, deadline, strength, progress bar (`AssignmentList.js`) | Assignment tickets (`teacher/Assignments.tsx`) on the **Assignments tab** (`assignments.tsx`) and on each classroom; past-deadline mark; Open / Past / All filter | Done |
| Create assignment: name + deadline, 7-day default (`AssignmentList.js`, `apigateway`) | Same, plus classroom chips and 1 / 2 / 4-week quick deadlines | Done |
| Copy Assignment ID (`AssignmentList.js`) | Not used: children have no app of their own to type it into | Left out (reason) |
| Assignment analytics: donut, colour-coded child cards, tap a slice to filter, More Details (`AssignmentAnalytics.js`) | Two-ring donut (outer: PASS / RETEST / REFER, inner: estimated grade), legend chips with counts that filter too, children as colour posts, tap a child for their tests, "More details" for the result, children not yet tested listed (`teacher/assignment/[id].tsx`, `charts.tsx`) | Done |
| Result cards per child over time (`HomeNew.js` + `UDCard.js`, `UserOnlyResults`, `UserAssignmentResults`) | Child's tests: date, type, assignment or "Individual test", outcome or estimated grade, link to the result (`child/[childId].tsx`, `childHistory()` in `teacher/data.ts`) | Done |
| Pre-test "Make sure.." with 6 pictures (`BeforeTest1.js`) | `original/MakeSure.tsx`, our six drawings | Done |
| Check your surrounding: mic picture, coloured reading, Test Confirmation (`QuietPlaceDetection.js`) | `original/Surrounding.tsx`: mic drawing whose rings follow our noise gate, inline confirmation with our 500 Hz rule | Done |
| Which ear: picture, Play, Left / Right / None (`EarTest.js`) | `original/WhichEar.tsx`: L/R earbud drawing, our left/right check | Done |
| Pre-test progress bar | Three-step bar: Make sure → Check your surrounding → Which ear (`detailed/[childId].tsx`) | Done |
| Detailed test: ear and head picture, progress, threshold bar with help, Hz / Replay / dB chips, Yes / No (`AudiometryTest.js`) | `original/AudiometryTest.tsx`: head in profile with the ear lit (left ear mirrored), both-ear progress, threshold bar in the ear's colour, help inline | Done |
| Masked phase (`AudiometryTest.js`) | Not used: no calibrated masking noise (config `detailed_test.masking`) | Left out (reason) |
| Your Results: category + description (`Results.js`) | Grade hero in the grade's colour + description, provisional-calibration note (`results/[testId].tsx`) | Done |
| Per-ear dB and grade cards with ear pictures | Left / right ear cards (badge, average dB, grade pill) | Done |
| Left vs right comparison (implicit in their two cards) | Plus mirrored bars per frequency (`EarBars`) | Done (ours, added) |
| Audiogram line chart, both ears (`Results.js`, Victory) | `Audiogram` in react-native-svg: ✕ left / ○ right, ▽ not heard, tap a frequency to read it | Done |
| Coloured-band audiogram (`audiogram-bg.png` + legend) | `Audiogram` with WHO grade bands drawn behind | Done |
| Category table (`Results.js`) | Categories with colour swatches, the child's grade highlighted, WHO citation | Done |
| Share menu: PDF / WhatsApp / doctor (`Results.js`, view-shot) | Bottom sheet; all three make one PDF (expo-print) and open the share sheet; the PDF says screening only | Done |
| Home bottom buttons: Start Test, Noise Data, Instructions, Legal Rules, Doctors Nearby (`HomeNew.js`) | Tab bar; "Find a quiet room" (room readings); doctors via the referral route (local facility CSV, no maps) | Partly: Legal Rules / Instructions / Maps left out (maps need a paid key) |
| Student self-test login and room code (`HomeNew.js`) | Not used: teachers test the children; no child accounts | Left out (reason) |
| Our own: screening test, referral cases, camp requests, sync, audit log | Unchanged | Kept |

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
| react-native-paper 5.11 (all their screens) | Used at first; **removed** in the fix-and-finish pass (2026-10-20): the screens are now built with our own components (`src/ui.tsx`) |
| victory-native 36 (pie, audiogram) | Used at first (37.3.6); **removed** in the fix-and-finish pass: only ever checked in jest, 30 victory/d3 packages, 35 MB. Charts are drawn with react-native-svg (`src/charts.tsx`), which already renders on the phone |
| expo-av (tones, recording) | Not used: our expo-audio player and mic (`useScreeningAudio`) |
| react-native-view-shot + expo-media-library (share as image) | Not used: share is a PDF from **expo-print** (MIT, in Expo Go) through **expo-sharing** |
| firebase, AsyncStorage, react-i18next, react-native-virtualized-view, react-native-floating-action, expo-clipboard | Not used: demo login (no Firebase), SQLite `kv`, our `useT()`, `ScrollView`; their unused help FAB and "Copy Assignment ID" dropped |

## Navigation

The original `_layout.js` is a `Slot` under an empty `Header`, with a row of buttons at the bottom of the home screen.
Ours (`src/TabBar.tsx`): Home, Children, Assignments, Cases, Settings; hidden at login and while a screening or detailed
test runs. Login comes first (see the fix-and-finish section).

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

### 6. Teacher view: `Screens/Educator/EducatorHome.js`, `EducatorCreate.js`, `Components/ClassroomList.js` → `src/app/index.tsx` (Home), `src/app/teacher/create.tsx`, `src/teacher/ClassroomList.tsx`

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

- Bottom tab bar (ours, see Navigation). Each tab opens with our Night band (`Band` in `src/art.tsx`: muggu, title,
  an Open Peeps figure in the arch, the setu line); the original's red banner (`Banner.tsx`) is removed.
- Images (fix-and-finish, 2026-10-20): the original pictures and our first flat redraws (`scripts/make_art.py`) are
  **removed**. Replaced by line drawings in `src/illustrations.tsx` (Team JL, Lucide glyphs, our palette) and the
  Open Peeps figures already in the app. Details and licences: `ATTRIBUTION.md`.

## Data flow summary

All on the phone (SQLite, offline). New local record types: `classroom`, `detailed_test` (and `assignment`, from the
previous integration). Synced as before: child (with class label), consent, screening session and result, cases.
Nothing new is synced; the detailed test result is not sent to the server (a later item).

## Not changed

Screening engine, rules, timing, sync, audit log, calibration values, `audiometer/`, `server/`.
