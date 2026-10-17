# Architecture

> Screening and referral tool, not a diagnostic device.

Part (a) describes the original DhwaniSarathi system as it is in this repo. Part (b) describes what we are building.

## (a) Original system (as-is)

### Components

```
audiometer/  Expo SDK 49 app (React Native 0.72, expo-router 2, expo-av). Firebase Auth for login.
server/      Django + DRF + SQLite. One app: apigateway. Function-based views, no authentication.
```

The app talks to the server over plain HTTP at a hardcoded LAN IP (`audiometer/app/Constants/ip.js`).
It does not work offline: results are POSTed at the end of a test.

### Data model (`server/apigateway/models.py`)

| Model | Key | Fields |
|---|---|---|
| LoginInfo | FID (Firebase UID) | Type (0 = student, else educator) |
| User | UID | UserName, Age, Gender |
| Educator | EID | EducatorName, InstituteName |
| Classroom | CID (UUID) | EID → Educator, ClassroomName, Count |
| Assignment | AID (UUID) | CID → Classroom, AssignmentName, Deadline |
| UserAssignmentResults | auto id | AID, UID, CID, Timestamp, Results (JSON) |
| UserOnlyResults | auto id | UID, Timestamp, Results (JSON) |

### Endpoints (`server/backend/urls.py`)

`/logininfos/`, `/users/`, `/educators/`, `/educators/<EID>/classrooms/`, `/classrooms/`,
`/classrooms/<CID>/assignments/`, `/assignments/`, `/assignments/<AID>/userassignmentresults/`,
`/assignments/<AID>/validate/`, `/userassignmentresults/`, `/useronlyresults/`, `/results/<UID>/`, `/admin/`.
List endpoints accept GET/POST; detail endpoints accept GET/PUT/DELETE. None require authentication.

### Screens (`audiometer/app/Screens/`)

Login, Signup, GetStarted, HomeNew, UserTutorial, BeforeTest1 (preliminary checks), QuietPlaceDetection (noise),
EarTest (headphone orientation), JewelleryDetection, AudiometryTest (`app/AudiometryTest.js`), Results,
Educator/* (classrooms, assignments, analytics), Maps / MapData, ML (document digitisation), LegalComplianceInformation.

### Test algorithm (`audiometer/app/utils/Audiometry.js`, `utils/CONFIG.js`)

- Frequencies 250, 500, 1000, 2000, 4000, 8000 Hz; left ear then right ear; an unmasked pass then a "masked" pass for each.
- Levels start at 0 and ascend in 10 dB steps up to 140 (`AMPLITUDE_PTS`). The first "yes" records that level as
  the threshold and jumps to the next frequency. There is no descending bracket, no catch trial and no response window.
- Each tone is a pre-generated stereo WAV, 10 s long at 44.1 kHz (checked from the file header).
- Volume mapping is uncalibrated: `volume = 10^((dB − 75) / 20)`, clamped to 1.0. `MAX_DB = 75` is a fixed
  "device specific" constant. Every level from 75 upward plays at full volume, and the system volume is not checked.
- Results show a four-frequency pure-tone average per ear with a hearing category label (`Screens/Results.js`).
- Noise metering (expo-av `Recording` metering, which the expo-av docs describe in dBFS) runs on a separate screen
  **before** the test only. Nothing is measured while tones play. The colour thresholds there (60 / 80) look like
  positive dB SPL values, while dBFS readings are ≤ 0. To confirm on a device in the Phase 1 spike.

## (b) Target architecture (ours)

```
screener/  Expo app (current SDK, Expo Go compatible), offline-first
  expo-sqlite  local DB: every write lands here first
  outbox       table of pending changes, pushed on "Sync"
  src/rules/   JS port of the rule engine
  flows        consent → device/volume check → L/R check → quiet baseline → screening → result → triage → case
        │  HTTPS/HTTP on LAN, only when the teacher taps Sync
        ▼
server/   Django 5.2 LTS + DRF + SQLite on a laptop
  apigateway/  original app (kept; auth added in Phase 2)
  referrals/   our app: School, Child, Consent, ScreeningSession/Result, Case, CaseEvent,
               CampRequest, ReminderLog (stubbed), Facility (local CSV)
               /sync/ idempotent batch upsert by client UUID
               rules/  Python reference rule engine
config/screening.json   every threshold, each with a "source" field; read by both rule engines
shared/fixtures/        JSON test vectors; pytest and jest must agree on every one
scripts/, eval/         simulator, NHANES rule evaluation, cost model, eval.report → eval/results.md, docs/CLAIMS.md
```

Key decisions:

- **Offline-first.** Screening, triage, case creation and status changes work with no network. Sync is manual and
  idempotent: every record has a client-generated UUIDv4.
- **Two-stage screening with reliability gating.** Fixed-level sweep, catch trials, per-tone noise gating during
  playback, immediate rescreen of failed frequencies only. Unreliable sessions become RETEST, never REFER.
- **Closed referral loop.** A REFER creates a Case with an explicit state machine
  (screened → referred → camp_scheduled → seen → treated → closed, plus missed / rescheduled / lost to follow-up),
  batched into camp requests for RBSK/DEIC teams. Reminders are logged, not sent.
- **Triage routing**, not diagnosis: a yes/no checklist routes a likely treatable cause to a PHC, otherwise to DEIC.
- **Sound levels** are relative to a biological calibration baseline ("dB re: team baseline").
