"""Analyse Phase 1 spike exports (docs/SPIKE.md §5). SPIKE DATA: relative mic metering, not a hearing measurement.

    python scripts/analyze_spike.py data/raw/spike/*.json      (prints Markdown tables)

Rules applied, all from config/screening.json noise.*:
- one clip = one mic start..stop session, labelled by its samples' label;
- a label with a `-redo` twin is dropped; the redo clip is reported under the base label;
- samples are invalid if metering is missing or <= invalid_at_or_below_db (the -160 floor), or fall within
  mic_settle_ms of mic start; samples >= saturated_at_or_above_db are valid but saturated (= loud);
- each tone clip's label (quiet-on-1kL-0.10) is checked against the logged `tone play` event and the samples' tone field.
"""
import json
import re
import statistics
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NOISE = json.loads((ROOT / "config" / "screening.json").read_text())["noise"]
SETTLE_MS = NOISE["mic_settle_ms"]["value"]
FLOOR = NOISE["invalid_at_or_below_db"]["value"]
CEIL = NOISE["saturated_at_or_above_db"]["value"]
GATE = NOISE["gate_db_above_baseline"]["value"]
WINDOW_MS = json.loads((ROOT / "config" / "screening.json").read_text())["tone"]["duration_ms"]["value"]
PLAY = re.compile(r"tone play (\dk [LR]) vol=([\d.]+)")
LABEL = re.compile(r"quiet-on-(\dk)([LR])-([\d.]+)")


def clips(export):
    """Split an export into mic sessions: [{label, start, stop, samples, plays}]."""
    out, cur = [], None
    for e in export["events"]:
        if e["event"] == "mic start":
            cur = {"start": e["t"], "stop": None, "plays": []}
        elif e["event"] == "mic stop" and cur:
            cur["stop"] = e["t"]
            out.append(cur)
            cur = None
    plays = [(e["t"], *PLAY.match(e["event"]).groups()) for e in export["events"] if PLAY.match(e["event"])]
    for c in out:
        c["samples"] = [s for s in export["samples"] if c["start"] <= s["t"] <= c["stop"] + 200]
        labels = {s["label"] for s in c["samples"]}
        assert len(labels) == 1, f"session at {c['start']} mixes labels {labels}"
        c["label"] = labels.pop()
        prev = out[out.index(c) - 1]["stop"] if out.index(c) else 0
        # a tone may be started just before the mic (seen in the data), so look back to the previous session
        c["plays"] = [(tone, float(vol)) for t, tone, vol in plays if prev < t <= c["stop"]]
    return out


def apply_redo(cs):
    redone = {c["label"][: -len("-redo")] for c in cs if c["label"].endswith("-redo")}
    kept = [c for c in cs if c["label"] not in redone]
    dropped = [c["label"] for c in cs if c["label"] in redone]
    return kept, dropped


def classify(c):
    """(valid values, n_floor, n_settle, n_saturated) for one clip."""
    vals, floor, settle = [], 0, 0
    for s in c["samples"]:
        m = s["metering"]
        if m is None or m <= FLOOR:
            floor += 1
        elif s["t"] - c["start"] < SETTLE_MS:
            settle += 1
        else:
            vals.append((s["t"], m, s["tone"]))
    return vals, floor, settle, sum(m >= CEIL for _, m, _ in vals)


def label_check(c):
    """Problems with a tone clip's label vs what the log says played; [] if it matches or is not a tone clip."""
    m = LABEL.fullmatch(c["label"].removesuffix("-redo"))
    if not m:
        return [f"logged tone play {p} in a no-tone clip" for p in c["plays"]]
    want = (f"{m[1]} {m[2]}", float(m[3]))
    issues = []
    if c["plays"] != [want]:
        issues.append(f"label says {want[0]} vol={want[1]:.2f}, log says {c['plays'] or 'no tone'}")
    seen = {s["tone"] for s in c["samples"]} - {None}
    if seen != {want[0]}:
        issues.append(f"sample tone field {sorted(seen)}")
    return issues


def q(v, p):
    v = sorted(v)
    return v[min(len(v) - 1, int(p * len(v)))]


def gated_windows(vals, baseline):
    """Share of consecutive tone-length windows a during-tone gate would reject (max > baseline + GATE or saturated)."""
    if not vals:
        return 0, 0
    t0, wins = vals[0][0], {}
    for t, m, _ in vals:
        wins.setdefault((t - t0) // WINDOW_MS, []).append(m)
    full = [w for w in wins.values() if len(w) >= 5]
    return sum(max(w) > baseline + GATE or max(w) >= CEIL for w in full), len(full)


def startup_profile(cs):
    """Median metering and mean ms-since-mic-start of the n-th sample across all clips (shows the start-up hump)."""
    rows = ["| Sample # | Mean ms after mic start | Median metering | Clips at floor |", "|---|---|---|---|"]
    for i in range(10):
        ss = [c["samples"][i] for c in cs if len(c["samples"]) > i]
        ms = [s["t"] - c["start"] for c, s in zip(cs, ss)]
        rows.append(f"| {i} | {statistics.mean(ms):.0f} | {statistics.median(s['metering'] for s in ss):.1f} | "
                    f"{sum(s['metering'] <= FLOOR for s in ss)}/{len(ss)} |")
    return rows


def report(paths):
    lines = ["SPIKE DATA, one phone, one earphone, one tester. Metering is relative (dB re: mic full scale, uncalibrated).", ""]
    every = []
    for path in paths:
        export = json.loads(Path(path).read_text())
        cs = clips(export)
        every += cs
        kept, dropped = apply_redo(cs)
        lines += [f"### {Path(path).name}", "", f"Device: {export['device']}. Dropped (superseded by -redo): {dropped or 'none'}.", ""]
        mism = [(c["label"], label_check(c)) for c in cs]
        for lab, iss in mism:
            for i in iss:
                lines.append(f"- Label check `{lab}`{' (dropped)' if lab in dropped else ''}: {i}")
        baseline_clip = next((c for c in kept if c["label"] in ("quiet-off", "quiet-baseline")), None)
        base = statistics.median(m for _, m, _ in classify(baseline_clip)[0]) if baseline_clip else None
        lines += ["", f"Baseline = median of `{baseline_clip['label']}` = {base:.1f}" if base is not None else "", "",
                  "| Clip | Tone played (log) | Floor | Settle | Valid | Saturated | Median tone-on | Median tone-off | "
                  "Tone-on minus baseline | p10 / p90 | Windows gated |",
                  "|---|---|---|---|---|---|---|---|---|---|---|"]
        for c in kept:
            vals, floor, settle, sat = classify(c)
            on = [m for _, m, tone in vals if tone]
            off = [m for _, m, tone in vals if not tone]
            allv = [m for _, m, _ in vals]
            g, n = gated_windows(vals, base)
            med_on = f"{statistics.median(on):.1f}" if on else "-"
            med_off = f"{statistics.median(off):.1f} (n={len(off)})" if off else "-"
            diff = f"{statistics.median(on) - base:+.1f}" if on else "-"
            plays = ", ".join(f"{t} {v:.2f}" for t, v in c["plays"]) or "none"
            lines.append(f"| {c['label']} | {plays} | {floor} | {settle} | {len(vals)} | {sat} | {med_on} | {med_off} | "
                         f"{diff} | {q(allv, .1):.1f} / {q(allv, .9):.1f} | {g}/{n} |")
        lines.append("")
    lines += [f"### Mic start-up, all {len(every)} clips", ""] + startup_profile(every)
    return "\n".join(lines)


if __name__ == "__main__":
    print(report(sys.argv[1:]))
