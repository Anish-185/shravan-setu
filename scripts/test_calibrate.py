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


def test_outliers_and_missing_thresholds_are_reported_not_used():
    files = [export("V1", 1, BASE), export("V2", 1, BASE), export("V3", 1, {**BASE, 2000: -40}, missing={("left", 500)})]
    r = c.analyse(files)
    assert r["baseline"][2000] == -70 and any("V3" in o and "2000" in o for o in r["outliers"])
    assert r["n"][500] == 5 and any("V3 run 1 left 500" in s for s in r["skipped"])
    assert '"1000": -70' in c.markdown(r)


def test_no_files():
    r = c.analyse([])
    assert r["baseline"] == {f: None for f in c.FREQS} and r["retest"] is None
    assert "none" in c.markdown(r)
