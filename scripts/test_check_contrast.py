import check_contrast as cc


def test_every_pair_meets_wcag_aa():
    assert [r for r in cc.check() if r[2] < r[3]] == []


def test_known_ratios_and_a_failing_pair_is_caught():
    assert round(cc.ratio("#000000", "#FFFFFF"), 1) == 21.0
    src = cc.UI.read_text().replace("dusk: '#5B5A7A'", "dusk: '#B0B0C0'")
    assert any(fg == "dusk" and r < need for fg, bg, r, need, _ in cc.check(src))
