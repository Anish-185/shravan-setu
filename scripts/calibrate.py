"""Team baseline and test-retest from biological-calibration exports (the app's Calibration screen).

    python scripts/calibrate.py data/raw/calibration/*.json

Prints, as Markdown: per-frequency team baseline (median of run-1 thresholds of all volunteers, both ears pooled, in
dB re the tone file's full scale at player volume 1.0), test-retest agreement (run 1 vs run 2, same volunteer, ear and
frequency), the within-run 1000 Hz repeat, and volunteers far from the median (review them: possible unknown hearing
problem or a fitting issue). Ends with the `calibration.baseline_dbfs` value to paste into config/screening.json.
Team volunteers (adults), not children; levels are dB re: team baseline, never dB HL.
"""
import json
import statistics
import sys
from collections import defaultdict
from pathlib import Path

FREQS = (500, 1000, 2000, 4000)
OUTLIER_DB = 15  # PLACEHOLDER: flag a volunteer threshold this far from the frequency's median


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
    baseline, n = {}, {}
    for f in FREQS:
        xs = [x for vol in runs.values() if 1 in vol for (e, ff), x in vol[1].items() if ff == f and x is not None]
        baseline[f] = statistics.median(xs) if xs else None
        n[f] = len(xs)
    diffs = [r2[k] - r1[k] for vol in runs.values() if 1 in vol and 2 in vol
             for r1, r2 in [(vol[1], vol[2])] for k in r1 if r1[k] is not None and r2.get(k) is not None]
    outliers = [f"{who} {e} {f} Hz: {x} vs median {baseline[f]}" for who, vol in runs.items() if 1 in vol
                for (e, f), x in vol[1].items() if x is not None and baseline[f] is not None and abs(x - baseline[f]) > OUTLIER_DB]
    return {"volunteers": sorted(runs), "baseline": baseline, "n": n, "retest": stats(diffs),
            "repeat_1000": stats(repeats), "outliers": outliers, "skipped": skipped}


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
    if r["outliers"]:
        lines += ["", f"Review (more than {OUTLIER_DB} dB from the median):", *[f"- {o}" for o in r["outliers"]]]
    if r["skipped"]:
        lines += ["", "No threshold (not used):", *[f"- {x}" for x in r["skipped"]]]
    cfg = {str(f): r["baseline"][f] for f in FREQS}
    lines += ["", "Paste into config/screening.json `calibration.baseline_dbfs.value` (and record the source):", "",
              f"    {json.dumps(cfg)}"]
    return "\n".join(lines) + "\n"


if __name__ == "__main__":
    print(markdown(analyse([json.loads(Path(p).read_text()) for p in sys.argv[1:]])))
