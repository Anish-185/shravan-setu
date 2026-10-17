# Claude Code prompts: SFIC 2026 hearing screening and referral project

## How to use this file

1. Fork https://github.com/S1ddh4rthaG/DhwaniSarathi on GitHub, clone your fork, and put `CLAUDE.md` in the repo root. Claude Code reads it automatically every session.
2. Fill in the placeholders in `CLAUDE.md` first: `[PHONE_MODEL]`, `[EARPHONE_MODEL]`, `[TELUGU_SPEAKER]`.
3. Run the prompts below **in order**, one phase per session. Start each phase in **plan mode** (Shift+Tab), approve the plan, then let it build.
4. After each phase: read the end-of-phase report, run the tests yourself, commit, then run `/clear` before the next prompt so the context stays small.
5. **Errors carry over automatically.** During a phase, Claude Code logs every error it hits (fixed or not) in `docs/ERROR_LOG.md` with the root cause and fix. Its end-of-phase report explains every unfixed error and how to fix it. Each next prompt starts with 'Step 0': fix those errors first, rerun all tests, then do the new phase. Because the log is a file in the repo, this works even after `/clear`. If you saw an error yourself (for example on the phone), add one line to the top of the next prompt, such as: `Also fix: app crashes when tapping Sync offline.`
6. Prompts marked **NEEDS YOU** require a real phone, earphones or people. Claude Code will give you a checklist and wait.

Copy everything inside each code block.

---

## Prompt 0: Cleanup, attribution and architecture (Day 1)

```
Read CLAUDE.md fully. This is Phase 0: cleanup, attribution, and architecture. Do not build features yet.

Context from our audit of the original repo:
- audiometer/ is an Expo SDK 49 app. It won't run in current Expo Go. We will NOT upgrade it; it stays untouched as the original team's work.
- server/ is Django 5.0 + DRF + SQLite. It runs on Python 3.12 but has no auth on any endpoint, DEBUG=True, a hardcoded SECRET_KEY, and a committed db.sqlite3 with test records.
- audiometer/FirebaseConfig.js and audiometer/app/Screens/JewelleryDetection.js contain the original team's hardcoded credentials (Firebase config, Clarifai token).
- server/requirements.txt is UTF-16 encoded.

Tasks:
1. Remove server/db.sqlite3 from the tree and add it to .gitignore. Add .env to .gitignore.
2. Convert server/requirements.txt to UTF-8. Upgrade Django to the 5.2 LTS line and pin all versions. Move SECRET_KEY and DEBUG to environment variables (python-dotenv or os.environ, no paid tool). Add .env.example. Confirm `python manage.py check` and `migrate` work on a fresh DB.
3. Do NOT edit audiometer/. In docs/SECURITY_NOTE.md, record that credentials exist in the original repo's git history, that we do not use them, and that we will inform the original team. Don't print the secrets anywhere.
4. Write ATTRIBUTION.md:
   - Credit the original DhwaniSarathi team by name (from their README) and the Apache-2.0 licence. Keep LICENSE unchanged.
   - Table "Original features (theirs)": pure-tone test, results/audiogram view, classroom/teacher/assignment management with analytics, nearest-doctor map (placeholder data), document digitisation (third-party Hugging Face space iframe), jewellery detection (Clarifai API), preliminary checks (noise detection, headphone orientation).
   - Table "Our features": leave as a list to fill in per phase.
   - Section "Third-party code and assets we reuse": empty for now.
5. Write ARCHITECTURE.md describing: (a) the original system as-is (models, endpoints, screens, test algorithm: ascending 10 dB steps from 0 with 10 s tones; uncalibrated volume mapping; dBFS noise metering before the test only), and (b) our target architecture: screener/ offline-first app with expo-sqlite + outbox sync, Django `referrals` app, config/screening.json, shared fixtures, evidence tooling.
6. Create the empty folder structure from CLAUDE.md with README stubs: screener/, config/, shared/fixtures/, scripts/, eval/, docs/, data/raw/ (gitignored).
7. Create docs/REUSE_LOG.md, docs/COST_AND_LICENSES.md and docs/ERROR_LOG.md with headers (ERROR_LOG uses the entry format in CLAUDE.md). Log any error you hit in this phase, including the Django upgrade and fresh-DB migration.
8. Audit server/ dependencies for licence and cost and record them in COST_AND_LICENSES.md.

End with the end-of-phase report from CLAUDE.md.
```

---

## Prompt 1: Device spike (Day 1). NEEDS YOU

```
Read CLAUDE.md. First do Step 0 from CLAUDE.md: read docs/ERROR_LOG.md, fix every OPEN / WORKAROUND / NEEDS-HUMAN error using the fixes proposed in the last report, run all test suites, and report what you fixed. Only then start this phase.

Phase 1: a throwaway technical spike to remove the biggest unknowns before we build. Keep it small.

1. Check the Expo changelog / docs (web) for which SDK the current Play Store Expo Go supports. Scaffold screener/ with that SDK using create-expo-app (free). Use expo-router. Plan to stay within modules that run in Expo Go (expo-audio, expo-sqlite, expo-file-system, expo-sharing, expo-print), so the demo needs no custom native build.
2. Reuse check (follow the protocol in CLAUDE.md): search GitHub for open-source React Native / Expo pure-tone audiometer or hearing-screening apps with an allowlisted licence. Log candidates in REUSE_LOG.md. Note anything reusable: tone generation, timed response windows, catch trials, mic metering during playback.
3. Verify in the official expo-audio docs whether (a) recording with metering and (b) simultaneous playback are supported, and how to configure the audio mode for both at once. Don't assume; cite the doc page in the report.
4. Build ONE spike screen, screener/app/spike.tsx, that:
   - plays the original repo's stereo tones (copy 1000 Hz and 4000 Hz left/right WAVs from audiometer/app/assets/puretones into screener/assets/tones/ and credit them in ATTRIBUTION.md), at a volume chosen from a slider;
   - shows live mic metering (dBFS) while the tone plays;
   - logs timestamped metering samples to a JSON file I can share.
5. Give me a step-by-step checklist to run on [PHONE_MODEL] with [EARPHONE_MODEL] (wired), covering:
   a) Does it open in Expo Go?
   b) Does metering keep updating while a tone plays?
   c) With earphones plugged in, does the metering source change (inline mic vs phone mic)? Test by tapping each mic.
   d) Does the tone leak into the mic? Compare metering in a quiet room with the tone on vs off, at the slider level we expect to use for screening.
   e) What is the quiet-room baseline vs a noisy corridor (relative dBFS only)?
Then STOP and wait for my results. Don't build further until I report back.
```

---

## Prompt 2: Backend referral tracker (Day 2)

```
Read CLAUDE.md. First do Step 0 from CLAUDE.md: read docs/ERROR_LOG.md, fix every OPEN / WORKAROUND / NEEDS-HUMAN error using the fixes proposed in the last report, run all test suites, and report what you fixed. Only then start this phase.

Phase 2: backend referral tracker in a new Django app server/referrals. Don't modify apigateway models except to add auth.

Reuse check first (protocol in CLAUDE.md) for:
- Django finite-state-machine libraries (compare against a hand-written transition table; prefer hand-written if it's under ~100 lines).
- Server-side PDF generation without paid services (e.g. reportlab, BSD).
- Offline-sync / idempotent upsert patterns for DRF.
Log the decisions in REUSE_LOG.md.

Build:
1. Models (UUID primary keys, client-generated):
   - School, Classroom (link to existing where sensible), Child (minimal fields: pseudonymous display name, class, age band, sex optional, guardian phone OPTIONAL), Consent (who, when, method).
   - ScreeningSession (device model, earphone model, volume confirmation, app version, config version) and ScreeningResult (per ear/frequency outcomes, reliability score, noise events, outcome PASS/RETEST/REFER).
   - Case: owned by school/teacher, not by a phone number.
   - CaseEvent: append-only status history with actor and timestamp.
   - CampRequest: batch of cases for an RBSK team / DEIC.
   - ReminderLog: stubbed messages that WOULD be sent, with Telugu + English text from templates.
   - Facility: loaded from a local CSV (type PHC/DEIC, name, mandal, district). Ship ONLY obviously fake sample rows ("SAMPLE-PHC-1"). Never invent real facility names.
2. State machine with explicit allowed transitions:
   screened → referred → camp_scheduled → seen → treated(wax_removed | infection_treated | hearing_aid | further_audiology) → closed,
   plus camp_scheduled → missed → rescheduled → camp_scheduled, and closed_lost_to_followup with a reason.
   Illegal transitions raise errors and are rejected by the API.
3. API (DRF, token auth required on everything, including the old apigateway endpoints):
   - /sync/ batch upsert endpoint, idempotent by UUID, returns per-record status.
   - Case list/detail/transition; camp request creation from selected cases.
   - Camp request export as CSV and PDF (school, date, list of children by pseudonymous ID, ear, outcome, triage route; a "SCREENING, NOT DIAGNOSIS" banner).
   - Reminder log endpoint ("would send" log for missed appointments).
4. Seed command: python manage.py seed_demo, creating one fake school with ~30 fake students and cases in mixed statuses for the demo.
5. Tests (pytest + pytest-django): every legal and illegal transition, sync idempotency (same payload twice = no duplicates), camp export contents, auth required.
6. Update ATTRIBUTION.md (our features), COST_AND_LICENSES.md, ARCHITECTURE.md (data model diagram as Mermaid).

End with the end-of-phase report.
```

---

## Prompt 3: Shared rule engine and config (Day 2)

```
Read CLAUDE.md. First do Step 0 from CLAUDE.md: read docs/ERROR_LOG.md, fix every OPEN / WORKAROUND / NEEDS-HUMAN error using the fixes proposed in the last report, run all test suites, and report what you fixed. Only then start this phase.

Phase 3: the screening rule engine as pure, tested code, BEFORE any UI.

1. Create config/screening.json with a "source" field on every value. Parameters:
   - frequencies to screen per ear; screening level in "dB re: team baseline" (value TODO until biological calibration; the convention of screening at 20–25 dB HL at 1, 2 and 4 kHz goes in "source" as a citation TODO);
   - tone duration, response window, randomized inter-stimulus interval range;
   - number of catch trials, reliability thresholds for RETEST;
   - noise gate threshold (relative to quiet baseline), max replays per tone;
   - 500 Hz policy: "always" | "never" | "only_if_ambient_below" with its threshold;
   - rescreen policy (rescreen only failed frequencies, max one rescreen round);
   - triage routing rules.
   Use clearly marked placeholder values where we have no evidence yet.
2. Reuse check: search for open-source implementations of play-audiometry catch/control trials, false-alarm-rate scoring, or screening decision rules. Log in REUSE_LOG.md.
3. Python reference implementation in server/referrals/rules/:
   - decide_outcome(trials, noise_events, config) -> PASS / RETEST / REFER with reasons
   - rescreen_plan(first_pass, config) -> list of (ear, freq) to retest
   - reliability_score(trials) using catch-trial false alarms and responses outside the window
   - apply_500hz_policy(...)
   - triage_route(checklist_answers, config) -> PHC / DEIC with the rule that fired
   Rules must be simple and explainable. Every outcome returns human-readable reasons.
4. JavaScript port in screener/src/rules/ with identical behaviour.
5. shared/fixtures/*.json: at least 30 test vectors covering pass, single-frequency fail fixed by rescreen, persistent fail → REFER, random tapper → RETEST, noisy 500 Hz excluded, noise replay limit hit → RETEST, triage to PHC vs DEIC. pytest AND jest both load every fixture and must agree exactly.
6. Add a CI-style script `scripts/check_rules_parity.sh` that runs both test suites.

End with the end-of-phase report.
```

---

## Prompt 4: Test engine, offline storage and sync in the app (Day 3)

```
Read CLAUDE.md. First do Step 0 from CLAUDE.md: read docs/ERROR_LOG.md, fix every OPEN / WORKAROUND / NEEDS-HUMAN error using the fixes proposed in the last report, run all test suites, and report what you fixed. Only then start this phase.

Phase 4: the screening flow in screener/, using the rule engine from Phase 3 and the spike results I reported in Phase 1: [PASTE YOUR SPIKE RESULTS HERE].

Reuse check first for: tone generation/playback scheduling in Expo, offline-first sync libraries for expo-sqlite (compare a heavy library like WatermelonDB vs a simple hand-written outbox; prefer simple), and UUID generation. Log the decisions.

Build:
1. Local database (expo-sqlite) mirroring the backend models needed on the phone, plus an outbox table. All writes go local first.
2. Sync screen: teacher taps "Sync" when online; push the outbox to /sync/, pull case updates; show per-record status; safe to retry. Token stored with expo-secure-store if available in Expo Go, otherwise document the limitation.
3. Pre-test flow: consent record → device/earphone/volume confirmation (tester confirms volume at the fixed level; we can't set system volume) → headphone left/right check (port the original idea, credit it) → quiet-baseline noise measurement.
4. Test engine:
   - fixed-level sweep per config; each tone in a timed response window with randomized gaps;
   - catch trials (silent windows) randomly inserted;
   - per-tone noise gating: if metering during the tone exceeds the gate, discard and replay that tone automatically (up to the config limit);
   - 500 Hz policy from config;
   - automatic immediate rescreen of ONLY failed frequencies;
   - outcome via decide_outcome(); unreliable → RETEST, never REFER.
5. Result screen: PASS/RETEST/REFER with plain-language reasons and a permanent "Screening only, not a diagnosis" banner. REFER creates a Case locally.
6. Tests: jest tests for the engine state machine using a fake audio/clock layer (no real audio in tests).
7. Give me a NEEDS YOU checklist: run 3 full tests on the phone, one in a quiet room, one in a noisy corridor, one with deliberate random tapping, and send back the exported session JSONs.

End with the end-of-phase report.
```

---

## Prompt 5: Triage, Telugu child mode and case screens (Day 4, feature freeze)

```
Read CLAUDE.md. First do Step 0 from CLAUDE.md: read docs/ERROR_LOG.md, fix every OPEN / WORKAROUND / NEEDS-HUMAN error using the fixes proposed in the last report, run all test suites, and report what you fixed. Only then start this phase.

Phase 5, the last must-have phase. Must-haves freeze at the end of it.

Reuse check for: Telugu font (Noto Sans Telugu, OFL), i18n library already compatible with Expo (i18next is fine), child-friendly tap-target or balloon animation components with allowlisted licences. Log the decisions.

Build:
1. Ear-health triage checklist (Telugu + English), yes/no, big buttons: ear discharge, ear pain, recent cold, blocked feeling, teacher observation "often asks for repetition". Route with triage_route(): likely treatable cause → nearest PHC, otherwise → DEIC. Label "Triage, not diagnosis". Store answers on the Case.
2. Child mode: one huge balloon tap target, minimal text, Telugu voice instructions played from screener/assets/voice/te/*.m4a. If recordings aren't ready, use silent placeholder files and a visible "voice placeholder" tag in dev builds. Create docs/VOICE_SCRIPT.md listing every line [TELUGU_SPEAKER] must record (English meaning + where it plays). Do NOT machine-translate; leave TODO_TE for missing strings.
3. Teacher case screens: case list filtered by status, case detail with full status history, transition buttons limited to legal transitions, "Create camp request" from selected referred cases, and export/share CSV from the phone (expo-sharing) plus a printable PDF (expo-print). All offline.
4. Reminder log: when a case is marked missed, generate the Telugu + English reminder text from templates and log it as "would send (stubbed)". No real SMS.
5. Language toggle (Telugu/English), Telugu as an option on every screen.
6. Full demo path test: seed → screen 3 children (use the fake layer) → 1 REFER → triage → case → camp request → seen → treated → closed. Write it as an automated test where possible and a manual script in docs/DEMO_PATH.md.
7. Update ATTRIBUTION.md "Our features" and COST_AND_LICENSES.md.

After this phase: FEATURE FREEZE. List any bugs instead of adding features.
End with the end-of-phase report.
```

---

## Prompt 6: Evidence tooling (Day 5). Partly NEEDS YOU

```
Read CLAUDE.md. First do Step 0 from CLAUDE.md: read docs/ERROR_LOG.md, fix every OPEN / WORKAROUND / NEEDS-HUMAN error using the fixes proposed in the last report, run all test suites, and report what you fixed. Only then start this phase.

Phase 6: evidence tooling. This is as important as the features. Honesty rules apply strictly.

Reuse check: Python libraries for reading NHANES XPT files (pandas.read_sas supports XPORT), any existing open-source NHANES audiometry analysis code with an allowlisted licence. Log the decisions.

1. scripts/simulate_district.py (numpy, seeded, default 10,000 children):
   - parameters from config or CLI: prevalence 14.14%, referral rate, follow-up under SMS-only (39.4%) vs school-camp model (88.5%);
   - output the funnel (screened → referred → true positives → reach treatment) per model;
   - sensitivity analysis over the uncertain parameters (one-way sweeps plus a simple Monte Carlo);
   - every output file, table and chart title says SIMULATED;
   - in the output header, state that the follow-up figures come from published programmes whose settings may differ from ours, with TODO(source) for full citations and a note to confirm each study's country/setting.
2. scripts/download_nhanes.py + scripts/eval_nhanes.py:
   - Before downloading, read the CDC NHANES documentation pages and record which cycles include audiometry and WHICH AGE RANGES each covers. Cite the pages in the docs; don't rely on memory. Note that NHANES II via ICPSR may need an account; skip it if so, and say so.
   - Download to data/raw/ with SHA-256 checksums.
   - Apply our rules (from server/referrals/rules) to real audiograms. To avoid circularity, also run a clearly labelled SIMULATED measurement-error model (noise, guessing) on top of the true thresholds and report referral rate and agreement (sensitivity/specificity vs standard hearing-loss definitions, with the definitions cited).
   - Disclose: US data, not Indian children, tests rule logic not app accuracy.
3. Cost model: scripts/cost_model.py producing cost per child screened from inputs (phone price and lifespan, earphones, teacher minutes per child, children per day). All prices are inputs marked TODO(source) until we fill real local prices. Separate "software cost" (zero) from "deployment cost".
4. docs/TEAM_TEST_PROTOCOL.md and data/team_tests_template.csv: consenting adults only; consent form; test-retest reliability, time per test, quiet room vs noisy corridor, catch-trial detection with one tester tapping randomly; biological calibration procedure on [PHONE_MODEL] + [EARPHONE_MODEL].
5. eval/report.py: `python -m eval.report` regenerates EVERY number into eval/results.md (simulator, NHANES, team tests if the CSV exists, cost model), with the git commit hash and config version in the header.
6. docs/CLAIMS.md: table with ID, claim text, value, condition, script that produces it, real/simulated, source citation. Generated or checked by eval/report.py so CLAIMS.md can never disagree with results.md.
7. Tests for the simulator (seed reproducibility, funnel arithmetic, edge cases).

NEEDS YOU: give me the checklist to run the team tests and fill the CSV, then rerun eval.report.
End with the end-of-phase report.
```

---

## Prompt 7: Quick wins (Day 6, only if Phases 0–6 are solid)

```
Read CLAUDE.md. First do Step 0 from CLAUDE.md: read docs/ERROR_LOG.md, fix every OPEN / WORKAROUND / NEEDS-HUMAN error using the fixes proposed in the last report, run all test suites, and report what you fixed. Only then start this phase.

Phase 7: quick wins. Only start if every must-have test passes and the demo path works. Do them in this order and stop when time runs out. Run a reuse check for each.

1. Tamper-evident audit log: append-only, hash-chained (SHA-256 of entry content + previous hash) for consent, results, referrals and status changes, on both phone and server. Add `python manage.py verify_audit_log` and an in-app "verify" button. Tests: tampering with any entry is detected.
2. Classroom accommodation sheet: for referred children, generate printable teacher guidance (preferential seating with the better ear toward the teacher, low-cost noise fixes like floor mats and curtains). General guidance text only, no medical claims; mark source TODOs.
3. Quiet-spot finder: measure relative ambient noise in different rooms/times, store readings, and recommend the quietest slot. Relative dB only.

Update ATTRIBUTION.md and COST_AND_LICENSES.md. End with the end-of-phase report.
```

---

## Prompt 8: Docs, demo script and concept note (Days 6–7)

```
Read CLAUDE.md. First do Step 0 from CLAUDE.md: read docs/ERROR_LOG.md, fix every OPEN / WORKAROUND / NEEDS-HUMAN error using the fixes proposed in the last report, run all test suites, and report what you fixed. Only then start this phase.

Phase 8: documentation and submission material. No new features.

1. README.md: what it is, the "Screening and referral tool, not a diagnostic device" disclaimer at the top, how to run backend and app (free tools only), how to build the APK locally, how to run all tests, how to regenerate evidence (`python -m eval.report`).
2. Demo video script (2 minutes) in docs/DEMO_SCRIPT.md: problem (10 s) → screening with noise gating and rescreen (30 s) → random tapper → RETEST (15 s) → triage → case → camp request PDF (30 s) → case closed, audit verify (15 s) → evidence slide pointing to eval/results.md (20 s). Include a shot list and the backup-screen-recording plan.
3. Concept note draft in docs/CONCEPT_NOTE.md, structured around the six criteria: problem clarity, originality (what's new vs DhwaniSarathi, hearWHO, hearScreen; describe competitors only from their public documentation, with links; never claim "first"), demonstrated feasibility (only numbers from CLAIMS.md, each labelled real or SIMULATED), cost (from the cost model; software cost zero; deployment costs listed), beneficiary impact (simulator, labelled), scalability (RBSK/DEIC pathway, replication in another district). Roadmap: district dashboard, Telugu digits-in-noise, real SMS/IVR (future cost), school pilot via SFIC field-testing support, regulatory pathway as future work.
4. Make every number in the concept note reference a CLAIMS.md ID. List any sentence that has no source.

End with the end-of-phase report.
```

---

## Prompt 9: Final audit (Day 7)

```
Read CLAUDE.md. First do Step 0 from CLAUDE.md: read docs/ERROR_LOG.md, fix every OPEN / WORKAROUND / NEEDS-HUMAN error using the fixes proposed in the last report, run all test suites, and report what you fixed. Only then start this phase.

Phase 9: final audit before the coordinator submits. Report problems; fix only what's safe.

1. Error audit: every entry in docs/ERROR_LOG.md is FIXED or has a documented, acceptable WORKAROUND. List anything still open and its impact on the demo.
2. Cost audit: scan screener/package.json, server/requirements.txt and all code for paid services, API keys, account requirements, analytics, and outbound network calls (grep for http/https URLs and fetch calls). The only allowed network target is our own backend. Confirm COST_AND_LICENSES.md is complete and that real deployment costs are listed, not hidden.
3. Licence audit: every dependency and every copied file/asset has an allowlisted licence and is credited in ATTRIBUTION.md / REUSE_LOG.md. Apache-2.0 LICENSE preserved; NOTICE carried if required.
4. Honesty audit: every number in README, CONCEPT_NOTE, DEMO_SCRIPT and the UI exists in CLAIMS.md and matches eval/results.md after a fresh `python -m eval.report`. Every simulated number is labelled SIMULATED. No "dB HL"/"dBA" claims without calibration. No diagnostic wording anywhere in the UI or docs (search for: diagnose, diagnosis, detects hearing loss, normal hearing, cure).
5. Privacy audit: no real child data in the repo; consent recorded before tests; guardian phone optional; seed data obviously fake.
6. Test run: all pytest + jest suites, rule parity script, demo path. Paste the results.
7. Fresh-clone check: clone the repo into a temp folder and follow README exactly; report any step that fails.
8. A list of anything that could make judges doubt us, ranked by severity.
```
