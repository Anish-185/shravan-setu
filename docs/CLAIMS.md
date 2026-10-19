# Claims register

Every quotable number, the condition it holds under, and the script that produces it. Numbers not in this table
must not appear in docs, slides or the UI. The rows between the GENERATED markers are written by `python -m eval.report`
(never edit them by hand); `python -m eval.report --check` (run by pytest) fails if any row disagrees with a fresh
computation. Hand-written device-trial rows P5-01..P5-03 are rechecked against their raw files when present.

| ID | Claim | Value | Condition | Script | Real / SIMULATED |
|---|---|---|---|---|---|
| SPK-01 | Mic metering start-up: first sample after mic start is the −160 floor, then a hump that settles by ~0.75 s | 13/13 clips; settled by ~750 ms | Spike, Redmi 2201117TI, Android 13, Expo Go SDK 57, 100 ms poll, 2026-10-17 | `scripts/analyze_spike.py` (start-up table) | Real, spike observation only |
| SPK-02 | Corridor samples at the metering ceiling (~−1.0) | 57 of 258 valid samples | Same device, one corridor, 30 s, no tone | `scripts/analyze_spike.py` | Real, spike observation only |
| SPK-03 | Tone-on median minus quiet-room median, earphones worn, vol 0.10 | −4.0 to +0.9 (4 clips) | Same device, one tester, one quiet room, original full-scale tones; relative metering, not dB HL | `scripts/analyze_spike.py` | Real, spike observation only |
| SPK-04 | Quiet-room vs corridor median metering difference | 14.8 (re: mic full scale, uncalibrated) | Same device, one quiet room, one corridor, 30 s each | `scripts/analyze_spike.py` | Real, spike observation only |
| SPK-05 | 1 s windows rejected by a +10 during-tone gate | quiet no-tone 0/49, quiet tone 2/76, corridor 26/29 | As above, gate from `config/screening.json` | `scripts/analyze_spike.py` | Real, spike observation only |
| P4-01 | Random tapping caught by silent (catch) trials → RETEST | 4 of 5 catch trials tapped; outcome RETEST | Phase 4 device trial, Redmi 2201117TI, Samsung wired earphones, uncalibrated volume, one tester, one session, 2026-10-18 | `scripts/analyze_phase4.py` | Real, device trial only (n = 1) |
| P4-02 | Honest tapping, quiet and mildly noisy room → PASS | 2 of 2 sessions PASS, 0 catch taps | Same as P4-01; room noise −7.7 and +1.3 re: reference | `scripts/analyze_phase4.py` | Real, device trial only (n = 2) |
| P4-03 | Tap time after the JS `play()` call, honest sessions | min ~1.45 s, median ~1.8 s; 2/16 out of the 2.5 s window per session | Same as P4-01; includes audio output latency + reaction time, not separable | `scripts/analyze_phase4.py` | Real, device trial only (n = 2) |
| P5-01 | Audio start delay: player-reported playback start minus the JS play() call | min 144 ms, median 486 ms, max 2243 ms (all 16 tone presentations, answered or not; not consistent) | Redmi 2201117TI, Samsung wired earphones, Expo Go SDK 57, media volume zero then 6 steps; one honest PASS session (B-3, `data/raw/phase5/`) | `scripts/analyze_phase4.py` (play latency column) | Real, device trial only (n = 1) |
| P5-02 | Tap time measured from the reported playback start (what `timing_origin = playback_start` would use) | min 806 ms, median 1098 ms, max 1481 ms; from play() the same taps were 1168 / 1554 / 3414 ms | Same as P5-01; tester's reaction time plus the unobservable output buffer | `scripts/analyze_phase4.py` (tap from playback start column) | Real, device trial only (n = 1) |
| P5-03 | Tone starts later than the Phase 6 limit (`response.max_play_latency_ms` = 1000 ms) | 3 of 16 (1078, 1208, 2243 ms; the last was the first tone) | Same as P5-01; recorded before preloading/warm-up existed, so it is the "before" figure, not the current app | `scripts/analyze_phase4.py` (starts over limit column) | Real, device trial only (n = 1) |

These are spike observations used to choose design parameters. They are **not** accuracy, sensitivity or hearing claims.

## Generated claims

<!-- BEGIN GENERATED: python -m eval.report -->

| ID | Claim | Value | Condition | Script | Real / SIMULATED |
|---|---|---|---|---|---|
| SIM-01 | Children with hearing loss who reach care, referral + SMS reminders only | 557 | 10,000 children, brief prevalence 14.14% and follow-up rates (TODO(source)), ideal screen, config/district_model.json | `scripts/simulate_district.py` | SIMULATED |
| SIM-02 | Children with hearing loss who reach care, referral + school ear camp | 1,251 | 10,000 children, brief prevalence 14.14% and follow-up rates (TODO(source)), ideal screen, config/district_model.json | `scripts/simulate_district.py` | SIMULATED |
| SIM-03 | Extra children reaching care with school camps vs SMS only | 694 | 10,000 children, brief prevalence 14.14% and follow-up rates (TODO(source)), ideal screen, config/district_model.json | `scripts/simulate_district.py` | SIMULATED |
| SIM-04 | Same difference under parameter uncertainty: median (5th-95th percentile) | 604 (395-894) | 1000 runs, seed 2026, illustrative ranges (not data) | `scripts/simulate_district.py` | SIMULATED |
| COST-01 | Equipment cost per child per year, scenario A (school phone, recommended), 250-student school | Rs 14.9 (software Rs 0) | Team estimate, online retail price, Oct 2026; equipment over its lifespan; not tested in any school | `scripts/cost_model.py` | PROPOSED |
| COST-02 | Equipment cost per child per year, scenario B (teacher's own phone), 250-student school | Rs 1.6 (software Rs 0) | Team estimate, online retail price, Oct 2026; equipment over its lifespan; not tested in any school | `scripts/cost_model.py` | PROPOSED |
| COST-03 | Equipment cost per child per year, scenario C (kit per class teacher), 250-student school | Rs 11.2 (software Rs 0) | Team estimate, online retail price, Oct 2026; equipment over its lifespan; not tested in any school | `scripts/cost_model.py` | PROPOSED |
| COST-04 | Equipment cost per child per year, scenario A (school phone, recommended), 1,000-student school | Rs 14.9 (software Rs 0) | Team estimate, online retail price, Oct 2026; equipment over its lifespan; not tested in any school | `scripts/cost_model.py` | PROPOSED |
| COST-06 | School days to finish a 1,000-student school: scenario A vs scenario C | 21 vs 3.3 | A: 4 phones of 250 students in parallel; C: one kit per class of 40 (class size TODO(source)); 5 min per child, 1 h per kit per day | `scripts/cost_model.py` | PROPOSED |
| COST-05 | School days to screen 250 students on one phone | 21 | 5 min per child incl. setup, 1 h per phone per day (planning inputs) | `scripts/cost_model.py` | PROPOSED |
| NH-01 | Children analysed | 5,456 (737 excluded for a missing threshold) | NHANES 2005-10 + 2017-18, ages 6-18, unweighted, US; rule logic only; assumed 20 dB HL at 1/2/4 kHz (AAA 2011); reference WHO 2021 Table 1.3 | `scripts/eval_nhanes.py` | Real (public survey data) |
| NH-02 | Rule-logic sensitivity / specificity of REFER, reference WHO any grade incl. unilateral, ideal responses | 100.0% (95.9-100.0%) / 93.2% (92.5-93.8%) | NHANES 2005-10 + 2017-18, ages 6-18, unweighted, US; rule logic only; assumed 20 dB HL at 1/2/4 kHz (AAA 2011); reference WHO 2021 Table 1.3; ideal = heard iff threshold <= 20 | `scripts/eval_nhanes.py` | Real data, ideal responses |
| NH-03 | Children with worse-ear PTA4 >= 20 dB HL (our assumption) who PASS without / with 500 Hz | 5.4% / 0.0% | NHANES 2005-10 + 2017-18, ages 6-18, unweighted, US; rule logic only; assumed 20 dB HL at 1/2/4 kHz (AAA 2011); reference WHO 2021 Table 1.3; ideal responses | `scripts/eval_nhanes.py` | Real data, ideal responses |
| NH-04 | With a 10% guess tap per trial: sensitivity (WHO any grade) and RETEST rate | 83.1%, RETEST 5.9% (no guessing: 100.0%, 0.0%) | NHANES 2005-10 + 2017-18, ages 6-18, unweighted, US; rule logic only; assumed 20 dB HL at 1/2/4 kHz (AAA 2011); reference WHO 2021 Table 1.3; 4 catch trials; slope 2.0 dB, lapse 2% (placeholders) | `scripts/eval_nhanes.py` | SIMULATED responses on real audiograms |
| NH-05 | REFER rate when tones play 5 dB softer than intended vs correct level | 17.6% vs 8.2% | NHANES 2005-10 + 2017-18, ages 6-18, unweighted, US; rule logic only; assumed 20 dB HL at 1/2/4 kHz (AAA 2011); reference WHO 2021 Table 1.3; calibration error model | `scripts/eval_nhanes.py` | SIMULATED responses on real audiograms |
| NH-06 | Rule-logic sensitivity of REFER, WHO any grade, SIMULATED measurement error (no guessing) | 100.0% (95.9-100.0%) | NHANES 2005-10 + 2017-18, ages 6-18, unweighted, US; rule logic only; assumed 20 dB HL at 1/2/4 kHz (AAA 2011); reference WHO 2021 Table 1.3; slope 2.0 dB, lapse 2% (placeholders) | `scripts/eval_nhanes.py` | SIMULATED responses on real audiograms |

<!-- END GENERATED -->
