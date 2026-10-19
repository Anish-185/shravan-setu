"""docs/CLAIMS.md must agree with what eval/report.py computes on this laptop (CLAUDE.md honesty standard)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from eval import report  # noqa: E402


def test_claims_match_computed_results():
    assert report.check(report.compute()) == []


def test_check_catches_a_stale_number(tmp_path, monkeypatch):
    r = report.compute()
    stale = tmp_path / "CLAIMS.md"
    text = report.CLAIMS.read_text().replace(r["claims"]["SIM-03"], r["claims"]["SIM-03"].replace("| 694 |", "| 700 |"))
    stale.write_text(text)
    monkeypatch.setattr(report, "CLAIMS", stale)
    assert any(p.startswith("SIM-03") for p in report.check(r))
