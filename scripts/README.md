# scripts/

| Script | What it does |
|---|---|
| `check_rules_parity.sh` | Runs every test suite: server pytest, scripts pytest, screener jest (both rule engines on the shared fixtures) |
| `make_rule_fixtures.py` | Writes `shared/fixtures/*.json` (hand-written expectations) |
| `analyze_spike.py` | Phase 1 spike analysis (`docs/SPIKE.md` §5, CLAIMS SPK-01..05): `python scripts/analyze_spike.py data/raw/spike/*.json` |
| `make_tones.py` | Generates click-free per-ear tone WAVs from `config/screening.json` into `screener/assets/tones/generated/` |

Planned (Phase 6): `simulate_district.py`, `download_nhanes.py`, `eval_nhanes.py`, `cost_model.py`. Every quotable
number comes from one of these scripts and is recorded in `docs/CLAIMS.md`.
