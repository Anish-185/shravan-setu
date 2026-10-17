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

These are spike observations used to choose design parameters. They are **not** accuracy, sensitivity or hearing claims.
