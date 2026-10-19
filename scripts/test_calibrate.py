import calibrate as c


def export(vol, run, th, repeat=None, missing=()):
    """A calibration export like the app's: 1000 Hz first and repeated at the end of each ear."""
    res = []
    for ear in ("left", "right"):
        for f in (1000, 2000, 4000, 500, 1000):
            if f == 1000 and any(r["ear"] == ear and r["freq"] == 1000 for r in res):
                x = th[f] if repeat is None else repeat
            else:
                x = th[f]
            ok = (ear, f) not in missing
            res.append({"ear": ear, "freq": f, "threshold_db": x if ok else None,
                        "result": "threshold" if ok else "no_response_at_max", "presentations": []})
    return {"volunteer": vol, "run": run, "results": res}


BASE = {500: -60, 1000: -70, 2000: -70, 4000: -65}


def test_baseline_is_median_of_run1_both_ears():
    files = [export("V1", 1, BASE), export("V2", 1, {k: x - 10 for k, x in BASE.items()}),
             export("V3", 1, {k: x + 10 for k, x in BASE.items()}), export("V1", 2, {k: x + 50 for k, x in BASE.items()})]
    r = c.analyse(files)
    assert r["baseline"] == BASE  # run 2 is not used for the baseline
    assert r["n"][1000] == 6
    assert r["volunteers"] == ["V1", "V2", "V3"]


def test_retest_and_repeat_statistics():
    r = c.analyse([export("V1", 1, BASE, repeat=-65), export("V1", 2, {**BASE, 4000: -55})])
    t = r["retest"]
    # 8 pairs (2 ears x 4 frequencies); 4000 Hz moved +10 in both ears
    assert t["pairs"] == 8 and t["within_5_db"] == 0.75 and t["mean_abs_db"] == 2.5
    assert r["repeat_1000"]["pairs"] == 4 and r["repeat_1000"]["mean_db"] == 2.5  # run 1: +5 in both ears; run 2: 0


def test_outlier_rule_excludes_clearly_higher_volunteers_from_the_baseline():
    hi = c.OUTLIER_DB + 5
    files = [export("V1", 1, BASE), export("V2", 1, BASE), export("V3", 1, {k: x + 5 for k, x in BASE.items()}),
             # V4: clearly higher at 2 frequencies (= 4 points, both ears) -> excluded
             export("V4", 1, {**BASE, 2000: BASE[2000] + hi, 4000: BASE[4000] + hi}),
             # V5: one stray high point only (one ear one frequency) -> kept
             export("V5", 1, BASE, missing={("left", 500)})]
    files[4]["results"][2]["threshold_db"] = BASE[4000] + hi  # left 4000
    r = c.analyse(files)
    assert set(r["excluded"]) == {"V4"} and len(r["excluded"]["V4"]) == 4
    assert r["baseline"][2000] == BASE[2000]  # V4 not in the baseline
    assert r["n"][2000] == 8  # V1, V2, V3, V5 x 2 ears
    md = c.markdown(r)
    assert "Excluded from the baseline" in md and "V4:" in md and "docs/TEAM_TEST_PROTOCOL.md" in md
    assert any("V5 run 1 left 500" in x for x in r["skipped"])


def test_much_lower_is_flagged_not_excluded_and_small_groups_are_not_judged():
    files = [export("V1", 1, BASE), export("V2", 1, BASE), export("V3", 1, {**BASE, 1000: BASE[1000] - 30})]
    r = c.analyse(files)
    assert r["excluded"] == {} and any("V3" in x and "much lower" in x for x in r["review"])
    two = c.analyse([export("V1", 1, BASE), export("V2", 1, {k: x + 40 for k, x in BASE.items()})])
    assert two["excluded"] == {} and not two["can_judge"]
    assert "Outlier rule not applied" in c.markdown(two)


def test_no_files():
    r = c.analyse([])
    assert r["baseline"] == {f: None for f in c.FREQS} and r["retest"] is None
    assert "none" in c.markdown(r)


def test_no_spread_between_people_is_flagged_as_a_possible_playback_floor():
    spread = c.analyse([export("V1", 1, BASE), export("V2", 1, {k: x - 10 for k, x in BASE.items()}),
                        export("V3", 1, {k: x + 10 for k, x in BASE.items()})])
    assert spread["flat"] == [] and "WARNING" not in c.markdown(spread)
    same = c.analyse([export(v, 1, {**BASE, 500: BASE[500] + d}) for v, d in (("V1", 0), ("V2", -10), ("V3", 10))])
    assert same["flat"] == [1000, 2000, 4000] and "no spread at 1000 Hz, 2000 Hz, 4000 Hz" in c.markdown(same)


def test_provisional_config_is_labelled(monkeypatch):
    monkeypatch.setattr(c, "PROVISIONAL", True)
    assert "PROVISIONAL baseline" in c.markdown(c.analyse([]))
    monkeypatch.setattr(c, "PROVISIONAL", False)
    assert "PROVISIONAL" not in c.markdown(c.analyse([]))
