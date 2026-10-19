# CLAUDE.md: Project rules for Claude Code

Read this file fully at the start of every session. These rules apply to every task in this repo.

## What we are building

A school hearing **screening and referral** system for the Seva First Innovation Challenge 2026 (Theme 3, Track A). Deadline: 24 Oct 2026.

Pitch: "Others built a hearing test. We built the system that makes sure the child actually gets treated."

This repo is a fork of DhwaniSarathi (SIH 2023 winner, Apache-2.0). Layout:

```
audiometer/   ORIGINAL team's Expo app (SDK 49). DO NOT MODIFY. Kept for attribution only.
server/       Django backend. Original `apigateway` app + OUR new `referrals` app.
screener/     OUR new Expo app (current SDK, offline-first). All new mobile work goes here.
config/       screening.json: every threshold and rule parameter. Single source of truth.
shared/       fixtures/: JSON test vectors run by BOTH the Python and JS test suites.
scripts/      simulate_district.py, eval_nhanes.py, download scripts.
eval/         report.py (python -m eval.report) -> eval/results.md
docs/         CLAIMS.md, TEAM_TEST_PROTOCOL.md, REUSE_LOG.md, COST_AND_LICENSES.md
data/raw/     downloaded public data (gitignored; fetched by script with checksums)
```

## Hard constraints (never break these)

1. **No LLMs anywhere.** No OpenAI/Anthropic/Gemini/Llama/any hosted or local LLM, and no ML cloud APIs. Rules, simple statistics and classical algorithms only.
2. **No custom hardware.** Android phone + standard wired earphones only. No Bluetooth earphones.
3. **Offline-first.** The full screening flow, triage, case creation and status updates must work with no internet. Sync to the backend later.
4. **Screening and referral tool, never diagnostic.** The camp-request PDF and every doc (README, concept note) must say so; app screens don't repeat it (owner decision 2026-10-20: testers and judges know it's a prototype). Use "PASS / RETEST / REFER", never "normal hearing" or "hearing loss diagnosed". Triage is "likely treatable cause → PHC", never a diagnosis.
5. **Honesty standard.**
   - Never invent a statistic, facility name, address, citation, or study result. If a number isn't in the brief or produced by our scripts, write `TODO(source)`.
   - Every quotable number comes from one reproducible script and is recorded in `docs/CLAIMS.md` with its condition.
   - Simulated output is labelled `SIMULATED` in the file, the table, and the chart title.
   - Sound levels are relative to our biological calibration baseline ("dB re: team baseline"), never "dB HL" or "dBA", unless calibrated against a real instrument and documented.
6. **Calibration context:** standard device = `[PHONE_MODEL]` + `[EARPHONE_MODEL]` (wired). Record device model, earphone model and the tester-confirmed volume setting with every test.

## Zero-cost policy (no hidden costs)

The software must cost nothing to build, run, demo, or hand to a school. Specifically:

- **No paid services, no API keys, no billing accounts.** The only accounts allowed are GitHub (free) and optionally Expo (free tier). If any step would require a credit card, a trial, a paid tier, or an API key, STOP and ask me.
- **Banned:** Firebase, Google Maps / Places API, Clarifai, Hugging Face hosted spaces, Twilio or any SMS/IVR provider, cloud databases, analytics/telemetry SDKs, crash reporters that need accounts, any "free tier" SaaS in the runtime path.
- **Backend runs on a laptop** (SQLite). No cloud hosting. If you think hosting is needed, stop and ask.
- **Android only.** Distribute the APK directly. No Play Store or App Store fees, no Apple developer account. Prefer local builds (`npx expo prebuild` + Gradle). EAS free tier is allowed only as a convenience, never a paid plan.
- **SMS/voice reminders are stubbed:** we log what would be sent. Real sending is a later-round roadmap item and must be shown as a future cost in the cost model.
- **Maps:** none. Facility routing uses a local CSV.
- **Fonts/icons/audio:** only free licences (e.g. Noto Sans Telugu under OFL).
- Keep `docs/COST_AND_LICENSES.md` up to date: every dependency, its licence, its cost (must be 0), and whether it makes any network call. Separately list **real deployment costs** (phones, earphones, teacher time, future SMS) so nothing is hidden. Those feed the cost model.

## Reuse-first protocol (do this BEFORE building any feature)

Before writing a feature, check whether a free, open-source implementation already exists that we can clone or depend on and adapt.

1. **Search.** Run at least 3 different queries on GitHub (`gh search repos ...` if the gh CLI is available, otherwise web search) plus npm/PyPI for packages.
2. **Evaluate each candidate** against all of these:
   - **Licence allowlist:** MIT, BSD-2/BSD-3, Apache-2.0, ISC, Zlib, Unlicense, CC0 (code); OFL (fonts); CC0/CC-BY (media).
   - **Reject:** no licence file (= all rights reserved), GPL/LGPL/AGPL (ask me first), CC-BY-NC / -ND, SSPL, BSL, "free for non-commercial use", anything requiring an API key, account, paid tier, cloud service or telemetry.
   - Works fully offline. Compatible with our versions (current Expo SDK, Python 3.12, Django 5.2).
   - Maintained (recent commits, issues answered) and small. Prefer a well-known package over copying code.
   - Safe: no obfuscated code, no suspicious postinstall scripts.
3. **Decide:** (a) use as a dependency, (b) copy and adapt code (keep the original copyright/licence header; if it's Apache-2.0 with a NOTICE file, carry the NOTICE), or (c) build ourselves.
   - If the feature is under about 100 lines (state-transition table, hash chain, simple stats), building is usually better than adding a dependency. Still log the decision.
   - Do not copy substantial code from Stack Overflow (CC BY-SA share-alike).
4. **Log** every search and decision in `docs/REUSE_LOG.md` (feature, queries run, candidates with licence and last-commit date, decision, reason). Credit anything reused in `ATTRIBUTION.md`.
5. **Proceed** with the recommended option. Ask me first only if it involves a non-allowlisted licence, a dependency over about 5 MB, or replacing a core part of our architecture.

Our originality is the closed referral loop, two-stage screening, reliability gating, and triage routing. Reusing libraries for plumbing is fine; just be transparent about it.

## Engineering conventions

- **All thresholds live in `config/screening.json`.** No magic numbers in code. Each value has a `"source"` field (citation, script, or `"TODO(source)"`).
- **Rules exist twice** (Python reference in `server/referrals/rules/` and JS port in `screener/src/rules/`). Both MUST pass the same fixtures in `shared/fixtures/`.
- **Tests are required for:** the referral state machine, rescreen logic, 500 Hz gating, reliability scoring, triage routing, sync idempotency, simulator, audit-log verification. Python: pytest. JS: jest (jest-expo preset).
- **Versions:** never use beta, RC, canary or other pre-release SDKs or packages. Before choosing an Expo SDK, check which SDK the current Play Store Expo Go supports and use that stable SDK (ERR-014).
- **IDs:** client-generated UUIDv4 for every record, so sync is idempotent.
- **Children's data:** collect the minimum. Parent phone is optional. Consent is recorded before any test. No real child data in the repo, ever. Seed data uses obviously fake names ("Student A1").
- **Secrets:** none in code. Django `SECRET_KEY` comes from an environment variable. `.env` is gitignored. Never commit `db.sqlite3`.
- **Commits:** small, one logical change each, conventional style (`feat(referrals): ...`, `fix(screener): ...`, `docs: ...`). Never rewrite history on `main`.
- **Commit IDs:** always get full IDs from `git rev-parse` (or `git ls-remote` for remote refs) and paste them; never type or complete a commit ID from memory. This matters most for `--force-with-lease`, resets and anything destructive.
- **UI language:** English + Telugu. Telugu strings are written by a human (`[TELUGU_SPEAKER]`). A machine-assisted Telugu draft is allowed only if a native Telugu speaker reviews and approves every line (record: `docs/TELUGU_REVIEW.md`); unreviewed machine translation is never shipped. Missing Telugu strings use key `TODO_TE` and fall back to English visibly.

## Error log and carry-over between phases

Every error you hit while working gets recorded in `docs/ERROR_LOG.md`, both the ones you fix straight away and the ones you can't. This includes build failures, failing tests, dependency conflicts, runtime crashes, wrong behaviour, and workarounds.

**During a phase:**
- When an error happens, first understand it: read the full message, find the root cause (not just the symptom), and fix it if you reasonably can.
- Record it immediately in `docs/ERROR_LOG.md` using this format:

```
### ERR-<number>: <short title>
- Phase / date:
- Symptom: exact error message or wrong behaviour (trimmed to the relevant lines)
- Where: file, command, or screen
- Root cause: what actually caused it, in plain words
- Fix: what was changed (with file paths), OR the proposed fix if not done yet
- Status: FIXED | OPEN | WORKAROUND | NEEDS-HUMAN
- Verification: the test or command that proves it's fixed (add a regression test where practical)
- Lesson: one line on how to avoid this kind of error later
```

- Never make an error "go away" by deleting or weakening a test, silencing a warning without understanding it, pinning to a random version, or wrapping code in a try/catch that hides the failure. If you use a workaround, mark it WORKAROUND and explain the proper fix.

**At the end of a phase:** for every entry still OPEN, WORKAROUND or NEEDS-HUMAN, the end-of-phase report must explain in plain language what the error is, why it happens, and the exact steps to fix it, so the next session can act on it without re-investigating.

**Step 0 of every phase (before any new work):**
1. Read `docs/ERROR_LOG.md` and list every entry that is OPEN, WORKAROUND or NEEDS-HUMAN.
2. Fix each one using the proposed fix (or a better one if you find it), add a regression test where practical, and update its status. For NEEDS-HUMAN items, check whether I've reported results; if not, ask me.
3. Run the full test suites (pytest, jest, `scripts/check_rules_parity.sh` once it exists) to catch regressions from earlier phases.
4. Report what was fixed in Step 0. If an error blocks the new phase and you can't fix it, stop and ask me how to proceed instead of building on top of it.
5. Then start the new phase.

## When to stop and ask me

- Anything that costs money, needs an account other than GitHub/Expo, or needs an API key.
- A licence outside the allowlist.
- Any change inside `audiometer/` (the original app).
- Any medical wording you're unsure about.
- Anything that needs a real phone, real earphones, or a person. Give me a precise checklist and wait for my results.
- If a task in the current phase will clearly not fit the day, propose what to cut.

## End-of-phase report (always use this format)

1. **Step 0 results:** errors carried over from the last phase and how each was fixed (or why not).
2. **Done:** what was built, with file paths.
3. **Tested:** test commands run and their results (paste the summary line).
4. **Errors this phase:** every new `ERROR_LOG.md` entry by ID. For each one still OPEN, WORKAROUND or NEEDS-HUMAN: what the error is, why it happens, and the exact fix to apply at the start of the next phase.
5. **Reuse decisions:** link to new `REUSE_LOG.md` entries.
6. **Cost check:** confirm no new paid/keyed dependency; list any new network calls.
7. **Honesty check:** any new numbers, and whether each is in `CLAIMS.md` or marked TODO.
8. **Needs a human:** device or people tasks for me.
9. **Next:** the next phase and any risks.
