import math
import random

import eval_nhanes as e

FREQS = e.FREQS


def audiogram(default=0, **over):
    """Thresholds for both ears; over: e.g. left_4000=40."""
    th = {(ear, f): default for ear in ("left", "right") for f in FREQS}
    for k, x in over.items():
        ear, f = k.split("_")
        th[(ear, int(f))] = x
    return th


def test_truth_definitions_follow_who_table():
    assert e.truth(audiogram(0)) == {"who_better_ear": False, "who_any_grade": False, "worse_ear_20": False}
    # both ears PTA4 = 20 -> WHO mild (20 to < 35) in the better ear
    assert e.truth(audiogram(20))["who_better_ear"] is True
    # WHO unilateral: better < 20, worse >= 35
    uni = audiogram(0, left_500=35, left_1000=35, left_2000=35, left_4000=35)
    assert e.truth(uni) == {"who_better_ear": False, "who_any_grade": True, "worse_ear_20": True}
    # one-sided PTA4 20..34: only our per-ear assumption counts it
    mild = audiogram(0, right_500=20, right_1000=20, right_2000=20, right_4000=20)
    assert e.truth(mild) == {"who_better_ear": False, "who_any_grade": False, "worse_ear_20": True}


def test_ideal_screen_uses_20_db_hl_at_1_2_4_khz():
    assert e.screen(audiogram(0), include500=False) == "PASS"
    assert e.screen(audiogram(0, left_4000=20), include500=False) == "PASS"  # threshold at the level = heard
    assert e.screen(audiogram(0, left_4000=25), include500=False) == "REFER"
    assert e.screen(audiogram(0, right_500=40), include500=False) == "PASS"  # 500 Hz not tested
    assert e.screen(audiogram(0, right_500=40), include500=True) == "REFER"
    assert e.screen(audiogram(0, left_1000=e.NOT_HEARD), include500=False) == "REFER"  # NHANES 666 = no response


def test_guessing_on_every_trial_gives_retest_never_refer():
    rng = random.Random(1)
    deaf = audiogram(e.NOT_HEARD)
    assert e.screen(deaf, False, rng, guess=1.0) == "RETEST"
    assert e.screen(deaf, False, rng, guess=0.0) == "REFER"


def test_detect_prob_shape():
    assert e.detect_prob(20, e.NOT_HEARD) == 0
    assert math.isclose(e.detect_prob(20, 20), (1 - e.LAPSE) / 2)
    assert e.detect_prob(40, 0) > 0.97 and e.detect_prob(0, 40) < 0.001
    assert e.detect_prob(20, 10) > e.detect_prob(20, 15) > e.detect_prob(20, 25)


def test_wilson_interval():
    lo, hi = e.wilson(50, 100)
    assert round(lo, 3) == 0.404 and round(hi, 3) == 0.596  # standard textbook value
    assert e.wilson(0, 0) == (None, None)
    lo, hi = e.wilson(10, 10)
    assert hi == 1.0 and 0.69 < lo < 0.73


def test_tally_counts_refer_as_positive_screen():
    kids = [{"truth": {"k": True}}, {"truth": {"k": True}}, {"truth": {"k": False}}, {"truth": {"k": False}}]
    t = e.tally(kids, ["REFER", "PASS", "RETEST", "REFER"], "k")
    assert (t["n_pos"], t["n_neg"]) == (2, 2)
    assert t["sensitivity"] == 0.5 and t["specificity"] == 0.5
    assert t["pos_passed"] == 0.5 and t["retest_rate"] == 0.25


def test_evaluate_is_deterministic_on_synthetic_children():
    kids = [{"cycle": "2017-18", "age": 8, "th": audiogram(0)},
            {"cycle": "2017-18", "age": 14, "th": audiogram(0, left_2000=50, left_4000=60, left_1000=40, left_500=40)}]
    a = e.evaluate([dict(k) for k in kids], excluded=1)
    b = e.evaluate([dict(k) for k in kids], excluded=1)
    assert a == b
    assert a["n"] == 2 and a["excluded"] == 1 and a["ages"] == {"6-11": 1, "12-18": 1}
    assert a["ideal"]["no_500"]["who_any_grade"]["sensitivity"] == 1.0
    assert "SIMULATED" in e.markdown(a)


def test_checksums_are_pinned_for_every_file():
    assert len(e.FILES) == 8
    assert all(len(sha) == 64 and int(sha, 16) >= 0 for _, sha in e.FILES.values())
