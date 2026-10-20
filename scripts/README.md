# scripts/

| Script | What it does |
|---|---|
| `check_rules_parity.sh` | Runs every test suite: server pytest, scripts pytest, screener jest (both rule engines on the shared fixtures) |
| `make_rule_fixtures.py` | Writes `shared/fixtures/*.json` (hand-written expectations) |
| `analyze_spike.py` | Phase 1 spike analysis (`docs/SPIKE.md` §5, CLAIMS SPK-01..05): `python scripts/analyze_spike.py data/raw/spike/*.json` |
| `make_tones.py` | Generates click-free per-ear tone WAVs from `config/screening.json` into `screener/assets/tones/generated/` |
| `make_art.py` | Draws the images on the original DhwaniSarathi screens (`screener/assets/images/original/`, made by Team JL); needs rsvg-convert and ImageMagick |

| `analyze_phase4.py` | Device-trial session summaries (play latency, taps from play() and from playback start, late-start replays): `python scripts/analyze_phase4.py data/raw/phase5/*.json` |
| `telugu_strings.py` | Writes `docs/TELUGU_STRINGS.md` and `docs/VOICE_SCRIPT.md`; `--check` is run by pytest |
| `simulate_district.py` | SIMULATED district funnel, sweeps, Monte Carlo, SVG chart (inputs `config/district_model.json`) |
| `eval_nhanes.py` | NHANES youth rule-logic evaluation: `--download` (8 CDC files, pinned SHA-256), then run. Needs `requirements-eval.txt` (pandas, laptop only) |
| `cost_model.py` | PROPOSED deployment cost model (inputs `config/cost_model.json`) |
| `calibrate.py` | Team baseline and test-retest from calibration exports: `python scripts/calibrate.py data/raw/calibration/*.json` |
| `check_contrast.py` | WCAG AA contrast of every text/background pair in the app, colours read from `screener/src/ui.tsx`; run by pytest |

Every quotable number comes from one of these scripts and is recorded in `docs/CLAIMS.md`; `python -m eval.report`
regenerates them all into `eval/results.md`.
