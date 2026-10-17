"""Run every shared fixture through the Python rule engine. The JS port runs the same files (jest)."""
import copy
import json
from pathlib import Path

import pytest

from referrals import rules

ROOT = Path(__file__).resolve().parents[3]
FIX = ROOT / "shared" / "fixtures"
CONFIG = json.loads((FIX / "fixture_config.json").read_text())
REAL_CONFIG = json.loads((ROOT / "config" / "screening.json").read_text())


def with_overrides(cfg, overrides):
    cfg = copy.deepcopy(cfg)
    for path, value in (overrides or {}).items():
        node = cfg
        for key in path.split("."):
            node = node[key]
        node["value"] = value
    return cfg


def call(fn, inp, cfg):
    if fn in ("decide_outcome", "rescreen_plan"):
        return getattr(rules, fn)(inp["trials"], inp["noise_events"], cfg)
    if fn == "reliability_score":
        return rules.reliability_score(inp["trials"], cfg)
    if fn == "apply_500hz_policy":
        return rules.apply_500hz_policy(inp["ambient_db_re_baseline"], cfg)
    if fn in ("noise_verdict", "ambient_level"):
        return getattr(rules, fn)(inp["samples"], inp["mic_start_ms"], inp["device_changes_ms"], cfg)
    if fn == "triage_route":
        return rules.triage_route(inp["answers"], cfg)
    raise AssertionError(fn)


CASES = [
    pytest.param(data["function"], case, id=f"{data['function']}: {case['name']}")
    for path in sorted(FIX.glob("*.json")) if path.name != "fixture_config.json"
    for data in [json.loads(path.read_text())]
    for case in data["cases"]
]


def test_at_least_30_fixtures():
    assert len(CASES) >= 30


@pytest.mark.parametrize("fn,case", CASES)
def test_fixture(fn, case):
    cfg = with_overrides(CONFIG, case.get("config_overrides"))
    if case.get("expected_error"):
        with pytest.raises(ValueError):
            call(fn, case["input"], cfg)
    else:
        assert call(fn, case["input"], cfg) == case["expected"]


def _leaves(node, path=""):
    """Every config leaf is {"value": ..., "source": ...}."""
    if isinstance(node, dict) and "value" in node:
        yield path, node
    elif isinstance(node, dict):
        for k, child in node.items():
            if not k.startswith("_") and k != "config_version":
                yield from _leaves(child, f"{path}.{k}".lstrip("."))


def test_every_config_value_has_a_source():
    leaves = list(_leaves(REAL_CONFIG))
    assert len(leaves) > 20
    for path, leaf in leaves:
        assert set(leaf) == {"value", "source"}, path
        assert leaf["source"].strip(), path


def test_fixture_config_has_same_shape_as_real_config():
    assert [p for p, _ in _leaves(CONFIG)] == [p for p, _ in _leaves(REAL_CONFIG)]
