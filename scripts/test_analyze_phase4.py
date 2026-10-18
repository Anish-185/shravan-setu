import analyze_phase4 as a


def test_summary_counts_only_tone_taps():
    d = {
        "result": {"outcome": "RETEST", "reliability": {"false_alarms": 1, "catch_trials": 2, "out_of_window": 1, "tone_trials": 3}},
        "ambient_db_re_reference": -7.66,
        "events": [{"t": 1000, "event": "start"}, {"t": 61_400, "event": "done"}],
        "noise_events": [{"round": 1, "ear": "left", "freq": 500}],
        "trials": [
            {"kind": "tone", "responded": True, "response_ms": 1500, "play_latency_ms": 120},
            {"kind": "tone", "responded": True, "response_ms": 2900},
            {"kind": "tone", "responded": False, "response_ms": None},
            {"kind": "catch", "responded": True, "response_ms": 40},  # a catch tap is not a tone tap
        ],
    }
    s = a.summary(d)
    assert s["ambient"] == -7.7 and s["duration_s"] == 60 and s["noise_replays"] == 1
    assert s["catch"] == "1/2" and s["out_of_window"] == "1/3"
    assert s["tap_ms"] == (1500, 2200, 2900)
    assert s["latency_ms"] == (120, 120, 120)  # trials without the field (older sessions) are skipped
