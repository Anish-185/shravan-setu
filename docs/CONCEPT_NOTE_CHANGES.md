# Concept note: what changed since 19 Oct 2026

For updating the concept note and abstract before submission. Every number below is in `docs/CLAIMS.md` (ID given) or
comes from a named file; nothing here is new evidence. Screening and referral tool, not a diagnostic device: keep that
line in the concept note.

## 1. Calibration: now set, but provisional

**What we did.** A biological calibration (CLAIMS CAL-01..03; method in `docs/TEAM_TEST_PROTOCOL.md` step 2;
`scripts/calibrate.py`):

- 7 consenting adult team volunteers (V1-V7), not children; outlier rule excluded 0 of 7 (CAL-03).
- One phone and earphone model: Redmi 2201117TI + Samsung wired earphones, media volume zero then 6 steps, quiet room,
  2026-10-19, run 1 only.
- Threshold search per ear and frequency: "down 10, up 5" bracketing (`screener/src/engine/calibration.ts`).
- 500 Hz: median -35.0 dB re full scale, 14 ears, range -55 to -20 (CAL-01). A real, measured median.
- 1, 2 and 4 kHz: -60.0 each; 40 of 42 ear-frequency thresholds exactly -60 (CAL-02). This is the phone's playback
  floor, not the volunteers' hearing (ERR-044), so these are **upper bounds**: 1-4 kHz tones may play louder than
  intended, and the screen may miss milder loss until the Stage 2 recalibration.
- Screening level: 20 dB re: team baseline. Source: American Academy of Audiology (2011), *Childhood Hearing
  Screening Guidelines* (20 dB HL), used as an **assumption** that our team baseline approximates audiometric zero.

**Literature for the method (verified in PubMed, 2026-10-21):**

- Masalski M, Kipiński L, Grysiński T, Kręcicki T. Hearing Tests on Mobile Devices: Evaluation of the Reference Sound
  Level by Means of Biological Calibration. *J Med Internet Res.* 2016;18(5):e130. doi:10.2196/jmir.4987.
  PMID 27241793, PMCID PMC4906240.
  What it says (abstract): the reference sound level for a model of Android device with bundled headphones was set
  "in relation to the normal-hearing threshold"; the mean SD of the reference level between devices of the same model
  was 4.03 dB (95% CI 3.93-4.11), and the authors conclude that hearing screening on devices calibrated with a
  predefined per-model reference level is feasible.
- Masalski M, Grysiński T, Kręcicki T. Hearing Tests Based on Biologically Calibrated Mobile Devices: Comparison With
  Pure-Tone Audiometry. *JMIR Mhealth Uhealth.* 2018;6(1):e10. doi:10.2196/mhealth.7800. PMID 29321124,
  PMCID PMC5784183.
  What it says (abstract): 70 adults (18-71 years) in a sound booth; mobile thresholds differed from pure-tone
  audiometry by a mean 2.6 dB (SD 8.3 dB); screening sensitivity 98% and specificity 79%.
- Related, earlier (same group): Masalski M, Grysiński T, Kręcicki T. Biological calibration for web-based hearing
  tests: evaluation of the methods. *J Med Internet Res.* 2014;16(1):e11. doi:10.2196/jmir.2798. PMID 24429353.

Both papers declare that the first author owns the "Hearing Test" app used in them. **Their numbers are about their
app and adult subjects, not ours.** Do not attach their sensitivity, specificity or SD to Shravan Setu.

How our run differs from theirs (say this if you cite them): our volunteers' hearing was not checked with an
audiometer (theirs, in the controlled group, was); we used a "down 10, up 5" search, not Békésy audiometry; one phone
model, 7 people, one run; and our 1-4 kHz values hit the playback floor.

**Suggested wording:**

> We calibrate biologically, following Masalski et al. (2016): the reference level for one phone and earphone model
> is set from the hearing thresholds of adult listeners. Our first run used 7 adult team volunteers on one phone and
> earphone model. At 500 Hz it gave a measured baseline; at 1-4 kHz the phone could not play quietly enough, so the
> baseline there is an upper bound and our calibration is provisional. Levels are reported in dB relative to this
> team baseline, not dB HL. Stage 2 adds a quieter tone set, recalibration with volunteers, and a check against a
> clinical audiometer.

## 2. Team test visit 2 was not run

Visit 2 (screening sessions) did not happen before submission; it is planned for the Stage 2 pilot
(`docs/TEAM_TEST_PROTOCOL.md`). **Remove or do not add:** test-retest agreement, minutes per test, guesser / random
tapper outcomes from other people, L1/L2 results. The existing one-tester device-trial claims (P4-01..03, P5-01..03,
P6-01..03) stay as they are, each labelled n = 1 or n = 2.

## 3. Audio start delay fixed (ERR-026)

| | min / median / max delay from play() to playback start | Late starts (over 1000 ms) | CLAIMS |
|---|---|---|---|
| Before (Phase 5) | 144 / 486 / 2243 ms | 3 of 16 | P5-01, P5-03 |
| After (Phase 6, warm-up + preload) | 9 / 60 / 106 ms | 0 of 20 | P6-01, P6-03 |

Both: Redmi 2201117TI, Samsung wired earphones, Expo Go SDK 57, one session each (n = 1). Responses are now timed from
the reported playback start (P6-02: tap time min 339, median 1317, max 2835 ms).

## 4. "Screening only" note removed from app screens

Owner decision (2026-10-20): the app screens no longer repeat "screening only, not a diagnosis". It stays in the
camp-request PDF and in every document (README, concept note). Result screens still say PASS / RETEST / REFER; the
detailed test's grades are labelled "estimated", in dB re: team baseline.

## 5. New since 19 Oct

- **Provisional-calibration line** on the result screen: "Provisional calibration: 1–4 kHz may be louder than
  intended." (screenshot `docs/screens/11-result-retest-provisional.png`).
- **Audit log:** tamper-evident hash chain of consents, results, cases and status changes, on the phone and the
  server; Settings → Verify, and `manage.py verify_audit_log` on the laptop. Phone check passed 2026-10-21.
- **Quiet-spot finder:** ranks rooms and hours by relative room noise (relative to a reference quiet room,
  uncalibrated). Phone check passed 2026-10-21.
- **Original DhwaniSarathi features, integrated** (their code and charts, in our design; `docs/INTEGRATION_PLAN.md`):
  teacher view with classrooms, assignments (screening rounds with a deadline) and an analytics donut; the original
  threshold test as an optional detailed hearing test with per-ear results, audiograms, left-vs-right bars and WHO
  (2021) grade **estimates**; each child's test history; PDF share of a result. Pre-test checklist, room check and
  "Which ear?" check now run before our screening. Classrooms, assignments and detailed tests stay on the phone (not
  synced).
- **Images replaced:** the original team's pictures (source unknown) are no longer used by our app. Screens use
  line drawings by our team and CC0 Open Peeps figures (`ATTRIBUTION.md`).
- **Android APK:** built locally with free tools (no Expo account, no Play Store), signed with our own key, shared
  directly (`docs/APK.md`). Needs the install-and-smoke check on the Redmi before the demo.
- **Telugu:** all 383 UI strings have Telugu, each reviewed by a native speaker (`docs/TELUGU_REVIEW.md`); Telugu voice instructions recorded by the team.

## 6. Other things a judge might check

- **Tests (2026-10-21):** server 231 passed, evaluation scripts 41 passed, app (jest) 188 passed (a fresh clone of the repo); 92 shared rule
  fixtures pass in both Python and JS (`scripts/check_rules_parity.sh`). Commands in `README.md`.
- **Dependencies:** removed react-native-paper and victory-native (charts are react-native-svg); added
  `@noble/hashes` (MIT, audit log) and `expo-build-properties` (MIT, APK build setting). Four build-only packages with
  licences outside our allowlist were approved as build tools, not shipped (`docs/COST_AND_LICENSES.md`). Software
  cost is still zero.
- **Age bands:** 6-8, 9-11, 12-14, 15-18. The 3-5 band was dropped on 2026-10-18 (server migration 0003).
- **Evaluation numbers** (NHANES rule logic NH-01..06, SIMULATED district funnel SIM-01..04, PROPOSED cost model
  COST-01..06): regenerate with `python -m eval.report` and quote only with their CLAIMS conditions and
  labels (SIMULATED, PROPOSED, "rule logic only").
- **Open security advisories:** `npm audit` reports 57 entries from 5 advisories, all in build tooling except one
  deep-link parser (ERR-015); no patched releases on our SDK yet.
- **Still `TODO(source)`:** the triage routing rule and its wording need a citation and clinician review
  (`config/screening.json` `triage`); district-model follow-up rates (SIM rows); class size in COST-06.
