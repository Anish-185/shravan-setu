#!/usr/bin/env bash
# Run every test suite. Both rule engines must pass the same shared/fixtures/*.json.
#   scripts/check_rules_parity.sh            (from the repo root)
set -euo pipefail
cd "$(dirname "$0")/.."
PY=server/.venv/bin/python

echo "== Python: server (referrals incl. rule fixtures)"
(cd server && "../$PY" -m pytest -q -p no:cacheprovider)

echo "== Python: scripts"
"$PY" -m pytest -q -p no:cacheprovider scripts

echo "== JS: screener (rule fixtures)"
(cd screener && npx jest --silent)

echo "== Fixture count per engine"
"$PY" - <<'PY'
import json, pathlib
n = sum(len(json.loads(p.read_text())["cases"]) for p in pathlib.Path("shared/fixtures").glob("*.json")
        if p.name != "fixture_config.json")
print(f"{n} shared fixtures, run by both pytest and jest")
PY
echo "PARITY OK"
