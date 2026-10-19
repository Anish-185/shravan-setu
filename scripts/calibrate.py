"""Team baseline and test-retest from biological-calibration exports (the app's Calibration screen).

    python scripts/calibrate.py data/raw/calibration/*.json

Prints, as Markdown: per-frequency team baseline (median of run-1 thresholds of all volunteers, both ears pooled, in
dB re the tone file's full scale at player volume 1.0), test-retest agreement (run 1 vs run 2, same volunteer, ear and
frequency), the within-run 1000 Hz repeat, and the outlier rule (config calibration.outlier_*): a volunteer with at
least `outlier_min_points` run-1 thresholds more than `outlier_db_above_group` dB above the median of the OTHER
volunteers at that frequency is excluded from the baseline, with the reason (docs/TEAM_TEST_PROTOCOL.md says what the
tester tells them). Much lower than the group is only flagged for review. Ends with the `calibration.baseline_dbfs`
value to paste into config/screening.json.
Team volunteers (adults), not children; levels are dB re: team baseline, never dB HL.
"""
import json
import statistics
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CAL = json.loads((ROOT / "config" / "screening.json").read_text())["calibration"]
FREQS = (500, 1000, 2000, 4000)
OUTLIER_DB = CAL["outlier_db_above_group"]["value"]
OUTLIER_POINTS = CAL["outlier_min_points"]["value"]
STEP_UP = CAL["step_up_db"]["value"]
PROVISIONAL = CAL["provisional"]["value"]


def thresholds(d):
    """{(ear, freq): first threshold}, plus the within-run 1000 Hz repeat {ear: (first, repeat)}."""
    first, repeat = {}, {}
    for r in d["results"]:
        key = (r["ear"], r["freq"])
        value = r["threshold_db"] if r["result"] == "threshold" else None
        if key in first:
            repeat[r["ear"]] = (first[key], value)
        else:
            first[key] = value
    return first, repeat


def analyse(files):
    runs = defaultdict(dict)  # volunteer -> run -> thresholds
    repeats, skipped = [], []
    for d in files:
        th, rep = thresholds(d)
        runs[d["volunteer"]][d["run"]] = th
        repeats += [b - a for a, b in rep.values() if a is not None and b is not None]
        skipped += [f'{d["volunteer"]} run {d["run"]} {e} {f} Hz: {r["result"]}'
                    for r in d["results"] for e, f in [(r["ear"], r["freq"])] if r["result"] != "threshold"]
    run1 = {who: vol[1] for who, vol in runs.items() if 1 in vol}

    def values(f, who_list):
        return [x for who in who_list for (e, ff), x in run1[who].items() if ff == f and x is not None]

    excluded, review = {}, []
    for who, th in run1.items():
        others = [o for o in run1 if o != who]
        high = []
        for (e, f), x in sorted(th.items()):
            ref = values(f, others)
            if x is None or len(others) < 2 or not ref:  # too few other volunteers to judge
                continue
            med = statistics.median(ref)
            if x - med > OUTLIER_DB:
                high.append(f"{e} {f} Hz: {x} vs others' median {med}")
            elif med - x > OUTLIER_DB:
                review.append(f"{who} {e} {f} Hz: {x}, much lower than others' median {med} (check fitting/tapping)")
        if len(high) >= OUTLIER_POINTS:
            excluded[who] = high
    kept = [w for w in run1 if w not in excluded]
    baseline, n, flat = {}, {}, []
    for f in FREQS:
        xs = values(f, kept)
        baseline[f] = statistics.median(xs) if xs else None
        n[f] = len(xs)
        if len(kept) >= 3 and xs and max(xs) - min(xs) <= STEP_UP:  # no spread between people: suspect the device
            flat.append(f)
    diffs = [r2[k] - r1[k] for vol in runs.values() if 1 in vol and 2 in vol
             for r1, r2 in [(vol[1], vol[2])] for k in r1 if r1[k] is not None and r2.get(k) is not None]
    return {"volunteers": sorted(runs), "baseline": baseline, "n": n, "retest": stats(diffs),
            "repeat_1000": stats(repeats), "excluded": excluded, "review": review, "skipped": skipped,
            "can_judge": len(run1) >= 3, "flat": flat}


def stats(diffs):
    if not diffs:
        return None
    return {"pairs": len(diffs), "mean_abs_db": statistics.mean(abs(x) for x in diffs),
            "within_5_db": sum(abs(x) <= 5 for x in diffs) / len(diffs), "mean_db": statistics.mean(diffs)}


def markdown(r):
    lines = ["### Biological calibration (team volunteers, not children)", "",
             f"Volunteers: {', '.join(r['volunteers']) or 'none'}. Levels: dB re tone full scale at player volume 1.0.", "",
             "| Frequency | Team baseline (median, run 1, both ears) | Ears |", "|---|---|---|"]
    lines += [f"| {f} Hz | {'-' if r['baseline'][f] is None else r['baseline'][f]} | {r['n'][f]} |" for f in FREQS]
    for name, key in (("Test-retest (run 2 minus run 1)", "retest"), ("Within-run 1000 Hz repeat", "repeat_1000")):
        s = r[key]
        lines.append("" if s is None else f"\n{name}: {s['pairs']} pairs, mean absolute difference {s['mean_abs_db']:.1f} dB, "
                     f"{s['within_5_db']:.0%} within 5 dB, mean shift {s['mean_db']:+.1f} dB.")
    if not r["can_judge"]:
        lines += ["", "Outlier rule not applied: fewer than 3 volunteers with run 1."]
    if r["excluded"]:
        lines += ["", f"Excluded from the baseline ({OUTLIER_POINTS}+ thresholds more than {OUTLIER_DB} dB above the other "
                  "volunteers' median). Tester: tell them privately, using the wording in docs/TEAM_TEST_PROTOCOL.md, "
                  "and record the reason in the CSV notes:"]
        lines += [f"- {who}: " + "; ".join(why) for who, why in sorted(r["excluded"].items())]
    if r["review"]:
        lines += ["", "Review (not excluded):", *[f"- {x}" for x in r["review"]]]
    if r["skipped"]:
        lines += ["", "No threshold (not used):", *[f"- {x}" for x in r["skipped"]]]
    if r["flat"]:
        lines += ["", f"WARNING: no spread at {', '.join(f'{f} Hz' for f in r['flat'])}: every threshold within {STEP_UP} dB. "
                  "Real thresholds differ between people, so this is probably the phone's playback floor, not hearing "
                  "(docs/ERROR_LOG.md ERR-044). Confirm before pasting the baseline."]
    cfg = {str(f): r["baseline"][f] for f in FREQS}
    if PROVISIONAL:
        lines += ["", f"Config now: PROVISIONAL baseline {json.dumps(CAL['baseline_dbfs']['value'])} "
                  "(`calibration.provisional`, ERR-044). 1-4 kHz values are upper bounds limited by the phone's playback "
                  "floor, so those tones may be louder than intended and the screen may miss milder loss until the "
                  "Stage 2 recalibration (docs/ROADMAP.md)."]
    lines += ["", "Paste into config/screening.json `calibration.baseline_dbfs.value` (and record the source):", "",
              f"    {json.dumps(cfg)}", "",
              "Then set `screening_level_db_re_team_baseline.value` to 20 (owner decision 2026-10-19). With both set, the "
              "app plays calibrated levels and the UNCALIBRATED note disappears."]
    return "\n".join(lines) + "\n"


if __name__ == "__main__":
    print(markdown(analyse([json.loads(Path(p).read_text()) for p in sys.argv[1:]])))
