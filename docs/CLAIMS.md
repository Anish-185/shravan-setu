# Claims register

Every quotable number, the condition it holds under, and the script that produces it. Numbers not in this table
must not appear in docs, slides or the UI. Phase 6 will generate/check this table from `eval/report.py`.

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
