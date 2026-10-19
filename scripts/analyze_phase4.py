"""Summarise Phase 4 device-trial session exports. TRIAL DATA at an uncalibrated volume: not hearing measurements.

    python scripts/analyze_phase4.py data/raw/phase4/*.json      (prints a Markdown table)

Per session: outcome, room noise (re: reference), in-app duration (first to last engine event), reliability counts,
tones replayed because of during-tone noise, presentations replayed because playback started late or was never
reported (ERR-026), and tap times. Sessions from Phase 5 on log `play_latency_ms`: player-reported playback start
minus the JS `play()` call (tones, and from Phase 6 also the silent catch clips). Tap times are shown both from the
play() call and from the playback start, whichever origin the session used (`timing_origin` in the export; sessions
without it used play_call), and how many starts exceed config response.max_play_latency_ms (those presentations
are replayed from Phase 6 on). "-" where a session has no latency data.
"""
import json
import statistics
import sys
from pathlib import Path

CONFIG = json.loads((Path(__file__).resolve().parents[1] / "config" / "screening.json").read_text())
LIMIT_MS = CONFIG["response"]["max_play_latency_ms"]["value"]


def summary(d):
    r = d["result"]
    rel = r["reliability"]
    taps = [t for t in d["trials"] if t["kind"] == "tone" and t["responded"]]
    timed = [t for t in taps if t.get("play_latency_ms") is not None]
    from_start = d.get("timing_origin", "play_call") == "playback_start"
    return {
        "outcome": r["outcome"],
        "ambient": round(d["ambient_db_re_reference"], 1),
        "duration_s": round((d["events"][-1]["t"] - d["events"][0]["t"]) / 1000),
        "catch": f'{rel["false_alarms"]}/{rel["catch_trials"]}',
        "out_of_window": f'{rel["out_of_window"]}/{rel["tone_trials"]}',
        "noise_replays": len(d["noise_events"]),
        "late_start_replays": sum("(late start" in e["event"] or "(no playback report)" in e["event"] for e in d["events"]),
        "tap_ms": spread([t["response_ms"] + (t["play_latency_ms"] if from_start else 0)
                          for t in (timed if from_start else taps)]),
        "latency_ms": spread(lat := [t["play_latency_ms"] for t in d["trials"] if t.get("play_latency_ms") is not None]),
        "over_limit": f"{sum(x > LIMIT_MS for x in lat)}/{len(lat)}" if lat else None,
        "tap_from_start_ms": spread([t["response_ms"] - (0 if from_start else t["play_latency_ms"]) for t in timed]),
    }


def spread(xs):
    return (min(xs), round(statistics.median(xs)), max(xs)) if xs else None


def main(paths):
    print("| File | Outcome | Room noise | Duration (s) | Catch taps | Out of window | Noise replays | Late-start replays "
          "| Tap from play() ms min / median / max | Play latency ms min / median / max "
          f"| Tap from playback start ms min / median / max | Starts over {LIMIT_MS} ms |")
    print("|---|---|---|---|---|---|---|---|---|---|---|---|")
    for p in sorted(paths):
        s = summary(json.loads(Path(p).read_text()))
        tap, lat, start = (" / ".join(map(str, s[k])) if s[k] else "-" for k in ("tap_ms", "latency_ms", "tap_from_start_ms"))
        print(f'| {Path(p).name} | {s["outcome"]} | {s["ambient"]:+} | {s["duration_s"]} | {s["catch"]} | '
              f'{s["out_of_window"]} | {s["noise_replays"]} | {s["late_start_replays"]} | {tap} | {lat} | {start} | {s["over_limit"] or "-"} |')


if __name__ == "__main__":
    main(sys.argv[1:])
