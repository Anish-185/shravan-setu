"""Summarise Phase 4 device-trial session exports. TRIAL DATA at an uncalibrated volume: not hearing measurements.

    python scripts/analyze_phase4.py data/raw/phase4/*.json      (prints a Markdown table)

Per session: outcome, room noise (re: reference), in-app duration (first to last engine event), reliability counts,
tones replayed because of during-tone noise, and tap times after tone onset. Tap times are measured from the JS
`play()` call (config response.timing_origin = play_call), so they include any audio start delay as well as the
tester's reaction time. Sessions from Phase 5 on also log `play_latency_ms` per tone: player-reported playback start
minus the play() call (ERR-026), and the tap time measured from that playback start instead (what
timing_origin = playback_start would use); "-" for older sessions.
"""
import json
import statistics
import sys
from pathlib import Path


def summary(d):
    r = d["result"]
    rel = r["reliability"]
    taps = [t["response_ms"] for t in d["trials"] if t["kind"] == "tone" and t["responded"]]
    return {
        "outcome": r["outcome"],
        "ambient": round(d["ambient_db_re_reference"], 1),
        "duration_s": round((d["events"][-1]["t"] - d["events"][0]["t"]) / 1000),
        "catch": f'{rel["false_alarms"]}/{rel["catch_trials"]}',
        "out_of_window": f'{rel["out_of_window"]}/{rel["tone_trials"]}',
        "noise_replays": len(d["noise_events"]),
        "tap_ms": spread(taps),
        "latency_ms": spread([t["play_latency_ms"] for t in d["trials"] if t.get("play_latency_ms") is not None]),
        "tap_from_start_ms": spread([t["response_ms"] - t["play_latency_ms"] for t in d["trials"]
                                     if t["kind"] == "tone" and t["responded"] and t.get("play_latency_ms") is not None]),
    }


def spread(xs):
    return (min(xs), round(statistics.median(xs)), max(xs)) if xs else None


def main(paths):
    print("| File | Outcome | Room noise | Duration (s) | Catch taps | Out of window | Noise replays "
          "| Tap ms min / median / max | Play latency ms min / median / max | Tap from playback start ms min / median / max |")
    print("|---|---|---|---|---|---|---|---|---|---|")
    for p in sorted(paths):
        s = summary(json.loads(Path(p).read_text()))
        tap, lat, start = (" / ".join(map(str, s[k])) if s[k] else "-" for k in ("tap_ms", "latency_ms", "tap_from_start_ms"))
        print(f'| {Path(p).name} | {s["outcome"]} | {s["ambient"]:+} | {s["duration_s"]} | {s["catch"]} | '
              f'{s["out_of_window"]} | {s["noise_replays"]} | {tap} | {lat} | {start} |')


if __name__ == "__main__":
    main(sys.argv[1:])
