<p align="center">
  <img src="screener/assets/images/icon.png" width="112" alt="Shravan Setu app icon: an amber hearing curve with a white dot on night indigo">
</p>

<h1 align="center">Shravan Setu</h1>

<p align="center">
  <b>Others built a hearing test. We built the system that makes sure the child actually gets treated.</b>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/licence-Apache--2.0-2456C9" alt="Licence: Apache-2.0"></a>
  <a href="docs/APK.md"><img src="https://img.shields.io/badge/platform-Android-1D1A4E" alt="Platform: Android"></a>
  <a href="#how-it-works"><img src="https://img.shields.io/badge/offline--first-yes-006B7A" alt="Offline-first"></a>
  <a href="docs/TELUGU_REVIEW.md"><img src="https://img.shields.io/badge/UI-Telugu%20%2B%20English-F4A300" alt="Telugu and English"></a>
  <a href="#run-it-yourself"><img src="https://img.shields.io/badge/tests-460%20passed-006B7A" alt="Tests: 460 passed"></a>
  <a href="https://github.com/Anish-185/shravan-setu/releases/tag/v1.0-sfic"><img src="https://img.shields.io/badge/release-v1.0--sfic-1D1A4E" alt="Release v1.0-sfic"></a>
</p>

A teacher screens a class on an ordinary Android phone with wired earphones, with no internet. Every child who needs
it becomes a referral case that the school follows through triage, a batched ear-camp request, missed visits and
reschedules, until the child is seen and treated. The case list syncs to a laptop server when there is Wi-Fi. Built
for the Seva First Innovation Challenge 2026 (Theme 3, Track A) on top of the open-source DhwaniSarathi app.

> **Screening and referral tool, not a diagnostic device.** It sorts children into PASS, RETEST or REFER and tracks
> each referral. It does not diagnose hearing loss or any ear condition.

<p align="center">
  <a href="https://github.com/Anish-185/shravan-setu/releases/tag/v1.0-sfic"><b>Download APK</b></a> ·
  <!-- Replace with the demo video URL once it is uploaded. -->
  <a href="docs/DEMO_SCRIPT.md"><b>Demo video</b></a> (coming soon) ·
  <a href="#how-it-works"><b>How it works</b></a> ·
  <a href="#screenshots"><b>Screenshots</b></a> ·
  <a href="#run-it-yourself"><b>Run it yourself</b></a>
</p>

<p align="center">
  <img src="docs/screens/10-child-mode-balloon.png" width="200" alt="Child mode: tap the balloon on every beep">&nbsp;
  <img src="docs/screens/11-result-retest-provisional.png" width="200" alt="Result: RETEST with the provisional-calibration line">&nbsp;
  <img src="docs/screens/22-case-history.png" width="200" alt="Referral case history: referred, camp, missed, rescheduled, seen">
</p>

## The problem in 3 numbers

<table>
<tr>
<td align="center" width="33%">
<h3>14.14%</h3>
of school children have hearing loss
<br><sub>Challenge brief; primary study TODO(source)</sub>
</td>
<td align="center" width="33%">
<h3>39.4% vs 88.5%</h3>
of referred children followed up: SMS reminders only vs ear camps held at school
<br><sub>Challenge brief; primary study TODO(source)</sub>
</td>
<td align="center" width="33%">
<h3>12.16 crore</h3>
children in government schools
<br><sub>TODO(source)</sub>
</td>
</tr>
</table>

Finding a child with a hearing problem is only half the job. In the brief's figures, most children referred with only
an SMS reminder never follow up; when the ear camp comes to the school, most do. So Shravan Setu treats the referral,
not the test, as the product. Pending sources are listed in [`docs/CITATIONS_NEEDED.md`](docs/CITATIONS_NEEDED.md).

## How it works

```mermaid
flowchart TB
    subgraph School["At school, offline"]
        direction LR
        S["Screen<br/>phone + wired earphones"] --> R{"Result"}
        R -->|PASS| P(["PASS"])
        R -->|RETEST| S
        R -->|REFER| T["Triage<br/>5 yes/no questions"]
        T --> C["School case<br/>opened on the spot"]
    end
    subgraph Follow["Follow-up until treated"]
        direction LR
        CR["Camp request<br/>cases batched per school"] --> SY["Sync<br/>when on Wi-Fi"]
        SY --> H["RBSK / DEIC<br/>health team"]
        H -->|seen| TR(["Treated"])
        H -->|missed| M["Reminder logged,<br/>camp rescheduled"]
        M --> H
    end
    School -->|"REFER cases"| Follow

    classDef pass fill:#006B7A,stroke:#006B7A,color:#ffffff
    classDef retest fill:#F2B33D,stroke:#F2B33D,color:#13294B
    classDef refer fill:#B23C00,stroke:#B23C00,color:#ffffff
    classDef loop fill:#1D1A4E,stroke:#1D1A4E,color:#ffffff
    classDef done fill:#F4A300,stroke:#F4A300,color:#13294B
    class P pass
    class R retest
    class T refer
    class S,C,CR,SY,H,M loop
    class TR done
    style School fill:#F2F7FC,stroke:#D9E4F1,color:#13294B
    style Follow fill:#F2F7FC,stroke:#D9E4F1,color:#13294B
```

1. **Screen.** Consent first, then the phone checks the room and the earphones. The child hears the instructions
   (recorded in Telugu) and taps a balloon on every beep at 1, 2 and 4 kHz, with a 500 Hz check.
2. **Result.** PASS, RETEST or REFER. A missed tone is rescreened before any referral; silent trials catch random
   tapping and turn it into RETEST, not a false PASS.
3. **Triage.** Five yes/no questions route the case: a likely treatable cause goes to the PHC first, otherwise the
   District Early Intervention Centre (DEIC). This is routing, never a diagnosis.
4. **Follow-up.** The school owns the case: camp scheduled, missed, rescheduled, seen, treated, closed. The teacher
   bundles open cases into one camp request, and the laptop server turns it into a PDF for the health team.

```mermaid
flowchart LR
    subgraph Phone["Phone, offline"]
        A["Screener app<br/>Expo / React Native"] --> DB[("SQLite<br/>+ audit log")]
    end
    subgraph Server["School server: a laptop"]
        API["Django server"] --> SDB[("SQLite<br/>+ audit log")]
        API --> PDF["Camp-request<br/>PDF and CSV"]
    end
    DB -->|"sync when on Wi-Fi<br/>idempotent, client UUIDs"| API
    PDF --> H["RBSK / DEIC team"]

    classDef app fill:#1D1A4E,stroke:#1D1A4E,color:#ffffff
    classDef store fill:#ffffff,stroke:#2456C9,color:#13294B
    classDef out fill:#F4A300,stroke:#F4A300,color:#13294B
    class A,API app
    class DB,SDB store
    class PDF,H out
    style Phone fill:#F2F7FC,stroke:#D9E4F1,color:#13294B
    style Server fill:#F2F7FC,stroke:#D9E4F1,color:#13294B
```

No cloud, no accounts, no API keys. Every record gets its ID on the phone, so syncing twice never duplicates
anything. Details: [`ARCHITECTURE.md`](ARCHITECTURE.md).

## Why it's different

- **The school owns the follow-up.** A REFER opens a case that stays on the teacher's list until the child is seen,
  through missed camps and reschedules. A test result alone changes nothing for the child.
- **Batched camp requests.** Referred children are bundled per school into one request, so the health team visits
  once for many children instead of each family travelling alone.
- **Guessing detection.** Silent catch trials are mixed in; a child who taps at random gets RETEST, not PASS.
- **Noise checked during every tone.** The microphone listens while each tone plays; a tone masked by noise is thrown
  away and replayed instead of being counted.
- **Offline and Telugu-first.** Screening, triage, cases and status changes work with no network. Every screen and
  the child's instructions are in Telugu, reviewed line by line by a native speaker.
- **Free and open source.** Apache-2.0, software cost zero, runs on a phone and a laptop the school already has.

## Screenshots

Real screenshots from the team phone (Redmi 2201117TI, Samsung wired earphones), fake children only. The grey gear
button is Expo Go's developer menu and does not appear in the APK. All 30, with titles:
[`docs/screens/`](docs/screens/README.md).

### Screening a child

<table>
<tr>
<td align="center" width="33%"><img src="docs/screens/05-consent.png" width="200" alt="Consent screen"><br><sub>Consent before any test</sub></td>
<td align="center" width="33%"><img src="docs/screens/07-pretest-checklist.png" width="200" alt="Pre-test checklist"><br><sub>Pre-test checklist</sub></td>
<td align="center" width="33%"><img src="docs/screens/08-room-noise-check.png" width="200" alt="Room noise check"><br><sub>Room noise check</sub></td>
</tr>
<tr>
<td align="center"><img src="docs/screens/09-voice-instructions.png" width="200" alt="Voice instructions"><br><sub>Instructions, with a Telugu voice clip</sub></td>
<td align="center"><img src="docs/screens/10-child-mode-balloon.png" width="200" alt="Child mode balloon"><br><sub>Child mode: tap the balloon</sub></td>
<td align="center"><img src="docs/screens/11-result-retest-provisional.png" width="200" alt="RETEST result"><br><sub>Result, with the provisional-calibration line</sub></td>
</tr>
</table>

### Referral and follow-up

<table>
<tr>
<td align="center" width="33%"><img src="docs/screens/21-cases.png" width="200" alt="Referral cases"><br><sub>Referral cases by status</sub></td>
<td align="center" width="33%"><img src="docs/screens/22-case-history.png" width="200" alt="Case history"><br><sub>Case history</sub></td>
<td align="center" width="33%"><img src="docs/screens/23-case-update-reminders.png" width="200" alt="Case update and reminders"><br><sub>Case update; reminders logged</sub></td>
</tr>
<tr>
<td align="center"><img src="docs/screens/24-camp-requests.png" width="200" alt="Camp requests"><br><sub>Camp requests</sub></td>
<td align="center"><img src="docs/screens/25-share-pdf.png" width="200" alt="Share as PDF"><br><sub>Share a result as PDF</sub></td>
<td></td>
</tr>
</table>

<details>
<summary><b>Getting started</b> (login, home, add a child, device check)</summary>
<br>
<table>
<tr>
<td align="center" width="25%"><img src="docs/screens/01-login.png" width="200" alt="Login"><br><sub>Demo login, kept on the phone</sub></td>
<td align="center" width="25%"><img src="docs/screens/02-home.png" width="200" alt="Home"><br><sub>Home</sub></td>
<td align="center" width="25%"><img src="docs/screens/04-add-child.png" width="200" alt="Add a child"><br><sub>Add a child by pseudonym</sub></td>
<td align="center" width="25%"><img src="docs/screens/06-device-check.png" width="200" alt="Device check"><br><sub>Device check</sub></td>
</tr>
</table>
</details>

<details>
<summary><b>Detailed test and results</b> (ear check, tone test, ear comparison, audiograms)</summary>
<br>
<table>
<tr>
<td align="center" width="33%"><img src="docs/screens/12-detailed-ear-check.png" width="200" alt="Which ear check"><br><sub>"Which ear?" check</sub></td>
<td align="center" width="33%"><img src="docs/screens/13-detailed-tone.png" width="200" alt="Detailed tone test"><br><sub>Per-ear, per-frequency tones</sub></td>
<td align="center" width="33%"><img src="docs/screens/15-ear-comparison.png" width="200" alt="Ear comparison"><br><sub>Left vs right ear</sub></td>
</tr>
<tr>
<td align="center"><img src="docs/screens/16-audiogram.png" width="200" alt="Audiogram"><br><sub>Audiogram</sub></td>
<td align="center"><img src="docs/screens/17-audiogram-grade-bands.png" width="200" alt="Audiogram on grade bands"><br><sub>Audiogram on WHO (2021) grade bands</sub></td>
<td></td>
</tr>
</table>

The detailed test is the original DhwaniSarathi threshold test, kept as an optional step after a REFER. Its grades
are estimates in dB re: team baseline, not dB HL.
</details>

<details>
<summary><b>Teacher view and analytics</b> (classroom, assignments, analytics, child history)</summary>
<br>
<table>
<tr>
<td align="center" width="25%"><img src="docs/screens/03-classroom.png" width="200" alt="Classroom"><br><sub>Classroom</sub></td>
<td align="center" width="25%"><img src="docs/screens/19-assignments.png" width="200" alt="Assignments"><br><sub>Screening rounds</sub></td>
<td align="center" width="25%"><img src="docs/screens/20-assignment-analytics.png" width="200" alt="Assignment analytics"><br><sub>Round analytics</sub></td>
<td align="center" width="25%"><img src="docs/screens/18-child-history.png" width="200" alt="Child history"><br><sub>One child's history</sub></td>
</tr>
</table>
</details>

<details>
<summary><b>Telugu</b> (home, instructions, result, case)</summary>
<br>
<table>
<tr>
<td align="center" width="25%"><img src="docs/screens/26-te-home.png" width="200" alt="Home in Telugu"><br><sub>Home</sub></td>
<td align="center" width="25%"><img src="docs/screens/27-te-voice-instructions.png" width="200" alt="Instructions in Telugu"><br><sub>Instructions for the child</sub></td>
<td align="center" width="25%"><img src="docs/screens/28-te-result-retest.png" width="200" alt="RETEST result in Telugu"><br><sub>RETEST result</sub></td>
<td align="center" width="25%"><img src="docs/screens/30-te-case.png" width="200" alt="Case in Telugu"><br><sub>Referral case</sub></td>
</tr>
</table>
</details>

## Evidence at a glance

Every number below is in [`docs/CLAIMS.md`](docs/CLAIMS.md) with its condition and the script that produces it.

| What | Result | Condition | Claim |
|---|---|---|---|
| Audio start delay (median), before vs after our fix | **486 ms → 60 ms** | One phone, one session each (n = 1) | [P5-01](docs/CLAIMS.md), [P6-01](docs/CLAIMS.md) |
| Children with hearing loss reaching care, per 10,000 screened: SMS reminders vs school ear camp | **557 vs 1,251** | **SIMULATED**; brief's follow-up rates (TODO(source)), ideal screen | [SIM-01](docs/CLAIMS.md), [SIM-02](docs/CLAIMS.md) |
| Screening rules checked against real audiograms | **5,456 children** | NHANES (US public survey), ages 6-18; rule logic only, not field accuracy | [NH-01](docs/CLAIMS.md) |
| Calibration | **7 adult volunteers** | Published biological-calibration method (Masalski et al. 2016); one phone and earphone model; **provisional** | [CAL-01..03](docs/CLAIMS.md) |
| Equipment cost per child per year | **₹14.9** (software ₹0) | **PROPOSED** team estimate, school phone, 250 students; not tested in a school | [COST-01](docs/CLAIMS.md) |

**Calibration is provisional.** At 500 Hz the team baseline is a measured median. At 1, 2 and 4 kHz the phone could
not play quietly enough to find the volunteers' real thresholds, so the baseline there is an upper bound: those
tones may be louder than intended, and the screen may miss milder hearing loss until the Stage 2 recalibration
(ERR-044). All levels are **dB re: team baseline**, never dB HL. All device trials so far were with adult team
members on one phone; there has been no school trial yet.

## Reach and impact

The app hands cases to the existing school-health pathway, the RBSK teams and the district DEIC, so scaling district
by district needs no new institution, only a phone and earphones per school. Adding a language is mainly a reviewed
translation of the UI strings plus new voice clips; Telugu is the first. Equipment cost is about ₹15 per child per
year (PROPOSED, COST-01), and the software is free.

## Features

| Feature | What it does |
|---|---|
| Screening | Consent, pre-test checklist, room check, child mode, PASS / RETEST / REFER with a rescreen before any referral |
| Detailed test | Optional per-ear, per-frequency threshold test (from DhwaniSarathi) with estimated grades |
| Triage | Five yes/no questions: likely treatable cause → PHC, otherwise DEIC |
| Cases | Referral state machine: referred, camp scheduled, missed, rescheduled, seen, treated, closed, or closed as lost to follow-up |
| Camp requests | Batch referred children per school; CSV on the phone |
| Sync | Offline-first store, idempotent sync to the laptop server when on Wi-Fi |
| PDF | Camp-request PDF (server) for the health team; share a single result as PDF from the phone |
| Audit log | SHA-256 hash chain of consents, results and status changes; verify in Settings on the phone, or `manage.py verify_audit_log` on the laptop |
| Quiet-room finder | Ranks rooms and hours by relative room noise |
| Teacher view | Classrooms, screening rounds with a deadline |
| Analytics | Outcome donut per screening round; tap a slice to see the children |
| Child history | Every test and the linked case for one child |
| Telugu voice | Recorded Telugu instructions for the child; full Telugu UI |
| Reminders | Missed-camp reminders logged (SMS sending is a future cost, stubbed today) |

## Tech stack and architecture

| Layer | Choice |
|---|---|
| Phone app | Expo SDK 57, React Native 0.86, TypeScript ([`screener/`](screener/)) |
| Offline data | SQLite on the phone (expo-sqlite), client-generated UUIDs |
| Server | Django 5.2 + Django REST framework, SQLite, Python 3.12 ([`server/`](server/)) |
| Rules | One rule set in [`config/screening.json`](config/screening.json); Python and JS engines must pass the same [shared fixtures](shared/fixtures/) |
| Audit log | Hash chain (SHA-256, `@noble/hashes` on the phone), verified on both sides |
| Evaluation | [`eval/`](eval/) and [`scripts/`](scripts/): NHANES rule check, SIMULATED district model, cost model |

Full design: [`ARCHITECTURE.md`](ARCHITECTURE.md). Original app (unchanged, for attribution): [`audiometer/`](audiometer/).

## Built on DhwaniSarathi

This repo is a fork of [DhwaniSarathi](https://github.com/S1ddh4rthaG/DhwaniSarathi) by team gps4 (Smart India
Hackathon 2023, SIH1403, a winning entry), Apache-2.0. Their app is kept unmodified in `audiometer/` (only leaked
credentials were redacted); their README is in [`docs/ORIGINAL_README.md`](docs/ORIGINAL_README.md).

<details>
<summary>What is theirs and what is ours</summary>
<br>

| Theirs (integrated into our app, `docs/INTEGRATION_PLAN.md`) | Ours (new) |
|---|---|
| Pre-test "Make sure.." checklist, room check, "Which ear?" check | Two-stage screening: PASS / RETEST / REFER, with a rescreen before any referral |
| Teacher view: classrooms, assignments (screening rounds), analytics donut | Reliability gating with silent catch trials; 500 Hz gating; noise gate during each tone |
| Threshold test, offered as an optional **detailed hearing test** | Child mode (tap the balloon) with recorded Telugu voice instructions |
| Your Results: per-ear results, audiograms, WHO (2021) grade **estimates**, PDF share | Triage: "likely treatable cause → PHC", otherwise DEIC |
| Original Django backend (`server/apigateway/`) | Referral case state machine and camp requests (PDF and CSV) |
| | Offline-first store with idempotent sync to a laptop server |
| | Hash-chained audit log, quiet-room finder, English + Telugu UI |
| | Team biological calibration tool; evaluation scripts |

Full credits, file by file: [`ATTRIBUTION.md`](ATTRIBUTION.md).
</details>

## Run it yourself

Everything runs on a laptop and one Android phone on the same Wi-Fi. No accounts, no API keys, no cloud.

<details open>
<summary><b>Server</b> (Python 3.12, Django 5.2, SQLite)</summary>

```
cd server
uv venv -p 3.12 .venv && uv pip install -p .venv/bin/python -r requirements-dev.txt
cp .env.example .env            # set DJANGO_SECRET_KEY, add the laptop's LAN IP to DJANGO_ALLOWED_HOSTS
.venv/bin/python manage.py migrate
.venv/bin/python manage.py seed_demo
.venv/bin/python manage.py runserver 0.0.0.0:8000
```

Details: [`server/README.md`](server/README.md).
</details>

<details open>
<summary><b>App</b> (Expo Go, Android)</summary>

```
cd screener
npm install
npx expo start                  # scan the QR code with Expo Go on the phone
```

In the app, log in with a demo name and PIN (kept on the phone). For sync, open Settings → Backend: server
`http://<laptop-ip>:8000` and a server login (`manage.py createsuperuser`).
</details>

<details>
<summary><b>APK install</b> (standalone, no Expo Go)</summary>

Download the APK from the [v1.0-sfic release](https://github.com/Anish-185/shravan-setu/releases/tag/v1.0-sfic),
copy it to the phone, open it in Files and allow "install unknown apps". arm64 phones only; SHA-256 and the signing
certificate are in [`docs/APK.md`](docs/APK.md). To build it yourself (JDK 17 + Android command-line tools, free, no
account): `bash scripts/build_apk.sh`.
</details>

<details>
<summary><b>Tests and the numbers check</b></summary>

From the repo root:

```
(cd server && .venv/bin/python -m pytest)          # server: referrals, sync, rules, audit log
server/.venv/bin/python -m pytest scripts          # evaluation scripts
bash scripts/check_rules_parity.sh                 # Python and JS rules on the same shared fixtures
(cd screener && npx jest && npx tsc --noEmit)      # app
server/.venv/bin/python -m eval.report --check     # recomputes every number and compares it with docs/CLAIMS.md
```

On a fresh clone (2026-10-21): server 231, scripts 41 and app 188 tests passed, rules parity OK, CLAIMS check OK.
`--check` changes no file; without the public NHANES files it skips the NHANES rows. To regenerate everything, see
[`eval/README.md`](eval/README.md).
</details>

The 2-minute demo path: [`docs/DEMO_PATH.md`](docs/DEMO_PATH.md) and [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md).

## Privacy and safety by design

- **Consent first.** No test starts until consent is recorded (who gave it, as a role, and how).
- **Pseudonyms, minimum data.** A display name such as "Student A1" and an age band; no date of birth, address,
  photo, ID number or audio recording ([`docs/PRIVACY.md`](docs/PRIVACY.md)).
- **Data stays local.** On the phone until synced, then on the school's own laptop. No cloud, and Android backup is
  turned off in the APK.
- **Tamper-evident audit log.** Consents, results and status changes are hash-chained; one tap shows if anything
  was changed.
- **No ads, no tracking, no analytics.** The app talks only to the school's laptop.
- **Screening, not diagnosis.** Results are PASS / RETEST / REFER, and triage is routing, not a diagnosis.

## Roadmap

```mermaid
flowchart LR
    A["Stage 1: Refine<br/>quieter tones, recalibrate,<br/>check against an audiometer"] --> B["Stage 2: School pilot<br/>minutes per child, coverage,<br/>follow-up, with SFIC support"]
    B --> C["Stage 3: District<br/>RBSK and DEIC teams,<br/>real SMS reminders"]
    C --> D["Stage 4: State and beyond<br/>more languages,<br/>per-model calibration"]

    classDef stage fill:#1D1A4E,stroke:#1D1A4E,color:#ffffff
    class A,B,C,D stage
```

Details and what each stage needs: [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Docs

[`ARCHITECTURE.md`](ARCHITECTURE.md) · [`docs/CLAIMS.md`](docs/CLAIMS.md) ·
[`docs/CONCEPT_NOTE_CHANGES.md`](docs/CONCEPT_NOTE_CHANGES.md) · [`docs/COST_AND_LICENSES.md`](docs/COST_AND_LICENSES.md) ·
[`docs/COST_MODEL.md`](docs/COST_MODEL.md) · [`docs/PRIVACY.md`](docs/PRIVACY.md) ·
[`docs/TEAM_TEST_PROTOCOL.md`](docs/TEAM_TEST_PROTOCOL.md) · [`docs/REUSE_LOG.md`](docs/REUSE_LOG.md) ·
[`docs/ERROR_LOG.md`](docs/ERROR_LOG.md) · [`docs/DESIGN.md`](docs/DESIGN.md) ·
[`docs/TELUGU_REVIEW.md`](docs/TELUGU_REVIEW.md)

## Licence

Apache License 2.0 ([`LICENSE`](LICENSE), the original team's file, unchanged). Fonts are SIL OFL 1.1 and
illustrations CC0; every third-party piece and its licence is in [`ATTRIBUTION.md`](ATTRIBUTION.md) and
[`docs/COST_AND_LICENSES.md`](docs/COST_AND_LICENSES.md). Software cost: zero.
