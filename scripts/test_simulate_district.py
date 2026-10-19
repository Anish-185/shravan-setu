import random

import pytest

import simulate_district as sd


def test_same_seed_same_output():
    assert sd.run(7) == sd.run(7)
    assert sd.run(7)["one_draw"] != sd.run(8)["one_draw"]


def test_funnel_arithmetic():
    p = sd.params(children=1000, prevalence=0.1, screen_sensitivity=0.8, screen_specificity=0.9,
                  follow_up={"sms_only": 0.5, "school_camp": 1.0})
    f = sd.funnel(p, "sms_only")
    assert f["screened"] == 1000 and f["with_loss"] == pytest.approx(100)
    assert f["referred_with_loss"] == pytest.approx(80) and f["missed_by_screen"] == pytest.approx(20)
    assert f["referred"] == pytest.approx(80 + 900 * 0.1)
    assert f["reached_care_with_loss"] == pytest.approx(40)
    assert sd.funnel(p, "school_camp")["reached_care_with_loss"] == pytest.approx(80)


def test_brief_defaults_give_the_documented_difference():
    e = sd.run()["expected"]
    assert round(e["school_camp"]["reached_care_with_loss"] - e["sms_only"]["reached_care_with_loss"]) == 694


@pytest.mark.parametrize("over", [dict(prevalence=0.0), dict(prevalence=1.0), dict(children=0),
                                  dict(screen_sensitivity=0.0), dict(follow_up={"sms_only": 0.0, "school_camp": 1.0})])
def test_edge_cases_stay_consistent(over):
    p = sd.params(**over)
    rng = random.Random(1)
    for m in p["follow_up"]:
        for f in (sd.funnel(p, m), sd.draw(p, m, rng)):
            assert 0 <= f["reached_care_with_loss"] <= f["referred_with_loss"] <= f["with_loss"] <= f["screened"] <= f["children"]
            assert f["missed_by_screen"] == pytest.approx(f["with_loss"] - f["referred_with_loss"])
    if over.get("prevalence") == 0.0:
        assert sd.funnel(p, "school_camp")["with_loss"] == 0
    if over.get("children") == 0:
        assert sd.draw(p, "sms_only", rng)["screened"] == 0


def test_monte_carlo_is_paired_and_bounded():
    mc = sd.monte_carlo(sd.params(), seed=3, mc=dict(sd.v("monte_carlo"), runs=200))
    for k in ("sms_only", "school_camp", "camp_minus_sms"):
        assert mc[k]["p5"] <= mc[k]["median"] <= mc[k]["p95"]
    assert mc["camp_minus_sms"]["p5"] > 0


def test_every_output_says_simulated():
    r = sd.run()
    assert sd.markdown(r).count("SIMULATED") >= 4
    assert "SIMULATED" in sd.svg(r).split("</text>")[0]  # chart title
    assert sd.spread([]) == {"median": None, "p5": None, "p95": None}
