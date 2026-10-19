# eval/

`python -m eval.report` (from the repo root, with `server/.venv/bin/python`) regenerates every number into
`eval/results.md`, the chart `eval/funnel_simulated.svg` and the generated block of `docs/CLAIMS.md`.
`python -m eval.report --check` fails if `docs/CLAIMS.md` disagrees with a fresh computation; pytest runs it
(`scripts/test_report.py`).

NHANES rows need the CDC files (`python scripts/eval_nhanes.py --download`) and pandas
(`uv pip install -p server/.venv/bin/python -r requirements-eval.txt`). Without them, those rows are skipped by the
check, never guessed. Device-trial tables appear only when the raw session files are on the laptop (`data/raw/`).
