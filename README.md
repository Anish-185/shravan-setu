# Shravan Setu

School hearing **screening and referral** for the Seva First Innovation Challenge 2026 (Theme 3, Track A).

> **Shravan Setu is a screening and referral tool, not a diagnostic device.** It sorts children into PASS, RETEST or
> REFER and tracks each referral until the child is seen. It does not diagnose hearing loss or any ear condition.

Others built a hearing test. We built the system that makes sure the child actually gets treated: a teacher screens a
class on an ordinary Android phone with wired earphones, offline; every REFER becomes a referral case that is followed
through triage, an ear camp, a missed visit and a reschedule, to "seen" and "closed", and syncs to a laptop server
when there is Wi-Fi.

<p>
<img src="docs/screens/02-home.png" width="190" alt="Home">&nbsp;
<img src="docs/screens/10-child-mode-balloon.png" width="190" alt="Child mode: tap the balloon on every beep">&nbsp;
<img src="docs/screens/11-result-retest-provisional.png" width="190" alt="Result with the provisional-calibration line">&nbsp;
<img src="docs/screens/22-case-history.png" width="190" alt="Referral case history">
</p>
<p>
<img src="docs/screens/16-audiogram.png" width="190" alt="Detailed test audiogram">&nbsp;
<img src="docs/screens/20-assignment-analytics.png" width="190" alt="Assignment analytics donut">&nbsp;
<img src="docs/screens/24-camp-requests.png" width="190" alt="Camp requests">&nbsp;
<img src="docs/screens/26-te-home.png" width="190" alt="Home in Telugu">
</p>

Real screenshots from the team phone (Redmi 2201117TI, Samsung wired earphones, Expo Go) with fake children only.
All 30, with titles: [`docs/screens/`](docs/screens/README.md).

## Built on DhwaniSarathi

This repo is a fork of [DhwaniSarathi](https://github.com/S1ddh4rthaG/DhwaniSarathi) by team gps4 (Smart India
Hackathon 2023, SIH1403, a winning entry), Apache-2.0. Their original app is kept unmodified in `audiometer/` (only
leaked credentials were redacted); their README is in [`docs/ORIGINAL_README.md`](docs/ORIGINAL_README.md). Full
credits, file by file: [`ATTRIBUTION.md`](ATTRIBUTION.md).

| Theirs (integrated into our app, `docs/INTEGRATION_PLAN.md`) | Ours (new) |
|---|---|
| Pre-test "Make sure.." checklist, room check, "Which ear?" check | Two-stage screening: PASS / RETEST / REFER, with a rescreen before any referral |
| Teacher view: classrooms, assignments (screening rounds), analytics donut | Reliability gating with silent catch trials; 500 Hz gating; room-noise gate |
| Threshold test, offered as an optional **detailed hearing test** | Child mode (tap the balloon) with recorded Telugu voice instructions |
| Your Results: per-ear results, audiograms, WHO (2021) grade **estimates**, PDF share | Triage: "likely treatable cause → PHC", otherwise DEIC (triage, never a diagnosis) |
| Original Django backend (`server/apigateway/`) | Referral case state machine: camp scheduled, missed, rescheduled, seen, treated, closed, lost to follow-up |
| | Camp-request PDF and CSV (server), stubbed SMS reminders (logged, not sent) |
| | Offline-first store with client UUIDs and idempotent sync to a laptop server |
| | Tamper-evident hash-chained audit log (phone and server), quiet-spot finder, English + Telugu UI |
| | Team biological calibration tool; evaluation scripts (NHANES rule logic, SIMULATED district funnel, cost model) |

## Calibration is provisional

Tone levels come from a team baseline measured with 7 consenting adult volunteers on one phone and earphone model
(Redmi 2201117TI + Samsung wired earphones, media volume 6 steps, 2026-10-19), not from children and not against an
audiometer. At 500 Hz the baseline is a measured median. At 1, 2 and 4 kHz the phone could not play quietly enough to
find the volunteers' real thresholds, so the baseline there is an upper bound. In plain words: the 1-4 kHz tones may
be louder than intended, so the screen may miss milder hearing loss until the Stage 2 recalibration
([`docs/ROADMAP.md`](docs/ROADMAP.md); [`docs/CLAIMS.md`](docs/CLAIMS.md) CAL-01..03; `docs/ERROR_LOG.md` ERR-044).
All levels are **dB re: team baseline**, never dB HL. The detailed test's WHO grades are estimates for the same reason.

## Run it

Everything runs on a laptop and one Android phone on the same Wi-Fi. No accounts, no API keys, no cloud.

**Server** (Python 3.12, Django 5.2, SQLite), details in [`server/README.md`](server/README.md):

```
cd server
uv venv -p 3.12 .venv && uv pip install -p .venv/bin/python -r requirements-dev.txt
cp .env.example .env            # set DJANGO_SECRET_KEY, add the laptop's LAN IP to DJANGO_ALLOWED_HOSTS
.venv/bin/python manage.py migrate
.venv/bin/python manage.py seed_demo
.venv/bin/python manage.py runserver 0.0.0.0:8000
```

**App** (Expo SDK 57, Android only):

```
cd screener
npm install
npx expo start                  # scan the QR code with Expo Go on the phone
```

In the app: log in with a demo name and PIN (kept on the phone). For sync, Settings → Backend: server
`http://<laptop-ip>:8000` and a server login (`manage.py createsuperuser`). Screening, triage, cases and status updates work with no network; sync happens later. A step-by-step demo
path: [`docs/DEMO_PATH.md`](docs/DEMO_PATH.md); the 2-minute video script: [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md).

## Tests and evidence

```
cd server && .venv/bin/python -m pytest            # server: referrals, sync, rules, audit log
cd .. && server/.venv/bin/python -m pytest scripts # evaluation scripts
bash scripts/check_rules_parity.sh                 # Python and JS rules on the same shared fixtures
cd screener && npx jest && npx tsc --noEmit        # app
server/.venv/bin/python -m eval.report             # from the repo root: regenerates eval/results.md and CLAIMS
```

Every number we quote is in [`docs/CLAIMS.md`](docs/CLAIMS.md) with its condition and the script that produces it;
`python -m eval.report --check` (run by pytest) fails if a number drifts. Simulated results are labelled SIMULATED,
cost estimates PROPOSED. Rule thresholds live in [`config/screening.json`](config/screening.json), each with a source
or `TODO(source)`.

## Demo limitations

- Calibration is provisional (above). All device trials so far were with adult team members on one phone (CLAIMS
  P4-P6, CAL); there has been no school trial yet.
- Demo login: a name and PIN kept on the phone, no reset. Classrooms, assignments and detailed tests stay on the phone
  (not synced).
- SMS reminders are stubbed: the app logs what would be sent. Facilities come from a local CSV; the demo facility is
  fake.
- Runs in Expo Go.
- Roadmap and the Stage 2 pilot: [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Docs

[`ARCHITECTURE.md`](ARCHITECTURE.md) · [`docs/CLAIMS.md`](docs/CLAIMS.md) ·
[`docs/CONCEPT_NOTE_CHANGES.md`](docs/CONCEPT_NOTE_CHANGES.md) · [`docs/COST_AND_LICENSES.md`](docs/COST_AND_LICENSES.md) ·
[`docs/COST_MODEL.md`](docs/COST_MODEL.md) · [`docs/PRIVACY.md`](docs/PRIVACY.md) ·
[`docs/TEAM_TEST_PROTOCOL.md`](docs/TEAM_TEST_PROTOCOL.md) · [`docs/REUSE_LOG.md`](docs/REUSE_LOG.md) ·
[`docs/ERROR_LOG.md`](docs/ERROR_LOG.md) · [`docs/DESIGN.md`](docs/DESIGN.md) ·
[`docs/TELUGU_REVIEW.md`](docs/TELUGU_REVIEW.md)

## Licence

Apache License 2.0 ([`LICENSE`](LICENSE), the original team's file, unchanged). The original repo has no `NOTICE`
file. Fonts are SIL OFL 1.1 and illustrations CC0; every third-party piece and its licence is listed in
[`ATTRIBUTION.md`](ATTRIBUTION.md) and [`docs/COST_AND_LICENSES.md`](docs/COST_AND_LICENSES.md). Software cost: zero.
