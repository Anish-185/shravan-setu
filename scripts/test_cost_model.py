import math

import pytest

import cost_model as cm


def test_planning_guideline_matches_the_documented_derivation():
    p = cm.params()
    rows = {r["students_per_phone"]: r for r in cm.run()["planning"]}
    assert rows[250]["children_per_phone_per_day"] == 12  # 60 min / 5 min
    assert [round(rows[n]["days"]) for n in (250, 400, 1000)] == [21, 33, 83]
    assert cm.throughput(p, 1000, 250)["phones"] == 4 and cm.throughput(p, 251, 250)["phones"] == 2


def test_scenario_costs():
    p = cm.params()
    a = cm.scenario_cost(p, "A_school_phone", 1000, 250)
    assert a["kits"] == 4 and a["upfront_inr"] == 4 * 10400
    assert a["equipment_per_year_inr"] == pytest.approx(4 * (10000 / 3 + 400))
    assert a["per_child_per_year_inr"] == pytest.approx(a["equipment_per_year_inr"] / 1000)
    b = cm.scenario_cost(p, "B_teacher_phone", 1000, 250)
    assert b["upfront_inr"] == 1600 and b["equipment_per_year_inr"] == 1600
    c = cm.scenario_cost(p, "C_kit_per_class_teacher", 1000, 250)
    assert c["kits"] == math.ceil(1000 / 40) and c["upfront_inr"] == 25 * 400
    assert b["equipment_per_year_inr"] < c["equipment_per_year_inr"] < a["equipment_per_year_inr"]
    for x in (a, b, c):
        assert x["software_inr"] == 0 and x["teacher_minutes"] == 5000 and x["teacher_cost_inr"] is None


def test_optional_and_edge_inputs():
    p = cm.params(teacher_cost_inr_per_hour=120, future_sms_cost_inr_per_message=0.5)
    assert cm.scenario_cost(p, "A_school_phone", 250, 250)["teacher_cost_inr"] == pytest.approx(1250 / 60 * 120)
    assert cm.future_sms(p, 100) == 100 * 2 * 0.5
    assert cm.future_sms(cm.params(), 100) is None
    zero = cm.scenario_cost(cm.params(), "A_school_phone", 0, 250)
    assert zero["kits"] == 0 and zero["per_child_per_year_inr"] is None


def test_output_is_labelled_proposed_and_shows_software_zero():
    md = cm.markdown(cm.run())
    assert md.count("PROPOSED") >= 3 and "Not tested or measured in any school" in md
    assert "Software: **Rs 0**" in md
