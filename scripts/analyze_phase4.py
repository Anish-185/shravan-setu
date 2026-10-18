"""Summarise Phase 4 device-trial session exports. TRIAL DATA at an uncalibrated volume: not hearing measurements.

    python scripts/analyze_phase4.py data/raw/phase4/*.json      (prints a Markdown table)

Per session: outcome, room noise (re: reference), in-app duration (first to last engine event), reliability counts,
tones replayed because of during-tone noise, and tap times after tone onset. Tap times are measured from the JS
`play()` call, so they include any audio output latency as well as the tester's reaction time.
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
        "tap_ms": (min(taps), round(statistics.median(taps)), max(taps)) if taps else None,
    }


def main(paths):
    print("| File | Outcome | Room noise | Duration (s) | Catch taps | Out of window | Noise replays | Tap ms min / median / max |")
    print("|---|---|---|---|---|---|---|---|")
    for p in sorted(paths):
        s = summary(json.loads(Path(p).read_text()))
        tap = " / ".join(map(str, s["tap_ms"])) if s["tap_ms"] else "-"
        print(f'| {Path(p).name} | {s["outcome"]} | {s["ambient"]:+} | {s["duration_s"]} | {s["catch"]} | '
              f'{s["out_of_window"]} | {s["noise_replays"]} | {tap} |')


if __name__ == "__main__":
    main(sys.argv[1:])
