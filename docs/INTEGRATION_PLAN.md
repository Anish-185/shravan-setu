# Integration plan: original teacher, classroom, assignment, analytics and results screens

Date: 2026-10-20. Rollback point: git tag `pre-integration` (`33023fe37766c8c662c98d01d27706b3f3f3e33d`).

We copy the original DhwaniSarathi screens (Apache-2.0, `LICENSE` in the repo root) from `audiometer/app/` into
`screener/` and change only what our app needs. `audiometer/` itself is not edited. None of the original files carry a
licence header, so there is none to keep; each copied file gets a header naming the original file and our changes
(Apache-2.0 section 4(b): modified files carry a notice).

This is a screening and referral tool, never a diagnostic one. The original screens show hearing-loss grades
(Normal / Mild / Moderate / ... from a pure-tone average in dB HL). Our app screens at one fixed level and measures no
thresholds, so every grade, PTA, dB value and audiogram is replaced by our outcome (PASS / RETEST / REFER) and the
per-frequency heard / not heard / not tested status.

## What the original screens do

### `Screens/Login.js` (teacher and student login)

- Does: mobile number + password, signs in with Firebase Auth (`signInWithEmailAndPassword`), then fetches
  `/logininfos/<uid>/` from the Django backend to decide teacher (Type 1 → `EducatorHome`) or student (`HomeNew`).
  Also "Skip To Home" and a "Sign up" card.
- Data: Firebase user + `LoginInfo {FID, Type}`.
- Libraries: react-native-paper (`Card`, `TextInput`, `Button`, `PaperProvider` theme), react-i18next, firebase,
  AsyncStorage, expo-router.
- Changes: **Demo login** (labelled so on screen): teacher name + PIN kept on this phone (first login sets the PIN,
  later logins must match it). No Firebase, no network, no student branch, no Skip / Sign-up. Paper components →
  our `Card`, `s.input`, `Btn`. AsyncStorage → our `kv` table. i18next `t()` → our `useT()`.

### `Screens/Educator/EducatorHome.js` (teacher profile + classrooms)

- Does: fetches `/educators/<EID>` (name, institute), shows a header band (background image, avatar, "Welcome",
  teacher name, institute), today's date, a "Create Classroom" button, a "Classrooms" bar and `<ClassroomList>`.
- Data: `Educator {EID, EducatorName, InstituteName}`.
- Libraries: react-native-virtualized-view (`ScrollView`), AsyncStorage, expo-router.
- Changes: name from the demo login, institute = the school picked in Settings (`kv school_name`). Header images
  (`background.png`, `profile.png`) → our Night band + `user-round` tile (the original images have no recorded
  source). react-native-virtualized-view → React Native `ScrollView` (the list is small; not in Expo Go's set of
  needed modules). "Create Classroom" → "Add children": our classrooms are made from children's class labels, so a
  classroom appears when a child with that label is added. Keeps the date line and "Classrooms" bar.

### `Screens/Educator/EducatorCreate.js` (create classroom: name + strength)

- Does: POST `/classrooms/` with `ClassroomName`, typed `Count`, `EID`.
- Changes: **not copied.** Our class strength must be the real number of children (brief), so a typed strength
  would be wrong. Its job is done by the class label field on our "Add a child" form.

### `Components/ClassroomList.js` (searchable classroom cards)

- Does: fetches `/educators/<EID>/classrooms/`, search box filters by name, each card shows `ClassroomName` and
  "Classroom Strength: Count", links to `AssignmentList` with `CID`, `Count`.
- Changes: data from local SQLite: children of the selected school grouped by `class_label` (strength = number of
  children). Link → `/teacher/class?label=…`. Same search filter and card (title + strength) in our card style.
  Children with no label are grouped as "No class label".

### `Screens/Educator/AssignmentList.js` (a classroom's assignments)

- Does: fetches `/classrooms/<CID>/assignments/` (each with `SubmittedCount`, deadline), search box, one Paper card
  per assignment with a random stock cover image, deadline, class strength, progress `SubmittedCount/Count` with a bar,
  "Copy Assignment ID" (students typed the ID into their own app). Bottom form: name + (unwired) deadline →
  POST `/assignments/` (server default deadline: now + 7 days).
- Libraries: react-native-paper, expo-clipboard, react-native-vector-icons/FontAwesome, `assets/AssignmentImages/*.jpg`.
- Changes: an assignment = one **screening round** for a class, stored on the phone as a local record
  (`assignment`: school, class label, name, created, deadline; not synced). Deadline keeps their default of 7 days.
  Progress = children of the class screened in the round (a screening session started between creation and the end of
  the deadline day) ÷ class strength, from our `screening_session` records. Paper → our `Card`; FontAwesome → our
  `Icon`; random cover images dropped (no recorded source); "Copy Assignment ID" dropped (children have no app of their
  own, so there is nothing to type it into); the unwired deadline input dropped.

### `Screens/Educator/AssignmentAnalytics.js` (assignment results + pie chart)

- Does: fetches `/assignments/<AID>/userassignmentresults/`, puts each student into a hearing-loss category from the
  worse ear's PTA (`Normal` -10..19, `Mild`, `Moderate`, `Severe`, `Profound`), draws a `VictoryPie` of the
  categories (tap a slice to filter the list), labels with percentages, and lists students (name coloured by category,
  age, gender, "More Details" → `Results`).
- Libraries: victory-native (`VictoryPie`, `VictoryLabel`).
- Changes: categories → our outcome (PASS / RETEST / REFER) of the child's latest screening in the round; colours →
  our `OUTCOME` colours. Same pie, slice tap filters the list, percentage labels, card list. **No severity grades.**
  Card: name, age band (no gender: we record none by default), outcome pill, "More details" → results.
  Chart library swapped, see below.

### `Screens/Results.js` (one test's results)

- Does: from the `results` param (list of `{ear, frequency, threshold, measurementType}`), computes a PTA per ear,
  a category per ear and combined, shows a category table with dB HL ranges, left/right ear cards with ear images and
  "NN dB", a Victory audiogram (two charts, one over a background image) and a share modal (view-shot image,
  WhatsApp, a no-op "Share with Doctor").
- Libraries: victory-native, react-native-view-shot, expo-sharing, expo-file-system, expo-media-library, AsyncStorage,
  @expo/vector-icons, react-i18next.
- Changes: param = our `sessionId`; data = our `screening_result` (`outcome`, `ear_outcomes`,
  `frequency_results`). Keep the layout: title, top grid item (outcome + one-line meaning instead of category + dB
  range), legend grid item (PASS / RETEST / REFER meanings instead of grade ranges), left / right ear cards (ear
  outcome pill instead of "NN dB" + grade), and the audiogram grid item becomes a per-frequency table (heard / not
  heard / not tested per ear). **No PTA, no grades, no dB thresholds, no audiogram.** Share modal dropped (no export of
  child results as images; our session export stays on the test result step).

### `utils/Audiometry.js`

- Does: the original test's state machine (ear × masking × frequency × amplitude sweep, `expo-av` tone playback),
  producing the `{ear, frequency, threshold}` list that `Results.js` reads.
- Changes: **not copied.** Our screening engine (`screener/src/engine/`, fixed level, rules in `src/rules/`) is
  unchanged, as the brief requires. `Results.js` is adapted to read our engine's stored result instead.

### Server: `server/apigateway/` (`Educator`, `Classroom`, `Assignment`, `UserAssignmentResults`)

- `Educator {EID, EducatorName, InstituteName}`, `Classroom {CID, EID, ClassroomName, Count}`,
  `Assignment {AID, CID, AssignmentName, Deadline}`, `UserAssignmentResults {AID, UID, CID, Results JSON}`; views add
  `SubmittedCount` per assignment and join `User` details onto results.
- Changes: none to `apigateway` (kept as the original). Our `referrals.Child` gets an optional `class_label`
  (max 20 characters, e.g. "5A", no other personal data) with migration `0005`. It reaches the server through the
  existing `/api/sync/` child upsert (`fields = "__all__"`), so sync code does not change. (`referrals.Classroom`, an
  FK used by the seed command, is left as it is.)

## Libraries and Expo Go SDK 57

| Original library | Runs in our app? | Decision |
|---|---|---|
| victory-native 36 (pie, audiogram) | Its maintained SVG line, `victory-native@37.3.6` (MIT), installs 40 MB in 51 packages, over CLAUDE.md's ~5 MB ask-first limit; React 19 / RN 0.86 support not verified | Swap only the chart: a ~40-line pie on **react-native-svg** (already installed). Same props idea (`data` of `{x, y}`, `colorScale`, slice tap). Audiogram not needed (no thresholds) |
| react-native-paper | Pure JS, would run, but our design system replaces its look | Not added; our `Card` / `Btn` / `s.input` |
| firebase | Banned (CLAUDE.md) | Removed (demo login) |
| react-native-vector-icons | Not installed; we have our own icon set | Our `Icon` |
| react-native-virtualized-view | Not needed | React Native `ScrollView` |
| expo-clipboard | In Expo Go | Not needed (copy ID dropped) |
| react-native-view-shot, expo-media-library | In Expo Go | Not needed (share modal dropped) |
| AsyncStorage | Not installed | Our SQLite `kv` table |
| react-i18next | Not installed | Our `useT()`; new strings `TODO_TE` |

## Navigation (expo-router, `screener/src/app/`)

| Original route | New route | File |
|---|---|---|
| `/Screens/Login` (teacher branch) | `/teacher/login` | `src/app/teacher/login.tsx` |
| `/Screens/Educator/EducatorHome?EID=` | `/teacher` | `src/app/teacher/index.tsx` + `src/teacher/ClassroomList.tsx` |
| `/Screens/Educator/AssignmentList?CID=&Count=` | `/teacher/class?label=` | `src/app/teacher/class.tsx` |
| `/Screens/Educator/AssignmentAnalytics?AID=` | `/teacher/assignment/[id]` | `src/app/teacher/assignment/[id].tsx` + `src/teacher/Pie.tsx` |
| `/Screens/Results?results=` | `/teacher/result/[sessionId]` | `src/app/teacher/result/[sessionId].tsx` |

Home gets one more row, "Teacher view", to `/teacher/login`. Local data queries live in `src/teacher/data.ts`.

## Not changed

Screening engine, rules, timing, calibration, sync code, `audiometer/`, `server/apigateway/`.
