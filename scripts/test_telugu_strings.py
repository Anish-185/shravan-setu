import json
import re

import telugu_strings as ts


def test_docs_are_up_to_date():
    assert ts.main(["--check"]) == 0, "run: python scripts/telugu_strings.py"


def test_every_text_needing_telugu_is_listed_once():
    keys = [r[0] for r in ts.rows()]
    assert len(keys) == len(set(keys))
    strings = json.loads(ts.STRINGS.read_text())
    cfg = json.loads(ts.CONFIG.read_text())
    assert len(keys) == len(strings) + len(cfg["triage"]["questions"]["value"]) + 1  # + the reminder template


def test_filled_telugu_keeps_the_english_placeholders():
    ph = re.compile(r"\{(\w+)\}")
    for key, en, te, _, _ in ts.rows():
        if te:
            assert set(ph.findall(te)) == set(ph.findall(en)), key


def test_every_voice_line_has_a_file():
    for v in json.loads(ts.STRINGS.read_text()).values():
        if "file" in v:
            assert (ts.ROOT / "screener" / "assets" / "voice" / "te" / v["file"]).exists(), v["file"]
